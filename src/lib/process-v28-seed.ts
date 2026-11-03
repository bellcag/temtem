import type { Role } from "@/lib/app-state";
import type { PlannedWorkSlug, Unit } from "@/lib/tenancy-data";
import {
  EMPTY_ANSWERS,
  type QuizState,
} from "@/lib/process-planned-works-quiz";
import { stampV26UnitFacts } from "@/lib/process-v26-quiz";
import {
  readV26Works,
  upsertV26Work,
  v26DocumentChecklist,
  v26DraftOutcome,
  writeV26Works,
  type V26Work,
} from "@/lib/process-v26-works";
import {
  hydrateV28FromLegacy,
  NONE_ID,
  NO_RENO_ID,
  MINOR_FITOUT_ID,
  settleV28Write,
  setV28Check,
  setV28Choice,
  setV28Text,
  setV28YesNo,
  syncV28Slugs,
  v28Answer,
  v28QuizProgress,
  v28VisibleSections,
  v28YesNoValue,
} from "@/lib/process-v28-quiz";
import {
  clearV28Attachments,
  flagV28Docs,
  resetV28PackState,
  seedV28Attachments,
  seedV28PartialAttachments,
  seedV28PassedPack,
  writeV28Screen,
  writeV28Submitted,
} from "@/lib/process-v28-screener";
import { clearV31Closes, closeV31Step, completeV31Work, resetV31ListState } from "@/lib/process-v31-works";
import { v33DocumentChecklist, v33ProjectOutcome } from "@/lib/process-v33-feed";
import { isV34Path, usesV37Cut, usesV35Flow } from "@/lib/process-v31-preview";

export type V28WorksStory = "opening" | "operate" | "exit" | "mixed";

export const V28_WORKS_STORY_KEY = "tempo:v28:works-story";
export const V28_WORKS_STORY_CHANGED = "tempo:v28:works-story";

export const V28_WORKS_STORIES: {
  id: V28WorksStory;
  label: string;
  phase: "build" | "operate" | "exit";
}[] = [
  { id: "opening", label: "Opening · 1 work", phase: "build" },
  { id: "operate", label: "While open · 3rd work", phase: "operate" },
  { id: "exit", label: "Leaving · screen to submit", phase: "exit" },
  { id: "mixed", label: "Mixed · quizzes and screening", phase: "operate" },
];

export function readV28WorksStory(): V28WorksStory | null {
  try {
    const raw = window.localStorage.getItem(V28_WORKS_STORY_KEY);
    if (raw === "opening" || raw === "operate" || raw === "exit" || raw === "mixed") return raw;
  } catch {
    /* ignore */
  }
  return null;
}

export function writeV28WorksStory(story: V28WorksStory | null) {
  if (story) window.localStorage.setItem(V28_WORKS_STORY_KEY, story);
  else window.localStorage.removeItem(V28_WORKS_STORY_KEY);
  window.dispatchEvent(new Event(V28_WORKS_STORY_CHANGED));
}

export function v28PassedWorkId(unitId: string) {
  return `v28-passed-${unitId}`;
}

type QuizTicks = {
  scope?: PlannedWorkSlug[];
  fire?: PlannedWorkSlug[];
  structure?: PlannedWorkSlug[];
  mep?: PlannedWorkSlug[];
  external?: PlannedWorkSlug[];
};

function confirmedQuiz(unit: Unit, ticks: QuizTicks = {}): QuizState {
  const legacy: QuizState = {
    status: "done",
    confirmed: true,
    answers: {
      ...EMPTY_ANSWERS,
      unit: { kind: "selected", slugs: ["facing-travelling-pax"] },
      scope: {
        kind: "selected",
        slugs: ticks.scope ?? ["large-scale-renovation"],
      },
      fire: ticks.fire?.length
        ? { kind: "selected", slugs: ticks.fire }
        : { kind: "none" },
      structure: ticks.structure?.length
        ? { kind: "selected", slugs: ticks.structure }
        : { kind: "none" },
      mep: ticks.mep?.length
        ? { kind: "selected", slugs: ticks.mep }
        : { kind: "none" },
      external: ticks.external?.length
        ? { kind: "selected", slugs: ticks.external }
        : { kind: "none" },
    },
  };
  let quiz = stampV26UnitFacts(hydrateV28FromLegacy(legacy, unit), unit);
  for (let i = 0; i < 6; i += 1) {
    const { answered, total } = v28QuizProgress(quiz);
    if (total > 0 && answered >= total) break;
    for (const section of v28VisibleSections(quiz)) {
      for (const field of section.fields) {
        if (field.kind === "notes" || field.kind === "text") continue;
        if (field.kind === "yesno") {
          if (v28YesNoValue(quiz, field.id) == null) {
            quiz = setV28YesNo(quiz, field.id, "no");
          }
          continue;
        }
        if (field.kind === "choice") {
          if (v28Answer(quiz, field.id).kind === "unanswered") {
            const pick =
              field.options.find((row) => row.id !== "other")?.id ??
              field.options[0]?.id;
            if (pick) quiz = setV28Choice(quiz, field.id, pick);
          }
          continue;
        }
        if (v28Answer(quiz, field.id).kind === "unanswered") {
          quiz = setV28Check(quiz, field.id, NONE_ID);
        }
      }
    }
  }
  return {
    ...settleV28Write(syncV28Slugs(quiz)),
    confirmed: true,
    status: "done",
  };
}

