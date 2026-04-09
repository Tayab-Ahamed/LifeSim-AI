import {
  ChoiceEffect,
  ChoiceOption,
  CustomChoiceRequest,
  FinalResult,
  HistoryEntry,
  Scenario,
  StartingStyle,
  Stats,
  TraitDelta,
  TraitScores,
} from "./types/wealthcraft";

export const MAX_TURNS = 5;

export const INITIAL_STATS: Stats = {
  money: 20000,
  debt: 0,
  stress: 20,
  happiness: 50,
  career: 50,
};

export const INITIAL_TRAITS: TraitScores = {
  ambition: 50,
  discipline: 50,
  balance: 50,
  empathy: 50,
  adaptability: 50,
  risk: 50,
};

const STARTING_STYLE_EFFECTS: Record<StartingStyle, ChoiceEffect> = {
  balanced: { money: 0, debt: 0, stress: 0, happiness: 0, career: 0 },
  career: { money: 3000, debt: 0, stress: 5, happiness: -4, career: 8 },
  safety: { money: 4500, debt: -500, stress: -2, happiness: 2, career: -4 },
};

type ScenarioTemplate = {
  id: string;
  title: string;
  tags: string[];
  priority: number;
  score: (input: { stats: Stats; turn: number }) => number;
  buildScenario: (input: { playerName: string; stats: Stats; turn: number }) => string;
  choices: Array<{
    text: string;
    note: string;
    effect: ChoiceEffect;
  }>;
};

// These tiny waits are only here to preserve visible "thinking" feedback in
// local mode so the UX still feels conversational even without an API call.
const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, Math.round(value)));

const clampDelta = (value: number) => clamp(value, -15, 15);

const emptyTraitDelta = (): TraitDelta => ({
  ambition: 0,
  discipline: 0,
  balance: 0,
  empathy: 0,
  adaptability: 0,
  risk: 0,
});

