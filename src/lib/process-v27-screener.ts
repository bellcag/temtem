export const V27_SCREEN_EVENT = "tempo:v27:screen";

export type V27ApplyStep = "checklist" | "upload" | "screen" | "results";

export const V27_APPLY_STEPS: { id: V27ApplyStep; label: string }[] = [
  { id: "checklist", label: "Checklist" },
  { id: "upload", label: "Upload" },
  { id: "screen", label: "Screen" },
  { id: "results", label: "Results" },
];

export type V27Attachment = {
  fileName: string;
  attachedAt: string;
};

export type V27ScreenResult = "idle" | "running" | "error" | "issues" | "pass";

export type V27ScreenState = {
  result: V27ScreenResult;
  runs: number;
};

function attachKey(unitId: string, workId: string) {
  return `tempo:v27:attach:${unitId}:${workId}`;
}

function screenKey(unitId: string, workId: string) {
  return `tempo:v27:screen:${unitId}:${workId}`;
}

export function docAttachKey(permitName: string, docName: string) {
  return `${permitName}::${docName}`;
}

export function readV27Attachments(
  unitId: string,
  workId: string,
): Record<string, V27Attachment> {
  try {
    const raw = window.localStorage.getItem(attachKey(unitId, workId));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, V27Attachment>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeAttachments(
  unitId: string,
  workId: string,
  next: Record<string, V27Attachment>,
) {
  window.localStorage.setItem(attachKey(unitId, workId), JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(V27_SCREEN_EVENT));
}

export function attachV27Doc(
  unitId: string,
  workId: string,
  permitName: string,
  docName: string,
  fileName: string,
) {
  const next = { ...readV27Attachments(unitId, workId) };
  next[docAttachKey(permitName, docName)] = {
    fileName,
    attachedAt: new Date().toISOString(),
  };
  writeAttachments(unitId, workId, next);
}

export function removeV27Doc(
  unitId: string,
  workId: string,
  permitName: string,
  docName: string,
) {
  const next = { ...readV27Attachments(unitId, workId) };
  delete next[docAttachKey(permitName, docName)];
  writeAttachments(unitId, workId, next);
}

export function readV27Screen(
  unitId: string,
  workId: string,
): V27ScreenState {
  try {
    const raw = window.localStorage.getItem(screenKey(unitId, workId));
    if (!raw) return { result: "idle", runs: 0 };
    const parsed = JSON.parse(raw) as V27ScreenState;
    if (!parsed || typeof parsed !== "object") return { result: "idle", runs: 0 };
    return {
      result: parsed.result ?? "idle",
      runs: Number(parsed.runs) || 0,
    };
  } catch {
    return { result: "idle", runs: 0 };
  }
}

export function writeV27Screen(
  unitId: string,
  workId: string,
  next: V27ScreenState,
) {
  window.localStorage.setItem(screenKey(unitId, workId), JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(V27_SCREEN_EVENT));
}

/** First screen on the long March pack shows issues; a re-screen passes. Short packs pass when a file is on. */
export function v27DecideResult(args: {
  workId: string;
  attached: number;
  runs: number;
}): Exclude<V27ScreenResult, "idle" | "running"> {
  if (args.attached === 0) return "error";
  if (args.runs === 0 && /-(2)$/.test(args.workId)) return "issues";
  return "pass";
}

export function isV27ApplyStep(value: string | null): value is V27ApplyStep {
  return (
    value === "checklist" ||
    value === "upload" ||
    value === "screen" ||
    value === "results"
  );
}
