import type { Role } from "@/lib/app-state";
import { UNITS, type PlannedWorkSlug, type Unit } from "@/lib/tenancy-data";
import {
  EMPTY_ANSWERS,
  extraPermitsForSlug,
  isOptionOn,
  MAIN_PERMIT_LABEL,
  quizHasSavedAnswers,
  type QuizState,
} from "@/lib/process-planned-works-quiz";
import { stampV26UnitFacts } from "@/lib/process-v26-quiz";
import { screenerV26Href, V26_WORKS_HREF } from "@/lib/process-v26-preview";
import {
  needLabelCompact,
  supportingDocsFor,
  supplierLine,
  type SupportingDoc,
} from "@/lib/process-permit-supporting-docs";
import type { V26Card, V26Source } from "@/lib/process-v26-guide";

export type V26Work = {
  id: string;
  unitId: string;
  title: string;
  createdAt: string;
  quiz: QuizState;
  /** v35: who created the project. Older rows omit this. */
  contractorId?: string;
  contractorName?: string;
};

export const V26_WORKS_CHANGED = "tempo:v26:works";

function storageKey(unitId: string) {
  return `tempo:v26:works-flat:${unitId}`;
}

function emptyQuiz(): QuizState {
  return {
    status: "idle",
    answers: { ...EMPTY_ANSWERS },
    confirmed: false,
  };
}

function stockWorkId(unitId: string, n: 1 | 2 | 3) {
  return `v26-work-${unitId}-${n}`;
}

function finishQuiz(unit: Unit | undefined, quiz: QuizState): QuizState {
  const next = unit ? stampV26UnitFacts(quiz, unit) : quiz;
  return { ...next, status: "done" };
}

/** First opening reno — few permits (Hot Work + isolation). */
function firstFitOutQuiz(unit: Unit | undefined): QuizState {
  return finishQuiz(unit, {
    status: "done",
    confirmed: false,
    answers: {
      ...EMPTY_ANSWERS,
      unit: { kind: "selected", slugs: ["facing-travelling-pax"] },
      scope: { kind: "selected", slugs: ["large-scale-renovation"] },
      fire: {
        kind: "selected",
        slugs: ["hot-work", "fire-alarm-isolation"],
      },
      structure: { kind: "none" },
      mep: { kind: "none" },
      external: { kind: "none" },
    },
  });
}

/** Later reno — every visible tick on, every Yes, every extra permit this unit can fire. */
function fullPermitQuiz(unit: Unit | undefined): QuizState {
  const unitSlugs: PlannedWorkSlug[] = [
    "facing-travelling-pax",
    "closed-door-rooms",
    "duplex",
    "landside-concessions",
  ];
  if (unit?.zone === "Airside") unitSlugs.push("apron");

  const external: PlannedWorkSlug[] = [
    "structured-cabling",
    "telco-cabling",
    "authority-approval",
  ];
  if (
    unit &&
    (unit.terminal === "T1" || unit.terminal === "T2" || unit.terminal === "T3")
  ) {
    external.push("skytrain-work");
  }
  if (unit?.terminal === "T4") external.push("catwalk-access");

  return finishQuiz(unit, {
    status: "done",
    confirmed: false,
    answers: {
      ...EMPTY_ANSWERS,
      unit: { kind: "selected", slugs: unitSlugs },
      scope: {
        kind: "selected",
        slugs: [
          "large-scale-renovation",
          "change-of-use",
          "additional-renovation-scope",
          "takeover-from-exiting-tenant",
        ],
      },
      fire: {
        kind: "selected",
        slugs: [
          "hot-work",
          "fire-alarm-isolation",
          "fire-protection-detection-works",
          "fire-safety-submission",
        ],
      },
      structure: {
        kind: "selected",
        slugs: ["above-ceiling-works", "roof-works", "structural-works"],
      },
      mep: {
        kind: "selected",
        slugs: ["mep-changes", "waterproofing-works"],
      },
      external: { kind: "selected", slugs: external },
      // Meter radio is inverted: omit lack-of-perm-meter so “already have a meter” is Yes.
      features: {
        kind: "selected",
        slugs: [
          "tenant-maintained-ahu",
          "deep-frying-open-flame",
          "gas-supply",
          "servers-computer-rooms",
          "ceiling-panel-false-ceiling",
        ],
      },
    },
  });
}

