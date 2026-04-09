import {
  ChoiceEffect,
  FinalResult,
  HistoryEntry,
  Scenario,
  StartingStyle,
  Stats,
} from "./types/wealthcraft";

export const MAX_TURNS = 5;

export const INITIAL_STATS: Stats = {
  money: 20000,
  debt: 0,
  stress: 20,
  happiness: 50,
  career: 50,
};

const STARTING_STYLE_EFFECTS: Record<StartingStyle, ChoiceEffect> = {
  balanced: { money: 0, debt: 0, stress: 0, happiness: 0, career: 0 },
  career: { money: 3000, debt: 0, stress: 5, happiness: -4, career: 8 },
  safety: { money: 4500, debt: -500, stress: -2, happiness: 2, career: -4 },
};

type ScenarioTemplate = {
  id: string;
  title: string;
  priority: number;
  score: (input: { stats: Stats; turn: number }) => number;
  buildScenario: (input: { playerName: string; stats: Stats; turn: number }) => string;
  choices: Array<{
    text: string;
    note: string;
    effect: ChoiceEffect;
  }>;
};

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });

const scenarioTemplates: ScenarioTemplate[] = [
  {
    id: "promotion-relocation",
    title: "Promotion with a Price Tag",
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
];

export const applyChoiceEffect = (stats: Stats, effect: ChoiceEffect): Stats => {
  const clamp = (value: number, min: number, max: number) =>
    Math.max(min, Math.min(max, Math.round(value)));

  return {
    money: Math.max(0, Math.round(stats.money + effect.money)),
    debt: Math.max(0, Math.round(stats.debt + effect.debt)),
    stress: clamp(stats.stress + effect.stress, 0, 100),
    happiness: clamp(stats.happiness + effect.happiness, 0, 100),
    career: clamp(stats.career + effect.career, 0, 100),
  };
};

export const getStartingStats = (style: StartingStyle): Stats =>
  applyChoiceEffect(INITIAL_STATS, STARTING_STYLE_EFFECTS[style]);

export const generateScenario = async ({
  playerName,
  stats,
  turn,
  history,
}: {
  playerName: string;
  stats: Stats;
  turn: number;
  history: HistoryEntry[];
}): Promise<Scenario> => {
  await wait(180);

  const usedScenarioIds = new Set(history.map((entry) => entry.scenarioId));
  const ranked = scenarioTemplates
    .map((template) => ({
      template,
      score:
        usedScenarioIds.has(template.id)
          ? Number.NEGATIVE_INFINITY
          : template.priority + template.score({ stats, turn }),
    }))
    .filter((entry) => Number.isFinite(entry.score))
    .sort((left, right) => right.score - left.score);

  const chosenTemplate =
    ranked[1] && turn % 2 === 0 ? ranked[1].template : ranked[0].template;

  return {
    id: chosenTemplate.id,
    title: chosenTemplate.title,
    scenario: chosenTemplate.buildScenario({ playerName, stats, turn }),
    choices: chosenTemplate.choices.map((choice, index) => ({
      id: `${chosenTemplate.id}-${index + 1}`,
      text: choice.text,
      note: choice.note,
      effect: { ...choice.effect },
    })),
  };
};

export const generateFutureResult = async ({
  stats,
  history,
}: {
  stats: Stats;
  history: HistoryEntry[];
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
  };
};
