import type { Role } from "@/lib/app-state";
import {
  classifyStep,
  type ClassifiedStep,
} from "@/lib/process-guide";
import { normalizeQuery, textMatches } from "@/lib/process-v15-search";
import { PHASES, type Stage, type Step, type Unit } from "@/lib/tenancy-data";

export const WORKS_HREF = "/works";
export const REGULAR_SERVICE_STEP_NAME = "Regular Servicing Reporting";

export function worksQuizRedirectLine(role: Role) {
  if (role === "officer") {
    return {
      before: "If they found out they need a repair — a failed test or a machine — ",
      action: "here's what they should do",
      after: ".",
    };
  }
  if (role === "contractor") {
    return {
      before: "If you found out the unit needs a repair — a failed test or a machine — ",
      action: "here's what to do",
      after: ".",
    };
  }
  return {
    before: "If you found out you need a repair — a failed test or a machine — ",
    action: "here's what to do",
    after: ".",
  };
}

export const OPERATE_QUIZ_STAGE = "Operations";
export const OPERATE_QUIZ_STEP_NAME = "Works after opening";
export const OPERATE_QUIZ_FOCUS = "operate-works-quiz";

export const OPERATE_QUIZ_STEP: Step = {
  name: OPERATE_QUIZ_STEP_NAME,
  responsible: "You",
  what: "If you need to change the unit after opening, answer five questions about these works.",
  whatFor: {
    tenant:
      "If you need to change the unit after opening, answer five questions about these works.",
    contractor:
      "If the unit needs works after opening, answer five questions about these works.",
    officer:
      "If they need works after opening, fill five questions or the contractor can.",
  },
  subSteps: [
    {
      text: "Answer five questions about these works. Select all that apply.",
      audience: ["tenant", "contractor", "officer"],
    },
  ],
  people: ["Tenant", "Contractor", "Project Officer"],
};

/** Kept for older cuts. v23 no longer injects this as a step card. */
export function injectOperateQuizStep(
  blocks: { stage: Stage; steps: ClassifiedStep[] }[],
  role: Role,
  unit: Unit,
) {
  const classified = classifyStep(OPERATE_QUIZ_STEP, role, unit);
  if (!classified) return blocks;
  if (blocks.some((block) => block.stage.name === OPERATE_QUIZ_STAGE)) {
    return blocks.map((block) => {
      if (block.stage.name !== OPERATE_QUIZ_STAGE) return block;
      if (block.steps.some((row) => row.step.name === OPERATE_QUIZ_STEP_NAME)) {
        return block;
      }
      return { ...block, steps: [...block.steps, classified] };
    });
  }
  const opsStage = PHASES.find((phase) => phase.id === "operate")?.stages.find(
    (stage) => stage.name === OPERATE_QUIZ_STAGE,
  );
  if (!opsStage) return blocks;
  return [...blocks, { stage: opsStage, steps: [classified] }];
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
    id: "planned-works-quiz",
    title: "Upcoming works",
    hint: "Planned Works Quiz on the IFM briefing",
    needles: [
      "upcoming works",
      "planned works",
      "works quiz",
      "ifm briefing",
    ],
    to: "/works?kind=operate",
  },
  {
    id: "operate-quiz",
    title: "Works quiz",
    hint: "A quiz for later or minor works — not an Operate step",
    needles: [
      "if you need",
      "change the unit",
      "works after opening",
      "later reno",
      "repair",
      "machine",
      "reno",
      "renovation",
      "test fail",
      "failed test",
    ],
    to: WORKS_HREF,
  },
  {
    id: "reports",
    title: "Regular service reports",
    hint: "Operate · lodge in TOPAZ",
    needles: ["service report", "topaz", "regular service"],
    to: "/process-v24?phase=operate",
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
