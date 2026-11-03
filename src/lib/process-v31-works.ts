import type { Role } from "@/lib/app-state";
import type { Unit } from "@/lib/tenancy-data";
import { isOptionOn } from "@/lib/process-planned-works-quiz";
import {
  v26DraftOutcome,
  type V26DraftStep,
  type V26Work,
} from "@/lib/process-v26-works";
import {
  hydrateV28FromLegacy,
  MINOR_FITOUT_ID,
  NO_RENO_ID,
  v28Answer,
  v28ChoiceValue,
  v28QuizProgress,
  v28TextValue,
} from "@/lib/process-v28-quiz";
import type { V28RailId } from "@/lib/process-v28-readiness";
import { usesV37Cut } from "@/lib/process-v31-preview";

export const V31_NEW_PROJECT = "New Project";

/** Older starts were titled after the Journey door. Seeded demos keep those names on purpose. */
const START_PLACEHOLDERS = new Set([
  "Opening fit-out",
  "Opening Fit-Out",
  "Further works",
  "Further Works",
]);

function untitledProject(work: V26Work) {
  const title = work.title;
  return (
    !title ||
    title === V31_NEW_PROJECT ||
    title === "New project" ||
    title.startsWith("Works ·") ||
    title.startsWith("New work") ||
    (work.id.startsWith("v26-") && START_PLACEHOLDERS.has(title))
  );
}

/** Permit or task names that should read as a renovation on the unit. */
const V31_RENO_NAME: Record<string, string> = {
  "Hot Work + Isolation": "Kitchen Renovation",
  "Hot Work": "Kitchen Renovation",
  "Ceiling works": "Ceiling Renovation",
  "Ceiling Works": "Ceiling Renovation",
  "M&E works": "M&E Renovation",
  "M&E Works": "M&E Renovation",
};

/** List name from the contractor’s quiz name, then the common renovation types. */
export function v31ProjectTitle(work: V26Work, unit: Unit) {
  const quiz = hydrateV28FromLegacy(work.quiz, unit);
  const named = v28TextValue(quiz, "q-name").trim();
  if (named) return named;
  if (typeof window !== "undefined" && usesV37Cut(window.location.pathname)) {
    return work.title.trim() || V31_NEW_PROJECT;
  }
  if (work.title && V31_RENO_NAME[work.title]) return V31_RENO_NAME[work.title];
  if (!untitledProject(work)) return work.title;
  if (v28QuizProgress(quiz).answered === 0) return V31_NEW_PROJECT;
  const scope = v28Answer(quiz, "q5");
  if (isOptionOn(scope, "additional-works")) return "Further Works";
  if (isOptionOn(scope, MINOR_FITOUT_ID)) return "Minor Fit-Out";
  if (isOptionOn(scope, "major-renovation")) return "Full Renovation";
  if (isOptionOn(scope, NO_RENO_ID)) return "No Renovation";
  const tenancy = v28ChoiceValue(quiz, "q2");
  if (tenancy === "new-tenancy" || tenancy === "takeover") return "Opening Fit-Out";
  const structure = v28Answer(quiz, "q7");
  if (isOptionOn(structure, "ceiling-works")) return "Ceiling Renovation";
  const services = v28Answer(quiz, "q9");
  if (
    isOptionOn(services, "electrical") ||
    isOptionOn(services, "acmv") ||
    isOptionOn(services, "plumbing")
  ) {
    return "M&E Renovation";
  }
  const hazards = v28Answer(quiz, "q14");
  if (isOptionOn(hazards, "hot-works")) return "Kitchen Renovation";
  return "Opening Fit-Out";
}

export function v31StartTitle() {
  return V31_NEW_PROJECT;
}

/** Names for the four steps on every project. */
export const V31_WORK_RAIL: { id: V28RailId; label: string }[] = [
  { id: "answers", label: "Scope of Works" },
  { id: "pack", label: "Pre-application" },
  { id: "submit", label: "Permit Application" },
  { id: "next", label: "Pre-opening" },
];

/** Same four steps on every job. Empty ones are marked done and skipped. */
export function v31RailLabels(
  _steps: { group: string; title: string }[],
): { id: V28RailId; label: string }[] {
  return [...V31_WORK_RAIL];
}

