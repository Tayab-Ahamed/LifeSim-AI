import { useState } from "react";
import {
  applyChoiceEffect,
  generateFutureResult,
  generateScenario,
  getStartingStats,
  INITIAL_STATS,
  MAX_TURNS,
} from "../aiService";
import {
  ChoiceOption,
  FinalResult,
  HistoryEntry,
  Scenario,
  StartingStyle,
  Stats,
} from "../types/wealthcraft";

type Phase = "setup" | "playing" | "result";

const DEFAULT_PLAYER_NAME = "You";

const getInitialState = () => ({
  phase: "setup" as Phase,
  playerName: DEFAULT_PLAYER_NAME,
  startingStyle: "balanced" as StartingStyle,
  stats: INITIAL_STATS as Stats,
  turn: 1,
  history: [] as HistoryEntry[],
  scenario: null as Scenario | null,
  result: null as FinalResult | null,
  isLoading: false,
});

export const useGameState = () => {
  const [phase, setPhase] = useState<Phase>(getInitialState().phase);
  const [playerName, setPlayerName] = useState(getInitialState().playerName);
  const [startingStyle, setStartingStyle] = useState<StartingStyle>(
    getInitialState().startingStyle
  );
  const [stats, setStats] = useState<Stats>(getInitialState().stats);
  const [turn, setTurn] = useState(getInitialState().turn);
  const [history, setHistory] = useState<HistoryEntry[]>(getInitialState().history);
  const [scenario, setScenario] = useState<Scenario | null>(getInitialState().scenario);
  const [result, setResult] = useState<FinalResult | null>(getInitialState().result);
  const [isLoading, setIsLoading] = useState(getInitialState().isLoading);

  const startGame = async ({
    nextPlayerName,
    nextStartingStyle,
  }: {
    nextPlayerName: string;
    nextStartingStyle: StartingStyle;
  }) => {
    const safeName = nextPlayerName.trim() || DEFAULT_PLAYER_NAME;
    const freshStats = getStartingStats(nextStartingStyle);

    setIsLoading(true);
    setPlayerName(safeName);
    setStartingStyle(nextStartingStyle);
    setStats(freshStats);
    setTurn(1);
    setHistory([]);
    setResult(null);
    setPhase("playing");

    const firstScenario = await generateScenario({
      playerName: safeName,
      stats: freshStats,
      turn: 1,
      history: [],
    });

    setScenario(firstScenario);
    setIsLoading(false);
  };

  const chooseOption = async (choice: ChoiceOption) => {
    if (!scenario || isLoading) {
      return;
    }

    setIsLoading(true);

    const nextStats = applyChoiceEffect(stats, choice.effect);
    const nextHistoryEntry: HistoryEntry = {
      turn,
      scenarioId: scenario.id,
      scenarioTitle: scenario.title,
      choiceText: choice.text,
      effect: choice.effect,
      statsAfter: nextStats,
    };
    const nextHistory = [...history, nextHistoryEntry];

    setStats(nextStats);
    setHistory(nextHistory);

    if (turn >= MAX_TURNS) {
      const futureResult = await generateFutureResult({
        stats: nextStats,
        history: nextHistory,
      });

      setResult(futureResult);
      setScenario(null);
      setPhase("result");
      setIsLoading(false);
      return;
    }

    const nextTurn = turn + 1;
    const nextScenario = await generateScenario({
      playerName,
      stats: nextStats,
      turn: nextTurn,
      history: nextHistory,
    });

    setTurn(nextTurn);
    setScenario(nextScenario);
    setIsLoading(false);
  };

  const restartGame = async () => {
    await startGame({
      nextPlayerName: playerName,
      nextStartingStyle: startingStyle,
    });
  };

  return {
    phase,
    playerName,
    startingStyle,
    stats,
    turn,
    history,
    scenario,
    result,
    isLoading,
    maxTurns: MAX_TURNS,
    startGame,
    chooseOption,
    restartGame,
  };
};
