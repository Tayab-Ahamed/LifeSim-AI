import React, { useState } from "react";
import { StartingStyle } from "../types/wealthcraft";

type StartScreenProps = {
  isLoading: boolean;
  onStart: (input: { nextPlayerName: string; nextStartingStyle: StartingStyle }) => Promise<void>;
};

const StartScreen: React.FC<StartScreenProps> = ({ isLoading, onStart }) => {
  const [playerName, setPlayerName] = useState("");
  const [startingStyle, setStartingStyle] = useState<StartingStyle>("balanced");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onStart({
      nextPlayerName: playerName,
      nextStartingStyle: startingStyle,
    });
  };

  return (
    <section className="hero-shell">
      <div className="hero-copy">
        <span className="hero-badge">Hackathon Build</span>
        <h1>LifeSim AI</h1>
        <p>
          A 5-turn financial life simulator where every decision changes your
          money, debt, stress, happiness, and career.
        </p>
        <p>
          Think of it like a money-life sandbox: real tradeoffs, visible stat
          changes, and a future outcome based on how you played.
        </p>
        <ul className="hero-list">
          <li>Rent hikes, layoffs, inflation, upskilling, and family pressure.</li>
          <li>Three choices every turn with small but meaningful consequences.</li>
          <li>A final result that tells you what kind of financial life you built.</li>
        </ul>
      </div>

      <form className="start-card" onSubmit={handleSubmit}>
        <span className="hero-badge hero-badge--soft">No API Key Needed</span>
        <h2>Start a Run</h2>
        <p className="muted-copy">
          This version is self-contained so the demo works instantly.
        </p>

        <label htmlFor="playerName">Player name</label>
        <input
          id="playerName"
          name="playerName"
          type="text"
          maxLength={24}
          placeholder="Aarav, Maya, You..."
          value={playerName}
          onChange={(event) => setPlayerName(event.target.value)}
        />

        <label htmlFor="startingStyle">Starting style</label>
        <select
          id="startingStyle"
          name="startingStyle"
          value={startingStyle}
          onChange={(event) => setStartingStyle(event.target.value as StartingStyle)}
        >
          <option value="balanced">Balanced start</option>
          <option value="career">Career-first start</option>
          <option value="safety">Safety-first start</option>
        </select>

        <button className="primary-button" type="submit" disabled={isLoading}>
          {isLoading ? "Preparing run..." : "Play LifeSim AI"}
        </button>

        <p className="fine-print">
          Demo script: "Each choice affects your future. After 5 decisions,
          LifeSim AI predicts the life path you built."
        </p>
      </form>
    </section>
  );
};

export default StartScreen;
