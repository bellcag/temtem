import type { PlannedWorkSlug, Unit } from "@/lib/tenancy-data";
import {
  completeAnswers,
  isOptionOn,
  type QuestionAnswer,
  type QuestionId,
  type QuizState,
} from "@/lib/process-planned-works-quiz";

export type V25CheckOption = {
  id: PlannedWorkSlug;
  label: string;
  hint?: string;
};

export type V25YesNoField = {
  kind: "yesno";
  id: string;
  prompt: string;
  hint?: string;
  questionId: QuestionId;
  slug: PlannedWorkSlug;
  /** Yes means the slug is off (e.g. unit already has a meter). */
  invert?: boolean;
};

export type V25ChoiceField = {
  kind: "choice";
  id: QuestionId;
  prompt: string;
  options: { value: string; label: string }[];
  fallback?: (unit: Unit) => string;
};

export type V25ChecksField = {
  kind: "checks";
  id: QuestionId;
  prompt: string;
  options: V25CheckOption[];
};

export type V25Field = V25ChoiceField | V25YesNoField | V25ChecksField;

export type V25Section = {
  id: "unit" | "works" | "features";
  title: string;
  fields: V25Field[];
};

export const V25_TERMINALS = ["T1", "T2", "T3", "T4", "Jewel"] as const;
export const V25_TRADES = ["F&B", "Retail", "Service", "Kiosk"] as const;

export const V25_QUIZ_SECTIONS: V25Section[] = [
  {
    id: "unit",
    title: "About your unit",
    fields: [
      {
        kind: "choice",
        id: "terminal",
        prompt: "Which terminal is your unit in?",
        options: V25_TERMINALS.map((value) => ({ value, label: value })),
        fallback: (unit) => unit.terminal,
      },
      {
        kind: "checks",
        id: "unit",
        prompt: "Which of these describe your unit? (select all)",
        options: [
          { id: "landside-public", label: "Landside — public area" },
          { id: "transit-area", label: "Airside — transit area" },
          { id: "apron", label: "Apron or baggage area" },
          {
            id: "facing-travelling-pax",
            label: "My shopfront faces travelling passengers",
          },
          {
            id: "closed-door-rooms",
            label: "My unit has enclosed, closed-door rooms",
          },
        ],
      },
      {
        kind: "choice",
        id: "trade",
        prompt: "What kind of business will operate in the unit?",
        options: V25_TRADES.map((value) => ({ value, label: value })),
        fallback: (unit) => unit.tenancyType,
      },
      {
        kind: "yesno",
        id: "duplex",
        prompt: "Is your unit a duplex (two storeys within the unit)?",
        questionId: "unit",
        slug: "duplex",
      },
      {
        kind: "yesno",
        id: "landside-concessions",
        prompt: "Is your lease handled by CAG's Landside Concessions team?",
        hint: "Confirm with PO",
        questionId: "unit",
        slug: "landside-concessions",
      },
    ],
  },
  {
    id: "works",
    title: "Planned works",
    fields: [
      {
        kind: "checks",
        id: "scope",
        prompt: "How big is this job? (select all that apply)",
        options: [
          {
            id: "large-scale-renovation",
            label: "A full strip-out and rebuild (not a minor refresh)",
            hint: "Confirm with PO",
          },
          {
            id: "change-of-use",
            label:
              "Used for something different than currently approved (e.g. shop becoming a restaurant)",
          },
          {
            id: "additional-renovation-scope",
            label:
              "Extra works beyond what was already approved / beyond the base renovation permit scope",
            hint: "Confirm with PO",
          },
          {
            id: "takeover-from-exiting-tenant",
            label:
              "Keeping leftover items from the previous tenant (e.g. existing hoarding)",
          },
        ],
      },
      {
        kind: "checks",
        id: "fire",
        prompt: "Fire / sparks / alarms / sprinklers? (select all that apply)",
        options: [
          {
            id: "hot-work",
            label: "Welding, cutting, grinding, or an open flame",
          },
          {
            id: "fire-alarm-isolation",
            label:
              "Work that could set off — or require isolating — alarms or sprinklers, including dusty works",
          },
          {
            id: "fire-protection-detection-works",
            label:
              "Adding or altering fire protection or detection systems (new sprinklers, detectors, panels)",
          },
          {
            id: "fire-safety-submission",
            label:
              "New unit fit-out, temporary/phased occupation before final approval, or QP must confirm FSC vs MAA route",
          },
        ],
      },
      {
        kind: "checks",
        id: "structure",
        prompt: "Ceilings / roof / structure? (select all that apply)",
        options: [
          {
            id: "above-ceiling-works",
            label: "Open / work above ceiling panels or access panels",
          },
          { id: "roof-works", label: "Work on the roof" },
          {
            id: "structural-works",
            label:
              "Structural walls, or hack / core into the building structure",
          },
        ],
      },
      {
        kind: "checks",
        id: "mep",
        prompt: "Wiring / air-con / wet rooms? (select all that apply)",
        options: [
          {
            id: "mep-changes",
            label: "Electrical, air-con, plumbing, sprinklers, or PA",
          },
          {
            id: "waterproofing-works",
            label:
              "Wet area that could affect waterproofing (e.g. kitchens or toilets)",
            hint: "Confirmed at kickoff",
          },
        ],
      },
      {
        kind: "checks",
        id: "external",
        prompt: "Cables / access / outside approval? (select all that apply)",
        options: [
          {
            id: "structured-cabling",
            label:
              "Data or telephone cabling (install, move, connect or disconnect)",
          },
          {
            id: "telco-cabling",
            label: "Phone or internet company (authorised telco) cabling",
          },
          {
            id: "authority-approval",
            label:
              "Approval from a government agency (SCDF, BCA, URA, CAAS, PUB, NEA, LTA)",
            hint: "Confirm with PO/QP",
          },
        ],
      },
    ],
  },
  {
    id: "features",
    title: "Unit features",
    fields: [
      {
        kind: "yesno",
        id: "meter",
        prompt:
          "Does your unit already have a permanent electricity/water meter?",
        hint: "Check provision list / handover form",
        questionId: "features",
        slug: "lack-of-perm-meter",
        invert: true,
      },
      {
        kind: "yesno",
        id: "ahu",
        prompt:
          "Does your unit have an Air Handling Unit that you maintain yourself?",
        hint: "Check provision list",
        questionId: "features",
        slug: "tenant-maintained-ahu",
      },
      {
        kind: "yesno",
        id: "kitchen",
        prompt: "Will your kitchen use open-flame cooking or deep-frying?",
        questionId: "features",
        slug: "deep-frying-open-flame",
      },
      {
        kind: "yesno",
        id: "gas",
        prompt: "Will your unit have a gas supply?",
        questionId: "features",
        slug: "gas-supply",
      },
      {
        kind: "yesno",
        id: "server",
        prompt: "Will your unit contain a server or computer room?",
        questionId: "features",
        slug: "servers-computer-rooms",
      },
      {
        kind: "yesno",
        id: "ceiling",
        prompt: "Will your unit have a false ceiling / ceiling panels?",
        questionId: "features",
        slug: "ceiling-panel-false-ceiling",
      },
    ],
  },
];

