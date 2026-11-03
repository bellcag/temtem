import type { Role } from "@/lib/app-state";
import type { Unit } from "@/lib/tenancy-data";
import {
  v26DocumentChecklist,
  v26DraftOutcome,
  v26WorkListTitle,
  type V26Work,
} from "@/lib/process-v26-works";
import { quizIsConfirmed } from "@/lib/process-planned-works-quiz";
import { hydrateV28FromLegacy, v28QuizProgress } from "@/lib/process-v28-quiz";
import {
  docAttachKey,
  readV28Attachments,
  readV28Screen,
  readV28Submitted,
  V28_APPLY_STEPS,
  type V28ApplyStep,
} from "@/lib/process-v28-screener";
import { V28_WORK_TABS, type V28PackPhase } from "@/lib/process-v28-voice";
import { usesV37Cut } from "@/lib/process-v31-preview";
import {
  isV31Complete,
  readV31Closes,
  v31Outcome,
  v31ProjectTitle,
  v31RailLabels,
  v31StepStatus,
} from "@/lib/process-v31-works";
import {
  v33DocumentChecklist,
  v33ProjectOutcome,
  v33RailLabels,
} from "@/lib/process-v33-feed";

export type V28ChipTone =
  | "draft"
  | "progress"
  | "action"
  | "issue"
  | "ready"
  | "quiet";

export type V28WorkReadiness = {
  title: string;
  started: string;
  chip: string;
  tone: V28ChipTone;
  nextMove: string;
  countLabel: string;
  gatesDone: number;
  gatesTotal: number;
  showBar: boolean;
  needsYou: boolean;
  /** The one stretch to do now. Later stretches stay on the page as what comes next. */
  focus: "quiz" | V28PackPhase;
  /** Same steps as the work stepper. */
  step: V28RailId;
  applyTo?: V28ApplyStep;
  /** v34: the specific next move, kept when `nextMove` is the generic in-progress line. */
  stepMove?: string;
  /** v34: steps have no tick-off, so the status never waits on them. */
  stepsUntracked?: boolean;
  /** v31 builds this from the answers. v28 keeps the fixed rail. */
  railLabels?: { id: V28RailId; label: string }[];
  /** v33 reads the Tenant Process Journey catalogue. */
  catalogue?: "v33";
};

/** The work page stepper. Home progress uses this list, not a separate count. */
export const V28_WORK_RAIL: { id: V28RailId; label: string }[] = [
  { id: "answers", label: V28_WORK_TABS.answers },
  { id: "pack", label: V28_WORK_TABS.pack },
  { id: "submit", label: "Submit the permit" },
  { id: "next", label: "Next steps" },
];

export type V28RailId = "answers" | "pack" | "submit" | "next";

export type V28RailStatus = "done" | "current" | "open" | "locked";

export type V28WorkRail = {
  steps: { id: V28RailId; label: string; status: V28RailStatus }[];
  showing: V28RailId;
  hereIndex: number;
  openThrough: number;
  /** "Step 2 of 4" */
  position: string;
  /** Current step name, or the submit part when one is open. */
  detail: string;
};

/** Where the work stepper is. Same lock and “you are here” rules as the work page. */
export function v28WorkRail(input: {
  quizLocked: boolean;
  submitted: boolean;
  requested: V28RailId;
  partLabel?: string;
  /** Defaults to the v28 labels. v31 passes its own list. */
  labels?: { id: V28RailId; label: string }[];
}): V28WorkRail {
  const railSteps = input.labels ?? V28_WORK_RAIL;
  const submitIndex = railSteps.findIndex((row) => row.id === "submit");
  const openThrough = !input.quizLocked
    ? 0
    : input.submitted
      ? railSteps.length - 1
      : submitIndex < 0
        ? 0
        : submitIndex;
  const found = railSteps.findIndex((row) => row.id === input.requested);
  const requestedIndex = found < 0 ? openThrough : found;
  const hereIndex = requestedIndex > openThrough ? 0 : requestedIndex;
  const showing = railSteps[hereIndex].id;
  const here = railSteps[hereIndex];
  const steps = railSteps.map((row, index) => {
    const locked = index > openThrough;
    const done = index < hereIndex && !locked;
    const status: V28RailStatus = locked
      ? "locked"
      : done
        ? "done"
        : index === hereIndex
          ? "current"
          : "open";
    return { id: row.id, label: row.label, status };
  });
  return {
    steps,
    showing,
    hereIndex,
    openThrough,
    position: `Step ${hereIndex + 1} of ${railSteps.length}`,
    detail:
      here.id === "submit" && input.partLabel ? input.partLabel : here.label,
  };
}

