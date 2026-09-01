import type { Role } from "@/lib/app-state";
import type { PlannedWorkSlug, Step, Unit } from "@/lib/tenancy-data";
import type { ClassifiedStep } from "@/lib/process-guide";

export const QUIZ_STAGE_NAME = "Pre-Kickoff";
export const QUIZ_STEP_NAME = "Confirmation of Meeting Attendees";
export const KICKOFF_STEP_NAME = "Requirements & Plan Alignment";
export const KICKOFF_STAGE_NAME = "Kickoff";

export const NONE_ID = "none";
export const NOT_SURE_ID = "not-sure";

export type QuestionId = "scope" | "fire" | "structure" | "mep" | "external";

export type QuizOption = {
  id: PlannedWorkSlug;
  label: string;
  /** Show only on these terminals. Omit = every terminal. */
  terminals?: Unit["terminal"][];
};

export type QuizQuestion = {
  id: QuestionId;
  prompt: string;
  options: QuizOption[];
};

export const PLANNED_WORKS_QUESTIONS: QuizQuestion[] = [
  {
    id: "scope",
    prompt: "How big is this job?",
    options: [
      { id: "large-scale-renovation", label: "A full strip-out and rebuild" },
      {
        id: "change-of-use",
        label: "Used for something different than approved",
      },
      {
        id: "additional-renovation-scope",
        label: "Extra works beyond what was already approved",
      },
      {
        id: "takeover-from-exiting-tenant",
        label: "Keeping leftover items from the previous tenant",
      },
    ],
  },
  {
    id: "fire",
    prompt: "Will the works involve fire, sparks, alarms, or sprinklers?",
    options: [
      {
        id: "hot-work",
        label: "Welding, cutting, grinding, or an open flame",
      },
      {
        id: "fire-alarm-isolation",
        label: "Work that could set off alarms or sprinklers",
      },
      {
        id: "fire-protection-detection-works",
        label: "Adding or changing fire alarms, sprinklers, or other fire systems",
      },
      {
        id: "fire-safety-submission",
        label: "New fit-out, changing fire systems, or occupying in stages",
      },
    ],
  },
  {
    id: "structure",
    prompt: "Will anyone open ceilings, go on the roof, or touch the building structure?",
    options: [
      { id: "above-ceiling-works", label: "Open / work above ceiling panels" },
      { id: "roof-works", label: "Work on the roof" },
      { id: "structural-works", label: "Structural walls, or hack / core" },
    ],
  },
  {
    id: "mep",
    prompt: "Will you change wiring, air-con, pipes, or work in wet rooms?",
    options: [
      {
        id: "mep-changes",
        label: "Electrical, air-con, plumbing, sprinklers, or PA",
      },
      {
        id: "waterproofing-works",
        label: "Wet area that could affect waterproofing",
      },
    ],
  },
  {
    id: "external",
    prompt: "Cables, unusual access, or approvals from outside the airport?",
    options: [
      { id: "structured-cabling", label: "Data or telephone cabling" },
      { id: "telco-cabling", label: "Phone or internet company cabling" },
      {
        id: "catwalk-access",
        label: "T4 catwalk",
        terminals: ["T4"],
      },
      {
        id: "skytrain-work",
        label: "Skytrain",
        terminals: ["T1", "T2", "T3"],
      },
      {
        id: "authority-approval",
        label: "Approval from a government agency",
      },
    ],
  },
];

export type QuestionAnswer =
  | { kind: "unanswered" }
  | { kind: "not-sure" }
  | { kind: "none" }
  | { kind: "selected"; slugs: PlannedWorkSlug[] }
  /** In-card apply: listed slugs on/off, the rest still unknown. */
  | { kind: "flags"; on: PlannedWorkSlug[]; off: PlannedWorkSlug[] };

export type QuizStatus = "idle" | "editing" | "paused" | "done";

export type QuizState = {
  status: QuizStatus;
  answers: Record<QuestionId, QuestionAnswer>;
  /** Officer locked the KickOff record. Contractor cannot overwrite. */
  confirmed?: boolean;
};

const UNANSWERED: QuestionAnswer = { kind: "unanswered" };