export function v28FullRenovationQuiz(unit: Unit): QuizState {
  return withAbout(
    setV28Text(confirmedQuiz(unit, FULL_TICKS), "q-name", "Full Renovation"),
    "Refit the whole store for the new brand look.",
  );
}

function noRenovationQuiz(unit: Unit): QuizState {
  return {
    ...settleV28Write(
      syncV28Slugs(
        withAbout(
          setV28Check(confirmedQuiz(unit, {}), "q5", NO_RENO_ID),
          "Open with the existing fit-out. No construction.",
        ),
      ),
    ),
    confirmed: true,
    status: "done",
  };
}

function minorFitoutQuiz(unit: Unit): QuizState {
  let quiz = setV28Check(confirmedQuiz(unit, {}), "q5", MINOR_FITOUT_ID);
  quiz = setV28Check(quiz, "q4", NONE_ID);
  return {
    ...settleV28Write(
      syncV28Slugs(
        withAbout(quiz, "Replace built-in furniture and finishes. No M&E changes."),
      ),
    ),
    confirmed: true,
    status: "done",
  };
}

function filledQuiz(unit: Unit, ticks: QuizTicks = {}): QuizState {
  return { ...confirmedQuiz(unit, ticks), confirmed: false, status: "done" };
}

function startedQuiz(unit: Unit): QuizState {
  const legacy: QuizState = {
    status: "idle",
    confirmed: false,
    answers: {
      ...EMPTY_ANSWERS,
      unit: { kind: "selected", slugs: ["facing-travelling-pax"] },
      scope: { kind: "selected", slugs: ["large-scale-renovation"] },
    },
  };
  let quiz = stampV26UnitFacts(hydrateV28FromLegacy(legacy, unit), unit);
  let filled = 0;
  for (const section of v28VisibleSections(quiz)) {
    for (const field of section.fields) {
      if (filled >= 3) break;
      if (field.kind === "notes" || field.kind === "text") continue;
      if (field.kind === "yesno") {
        if (v28YesNoValue(quiz, field.id) == null) {
          quiz = setV28YesNo(quiz, field.id, "no");
          filled += 1;
        }
        continue;
      }
      if (field.kind === "choice") {
        if (v28Answer(quiz, field.id).kind === "unanswered") {
          const pick =
            field.options.find((row) => row.id !== "other")?.id ??
            field.options[0]?.id;
          if (pick) {
            quiz = setV28Choice(quiz, field.id, pick);
            filled += 1;
          }
        }
        continue;
      }
      if (v28Answer(quiz, field.id).kind === "unanswered") {
        quiz = setV28Check(quiz, field.id, NONE_ID);
        filled += 1;
      }
    }
    if (filled >= 3) break;
  }
  return { ...settleV28Write(syncV28Slugs(quiz)), confirmed: false, status: "idle" };
}

const OPENING_TICKS: QuizTicks = {
  fire: ["hot-work", "fire-alarm-isolation"],
};

/** Every permit slug, plus the two conditional checks (letter of undertaking, waterproofing). */
const FULL_TICKS: QuizTicks = {
  scope: [
    "large-scale-renovation",
    "additional-renovation-scope",
    "takeover-from-exiting-tenant",
  ],
  fire: ["hot-work", "fire-alarm-isolation"],
  structure: ["above-ceiling-works", "catwalk-access"],
  mep: ["mep-changes", "waterproofing-works"],
  external: [
    "structured-cabling",
    "telco-cabling",
    "skytrain-work",
    "authority-approval",
  ],
};

export function v31FullWorkId(unitId: string) {
  return `v28-operate-full-${unitId}`;
}

/** v33 names permits from the journey catalogue, so its files sit under different keys. Seed both. */
function requiredDocs(unit: Unit, role: Role, work: V26Work) {
  const rows = [
    ...v33DocumentChecklist(v33ProjectOutcome(work, role, unit).permits, role),
    ...v26DocumentChecklist(v26DraftOutcome(work, role, unit).permits, role),
  ].filter((row) => row.need === "Required");
  return [
    ...new Map(
      rows.map((row) => [
        `${row.permitName}::${row.doc.name}`,
        { permitName: row.permitName, name: row.doc.name },
      ]),
    ).values(),
  ];
}

