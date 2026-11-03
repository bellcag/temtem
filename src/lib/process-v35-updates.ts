import { V26_PHASES, type V26PhaseId } from "@/lib/process-v26-guide";

/**
 * One step a document change affects.
 * `note` is the short rule. It starts in lower case unless it opens with a name.
 */
export type V35StepChange = {
  step: string;
  note: string;
  /** When set, this change is a lead time and uses the blue SLA banner. */
  sla?: string;
  /**
   * Journey banner sentence. `{doc}` is replaced by a link to the revised document.
   * Falls back to `note` when missing.
   */
  brief?: string;
};

/**
 * A revised document and the journey steps that change actually touches.
 * `on` is the date it takes effect (YYYY-MM-DD).
 * Add a row here whenever a document changes. Steps, phase dots, and Home counts all follow.
 * Do not mark a later phase just because the same rule could apply there.
 */
export type V35DocChange = { doc: string; on: string; steps: V35StepChange[] };

export const V35_DOC_CHANGES: V35DocChange[] = [
  {
    doc: "doc-design",
    on: "2026-10-09",
    steps: [
      {
        step: "design-pack",
        note: "shopfront drawings follow the revised Section 4.",
        brief: "shopfront drawings must follow Section 4 of the revised {doc}.",
      },
    ],
  },
  {
    doc: "doc-renovation",
    on: "2026-10-06",
    steps: [
      {
        step: "opening-works",
        note: "airside hoarding follows the revised dust-control standards.",
        brief: "airside hoarding must meet the dust-control standards in the revised {doc}.",
      },
    ],
  },
  {
    doc: "doc-fire",
    on: "2026-10-02",
    steps: [
      {
        step: "opening-works",
        sla: "5 working days before hot work",
        note: "this was 3 working days.",
        brief: "hot work now needs 5 working days' notice, up from 3, as set out in the revised {doc}.",
      },
    ],
  },
  {
    doc: "doc-cof",
    on: "2026-09-28",
    steps: [
      {
        step: "fire-declaration",
        note: "the yearly fire declaration follows the calendar year.",
        brief: "the declaration window now follows the calendar year, as set out in the revised {doc}.",
      },
    ],
  },
];

/**
 * How long a policy change stays visible: 3 calendar months from its effective
 * date (`on`). There is no dismiss control. The journey banner, the step
 * notices, and the Home counts all use this window and leave together.
 * Do not replace it with a close button or a saved "seen" flag.
 */
export const V35_UPDATED_MONTHS = 3;

function isFresh(on: string, now: Date) {
  const start = new Date(`${on}T00:00:00`);
  if (Number.isNaN(start.getTime())) return false;
  const end = new Date(start);
  end.setMonth(end.getMonth() + V35_UPDATED_MONTHS);
  return now.getTime() >= start.getTime() && now.getTime() < end.getTime();
}

/** "9 Oct 2026", the date format used in a with-effect-from notice. */
export function v35EffectiveDate(on: string) {
  return new Date(`${on}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** A change on one step, with the document it came from. */
export type V35StepUpdate = {
  on: string;
  note: string;
  doc: string;
  sla?: string;
  brief?: string;
};

function freshChanges(now: Date) {
  return V35_DOC_CHANGES.filter((change) => isFresh(change.on, now));
}

/** Changes on this step still inside the window, newest first. */
export function v35StepUpdates(id: string, now = new Date()): V35StepUpdate[] {
  const rows: V35StepUpdate[] = [];
  for (const change of freshChanges(now)) {
    for (const row of change.steps) {
      if (row.step === id) {
        rows.push({
          on: change.on,
          note: row.note,
          doc: change.doc,
          sla: row.sla,
          brief: row.brief,
        });
      }
    }
  }
  return rows.sort((a, b) => b.on.localeCompare(a.on));
}

/** Steps this document changes, still inside the window. */
export function v35DocStepCount(doc: string, now = new Date()) {
  const change = freshChanges(now).find((row) => row.doc === doc);
  return change ? new Set(change.steps.map((row) => row.step)).size : 0;
}

/** Revised documents still inside the window, newest first. */
export function v35FreshDocIds(now = new Date()) {
  return [...freshChanges(now)]
    .sort((a, b) => b.on.localeCompare(a.on))
    .map((row) => row.doc);
}

export type V35FreshStep = {
  id: string;
  title: string;
  phase: V26PhaseId;
  chapter: string;
  on: string;
  docs: string[];
};

/** Changed steps still inside the window, newest first. */
export function v35FreshSteps(now = new Date()): V35FreshStep[] {
  const rows: V35FreshStep[] = [];
  for (const phase of V26_PHASES) {
    for (const chapter of phase.chapters) {
      for (const card of chapter.cards) {
        const updates = v35StepUpdates(card.id, now);
        if (updates.length === 0) continue;
        rows.push({
          id: card.id,
          title: card.title,
          phase: phase.id,
          chapter: chapter.id,
          on: updates[0].on,
          docs: [...new Set(updates.map((row) => row.doc))],
        });
      }
    }
  }
  return rows.sort((a, b) => b.on.localeCompare(a.on));
}

export type V35FreshDoc = { doc: string; on: string; steps: string[] };

/** Revised documents still inside the window, newest first, with the steps each one changes. */
export function v35FreshDocRows(now = new Date()): V35FreshDoc[] {
  const titles = new Map(v35FreshSteps(now).map((step) => [step.id, step.title]));
  return [...freshChanges(now)]
    .sort((a, b) => b.on.localeCompare(a.on))
    .map((change) => ({
      doc: change.doc,
      on: change.on,
      steps: [...new Set(change.steps.map((row) => row.step))]
        .map((id) => titles.get(id))
        .filter((title): title is string => Boolean(title)),
    }));
}

/** Steps changed inside the window, across every phase. */
export function v35UpdatedStepCount(now = new Date()) {
  return v35FreshSteps(now).length;
}

function newestPhaseUpdate(id: V26PhaseId, now: Date) {
  return v35FreshSteps(now).find((row) => row.phase === id);
}

/** Newest step change in this phase still inside the window, or undefined. */
export function v35PhaseUpdatedOn(id: V26PhaseId, now = new Date()) {
  return newestPhaseUpdate(id, now)?.on;
}

/** Chapter that holds that newest change, so a tap opens the detail. */
export function v35PhaseUpdatedChapter(id: V26PhaseId, now = new Date()) {
  return newestPhaseUpdate(id, now)?.chapter;
}
