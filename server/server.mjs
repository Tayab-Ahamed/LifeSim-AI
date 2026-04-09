import { createServer } from "node:http";
import { URL } from "node:url";

const port = Number(process.env.API_PORT || 8787);

const clamp = (value, min, max) => Math.max(min, Math.min(max, Math.round(Number(value) || 0)));

const json = (res, status, body) => {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  });
  res.end(JSON.stringify(body));
};

const readJsonBody = (req) =>
  new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        reject(new Error("Request body too large."));
      }
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error("Invalid JSON body."));
      }
    });
    req.on("error", reject);
  });

const stripJsonFences = (input) =>
  String(input || "")
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

const parseJsonResponse = (text) => {
  const cleaned = stripJsonFences(text);
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  const candidate =
    firstBrace >= 0 && lastBrace >= firstBrace
      ? cleaned.slice(firstBrace, lastBrace + 1)
      : cleaned;
  return JSON.parse(candidate);
};

const getProviderKey = (config) => {
  if (config?.apiKey) return config.apiKey;
  if (config?.provider === "openai") return process.env.OPENAI_API_KEY || "";
  if (config?.provider === "gemini") return process.env.GEMINI_API_KEY || "";
  if (config?.provider === "qwen") return process.env.QWEN_API_KEY || "";
  return "";
};

const normalizeEffect = (effect = {}) => ({
  money: clamp(effect.money, -7000, 7000),
  debt: clamp(effect.debt, -6000, 6000),
  stress: clamp(effect.stress, -15, 15),
  happiness: clamp(effect.happiness, -15, 15),
  career: clamp(effect.career, -15, 15),
});

const normalizeScenario = (payload) => {
  const choices = Array.isArray(payload?.choices) ? payload.choices.slice(0, 3) : [];
  if (choices.length !== 3) {
    throw new Error("Scenario response must include exactly 3 choices.");
  }

  return {
    id: `ai-${Date.now()}`,
    title: String(payload?.title || "Life Decision"),
    scenario: String(payload?.scenario || "A financial choice is in front of you."),
    choices: choices.map((choice, index) => ({
      id: `ai-choice-${index + 1}`,
      text: String(choice?.text || `Choice ${index + 1}`),
      note: String(choice?.note || "AI-generated option."),
      effect: normalizeEffect(choice?.effect),
      source: "preset",
      reasoning: String(choice?.reasoning || ""),
    })),
  };
};

const normalizeResult = (payload) => ({
  title: String(payload?.title || "Emerging Professional"),
  summary: String(
    payload?.summary ||
      "Your choices created a distinct financial and emotional pattern over the five turns."
  ),
  financialState: String(
    payload?.financialState || payload?.financial_state || "Your finances are still evolving."
  ),
  personality: String(payload?.personality || "Adaptive Planner"),
  advice: String(payload?.advice || "Keep making intentional tradeoffs instead of reactive ones."),
  traitSummary: String(
    payload?.traitSummary ||
      payload?.trait_summary ||
      "Your choices reveal a recognizable pattern in how you trade growth, risk, and balance."
  ),
});

const normalizeCustomChoice = (payload, fallbackText) => {
  if (payload?.valid === false) {
    throw new Error(String(payload?.message || "That approach does not fit this scenario."));
  }

  return {
    id: `custom-${Date.now()}`,
    text: String(payload?.text || fallbackText),
    note: String(payload?.note || "AI interpreted your custom approach."),
    effect: normalizeEffect(payload?.effect),
    source: "custom",
    reasoning: String(payload?.reasoning || ""),
  };
};

