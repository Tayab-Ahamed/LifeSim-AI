import {
  ChoiceOption,
  CustomChoiceRequest,
  FinalResult,
  GameConfig,
  HistoryEntry,
  Scenario,
  Stats,
  TraitScores,
} from "./types/wealthcraft";

type ScenarioRequest = {
  config: GameConfig;
  playerName: string;
  stats: Stats;
  turn: number;
  history: HistoryEntry[];
  traits: TraitScores;
};

type ResultRequest = {
  config: GameConfig;
  playerName: string;
  stats: Stats;
  history: HistoryEntry[];
  traits: TraitScores;
};

const requestJson = async <T,>(
  path: string,
  body: Record<string, unknown>
): Promise<T> => {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(data.error || "AI request failed.");
  }

  return data;
};

export const requestAIScenario = async ({
  config,
  playerName,
  stats,
  turn,
  history,
  traits,
}: ScenarioRequest): Promise<Scenario> =>
  requestJson<Scenario>("/api/scenario", {
    config,
    playerName,
    stats,
    turn,
    history,
    traits,
  });

export const requestAIResult = async ({
  config,
  playerName,
  stats,
  history,
  traits,
}: ResultRequest): Promise<FinalResult> =>
  requestJson<FinalResult>("/api/result", {
    config,
    playerName,
    stats,
    history,
    traits,
  });

export const requestAICustomChoice = async ({
  config,
  customText,
  scenario,
  stats,
  turn,
  history,
  traits,
}: CustomChoiceRequest & { config: GameConfig }): Promise<ChoiceOption> =>
  requestJson<ChoiceOption>("/api/custom-choice", {
    config,
    customText,
    scenario,
    stats,
    turn,
    history,
    traits,
  });