export const EMPTY_ANSWERS: Record<QuestionId, QuestionAnswer> = {
  scope: UNANSWERED,
  fire: UNANSWERED,
  structure: UNANSWERED,
  mep: UNANSWERED,
  external: UNANSWERED,
};

export const EMPTY_QUIZ: QuizState = {
  status: "idle",
  answers: EMPTY_ANSWERS,
  confirmed: false,
};

export type SlugFlag = "on" | "off" | "unknown";

export function optionsForUnit(question: QuizQuestion, unit: Unit): QuizOption[] {
  return question.options.filter(
    (opt) => !opt.terminals || opt.terminals.includes(unit.terminal),
  );
}

export function questionsForUnit(unit: Unit): QuizQuestion[] {
  return PLANNED_WORKS_QUESTIONS.map((q) => ({
    ...q,
    options: optionsForUnit(q, unit),
  })).filter((q) => q.options.length > 0);
}

/** OR within a question, AND across questions. Missing slug = unknown. */
export function slugFlags(
  state: QuizState,
  unit: Unit,
): Record<PlannedWorkSlug, SlugFlag> {
  const flags = {} as Record<PlannedWorkSlug, SlugFlag>;
  for (const question of questionsForUnit(unit)) {
    const answer = state.answers[question.id] ?? UNANSWERED;
    const visible = question.options.map((o) => o.id);
    if (answer.kind === "unanswered" || answer.kind === "not-sure") {
      for (const slug of visible) flags[slug] = "unknown";
      continue;
    }
    if (answer.kind === "none") {
      for (const slug of visible) flags[slug] = "off";
      continue;
    }
    if (answer.kind === "flags") {
      const on = new Set(answer.on);
      const off = new Set(answer.off);
      for (const slug of visible) {
        if (on.has(slug)) flags[slug] = "on";
        else if (off.has(slug)) flags[slug] = "off";
        else flags[slug] = "unknown";
      }
      continue;
    }
    const on = new Set(answer.slugs);
    for (const slug of visible) flags[slug] = on.has(slug) ? "on" : "off";
  }
  return flags;
}

/**
 * Hide only when every listed slug is off.
 * On or unknown keeps the card. No slugs = always shown.
 */
export function stepMatchesPlannedWorks(
  step: Pick<Step, "whenSlugs">,
  flags: Record<PlannedWorkSlug, SlugFlag>,
): boolean {
  const slugs = step.whenSlugs;
  if (!slugs || slugs.length === 0) return true;
  return slugs.some((slug) => flags[slug] !== "off");
}

export function filterClassifiedByPlannedWorks<T extends { step: Pick<Step, "whenSlugs"> }>(
  steps: T[],
  flags: Record<PlannedWorkSlug, SlugFlag>,
): T[] {
  return steps.filter((row) => stepMatchesPlannedWorks(row.step, flags));
}

export type StepCertainty = "always" | "confirmed" | "possible";

/** Always-on, confirmed by a yes, or still unknown. */
export function stepCertainty(
  step: Pick<Step, "whenSlugs">,
  flags: Record<PlannedWorkSlug, SlugFlag> | null,
): StepCertainty {
  const slugs = step.whenSlugs;
  if (!slugs || slugs.length === 0) return "always";
  if (!flags) return "possible";
  if (slugs.some((slug) => flags[slug] === "on")) return "confirmed";
  return "possible";
}

export function quizHasUnanswered(state: QuizState): boolean {
  return Object.values(state.answers).some((answer) => answer.kind === "unanswered");
}

export function quizHasSavedAnswers(state: QuizState): boolean {
  return Object.values(state.answers).some(
    (answer) =>
      answer.kind !== "unanswered" &&
      !(answer.kind === "flags" && answer.on.length === 0 && answer.off.length === 0),
  );
}

function toFlags(
  answer: QuestionAnswer,
  question: QuizQuestion,
): { on: PlannedWorkSlug[]; off: PlannedWorkSlug[] } {
  const ids = question.options.map((o) => o.id);
  if (answer.kind === "flags") return { on: answer.on, off: answer.off };
  if (answer.kind === "selected") {
    const on = answer.slugs.filter((slug) => ids.includes(slug));
    return { on, off: ids.filter((id) => !on.includes(id)) };
  }
  if (answer.kind === "none") return { on: [], off: ids };
  return { on: [], off: [] };
}

