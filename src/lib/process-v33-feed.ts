import type { Role } from "@/lib/app-state";
import type { Unit } from "@/lib/tenancy-data";
import type { V26Source } from "@/lib/process-v26-guide";
import {
  v26DocumentChecklist,
  type V26DraftStep,
  type V26Work,
} from "@/lib/process-v26-works";
import { usesV38Modules } from "@/lib/process-v31-preview";
import { v31ProjectTitle } from "@/lib/process-v31-works";
import {
  needLabelCompact,
  supplierLine,
  type SupportingDoc,
} from "@/lib/process-permit-supporting-docs";
import {
  hydrateV28FromLegacy,
  q5IsMinorFitout,
  q5IsNoRenovation,
  syncV28Slugs,
  v28ChoiceValue,
} from "@/lib/process-v28-quiz";
import {
  TENANT_PROCESS_STEPS,
  type JourneyStep,
} from "@/lib/tenant-process-journey-data";

/** The sitting that holds the conditional steps before the permit pack. */
export const V33_BEFORE_APPLY = "Before You Apply";

const RENOVATION_PERMIT = "renovation-terminal-permit";
const PRE_OPENING_INSPECTION = "pre-opening-inspection";
const COMPLETE_TERMINALS = ["t1", "t2", "t3", "t4"];

/**
 * LMS-gated steps stay on Tenancy Journey only. Projects do not list them until
 * final logic decides how LMS auto-scope should move them (Confluence:
 * Process guidebook vs Works — Option B → Follow-ups from prototype).
 */
const LMS_JOURNEY_ONLY = new Set([
  "set-up-systems-required-for-staff",
  "point-of-sales-setup",
]);

/** Seeded project that must show every permit, document, and conditional step. */
export function isV33CompleteWork(work: { id: string }) {
  return (
    work.id.startsWith("v31-status-opening-") ||
    work.id.startsWith("v28-operate-full-") ||
    work.id.startsWith("v34-scope-full-")
  );
}

const ACRONYM = new Set([
  "cag",
  "qp",
  "ifm",
  "pos",
  "fsc",
  "maa",
  "bim",
  "mep",
  "aes",
  "ura",
  "stc",
  "ahu",
  "rr",
  "pe",
  "t1",
  "t2",
  "t3",
  "t4",
]);

