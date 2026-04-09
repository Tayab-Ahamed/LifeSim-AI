import React from "react";
import "./App.css";
import ResultScreen from "./components/ResultScreen";
import ScenarioCard from "./components/ScenarioCard";
import StartScreen from "./components/StartScreen";
import StatsBar from "./components/StatsBar";
import { useGameState } from "./hooks/useGameState";
import { formatMoney } from "./utils/formatMoney";

const App: React.FC = () => {
  const {
    phase,
    stats,
    traits,
    config,
    turn,
    history,
    scenario,
    result,
    isLoading,
    error,
    maxTurns,
    startGame,
    chooseOption,
    submitCustomChoice,
    restartGame,
  } = useGameState();

  const netWorth = stats.money - stats.debt;
  const statusCards = [
    {
      title:
        stats.stress > 68
          ? "High pressure"
          : stats.stress > 42
            ? "Manageable pressure"
            : "Calm enough to think clearly",
      body: "Stress changes how risky every future choice feels.",
    },
    {
      title:
        netWorth > 25000
          ? "You have breathing room."
          : netWorth > 8000
            ? "You are stable, but one shock matters."
            : "Cash flow is tight. Every decision counts.",
      body: `Current net position: ${formatMoney(netWorth)} after debt.`,
    },
    {
      title:
        stats.career > 68
          ? "Career momentum is strong."
          : stats.career > 45
            ? "Career progress is steady."
            : "Career growth needs attention.",
      body: "Growth choices improve earnings, but they can increase strain.",
    },
    {
      title: config.mode === "ai" ? "AI interpretation enabled." : "Local rules mode.",
      body:
        config.mode === "ai"
          ? `${config.provider.toUpperCase()} is generating scenarios and interpreting custom choices.`
          : "Scenarios and results are powered by the built-in local simulation engine.",
    },
  ];

  const traitCards = [
    {
      label: "Ambition",
      value: traits.ambition,
    },
    {
      label: "Discipline",
      value: traits.discipline,
    },
    {
      label: "Balance",
      value: traits.balance,
    },
    {
      label: "Empathy",
      value: traits.empathy,
    },
    {
      label: "Adaptability",
      value: traits.adaptability,
    },
    {
      label: "Risk",
      value: traits.risk,
    },
  ];

  return (
    <div className="wealthcraft-app">
      <div className="background-glow background-glow--left" />
      <div className="background-glow background-glow--right" />

      <main className="app-shell">
        <StartScreen
          isLoading={isLoading && phase === "setup"}
          error={phase === "setup" ? error : ""}
          onStart={startGame}
        />

        {phase !== "setup" && (
          <section className="game-shell">
            <StatsBar stats={stats} turn={turn} maxTurns={maxTurns} />

            <div className="dashboard-grid">
              {phase === "playing" ? (
                <ScenarioCard
                  scenario={scenario}
                  turn={turn}
                  maxTurns={maxTurns}
                  isLoading={isLoading}
                  error={error}
                  onChoose={chooseOption}
                  onCustomChoice={submitCustomChoice}
                />
              ) : (
                <section className="panel-card scenario-card">
                  <span className="panel-kicker">Simulation complete</span>
                  <h2>Your future is ready</h2>
                  <p className="scenario-copy">
                    Review the final outcome below, inspect the decisions that
                    shaped it, and restart to try a different strategy.
                  </p>
                </section>
              )}

              <aside className="sidebar-stack">
                <section className="panel-card">
                  <span className="panel-kicker">Current Position</span>
                  <h3>How your life feels right now</h3>
                  <div className="status-stack">
                    {statusCards.map((card) => (
                      <article key={card.title} className="status-card">
                        <strong>{card.title}</strong>
                        <span>{card.body}</span>
                      </article>
                    ))}
                  </div>
                </section>

                <section className="panel-card">
                  <span className="panel-kicker">Decision Log</span>
                  <h3>Recent turns</h3>
                  <div className="history-list">
                    {history.length === 0 && (
                      <p className="history-empty">
                        Your first decision will appear here.
                      </p>
                    )}
                    {history
                      .slice()
                      .reverse()
                      .map((entry) => (
                        <div
                          key={`${entry.turn}-${entry.scenarioId}`}
                          className="history-item"
                        >
                          <span className="history-turn">Turn {entry.turn}</span>
                          <strong>{entry.choiceText}</strong>
                          <span className="history-context">{entry.scenarioTitle}</span>
                        </div>
                      ))}
                  </div>
                </section>

                <section className="panel-card">
                  <span className="panel-kicker">Hidden Profile</span>
                  <h3>What the engine thinks about you</h3>
                  <div className="trait-list">
                    {traitCards.map((trait) => (
                      <div key={trait.label} className="trait-row">
                        <span>{trait.label}</span>
                        <strong>{trait.value}/100</strong>
                      </div>
                    ))}
                  </div>
                </section>
              </aside>
            </div>

            {phase === "result" && result && (
              <ResultScreen
                result={result}
                stats={stats}
                history={history}
                onRestart={restartGame}
                isLoading={isLoading}
              />
            )}
          </section>
        )}
      </main>
    </div>
  );
};

export default App;
