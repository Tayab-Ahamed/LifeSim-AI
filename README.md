# LifeSim AI

LifeSim AI is a gamified financial life simulator built for a hackathon theme around learning finance through experience instead of theory.

The app drops the player into a 5-turn life simulation where each decision changes:

- `money`
- `debt`
- `stress`
- `happiness`
- `career`

After the fifth decision, LifeSim AI generates a future outcome that summarizes the kind of financial life the player built.

## What It Does

- Runs a 5-turn financial decision loop
- Shows a live stats bar after every choice
- Presents 3 meaningful options per scenario
- Tracks decision history across the run
- Generates a final result with:
  - life title
  - summary
  - financial state
  - personality type
  - advice

## Built For

- Students
- Young professionals
- Hackathon demos
- Anyone who wants a fast, interactive way to explore money tradeoffs

## Current Demo Behavior

This version is intentionally self-contained for demo reliability.

- No API key is required
- Scenarios are generated from an internal financial event engine
- The app is ready to run locally right away

## Tech Stack

- React
- TypeScript
- Create React App
- CSS

## Run Locally

From this folder:

```bash
npm install
npm start
```

Then open:

```text
http://localhost:3000
```

## Production Build

```bash
npm run build
```

## Test Command

The repo currently has no dedicated gameplay test suite yet.

You can still run:

```bash
npm test -- --watchAll=false --passWithNoTests
```

## Project Notes

- The original repo started as an AI text-adventure project.
- It has now been adapted into the LifeSim AI financial life simulator.
- Some legacy files from the original project still exist in the codebase, but the live app flow now uses the LifeSim AI game path.

## Main Files

- [src/App.tsx](C:/Users/siddi/Downloads/Game%20Sim/ai-text-adventure-main/ai-text-adventure-main/src/App.tsx)
- [src/aiService.ts](C:/Users/siddi/Downloads/Game%20Sim/ai-text-adventure-main/ai-text-adventure-main/src/aiService.ts)
- [src/hooks/useGameState.ts](C:/Users/siddi/Downloads/Game%20Sim/ai-text-adventure-main/ai-text-adventure-main/src/hooks/useGameState.ts)
- [src/components/StartScreen.tsx](C:/Users/siddi/Downloads/Game%20Sim/ai-text-adventure-main/ai-text-adventure-main/src/components/StartScreen.tsx)
- [src/components/StatsBar.tsx](C:/Users/siddi/Downloads/Game%20Sim/ai-text-adventure-main/ai-text-adventure-main/src/components/StatsBar.tsx)
- [src/components/ScenarioCard.tsx](C:/Users/siddi/Downloads/Game%20Sim/ai-text-adventure-main/ai-text-adventure-main/src/components/ScenarioCard.tsx)
- [src/components/ChoiceButtons.tsx](C:/Users/siddi/Downloads/Game%20Sim/ai-text-adventure-main/ai-text-adventure-main/src/components/ChoiceButtons.tsx)
- [src/components/ResultScreen.tsx](C:/Users/siddi/Downloads/Game%20Sim/ai-text-adventure-main/ai-text-adventure-main/src/components/ResultScreen.tsx)

## Status

- Build verified
- Playable locally
- README updated for the current product