function fromFlags(
  on: ReadonlySet<PlannedWorkSlug>,
  off: ReadonlySet<PlannedWorkSlug>,
  question: QuizQuestion,
): QuestionAnswer {
  const ids = question.options.map((o) => o.id);
  const onArr = ids.filter((id) => on.has(id));
  const offArr = ids.filter((id) => off.has(id));
  const unknown = ids.filter((id) => !on.has(id) && !off.has(id));
  if (unknown.length === 0) {
    return onArr.length === 0 ? { kind: "none" } : { kind: "selected", slugs: onArr };
  }
  if (onArr.length === 0 && offArr.length === 0) return UNANSWERED;
  return { kind: "flags", on: onArr, off: offArr };
}

function setSlugs(
  state: QuizState,
  slugs: PlannedWorkSlug[],
  unit: Unit,
  value: "on" | "off",
): QuizState {
  const questions = questionsForUnit(unit);
  const answers = completeAnswers(state.answers);
  for (const slug of slugs) {
    const question = questions.find((q) => q.options.some((o) => o.id === slug));
    if (!question) continue;
    const current = answers[question.id] ?? UNANSWERED;
    const flags = toFlags(current, question);
    const on = new Set(flags.on);
    const off = new Set(flags.off);
    if (value === "on") {
      on.add(slug);
      off.delete(slug);
    } else {
      off.add(slug);
      on.delete(slug);
    }
    answers[question.id] = fromFlags(on, off, question);
  }
  return {
    ...state,
    status: state.status === "idle" ? "editing" : state.status,
    answers,
  };
}

/** Mark this card's works as applying, without closing other unknowns. */
export function applySlugsToQuiz(
  state: QuizState,
  slugs: PlannedWorkSlug[],
  unit: Unit,
): QuizState {
  return settleQuizWrite(setSlugs(state, slugs, unit, "on"), unit);
}

/** Mark this card's works as not applying. Card hides once every slug is off. */
export function dismissSlugsFromQuiz(
  state: QuizState,
  slugs: PlannedWorkSlug[],
  unit: Unit,
): QuizState {
  return settleQuizWrite(setSlugs(state, slugs, unit, "off"), unit);
}

export function quizProgress(
  state: QuizState,
  unit: Unit,
): { answered: number; total: number } {
  const questions = questionsForUnit(unit);
  let answered = 0;
  for (const question of questions) {
    const answer = state.answers[question.id] ?? UNANSWERED;
    if (answer.kind === "unanswered") continue;
    if (answer.kind === "flags") {
      const covered = new Set([...answer.on, ...answer.off]);
      if (question.options.every((o) => covered.has(o.id))) answered += 1;
      continue;
    }
    answered += 1;
  }
  return { answered, total: questions.length };
}

/** Contractor in-card / sheet-close write: never leave status as editing. */
export function settleQuizWrite(state: QuizState, unit: Unit): QuizState {
  if (state.confirmed) {
    return { ...state, status: "done" };
  }
  if (!quizHasSavedAnswers(state)) {
    return { ...state, status: "idle" };
  }
  const { answered, total } = quizProgress(state, unit);
  return {
    ...state,
    status: answered >= total ? "done" : "paused",
  };
}

export function quizIsConfirmed(state: QuizState): boolean {
  return state.confirmed === true;
}

export function quizCanWrite(role: Role, state: QuizState): boolean {
  if (role === "officer") return true;
  if (role === "contractor") return !quizIsConfirmed(state);
  return false;
}

/** Officer KickOff lock. Process becomes source of truth for this unit. */
export function confirmPlannedWorks(state: QuizState): QuizState {
  return {
    status: "done",
    answers: completeAnswers(state.answers),
    confirmed: true,
  };
}

/** Always-on OneCalendar work type. Sub-permits attach to this. */
export const MAIN_PERMIT_LABEL = "Tenancy Project work";

