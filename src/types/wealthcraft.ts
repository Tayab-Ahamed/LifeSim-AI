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

export type ChoiceOption = {
  id: string;
  text: string;
  note: string;
  effect: ChoiceEffect;
};

export type Scenario = {
  id: string;
  title: string;
  scenario: string;
  choices: ChoiceOption[];
};

export type HistoryEntry = {
  turn: number;
  scenarioId: string;
  scenarioTitle: string;
  choiceText: string;
  effect: ChoiceEffect;
  statsAfter: Stats;
};

export type FinalResult = {
  title: string;
  summary: string;
  financialState: string;
  personality: string;
  advice: string;
};

export type StartingStyle = "balanced" | "career" | "safety";