const scenarioTemplates: ScenarioTemplate[] = [
  {
    id: "promotion-relocation",
    title: "Promotion with a Price Tag",
    tags: ["career", "risk", "cashflow"],
    priority: 10,
    score: ({ stats }) => (stats.career >= 48 ? 18 : 8),
    buildScenario: ({ playerName }) =>
      `${playerName}, your manager offers a promotion, but the role is in a more expensive part of the city. The raise is real, but so are the rent and commute costs.`,
    choices: [
      {
        text: "Take the promotion and move closer to the office.",
        note: "Higher upside, tighter monthly cash flow.",
        effect: { money: -4000, debt: 0, stress: 8, happiness: 1, career: 12 },
      },
      {
        text: "Negotiate hybrid work before accepting.",
        note: "Moderate gain with less lifestyle disruption.",
        effect: { money: 1500, debt: 0, stress: 2, happiness: 3, career: 8 },
      },
      {
        text: "Stay in your current role and protect your routine.",
        note: "You keep stability, but growth slows.",
        effect: { money: 0, debt: 0, stress: -1, happiness: 2, career: -3 },
      },
    ],
  },
  {
    id: "rent-hike",
    title: "Rent Shock",
    tags: ["cashflow", "discipline", "adaptability"],
    priority: 16,
    score: ({ stats }) => (stats.money < 18000 ? 24 : 14),
    buildScenario: () =>
      "Your landlord sends a message late at night: rent goes up next month. You have just enough time to react, but every option changes your lifestyle.",
    choices: [
      {
        text: "Move in with a roommate and lower your fixed costs.",
        note: "Cash flow improves, privacy takes a hit.",
        effect: { money: 4500, debt: 0, stress: 5, happiness: -4, career: 0 },
      },
      {
        text: "Stay put and cut spending elsewhere.",
        note: "You protect convenience but carry more pressure.",
        effect: { money: -3500, debt: 0, stress: 7, happiness: -2, career: 0 },
      },
      {
        text: "Pay the deposit for a cheaper place farther away.",
        note: "Better long-term savings, rough short-term transition.",
        effect: { money: -1500, debt: 0, stress: 4, happiness: -1, career: 1 },
      },
    ],
  },
  {
    id: "family-emergency",
    title: "Family Emergency",
    tags: ["empathy", "cashflow", "stability"],
    priority: 18,
    score: ({ turn }) => (turn >= 2 ? 19 : 10),
    buildScenario: () =>
      "A family member needs urgent medical help. You can contribute immediately, borrow, or coordinate support with relatives, but there is no painless choice.",
    choices: [
      {
        text: "Cover most of the bill from savings right away.",
        note: "Fast relief for them, big hit to your buffer.",
        effect: { money: -7000, debt: 0, stress: 6, happiness: 5, career: 0 },
      },
      {
        text: "Take a small personal loan so you can help now.",
        note: "Keeps cash on hand, creates future pressure.",
        effect: { money: -1000, debt: 6000, stress: 8, happiness: 4, career: 0 },
      },
      {
        text: "Coordinate shared support and contribute what you safely can.",
        note: "Balanced support, but emotionally difficult.",
        effect: { money: -3000, debt: 0, stress: 4, happiness: 2, career: 0 },
      },
    ],
  },
  {
    id: "upskill-course",
    title: "Skill Upgrade Window",
    tags: ["career", "discipline", "ambition"],
    priority: 12,
    score: ({ stats }) => (stats.career < 70 ? 20 : 8),
    buildScenario: () =>
      "A respected weekend course opens for enrollment. It could help you break into a better role, but it costs money and will eat into your rest.",
    choices: [
      {
        text: "Pay for the course yourself and commit fully.",
        note: "Short-term pain for long-term upside.",
        effect: { money: -5000, debt: 0, stress: 7, happiness: -1, career: 10 },
      },
      {
        text: "Ask your employer to sponsor part of it.",
        note: "Slower to approve, but financially smarter.",
        effect: { money: -1500, debt: 0, stress: 2, happiness: 1, career: 8 },
      },
      {
        text: "Skip it and keep your weekends free.",
        note: "Protects your energy, delays your next jump.",
        effect: { money: 0, debt: 0, stress: -2, happiness: 3, career: -2 },
      },
    ],
  },
  {
    id: "burnout-week",
    title: "Burnout Warning",
    tags: ["balance", "stress", "career"],
    priority: 14,
    score: ({ stats }) => (stats.stress > 50 ? 28 : 8),
    buildScenario: () =>
      "Three late nights in a row leave you exhausted. Your work is still moving, but your body is starting to ask for a different pace.",
    choices: [
      {
        text: "Take a proper break and spend a little on recovery.",
        note: "You buy time back before stress compounds.",
        effect: { money: -2000, debt: 0, stress: -12, happiness: 8, career: -1 },
      },
      {
        text: "Push through one more week for visibility at work.",
        note: "Career signal rises, so does personal strain.",
        effect: { money: 2500, debt: 0, stress: 12, happiness: -6, career: 6 },
      },
      {
        text: "Set firmer boundaries and protect evenings.",
        note: "Balanced move with moderate gains.",
        effect: { money: 0, debt: 0, stress: -6, happiness: 5, career: 2 },
      },
    ],
  },
  {
    id: "layoff-rumor",
    title: "Layoff Rumors",
    tags: ["career", "discipline", "risk"],
    priority: 17,
    score: ({ turn }) => (turn >= 3 ? 23 : 11),
    buildScenario: () =>
      "Slack is full of whispers about restructuring. Nothing is official yet, but people are already updating resumes and quietly interviewing.",
    choices: [
      {
        text: "Start job hunting now and build a backup plan.",
        note: "Higher effort today, lower panic tomorrow.",
        effect: { money: -500, debt: 0, stress: 5, happiness: -1, career: 7 },
      },
      {
        text: "Stay focused and trust your current team.",
        note: "You save energy now, but risk being late.",
        effect: { money: 0, debt: 0, stress: 3, happiness: 0, career: -1 },
      },
      {
        text: "Slash spending and boost your emergency fund immediately.",
        note: "Protects downside, slows lifestyle momentum.",
        effect: { money: 3000, debt: 0, stress: 2, happiness: -3, career: 1 },
      },
    ],
  },
  {
    id: "scooter-choice",
    title: "Commute Upgrade",
    tags: ["comfort", "cashflow", "adaptability"],
    priority: 8,
    score: ({ stats }) => (stats.money > 12000 ? 13 : 7),
    buildScenario: () =>
      "A used scooter is on sale nearby. It could save commute time, but maintenance, fuel, and surprise repairs will become your problem.",
    choices: [
      {
        text: "Buy the scooter and take control of the commute.",
        note: "Convenience now, costs later.",
        effect: { money: -6000, debt: 0, stress: -1, happiness: 4, career: 1 },
      },
      {
        text: "Stick with public transport and keep cash liquid.",
        note: "Lower cost, same daily hassle.",
        effect: { money: 0, debt: 0, stress: 1, happiness: -1, career: 0 },
      },
      {
        text: "Split a rental plan with a friend for flexibility.",
        note: "Shared savings, shared coordination headaches.",
        effect: { money: -1800, debt: 0, stress: 2, happiness: 2, career: 0 },
      },
    ],
  },
  {
    id: "inflation-groceries",
    title: "Inflation Bite",
    tags: ["cashflow", "discipline", "stress"],
    priority: 15,
    score: ({ turn }) => (turn >= 2 ? 18 : 12),
    buildScenario: () =>
      "Groceries, transport, and utilities all jump in the same month. Nothing dramatic on its own, but together they start eating your breathing room.",
    choices: [
      {
        text: "Rework your budget and cook at home aggressively.",
        note: "Strong savings move, lower convenience.",
        effect: { money: 2500, debt: 0, stress: 2, happiness: -2, career: 0 },
      },
      {
        text: "Absorb the increase and hope income catches up.",
        note: "Easy now, expensive later.",
        effect: { money: -3000, debt: 0, stress: 4, happiness: 0, career: 0 },
      },
      {
        text: "Pick up weekend freelance work for a month.",
        note: "Cash boost at the cost of recovery time.",
        effect: { money: 3500, debt: 0, stress: 6, happiness: -3, career: 3 },
      },
    ],
  },
  {
    id: "friend-startup",
    title: "Friend's Startup Pitch",
    tags: ["risk", "ambition", "career"],
    priority: 9,
    score: ({ stats }) => (stats.career > 55 ? 16 : 9),
    buildScenario: () =>
      "A friend wants you to join a tiny startup early. The upside could be meaningful, but cash flow would become shaky overnight.",
    choices: [
      {
        text: "Join full time and bet on the upside.",
        note: "Big growth swing, lots of uncertainty.",
        effect: { money: -5000, debt: 0, stress: 10, happiness: 3, career: 14 },
      },
      {
        text: "Stay in your job and help part-time on weekends.",
        note: "Keeps optionality alive without full risk.",
        effect: { money: 1000, debt: 0, stress: 5, happiness: 2, career: 6 },
      },
      {
        text: "Pass politely and focus on stable progress.",
        note: "Low drama, lower upside.",
        effect: { money: 0, debt: 0, stress: -1, happiness: 0, career: 1 },
      },
    ],
  },
  {
    id: "credit-card-offer",
    title: "Easy EMI Temptation",
    tags: ["debt", "discipline", "risk"],
    priority: 13,
    score: ({ stats }) => (stats.debt > 8000 ? 22 : 10),
    buildScenario: () =>
      "Your banking app pushes a pre-approved card upgrade with easy EMI offers. It could help you smooth cash flow, or quietly normalize future debt.",
    choices: [
      {
        text: "Use the card for a planned purchase and pay carefully.",
        note: "Structured debt can help, but it still adds drag.",
        effect: { money: 1500, debt: 4000, stress: 4, happiness: 1, career: 0 },
      },
      {
        text: "Ignore the offer and keep your obligations simple.",
        note: "You avoid debt, but lose short-term flexibility.",
        effect: { money: 0, debt: 0, stress: -1, happiness: 0, career: 0 },
      },
      {
        text: "Use it to build a tiny buffer, then freeze spending.",
        note: "Defensive debt with a safety purpose.",
        effect: { money: 2500, debt: 2500, stress: 1, happiness: 0, career: 0 },
      },
    ],
  },
  {
    id: "windfall-bonus",
    title: "Bonus Month",
    tags: ["cashflow", "discipline", "career"],
    priority: 11,
    score: ({ turn }) => (turn >= 3 ? 17 : 8),
    buildScenario: () =>
      "A surprise performance bonus lands in your account. For once, the question is not whether money is available, but what you do before it disappears.",
    choices: [
      {
        text: "Pay down debt and improve your monthly runway.",
        note: "Less exciting now, stronger later.",
        effect: { money: -1000, debt: -5000, stress: -5, happiness: 1, career: 0 },
      },
      {
        text: "Split it across savings, fun, and one smart purchase.",
        note: "Balanced use of a rare upside moment.",
        effect: { money: 3000, debt: 0, stress: -2, happiness: 5, career: 2 },
      },
      {
        text: "Invest it in yourself with tools, books, and coaching.",
        note: "Less cash left now, more upside later.",
        effect: { money: -2500, debt: 0, stress: 0, happiness: 2, career: 8 },
      },
    ],
  },
  {
    id: "debt-refinance",
    title: "Debt Reset Option",
    tags: ["debt", "discipline", "stress"],
    priority: 19,
    score: ({ stats }) => (stats.debt >= 10000 ? 32 : 0),
    buildScenario: () =>
      "A bank offers to refinance your debt at a lower monthly payment. It will free breathing room, but extend how long you stay attached to it.",
    choices: [
      {
        text: "Refinance and lower the monthly burden.",
        note: "Stress drops now, debt stays with you longer.",
        effect: { money: 2000, debt: -1500, stress: -6, happiness: 1, career: 0 },
      },
      {
        text: "Keep the current plan and pay aggressively.",
        note: "Harder month-to-month, cleaner long-term path.",
        effect: { money: -2500, debt: -3000, stress: 4, happiness: -1, career: 0 },
      },
      {
        text: "Take freelance work and attack the balance faster.",
        note: "Debt improves, but so does fatigue.",
        effect: { money: 3000, debt: -2500, stress: 7, happiness: -3, career: 3 },
      },
    ],
  },
  {
    id: "investment-opportunity",
    title: "Investment Opportunity",
    tags: ["risk", "discipline", "wealth"],
    priority: 10,
    score: ({ stats, turn }) =>
      stats.money > 16000 && turn >= 3 ? 18 : stats.money > 12000 ? 10 : 4,
    buildScenario: () =>
      "A friend shows you a promising investment opportunity. It could grow your money over time, but there is uncertainty and no guaranteed return.",
    choices: [
      {
        text: "Invest a meaningful amount and hold for the long term.",
        note: "Higher upside if it works, higher anxiety while you wait.",
        effect: { money: -4000, debt: 0, stress: 4, happiness: 1, career: 1 },
      },
      {
        text: "Invest a small amount you can afford to lose.",
        note: "Keeps you in the game without overcommitting.",
        effect: { money: -1500, debt: 0, stress: 1, happiness: 1, career: 0 },
      },
      {
        text: "Skip it and keep building your safety buffer.",
        note: "Protects stability, but you may miss upside.",
        effect: { money: 0, debt: 0, stress: -1, happiness: 0, career: 0 },
      },
    ],
  },
];