function unanswered(): QuestionAnswer {
  return { kind: "unanswered" };
}

function slugsForQuestion(questionId: QuestionId): PlannedWorkSlug[] {
  return [
    ...new Set(
      V25_QUIZ_SECTIONS.flatMap((section) =>
        section.fields.flatMap((row) => {
          if (row.kind === "yesno" && row.questionId === questionId) {
            return [row.slug];
          }
          if (row.kind === "checks" && row.id === questionId) {
            return row.options.map((option) => option.id);
          }
          return [];
        }),
      ),
    ),
  ];
}

function onOffFrom(questionId: QuestionId, answer: QuestionAnswer | undefined) {
  const unique = slugsForQuestion(questionId);
  if (!answer || answer.kind === "unanswered" || answer.kind === "not-sure") {
    return { on: new Set<PlannedWorkSlug>(), off: new Set<PlannedWorkSlug>() };
  }
  if (answer.kind === "none") {
    return {
      on: new Set<PlannedWorkSlug>(),
      off: new Set(unique),
    };
  }
  if (answer.kind === "selected") {
    const on = new Set(answer.slugs);
    return {
      on,
      off: new Set(unique.filter((id) => !on.has(id))),
    };
  }
  if (answer.kind === "flags") {
    return { on: new Set(answer.on), off: new Set(answer.off) };
  }
  return { on: new Set<PlannedWorkSlug>(), off: new Set<PlannedWorkSlug>() };
}

