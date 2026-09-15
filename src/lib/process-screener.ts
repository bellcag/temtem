import { useEffect, useState } from "react";
import type { Role } from "@/lib/app-state";
import type { Unit } from "@/lib/tenancy-data";
import {
  needLabelCompact,
  supportingDocsFor,
  type PermitSupportingDocs,
  type SupportingDoc,
} from "@/lib/process-permit-supporting-docs";
import {
  QUIZ_CHANGED_EVENT,
  quizIsConfirmed,
  quizPermitResult,
  readQuizState,
  type QuizState,
} from "@/lib/process-planned-works-quiz";
import {
  latestLockedWorksJob,
  worksOutcome,
  WORKS_CHANGED_EVENT,
  type WorksJob,
} from "@/lib/process-works-jobs";

export const SCREENER_ATTACH_EVENT = "tempo:screener-attach";

export type ScreenerAttachment = {
  fileName: string;
  attachedAt: string;
};

export type ScreenerPermit = {
  name: string;
  supporting: PermitSupportingDocs;
  requiredCount: number;
  attachedRequired: number;
};

export type ScreenerPack = {
  locked: boolean;
  permits: ScreenerPermit[];
  requiredCount: number;
  attachedRequired: number;
};

export const screenerCopy = {
  title: "Application Screener",
  tabCurrent: "Current pack",
  tabHistory: "History",
  lockedNote:
    "This list cannot be changed here. If the job changes, the project officer corrects answers on Works.",
  introContractor: "Upload supporting documents for the permits locked on Works.",
  introOfficer: "Check the contractor's pack for the permits locked on Works.",
  introTenant: "Read the permits locked on Works.",
  waitingContractor:
    "The project officer locks this list on Works, before the IFM briefing and permits.",
  waitingOfficer: "Lock the works list on Works first.",
  waitingTenant: "Wait for the Project Officer to lock the list on Works.",
  waitingCta: "Open Works",
  attachCta: "Attach",
  removeCta: "Remove",
  attached: "Attached",
  notAttached: "Not attached yet",
  noDocs:
    "No supporting documents listed in the blueprint or Renovation Requirements.",
  historyEmpty: "No locked pack yet. Lock a works list on Works first.",
  historyRow: "Application pack",
  unscoped: "Choose a unit on Process first.",
};

function attachStorageKey(unitId: string) {
  return `tempo:v19:screener-pack:${unitId}`;
}

function isRequiredDoc(doc: SupportingDoc) {
  return needLabelCompact(doc.need) === "Required";
}

export function docAttachKey(permitName: string, docName: string) {
  return `${permitName}::${docName}`;
}

export function readAttachments(
  unitId: string,
): Record<string, ScreenerAttachment> {
  try {
    const raw = window.localStorage.getItem(attachStorageKey(unitId));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, ScreenerAttachment>;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed;
  } catch {
    return {};
  }
}

export function writeAttachments(
  unitId: string,
  next: Record<string, ScreenerAttachment>,
) {
  window.localStorage.setItem(attachStorageKey(unitId), JSON.stringify(next));
  window.dispatchEvent(
    new CustomEvent(SCREENER_ATTACH_EVENT, { detail: { unitId } }),
  );
}

export function attachScreenerDoc(
  unitId: string,
  permitName: string,
  docName: string,
  fileName: string,
) {
  const next = { ...readAttachments(unitId) };
  next[docAttachKey(permitName, docName)] = {
    fileName,
    attachedAt: new Date().toISOString(),
  };
  writeAttachments(unitId, next);
}

export function removeScreenerDoc(
  unitId: string,
  permitName: string,
  docName: string,
) {
  const next = { ...readAttachments(unitId) };
  delete next[docAttachKey(permitName, docName)];
  writeAttachments(unitId, next);
}

export function canAttachDoc(role: Role, doc: SupportingDoc) {
  return role === "contractor" && doc.supplier === "contractor";
}