/** Extra sub-permits a confirmed slug points at. Journey-only slugs return none. */
export function extraPermitsForSlug(
  slug: PlannedWorkSlug,
  unit: Unit,
): string[] {
  switch (slug) {
    case "above-ceiling-works":
      return ["Ceiling permit"];
    case "fire-alarm-isolation":
      return ["Fire alarm isolation permit"];
    case "hot-work":
      return ["Hot Work permit"];
    case "authority-approval":
      return ["Authority approvals permit"];
    case "mep-changes":
      return ["MEP changes permit"];
    case "structured-cabling":
      return unit.terminal === "T3"
        ? ["T3 telephone cabling", "Indoor outdoor cabling"]
        : ["Indoor outdoor cabling"];
    case "telco-cabling":
      return ["Telco cabling permit"];
    case "catwalk-access":
      return unit.terminal === "T4" ? ["T4 catwalk access"] : [];
    case "additional-renovation-scope":
      return ["Extra renovation permit"];
    case "skytrain-work":
      return unit.terminal === "T1" ||
        unit.terminal === "T2" ||
        unit.terminal === "T3"
        ? ["Skytrain permit"]
        : [];
    default:
      return [];
  }
}

export type QuizPermitResult = {
  main: string;
  extras: string[];
  caveat: string;
  confirmed: boolean;
};

/**
 * After lock: always the main Tenancy Project work permit,
 * plus extra sub-permits from agreed (on) answers.
 * Before lock: unanswered / never saved = no result (journey unchanged).
 */
export function quizPermitResult(
  state: QuizState,
  unit: Unit,
): QuizPermitResult | null {
  const locked = quizIsConfirmed(state);
  if (
    !locked &&
    ((state.status !== "done" && state.status !== "paused") ||
      !quizHasSavedAnswers(state))
  ) {
    return null;
  }
  const flags = slugFlags(state, unit);
  const extras: string[] = [];
  const seen = new Set<string>();
  for (const [slug, flag] of Object.entries(flags)) {
    if (flag !== "on") continue;
    for (const name of extraPermitsForSlug(slug as PlannedWorkSlug, unit)) {
      if (seen.has(name)) continue;
      seen.add(name);
      extras.push(name);
    }
  }
  return {
    main: MAIN_PERMIT_LABEL,
    extras,
    caveat: quizCopy.resultsCaveat,
    confirmed: quizIsConfirmed(state),
  };
}

function toggleSlug(
  current: QuestionAnswer,
  slug: PlannedWorkSlug,
): QuestionAnswer {
  const selected =
    current.kind === "selected"
      ? current.slugs
      : current.kind === "flags"
        ? current.on
        : [];
  const next = new Set(selected);
  if (next.has(slug)) next.delete(slug);
  else next.add(slug);
  if (next.size === 0) return { kind: "unanswered" };
  return { kind: "selected", slugs: [...next] };
}

export function completeAnswers(
  answers: QuizState["answers"] | undefined,
): Record<QuestionId, QuestionAnswer> {
  return {
    ...EMPTY_ANSWERS,
    ...(answers && typeof answers === "object" ? answers : {}),
  };
}

export function toggleQuestionOption(
  state: QuizState,
  questionId: QuestionId,
  optionId: string,
): QuizState {
  const answers = completeAnswers(state.answers);
  const current = answers[questionId] ?? UNANSWERED;
  let next: QuestionAnswer;
  if (optionId === NONE_ID) {
    next = current.kind === "none" ? UNANSWERED : { kind: "none" };
  } else if (optionId === NOT_SURE_ID) {
    next = current.kind === "not-sure" ? UNANSWERED : { kind: "not-sure" };
  } else {
    next = toggleSlug(current, optionId as PlannedWorkSlug);
  }
  return {
    ...state,
    status: "editing",
    answers: { ...answers, [questionId]: next },
  };
}

export function isOptionOn(
  answer: QuestionAnswer | undefined,
  optionId: string,
): boolean {
  if (!answer) return false;
  if (optionId === NONE_ID) return answer.kind === "none";
  if (optionId === NOT_SURE_ID) return answer.kind === "not-sure";
  const slug = optionId as PlannedWorkSlug;
  if (answer.kind === "selected") {
    return Array.isArray(answer.slugs) && answer.slugs.includes(slug);
  }
  return answer.kind === "flags" && answer.on.includes(slug);
}

export type QuizReviewFlag = "selected" | "none" | "not-sure" | "unanswered";

export type QuizReviewRow = {
  questionId: QuestionId;
  prompt: string;
  /** Short site topic for the results list. */
  topic: string;
  detail: string;
  flag: QuizReviewFlag;
  /** Extra OneCalendar permits this answer points at. */
  permits: string[];
};