/** Skip empty Pre-application, permit, or pre-opening so Confirm lands on the first real sitting. */
export function firstActionableRail<T extends { id: string }>(
  labels: T[],
  steps: { group: string }[],
) {
  const hasBefore = steps.some((step) => step.group === "before");
  const hasPermit = steps.some((step) => step.group === "application");
  const hasAfter = steps.some((step) => step.group === "after");
  return (
    labels.find((row) => {
      if (row.id === "answers") return false;
      if (row.id === "pack" && !hasBefore) return false;
      if (row.id === "submit" && !hasPermit) return false;
      if (row.id === "next" && !hasAfter) return false;
      return true;
    }) ?? null
  );
}

/** The first step after type of works, when the answers have created one. */
export function v31NextStep(steps: { group: string; title: string }[]) {
  return firstActionableRail(v31RailLabels(steps), steps);
}

/** Same words as the stepper. Home and the project list use this as the status. */
export function v31StepStatus(
  step: V28RailId,
  labels?: { id: V28RailId; label: string }[],
) {
  return (
    (labels ?? V31_WORK_RAIL).find((row) => row.id === step)?.label ??
    "Scope of Works"
  );
}

/** Sittings that exist only because an answer said so. */
const V31_BECAUSE: Record<string, string> = {
  jsi: "Because this work can set off or isolate alarms.",
  "qp-letter": "Because leftover items from the previous tenant are kept.",
  waterproof: "Because this includes a wet area.",
};

export function v31BecauseLine(stepId: string) {
  return V31_BECAUSE[stepId] ?? null;
}

export const V31_APPLY_LEAD =
  "Supporting documents for this Permit to Work";

/** Same shape as the sitting above: one move, then what it is and who does it. */
export const V31_APPLY_CARD = {
  fact: "Submit this renovation's Permit to Work.",
  tenant:
    "Upload the supporting documents for this Permit to Work.\nSubmit the permits together in OneCalendar.",
  contractor:
    "Upload the supporting documents for this Permit to Work.\nSubmit the permits together in OneCalendar.",
};

export const V31_REVIEW = {
  title: "Permit review",
  why: "Reviewers check this pack, then OneCalendar issues the permit.",
};

export const V31_PREPARE = {
  title: "Before the application",
  why: "These sittings come first.",
};

export const V31_ISSUED = {
  title: "After the permit is issued",
  why: "Site rules, then the work under the permit.",
};

export const V31_CHECKS = {
  title: "Pre-opening",
  why: "Inspections and tests for this renovation.",
};

const ISSUED_IDS = new Set(["briefing", "site", "qp-letter"]);
const REVIEW_ID = "review";

/** Officer sees the contractor's close-out sittings as well. */
export function v31Outcome(work: V26Work, role: Role, unit: Unit) {
  const outcome = v26DraftOutcome(work, role, unit);
  if (role !== "officer") return outcome;
  const contractor = v26DraftOutcome(work, "contractor", unit);
  const have = new Set(outcome.steps.map((step) => step.id));
  const extra = contractor.steps.filter((step) => !have.has(step.id));
  const steps = [...outcome.steps];
  const poi = steps.findIndex((step) => step.id === "poi");
  steps.splice(poi === -1 ? steps.length : poi, 0, ...extra);
  return { ...outcome, steps };
}

export function v31PrepareSteps(steps: V26DraftStep[]) {
  return steps.filter((step) => step.group === "before");
}

export function v31IssuedSteps(steps: V26DraftStep[]) {
  return steps.filter((step) => ISSUED_IDS.has(step.id));
}

export function v31CheckSteps(steps: V26DraftStep[]) {
  return steps.filter(
    (step) =>
      step.group === "after" && step.id !== REVIEW_ID && !ISSUED_IDS.has(step.id),
  );
}

export function v31ReviewSteps(steps: V26DraftStep[]) {
  return steps.filter((step) => step.id === REVIEW_ID);
}