function openQuiz(): QuizState {
  return {
    status: "idle",
    confirmed: false,
    answers: { ...EMPTY_ANSWERS },
  };
}

function markScreeningStarted(unit: Unit, role: Role, work: V26Work) {
  seedV28Attachments(unit.id, work.id, requiredDocs(unit, role, work));
  writeV28Screen(unit.id, work.id, { result: "idle", runs: 1 });
  writeV28Submitted(unit.id, work.id, false);
}

/** Past "Before you apply": close the steps on both catalogues so the page agrees with the list. */
function closeBeforeSteps(unit: Unit, role: Role, work: V26Work) {
  const steps = [
    ...v26DraftOutcome(work, role, unit).steps,
    ...v33ProjectOutcome(work, role, unit).steps,
  ];
  for (const step of steps) {
    if (step.group === "before") closeV31Step(unit.id, work.id, step.id);
  }
}

function markFilesFiling(unit: Unit, role: Role, work: V26Work) {
  const docs = requiredDocs(unit, role, work);
  seedV28PartialAttachments(unit.id, work.id, docs, 2);
  writeV28Screen(unit.id, work.id, { result: "idle", runs: 0 });
  writeV28Submitted(unit.id, work.id, false);
  closeBeforeSteps(unit, role, work);
}

function markScreeningDone(unit: Unit, role: Role, work: V26Work) {
  seedV28PassedPack(unit.id, work.id, requiredDocs(unit, role, work));
  writeV28Submitted(unit.id, work.id, false);
}

function markSubmitted(unit: Unit, role: Role, work: V26Work) {
  seedV28PassedPack(unit.id, work.id, requiredDocs(unit, role, work));
  writeV28Submitted(unit.id, work.id, true);
}

function markReadyToScreen(unit: Unit, role: Role, work: V26Work) {
  seedV28Attachments(unit.id, work.id, requiredDocs(unit, role, work));
  writeV28Screen(unit.id, work.id, { result: "idle", runs: 0 });
  writeV28Submitted(unit.id, work.id, false);
}

function markScreeningRunning(unit: Unit, role: Role, work: V26Work) {
  seedV28Attachments(unit.id, work.id, requiredDocs(unit, role, work));
  writeV28Screen(unit.id, work.id, { result: "running", runs: 1 });
  writeV28Submitted(unit.id, work.id, false);
}

function storyWorks(unit: Unit, story: V28WorksStory): V26Work[] {
  if (story === "opening") {
    return [
      {
        id: `v28-opening-${unit.id}`,
        unitId: unit.id,
        title: "Opening Fit-Out",
        createdAt: "2026-02-10T09:00:00.000Z",
        quiz: confirmedQuiz(unit, OPENING_TICKS),
      },
    ];
  }
  if (story === "operate") {
    return [
      {
        id: `v28-operate-1-${unit.id}`,
        unitId: unit.id,
        title: "Opening Fit-Out",
        createdAt: "2026-02-10T09:00:00.000Z",
        quiz: confirmedQuiz(unit, OPENING_TICKS),
      },
      {
        id: `v28-operate-2-${unit.id}`,
        unitId: unit.id,
        title: "Further Works",
        createdAt: "2026-06-08T09:00:00.000Z",
        quiz: confirmedQuiz(unit, {
          structure: ["above-ceiling-works"],
        }),
      },
      {
        id: `v28-operate-3-${unit.id}`,
        unitId: unit.id,
        title: "Further Works",
        createdAt: "2026-09-03T09:00:00.000Z",
        quiz: confirmedQuiz(unit, {
          mep: ["waterproofing-works"],
        }),
      },
    ];
  }
  if (story === "mixed") {
    return [
      {
        id: `v28-mixed-quiz-a-${unit.id}`,
        unitId: unit.id,
        title: "Shopfront Renovation",
        createdAt: "2026-06-01T09:00:00.000Z",
        quiz: openQuiz(),
      },
      {
        id: `v28-mixed-quiz-b-${unit.id}`,
        unitId: unit.id,
        title: "Counter Renovation",
        createdAt: "2026-07-01T09:00:00.000Z",
        quiz: openQuiz(),
      },
      {
        id: `v28-mixed-screen-a-${unit.id}`,
        unitId: unit.id,
        title: "Hot Work + Isolation",
        createdAt: "2026-08-01T09:00:00.000Z",
        quiz: confirmedQuiz(unit, OPENING_TICKS),
      },
      {
        id: `v28-mixed-screen-b-${unit.id}`,
        unitId: unit.id,
        title: "Ceiling Works",
        createdAt: "2026-08-15T09:00:00.000Z",
        quiz: confirmedQuiz(unit, OPENING_TICKS),
      },
      {
        id: `v28-mixed-passed-${unit.id}`,
        unitId: unit.id,
        title: "M&E Works",
        createdAt: "2026-09-05T09:00:00.000Z",
        quiz: confirmedQuiz(unit, OPENING_TICKS),
      },
    ];
  }
  return [
    {
      id: `v28-exit-${unit.id}`,
      unitId: unit.id,
      title: "Exit Works",
      createdAt: "2026-09-20T09:00:00.000Z",
      quiz: confirmedQuiz(unit, OPENING_TICKS),
    },
  ];
}

