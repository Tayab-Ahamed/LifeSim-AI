import { useRef, useState } from "react";
import {
  applyChoiceEffect,
  applyTraitDelta,
  buildTraitDelta,
  generateFutureResult,
  generateScenario,
  getStartingStats,
  INITIAL_STATS,
  INITIAL_TRAITS,
  MAX_TURNS,
  resolveLocalCustomChoice,
} from "../aiService";
import {
  requestAICustomChoice,
  requestAIResult,
  requestAIScenario,
} from "../llmClient";
import {
  ChoiceOption,
  FinalResult,
  GameConfig,
  HistoryEntry,
  Scenario,
  StartingStyle,
  Stats,
  TraitScores,
} from "../types/wealthcraft";

type Phase = "setup" | "playing" | "result";

const DEFAULT_PLAYER_NAME = "You";

const DEFAULT_CONFIG: GameConfig = {
  mode: "local",
  provider: "openai",
  apiKey: "",
  model: "gpt-4.1-mini",
};

const INITIAL_STATE = {
  phase: "setup" as Phase,
  playerName: DEFAULT_PLAYER_NAME,
  startingStyle: "balanced" as StartingStyle,
  config: DEFAULT_CONFIG,
  stats: INITIAL_STATS as Stats,
  traits: INITIAL_TRAITS as TraitScores,
  turn: 1,
  history: [] as HistoryEntry[],
  scenario: null as Scenario | null,
  result: null as FinalResult | null,
  isLoading: false,
  error: "",
};