/** Scan labels for on-site results. Form still uses `prompt`. */
export const REVIEW_TOPIC: Record<QuestionId, string> = {
  scope: "Job size",
  fire: "Fire and alarms",
  structure: "Ceiling, roof, structure",
  mep: "Wiring, pipes, wet rooms",
  external: "Cables and access",
};

function permitsForAnswer(
  answer: QuestionAnswer,
  question: QuizQuestion,
  unit: Unit,
): string[] {
  const slugs =
    answer.kind === "selected"
      ? answer.slugs
      : answer.kind === "flags"
        ? answer.on
        : [];
  if (!Array.isArray(slugs) || slugs.length === 0) return [];
  const visible = new Set(question.options.map((o) => o.id));
  const seen = new Set<string>();
  const out: string[] = [];
  for (const slug of slugs) {
    if (!visible.has(slug)) continue;
    for (const name of extraPermitsForSlug(slug, unit)) {
      if (seen.has(name)) continue;
      seen.add(name);
      out.push(name);
    }
  }
  return out;
}

export function quizReviewRows(state: QuizState, unit: Unit): QuizReviewRow[] {
  return questionsForUnit(unit).map((question) => {
    const answer = state.answers[question.id] ?? UNANSWERED;
    const permits = permitsForAnswer(answer, question, unit);
    const topic = REVIEW_TOPIC[question.id];
    if (answer.kind === "unanswered") {
      return {
        questionId: question.id,
        prompt: question.prompt,
        topic,
        detail: "Not answered",
        flag: "unanswered" as const,
        permits,
      };
    }
    if (answer.kind === "not-sure") {
      return {
        questionId: question.id,
        prompt: question.prompt,
        topic,
        detail: "Not sure yet",
        flag: "not-sure" as const,
        permits,
      };
    }
    if (answer.kind === "none") {
      return {
        questionId: question.id,
        prompt: question.prompt,
        topic,
        detail: "None of these",
        flag: "none" as const,
        permits,
      };
    }
    if (answer.kind === "flags") {
      const labels = question.options
        .filter((o) => answer.on.includes(o.id))
        .map((o) => o.label);
      const unknown = question.options.some(
        (o) => !answer.on.includes(o.id) && !answer.off.includes(o.id),
      );
      return {
        questionId: question.id,
        prompt: question.prompt,
        topic,
        detail: labels.length
          ? labels.join("; ")
          : unknown
            ? "Not answered"
            : "None of these",
        flag: unknown
          ? ("unanswered" as const)
          : labels.length
            ? ("selected" as const)
            : ("none" as const),
        permits,
      };
    }
    const slugs = Array.isArray(answer.slugs) ? answer.slugs : [];
    const labels = question.options
      .filter((o) => slugs.includes(o.id))
      .map((o) => o.label);
    return {
      questionId: question.id,
      prompt: question.prompt,
      topic,
      detail: labels.length > 0 ? labels.join("; ") : "Not answered",
      flag: labels.length > 0 ? ("selected" as const) : ("unanswered" as const),
      permits,
    };
  });
}

export function quizNeedsOfficerGuide(state: QuizState, unit: Unit): boolean {
  return quizReviewRows(state, unit).some(
    (row) => row.flag === "unanswered" || row.flag === "not-sure",
  );
}

export function unansweredReviewCount(rows: QuizReviewRow[]): number {
  return rows.filter(
    (row) => row.flag === "unanswered" || row.flag === "not-sure",
  ).length;
}

export function unansweredChip(count: number): string {
  return count > 0 ? "Incomplete" : "";
}