export function applyV28WorksStory(unit: Unit, role: Role, story: V28WorksStory) {
  writeV28WorksStory(story);
  const works = storyWorks(unit, story);
  writeV26Works(unit.id, works);
  if (story === "operate") {
    markSubmitted(unit, role, works[0]);
    markSubmitted(unit, role, works[1]);
  }
  if (story === "exit") {
    markReadyToScreen(unit, role, works[0]);
  }
  if (story === "mixed") {
    markScreeningStarted(unit, role, works[2]);
    markScreeningStarted(unit, role, works[3]);
    markScreeningDone(unit, role, works[4]);
  }
}

/** One confirmed project that carries every permit and both conditional checks. */
export function ensureV31FullScenario(unit: Unit, role: Role) {
  const id = v31FullWorkId(unit.id);
  if (readV26Works(unit.id).some((row) => row.id === id)) return;
  const work: V26Work = {
    id,
    unitId: unit.id,
    title: "Full Renovation",
    createdAt: "2026-10-01T09:00:00.000Z",
    quiz: confirmedQuiz(unit, FULL_TICKS),
  };
  upsertV26Work(unit.id, work);
  markSubmitted(unit, role, work);
}

export function v31FilingWorkId(unitId: string) {
  return `v31-filing-${unitId}`;
}

/** One confirmed project still on the permit pack because files are not all in. */
export function ensureV31FilingProject(unit: Unit, role: Role) {
  const id = v31FilingWorkId(unit.id);
  if (readV26Works(unit.id).some((row) => row.id === id)) return;
  const work: V26Work = {
    id,
    unitId: unit.id,
    title: "Signage Renovation",
    createdAt: "2026-09-12T09:00:00.000Z",
    quiz: confirmedQuiz(unit, {
      mep: ["mep-changes"],
      external: ["structured-cabling"],
    }),
  };
  upsertV26Work(unit.id, work);
  markFilesFiling(unit, role, work);
}

export function v31JsiWorkId(unitId: string) {
  return `v31-jsi-${unitId}`;
}

function markPendingJsi(unit: Unit, work: V26Work) {
  clearV28Attachments(unit.id, work.id);
  writeV28Screen(unit.id, work.id, { result: "idle", runs: 0 });
  writeV28Submitted(unit.id, work.id, false);
}

/** One confirmed project still waiting on the joint site inspection. */
export function ensureV31JsiProject(unit: Unit, role: Role) {
  const id = v31JsiWorkId(unit.id);
  if (readV26Works(unit.id).some((row) => row.id === id)) return;
  const work: V26Work = {
    id,
    unitId: unit.id,
    title: "Kiosk Renovation",
    createdAt: "2026-08-22T09:00:00.000Z",
    quiz: confirmedQuiz(unit, { fire: ["fire-alarm-isolation"] }),
  };
  upsertV26Work(unit.id, work);
  markPendingJsi(unit, work);
}

function markScreeningIssues(unit: Unit, role: Role, work: V26Work) {
  seedV28Attachments(unit.id, work.id, requiredDocs(unit, role, work));
  flagV28Docs(unit.id, work.id, [
    {
      name: "Method of Statement",
      issue: "No qualified fire patroller named for hot works on site.",
    },
    {
      name: "Risk Assessment",
      issue: "Fire watch during hot works, and 60 minutes after, is missing.",
    },
  ]);
  writeV28Screen(unit.id, work.id, { result: "issues", runs: 1 });
  writeV28Submitted(unit.id, work.id, false);
}

function markComplete(unit: Unit, role: Role, work: V26Work) {
  markSubmitted(unit, role, work);
  completeV31Work(unit.id, work.id);
}

function afterBefore(mark: (unit: Unit, role: Role, work: V26Work) => void) {
  return (unit: Unit, role: Role, work: V26Work) => {
    closeBeforeSteps(unit, role, work);
    mark(unit, role, work);
  };
}

