import type { Role } from "@/lib/app-state";
import type { Unit } from "@/lib/tenancy-data";
import type { V26Work } from "@/lib/process-v26-works";
import {
  v31Outcome,
  v31PrepareSteps,
} from "@/lib/process-v31-works";
import {
  V33_REQUIRED_STEPS,
  v33PhaseModel,
  v33ProjectOutcome,
} from "@/lib/process-v33-feed";
import { usesV37Cut } from "@/lib/process-v31-preview";
import {
  type V28ChipTone,
  type V28RailId,
  type V28WorkReadiness,
} from "@/lib/process-v28-readiness";

export type V31PhaseId = "site" | "permits" | "opening";

export type V31PhaseBase = {
  id: V31PhaseId;
  n: number;
  short: string;
  label: string;
};

/** `system`: the system is working and nobody needs to act (v37 screening). */
export type V31ChipTone = V28ChipTone | "system";

export const V31_CHIP_TONE: Record<V31ChipTone, string> = {
  draft: "bg-grey-75 text-grey-700",
  progress: "bg-purple-100 text-purple-700",
  action: "bg-warning-100 text-warning-800",
  issue: "bg-error-200 text-error-600",
  ready: "bg-success-100 text-success-600",
  quiet: "bg-grey-50 text-grey-600",
  system: "bg-blue-200 text-blue-700",
};

export const V31_DOT_TONE: Record<V31ChipTone, string> = {
  draft: "text-grey-400",
  progress: "text-purple-600",
  action: "text-warning-600",
  issue: "text-error-600",
  ready: "text-success-600",
  quiet: "text-grey-300",
  system: "text-blue-600",
};

/** Colour the waiting chip from the note (flagged / passed), not the waiting line. */
export function v31WaitingChipTone(
  detail: string | undefined,
  tone: V31ChipTone,
): V28ChipTone {
  const text = (detail ?? "").toLowerCase();
  if (tone === "issue" || text.includes("flagged")) return "issue";
  if (text.includes("passed") || text.includes("ready to confirm")) return "ready";
  return "quiet";
}

export function v31PhaseModel(
  outcome: NonNullable<ReturnType<typeof v31Outcome>>,
) {
  const sittings = v31PrepareSteps(outcome.steps);
  const later = outcome.steps.filter(
    (step) => step.group === "after" && step.id !== "review",
  );
  const hasPermit = outcome.steps.some(
    (step) => step.group === "application" || step.group === "after",
  );
  const bases: V31PhaseBase[] = [
    { id: "site", n: 2, short: "Pre-application", label: "Pre-application" },
    { id: "permits", n: 3, short: "Permit Application", label: "Permit Application" },
    { id: "opening", n: 4, short: "Pre-opening", label: "Pre-opening" },
  ];
  return { sittings, later, hasPermit, bases };
}

export function v31ListPhase(
  bases: V31PhaseBase[],
  step: V28RailId,
): V31PhaseId {
  const ids = new Set(bases.map((row) => row.id));
  if (step === "next" && ids.has("opening")) return "opening";
  if (step === "submit" && ids.has("permits")) return "permits";
  if (step === "pack" && ids.has("site")) return "site";
  if (ids.has("permits")) return "permits";
  return bases[0]?.id ?? "permits";
}

function parseCount(label?: string) {
  const match = label?.match(/(\d+)\s+of\s+(\d+)/);
  if (!match) return null;
  return { done: Number(match[1]), total: Number(match[2]) };
}

function waitingOn(nextMove: string) {
  const who = nextMove.match(/for the (contractor|tenant|project officer)/i)?.[1];
  if (!who) return "Waiting on Someone Else";
  return who.toLowerCase() === "project officer"
    ? "Waiting on Project Officer"
    : `Waiting on ${who.charAt(0).toUpperCase()}${who.slice(1).toLowerCase()}`;
}

