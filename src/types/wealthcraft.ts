export type Stats = {
  money: number;
  debt: number;
  stress: number;
  happiness: number;
  career: number;
};

export type ChoiceEffect = {
  money: number;
  debt: number;
  stress: number;
  happiness: number;
  career: number;
};

export type TraitScores = {
  ambition: number;
  discipline: number;
  balance: number;
  empathy: number;
  adaptability: number;
  risk: number;
};

export type TraitDelta = {
  ambition: number;
  discipline: number;
  balance: number;
  empathy: number;
  adaptability: number;
  risk: number;
};

export type ScenarioCategory =
  | "career"
  | "housing"
  | "family"
  | "health"
  | "debt"
  | "investment"
  | "transport"
  | "cashflow"
  | "social"
  | "education"
  | "insurance";

export type ChoiceOption = {
  id: string;
  text: string;
  note: string;
  effect: ChoiceEffect;
  source?: "preset" | "custom";
  traitDelta?: TraitDelta;
  reasoning?: string;
};

export type Scenario = {
  id: string;
  category: ScenarioCategory | string;
  title: string;
  scenario: string;
  choices: ChoiceOption[];
};

export type HistoryEntry = {
  turn: number;
  scenarioId: string;
  scenarioCategory: ScenarioCategory | string;
  scenarioTitle: string;
  choiceText: string;
  effect: ChoiceEffect;
  statsAfter: Stats;
  source: "preset" | "custom";
  traitDelta: TraitDelta;
  reasoning?: string;
};

export type FinalResult = {
  title: string;
  summary: string;
  financialState: string;
  personality: string;
  advice: string;
  traitSummary: string;
};

export type StartingStyle = "balanced" | "career" | "safety";

export type GameMode = "local" | "ai";

export type AIProvider = "openai" | "gemini" | "qwen";

export type GameConfig = {
  mode: GameMode;
  provider: AIProvider;
  apiKey: string;
  model: string;
  comparisonCount: 0 | 2 | 3 | 4;
};

export type CustomChoiceRequest = {
  customText: string;
  scenario: Scenario;
  stats: Stats;
  turn: number;
  history: HistoryEntry[];
  traits: TraitScores;
};

export type PersonaProfile = {
  id: string;
  label: string;
  description: string;
  traits: TraitScores;
};

export type PersonaComparison = {
  persona: PersonaProfile;
  projectedEffect: ChoiceEffect;
  projectedStats: Stats;
  insight: string;
};

export type ChoiceComparison = {
  choice: ChoiceOption;
  comparisons: PersonaComparison[];
};
