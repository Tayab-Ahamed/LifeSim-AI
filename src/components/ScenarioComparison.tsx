import React from "react";
import { buildChoiceComparisons } from "../aiService";
import { Scenario, Stats } from "../types/wealthcraft";
import { formatMoney } from "../utils/formatMoney";

type ScenarioComparisonProps = {
  scenario: Scenario;
  stats: Stats;
  personaCount: 2 | 3 | 4;
};

const formatDelta = (key: string, value: number) => {
  const prefix = value > 0 ? "+" : value < 0 ? "-" : "";
  const amount = Math.abs(value).toLocaleString("en-IN");

  if (key === "money" || key === "debt") {
    return `Rs ${prefix}${amount}`;
  }

  return `${prefix}${amount}`;
};

const ScenarioComparison: React.FC<ScenarioComparisonProps> = ({
  scenario,
  stats,
  personaCount,
}) => {
  const comparisons = buildChoiceComparisons({
    scenario,
    stats,
    personaCount,
  });

  return (
    <section className="panel-card comparison-shell">
      <div className="comparison-header">
        <div>
          <span className="panel-kicker">Scenario Comparison</span>
          <h3>If {personaCount} different people took these choices</h3>
          <p className="comparison-copy">
            Preview only. Pick your real choice from the buttons above, and use
            this panel to compare how different player styles would feel the
            same decision.
          </p>
        </div>
      </div>

      <div className="comparison-choice-list">
        {comparisons.map(({ choice, comparisons: personaComparisons }) => (
          <article key={choice.id} className="comparison-choice-card">
            <h4>{choice.text}</h4>
            <div className="comparison-persona-grid">
              {personaComparisons.map(
                ({ persona, projectedEffect, projectedStats, insight }) => (
                  <div key={`${choice.id}-${persona.id}`} className="comparison-persona-card">
                    <span className="comparison-persona-name">{persona.label}</span>
                    <p className="comparison-persona-description">
                      {persona.description}
                    </p>
                    <div className="comparison-pill-row">
                      {Object.entries(projectedEffect)
                        .filter(([, value]) => value !== 0)
                        .map(([key, value]) => (
                          <span
                            key={`${persona.id}-${key}`}
                            className={`effect-pill ${
                              value > 0
                                ? "effect-pill--positive"
                                : "effect-pill--negative"
                            }`}
                          >
                            {key.charAt(0).toUpperCase() + key.slice(1)}{" "}
                            {formatDelta(key, value)}
                          </span>
                        ))}
                    </div>
                    <p className="comparison-insight">{insight}</p>
                    <div className="comparison-stats">
                      <span>Money {formatMoney(projectedStats.money)}</span>
                      <span>Debt {formatMoney(projectedStats.debt)}</span>
                      <span>Stress {projectedStats.stress}/100</span>
                      <span>Happiness {projectedStats.happiness}/100</span>
                      <span>Career {projectedStats.career}/100</span>
                    </div>
                  </div>
                )
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default ScenarioComparison;