function answerFromSets(
  questionId: QuestionId,
  on: Set<PlannedWorkSlug>,
  off: Set<PlannedWorkSlug>,
): QuestionAnswer {
  const unique = slugsForQuestion(questionId);
  const covered = unique.every((id) => on.has(id) || off.has(id));
  if (on.size === 0 && off.size === 0) return unanswered();
  if (covered && on.size === 0) return { kind: "none" };
  if (covered) return { kind: "selected", slugs: unique.filter((id) => on.has(id)) };
  return { kind: "flags", on: [...on], off: [...off] };
}

function checksFieldAnswered(
  answer: QuestionAnswer | undefined,
  optionIds: PlannedWorkSlug[],
): boolean {
  if (!answer || answer.kind === "unanswered" || answer.kind === "not-sure") {
    return false;
  }
  if (answer.kind === "none" || answer.kind === "selected") return true;
  if (answer.kind === "choice") return false;
  return optionIds.some((id) => answer.on.includes(id) || answer.off.includes(id));
}

export function choiceValue(
  answer: QuestionAnswer | undefined,
  fallback = "",
): string {
  if (answer?.kind === "choice" && answer.value) return answer.value;
  return fallback;
}

export function yesNoValue(
  answer: QuestionAnswer | undefined,
  slug: PlannedWorkSlug,
  invert = false,
): boolean | null {
  if (!answer || answer.kind === "unanswered" || answer.kind === "not-sure") {
    return null;
  }
  if (answer.kind === "none") return invert ? true : false;
  if (answer.kind === "flags") {
    if (answer.on.includes(slug)) return invert ? false : true;
    if (answer.off.includes(slug)) return invert ? true : false;
    return null;
  }
  const on = isOptionOn(answer, slug);
  if (answer.kind === "selected") return invert ? !on : on;
  return null;
}

export function setV25Choice(
  state: QuizState,
  id: QuestionId,
  value: string,
): QuizState {
  const answers = completeAnswers(state.answers);
  return {
    ...state,
    status: "editing",
    answers: {
      ...answers,
      [id]: value ? { kind: "choice", value } : unanswered(),
    },
  };
}

export function setV25Check(
  state: QuizState,
  questionId: QuestionId,
  slug: PlannedWorkSlug,
): QuizState {
  const answers = completeAnswers(state.answers);
  const { on, off } = onOffFrom(questionId, answers[questionId]);
  if (on.has(slug)) {
    on.delete(slug);
    off.add(slug);
  } else {
    on.add(slug);
    off.delete(slug);
  }
  const fieldOptions =
    V25_QUIZ_SECTIONS.flatMap((section) => section.fields).find(
      (row) => row.kind === "checks" && row.id === questionId,
    )?.options.map((option) => option.id) ?? [];
  for (const id of fieldOptions) {
    if (!on.has(id)) off.add(id);
  }
  return {
    ...state,
    status: "editing",
    answers: {
      ...answers,
      [questionId]: answerFromSets(questionId, on, off),
    },
  };
}

export function setV25YesNo(
  state: QuizState,
  field: V25YesNoField,
  yes: boolean,
): QuizState {
  const answers = completeAnswers(state.answers);
  const { on, off } = onOffFrom(field.questionId, answers[field.questionId]);
  const slugOn = field.invert ? !yes : yes;
  if (slugOn) {
    on.add(field.slug);
    off.delete(field.slug);
  } else {
    on.delete(field.slug);
    off.add(field.slug);
  }
  return {
    ...state,
    status: "editing",
    answers: {
      ...answers,
      [field.questionId]: answerFromSets(field.questionId, on, off),
    },
  };
}

export function v25QuizProgress(state: QuizState, unit: Unit) {
  const fields = V25_QUIZ_SECTIONS.flatMap((section) => section.fields);
  let answered = 0;
  for (const field of fields) {
    if (field.kind === "choice") {
      if (choiceValue(state.answers[field.id], field.fallback?.(unit) ?? "")) {
        answered += 1;
      }
      continue;
    }
    if (field.kind === "yesno") {
      if (yesNoValue(state.answers[field.questionId], field.slug, field.invert) !== null) {
        answered += 1;
      }
      continue;
    }
    if (checksFieldAnswered(state.answers[field.id], field.options.map((option) => option.id))) {
      answered += 1;
    }
  }
  return { answered, total: fields.length };
}
