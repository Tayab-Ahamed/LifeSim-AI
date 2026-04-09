import React from "react";
import { Stats } from "../types/wealthcraft";
import { formatMoney } from "../utils/formatMoney";

type StatsBarProps = {
  stats: Stats;
  turn: number;
  maxTurns: number;
};

const StatsBar: React.FC<StatsBarProps> = ({ stats, turn, maxTurns }) => {
  const items = [
    { label: "Money", value: formatMoney(stats.money), tone: "positive" },
    { label: "Debt", value: formatMoney(stats.debt), tone: "warning" },
    { label: "Stress", value: `${stats.stress}/100`, tone: "danger" },
    { label: "Happiness", value: `${stats.happiness}/100`, tone: "info" },
    { label: "Career", value: `${stats.career}/100`, tone: "positive" },
    { label: "Turn", value: `${turn}/${maxTurns}`, tone: "info" },
  ];

  return (
    <section className="stats-grid" aria-label="Game stats">
      {items.map((item) => (
        <article key={item.label} className={`stat-card stat-card--${item.tone}`}>
          <span className="stat-label">{item.label}</span>
          <strong className="stat-value">{item.value}</strong>
        </article>
      ))}
    </section>
  );
};

export default StatsBar;
