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
- Supports `Try my own approach` free-text decisions
- Tracks decision history across the run
- Tracks hidden behavioral traits behind the scenes
- Generates a final result with:
  - life title
  - summary
  - financial state
  - personality type
  - advice
  - trait summary

## Built For

- Students
- Young professionals
- Hackathon demos
- Anyone who wants a fast, interactive way to explore money tradeoffs

## Engine Modes

LifeSim AI now supports two play styles:

- `Local mode`
  - No API key required
  - Uses the built-in simulation engine
  - Supports custom free-text choices through a local interpretation fallback
- `AI mode`
  - Uses a backend proxy
  - Supports `OpenAI`, `Gemini`, and `Qwen`
  - Generates scenarios, final results, and custom-choice interpretation through an LLM

In both modes:

- stat updates remain deterministic
- effects are clamped to safe ranges
- the engine tracks hidden traits like ambition, discipline, balance, empathy, adaptability, and risk

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

This starts:

- the React frontend
- the local API server on `http://localhost:8787`

Then open:

```text
http://localhost:3000
```

## Provider Configuration

You can either:

1. Paste an API key into the game UI when selecting `AI-assisted understanding`
2. Or use environment variables

Create a local `.env` file from `.env.example`:

```bash
copy .env.example .env
```

Available environment variables:

- `OPENAI_API_KEY`
- `GEMINI_API_KEY`
- `QWEN_API_KEY`
- `QWEN_BASE_URL`
- `API_PORT`

## Available AI Features

When `AI mode` is enabled, the backend powers:

- next scenario generation
- custom free-text choice interpretation
- final future-outcome writing

The key feature added from the design discussion is:

- `Try my own approach`

This lets the player write a custom response instead of using only the 3 buttons. The backend interprets the text, converts it into structured effects, and then the rules engine applies those effects safely.

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
- Some legacy files from the original project still exist in the codebase.
- The active game flow uses the LifeSim AI engine and UI path.

## Main Files

- [src/App.tsx](src/App.tsx)
- [src/aiService.ts](src/aiService.ts)
- [src/llmClient.ts](src/llmClient.ts)
- [src/hooks/useGameState.ts](src/hooks/useGameState.ts)
- [src/components/StartScreen.tsx](src/components/StartScreen.tsx)
- [src/components/StatsBar.tsx](src/components/StatsBar.tsx)
- [src/components/ScenarioCard.tsx](src/components/ScenarioCard.tsx)
- [src/components/ChoiceButtons.tsx](src/components/ChoiceButtons.tsx)
- [src/components/ResultScreen.tsx](src/components/ResultScreen.tsx)
- [src/utils/formatMoney.ts](src/utils/formatMoney.ts)
- [server/server.mjs](server/server.mjs)
- [scripts/dev.mjs](scripts/dev.mjs)

## Status

- Local mode playable
- AI mode wired for provider-backed generation
- README updated for the current product