function v33StepsName(ready: V28WorkReadiness) {
  const label = ready.railLabels?.find((row) => row.id === "pack")?.label;
  return label === V33_REQUIRED_STEPS ? V33_REQUIRED_STEPS : "Steps Before You Apply";
}

export function v31RowCue(
  ready: V28WorkReadiness,
  phase: V31PhaseId | null,
  role?: Role,
): { action: string; detail?: string; tone: V31ChipTone } {
  if (ready.nextMove.startsWith("Waiting")) {
    const move = ready.nextMove.toLowerCase();
    const status = (detail: string) => ({
      action: waitingOn(ready.nextMove),
      detail,
      tone: "quiet" as const,
    });
    if (move.includes("upload") || move.includes("add the permit")) {
      return status("Documents to Upload");
    }
    if (move.includes("submit") || move.includes("onecalendar")) {
      return status("Documents Passed");
    }
    if (move.includes("fix")) return status("Documents Flagged");
    if (move.includes("screen")) return status("Documents to Screen");
    if (move.includes("joint site") || move.includes("inspection")) {
      return status("Joint Site Inspection Due");
    }
    if (move.includes("questionnaire") && move.includes("finish")) {
      const notStarted =
        ready.stepsUntracked && (parseCount(ready.countLabel)?.done ?? 0) === 0;
      return status(notStarted ? "Questions Not Answered Yet" : "Scope in Progress");
    }
    if (move.includes("confirm") && ready.step === "answers") {
      return status("Scope Ready to Confirm");
    }
    if (move.includes("finish") || ready.step === "pack") {
      return status(
        ready.catalogue === "v33"
          ? `${v33StepsName(ready)} Open`
          : "Pre-application Steps Open",
      );
    }
    return status("Next Step Is With Someone Else");
  }
  if (ready.chip === "Complete") {
    return { action: "Completed", detail: "All Milestones Done", tone: "ready" };
  }
  if (
    /nothing to apply/i.test(ready.stepMove ?? ready.nextMove) ||
    ready.chip === "No permits"
  ) {
    return {
      action: "No Permit Needed",
      detail: "Nothing to Apply For",
      tone: "quiet",
    };
  }
  if (ready.step === "answers") {
    const confirm = /confirm/i.test(ready.nextMove);
    const count = parseCount(ready.countLabel);
    const started = (count?.done ?? 0) > 0;
    const progress = ready.countLabel?.replace(/\s*answered$/i, "") ?? "";
    return {
      action: confirm
        ? "Confirm Scope"
        : started
          ? "Continue Scope"
          : "Start Scope",
      detail: confirm
        ? "Ready to Confirm"
        : started
          ? `${progress} answered`
          : "Not Started",
      tone: confirm ? "action" : started ? "progress" : "draft",
    };
  }
  const v37 =
    typeof window !== "undefined" && usesV37Cut(window.location.pathname);
  if (v37) {
    const move = (ready.stepMove ?? ready.nextMove).toLowerCase();
    if (move.includes("screening the submission pack")) {
      return {
        action: "Screening in Progress",
        detail: "The system is checking the documents",
        tone: "system",
      };
    }
    if (move.includes("fix")) {
      return {
        action: "Fix Flagged Documents",
        detail: "Documents Flagged",
        tone: "issue",
      };
    }
    if (move.includes("screen")) {
      return {
        action: "Screen Documents",
        detail: "All Documents Uploaded",
        tone: "action",
      };
    }
    if (ready.step === "next") {
      return {
        action: "Complete Opening Checks",
        detail: "Checks Open",
        tone: "progress",
      };
    }
    if (
      move.includes("onecalendar") ||
      move.includes("download") ||
      (ready.step === "submit" &&
        !move.includes("upload") &&
        !move.includes("add the permit"))
    ) {
      return {
        action: "Screening Passed",
        detail: "Documents Passed",
        tone: "ready",
      };
    }
    return {
      action: "Start Screening",
      detail: ready.countLabel,
      tone: "action",
    };
  }
  if (ready.stepsUntracked && ready.step !== "submit") {
    return { action: "Steps to Follow", detail: "Steps Open", tone: "progress" };
  }
  if (phase === "site") {
    return ready.catalogue === "v33"
      ? {
          action: `Finish ${v33StepsName(ready)}`,
          detail: "Steps Open",
          tone: "action",
        }
      : {
          action: "Complete Joint Site Inspection",
          detail: "Joint Site Inspection Due",
          tone: "action",
        };
  }
  if (phase === "permits" && ready.step === "pack") {
    return {
      action: "Upload Documents",
      detail: "Not Started",
      tone: "progress",
    };
  }
  if (ready.step === "next" || phase === "opening") {
    return {
      action: "Complete Opening Checks",
      detail: "Checks Open",
      tone: "progress",
    };
  }
  if (ready.step === "submit") {
    const move = (ready.stepMove ?? ready.nextMove).toLowerCase();
    const files = ready.countLabel;
    if (ready.stepsUntracked && role === "tenant") {
      return {
        action: "Waiting on Contractor",
        detail: move.includes("fix")
          ? "Documents Flagged"
          : move.includes("screen")
            ? "Documents to Screen"
            : move.includes("upload") || move.includes("add the permit")
              ? "Documents to Upload"
              : "Documents Passed",
        tone: "quiet",
      };
    }
    if (move.includes("fix")) {
      return {
        action: "Fix Flagged Documents",
        detail: "Documents Flagged",
        tone: "issue",
      };
    }
    if (move.includes("screen")) {
      return {
        action: "Screen Documents",
        detail: "All Documents Uploaded",
        tone: "action",
      };
    }
    if (move.includes("upload") || move.includes("add the permit")) {
      return {
        action: "Upload Documents",
        detail:
          files && /\d+ of \d+/.test(files) ? `${files} uploaded` : "Not Started",
        tone: "action",
      };
    }
    if (role === "tenant" || role === "officer") {
      return {
        action: waitingOn("Waiting for the contractor to submit the permit"),
        detail: "Documents Passed",
        tone: "quiet",
      };
    }
    return {
      action: "Download and Submit",
      detail: "Documents Passed",
      tone: "ready",
    };
  }
  return { action: ready.nextMove, detail: ready.countLabel, tone: ready.tone };
}