const tagTraitBoosts: Record<string, (traits: TraitScores) => number> = {
  career: (traits) => (traits.ambition - 50) * 0.18,
  risk: (traits) => (traits.risk - 50) * 0.18,
  empathy: (traits) => (traits.empathy - 50) * 0.16,
  discipline: (traits) => (traits.discipline - 50) * 0.16,
  adaptability: (traits) => (traits.adaptability - 50) * 0.14,
  balance: (traits) => (traits.balance - 50) * 0.14,
  stress: (traits) => (50 - traits.balance) * 0.08,
  cashflow: (traits) => (traits.discipline - 50) * 0.12,
  wealth: (traits) => (traits.discipline + traits.risk - 100) * 0.08,
  debt: (traits) => (traits.discipline - traits.risk) * 0.06,
  stability: (traits) => (traits.balance + traits.discipline - 100) * 0.08,
  comfort: (traits) => (traits.balance - 50) * 0.1,
};

const tokenize = (input: string) =>
  input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

const countOverlap = (left: string, right: string) => {
  const rightTokens = new Set(tokenize(right));
  return tokenize(left).reduce(
    (count, token) => (rightTokens.has(token) ? count + 1 : count),
    0
  );
};

const clampTraits = (traits: TraitScores): TraitScores => ({
  ambition: clamp(traits.ambition, 0, 100),
  discipline: clamp(traits.discipline, 0, 100),
  balance: clamp(traits.balance, 0, 100),
  empathy: clamp(traits.empathy, 0, 100),
  adaptability: clamp(traits.adaptability, 0, 100),
  risk: clamp(traits.risk, 0, 100),
});

