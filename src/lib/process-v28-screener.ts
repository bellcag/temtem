import type { V26ChecklistDoc } from "@/lib/process-v26-works";

export const V28_SCREEN_EVENT = "tempo:v28:screen";

export type V28ApplyStep = "checklist" | "upload" | "screen" | "results";

export const V28_APPLY_STEPS: { id: V28ApplyStep; label: string }[] = [
  { id: "checklist", label: "Checklist" },
  { id: "upload", label: "Upload" },
  { id: "screen", label: "Screen" },
  { id: "results", label: "Results" },
];

export type V28Attachment = {
  fileName: string;
  attachedAt: string;
  /** Screening note on this file. Cleared when the contractor replaces it. */
  issue?: string;
};

export type V28ScreenResult = "idle" | "running" | "error" | "issues" | "pass";

export type V28ScreenState = {
  result: V28ScreenResult;
  runs: number;
};

function attachKey(unitId: string, workId: string) {
  return `tempo:v28:attach:${unitId}:${workId}`;
}

function screenKey(unitId: string, workId: string) {
  return `tempo:v28:screen:${unitId}:${workId}`;
}

export function docAttachKey(permitName: string, docName: string) {
  return `${permitName}::${docName}`;
}

export function readV28Attachments(
  unitId: string,
  workId: string,
): Record<string, V28Attachment> {
  try {
    const raw = window.localStorage.getItem(attachKey(unitId, workId));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, V28Attachment>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeAttachments(
  unitId: string,
  workId: string,
  next: Record<string, V28Attachment>,
) {
  window.localStorage.setItem(attachKey(unitId, workId), JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(V28_SCREEN_EVENT));
}

export function attachV28Doc(
  unitId: string,
  workId: string,
  permitName: string,
  docName: string,
  fileName: string,
) {
  const next = { ...readV28Attachments(unitId, workId) };
  next[docAttachKey(permitName, docName)] = {
    fileName,
    attachedAt: new Date().toISOString(),
  };
  writeAttachments(unitId, workId, next);
}

export function removeV28Doc(
  unitId: string,
  workId: string,
  permitName: string,
  docName: string,
) {
  const next = { ...readV28Attachments(unitId, workId) };
  delete next[docAttachKey(permitName, docName)];
  writeAttachments(unitId, workId, next);
}

export function readV28Screen(
  unitId: string,
  workId: string,
): V28ScreenState {
  try {
    const raw = window.localStorage.getItem(screenKey(unitId, workId));
    if (!raw) return { result: "idle", runs: 0 };
    const parsed = JSON.parse(raw) as V28ScreenState;
    if (!parsed || typeof parsed !== "object") return { result: "idle", runs: 0 };
    return {
      result: parsed.result ?? "idle",
      runs: Number(parsed.runs) || 0,
    };
  } catch {
    return { result: "idle", runs: 0 };
  }
}

export function writeV28Screen(
  unitId: string,
  workId: string,
  next: V28ScreenState,
) {
  window.localStorage.setItem(screenKey(unitId, workId), JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(V28_SCREEN_EVENT));
}

function beforeKey(unitId: string, workId: string) {
  return `tempo:v28:before:${unitId}:${workId}`;
}

/** Contractor has finished the steps that have to happen before the permit application. */
export function readV28BeforeDone(unitId: string, workId: string) {
  try {
    return window.localStorage.getItem(beforeKey(unitId, workId)) === "1";
  } catch {
    return false;
  }
}

export function writeV28BeforeDone(
  unitId: string,
  workId: string,
  done: boolean,
) {
  const key = beforeKey(unitId, workId);
  if (done) window.localStorage.setItem(key, "1");
  else window.localStorage.removeItem(key);
  window.dispatchEvent(new CustomEvent(V28_SCREEN_EVENT));
}

function submitKey(unitId: string, workId: string) {
  return `tempo:v28:submit:${unitId}:${workId}`;
}

export function readV28Submitted(unitId: string, workId: string) {
  try {
    return window.localStorage.getItem(submitKey(unitId, workId)) === "1";
  } catch {
    return false;
  }
}

export function writeV28Submitted(
  unitId: string,
  workId: string,
  submitted: boolean,
) {
  const key = submitKey(unitId, workId);
  if (submitted) window.localStorage.setItem(key, "1");
  else window.localStorage.removeItem(key);
  window.dispatchEvent(new CustomEvent(V28_SCREEN_EVENT));
}

/** Move a demo pack onto the tenancy unit after the catalog stamps a new unitId. */
export function copyV28PackState(
  fromUnitId: string,
  toUnitId: string,
  workId: string,
) {
  if (fromUnitId === toUnitId) return;
  writeAttachments(toUnitId, workId, readV28Attachments(fromUnitId, workId));
  writeV28Screen(toUnitId, workId, readV28Screen(fromUnitId, workId));
  writeV28Submitted(toUnitId, workId, readV28Submitted(fromUnitId, workId));
  writeV28BeforeDone(toUnitId, workId, readV28BeforeDone(fromUnitId, workId));
  const checklistKey = `tempo:v28:checklist:${fromUnitId}:${workId}`;
  const checklist = window.localStorage.getItem(checklistKey);
  if (checklist) {
    window.localStorage.setItem(
      `tempo:v28:checklist:${toUnitId}:${workId}`,
      checklist,
    );
  }
}

/** Drop pack, screen, submit, and checklist so a demo row can be re-seeded. */
export function resetV28PackState(unitId: string, workId: string) {
  clearV28Attachments(unitId, workId);
  writeV28Screen(unitId, workId, { result: "idle", runs: 0 });
  writeV28Submitted(unitId, workId, false);
  writeV28BeforeDone(unitId, workId, false);
  window.localStorage.removeItem(`tempo:v28:checklist:${unitId}:${workId}`);
}

/** Demo only — attach some required files and leave the rest empty. */
export function seedV28PartialAttachments(
  unitId: string,
  workId: string,
  docs: { permitName: string; name: string }[],
  attachedCount: number,
) {
  const unique = [...new Map(docs.map((doc) => [doc.name, doc])).values()];
  const keep = Math.max(
    1,
    Math.min(attachedCount, Math.max(0, unique.length - 1)),
  );
  const keepNames = new Set(unique.slice(0, keep).map((doc) => doc.name));
  const next: Record<string, V28Attachment> = {};
  for (const doc of docs) {
    if (!keepNames.has(doc.name)) continue;
    next[docAttachKey(doc.permitName, doc.name)] = {
      fileName: `${doc.name}.pdf`,
      attachedAt: "2026-09-12T10:00:00.000Z",
    };
  }
  writeAttachments(unitId, workId, next);
}

/** Demo only — drop every attached file so a project can sit before the pack. */
export function clearV28Attachments(unitId: string, workId: string) {
  writeAttachments(unitId, workId, {});
}

/** Demo only — put a file on every required row. */
export function seedV28Attachments(
  unitId: string,
  workId: string,
  docs: { permitName: string; name: string }[],
) {
  const next = { ...readV28Attachments(unitId, workId) };
  let attachChanged = false;
  for (const doc of docs) {
    const key = docAttachKey(doc.permitName, doc.name);
    if (next[key]) continue;
    next[key] = {
      fileName: `${doc.name}.pdf`,
      attachedAt: "2026-09-05T10:00:00.000Z",
    };
    attachChanged = true;
  }
  if (attachChanged) writeAttachments(unitId, workId, next);
}

/** Demo only — attach every required file and mark the pack as passed. */
export function seedV28PassedPack(
  unitId: string,
  workId: string,
  docs: { permitName: string; name: string }[],
) {
  seedV28Attachments(unitId, workId, docs);
  if (readV28Screen(unitId, workId).result !== "pass") {
    writeV28Screen(unitId, workId, { result: "pass", runs: 1 });
  }
}

/** Stamp screening issues onto named files that are already in the pack. */
export function flagV28Docs(
  unitId: string,
  workId: string,
  flags: { name: string; issue: string }[],
) {
  const next = { ...readV28Attachments(unitId, workId) };
  let changed = false;
  for (const [key, file] of Object.entries(next)) {
    const docName = key.slice(key.indexOf("::") + 2);
    const flag = flags.find((row) => row.name === docName);
    if (!flag || file.issue === flag.issue) continue;
    next[key] = { ...file, issue: flag.issue };
    changed = true;
  }
  if (changed) writeAttachments(unitId, workId, next);
}

export function v28FlaggedCount(attachments: Record<string, V28Attachment>) {
  return Object.values(attachments).filter((file) => Boolean(file.issue?.trim()))
    .length;
}

/** First screen on the long March pack shows issues; a re-screen passes. Short packs pass when a file is on. */
export function v28DecideResult(args: {
  workId: string;
  attached: number;
  runs: number;
  flagged?: number;
}): Exclude<V28ScreenResult, "idle" | "running"> {
  if (args.attached === 0) return "error";
  if ((args.flagged ?? 0) > 0) return "issues";
  if (args.runs === 0 && /-(2)$/.test(args.workId)) return "issues";
  return "pass";
}

export function isV28ApplyStep(value: string | null): value is V28ApplyStep {
  return (
    value === "checklist" ||
    value === "upload" ||
    value === "screen" ||
    value === "results"
  );
}

/** The step-3 list. Opening a row sets `apply` to that part. */
export const V28_APPLY_PARTS = "parts";

/**
 * Provisional until a Project Officer confirms.
 * Letter of Indemnity is one file for every permit that asks for it.
 * Risk Assessment and Method of Statement stay a separate file per permit.
 */
export function v35OneFileForAllPermits(docName: string) {
  return /letter of indemnity/i.test(docName);
}

export function v35SeparateFilePerPermit(docName: string) {
  const name = docName.trim();
  return /risk assessment/i.test(name) || /^method of statement$/i.test(name);
}

export type V35DocSlot = {
  id: string;
  rows: V26ChecklistDoc[];
  /** Set only when more than one permit asks for this document. */
  share: "all" | "each" | null;
};

export function v35DocumentSlots(docs: V26ChecklistDoc[]): V35DocSlot[] {
  const permitsFor = (name: string) => [
    ...new Set(
      docs.filter((row) => row.doc.name === name).map((row) => row.permitName),
    ),
  ];
  let sharedIndemnity = false;
  const slots: V35DocSlot[] = [];
  for (const row of docs) {
    const name = row.doc.name;
    if (v35OneFileForAllPermits(name)) {
      if (sharedIndemnity) continue;
      sharedIndemnity = true;
      slots.push({
        id: "shared::letter-of-indemnity",
        rows: docs.filter((item) => v35OneFileForAllPermits(item.doc.name)),
        share: "all",
      });
      continue;
    }
    const repeats = permitsFor(name).length > 1;
    slots.push({
      id: `${row.permitName}::${name}`,
      rows: [row],
      share: repeats && v35SeparateFilePerPermit(name) ? "each" : null,
    });
  }
  return slots;
}

export type V35DocNeed = { name: string; permits: string[] };

export type V35DocSummary = {
  fileCount: number;
  once: V35DocNeed[];
  each: V35DocNeed[];
  other: V35DocNeed[];
};

/** Overview list grouped by how many files the contractor prepares. */
export function v35DocumentSummary(docs: V26ChecklistDoc[]): V35DocSummary {
  const slots = v35DocumentSlots(docs);
  const group = (share: V35DocSlot["share"]) => {
    const map = new Map<string, V35DocNeed>();
    for (const slot of slots.filter((item) => item.share === share)) {
      for (const row of slot.rows) {
        const key = row.doc.name.toLowerCase();
        const need = map.get(key) ?? { name: row.doc.name, permits: [] };
        if (!need.permits.includes(row.permitName)) need.permits.push(row.permitName);
        map.set(key, need);
      }
    }
    return [...map.values()];
  };
  return {
    fileCount: slots.length,
    once: group("all"),
    each: group("each"),
    other: group(null),
  };
}

export function v35ShareTag(slot: V35DocSlot) {
  if (slot.share === "all") return "Same file for every permit";
  if (slot.share === "each") return "New file for this permit";
  return null;
}

/** Same chips as the overview document list. */
export function v35ShareChip(slot: V35DocSlot) {
  if (slot.share === "all") return "One for All Permits";
  if (slot.share === "each") return "One per Permit";
  return null;
}

export function v35ShareLead(slot: V35DocSlot) {
  const permits = [...new Set(slot.rows.map((row) => row.permitName))];
  if (slot.share === "all" && permits.length > 0) {
    return `Used by ${permits.join(" and ")}`;
  }
  if (slot.share === "each") return permits[0] ?? null;
  return null;
}

export function v35SharedDescription(slot: V35DocSlot) {
  if (slot.share !== "all") return null;
  return "Upload this file once. Every permit that asks for it uses this same file.";
}

export function v35ShareLine(slot: V35DocSlot) {
  if (slot.share === "all") return "Upload this file once. Every permit that asks for it uses this same file.";
  if (slot.share === "each") return "Upload a new file for this permit. Do not reuse a file from another permit.";
  return null;
}