const PERMIT_ACTIONS = new Set([
  "Upload Documents",
  "Screen Documents",
  "Fix Flagged Documents",
  "Download and Submit",
]);

const PERMIT_WAITS = new Set([
  "Documents to Upload",
  "Documents to Screen",
  "Documents Flagged",
  "Documents Passed",
]);

/** v34: rows whose status is about the permit open straight into it, read-only for the waiting reader. */
export function v34OpensPermit(cue: { action: string; detail?: string }) {
  if (PERMIT_ACTIONS.has(cue.action)) return true;
  return cue.action.startsWith("Waiting") && PERMIT_WAITS.has(cue.detail ?? "");
}

export function v31ProjectCue(
  work: V26Work,
  ready: V28WorkReadiness,
  role: Role,
  unit: Unit,
) {
  return v31RowCue(ready, v31CuePhase(work, ready, role, unit), role);
}

const V31_STAGE_RANK = {
  answers: 0,
  site: 1,
  permits: 2,
  opening: 3,
  done: 4,
  none: 5,
} as const;

export type V31StageId = keyof typeof V31_STAGE_RANK;

/** The stepper stage this project is in, in journey order. */
export function v31ProjectStage(
  work: V26Work,
  ready: V28WorkReadiness,
  role: Role,
  unit: Unit,
): { id: V31StageId; label: string; rank: number } {
  if (ready.chip === "Complete") {
    return { id: "done", label: "Completed", rank: V31_STAGE_RANK.done };
  }
  if (
    /nothing to apply/i.test(ready.stepMove ?? ready.nextMove) ||
    ready.chip === "No permits"
  ) {
    return { id: "none", label: "No Permit Needed", rank: V31_STAGE_RANK.none };
  }
  if (ready.step === "answers") {
    return { id: "answers", label: "Scope of Works", rank: V31_STAGE_RANK.answers };
  }
  const phase = v31CuePhase(work, ready, role, unit);
  const model =
    ready.catalogue === "v33"
      ? v33PhaseModel(v33ProjectOutcome(work, role, unit))
      : v31PhaseModel(v31Outcome(work, role, unit));
  const named = model.bases.find((row) => row.id === phase);
  if (phase === "site") {
    return {
      id: "site",
      label: named?.short ?? "Pre-application",
      rank: V31_STAGE_RANK.site,
    };
  }
  if (phase === "opening" || ready.step === "next") {
    return {
      id: "opening",
      label: named?.short ?? "Pre-opening",
      rank: V31_STAGE_RANK.opening,
    };
  }
  return {
    id: "permits",
    label: named?.short ?? "Permit Application",
    rank: V31_STAGE_RANK.permits,
  };
}