export const useGameState = () => {
  const [phase, setPhase] = useState<Phase>(INITIAL_STATE.phase);
  const [playerName, setPlayerName] = useState(INITIAL_STATE.playerName);
  const [startingStyle, setStartingStyle] = useState<StartingStyle>(
    INITIAL_STATE.startingStyle
  );
  const [config, setConfig] = useState<GameConfig>(INITIAL_STATE.config);
  const [stats, setStats] = useState<Stats>(INITIAL_STATE.stats);
  const [traits, setTraits] = useState<TraitScores>(INITIAL_STATE.traits);
  const [turn, setTurn] = useState(INITIAL_STATE.turn);
  const [history, setHistory] = useState<HistoryEntry[]>(INITIAL_STATE.history);
  const [scenario, setScenario] = useState<Scenario | null>(INITIAL_STATE.scenario);
  const [result, setResult] = useState<FinalResult | null>(INITIAL_STATE.result);
  const [isLoading, setIsLoading] = useState(INITIAL_STATE.isLoading);
  const [error, setError] = useState(INITIAL_STATE.error);

  // React state updates are async. This ref gives us a synchronous lock so
  // double-clicks cannot slip through the action boundary during a rerender gap.
  const isBusyRef = useRef(false);

  const requestScenarioForMode = async ({
    nextConfig,
    nextPlayerName,
    nextStats,
    nextTurn,
    nextHistory,
    nextTraits,
  }: {
    nextConfig: GameConfig;
    nextPlayerName: string;
    nextStats: Stats;
    nextTurn: number;
    nextHistory: HistoryEntry[];
    nextTraits: TraitScores;
  }) => {
    if (nextConfig.mode === "ai") {
      try {
        return await requestAIScenario({
          config: nextConfig,
          playerName: nextPlayerName,
          stats: nextStats,
          turn: nextTurn,
          history: nextHistory,
          traits: nextTraits,
        });
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? `${requestError.message} Falling back to local scenarios.`
            : "AI scenario request failed. Falling back to local scenarios."
        );
      }
    }

    return generateScenario({
      playerName: nextPlayerName,
      stats: nextStats,
      turn: nextTurn,
      history: nextHistory,
      traits: nextTraits,
    });
  };

  const requestResultForMode = async ({
    nextConfig,
    nextPlayerName,
    nextStats,
    nextHistory,
    nextTraits,
  }: {
    nextConfig: GameConfig;
    nextPlayerName: string;
    nextStats: Stats;
    nextHistory: HistoryEntry[];
    nextTraits: TraitScores;
  }) => {
    if (nextConfig.mode === "ai") {
      try {
        return await requestAIResult({
          config: nextConfig,
          playerName: nextPlayerName,
          stats: nextStats,
          history: nextHistory,
          traits: nextTraits,
        });
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? `${requestError.message} Falling back to local final analysis.`
            : "AI result request failed. Falling back to local final analysis."
        );
      }
    }

    return generateFutureResult({
      stats: nextStats,
      history: nextHistory,
      traits: nextTraits,
    });
  };

  const advanceWithChoice = async (choice: ChoiceOption) => {
    if (!scenario) {
      return;
    }

    const traitDelta =
      choice.traitDelta ??
      buildTraitDelta({
        scenario,
        choiceText: choice.text,
        effect: choice.effect,
      });
    const nextStats = applyChoiceEffect(stats, choice.effect);
    const nextTraits = applyTraitDelta(traits, traitDelta);
    const nextHistoryEntry: HistoryEntry = {
      turn,
      scenarioId: scenario.id,
      scenarioTitle: scenario.title,
      choiceText: choice.text,
      effect: choice.effect,
      statsAfter: nextStats,
      source: choice.source ?? "preset",
      traitDelta,
      reasoning: choice.reasoning,
    };
    const nextHistory = [...history, nextHistoryEntry];

    setStats(nextStats);
    setTraits(nextTraits);
    setHistory(nextHistory);

    if (turn >= MAX_TURNS) {
      const futureResult = await requestResultForMode({
        nextConfig: config,
        nextPlayerName: playerName,
        nextStats,
        nextHistory,
        nextTraits,
      });

      setResult(futureResult);
      setScenario(null);
      setPhase("result");
      return;
    }

    const nextTurn = turn + 1;
    const nextScenario = await requestScenarioForMode({
      nextConfig: config,
      nextPlayerName: playerName,
      nextStats,
      nextTurn,
      nextHistory,
      nextTraits,
    });

    setTurn(nextTurn);
    setScenario(nextScenario);
  };

  const startGame = async ({
    nextPlayerName,
    nextStartingStyle,
    nextConfig,
  }: {
    nextPlayerName: string;
    nextStartingStyle: StartingStyle;
    nextConfig: GameConfig;
  }) => {
    if (isBusyRef.current) return;
    isBusyRef.current = true;

    const safeName = nextPlayerName.trim() || DEFAULT_PLAYER_NAME;
    const freshStats = getStartingStats(nextStartingStyle);
    const freshTraits = INITIAL_TRAITS;

    setError("");
    setIsLoading(true);
    setPlayerName(safeName);
    setStartingStyle(nextStartingStyle);
    setConfig(nextConfig);
    setStats(freshStats);
    setTraits(freshTraits);
    setTurn(1);
    setHistory([]);
    setResult(null);
    setPhase("playing");

    try {
      const firstScenario = await requestScenarioForMode({
        nextConfig,
        nextPlayerName: safeName,
        nextStats: freshStats,
        nextTurn: 1,
        nextHistory: [],
        nextTraits: freshTraits,
      });

      setScenario(firstScenario);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to start the game."
      );
      setPhase("setup");
    } finally {
      setIsLoading(false);
      isBusyRef.current = false;
    }
  };

  const chooseOption = async (choice: ChoiceOption) => {
    if (isBusyRef.current || !scenario) return;
    isBusyRef.current = true;
    setError("");
    setIsLoading(true);

    try {
      await advanceWithChoice(choice);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Something went wrong while applying your choice."
      );
    } finally {
      setIsLoading(false);
      isBusyRef.current = false;
    }
  };

  const submitCustomChoice = async (customText: string) => {
    if (isBusyRef.current || !scenario) return;
    const trimmed = customText.trim();
    if (!trimmed) {
      setError("Write your own approach before submitting it.");
      return;
    }

    isBusyRef.current = true;
    setError("");
    setIsLoading(true);

    try {
      const customChoice =
        config.mode === "ai"
          ? await requestAICustomChoice({
              config,
              customText: trimmed,
              scenario,
              stats,
              turn,
              history,
              traits,
            }).catch(async (requestError) => {
              setError(
                requestError instanceof Error
                  ? `${requestError.message} Falling back to local interpretation.`
                  : "AI custom-choice request failed. Falling back to local interpretation."
              );
              return resolveLocalCustomChoice({
                customText: trimmed,
                scenario,
                stats,
                turn,
                history,
                traits,
              });
            })
          : await resolveLocalCustomChoice({
              customText: trimmed,
              scenario,
              stats,
              turn,
              history,
              traits,
            });

      await advanceWithChoice(customChoice);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "We could not interpret that custom approach."
      );
    } finally {
      setIsLoading(false);
      isBusyRef.current = false;
    }
  };

  const restartGame = () => {
    setPhase("setup");
    setError("");
    setScenario(null);
    setResult(null);
    setStats(INITIAL_STATE.stats);
    setTraits(INITIAL_STATE.traits);
    setTurn(1);
    setHistory([]);
  };

  return {
    phase,
    playerName,
    stats,
    traits,
    config,
    turn,
    history,
    scenario,
    result,
    isLoading,
    error,
    maxTurns: MAX_TURNS,
    startGame,
    chooseOption,
    submitCustomChoice,
    restartGame,
  };
};