function crc32(data: Uint8Array) {
  let c = ~0;
  for (let i = 0; i < data.length; i++) {
    c ^= data[i];
    for (let k = 0; k < 8; k++) {
      c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
    }
  }
  return ~c >>> 0;
}

function u16(view: DataView, offset: number, value: number) {
  view.setUint16(offset, value, true);
}

function u32(view: DataView, offset: number, value: number) {
  view.setUint32(offset, value, true);
}

function zipBlob(files: { name: string; text: string }[]) {
  const enc = new TextEncoder();
  const parts: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  for (const file of files) {
    const name = enc.encode(file.name);
    const data = enc.encode(file.text);
    const crc = crc32(data);
    const local = new Uint8Array(30 + name.length + data.length);
    const view = new DataView(local.buffer);
    u32(view, 0, 0x04034b50);
    u16(view, 4, 20);
    u32(view, 14, crc);
    u32(view, 18, data.length);
    u32(view, 22, data.length);
    u16(view, 26, name.length);
    local.set(name, 30);
    local.set(data, 30 + name.length);
    parts.push(local);

    const cen = new Uint8Array(46 + name.length);
    const cv = new DataView(cen.buffer);
    u32(cv, 0, 0x02014b50);
    u16(cv, 4, 20);
    u16(cv, 6, 20);
    u32(cv, 16, crc);
    u32(cv, 20, data.length);
    u32(cv, 24, data.length);
    u16(cv, 28, name.length);
    u32(cv, 42, offset);
    cen.set(name, 46);
    central.push(cen);
    offset += local.length;
  }
  const centralSize = central.reduce((sum, part) => sum + part.length, 0);
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  u32(ev, 0, 0x06054b50);
  u16(ev, 8, files.length);
  u16(ev, 10, files.length);
  u32(ev, 12, centralSize);
  u32(ev, 16, offset);
  return new Blob([...parts, ...central, end] as BlobPart[], {
    type: "application/zip",
  });
}

