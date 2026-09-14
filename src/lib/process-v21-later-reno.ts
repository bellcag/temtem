import type { Role } from "@/lib/app-state";
import {
  classifyStep,
  type ClassifiedStep,
} from "@/lib/process-guide";
import { normalizeQuery, textMatches } from "@/lib/process-v15-search";
import type { Stage, Step, Unit } from "@/lib/tenancy-data";

export const LATER_RENO_STAGE = "Operations";
export const LATER_RENO_STEP_NAME = "Later renovation works";
export const LATER_RENO_CARD_FOCUS = "later-reno-card";
export const LATER_RENO_NEED_FOCUS = "later-reno-need";
export const LATER_RENO_NEED_ID = "later-reno-need";

export const LATER_RENO_STEP: Step = {
  name: LATER_RENO_STEP_NAME,
  responsible: "You",
  what: "Start renovation works for this unit after opening.",
  whatFor: {
    tenant: "Start renovation works for this unit after opening.",
    contractor: "Start renovation works for this unit after opening.",
    officer: "Start renovation works if the tenant needs them after opening.",
  },
  subSteps: [
    {
      text: "Answer the planned works quiz for this job.",
      audience: ["tenant", "contractor"],
    },
    {
      text: "Get renovation permits in OneCalendar.",
      audience: ["tenant", "contractor"],
    },
    {
      text: "Check the planned works quiz and renovation permits.",
      audience: "officer",
    },
  ],
  people: ["Tenant", "Contractor", "Project Officer"],
  systems: [{ label: "OneCalendar" }],
};

export function laterRenoNeedLine(role: Role): string {
  if (role === "officer") {
    return "If they need to change the unit, they will talk to you.";
  }
  return "If you need to change the unit, talk to your Project Officer.";
}

type StageBlock = { stage: Stage; steps: ClassifiedStep[] };

/** Puts a same-rail reno card after Regular service reports. */
export function injectLaterRenoStep(
  blocks: StageBlock[],
  role: Role,
  unit: Unit,
): StageBlock[] {
  const classified = classifyStep(LATER_RENO_STEP, role, unit);
  if (!classified) return blocks;
  return blocks.map((block) => {
    if (block.stage.name !== LATER_RENO_STAGE) return block;
    if (block.steps.some((row) => row.step.name === LATER_RENO_STEP_NAME)) {
      return block;
    }
    const at = block.steps.findIndex(
      (row) => row.step.name === "Regular Servicing Reporting",
    );
    const steps = [...block.steps];
    steps.splice(at >= 0 ? at + 1 : steps.length, 0, classified);
    return { ...block, steps };
  });
}

export type DashboardSearchHit = {
  id: string;
  title: string;
  hint: string;
  to: string;
};

const DASHBOARD_HITS: {
  id: string;
  title: string;
  hint: string;
  needles: string[];
  to: string;
}[] = [
  {
    id: "need",
    title: "If you need to change the unit",
    hint: "Not a step · talk to your Project Officer",
    needles: [
      "if you need",
      "change the unit",
      "later reno",
      "later renovation",
      "reno",
      "renovation",
    ],
    to: `/process-v21?phase=operate&focus=${LATER_RENO_NEED_FOCUS}`,
  },
  {
    id: "card",
    title: "Later renovation works",
    hint: "Operate · with the service reports",
    needles: [
      "later renovation",
      "later reno",
      "renovation works",
      "reno",
      "renovation",
    ],
    to: `/process-v21?phase=operate&focus=${LATER_RENO_CARD_FOCUS}`,
  },
  {
    id: "reports",
    title: "Regular service reports",
    hint: "Operate · lodge in TOPAZ",
    needles: ["service report", "topaz", "regular service"],
    to: "/process-v21?phase=operate",
  },
];

export function dashboardSearchHits(query: string): DashboardSearchHit[] {
  const q = normalizeQuery(query);
  if (!q) return [];
  return DASHBOARD_HITS.filter((hit) =>
    hit.needles.some(
      (needle) => textMatches(needle, query) || normalizeQuery(needle).includes(q),
    ),
  ).map(({ id, title, hint, to }) => ({ id, title, hint, to }));
}