export const applyChoiceEffect = (stats: Stats, effect: ChoiceEffect): Stats => ({
  money: Math.max(0, Math.round(stats.money + effect.money)),
  debt: Math.max(0, Math.round(stats.debt + effect.debt)),
  stress: clamp(stats.stress + effect.stress, 0, 100),
  happiness: clamp(stats.happiness + effect.happiness, 0, 100),
  career: clamp(stats.career + effect.career, 0, 100),
});

export const applyTraitDelta = (
  traits: TraitScores,
  delta: TraitDelta
): TraitScores =>
  clampTraits({
    ambition: traits.ambition + delta.ambition,
    discipline: traits.discipline + delta.discipline,
    balance: traits.balance + delta.balance,
    empathy: traits.empathy + delta.empathy,
    adaptability: traits.adaptability + delta.adaptability,
    risk: traits.risk + delta.risk,
  });

export const getStartingStats = (style: StartingStyle): Stats =>
  applyChoiceEffect(INITIAL_STATS, STARTING_STYLE_EFFECTS[style]);

export const buildTraitDelta = ({
  scenario,
  choiceText,
  effect,
}: {
  scenario: Pick<Scenario, "title" | "scenario">;
  choiceText: string;
  effect: ChoiceEffect;
}): TraitDelta => {
  const text = `${scenario.title} ${scenario.scenario} ${choiceText}`.toLowerCase();
  const delta = emptyTraitDelta();

  delta.ambition += effect.career > 0 ? 3 : effect.career < 0 ? -2 : 0;
  delta.ambition += text.includes("promotion") || text.includes("startup") ? 2 : 0;
  delta.ambition += text.includes("course") || text.includes("certification") ? 2 : 0;

  delta.discipline += effect.money > 0 ? 2 : effect.money < -4000 ? -1 : 0;
  delta.discipline += effect.debt < 0 ? 4 : effect.debt > 0 ? -3 : 0;
  delta.discipline += text.includes("budget") || text.includes("save") ? 3 : 0;
  delta.discipline += text.includes("roommate") || text.includes("split costs") ? 2 : 0;

  delta.balance += effect.stress < 0 ? 4 : effect.stress > 0 ? -2 : 0;
  delta.balance += effect.happiness > 0 ? 2 : effect.happiness < 0 ? -1 : 0;
  delta.balance +=
    text.includes("break") || text.includes("recover") || text.includes("boundaries")
      ? 4
      : 0;

  delta.empathy += text.includes("family") || text.includes("help") ? 4 : 0;
  delta.empathy += text.includes("coordinate support") ? 2 : 0;

  delta.adaptability +=
    text.includes("negotiate") ||
    text.includes("hybrid") ||
    text.includes("roommate") ||
    text.includes("move") ||
    text.includes("split")
      ? 3
      : 0;
  delta.adaptability += effect.money > 0 && effect.happiness < 0 ? 1 : 0;

  delta.risk += effect.career > 6 ? 2 : 0;
  delta.risk += effect.debt > 0 ? 4 : 0;
  delta.risk += effect.money < -3500 ? 2 : 0;
  delta.risk += text.includes("startup") || text.includes("invest") ? 4 : 0;
  delta.risk += text.includes("stay") || text.includes("skip") ? -2 : 0;

  return {
    ambition: clampDelta(delta.ambition),
    discipline: clampDelta(delta.discipline),
    balance: clampDelta(delta.balance),
    empathy: clampDelta(delta.empathy),
    adaptability: clampDelta(delta.adaptability),
    risk: clampDelta(delta.risk),
  };
};