function v31StatusId(unitId: string, slug: string) {
  return `v31-status-${slug}-${unitId}`;
}

type StatusSpec = {
  slug: string;
  title: string;
  about: string;
  at: string;
  quiz: (unit: Unit) => QuizState;
  mark: (unit: Unit, role: Role, work: V26Work) => void;
  /** Name and description count as answers, so a not-started project leaves them blank. */
  blank?: boolean;
};

/** v34 has no step tick-off: one project per status it can show. */
const V34_DROPPED = new Set(["before", "jsi", "opening"]);

function v34StatusSpecs(): StatusSpec[] {
  return [
    ...v31StatusSpecs()
      .filter((spec) => !V34_DROPPED.has(spec.slug))
      .map((spec) => (spec.slug === "empty" ? { ...spec, blank: true } : spec)),
    {
      slug: "steps",
      title: "Unit Reinstatement",
      about: "Return the unit to bare shell before handback.",
      at: "2026-07-08T09:00:00.000Z",
      quiz: (unit) => confirmedQuiz(unit),
      mark: () => {},
    },
  ];
}

/** v37 adds the in-progress pack check — files are in, the system is still screening. */
function v37StatusSpecs(): StatusSpec[] {
  const specs = v34StatusSpecs();
  const at = specs.findIndex((spec) => spec.slug === "issues");
  const checking: StatusSpec = {
    slug: "checking",
    title: "Display Renovation",
    about: "Replace window displays after a leak.",
    at: "2026-08-20T09:00:00.000Z",
    quiz: (unit) =>
      confirmedQuiz(unit, { structure: ["above-ceiling-works"] }),
    mark: afterBefore(markScreeningRunning),
  };
  if (at < 0) return [...specs, checking];
  return [...specs.slice(0, at), checking, ...specs.slice(at)];
}

function v31StatusSpecs(): StatusSpec[] {
  return [
    {
      slug: "empty",
      title: "Shopfront Renovation",
      about: "Festive shopfront for Chinese New Year.",
      at: "2026-06-01T09:00:00.000Z",
      quiz: () => openQuiz(),
      mark: () => {},
    },
    {
      slug: "started",
      title: "Counter Renovation",
      about: "Rebuild the cashier counter.",
      at: "2026-06-15T09:00:00.000Z",
      quiz: (unit) => startedQuiz(unit),
      mark: () => {},
    },
    {
      slug: "confirm",
      title: "Lighting Renovation",
      about: "Swap track lights to LED.",
      at: "2026-07-01T09:00:00.000Z",
      quiz: (unit) => filledQuiz(unit, { mep: ["mep-changes"] }),
      mark: () => {},
    },
    {
      slug: "before",
      title: "Flooring Renovation",
      about: "Replace worn floor tiles at the entrance.",
      at: "2026-07-08T09:00:00.000Z",
      quiz: (unit) => confirmedQuiz(unit, { structure: ["above-ceiling-works"] }),
      mark: (unit, _role, work) => markPendingJsi(unit, work),
    },
    {
      slug: "jsi",
      title: "Kiosk Renovation",
      about: "Pop-up kiosk for a brand launch.",
      at: "2026-07-15T09:00:00.000Z",
      quiz: (unit) => confirmedQuiz(unit, { fire: ["fire-alarm-isolation"] }),
      mark: afterBefore((unit, _role, work) => markPendingJsi(unit, work)),
    },
    {
      slug: "files",
      title: "Signage Renovation",
      about: "Replace the shopfront lightbox sign.",
      at: "2026-08-01T09:00:00.000Z",
      quiz: (unit) =>
        confirmedQuiz(unit, {
          mep: ["mep-changes"],
          external: ["structured-cabling"],
        }),
      mark: (unit, role, work) => markFilesFiling(unit, role, work),
    },
    {
      slug: "screen",
      title: "Ceiling Renovation",
      about: "Repair ceiling boards after a leak.",
      at: "2026-08-15T09:00:00.000Z",
      quiz: (unit) =>
        confirmedQuiz(unit, { structure: ["above-ceiling-works"] }),
      mark: afterBefore(markScreeningStarted),
    },
    {
      slug: "issues",
      title: "Kitchen Renovation",
      about: "Fit a new kitchen, including hot works.",
      at: "2026-09-01T09:00:00.000Z",
      quiz: (unit) => confirmedQuiz(unit, { fire: ["hot-work"] }),
      mark: afterBefore(markScreeningIssues),
    },
    {
      slug: "download",
      title: "M&E Renovation",
      about: "Add power points for new displays.",
      at: "2026-09-15T09:00:00.000Z",
      quiz: (unit) => confirmedQuiz(unit, { mep: ["mep-changes"] }),
      mark: afterBefore(markScreeningDone),
    },
    {
      slug: "opening",
      title: "Full Renovation",
      about: "Refit the whole store for the new brand look.",
      at: "2026-10-01T09:00:00.000Z",
      quiz: (unit) => confirmedQuiz(unit, FULL_TICKS),
      mark: afterBefore(markSubmitted),
    },
    {
      slug: "complete",
      title: "Store Renovation",
      about: "Fit out the unit for opening.",
      at: "2026-10-15T09:00:00.000Z",
      quiz: (unit) => confirmedQuiz(unit, OPENING_TICKS),
      mark: afterBefore(markComplete),
    },
    {
      slug: "nopermit",
      title: "Store Opening",
      about: "Open with the existing fit-out. No construction.",
      at: "2026-11-01T09:00:00.000Z",
      quiz: (unit) => noRenovationQuiz(unit),
      mark: () => {},
    },
    {
      slug: "permitonly",
      title: "Minor Fit-Out",
      about: "Replace built-in furniture and finishes. No M&E changes.",
      at: "2026-11-08T09:00:00.000Z",
      quiz: (unit) => minorFitoutQuiz(unit),
      mark: () => {},
    },
  ];
}