export function documentLabel(id: string) {
  return id
    .replace(/^placeholder-/, "")
    .split("-")
    .filter(Boolean)
    .map((word) =>
      ACRONYM.has(word) ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(" ");
}

export function journeyStages(phaseId: string) {
  const stages: { name: string; steps: JourneyStep[] }[] = [];
  for (const step of TENANT_PROCESS_STEPS) {
    if (step.phaseId !== phaseId || step.slot !== "journey") continue;
    const last = stages[stages.length - 1];
    if (last?.name === step.stage) last.steps.push(step);
    else stages.push({ name: step.stage, steps: [step] });
  }
  return stages;
}

export function v33StepDocuments(stepId: string) {
  const id = stepId.startsWith("html-") ? stepId.slice(5) : stepId;
  const step = TENANT_PROCESS_STEPS.find((row) => row.id === id);
  return (step?.documents ?? []).map((docId) => ({
    id: docId,
    name: documentLabel(docId),
    type: "Reference",
  }));
}

type Answers = { kind?: string; slugs?: string[] };

function collectSlugs(answers: Record<string, Answers | undefined>) {
  const slugs = new Set<string>();
  for (const answer of Object.values(answers)) {
    if (answer?.kind === "selected") {
      for (const slug of answer.slugs ?? []) slugs.add(slug);
    }
  }
  // No question in the Tenant Process Journey writes this value.
  slugs.delete("fire-safety-submission");
  return slugs;
}

function valuesFor(
  dimension: string,
  slugs: Set<string>,
  unitTypes: Set<string>,
  terminals: Set<string>,
) {
  if (dimension === "terminal") return terminals;
  if (dimension === "unitType") return unitTypes;
  return slugs;
}

function isPremisesCondition(step: JourneyStep) {
  const keys = Object.keys(step.when);
  if (keys.length === 0) return false;
  return keys.every(
    (key) =>
      key === "unitType" ||
      key === "area" ||
      key === "projectOfficerDivision",
  );
}

function matches(
  step: JourneyStep,
  slugs: Set<string>,
  unitTypes: Set<string>,
  terminals: Set<string>,
) {
  const dimensions = Object.entries(step.when);
  if (dimensions.length === 0) return true;
  return dimensions.every(([dimension, needed]) => {
    const have = valuesFor(dimension, slugs, unitTypes, terminals);
    return needed.some((value) => have.has(value));
  });
}

/** Every condition value in the journey, so one project can require the full set. */
function catalogueContext() {
  const slugs = new Set<string>();
  const unitTypes = new Set<string>();
  for (const step of TENANT_PROCESS_STEPS) {
    for (const [dimension, values] of Object.entries(step.when)) {
      if (dimension === "terminal") continue;
      if (dimension === "unitType") {
        for (const value of values) unitTypes.add(value);
      } else {
        for (const value of values) slugs.add(value);
      }
    }
  }
  return { slugs, unitTypes };
}

/** Journey stages use KickOff; the catalogue uses Kickoff. */
function catalogueStage(stage: string) {
  return stage.replace(/KickOff/g, "Kickoff");
}

function journeySource(step: JourneyStep): V26Source {
  return { stage: catalogueStage(step.stage), step: step.name };
}

/**
 * Reader words for the answers that add a step. Terminal is the unit, not the works.
 * Noun phrases only: each one is read as "Required for: <label>".
 */
const REASON_LABEL: Record<string, string> = {
  "facing-travelling-pax": "Passenger-facing shopfront",
  "landside-concessions": "Landside concession unit",
  retail: "Retail unit",
  "f-and-b": "F&B unit",
  duplex: "Duplex unit",
  "change-of-use": "New use or occupancy type",
  "large-scale-renovation": "Major renovation",
  "fire-safety-submission": "Exit or escape route changes",
  "fire-alarm-isolation": "Fire alarm isolation",
  "above-ceiling-works": "Above-ceiling works",
  "roof-works": "Roof works",
  "takeover-from-exiting-tenant": "Takeover from the exiting tenant",
  "fire-protection-detection-works": "Fire protection or detection works",
  "waterproofing-works": "Waterproofing works",
  "structured-cabling": "Structured cabling works",
  "lack-of-perm-meter": "Unit without a permanent meter",
  "ceiling-panel-false-ceiling": "False ceiling",
  "tenant-maintained-ahu": "Tenant-maintained air handling unit",
  "closed-door-rooms": "Enclosed rooms",
  "deep-frying-open-flame": "Deep frying or open flame",
  "gas-supply": "Gas supply",
  "servers-computer-rooms": "Server room",
};

/** Process guide cards that are the same sitting as a Works step. */
export const PROCESS_WORKS_SITTING: Record<string, string> = {
  "staff-systems": "set-up-systems-required-for-staff",
  "pos-setup": "point-of-sales-setup",
};

/** Required-for tags, same words as the Works sitting for this step. */
export function v33ProcessBecause(cardId: string) {
  const journeyId = PROCESS_WORKS_SITTING[cardId];
  const step = TENANT_PROCESS_STEPS.find((row) => row.id === journeyId);
  if (!step) return [];
  const tags: string[] = [];
  for (const needed of Object.values(step.when)) {
    for (const value of needed) {
      tags.push(REASON_LABEL[value] ?? documentLabel(value));
    }
  }
  return tags;
}

function stepReasons(
  step: JourneyStep,
  slugs: Set<string>,
  unitTypes: Set<string>,
  terminals: Set<string>,
) {
  const reasons: string[] = [];
  for (const [dimension, needed] of Object.entries(step.when)) {
    if (dimension === "terminal") continue;
    const have = valuesFor(dimension, slugs, unitTypes, terminals);
    for (const value of needed) {
      if (!have.has(value)) continue;
      reasons.push(REASON_LABEL[value] ?? documentLabel(value));
    }
  }
  return reasons;
}

function toStep(
  step: JourneyStep,
  group: V26DraftStep["group"],
  because: string[] = [],
): V26DraftStep {
  return {
    id: `html-${step.id}`,
    group,
    title: step.name,
    lead: step.description,
    because,
    sources: [journeySource(step)],
  };
}

export function v33ProjectOutcome(work: V26Work, _role: Role, unit: Unit) {
  // v38 projects render blueprint rows only. The old catalogue stays on v37.
  if (usesV38Modules(typeof window === "undefined" ? "" : window.location.pathname)) {
    return { permits: [], steps: [], extraNote: null as string | null };
  }
  const quiz = syncV28Slugs(hydrateV28FromLegacy(work.quiz, unit));
  const slugs = collectSlugs(quiz.answers as Record<string, Answers | undefined>);
  const unitTypes = new Set<string>();
  const use = v28ChoiceValue(quiz, "q1");
  if (use === "retail") unitTypes.add("retail");
  if (use === "fnb-cooking") unitTypes.add("f-and-b");
  if (slugs.has("duplex")) unitTypes.add("duplex");
  const complete = isV33CompleteWork(work);
  if (complete) {
    const all = catalogueContext();
    for (const slug of all.slugs) slugs.add(slug);
    for (const type of all.unitTypes) unitTypes.add(type);
  }
  const terminals = new Set(
    complete ? COMPLETE_TERMINALS : [unit.terminal.toLowerCase()],
  );
  const exit = /reinstat|exit/i.test(v31ProjectTitle(work, unit));
  const noRenovation = !complete && q5IsNoRenovation(quiz);
  const minorFitout = !complete && q5IsMinorFitout(quiz);
  if (noRenovation) {
    return { permits: [], steps: [], extraNote: null as string | null };
  }
  const hit = (step: JourneyStep) => matches(step, slugs, unitTypes, terminals);
  const skipPremises = (step: JourneyStep) =>
    minorFitout && isPremisesCondition(step);

  const steps: V26DraftStep[] = [];
  for (const step of TENANT_PROCESS_STEPS) {
    if (LMS_JOURNEY_ONLY.has(step.id)) continue;
    const why = () => stepReasons(step, slugs, unitTypes, terminals);
    if (exit && !complete) {
      if (step.slot !== "later" || step.phaseId !== "exit" || !hit(step)) continue;
      steps.push(toStep(step, "before", why()));
      continue;
    }
    if (step.slot === "before-pack" && hit(step) && !skipPremises(step)) {
      steps.push(toStep(step, "before", why()));
    }
    if (step.slot === "before-opening" && hit(step) && !skipPremises(step)) {
      steps.push(toStep(step, "after", why()));
    }
    if (complete && step.slot === "later" && hit(step)) {
      steps.push(toStep(step, "after", why()));
    }
  }

  const permits = TENANT_PROCESS_STEPS.filter((step) => step.slot === "permit")
    .filter((step) => {
      if (step.id === RENOVATION_PERMIT) return !exit && !noRenovation;
      if (skipPremises(step)) return false;
      return hit(step);
    })
    .map((step) => step.name);

  if (permits.length > 0) {
    steps.push({
      id: "html-permit-pack",
      group: "application",
      title: "Permit pack",
      lead: "Attach the documents for the permits this work needs.",
      because: [],
    });
    const poi = TENANT_PROCESS_STEPS.find(
      (step) => step.id === PRE_OPENING_INSPECTION,
    );
    if (
      poi &&
      !steps.some((step) => step.id === `html-${PRE_OPENING_INSPECTION}`)
    ) {
      steps.push(toStep(poi, "after"));
    }
  }

  return { permits, steps, extraNote: null as string | null };
}

/** Permit-pack files, plus any journey reference the supporting list does not already name. */
export function v33DocumentChecklist(permits: string[], role: Role) {
  const rows = v26DocumentChecklist(permits, role);
  const seen = new Set(rows.map((row) => `${row.permitName}::${row.doc.name}`));
  for (const step of TENANT_PROCESS_STEPS) {
    if (step.slot !== "permit" || !permits.includes(step.name)) continue;
    for (const id of step.documents) {
      const name = documentLabel(id);
      const key = `${step.name}::${name}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const doc: SupportingDoc = {
        name,
        need: "required",
        supplier: "contractor",
        sources: ["Tenant Process Journey"],
      };
      rows.push({
        permitName: step.name,
        doc,
        need: needLabelCompact(doc.need),
        who: supplierLine(doc.supplier, role),
      });
    }
  }
  return rows;
}

export const V33_REQUIRED_STEPS = "Setup & Approvals";

/** With sittings but nothing to apply for, "Before You Apply" reads wrong. */
export function v33StepsLabel(
  permits: string[] | null | undefined,
  sittings = 0,
) {
  return permits && permits.length === 0 && sittings > 0
    ? V33_REQUIRED_STEPS
    : V33_BEFORE_APPLY;
}

export function v33RailLabels(
  outcome: { permits: string[]; steps: { group: string }[] } | null,
) {
  const sittings = outcome?.steps.filter((step) => step.group === "before").length ?? 0;
  return [
    { id: "answers" as const, label: "Scope of Works" },
    { id: "pack" as const, label: v33StepsLabel(outcome?.permits, sittings) },
    { id: "submit" as const, label: "Permit Application" },
    { id: "next" as const, label: "Pre-opening" },
  ];
}

export function v33PhaseModel(outcome: {
  permits: string[];
  steps: V26DraftStep[];
}) {
  const sittings = outcome.steps.filter((step) => step.group === "before");
  const later = outcome.steps.filter((step) => step.group === "after");
  const hasPermit = outcome.permits.length > 0;
  const bases: { id: "site" | "permits" | "opening"; n: number; short: string; label: string }[] =
    [
      {
        id: "site",
        n: 2,
        short: v33StepsLabel(outcome.permits, sittings.length),
        label: v33StepsLabel(outcome.permits, sittings.length),
      },
      { id: "permits", n: 3, short: "Permit Application", label: "Permit Application" },
      { id: "opening", n: 4, short: "Pre-opening", label: "Pre-opening" },
    ];
  return { sittings, later, hasPermit, bases };
}
