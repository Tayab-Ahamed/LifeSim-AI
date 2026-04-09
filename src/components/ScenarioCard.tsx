import React from "react";
import { ChoiceOption, Scenario } from "../types/wealthcraft";
import ChoiceButtons from "./ChoiceButtons";

type ScenarioCardProps = {
  scenario: Scenario | null;
  turn: number;
  maxTurns: number;
  isLoading: boolean;
  onChoose: (choice: ChoiceOption) => Promise<void>;
};

const ScenarioCard: React.FC<ScenarioCardProps> = ({
  scenario,
  turn,
  maxTurns,
  isLoading,
  onChoose,
}) => {
  if (!scenario && !isLoading) {
    return null;
  }

  return (
    <section className="panel-card scenario-card">
      <span className="panel-kicker">
        Turn {turn} of {maxTurns}
      </span>
      <h2>{scenario?.title ?? "Preparing your next scenario"}</h2>
      <p className="scenario-copy">
        {scenario?.scenario ??
          "Your financial world is spinning up. The next choice is loading."}
      </p>

      {isLoading && <p className="loading-copy">Generating the next life event...</p>}

      {scenario && !isLoading && (
        <ChoiceButtons
          choices={scenario.choices}
          disabled={isLoading}
          onChoose={onChoose}
        />
      )}
    </section>
  );
};

export default ScenarioCard;
