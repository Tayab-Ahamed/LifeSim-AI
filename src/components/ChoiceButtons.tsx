import React from "react";
import { ChoiceOption } from "../types/wealthcraft";

type ChoiceButtonsProps = {
  choices: ChoiceOption[];
  disabled: boolean;
  onChoose: (choice: ChoiceOption) => Promise<void>;
};

const formatDelta = (key: string, value: number) => {
  const prefix = value > 0 ? "+" : value < 0 ? "-" : "";
  const formatted = Math.abs(value).toLocaleString("en-IN");

  if (key === "money" || key === "debt") {
    return `Rs ${prefix}${formatted}`;
  }

  return `${prefix}${formatted}`;
};

const getTone = (key: string, value: number) => {
  if (key === "debt" || key === "stress") {
    return value < 0 ? "positive" : "negative";
  }

  return value > 0 ? "positive" : "negative";
};

const ChoiceButtons: React.FC<ChoiceButtonsProps> = ({
  choices,
  disabled,
  onChoose,
}) => {
  return (
    <div className="choice-list">
      {choices.map((choice) => {
        const effectEntries = Object.entries(choice.effect).filter(
          ([, value]) => value !== 0
        );

        return (
          <button
            key={choice.id}
            type="button"
            className="choice-card"
            disabled={disabled}
            onClick={() => onChoose(choice)}
          >
            <span className="choice-text">{choice.text}</span>
            <div className="choice-meta">
              {effectEntries.map(([key, value]) => (
                <span
                  key={`${choice.id}-${key}`}
                  className={`effect-pill effect-pill--${getTone(key, value)}`}
                >
                  {key.charAt(0).toUpperCase() + key.slice(1)} {formatDelta(key, value)}
                </span>
              ))}
            </div>
            <span className="choice-note">{choice.note}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ChoiceButtons;
