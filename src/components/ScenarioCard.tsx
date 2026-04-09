import React, { useState } from "react";
import { ChoiceOption, Scenario } from "../types/wealthcraft";
import ChoiceButtons from "./ChoiceButtons";

type ScenarioCardProps = {
  scenario: Scenario | null;
  turn: number;
  maxTurns: number;
  isLoading: boolean;
  error: string;
  onChoose: (choice: ChoiceOption) => Promise<void>;
  onCustomChoice: (customText: string) => Promise<void>;
};

const ScenarioCard: React.FC<ScenarioCardProps> = ({
  scenario,
  turn,
  maxTurns,
  isLoading,
  error,
  onChoose,
  onCustomChoice,
}) => {
  const [customText, setCustomText] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  React.useEffect(() => {
    setCustomText("");
    setShowCustom(false);
  }, [scenario?.id]);

  if (!scenario && !isLoading) {
    return null;
  }

  const handleCustomSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onCustomChoice(customText);
  };

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
        <>
          <ChoiceButtons
            choices={scenario.choices}
            disabled={isLoading}
            onChoose={onChoose}
          />

          <div className="custom-choice-shell">
            <button
              type="button"
              className="secondary-button secondary-button--compact"
              onClick={() => setShowCustom((current) => !current)}
            >
              {showCustom ? "Hide custom approach" : "Try my own approach"}
            </button>

            {showCustom && (
              <form className="custom-choice-form" onSubmit={handleCustomSubmit}>
                <label htmlFor="customChoice">Describe what you would actually do</label>
                <textarea
                  id="customChoice"
                  name="customChoice"
                  rows={4}
                  value={customText}
                  onChange={(event) => setCustomText(event.target.value)}
                  placeholder="Example: I would ask for sponsorship first, then pay only if they reject it."
                />
                <p className="custom-helper">
                  We’ll interpret your own strategy, convert it into realistic
                  effects, and keep the simulation fair.
                </p>
                {error && <p className="error-copy">{error}</p>}
                <button type="submit" className="primary-button primary-button--compact">
                  Submit custom approach
                </button>
              </form>
            )}
          </div>
        </>
      )}
    </section>
  );
};

export default ScenarioCard;