export function screenerPackFor(
  state: QuizState,
  unit: Unit,
  attachments: Record<string, ScreenerAttachment>,
): ScreenerPack {
  if (!quizIsConfirmed(state)) {
    return { locked: false, permits: [], requiredCount: 0, attachedRequired: 0 };
  }
  const result = quizPermitResult(state, unit);
  const names = result
    ? [result.main, ...result.extras]
    : [];
  const permits: ScreenerPermit[] = names.map((name) => {
    const supporting = supportingDocsFor(name);
    const required = supporting.docs.filter(isRequiredDoc);
    const attachedRequired = required.filter(
      (doc) => attachments[docAttachKey(name, doc.name)],
    ).length;
    return {
      name,
      supporting,
      requiredCount: required.length,
      attachedRequired,
    };
  });
  return {
    locked: true,
    permits,
    requiredCount: permits.reduce((n, p) => n + p.requiredCount, 0),
    attachedRequired: permits.reduce((n, p) => n + p.attachedRequired, 0),
  };
}

export function screenerPackForJob(
  job: WorksJob | null,
  unit: Unit,
  attachments: Record<string, ScreenerAttachment>,
): ScreenerPack {
  if (!job || !quizIsConfirmed(job.quiz)) {
    return { locked: false, permits: [], requiredCount: 0, attachedRequired: 0 };
  }
  const names = worksOutcome(job, unit).permits;
  const permits: ScreenerPermit[] = names.map((name) => {
    const supporting = supportingDocsFor(name);
    const required = supporting.docs.filter(isRequiredDoc);
    const attachedRequired = required.filter(
      (doc) => attachments[docAttachKey(name, doc.name)],
    ).length;
    return {
      name,
      supporting,
      requiredCount: required.length,
      attachedRequired,
    };
  });
  return {
    locked: true,
    permits,
    requiredCount: permits.reduce((n, p) => n + p.requiredCount, 0),
    attachedRequired: permits.reduce((n, p) => n + p.attachedRequired, 0),
  };
}

export function useLiveLockedWorksJob(unitId: string): WorksJob | null {
  const [job, setJob] = useState(() => latestLockedWorksJob(unitId));
  const [seenId, setSeenId] = useState(unitId);
  if (seenId !== unitId) {
    setSeenId(unitId);
    setJob(latestLockedWorksJob(unitId));
  }
  useEffect(() => {
    const refresh = () => setJob(latestLockedWorksJob(unitId));
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    window.addEventListener(WORKS_CHANGED_EVENT, refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
      window.removeEventListener(WORKS_CHANGED_EVENT, refresh);
    };
  }, [unitId]);
  return job;
}

export function screenerIntro(role: Role) {
  if (role === "contractor") return screenerCopy.introContractor;
  if (role === "tenant") return screenerCopy.introTenant;
  return screenerCopy.introOfficer;
}

export function screenerWaiting(role: Role) {
  if (role === "contractor") return screenerCopy.waitingContractor;
  if (role === "tenant") return screenerCopy.waitingTenant;
  return screenerCopy.waitingOfficer;
}

export function useLiveQuizState(unitId: string): QuizState {
  const [state, setState] = useState(() => readQuizState(unitId));
  const [seenId, setSeenId] = useState(unitId);
  if (seenId !== unitId) {
    setSeenId(unitId);
    setState(readQuizState(unitId));
  }
  useEffect(() => {
    const refresh = () => setState(readQuizState(unitId));
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    window.addEventListener(QUIZ_CHANGED_EVENT, refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
      window.removeEventListener(QUIZ_CHANGED_EVENT, refresh);
    };
  }, [unitId]);
  return state;
}

export function useScreenerAttachments(unitId: string) {
  const [attachments, setAttachments] = useState(() =>
    readAttachments(unitId),
  );
  const [seenId, setSeenId] = useState(unitId);
  if (seenId !== unitId) {
    setSeenId(unitId);
    setAttachments(readAttachments(unitId));
  }
  useEffect(() => {
    const refresh = () => setAttachments(readAttachments(unitId));
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    window.addEventListener(SCREENER_ATTACH_EVENT, refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
      window.removeEventListener(SCREENER_ATTACH_EVENT, refresh);
    };
  }, [unitId]);
  return attachments;
}