/** One-line sticky: empty / in progress / short done summary. */
export function quizStickyCopy(
  state: QuizState,
  unit: Unit,
): { title: string; cta: string } {
  if (!quizHasSavedAnswers(state)) {
    return { title: quizCopy.stickyIdleTitle, cta: quizCopy.stickyIdleCta };
  }
  const progress = quizProgress(state, unit);
  if (progress.answered >= progress.total) {
    const selected = quizReviewRows(state, unit)
      .filter((row) => row.flag === "selected")
      .map((row) => row.topic);
    let title = quizCopy.stickyDoneText;
    if (selected.length === 1) title = selected[0];
    else if (selected.length === 2) title = `${selected[0]} · ${selected[1]}`;
    else if (selected.length > 2) {
      title = `${selected[0]} · ${selected.length - 1} more`;
    }
    return { title, cta: quizCopy.stickyEditCta };
  }
  if (progress.answered > 0) {
    return {
      title: `${progress.answered} of ${progress.total} answered`,
      cta: quizCopy.stickyEditCta,
    };
  }
  return { title: quizCopy.stickyStartedTitle, cta: quizCopy.stickyEditCta };
}

export function answerSummaryLines(
  state: QuizState,
  unit: Unit,
): string[] {
  const lines: string[] = [];
  for (const question of questionsForUnit(unit)) {
    const answer = state.answers[question.id] ?? UNANSWERED;
    if (answer.kind === "unanswered") {
      lines.push(`${question.prompt} — Not answered`);
      continue;
    }
    if (answer.kind === "not-sure") {
      lines.push(`${question.prompt} — Not sure yet`);
      continue;
    }
    if (answer.kind === "none") {
      lines.push(`${question.prompt} — None of these`);
      continue;
    }
    if (answer.kind === "flags") {
      const labels = question.options
        .filter((o) => answer.on.includes(o.id))
        .map((o) => o.label);
      lines.push(
        labels.length > 0
          ? `${question.prompt} — ${labels.join("; ")}`
          : `${question.prompt} — Not answered`,
      );
      continue;
    }
    const slugs = Array.isArray(answer.slugs) ? answer.slugs : [];
    const labels = question.options
      .filter((o) => slugs.includes(o.id))
      .map((o) => o.label);
    lines.push(
      labels.length > 0
        ? `${question.prompt} — ${labels.join("; ")}`
        : `${question.prompt} — Not answered`,
    );
  }
  return lines;
}

export type QuizEditMode = "fill" | "correct" | "read";

export function quizEditMode(role: Role): QuizEditMode {
  if (role === "contractor") return "fill";
  if (role === "officer") return "correct";
  return "read";
}

export function quizCardCopy(
  role: Role,
  status: QuizState["status"],
  _summary: string[],
  kickoffSoon: boolean,
  hasAnswers = status === "done",
): { subheader: string[]; how: string[] } {
  const mode = quizEditMode(role);
  if (mode === "read") {
    if (hasAnswers) {
      return {
        subheader: quizCopy.tenantDoneIntro,
        how: quizCopy.tenantDoneHow,
      };
    }
    return {
      subheader: quizCopy.tenantWaitingSubheader,
      how: quizCopy.tenantWaitingHow,
    };
  }
  if (mode === "correct") {
    if (hasAnswers) {
      return {
        subheader: quizCopy.officerDoneIntro,
        how: quizCopy.officerDoneHow,
      };
    }
    return {
      subheader: quizCopy.officerWaitingSubheader,
      how: quizCopy.officerWaitingHow,
    };
  }
  if (status === "editing") {
    return { subheader: quizCopy.editingHow, how: [] };
  }
  if (status === "paused") {
    return { subheader: quizCopy.pausedIntro, how: quizCopy.pausedHow };
  }
  if (status === "done") {
    return { subheader: quizCopy.contractorDoneIntro, how: quizCopy.resultsHow };
  }
  return {
    subheader: quizCopy.entrySubheader,
    how: kickoffSoon
      ? [...quizCopy.entryHow, "Kick-off is soon. Still start."]
      : quizCopy.entryHow,
  };
}

export function makeQuizClassifiedStep(role: Role): ClassifiedStep {
  const step: Step = {
    name: QUIZ_STEP_NAME,
    responsible: "You",
    what: "The contractor answers five questions about the works. This does not submit a permit.",
    whatFor: {
      tenant:
        "Your contractor answers five questions about the works. You do not fill this.",
      contractor:
        "Answer five questions about this job. Select all that apply. This does not submit a permit.",
      officer:
        "The contractor answers five questions about the works. Confirm or correct them at kick-off.",
    },
    subSteps: [
      {
        text: "Answer five questions about this job. Select all that apply.",
        audience: "contractor",
        seq: "sequential",
        alsoText: {
          tenant:
            "Your contractor is confirming which works apply. You do not fill this.",
          officer:
            "The contractor is confirming which works apply. Correct them at kick-off if they are wrong.",
        },
      },
    ],
    people: ["Contractor", "Project Officer"],
    systems: [],
  };
  const mine = step.subSteps;
  return {
    step,
    mine,
    others: [],
    flow: mine.map((s) => ({ ...s, mine: true })),
    kind: "yours",
  };
}

