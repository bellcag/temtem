import type { Role } from "@/lib/app-state";
import type { PlannedWorkSlug, Unit } from "@/lib/tenancy-data";
import {
  confirmPlannedWorks,
  EMPTY_ANSWERS,
  extraPermitsForSlug,
  operateQuizStorageKey,
  QUIZ_CHANGED_EVENT,
  questionsForUnit,
  quizHasSavedAnswers,
  quizIsComplete,
  quizIsConfirmed,
  quizPermitResult,
  quizStorageKey,
  slugFlags,
  type QuizQuestion,
  type QuizState,
} from "@/lib/process-planned-works-quiz";

export const WORKS_HREF = "/works";

export type WorksJobKind = "opening" | "operate" | "exit";

export type WorksJob = {
  id: string;
  unitId: string;
  kind: WorksJobKind;
  title: string;
  createdAt: string;
  quiz: QuizState;
};

export const WORKS_KIND_LABEL: Record<WorksJobKind, string> = {
  opening: "Opening",
  operate: "During lease",
  exit: "Exit",
};

export const WORKS_CHANGED_EVENT = "tempo:v24:works-jobs";

function storageKey(unitId: string) {
  return `tempo:v24:works-jobs:${unitId}`;
}

function newId() {
  return `job-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function isLegacySeededOpening(job: WorksJob): boolean {
  return (
    job.kind === "opening" &&
    job.id === `opening-${job.unitId}` &&
    job.createdAt === "2026-01-15T00:00:00.000Z"
  );
}

export function readWorksJobs(unitId: string): WorksJob[] {
  try {
    const raw = window.localStorage.getItem(storageKey(unitId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as WorksJob[];
    if (!Array.isArray(parsed)) return [];
    const jobs = parsed.filter(
      (job) => job && job.unitId === unitId && !isLegacySeededOpening(job),
    );
    const stored = parsed.filter((job) => job && job.unitId === unitId);
    if (jobs.length !== stored.length) writeWorksJobs(unitId, jobs);
    return jobs;
  } catch {
    return [];
  }
}

export function writeWorksJobs(unitId: string, jobs: WorksJob[]) {
  window.localStorage.setItem(storageKey(unitId), JSON.stringify(jobs));
  window.dispatchEvent(
    new CustomEvent(WORKS_CHANGED_EVENT, { detail: { unitId } }),
  );
}

function emptyQuiz(): QuizState {
  return {
    status: "idle",
    answers: { ...EMPTY_ANSWERS },
    confirmed: false,
  };
}

export type WorksDemoStory = "first-fitout" | "takeover";

export const WORKS_DEMO_STORIES: { id: WorksDemoStory; label: string }[] = [
  { id: "first-fitout", label: "First fit-out" },
  { id: "takeover", label: "Takeover" },
];

export const WORKS_DEMO_STORY_KEY = "tempo:v24:works-demo-story";

export function readWorksDemoStory(): WorksDemoStory | null {
  try {
    const raw = window.localStorage.getItem(WORKS_DEMO_STORY_KEY);
    if (raw === "first-fitout" || raw === "takeover") return raw;
    return null;
  } catch {
    return null;
  }
}

function clearWorksDemoStorage(unitId: string) {
  window.localStorage.removeItem(storageKey(unitId));
  window.localStorage.removeItem(bypassKey(unitId));
  window.localStorage.removeItem(quizStorageKey(unitId));
  window.localStorage.removeItem(operateQuizStorageKey(unitId));
  window.localStorage.removeItem(`tempo:v19:screener-pack:${unitId}`);
  window.dispatchEvent(new CustomEvent(QUIZ_CHANGED_EVENT, { detail: { unitId } }));
}

export function applyWorksDemoStory(unitId: string, story: WorksDemoStory) {
  clearWorksDemoStorage(unitId);
  window.localStorage.setItem(WORKS_DEMO_STORY_KEY, story);
  const now = new Date();
  if (story === "first-fitout") {
    writeWorksJobs(unitId, [
      {
        id: `opening-${unitId}-demo`,
        unitId,
        kind: "opening",
        title: "Opening fit-out",
        createdAt: now.toISOString(),
        quiz: emptyQuiz(),
      },
    ]);
    return;
  }
  window.localStorage.setItem(bypassKey(unitId), "takeover");
  writeWorksJobs(unitId, [
    {
      id: `operate-${unitId}-demo`,
      unitId,
      kind: "operate",
      title: `Works · ${now.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      })}`,
      createdAt: now.toISOString(),
      quiz: emptyQuiz(),
    },
  ]);
}

export function latestLockedWorksJob(unitId: string): WorksJob | null {
  const locked = readWorksJobs(unitId).filter((job) =>
    quizIsConfirmed(job.quiz),
  );
  if (locked.length === 0) return null;
  return [...locked].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
}

export function openingBypassLabel(reason: OpeningBypass): string {
  return reason === "takeover"
    ? "Takeover from outgoing tenant."
    : "Unit already fitted.";
}

export function upsertWorksJob(unitId: string, job: WorksJob) {
  const jobs = readWorksJobs(unitId);
  const next = jobs.some((row) => row.id === job.id)
    ? jobs.map((row) => (row.id === job.id ? job : row))
    : [job, ...jobs];
  writeWorksJobs(unitId, next);
  return next;
}

export function ensureOpeningJob(unitId: string): WorksJob | null {
  if (readOpeningBypass(unitId)) return null;
  return startWorksJob(unitId, "opening");
}

export type OpeningBypass = "takeover" | "already-fitted";

function bypassKey(unitId: string) {
  return `tempo:v24:opening-bypass:${unitId}`;
}

export function readOpeningBypass(unitId: string): OpeningBypass | null {
  try {
    const raw = window.localStorage.getItem(bypassKey(unitId));
    if (raw === "takeover" || raw === "already-fitted") return raw;
    return null;
  } catch {
    return null;
  }
}

export function writeOpeningBypass(unitId: string, reason: OpeningBypass) {
  window.localStorage.setItem(bypassKey(unitId), reason);
  window.dispatchEvent(
    new CustomEvent(WORKS_CHANGED_EVENT, { detail: { unitId } }),
  );
}

export function openingListIsReady(jobs: WorksJob[]): boolean {
  const opening = jobs.find((job) => job.kind === "opening");
  if (!opening) return false;
  return quizHasSavedAnswers(opening.quiz) || quizIsConfirmed(opening.quiz);
}

export function operateWorksUnlocked(unitId: string, jobs: WorksJob[]): boolean {
  return openingListIsReady(jobs) || readOpeningBypass(unitId) !== null;
}

/** The list this unit should show now. Later stages stay hidden until they are live. */
export function liveWorksKind(unitId: string, jobs: WorksJob[]): WorksJobKind {
  if (readOpeningBypass(unitId)) return "operate";
  if (
    jobs.some((job) => job.kind === "operate") &&
    operateWorksUnlocked(unitId, jobs)
  ) {
    return "operate";
  }
  return "opening";
}

export function startOperateSkippingOpening(
  unitId: string,
  reason: OpeningBypass,
): WorksJob | null {
  writeOpeningBypass(unitId, reason);
  const kept = readWorksJobs(unitId).filter((job) => {
    if (job.kind !== "opening") return true;
    return quizHasSavedAnswers(job.quiz) || quizIsConfirmed(job.quiz);
  });
  writeWorksJobs(unitId, kept);
  return startWorksJob(unitId, "operate");
}

export function startWorksJob(
  unitId: string,
  kind: WorksJobKind,
): WorksJob | null {
  const jobs = readWorksJobs(unitId);
  if (kind === "operate" && !operateWorksUnlocked(unitId, jobs)) return null;
  if (kind === "opening") {
    const existing = jobs.find((job) => job.kind === "opening");
    if (existing) return existing;
  }
  if (kind === "exit") {
    const existing = jobs.find((job) => job.kind === "exit");
    if (existing) return existing;
  }
  const now = new Date();
  const title =
    kind === "opening"
      ? "Opening fit-out"
      : kind === "exit"
        ? "Reinstatement"
        : `Works · ${now.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
          })}`;
  const job: WorksJob = {
    id: newId(),
    unitId,
    kind,
    title,
    createdAt: now.toISOString(),
    quiz: emptyQuiz(),
  };
  upsertWorksJob(unitId, job);
  return job;
}

export function lockWorksJob(unitId: string, job: WorksJob): WorksJob {
  const next = { ...job, quiz: confirmPlannedWorks(job.quiz) };
  upsertWorksJob(unitId, next);
  return next;
}

export function questionsForJobKind(
  unit: Unit,
  kind: WorksJobKind,
): QuizQuestion[] {
  return questionsForUnit(unit).map((question) => {
    if (question.id !== "scope") return question;
    if (kind === "opening") return question;
    const hide = new Set<PlannedWorkSlug>([
      "change-of-use",
      "takeover-from-exiting-tenant",
    ]);
    if (kind === "operate") hide.add("large-scale-renovation");
    return {
      ...question,
      prompt:
        kind === "exit"
          ? "What must come out or go back?"
          : "What kind of works is this?",
      options: question.options.filter((option) => !hide.has(option.id)),
    };
  });
}

export function mainPermitForKind(kind: WorksJobKind): string {
  if (kind === "exit") return "Reinstatement Permit to Work";
  if (kind === "operate") return "Extra renovation permit";
  return "Tenancy Project work";
}

const STEP_FOR_SLUG: Partial<Record<PlannedWorkSlug, string>> = {
  "change-of-use": "Change of Use",
  "large-scale-renovation": "First design concept",
  "fire-safety-submission": "Fire Safety Certificate",
  "fire-alarm-isolation": "Joint site inspection",
  "above-ceiling-works": "Joint site inspection",
  "roof-works": "Joint site inspection",
  "structural-works": "BIM model",
  "mep-changes": "BIM model",
  "takeover-from-exiting-tenant": "Qualified Person letter",
  "waterproofing-works": "Waterproofing and ponding",
  "fire-protection-detection-works": "FSSD notice of approval",
};

function extraStepsForSlug(
  slug: PlannedWorkSlug,
  kind: WorksJobKind,
): string[] {
  if (kind !== "opening" && slug === "change-of-use") return [];
  if (kind !== "opening" && slug === "large-scale-renovation") return [];
  if (kind !== "opening" && slug === "takeover-from-exiting-tenant") return [];
  if (kind === "exit" && slug === "structured-cabling") {
    return ["Structured cabling disconnection"];
  }
  const step = STEP_FOR_SLUG[slug];
  return step ? [step] : [];
}

export type WorksOutcomeStep = {
  name: string;
  lead: string;
  because: string[];
};

const STEP_LEAD: Record<string, Record<Role, string>> = {
  "Change of Use": {
    tenant: "Your Project Officer checks Change of Use with URA.",
    contractor: "Your Project Officer checks Change of Use with URA.",
    officer: "Check Change of Use with URA.",
  },
  "First design concept": {
    tenant:
      "Share a first design concept early so Design Management can flag issues before full drawings.",
    contractor:
      "Wait for the tenant’s first concept to clear before treating drawings as locked.",
    officer:
      "Share a first design concept with Design Management before drawings lock.",
  },
  "Fire Safety Certificate": {
    tenant:
      "Your contractor’s Qualified Person confirms whether a Fire Safety Certificate is needed. You stay the Applicant.",
    contractor:
      "Your Qualified Person confirms whether a Fire Safety Certificate is needed.",
    officer:
      "Qualified Person confirms whether a Fire Safety Certificate applies.",
  },
  "Joint site inspection": {
    tenant:
      "Your contractor books a walk with Building Maintenance before isolation or roof work can be endorsed.",
    contractor:
      "Book the joint site inspection with Building Maintenance before isolation or roof work.",
    officer:
      "Check the joint site inspection is booked before isolation or roof work is endorsed.",
  },
  "BIM model": {
    tenant: "Your contractor submits a BIM model for structural or MEP changes.",
    contractor: "Submit the BIM model for this job.",
    officer: "Check the BIM model for this job.",
  },
  "Qualified Person letter": {
    tenant: "Your contractor emails the QP letter to your Project Officer.",
    contractor: "Email the QP letter to your Project Officer.",
    officer: "The contractor emails the QP letter.",
  },
  "Waterproofing and ponding": {
    tenant:
      "IFM checks waterproofing and witnesses the ponding test with your contractor.",
    contractor: "Walk waterproofing checks and the ponding test with IFM.",
    officer: "IFM checks waterproofing and witnesses the ponding test.",
  },
  "FSSD notice of approval": {
    tenant: "The FSSD Notice of Approval is submitted for fire system works.",
    contractor: "Submit the FSSD Notice of Approval for fire system works.",
    officer: "Check the FSSD Notice of Approval for fire system works.",
  },
  "Structured cabling disconnection": {
    tenant: "Your contractor disconnects structured cabling before handover.",
    contractor: "Disconnect structured cabling before handover.",
    officer: "Check structured cabling is disconnected before handover.",
  },
};

function optionLabelForSlug(
  unit: Unit,
  kind: WorksJobKind,
  slug: PlannedWorkSlug,
): string {
  for (const question of questionsForJobKind(unit, kind)) {
    const option = question.options.find((row) => row.id === slug);
    if (option) return option.label;
  }
  return slug;
}

export function worksOutcome(
  job: WorksJob,
  unit: Unit,
  role: Role = "contractor",
): {
  permits: string[];
  steps: WorksOutcomeStep[];
  locked: boolean;
  ready: boolean;
} {
  const locked = quizIsConfirmed(job.quiz);
  const ready = quizHasSavedAnswers(job.quiz);
  if (!ready) {
    return { permits: [], steps: [], locked, ready: false };
  }
  const flags = slugFlags(job.quiz, unit);
  const extras: string[] = [];
  const stepMap = new Map<string, WorksOutcomeStep>();
  const seenPermit = new Set<string>();
  const main = mainPermitForKind(job.kind);
  extras.push(main);
  seenPermit.add(main);
  for (const [slug, flag] of Object.entries(flags)) {
    if (flag !== "on") continue;
    const planned = slug as PlannedWorkSlug;
    for (const name of extraPermitsForSlug(planned, unit)) {
      if (seenPermit.has(name)) continue;
      seenPermit.add(name);
      extras.push(name);
    }
    const because = optionLabelForSlug(unit, job.kind, planned);
    for (const name of extraStepsForSlug(planned, job.kind)) {
      const existing = stepMap.get(name);
      if (existing) {
        if (!existing.because.includes(because)) existing.because.push(because);
        continue;
      }
      stepMap.set(name, {
        name,
        lead:
          STEP_LEAD[name]?.[role] ??
          "This follows from the agreed answers.",
        because: [because],
      });
    }
  }
  const fromQuiz = quizPermitResult(job.quiz, unit);
  if (fromQuiz) {
    for (const name of fromQuiz.extras) {
      if (seenPermit.has(name)) continue;
      seenPermit.add(name);
      extras.push(name);
    }
  }
  return { permits: extras, steps: [...stepMap.values()], locked, ready: true };
}

export function jobStatusLabel(job: WorksJob): string {
  if (quizIsConfirmed(job.quiz)) return "List locked";
  if (quizHasSavedAnswers(job.quiz)) return "Filling the list";
  return "List not filled";
}

export function worksDoorCopy(
  kind: WorksJobKind,
  role: Role,
): { title: string; lead: string; bullet: string; cta: string } {
  if (kind === "exit") {
    return {
      title: "Reinstatement works",
      lead: "See the list",
      bullet:
        role === "tenant"
          ? "Read what must be put back before takeover."
          : role === "contractor"
            ? "Read the reinstatement list, then apply."
            : "Tick what this strip-out needs, then lock the list.",
      cta: "See works",
    };
  }
  if (kind === "opening") {
    return {
      title: "Opening works",
      lead: "See the list",
      bullet:
        role === "tenant"
          ? "Read the works agreed for opening."
          : role === "contractor"
            ? "Tick opening works before the IFM briefing."
            : "Confirm opening works at the IFM briefing.",
      cta: "See works",
    };
  }
  return {
    title: "Works during the lease",
    lead: "See the list",
    bullet:
      role === "tenant"
        ? "Read works the Project Officer started for this unit."
        : role === "contractor"
          ? "Read the list, or tick if the officer has not yet."
          : "Start a job when the unit needs a refresh or fix.",
    cta: "See works",
  };
}

export function worksHref(kind?: WorksJobKind, jobId?: string) {
  const params = new URLSearchParams();
  if (kind) params.set("kind", kind);
  if (jobId) params.set("job", jobId);
  const q = params.toString();
  return q ? `${WORKS_HREF}?${q}` : WORKS_HREF;
}

export function canStartWorksJob(
  role: Role,
  kind: WorksJobKind,
  jobs: WorksJob[] = [],
  unitId = "",
): boolean {
  if (role !== "officer") return false;
  if (kind === "operate" && !operateWorksUnlocked(unitId, jobs)) return false;
  return kind === "operate" || kind === "exit" || kind === "opening";
}

export function canFillWorksJob(role: Role, job: WorksJob): boolean {
  if (quizIsConfirmed(job.quiz)) return false;
  if (role === "officer") return true;
  if (role === "contractor") return true;
  return false;
}

export function canLockWorksJob(role: Role, job: WorksJob, unit: Unit): boolean {
  return (
    role === "officer" &&
    quizIsComplete(job.quiz, unit) &&
    !quizIsConfirmed(job.quiz)
  );
}