/** Stepper for this work’s real position, the view you land on from Home. */
export function v28WorkRailFromReady(
  ready: Pick<V28WorkReadiness, "step" | "applyTo">,
  labels?: { id: V28RailId; label: string }[],
): V28WorkRail {
  const railLabels = labels ?? ready.railLabels;
  return v28WorkRail({
    quizLocked: ready.step !== "answers",
    submitted: ready.step === "next",
    requested: ready.step,
    partLabel:
      railLabels || !(ready.step === "submit" && ready.applyTo)
        ? undefined
        : V28_APPLY_STEPS.find((row) => row.id === ready.applyTo)?.label,
    labels: railLabels,
  });
}

export function v28WorkHref(
  worksHref: string,
  workId: string,
  ready: Pick<V28WorkReadiness, "step" | "applyTo">,
) {
  const params = new URLSearchParams();
  params.set("work", workId);
  if (ready.step === "answers") params.set("tab", "answers");
  else if (ready.step === "next") params.set("tab", "next");
  else if (ready.step === "submit") {
    params.set("tab", "pack");
    params.set("apply", ready.applyTo ?? "checklist");
  } else params.set("tab", "pack");
  return `${worksHref}?${params.toString()}`;
}

function startedLabel(iso: string) {
  const date = new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `Started ${date}`;
}