export function injectPlannedWorksQuiz(
  stageBlocks: { stage: { name: string }; steps: ClassifiedStep[] }[],
  _role: Role,
  _include: boolean,
): { stage: { name: string }; steps: ClassifiedStep[] }[] {
  return stageBlocks;
}

export function quizStorageKey(unitId: string) {
  return `tempo:v16:planned-works:${unitId}`;
}

function isQuestionId(value: string): value is QuestionId {
  return (
    value === "scope" ||
    value === "fire" ||
    value === "structure" ||
    value === "mep" ||
    value === "external"
  );
}

function parseAnswer(raw: unknown): QuestionAnswer {
  if (!raw || typeof raw !== "object") return UNANSWERED;
  const kind = (raw as { kind?: string }).kind;
  if (kind === "not-sure" || kind === "none" || kind === "unanswered") {
    return { kind };
  }
  if (kind === "selected") {
    const slugs = (raw as { slugs?: unknown }).slugs;
    if (!Array.isArray(slugs)) return UNANSWERED;
    return { kind: "selected", slugs: slugs.filter((s) => typeof s === "string") };
  }
  if (kind === "flags") {
    const on = (raw as { on?: unknown }).on;
    const off = (raw as { off?: unknown }).off;
    return {
      kind: "flags",
      on: Array.isArray(on) ? on.filter((s) => typeof s === "string") : [],
      off: Array.isArray(off) ? off.filter((s) => typeof s === "string") : [],
    };
  }
  return UNANSWERED;
}

export function readQuizState(unitId: string): QuizState {
  try {
    const raw = window.localStorage.getItem(quizStorageKey(unitId));
    if (!raw) return EMPTY_QUIZ;
    const parsed = JSON.parse(raw) as QuizState;
    if (
      parsed.status !== "idle" &&
      parsed.status !== "editing" &&
      parsed.status !== "paused" &&
      parsed.status !== "done"
    ) {
      return EMPTY_QUIZ;
    }
    const answers = completeAnswers(EMPTY_ANSWERS);
    if (parsed.answers && typeof parsed.answers === "object") {
      for (const [key, value] of Object.entries(parsed.answers)) {
        if (isQuestionId(key)) answers[key] = parseAnswer(value);
      }
    }
    return {
      status: parsed.status,
      answers,
      confirmed: parsed.confirmed === true,
    };
  } catch {
    return EMPTY_QUIZ;
  }
}

export function writeQuizState(unitId: string, state: QuizState) {
  window.localStorage.setItem(quizStorageKey(unitId), JSON.stringify(state));
}