const describeTopTraits = (traits: TraitScores) =>
  Object.entries(traits)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([key]) => key);

export const summarizeTraits = (traits: TraitScores) => {
  const topTraits = describeTopTraits(traits);
  const labels: Record<string, string> = {
    ambition: "ambitious",
    discipline: "disciplined",
    balance: "balance-seeking",
    empathy: "empathetic",
    adaptability: "adaptable",
    risk: "risk-tolerant",
  };

  return topTraits.map((trait) => labels[trait]).join(", ");
};

const buildTraitSummary = (traits: TraitScores) => {
  const traitsList = describeTopTraits(traits);
  const descriptorMap: Record<string, string> = {
    ambition: "You repeatedly chased meaningful upside when growth mattered.",
    discipline: "You kept looking for sustainable moves instead of flashy ones.",
    balance: "You protected your energy and tried to keep life livable.",
    empathy: "Your choices show that responsibility to other people mattered to you.",
    adaptability: "You kept choosing flexible, practical responses under pressure.",
    risk: "You were comfortable with uncertainty when the upside felt worth it.",
  };

  return traitsList.map((trait) => descriptorMap[trait]).join(" ");
};

const getTraitScenarioBoost = (tags: string[], traits: TraitScores) =>
  tags.reduce((sum, tag) => {
    const boostFn = tagTraitBoosts[tag];
    return sum + (boostFn ? boostFn(traits) : 0);
  }, 0);

