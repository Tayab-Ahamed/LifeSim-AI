import React, { useState } from "react";
import { AIProvider, GameConfig, StartingStyle } from "../types/wealthcraft";

type StartScreenProps = {
  isLoading: boolean;
  error: string;
  onStart: (input: {
    nextPlayerName: string;
    nextStartingStyle: StartingStyle;
    nextConfig: GameConfig;
  }) => Promise<void>;
};

const defaultModels: Record<AIProvider, string> = {
  openai: "gpt-4.1-mini",
  gemini: "gemini-2.5-flash",
  qwen: "qwen-plus",
};

const StartScreen: React.FC<StartScreenProps> = ({
  isLoading,
  error,
  onStart,
}) => {
  const [playerName, setPlayerName] = useState("");
  const [startingStyle, setStartingStyle] = useState<StartingStyle>("balanced");
  const [mode, setMode] = useState<GameConfig["mode"]>("local");
  const [provider, setProvider] = useState<AIProvider>("openai");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState(defaultModels.openai);
  const [comparisonCount, setComparisonCount] =
    useState<GameConfig["comparisonCount"]>(0);

  const handleProviderChange = (nextProvider: AIProvider) => {
    setProvider(nextProvider);
    setModel(defaultModels[nextProvider]);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onStart({
      nextPlayerName: playerName,
      nextStartingStyle: startingStyle,
      nextConfig: {
        mode,
        provider,
        apiKey,
        model,
        comparisonCount,
      },
    });
  };

  return (
    <section className="hero-shell">
      <div className="hero-copy">
        <span className="hero-badge">Hackathon Build</span>
        <h1>LifeSim AI</h1>
        <p>
          A 5-turn financial life simulator where every decision changes your
          money, debt, stress, happiness, and career.
        </p>
        <p>
          Think of it like a money-life sandbox: real tradeoffs, visible stat
          changes, and a future outcome based on how you played.
        </p>
        <ul className="hero-list">
          <li>Rent hikes, layoffs, inflation, upskilling, and family pressure.</li>
          <li>Three choices every turn with small but meaningful consequences.</li>
          <li>A final result that tells you what kind of financial life you built.</li>
        </ul>
      </div>

      <form className="start-card" onSubmit={handleSubmit}>
        <span className="hero-badge hero-badge--soft">
          {mode === "local" ? "No API Key Needed" : "AI Understanding Enabled"}
        </span>
        <h2>Start a Run</h2>
        <p className="muted-copy">
          {mode === "local"
            ? "Local mode works instantly with the built-in simulator."
            : "AI mode uses a backend proxy so the model can understand the run and generate scenarios."}
        </p>

        <label htmlFor="playerName">Player name</label>
        <input
          id="playerName"
          name="playerName"
          type="text"
          maxLength={24}
          placeholder="Aarav, Maya, You..."
          value={playerName}
          onChange={(event) => setPlayerName(event.target.value)}
        />

        <label htmlFor="startingStyle">Starting style</label>
        <select
          id="startingStyle"
          name="startingStyle"
          value={startingStyle}
          onChange={(event) => setStartingStyle(event.target.value as StartingStyle)}
        >
          <option value="balanced">Balanced start</option>
          <option value="career">Career-first start</option>
          <option value="safety">Safety-first start</option>
        </select>

        <label htmlFor="mode">Engine mode</label>
        <select
          id="mode"
          name="mode"
          value={mode}
          onChange={(event) => setMode(event.target.value as GameConfig["mode"])}
        >
          <option value="local">Local rules engine</option>
          <option value="ai">AI-assisted understanding</option>
        </select>

        <label htmlFor="comparisonCount">Scenario comparison</label>
        <select
          id="comparisonCount"
          name="comparisonCount"
          value={comparisonCount}
          onChange={(event) =>
            setComparisonCount(
              Number(event.target.value) as GameConfig["comparisonCount"]
            )
          }
        >
          <option value={0}>Off</option>
          <option value={2}>2-person comparison</option>
          <option value={3}>3-person comparison</option>
          <option value={4}>4-person comparison</option>
        </select>

        {mode === "ai" && (
          <>
            <label htmlFor="provider">AI provider</label>
            <select
              id="provider"
              name="provider"
              value={provider}
              onChange={(event) => handleProviderChange(event.target.value as AIProvider)}
            >
              <option value="openai">OpenAI GPT</option>
              <option value="gemini">Google Gemini</option>
              <option value="qwen">Qwen</option>
            </select>

            <label htmlFor="model">Model</label>
            <input
              id="model"
              name="model"
              type="text"
              value={model}
              onChange={(event) => setModel(event.target.value)}
              placeholder={defaultModels[provider]}
            />

            <label htmlFor="apiKey">API key</label>
            <input
              id="apiKey"
              name="apiKey"
              type="password"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              placeholder="Paste your provider API key"
            />
          </>
        )}

        {error && <p className="error-copy">{error}</p>}

        <button className="primary-button" type="submit" disabled={isLoading}>
          {isLoading ? "Preparing run..." : "Play LifeSim AI"}
        </button>

        <p className="fine-print">
          Demo script: "Each choice affects your future. After 5 decisions,
          LifeSim AI predicts the life path you built."
        </p>
      </form>
    </section>
  );
};

export default StartScreen;