const postJson = async (url, apiKey, body, headers = {}) => {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Provider request failed (${response.status}): ${text}`);
  }

  return text ? JSON.parse(text) : {};
};

const openAICompatibleRequest = async ({ baseUrl, apiKey, model, system, user }) => {
  const data = await postJson(`${baseUrl}/chat/completions`, apiKey, {
    model,
    temperature: 0.7,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: `${system}\nReturn valid JSON only.` },
      { role: "user", content: user },
    ],
  });

  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Provider returned no message content.");
  }

  return parseJsonResponse(content);
};

const geminiRequest = async ({ apiKey, model, system, user }) => {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const data = await postJson(
    endpoint,
    "",
    {
      systemInstruction: {
        parts: [{ text: `${system}\nReturn valid JSON only.` }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: user }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        responseMimeType: "application/json",
      },
    }
  );

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini returned no text content.");
  }

  return parseJsonResponse(text);
};

const callProvider = async ({ config, system, user }) => {
  const apiKey = getProviderKey(config);
  if (!apiKey) {
    throw new Error(`Missing API key for ${config.provider}.`);
  }

  if (config.provider === "openai") {
    return openAICompatibleRequest({
      baseUrl: "https://api.openai.com/v1",
      apiKey,
      model: config.model || "gpt-4.1-mini",
      system,
      user,
    });
  }

  if (config.provider === "qwen") {
    return openAICompatibleRequest({
      baseUrl:
        process.env.QWEN_BASE_URL ||
        "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
      apiKey,
      model: config.model || "qwen-plus",
      system,
      user,
    });
  }

  if (config.provider === "gemini") {
    return geminiRequest({
      apiKey,
      model: config.model || "gemini-2.5-flash",
      system,
      user,
    });
  }

  throw new Error(`Unsupported provider: ${config.provider}`);
};

const scenarioPrompt = ({ playerName, stats, turn, history, traits }) => ({
  system:
    "You are LifeSim AI, a financial life simulator. Generate one realistic, grounded life scenario with exactly 3 choices. Keep the effects modest, balanced, and plausible for a young adult navigating money and career decisions.",
  user: JSON.stringify(
    {
      task: "Generate the next scenario and 3 choices.",
      playerName,
      turn,
      stats,
      traits,
      recentHistory: history.slice(-3),
      format: {
        title: "string",
        scenario: "string",
        choices: [
          {
            text: "string",
            note: "string",
            reasoning: "string",
            effect: {
              money: "number between -7000 and 7000",
              debt: "number between -6000 and 6000",
              stress: "number between -15 and 15",
              happiness: "number between -15 and 15",
              career: "number between -15 and 15",
            },
          },
        ],
      },
      rules: [
        "Return exactly 3 choices.",
        "Make the scenario respond to the player's visible stats and hidden traits.",
        "Prefer realistic financial, career, family, housing, health, and lifestyle tradeoffs.",
        "Do not create impossible or magical outcomes.",
      ],
    },
    null,
    2
  ),
});

const resultPrompt = ({ playerName, stats, history, traits }) => ({
  system:
    "You are LifeSim AI, a financial life simulator. Interpret a completed 5-turn run and explain the player's likely future in a grounded, insightful way.",
  user: JSON.stringify(
    {
      task: "Generate the final life outcome.",
      playerName,
      stats,
      traits,
      history,
      format: {
        title: "string",
        summary: "string",
        financialState: "string",
        personality: "string",
        advice: "string",
        traitSummary: "string",
      },
      rules: [
        "Base the answer on both visible stats and hidden behavior traits.",
        "Keep the tone insightful, specific, and realistic.",
        "Do not mention that you are an AI model.",
      ],
    },
    null,
    2
  ),
});

const customChoicePrompt = ({
  customText,
  scenario,
  stats,
  turn,
  history,
  traits,
}) => ({
  system:
    "You are LifeSim AI. Interpret a player's free-text custom approach to a financial-life scenario. Convert the approach into a realistic, structured outcome. Reject impossible, cheating, or unrelated answers.",
  user: JSON.stringify(
    {
      task: "Interpret the player's custom approach.",
      turn,
      scenario,
      stats,
      traits,
      recentHistory: history.slice(-3),
      playerApproach: customText,
      format: {
        valid: "boolean",
        message: "string if invalid",
        text: "string",
        note: "string",
        reasoning: "string",
        effect: {
          money: "number between -7000 and 7000",
          debt: "number between -6000 and 6000",
          stress: "number between -15 and 15",
          happiness: "number between -15 and 15",
          career: "number between -15 and 15",
        },
      },
      rules: [
        "Treat the custom approach seriously and charitably.",
        "Allow hybrid answers like 'ask for sponsorship first, then self-fund'.",
        "Reject fantasy, cheating, or unrelated actions.",
        "Keep effects modest and realistic.",
      ],
    },
    null,
    2
  ),
});

const routes = {
  "/api/scenario": async (body) => {
    const payload = scenarioPrompt(body);
    const response = await callProvider({
      config: body.config,
      system: payload.system,
      user: payload.user,
    });
    return normalizeScenario(response);
  },
  "/api/result": async (body) => {
    const payload = resultPrompt(body);
    const response = await callProvider({
      config: body.config,
      system: payload.system,
      user: payload.user,
    });
    return normalizeResult(response);
  },
  "/api/custom-choice": async (body) => {
    const payload = customChoicePrompt(body);
    const response = await callProvider({
      config: body.config,
      system: payload.system,
      user: payload.user,
    });
    return normalizeCustomChoice(response, body.customText);
  },
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  if (req.method === "OPTIONS") {
    json(res, 204, {});
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/health") {
    json(res, 200, { ok: true });
    return;
  }

  if (req.method !== "POST" || !routes[url.pathname]) {
    json(res, 404, { error: "Not found." });
    return;
  }

  try {
    const body = await readJsonBody(req);
    const result = await routes[url.pathname](body);
    json(res, 200, result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unexpected server error.";
    const isTrustedError =
      msg.startsWith("Scenario response") ||
      msg.startsWith("Missing API key") ||
      msg.startsWith("That approach") ||
      msg.startsWith("Unsupported provider");
    const safeMsg = isTrustedError
      ? msg
      : "AI provider request failed. Check your API key and model name.";
    
    json(res, 400, { error: safeMsg });
  }
});

server.listen(port, () => {
  console.log(`LifeSim AI API listening on http://localhost:${port}`);
});
