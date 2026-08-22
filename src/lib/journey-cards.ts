import cardsJson from "@/lib/journey-cards.json" with { type: "json" };

export type RuleRank = "must-do" | "must-not" | "only-if";

export type JourneyRule = {
  rank: RuleRank;
  line: string;
  source: string;
  quote: string;
};

export type JourneyCard = {
  n: number;
  taskGroup: string;
  phase: string;
  stage: string;
  step: string;
  task: string;
  title: string;
  dependency: string;
  who: string;
  verb: string;
  channel: string;
  system: string;
  inputType: string | null;
  input: string | null;
  outputType: string | null;
  output: string | null;
  unitType: string | null;
  area: string | null;
  workScope: string | null;
  unitFeatures: string | null;
  tenantType: string | null;
  poType: string | null;
  rules: JourneyRule[];
};

export const JOURNEY_CARDS = cardsJson as JourneyCard[];

export const PHASES = [
  {
    id: "Setup",
    name: "Setup",
    description:
      "Get access, kickoff, design and permits sorted so works can start.",
  },
  {
    id: "Build",
    name: "Build",
    description: "Hand over the unit, brief the contractor, and carry out the works.",
  },
  {
    id: "Operate",
    name: "Operate",
    description: "Open the outlet and keep servicing reports current.",
  },
  {
    id: "Exit",
    name: "Exit",
    description: "Reinstate the unit and close the tenancy.",
  },
] as const;

export type PhaseId = (typeof PHASES)[number]["id"];

export const STAKEHOLDERS = [
  "Tenant",
  "Contractor",
  "Project Officer",
  "Integrated Facilities Management",
  "Airport Emergency & Safety",
  "Design Management",
  "Building Maintenance Contractor",
  "Master Planning",
  "Qualified Person",
  "Building Management Centre",
  "Airport Planning & Leasing",
  "Finance",
  "System",
] as const;

export type Stakeholder = (typeof STAKEHOLDERS)[number];

export function isListed(value: string | null | undefined) {
  if (value == null) return false;
  const t = value.trim();
  if (!t) return false;
  if (t === "NA" || t === "-" || t === "–") return false;
  return true;
}

export function displayValue(
  value: string | null | undefined,
  empty: string,
) {
  return isListed(value) ? value!.trim() : empty;
}

function hay(card: JourneyCard) {
  return [
    card.unitType,
    card.area,
    card.workScope,
    card.unitFeatures,
    card.tenantType,
    card.poType,
  ]
    .filter(isListed)
    .join(" ")
    .toLowerCase();
}

export function cardApplies(
  card: JourneyCard,
  ctx: {
    tenancyType: string;
    terminal: string;
    showFull: boolean;
  },
) {
  if (ctx.showFull) return true;
  const text = hay(card);
  if (!text) return true;

  const fnb =
    text.includes("f&b") ||
    text.includes("food") ||
    text.includes("need gas") ||
    text.includes("deep frying") ||
    text.includes("open flame");
  const retail = text.includes("retail");
  if (fnb && !retail && ctx.tenancyType !== "F&B") return false;
  if (retail && !fnb && ctx.tenancyType !== "Retail") return false;

  if (text.includes("duplex")) return false;
  if (text.includes("event space")) return false;
  if (text.includes("landside") && !text.includes("airside")) return false;
  if (text.includes("closed-door")) return false;

  if (text.includes("terminal 4 only") && ctx.terminal !== "T4") return false;
  if (
    (text.includes("terminal 3 (") ||
      text.includes("structured ceiling") ||
      text.includes("t3 tenant telephone")) &&
    ctx.terminal !== "T3"
  ) {
    return false;
  }

  return true;
}

export function isMyCard(card: JourneyCard, who: string) {
  return card.who === who;
}

export function stagesInPhase(phase: PhaseId) {
  const seen: string[] = [];
  for (const card of JOURNEY_CARDS) {
    if (card.phase !== phase) continue;
    if (!seen.includes(card.stage)) seen.push(card.stage);
  }
  return seen;
}

export function cardsInPhase(phase: PhaseId) {
  return JOURNEY_CARDS.filter((c) => c.phase === phase);
}