function resetStatusWork(unit: Unit, work: V26Work) {
  resetV28PackState(unit.id, work.id);
  clearV31Closes(unit.id, work.id);
}

let applyingStatusCatalog = false;

/** One project per pipeline status. Tenant / officer see waiting; contractor sees the move. */
export function applyV31StatusCatalog(unit: Unit, role: Role) {
  if (applyingStatusCatalog) return;
  applyingStatusCatalog = true;
  try {
    resetV31ListState(unit.id);
    const specs = usesV37Cut(window.location.pathname)
      ? v37StatusSpecs()
      : usesV35Flow(window.location.pathname) || isV34Path(window.location.pathname)
        ? v34StatusSpecs()
        : v31StatusSpecs();
    const works = specs.map((spec) => workFromSpec(unit, spec));
    writeV26Works(unit.id, works);
    works.forEach((work, index) => {
      resetStatusWork(unit, work);
      specs[index].mark(unit, role, work);
    });
  } finally {
    applyingStatusCatalog = false;
  }
}

export function ensureV31StatusCatalog(unit: Unit, role: Role) {
  applyV31StatusCatalog(unit, role);
}

function workFromSpec(unit: Unit, spec: StatusSpec): V26Work {
  const quiz = spec.blank
    ? spec.quiz(unit)
    : withAbout(setV28Text(spec.quiz(unit), "q-name", spec.title), spec.about);
  return {
    id: v31StatusId(unit.id, spec.slug),
    unitId: unit.id,
    title: spec.title,
    createdAt: spec.at,
    quiz,
  };
}

type LifespanKind = { title: string; about: string; ticks?: QuizTicks };

/** Typical small works on one retail unit. Cycled across the lease, one after another. */
const LIFESPAN_KINDS: LifespanKind[] = [
  { title: "Signage Renovation", about: "Replace the shopfront lightbox sign" },
  { title: "Lighting Renovation", about: "Swap track lights to LED", ticks: { mep: ["mep-changes"] } },
  { title: "Shopfront Renovation", about: "Festive shopfront for Chinese New Year" },
  { title: "Counter Renovation", about: "Rebuild the cashier counter" },
  { title: "Ceiling Renovation", about: "Repair ceiling boards after a leak", ticks: { structure: ["above-ceiling-works"] } },
  { title: "Display Renovation", about: "New shelving for the season’s range" },
  { title: "M&E Renovation", about: "Add power points for new displays", ticks: { mep: ["mep-changes"] } },
  { title: "Flooring Renovation", about: "Replace worn floor tiles at the entrance" },
  { title: "Kiosk Renovation", about: "Pop-up kiosk for a brand launch", ticks: { fire: ["fire-alarm-isolation"] } },
  { title: "Signage Renovation", about: "Update brand signage to the new logo" },
  { title: "Shopfront Renovation", about: "Mid-year sale window display" },
  { title: "Lighting Renovation", about: "Add feature lighting over the counter", ticks: { mep: ["mep-changes"] } },
];

const LIFESPAN_START = Date.parse("2019-04-08T09:00:00.000Z");
const LIFESPAN_GAP_DAYS = 54;
const LIFESPAN_PAST = 45;
const LIFESPAN_REFRESH_AT = 22;

type LifespanLive = LifespanKind & {
  slug: string;
  at: string;
  quiz: (unit: Unit) => QuizState;
  mark: (unit: Unit, role: Role, work: V26Work) => void;
};