export const quizCopy = {
  entrySubheader: [
    "Answer five questions about this job.",
    "Do this before you go on site.",
  ],
  entryHow: [
    "Tick what applies on this job.",
  ],
  startCta: "See what applies",
  editingHow: [
    "Tick all that apply on this job.",
    "Leave blank if you need to check.",
  ],
  pauseHint: "Leave blank if you need to check.",
  pauseCta: "Save and come back",
  resumeCta: "Continue answers",
  pausedIntro: [
    "Come back when you know more.",
  ],
  pausedHow: [
    "Fill remaining answers before KickOff meeting.",
  ],
  bannerContractorPaused: "Fill remaining answers before KickOff meeting.",
  contractorDoneIntro: [
    "These are the works you confirmed.",
  ],
  resultsHow: [
    "Confirm remaining answers before you go on site.",
  ],
  reviewLabel: "Works that apply",
  reviewLabelOfficerPending: "Contractor answers so far",
  reviewLabelOfficerConfirm: "Confirm Planned works",
  reviewLabelOfficerAgreed: "Agreed works",
  tenantWaitingSubheader: [
    "Get planned works from your contractor.",
  ],
  tenantWaitingHow: [],
  tenantDoneIntro: [
    "Read the works agreed at KickOff meeting.",
  ],
  tenantDoneHow: [],
  officerWaitingSubheader: [
    "Review planned works at the first site meeting.",
  ],
  officerWaitingHow: [],
  officerEditingHow: [
    "Correct what applies. None of these and Not sure yet are exclusive.",
  ],
  officerDoneIntro: [
    "Confirm the works agreed at KickOff meeting.",
  ],
  officerDoneHow: [
    "Note the permits agreed at KickOff meeting.",
  ],
  officerGuideHow: [
    "Walk unanswered items at the first site meeting.",
  ],
  kickoffCorrection: [
    "Update Planned works to match KickOff meeting.",
  ],
  kickoffConfirm: [
    "Note agreed permits at the KickOff meeting.",
  ],
  bannerContractorTitle: "Confirm works before KickOff",
  bannerContractor: "Tick what applies on this job.",
  bannerTenantTitle: "Planned works",
  bannerTenant:
    "Ask your contractor to confirm the works on this job.",
  bannerOfficerTitle: "Planned works",
  bannerOfficer: "Confirm the works at the KickOff meeting.",
  resultsLabel: "Renovation works permits",
  resultsCaveat: "Confirm agreed permits at the KickOff meeting.",
  resultsMainOnly: "No extra permits for these works.",
  resultsAlwaysLabel: "Always",
  alwaysApplyLabel: "Always apply",
  alwaysApplyHow: {
    tenant: "Get this in OneCalendar.",
    contractor: "Apply this in OneCalendar.",
    officer: "Check this in OneCalendar.",
  },
  extrasLabel: "What applies",
  extrasHow: {
    tenant: "Check what applies with your contractor.",
    contractor: "Tick what applies on this job.",
    officer: "Check what applies on this job.",
  },
  alwaysNeededChip: "Always needed",
  mainPermitChip: "Main permit",
  possibleApplyChip: "Possible",
  linkedLeadContractor: "Apply these extra permits in OneCalendar.",
  linkedLeadOfficer: "Check these extra permits from the answers.",
  linkedLeadTenant: "Check these extra permits with your contractor.",
  resultsExtrasLabel: "Also if these works apply",
  kickoffPermitsLabel: "Likely renovation works permits",
  kickoffPermitsLabelAgreed: "Agreed renovation works permits",
  officerConfirmCta: "Confirm answers",
  officerEditCta: "Edit answers",
  officerUpdateCta: "Update answers",
  officerCancelCta: "Cancel",
  contractorLockedLine: "Use the permits agreed at KickOff meeting.",
  confirmedCaveatTenant: "Check the permits agreed at KickOff meeting.",
  confirmedCaveatContractor: "Use the permits agreed at KickOff meeting.",
  confirmedCaveatOfficer: "Check the permits from KickOff meeting.",
  kickoffConfirmLabel: "Confirm planned works",
  kickoffUpdateLabel: "Update planned works",
  possibleChip: "May apply",
  tenantPossibleChip: "May apply",
  officerPossibleChip: "May apply",
  confirmedChip: "Applies",
  possibleSection: "Not confirmed yet",
  possibleLine:
    "Fill Planned works to confirm this step.",
  tenantPossibleLine:
    "Ask your contractor to confirm this step.",
  officerPossibleLine:
    "Agree these answers in this meeting.",
  officerReadLine: "Read these before the KickOff meeting.",
  officerConfirmChip: "Confirm now",
  openHintContractor: " — confirm before you go on site",
  openHintOfficer: " — walk this at the first site meeting",
  accordionHint: "Confirm before you go on site.",
  confirmCta: "Confirm works",
  thisAppliesCta: "This Applies",
  doesNotApplyCta: "Doesn't Apply",
  possibleDecideLine: "Confirm if this step applies.",
  stickyIdleTitle: "Confirm works before KickOff",
  stickyIdleCta: "Confirm Works",
  stickyEditCta: "Edit",
  stickyStartedTitle: "Answers started",
  stickyDoneText: "Answers saved",
  sheetTitle: "Planned works",
  sheetSaveCta: "Save Answers",
  correctCta: "Correct answers",
  reviewCta: "See planned works",
  kickoffConfirmCta: "Confirm planned works",
};