function stockWorks(unitId: string): V26Work[] {
  const unit = UNITS.find((row) => row.id === unitId);
  return [
    {
      id: stockWorkId(unitId, 1),
      unitId,
      title: "Works · 10 Feb 2026",
      createdAt: "2026-02-10T09:00:00.000Z",
      quiz: firstFitOutQuiz(unit),
    },
    {
      id: stockWorkId(unitId, 2),
      unitId,
      title: "Works · 18 Mar 2026",
      createdAt: "2026-03-18T09:00:00.000Z",
      quiz: fullPermitQuiz(unit),
    },
  ];
}

/** Leftover empty Jun demo shell — not a real job. Hide and drop it. */
export function isV26EmptyStockSlot(work: V26Work) {
  return work.id === stockWorkId(work.unitId, 3) && !quizHasSavedAnswers(work.quiz);
}

function newId() {
  return `v26-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function readV26Works(unitId: string): V26Work[] {
  try {
    const raw = window.localStorage.getItem(storageKey(unitId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as V26Work[];
    return Array.isArray(parsed)
      ? parsed.filter((row) => row && row.unitId === unitId)
      : [];
  } catch {
    return [];
  }
}

export function writeV26Works(unitId: string, works: V26Work[]) {
  window.localStorage.setItem(storageKey(unitId), JSON.stringify(works));
  window.dispatchEvent(
    new CustomEvent(V26_WORKS_CHANGED, { detail: { unitId } }),
  );
}

export function upsertV26Work(unitId: string, work: V26Work) {
  const rows = readV26Works(unitId);
  const next = rows.some((row) => row.id === work.id)
    ? rows.map((row) => (row.id === work.id ? work : row))
    : [work, ...rows];
  writeV26Works(unitId, next);
  return work;
}

export function deleteV26Work(unitId: string, workId: string) {
  writeV26Works(
    unitId,
    readV26Works(unitId).filter((row) => row.id !== workId),
  );
}

function workTitle(createdAt: string) {
  return `Works · ${new Date(createdAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;
}

export function startV26Work(unitId: string): V26Work {
  const createdAt = new Date().toISOString();
  const work: V26Work = {
    id: newId(),
    unitId,
    title: workTitle(createdAt),
    createdAt,
    quiz: emptyQuiz(),
  };
  upsertV26Work(unitId, work);
  return work;
}

export function resetV26Works(unitId: string) {
  window.localStorage.removeItem(storageKey(unitId));
  seedV26Works(unitId);
}

export function seedV26Works(unitId: string) {
  const seeded = stockWorks(unitId);
  const existing = readV26Works(unitId);
  if (existing.length === 0) {
    writeV26Works(unitId, seeded);
    return seeded;
  }
  const next = existing.filter((row) => !isV26EmptyStockSlot(row));
  let changed = next.length !== existing.length;
  for (const stock of seeded) {
    const current = next.find((row) => row.id === stock.id);
    if (!current) {
      next.push(stock);
      changed = true;
      continue;
    }
    const index = next.findIndex((row) => row.id === stock.id);
    next[index] = stock;
    changed = true;
  }
  if (changed) {
    writeV26Works(unitId, next);
    return next;
  }
  return existing;
}

export function v26WorkStatus(work: V26Work): "empty" | "draft" {
  return quizHasSavedAnswers(work.quiz) ? "draft" : "empty";
}

export type V26PackStatus = "not-started" | "draft-pack" | "ready";

const TITLE_TICKS: { slug: PlannedWorkSlug; label: string }[] = [
  { slug: "hot-work", label: "Hot Work" },
  { slug: "fire-alarm-isolation", label: "Isolation" },
  { slug: "above-ceiling-works", label: "Ceiling" },
  { slug: "mep-changes", label: "M&E" },
  { slug: "structured-cabling", label: "Cabling" },
  { slug: "telco-cabling", label: "Telco" },
  { slug: "authority-approval", label: "Authority" },
  { slug: "additional-renovation-scope", label: "Extra works" },
  { slug: "skytrain-work", label: "Skytrain" },
  { slug: "catwalk-access", label: "Catwalk" },
];

const PERMIT_SLUGS: PlannedWorkSlug[] = TITLE_TICKS.map((row) => row.slug);

function workDateLabel(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function hasPermitTick(work: V26Work) {
  return PERMIT_SLUGS.some((slug) => slugOn(work, slug));
}

export function v26PackStatus(work: V26Work): V26PackStatus {
  if (work.quiz.status === "done" && hasPermitTick(work)) return "ready";
  if (quizHasSavedAnswers(work.quiz) || hasPermitTick(work)) return "draft-pack";
  return "not-started";
}

export function v26WorkStatusLabel(work: V26Work) {
  const status = v26PackStatus(work);
  if (status === "ready") return "Ready to apply";
  if (status === "draft-pack") return "Needs documents";
  return "Not started";
}

export function v26WorkListTitle(work: V26Work) {
  const ticks = TITLE_TICKS.filter((row) => slugOn(work, row.slug));
  const date = workDateLabel(work.createdAt);
  if (ticks.length === 0) return `New work · ${date}`;
  const head = ticks
    .slice(0, 2)
    .map((row) => row.label)
    .join(" + ");
  const rest = ticks.length - 2;
  if (rest > 0) return `${head} + ${rest} more · ${date}`;
  return `${head} · ${date}`;
}

export function v26WorkNextAction(work: V26Work, role: Role) {
  const status = v26PackStatus(work);
  if (status === "ready") {
    return role === "contractor"
      ? "Take this pack to OneCalendar"
      : "Pack is ready for OneCalendar";
  }
  if (status === "draft-pack") {
    return role === "tenant"
      ? "Contractor is preparing the pack"
      : "Screen the pack";
  }
  return role === "tenant"
    ? "Waiting for contractor"
    : "Tick what this work involves";
}

export function v26WorkNeedsYou(work: V26Work) {
  return !isV26EmptyStockSlot(work) && v26PackStatus(work) !== "ready";
}

export function v26WorkToActOn(works: V26Work[]) {
  return (
    [...works]
      .filter(v26WorkNeedsYou)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null
  );
}

/** Bare /screener in the v26 preview opens this work, not a standalone module. */
export function v26ScreenerFallbackHref(unitId: string) {
  seedV26Works(unitId);
  const works = readV26Works(unitId).filter((row) => !isV26EmptyStockSlot(row));
  const withPack = works.filter((row) => v26PackStatus(row) !== "not-started");
  const pick =
    withPack.find((row) => v26WorkNeedsYou(row)) ?? withPack[0] ?? null;
  return pick ? screenerV26Href(pick.id) : V26_WORKS_HREF;
}

function slugOn(work: V26Work, slug: PlannedWorkSlug) {
  return Object.values(work.quiz.answers).some((answer) =>
    isOptionOn(answer, slug),
  );
}

export type V26StepGroup = "before" | "application" | "after";

export type V26DraftStep = {
  id: string;
  group: V26StepGroup;
  title: string;
  lead: string;
  because: string[];
  href?: string;
  sources?: V26Source[];
};

const PERMIT_STAGE = "Permit Application";
const RENO_STAGE = "Renovation";

const SRC = {
  jsi: [{ stage: PERMIT_STAGE, step: "Joint Site Inspection" }],
  review: [
    {
      stage: PERMIT_STAGE,
      step: "Multi-Party Review by Changi Airport Group Stakeholders",
    },
  ],
  qpLetter: [
    {
      stage: PERMIT_STAGE,
      step: "Qualified Person Endorsed Letter of Undertaking",
    },
  ],
  briefing: [
    {
      stage: RENO_STAGE,
      step: "Integrated Facilities Management Pre-Renovation Briefing",
    },
  ],
  site: [{ stage: RENO_STAGE, step: "Renovation Works & Site Monitoring" }],
  waterproof: [
    { stage: RENO_STAGE, step: "Waterproofing Checks & Water Ponding Test" },
  ],
  asbuilt: [{ stage: RENO_STAGE, step: "As-Built Drawings Upload" }],
  defects: [{ stage: RENO_STAGE, step: "Defects Rectification" }],
  poi: [{ stage: RENO_STAGE, step: "Pre-Opening Inspection" }],
} satisfies Record<string, V26Source[]>;

const PERMIT_SOURCE: Record<string, V26Source[]> = {
  [MAIN_PERMIT_LABEL]: [
    { stage: PERMIT_STAGE, step: "Permit Advisory & Tenancy Project Selection" },
  ],
  "Hot Work permit": [{ stage: PERMIT_STAGE, step: "Hotwork Permit" }],
  "Fire alarm isolation permit": [
    {
      stage: PERMIT_STAGE,
      step: "Fire Alarm Isolation / Sprinkler Draining Permit",
    },
  ],
  "Ceiling permit": [{ stage: PERMIT_STAGE, step: "Ceiling Permit" }],
  "MEP changes permit": [{ stage: PERMIT_STAGE, step: "MEP Changes Permit" }],
  "T3 telephone cabling": [
    {
      stage: PERMIT_STAGE,
      step: "Structured Cabling (T3 Tenant Telephone Lines) Permit",
    },
  ],
  "Indoor outdoor cabling": [
    {
      stage: PERMIT_STAGE,
      step: "Structured Cabling Indoor/Outdoor Permit",
    },
  ],
  "Telco cabling permit": [{ stage: PERMIT_STAGE, step: "Telco Cabling Permit" }],
  "T4 catwalk access": [
    { stage: PERMIT_STAGE, step: "Catwalk Access Permit (Terminal 4)" },
  ],
  "Extra renovation permit": [
    { stage: PERMIT_STAGE, step: "Renovation (Terminal – Additional) Permit" },
  ],
  "Skytrain permit": [{ stage: PERMIT_STAGE, step: "Skytrain Permit-To-Work" }],
};

const PERMIT_LEAD: Record<Role, string> = {
  tenant: "Get this renovation permit in OneCalendar.",
  contractor:
    "Upload documents in Application Screener first, then submit in OneCalendar.",
  officer: "Check this renovation permit in OneCalendar.",
};

export function v26DraftStepCard(step: V26DraftStep): V26Card {
  return {
    id: step.id,
    title: step.title,
    kind: "guide",
    sources: step.sources,
    lead: {
      tenant: step.lead,
      contractor: step.lead,
      officer: step.lead,
    },
    href: step.href,
  };
}

export function v26PermitCard(permitName: string): V26Card {
  return {
    id: `permit-${permitName}`,
    title: permitName,
    kind: "guide",
    sources: PERMIT_SOURCE[permitName],
    lead: PERMIT_LEAD,
  };
}

export const V26_GROUP_LABEL: Record<V26StepGroup, string> = {
  before: "Before application",
  application: "In the application",
  after: "After submission",
};

/** Same sentence as FACT for that card in process-v28-voice.ts. */
function sameLead(line: string): Record<Role, string> {
  return { tenant: line, contractor: line, officer: line };
}

const STEP_LEAD: Record<string, Record<Role, string>> = {
  jsi: sameLead(
    "Confirm fire isolation needs before that permit can be approved.",
  ),
  hot: sameLead(
    "Get approval for welding, cutting, grinding, or an open flame.",
  ),
  fai: sameLead(
    "Get approval to isolate alarms or drain sprinklers for this work.",
  ),
  apply: sameLead("Submit this renovation's Permit to Work."),
  review: sameLead("Check the pack before the Permit to Work is issued."),
  qpLetter: sameLead("Cover leftover items kept from the previous tenant."),
  briefing: sameLead("Brief the site rules before work starts."),
  site: sameLead("Run this renovation under the Permit to Work."),
  waterproof: sameLead("Check waterproofing on a wet area."),
  asbuilt: sameLead("File the finished drawings for this renovation."),
  defects: sameLead("Clear the items CAG raises before the unit opens."),
  poi: sameLead("Check the unit before it opens."),
};

export function v26DraftOutcome(
  work: V26Work,
  role: Role,
  unit: Unit,
): {
  permits: string[];
  steps: V26DraftStep[];
  extraNote: string | null;
} {
  const hot = slugOn(work, "hot-work");
  const fai = slugOn(work, "fire-alarm-isolation");
  const extras: string[] = [];
  const seen = new Set<string>();
  for (const slug of PERMIT_SLUGS) {
    if (!slugOn(work, slug)) continue;
    for (const name of extraPermitsForSlug(slug, unit)) {
      if (seen.has(name)) continue;
      seen.add(name);
      extras.push(name);
    }
  }
  const permits =
    extras.length > 2 ? [MAIN_PERMIT_LABEL, ...extras] : extras;

  const steps: V26DraftStep[] = [];

  if (fai) {
    steps.push({
      id: "jsi",
      group: "before",
      title: "Joint site inspection",
      lead: STEP_LEAD.jsi[role],
      because: ["Work that could set off or isolate alarms"],
      sources: SRC.jsi,
    });
    steps.push({
      id: "fai",
      group: "application",
      title: "Fire alarm isolation permit",
      lead: STEP_LEAD.fai[role],
      because: ["Work that could set off or isolate alarms"],
    });
  }

  if (hot) {
    steps.push({
      id: "hot",
      group: "application",
      title: "Hot Work permit",
      lead: STEP_LEAD.hot[role],
      because: ["Welding, cutting, grinding, or an open flame"],
    });
  }

  if (permits.length > 0) {
    steps.push({
      id: "apply",
      group: "application",
      title: "Permit application",
      lead: STEP_LEAD.apply[role],
      because: permits,
      href: screenerV26Href(work.id),
    });
    steps.push({
      id: "review",
      group: "after",
      title: "Review and issue",
      lead: STEP_LEAD.review[role],
      because: ["Submit through OneCalendar"],
      sources: SRC.review,
    });
    if (slugOn(work, "takeover-from-exiting-tenant")) {
      steps.push({
        id: "qp-letter",
        group: "after",
        title: "Qualified Person endorsed letter of undertaking",
        lead: STEP_LEAD.qpLetter[role],
        because: ["Keeping leftover items from the previous tenant"],
        sources: SRC.qpLetter,
      });
    }
    steps.push({
      id: "briefing",
      group: "after",
      title: "IFM pre-renovation briefing",
      lead: STEP_LEAD.briefing[role],
      because: ["Before works begin"],
      sources: SRC.briefing,
    });
    steps.push({
      id: "site",
      group: "after",
      title: "Renovation works & site monitoring",
      lead: STEP_LEAD.site[role],
      because: ["Permit to Work issued"],
      sources: SRC.site,
    });
    if (slugOn(work, "waterproofing-works")) {
      steps.push({
        id: "waterproof",
        group: "after",
        title: "Waterproofing checks & water ponding test",
        lead: STEP_LEAD.waterproof[role],
        because: ["Wet area that could affect waterproofing"],
        sources: SRC.waterproof,
      });
    }
    if (role === "contractor") {
      steps.push({
        id: "asbuilt",
        group: "after",
        title: "As-built drawings upload",
        lead: STEP_LEAD.asbuilt.contractor,
        because: ["Close-out of this work"],
        sources: SRC.asbuilt,
      });
      steps.push({
        id: "defects",
        group: "after",
        title: "Defects rectification",
        lead: STEP_LEAD.defects.contractor,
        because: ["Before opening checks"],
        sources: SRC.defects,
      });
    }
    steps.push({
      id: "poi",
      group: "after",
      title: "Pre-Opening Inspection",
      lead: STEP_LEAD.poi[role],
      because: ["Pass inspection with IFM and AES"],
      sources: SRC.poi,
    });
  }

  const other = [
    "roof-works",
    "structural-works",
    "waterproofing-works",
  ].some((slug) => slugOn(work, slug as PlannedWorkSlug));

  return {
    permits,
    steps,
    extraNote:
      other && permits.length === 0
        ? "No extra permit from these answers yet."
        : null,
  };
}

export type V26ChecklistDoc = {
  permitName: string;
  doc: SupportingDoc;
  need: string;
  who: string;
};

export function v26DocumentChecklist(
  permits: string[],
  role: Role,
): V26ChecklistDoc[] {
  return permits.flatMap((permitName) =>
    supportingDocsFor(permitName).docs.map((doc) => ({
      permitName,
      doc,
      need: needLabelCompact(doc.need),
      who: supplierLine(doc.supplier, role),
    })),
  );
}

export function canFillV26Work(role: Role) {
  return role === "contractor" || role === "officer";
}

export function canStartV26Work(role: Role) {
  return role === "contractor" || role === "officer";
}