function workTitle(work: V26Work) {
  if (work.title && !work.title.startsWith("Works ·")) return work.title;
  const dated = v26WorkListTitle(work);
  const date = new Date(work.createdAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const suffix = ` · ${date}`;
  return dated.endsWith(suffix) ? dated.slice(0, -suffix.length) : dated;
}

function v31Readiness(
  ready: V28WorkReadiness,
  steps: { id: string; group: string; title: string }[],
  work: V26Work,
  unit: Unit,
  labels?: { id: V28RailId; label: string }[],
): V28WorkReadiness {
  const railLabels = labels ?? v31RailLabels(steps);
  const listed = railLabels.some((row) => row.id === ready.step);
  let step = listed ? ready.step : railLabels[railLabels.length - 1].id;
  let chip = v31StepStatus(step, railLabels);
  const waiting = ready.nextMove.startsWith("Waiting");
  let nextMove = ready.nextMove
    .replace(
      "Do these steps, then submit the permit",
      "Do these steps, then apply for the permit",
    )
    .replace("Take this pack to OneCalendar", "Download the zip for OneCalendar")
    .replace(
      "Complete the checks before this unit opens",
      "Prepare the checks before opening",
    );
  const before = steps.filter((row) => row.group === "before");
  const closes = readV31Closes(work.unitId, work.id);
  const beforeDone =
    before.length === 0 ||
    before.every((row) => closes[row.id]?.status === "done");
  if (steps.length === 0 && ready.step !== "answers") {
    nextMove = "Nothing to apply for from these answers.";
  } else if (step === "pack" && before.length > 0 && !beforeDone) {
    const name =
      before.length === 1 ? before[0].title.toLowerCase() : "these steps";
    nextMove = waiting
      ? `Waiting for the contractor to confirm the ${name}.`
      : before.length === 1
        ? `Confirm the ${name} when it is done.`
        : "Confirm each step when it is done.";
  } else if (
    step === "pack" &&
    before.length > 0 &&
    beforeDone &&
    railLabels.some((row) => row.id === "submit")
  ) {
    step = "submit";
    chip = v31StepStatus(step, railLabels);
    nextMove = waiting
      ? "Waiting for the contractor to add the permit files."
      : "Add the permit files";
  }
  return {
    ...ready,
    title: v31ProjectTitle(work, unit),
    step,
    chip,
    nextMove,
    railLabels,
  };
}

export function v28WorkReadiness(
  work: V26Work,
  unit: Unit,
  role: Role,
  edition: "v28" | "v31" | "v33" | "v34" | "v35" = "v28",
): V28WorkReadiness {
  const usesV33Feed = edition === "v33" || edition === "v34" || edition === "v35";
  const chrome = usesV33Feed ? "v31" : edition;
  const v33Outcome = usesV33Feed
    ? v33ProjectOutcome(work, role, unit)
    : null;
  const body = v28WorkReadinessBody(
    work,
    unit,
    role,
    chrome,
    v33Outcome?.permits,
    v33Outcome?.steps.some((row) => row.group === "before"),
  );
  const ready = v33Outcome
    ? {
        ...v31Readiness(
          body,
          v33Outcome.steps,
          work,
          unit,
          v33RailLabels(v33Outcome),
        ),
        catalogue: "v33" as const,
      }
    : edition === "v31"
      ? v31Readiness(body, v31Outcome(work, role, unit).steps, work, unit)
      : body;
  const v34Submitted = edition === "v34" && ready.step === "next";
  const v37Complete =
    edition === "v35" &&
    typeof window !== "undefined" &&
    usesV37Cut(window.location.pathname) &&
    (isV31Complete(work.unitId, work.id) ||
      (readV28Screen(unit.id, work.id).result === "pass" &&
        readV28Submitted(unit.id, work.id)));
  if (
    (edition !== "v35" || v37Complete) &&
    chrome === "v31" &&
    (v34Submitted || v37Complete || isV31Complete(work.unitId, work.id))
  ) {
    return {
      ...ready,
      chip: "Complete",
      tone: "ready",
      nextMove:
        edition === "v34"
          ? "This project is closed."
          : "This project is complete.",
      needsYou: false,
    };
  }
  if ((edition === "v34" || edition === "v35") && ready.step === "answers") {
    return { ...ready, stepsUntracked: true };
  }
  if (edition === "v35" && ready.chip === "No permits") {
    return { ...ready, stepsUntracked: true };
  }
  if (edition === "v34" || edition === "v35") {
    const toPermit =
      edition === "v34" &&
      ready.step === "pack" &&
      ready.chip !== "No permits" &&
      (v33Outcome?.permits.length ?? 0) > 0 &&
      !/nothing to apply/i.test(ready.nextMove) &&
      ready.railLabels?.some((row) => row.id === "submit");
    return {
      ...ready,
      ...(toPermit
        ? {
            step: "submit" as const,
            applyTo: "checklist" as const,
            stepMove: "Upload the supporting documents",
          }
        : { stepMove: ready.nextMove }),
      ...(edition === "v35"
        ? {}
        : {
            chip: "In progress",
            tone: "progress" as const,
            nextMove: "This project is in progress.",
          }),
      stepsUntracked: true,
      needsYou:
        /screening the submission pack/i.test(ready.nextMove)
          ? false
          : role === "contractor",
    };
  }
  return ready;
}

function v28WorkReadinessBody(
  work: V26Work,
  unit: Unit,
  role: Role,
  edition: "v28" | "v31",
  /** v33 permit names, so files are counted where the v33 page attaches them. */
  v33Permits?: string[],
  v33Before?: boolean,
): V28WorkReadiness {
  const quiz = hydrateV28FromLegacy(work.quiz, unit);
  const progress = v28QuizProgress(quiz);
  const quizDone = progress.total > 0 && progress.answered >= progress.total;
  const locked = quizIsConfirmed(quiz);
  const outcome = v26DraftOutcome(work, role, unit);
  const docs = v33Permits
    ? v33DocumentChecklist(v33Permits, role)
    : v26DocumentChecklist(outcome.permits, role);
  const required = docs.filter((row) => row.need === "Required");
  const attachments = readV28Attachments(unit.id, work.id);
  const attachedRequired = required.filter(
    (row) => attachments[docAttachKey(row.permitName, row.doc.name)],
  ).length;
  const hasPack = required.length > 0;
  const filesOn = hasPack && attachedRequired >= required.length;
  const screen = readV28Screen(unit.id, work.id);
  const passed = screen.result === "pass";
  const submitted = passed && readV28Submitted(unit.id, work.id);
  const issues = screen.result === "issues" || screen.result === "error";
  const started = startedLabel(work.createdAt);
  const title = workTitle(work);
  const waiting = edition === "v31" ? role !== "contractor" : role === "tenant";
  if (!quizDone) {
    return {
      title,
      started,
      chip: "To answer",
      tone: "draft",
      nextMove:
        waiting
          ? "Waiting for the contractor to finish the questionnaire"
          : "Finish the questionnaire",
      countLabel: `${progress.answered} of ${progress.total} answered`,
      gatesDone: 0,
      gatesTotal: 3,
      showBar: true,
      needsYou: !waiting,
      focus: "quiz",
      step: "answers",
    };
  }

  if (!locked) {
    return {
      title,
      started,
      chip: "To confirm",
      tone: "action",
      nextMove:
        waiting
          ? "Waiting for the contractor to confirm the questionnaire"
          : "Confirm the questionnaire",
      countLabel: `${progress.answered} of ${progress.total} answered`,
      gatesDone: 0,
      gatesTotal: 3,
      showBar: true,
      needsYou: !waiting,
      focus: "quiz",
      step: "answers",
    };
  }

  if (!hasPack) {
    return {
      title,
      started,
      chip: "No permits",
      tone: "quiet",
      nextMove: "Nothing to take to OneCalendar",
      countLabel: "Questionnaire done",
      gatesDone: 1,
      gatesTotal: 1,
      showBar: false,
      needsYou: false,
      focus: "application",
      step: "pack",
    };
  }

  const hasBefore =
    v33Before ?? outcome.steps.some((row) => row.group === "before");
  const onPermits = hasBefore && attachedRequired === 0 && !passed;

  if (submitted) {
    return {
      title,
      started,
      chip: "Next steps",
      tone: "progress",
      nextMove: "Complete the checks before this unit opens",
      countLabel: `${attachedRequired} of ${required.length} documents`,
      gatesDone: 3,
      gatesTotal: 3,
      showBar: false,
      needsYou: true,
      focus: "after",
      step: "next",
    };
  }

  if (onPermits) {
    return {
      title,
      started,
      chip: "Permits and steps",
      tone: "action",
      nextMove:
        waiting
          ? "Waiting for the contractor to finish the steps before the permit"
          : "Do these steps, then submit the permit",
      countLabel: "Steps before the permit",
      gatesDone: 1,
      gatesTotal: 3,
      showBar: true,
      needsYou: !waiting,
      focus: "before",
      step: "pack",
    };
  }

  if (!filesOn) {
    return {
      title,
      started,
      chip: "Submit the permit",
      tone: "progress",
      nextMove:
        waiting
          ? "Waiting for the contractor to upload the supporting documents"
          : "Upload the supporting documents",
      countLabel: `${attachedRequired} of ${required.length} documents`,
      gatesDone: 1,
      gatesTotal: 3,
      showBar: true,
      needsYou: !waiting,
      focus: "application",
      step: "submit",
      applyTo: attachedRequired > 0 ? "upload" : "checklist",
    };
  }

  const screeningPack =
    typeof window !== "undefined" &&
    usesV37Cut(window.location.pathname) &&
    screen.result === "running";
  if (screeningPack) {
    return {
      title,
      started,
      chip: "Screening in Progress",
      tone: "progress",
      nextMove: "The system is screening the submission pack",
      countLabel: `${attachedRequired} of ${required.length} documents`,
      gatesDone: 2,
      gatesTotal: 3,
      showBar: true,
      needsYou: false,
      focus: "application",
      step: "submit",
      applyTo: "screen",
    };
  }

  if (!passed) {
    return {
      title,
      started,
      chip: issues ? "Issues" : "Submit the permit",
      tone: issues ? "issue" : "action",
      nextMove:
        waiting
          ? issues
            ? "Waiting for the contractor to fix the screening issues"
            : "Waiting for the contractor to screen the files"
          : issues
            ? "Fix the screening issues"
            : "Screen the files",
      countLabel: `${attachedRequired} of ${required.length} documents`,
      gatesDone: 2,
      gatesTotal: 3,
      showBar: true,
      needsYou: !waiting,
      focus: "application",
      step: "submit",
      applyTo: "screen",
    };
  }

  return {
    title,
    started,
    chip: "Submit the permit",
    tone: "ready",
    nextMove:
      waiting
        ? "Waiting for the contractor to submit the permit"
        : "Take this pack to OneCalendar",
    countLabel: `${attachedRequired} of ${required.length} documents`,
    gatesDone: 3,
    gatesTotal: 3,
    showBar: true,
    needsYou: !waiting,
    focus: "application",
    step: "submit",
    applyTo: "results",
  };
}