export const generateScenario = async ({
  playerName,
  stats,
  turn,
  history,
  traits = INITIAL_TRAITS,
}: {
  playerName: string;
  stats: Stats;
  turn: number;
  history: HistoryEntry[];
  traits?: TraitScores;
}): Promise<Scenario> => {
  await wait(180);

  const usedScenarioIds = new Set(history.map((entry) => entry.scenarioId));
  const jitter = 3;

  const ranked = scenarioTemplates
    .map((template) => ({
      template,
      score: usedScenarioIds.has(template.id)
        ? Number.NEGATIVE_INFINITY
        : template.priority +
          template.score({ stats, turn }) +
          getTraitScenarioBoost(template.tags, traits) +
          (Math.random() * jitter * 2 - jitter),
    }))
    .filter((entry) => Number.isFinite(entry.score))
    .sort((left, right) => right.score - left.score);

  const chosenTemplate = ranked[0].template;

  return {
    id: chosenTemplate.id,
    title: chosenTemplate.title,
    scenario: chosenTemplate.buildScenario({ playerName, stats, turn }),
    choices: chosenTemplate.choices.map((choice, index) => ({
      id: `${chosenTemplate.id}-${index + 1}`,
      text: choice.text,
      note: choice.note,
      effect: { ...choice.effect },
      source: "preset" as const,
    })),
  };
};

const averageEffect = (effects: ChoiceEffect[]): ChoiceEffect => {
  const total = effects.reduce(
    (sum, effect) => ({
      money: sum.money + effect.money,
      debt: sum.debt + effect.debt,
      stress: sum.stress + effect.stress,
      happiness: sum.happiness + effect.happiness,
      career: sum.career + effect.career,
    }),
    { money: 0, debt: 0, stress: 0, happiness: 0, career: 0 }
  );

  return {
    money: Math.round(total.money / effects.length),
    debt: Math.round(total.debt / effects.length),
    stress: Math.round(total.stress / effects.length),
    happiness: Math.round(total.happiness / effects.length),
    career: Math.round(total.career / effects.length),
  };
};

export const resolveLocalCustomChoice = async ({
  customText,
  scenario,
  stats,
  turn,
  history,
  traits,
}: CustomChoiceRequest): Promise<ChoiceOption> => {
  await wait(160);

  const ranked = scenario.choices
    .map((choice) => ({
      choice,
      score:
        countOverlap(customText, choice.text) * 3 +
        countOverlap(customText, choice.note) +
        countOverlap(customText, scenario.scenario),
    }))
    .sort((left, right) => right.score - left.score);

  const hybridRequested = /\b(and|both|first|then|combine|mix|partly|partial|also)\b/i.test(
    customText
  );

  const primary = ranked[0]?.choice ?? scenario.choices[0];
  const secondary = ranked[1]?.choice ?? scenario.choices[1] ?? scenario.choices[0];

  const derivedEffect = hybridRequested
    ? averageEffect([primary.effect, secondary.effect])
    : { ...primary.effect };

  const customScenario: Scenario = {
    ...scenario,
    title: `${scenario.title} - Custom Approach`,
  };

  const traitDelta = buildTraitDelta({
    scenario: customScenario,
    choiceText: customText,
    effect: derivedEffect,
  });
  const nextTraits = applyTraitDelta(traits, traitDelta);
  const nextStats = applyChoiceEffect(stats, derivedEffect);

  const noteBase = hybridRequested
    ? `Interpreted as a hybrid of "${primary.text}" and "${secondary.text}".`
    : `Closest structured interpretation: "${primary.text}".`;

  const reasoning = `Turn ${turn} custom choice read as ${summarizeTraits(
    nextTraits
  )}. It keeps the run realistic while respecting your own wording.`;

  const lastContext =
    history.length > 0
      ? ` After recent choices, your position is money Rs ${nextStats.money.toLocaleString(
          "en-IN"
        )}, debt Rs ${nextStats.debt.toLocaleString("en-IN")}.`
      : "";

  return {
    id: `${scenario.id}-custom`,
    text: customText.trim(),
    note: `${noteBase}${lastContext}`,
    effect: derivedEffect,
    traitDelta,
    source: "custom",
    reasoning,
  };
};

