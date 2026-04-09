import React from "react";
import { FinalResult, HistoryEntry, Stats } from "../types/wealthcraft";

type ResultScreenProps = {
  result: FinalResult;
  stats: Stats;
  history: HistoryEntry[];
  onRestart: () => Promise<void>;
  isLoading: boolean;
};

const formatMoney = (value: number) => `Rs ${value.toLocaleString("en-IN")}`;

const ResultScreen: React.FC<ResultScreenProps> = ({
  result,
  stats,
  history,
  onRestart,
  isLoading,
}) => {
  return (
    <section className="result-shell">
      <div className="result-header">
        <div>
          <span className="panel-kicker">Future Outcome</span>
          <h2>{result.title}</h2>
          <p className="result-summary">{result.summary}</p>
        </div>
        <button
          type="button"
          className="secondary-button"
          disabled={isLoading}
          onClick={() => onRestart()}
        >
          {isLoading ? "Restarting..." : "Play Again"}
        </button>
      </div>

      <div className="result-grid">
        <article className="result-card">
          <span className="result-label">Financial State</span>
          <p>{result.financialState}</p>
        </article>
        <article className="result-card">
          <span className="result-label">Personality Type</span>
          <p>{result.personality}</p>
        </article>
        <article className="result-card">
          <span className="result-label">Advice</span>
          <p>{result.advice}</p>
        </article>
      </div>

      <div className="result-lower-grid">
        <article className="panel-card">
          <span className="panel-kicker">Final Stats</span>
          <div className="final-stats">
            <span>Money: {formatMoney(stats.money)}</span>
            <span>Debt: {formatMoney(stats.debt)}</span>
            <span>Stress: {stats.stress}/100</span>
            <span>Happiness: {stats.happiness}/100</span>
            <span>Career: {stats.career}/100</span>
          </div>
        </article>

        <article className="panel-card">
          <span className="panel-kicker">Decision Trail</span>
          <div className="history-list">
            {history
              .slice()
              .reverse()
              .map((entry) => (
                <div key={`${entry.turn}-${entry.scenarioId}`} className="history-item">
                  <span className="history-turn">Turn {entry.turn}</span>
                  <strong>{entry.choiceText}</strong>
                  <span className="history-context">{entry.scenarioTitle}</span>
                </div>
              ))}
          </div>
        </article>
      </div>
    </section>
  );
};

export default ResultScreen;