function v31CuePhase(
  work: V26Work,
  ready: V28WorkReadiness,
  role: Role,
  unit: Unit,
): V31PhaseId | null {
  if (ready.step === "answers") return null;
  const model =
    ready.catalogue === "v33"
      ? v33PhaseModel(v33ProjectOutcome(work, role, unit))
      : v31PhaseModel(v31Outcome(work, role, unit));
  return v31ListPhase(model.bases, ready.step);
}

/** Pipeline order: scope → pre-application → upload → check → fix → submit → opening → past. */
export function v31ProgressRank(
  ready: V28WorkReadiness,
  cue: { action: string },
) {
  if (v31IsPast(ready)) {
    return cue.action === "Completed" || ready.chip === "Complete" ? 90 : 91;
  }
  if (ready.step === "answers") {
    const count = parseCount(ready.countLabel);
    if (count && count.total > 0 && count.done >= count.total) return 2;
    if (count && count.done > 0) return 1;
    return 0;
  }
  if (ready.step === "pack") return 3;
  if (ready.step === "submit") {
    const move = `${ready.nextMove} ${cue.action}`.toLowerCase();
    if (move.includes("fix")) return 6;
    if (move.includes("screen")) return 5;
    if (move.includes("upload") || move.includes("file")) return 4;
    return 7;
  }
  if (ready.step === "next") return 8;
  return 50;
}

/**
 * Lower comes first. Blocked work is tended first. A project on the
 * checks before opening sits next, so it can be closed. A quiz still
 * in progress follows. A project that has not been opened stays last.
 */
export function v31UrgencyRank(
  ready: V28WorkReadiness,
  cue: { action: string; tone: V31ChipTone },
) {
  if (v31IsPast(ready)) return 90;
  if (cue.tone === "issue") return 0;
  if (cue.tone === "action") {
    const action = cue.action.toLowerCase();
    if (action.includes("check documents")) return 1;
    if (action.includes("upload documents")) return 2;
    return 3;
  }
  if (ready.step === "next") return 4;
  if (
    cue.tone === "progress" &&
    (ready.step === "answers" || ready.step === "pack")
  ) {
    return 5;
  }
  if (cue.tone === "ready") return 6;
  if (cue.tone === "draft") return 7;
  if (cue.tone === "progress") return 8;
  return 9;
}

export type V31UrgencyBand = "urgent" | "close" | "next" | "later";

export function v31UrgencyBand(rank: number): V31UrgencyBand {
  if (rank <= 3) return "urgent";
  if (rank === 4) return "close";
  if (rank <= 6) return "next";
  return "later";
}

export function v31NeedsAct(cue: { tone: V31ChipTone }) {
  return (
    cue.tone === "action" ||
    cue.tone === "issue" ||
    cue.tone === "draft" ||
    cue.tone === "ready"
  );
}

export function v31IsPast(ready: V28WorkReadiness) {
  return ready.chip === "Complete";
}