/**
 * The works in flight today: a store refit, the trades it pulls in, and the
 * next small job already being scoped. They sit at different stages, as they
 * would on a unit that has been trading for years.
 */
const LIFESPAN_LIVE: LifespanLive[] = [
  {
    slug: "refresh",
    title: "Full Renovation",
    about: "Refit the whole store for the new brand look",
    at: "2026-06-12T09:00:00.000Z",
    quiz: (unit) => confirmedQuiz(unit, FULL_TICKS),
    mark: afterBefore(markSubmitted),
  },
  {
    slug: "mep",
    title: "M&E Renovation",
    about: "Power and cooling for the refitted store",
    at: "2026-07-20T09:00:00.000Z",
    quiz: (unit) => confirmedQuiz(unit, { mep: ["mep-changes"] }),
    mark: afterBefore(markScreeningIssues),
  },
  {
    slug: "signage",
    title: "Signage Renovation",
    about: "New shopfront sign to match the refit",
    at: "2026-08-10T09:00:00.000Z",
    quiz: (unit) =>
      confirmedQuiz(unit, { external: ["structured-cabling"] }),
    mark: markFilesFiling,
  },
  {
    slug: "flooring",
    title: "Flooring Renovation",
    about: "Relay the floor while the store is hoarded",
    at: "2026-08-24T09:00:00.000Z",
    quiz: (unit) => confirmedQuiz(unit, { structure: ["above-ceiling-works"] }),
    mark: (unit, _role, work) => markPendingJsi(unit, work),
  },
  {
    slug: "counter",
    title: "Counter Renovation",
    about: "Rebuild the cashier counter after the refit",
    at: "2026-09-21T09:00:00.000Z",
    quiz: (unit) => startedQuiz(unit),
    mark: () => {},
  },
];

function lifespanAt(index: number) {
  return new Date(LIFESPAN_START + index * LIFESPAN_GAP_DAYS * 86_400_000).toISOString();
}

function withAbout(quiz: QuizState, about: string): QuizState {
  return { ...setV28Text(quiz, "q-about", about), confirmed: quiz.confirmed, status: quiz.status };
}

function lifespanKind(index: number): LifespanKind {
  if (index === 0) {
    return { title: "Opening Fit-Out", about: "Fit out the unit for opening", ticks: OPENING_TICKS };
  }
  if (index === LIFESPAN_REFRESH_AT) {
    return { title: "Full Renovation", about: "Mid-lease refresh of the whole store", ticks: FULL_TICKS };
  }
  return LIFESPAN_KINDS[(index - 1) % LIFESPAN_KINDS.length];
}

/**
 * A unit part-way through its lease: 45 projects finished since the opening
 * fit-out in 2019, and five running now around a store refit. The live ones
 * span the pipeline, so the Ongoing list shows what a long-running tenancy
 * actually carries at any one time.
 */
export function applyV31LifespanStory(unit: Unit, role: Role) {
  const done = Array.from({ length: LIFESPAN_PAST }, (_, index) => {
    const kind = lifespanKind(index);
    const work: V26Work = {
      id: `v31-life-${index + 1}-${unit.id}`,
      unitId: unit.id,
      title: kind.title,
      createdAt: lifespanAt(index),
      quiz: withAbout(confirmedQuiz(unit, kind.ticks ?? {}), kind.about),
    };
    return work;
  });
  const live = LIFESPAN_LIVE.map((spec) => ({
    id: `v31-life-${spec.slug}-${unit.id}`,
    unitId: unit.id,
    title: spec.title,
    createdAt: spec.at,
    quiz: withAbout(spec.quiz(unit), spec.about),
  }));
  writeV26Works(unit.id, [...done, ...live]);
  for (const work of done) {
    closeBeforeSteps(unit, role, work);
    markComplete(unit, role, work);
  }
  live.forEach((work, index) => LIFESPAN_LIVE[index].mark(unit, role, work));
}

export function seedV28PassedSample(unit: Unit, role: Role) {
  const id = v28PassedWorkId(unit.id);
  const existing = readV26Works(unit.id).find((row) => row.id === id);
  const work: V26Work = existing ?? {
    id,
    unitId: unit.id,
    title: "Works · 5 Sept 2026",
    createdAt: "2026-09-05T09:00:00.000Z",
    quiz: confirmedQuiz(unit, OPENING_TICKS),
  };
  if (!existing) upsertV26Work(unit.id, work);
  seedV28PassedPack(unit.id, work.id, requiredDocs(unit, role, work));
}

export function v34ScopeFullWorkId(unitId: string) {
  return `v34-scope-full-${unitId}`;
}

export function v34ScopeMixedWorkId(unitId: string) {
  return `v34-scope-mixed-${unitId}`;
}