export const generateFutureResult = async ({
  stats,
  history,
  traits = INITIAL_TRAITS,
}: {
  stats: Stats;
  history: HistoryEntry[];
  traits?: TraitScores;
}): Promise<FinalResult> => {
  await wait(220);

  const netWorth = stats.money - stats.debt;
  const growthMoves = history.filter((entry) => entry.effect.career > 0).length;
  const safetyMoves = history.filter(
    (entry) => entry.effect.money > 0 || entry.effect.debt < 0
  ).length;
  const strainMoves = history.filter((entry) => entry.effect.stress > 0).length;

  let title = "Balanced Builder";
  let personality = "Steady Optimist";
  let financialState =
    "You protected savings while still leaving room to grow.";
  let advice =
    "Keep building emergency savings and make future risk feel chosen, not forced.";

  if (netWorth > 28000 && stats.happiness >= 55 && stats.stress <= 55) {
    title = "Balanced Builder";
    personality = "Intentional Planner";
    financialState =
      "You ended with a stable base and enough flexibility to keep improving.";
    advice =
      "Automate your next good habit before lifestyle costs expand around your progress.";
  } else if (stats.career >= 72 && stats.stress >= 60) {
    title = "Driven Earner";
    personality = "Ambitious Maximizer";
    financialState =
      "Income momentum is strong, but your system relies on sustained effort.";
    advice =
      "Convert career wins into resilience now by lowering one recurring cost and protecting recovery time.";
  } else if (stats.debt >= 14000 && stats.stress >= 65) {
    title = "Overextended Survivor";
    personality = "Pressure Juggler";
    financialState =
      "You kept moving, but debt and stress are now shaping too many decisions.";
    advice =
      "Reset one pressure point first: debt cleanup, emergency savings, or workload boundaries.";
  } else if (stats.happiness >= 68 && netWorth >= 10000) {
    title = "Grounded Optimist";
    personality = "Human-Centered Planner";
    financialState =
      "You chose sustainability over image and ended with a life that still feels livable.";
    advice =
      "Keep your balance, but do not ignore career upside for too long. Stability compounds best with growth.";
  } else if (stats.money <= 6000 && stats.career <= 48) {
    title = "Rebuilding Dreamer";
    personality = "Hopeful Resetter";
    financialState =
      "Your margin is thin, but this run clearly shows where the pressure points are.";
    advice =
      "Cut one recurring cost, add one income lever, and protect your next 90 days from new debt.";
  }

  const tone =
    growthMoves >= 3
      ? "You leaned into opportunity even when it raised pressure."
      : safetyMoves >= 3
        ? "You repeatedly protected downside and guarded your buffer."
        : "You mixed ambition and caution depending on the moment.";

  const resilience =
    strainMoves >= 3
      ? "The biggest lesson from this run is that stress compounds just as fast as money."
      : "You showed that small decisions can quietly improve long-term resilience.";

  return {
    title,
    summary: `${tone} After five turns, you ended with Rs ${stats.money.toLocaleString(
      "en-IN"
    )} in money, Rs ${stats.debt.toLocaleString(
      "en-IN"
    )} in debt, ${stats.stress}/100 stress, ${stats.happiness}/100 happiness, and ${stats.career}/100 career strength. ${resilience}`,
    financialState,
    personality,
    advice,
    traitSummary: buildTraitSummary(traits),
  };
};