function safeZipName(name: string) {
  return name.replace(/[\\/:*?"<>|]/g, "-");
}

export function downloadV31PermitZip(input: {
  unitNo: string;
  workTitle: string;
  files: { permit: string; fileName: string }[];
}) {
  const summary = [
    "Screened permit pack",
    `Unit: ${input.unitNo}`,
    `Work: ${input.workTitle}`,
    "",
    "Submit this zip in OneCalendar.",
    "",
    ...input.files.map((file) => `${file.permit}: ${file.fileName}`),
  ].join("\n");
  const files = [
    { name: "summary.txt", text: `${summary}\n` },
    ...input.files.map((file) => ({
      name: safeZipName(
        `${file.permit} - ${file.fileName.replace(/\.pdf$/i, "")}.txt`,
      ),
      text: `${file.permit}\n${file.fileName}\nScreened and ready to submit in OneCalendar.\n`,
    })),
  ];
  const blob = zipBlob(files);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${safeZipName(input.unitNo)}-permit-pack.zip`;
  link.click();
  URL.revokeObjectURL(url);
}

/** v31 list only. The work record stays, so older editions still show it. */
export const V31_ARCHIVED_CHANGED = "tempo:v31:archived";

function archivedKey(unitId: string) {
  return `tempo:v31:archived:${unitId}`;
}

export function readV31Archived(unitId: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(archivedKey(unitId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((id) => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

export function setV31Archived(unitId: string, ids: string[]) {
  window.localStorage.setItem(archivedKey(unitId), JSON.stringify(ids));
  window.dispatchEvent(new Event(V31_ARCHIVED_CHANGED));
}

/** v31 list only. Hides a work even if demo seed writes it back. */
export const V31_DELETED_CHANGED = "tempo:v31:deleted";

function deletedKey(unitId: string) {
  return `tempo:v31:deleted:${unitId}`;
}

export function readV31Deleted(unitId: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(deletedKey(unitId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((id) => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

export function dropV31Work(unitId: string, workId: string) {
  setV31Archived(
    unitId,
    readV31Archived(unitId).filter((id) => id !== workId),
  );
  reopenV31Work(unitId, workId);
  window.localStorage.removeItem(closesKey(unitId, workId));
  window.dispatchEvent(new Event(V31_CLOSES_CHANGED));
  const ids = [...new Set([...readV31Deleted(unitId), workId])];
  window.localStorage.setItem(deletedKey(unitId), JSON.stringify(ids));
  window.dispatchEvent(new Event(V31_DELETED_CHANGED));
}

/** v31 only. Marks the renovation finished from Checks before opening. */
export const V31_COMPLETED_CHANGED = "tempo:v31:completed";

function completedKey(unitId: string) {
  return `tempo:v31:completed:${unitId}`;
}

export function readV31Completed(unitId: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(completedKey(unitId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((id) => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

export function writeV31Completed(unitId: string, ids: string[]) {
  window.localStorage.setItem(completedKey(unitId), JSON.stringify(ids));
  window.dispatchEvent(new Event(V31_COMPLETED_CHANGED));
}

export function isV31Complete(unitId: string, workId: string) {
  return readV31Completed(unitId).includes(workId);
}

export function completeV31Work(unitId: string, workId: string) {
  const ids = readV31Completed(unitId);
  if (!ids.includes(workId)) {
    window.localStorage.setItem(
      completedKey(unitId),
      JSON.stringify([...ids, workId]),
    );
  }
  window.dispatchEvent(new Event(V31_COMPLETED_CHANGED));
}

export function reopenV31Work(unitId: string, workId: string) {
  const ids = readV31Completed(unitId).filter((id) => id !== workId);
  window.localStorage.setItem(completedKey(unitId), JSON.stringify(ids));
  window.dispatchEvent(new Event(V31_COMPLETED_CHANGED));
}

/** Clear archive / delete / done flags when a demo story replaces the list. */
export function resetV31ListState(unitId: string) {
  setV31Archived(unitId, []);
  window.localStorage.setItem(deletedKey(unitId), JSON.stringify([]));
  window.dispatchEvent(new Event(V31_DELETED_CHANGED));
  window.localStorage.setItem(completedKey(unitId), JSON.stringify([]));
  window.dispatchEvent(new Event(V31_COMPLETED_CHANGED));
}

/**
 * One close record per step. `manual` is the contractor’s mark.
 * `tracked` is the same shape a later inspection record can write,
 * so the row does not need a second control when tracking arrives.
 */
export type V31CloseSource = "manual" | "tracked";

export type V31StepClose = {
  status: "done";
  source: V31CloseSource;
  at: string;
};

export const V31_CLOSES_CHANGED = "tempo:v31:closes";

function closesKey(unitId: string, workId: string) {
  return `tempo:v31:closes:${unitId}:${workId}`;
}

export function readV31Closes(
  unitId: string,
  workId: string,
): Record<string, V31StepClose> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(closesKey(unitId, workId));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, V31StepClose>;
    if (!parsed || typeof parsed !== "object") return {};
    const next: Record<string, V31StepClose> = {};
    for (const [id, row] of Object.entries(parsed)) {
      if (row?.status !== "done") continue;
      if (row.source !== "manual" && row.source !== "tracked") continue;
      next[id] = row;
    }
    return next;
  } catch {
    return {};
  }
}

function writeV31Closes(
  unitId: string,
  workId: string,
  next: Record<string, V31StepClose>,
) {
  window.localStorage.setItem(closesKey(unitId, workId), JSON.stringify(next));
  window.dispatchEvent(new Event(V31_CLOSES_CHANGED));
}

export function closeV31Step(
  unitId: string,
  workId: string,
  stepId: string,
  source: V31CloseSource = "manual",
) {
  const current = readV31Closes(unitId, workId);
  if (current[stepId]?.status === "done") return;
  current[stepId] = {
    status: "done",
    source,
    at: new Date().toISOString(),
  };
  writeV31Closes(unitId, workId, current);
}

export function clearV31Closes(unitId: string, workId: string) {
  window.localStorage.removeItem(closesKey(unitId, workId));
  window.dispatchEvent(new Event(V31_CLOSES_CHANGED));
}

export function clearV31Step(unitId: string, workId: string, stepId: string) {
  const current = readV31Closes(unitId, workId);
  delete current[stepId];
  writeV31Closes(unitId, workId, current);
}