export function v34ScopeNoneWorkId(unitId: string) {
  return `v34-scope-none-${unitId}`;
}

/** Renovation + ceiling only — still mixed shared vs per-permit files. */
const MIXED_TICKS: QuizTicks = {
  scope: ["large-scale-renovation"],
  structure: ["above-ceiling-works"],
};

/** Confirmed full renovation — lands on Scope results with permits & steps. */
export function applyV34ScopeFullProject(unit: Unit) {
  const id = v34ScopeFullWorkId(unit.id);
  const work: V26Work = {
    id,
    unitId: unit.id,
    title: "Full Renovation",
    createdAt: "2026-10-01T09:00:00.000Z",
    quiz: confirmedQuiz(unit, FULL_TICKS),
  };
  writeV26Works(unit.id, [work]);
  resetV28PackState(unit.id, work.id);
  writeV28Screen(unit.id, work.id, { result: "idle", runs: 0 });
  writeV28Submitted(unit.id, work.id, false);
  clearV31Closes(unit.id, work.id);
  return id;
}

/** Confirmed small mixed pack — renovation and ceiling, same share rules as full. */
export function applyV34ScopeMixedProject(unit: Unit) {
  const id = v34ScopeMixedWorkId(unit.id);
  const work: V26Work = {
    id,
    unitId: unit.id,
    title: "Ceiling and Renovation",
    createdAt: "2026-10-01T09:00:00.000Z",
    quiz: confirmedQuiz(unit, MIXED_TICKS),
  };
  writeV26Works(unit.id, [work]);
  resetV28PackState(unit.id, work.id);
  writeV28Screen(unit.id, work.id, { result: "idle", runs: 0 });
  writeV28Submitted(unit.id, work.id, false);
  clearV31Closes(unit.id, work.id);
  return id;
}

/** Confirmed no renovation — Scope results with nothing to apply. */
export function applyV34ScopeNoneProject(unit: Unit) {
  const id = v34ScopeNoneWorkId(unit.id);
  const work: V26Work = {
    id,
    unitId: unit.id,
    title: "Store Opening",
    createdAt: "2026-10-01T09:00:00.000Z",
    quiz: noRenovationQuiz(unit),
  };
  writeV26Works(unit.id, [work]);
  resetV28PackState(unit.id, work.id);
  writeV28Screen(unit.id, work.id, { result: "idle", runs: 0 });
  writeV28Submitted(unit.id, work.id, false);
  clearV31Closes(unit.id, work.id);
  return id;
}

/** Five works so v35 can demo manual archive and the 90-day auto-archive. */
export function applyV35ArchiveStory(unit: Unit, role: Role) {
  const row = (
    slug: string,
    title: string,
    createdAt: string,
    quiz: QuizState,
  ): V26Work => ({
    id: `v35-arc-${slug}-${unit.id}`,
    unitId: unit.id,
    title,
    createdAt,
    quiz,
  });
  const scoping = row(
    "scope",
    "Counter Renovation",
    "2026-09-21T09:00:00.000Z",
    withAbout(startedQuiz(unit), "Still scoping — archive from Ongoing."),
  );
  const filing = row(
    "files",
    "M&E refresh",
    "2026-09-01T09:00:00.000Z",
    withAbout(confirmedQuiz(unit, {}), "Documents underway — still Ongoing."),
  );
  const recent = row(
    "past",
    "Flooring last month",
    "2026-09-20T09:00:00.000Z",
    withAbout(
      confirmedQuiz(unit, OPENING_TICKS),
      "Ready to submit — still in Past (under 90 days).",
    ),
  );
  const oldDone = row(
    "old",
    "Lighting · Jun 2026",
    "2026-06-10T09:00:00.000Z",
    withAbout(
      confirmedQuiz(unit, OPENING_TICKS),
      "Ready to submit over 90 days — auto-archived.",
    ),
  );
  const oldNone = row(
    "none",
    "Store opening · May 2026",
    "2026-05-12T09:00:00.000Z",
    noRenovationQuiz(unit),
  );
  const works = [scoping, filing, recent, oldDone, oldNone];
  writeV26Works(unit.id, works);
  for (const work of works) {
    resetV28PackState(unit.id, work.id);
    writeV28Screen(unit.id, work.id, { result: "idle", runs: 0 });
    writeV28Submitted(unit.id, work.id, false);
    clearV31Closes(unit.id, work.id);
  }
  markFilesFiling(unit, role, filing);
  closeBeforeSteps(unit, role, recent);
  markScreeningDone(unit, role, recent);
  closeBeforeSteps(unit, role, oldDone);
  markScreeningDone(unit, role, oldDone);
  closeBeforeSteps(unit, role, oldNone);
}
