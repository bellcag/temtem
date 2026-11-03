import type { PlannedWorkSlug, Unit } from "@/lib/tenancy-data";
import { usesV37Cut } from "@/lib/process-v31-preview";
import { v37TenanciesOnUnit, v37UnitOptions } from "@/lib/process-v37";
import {
  completeAnswers,
  isOptionOn,
  quizHasSavedAnswers,
  type QuestionAnswer,
  type QuestionId,
  type QuizState,
} from "@/lib/process-planned-works-quiz";

/** IFM / AES Pre-Renovation-Kick-Off questionnaire — v28 Works only. */
export const V28_QUIZ_INTRO =
  "Complete this questionnaire before the kick-off meeting. Select “Not sure” where needed and clarify the item with CAG during the meeting.";

export const NONE_ID = "none";
export const NOT_SURE_ID = "not-sure";
export const NO_RENO_ID = "no-renovation";
export const MINOR_FITOUT_ID = "minor-fitout";

export type V28FieldId =
  | "q1"
  | "q2"
  | "q3"
  | "q4"
  | "q5"
  | "q6"
  | "q7"
  | "q8"
  | "q9"
  | "q10"
  | "q11"
  | "q12"
  | "q13"
  | "q14"
  | "q15"
  | "q16"
  | "q17"
  | "q18"
  | "q19"
  | "q20"
  | "q-name"
  | "q-about"
  | "q-unit"
  | "q-tenancy"
  | "q1-other";

export type V28Option = { id: string; label: string };

export type V28ChoiceField = {
  kind: "choice";
  id: V28FieldId;
  prompt: string;
  options: V28Option[];
  allowOther?: boolean;
};

export type V28YesNoField = {
  kind: "yesno";
  id: V28FieldId;
  prompt: string;
};

export type V28ChecksField = {
  kind: "checks";
  id: V28FieldId;
  prompt: string;
  options: V28Option[];
  /** Extra exclusive rows. Default is none + not-sure. */
  exclusive?: string[];
};

export type V28NotesField = {
  kind: "notes";
  id: V28FieldId;
  prompt: string;
};

export type V28TextField = {
  kind: "text";
  id: V28FieldId;
  prompt: string;
  placeholder?: string;
  rows?: number;
  required?: boolean;
};

export type V28Field =
  | V28ChoiceField
  | V28YesNoField
  | V28ChecksField
  | V28NotesField
  | V28TextField;

export type V28Section = {
  id: string;
  title: string;
  fields: V28Field[];
};

export const V28_QUIZ_SECTIONS: V28Section[] = [
  {
    id: "project",
    title: "1. About This Project",
    fields: [
      {
        kind: "text",
        id: "q-name",
        prompt: "Project name",
        placeholder: "Name this project",
        required: true,
      },
      {
        kind: "text",
        id: "q-about",
        prompt: "What is this project for?",
        placeholder: "A short note on what the work is, and why",
        rows: 2,
        required: true,
      },
    ],
  },
  {
    id: "premises",
    title: "2. Premises and Tenancy",
    fields: [
      {
        kind: "choice",
        id: "q1",
        prompt: "What will the premises be used for?",
        allowOther: true,
        options: [
          { id: "retail", label: "Retail" },
          {
            id: "fnb-cooking",
            label: "F&B with cooking and a kitchen fire suppression system",
          },
          { id: "office", label: "Office" },
          { id: "lounge", label: "Lounge" },
          { id: "warehouse", label: "Warehouse or storage" },
          { id: "event", label: "Event space" },
          { id: "other", label: "Other (please specify)" },
        ],
      },
      {
        kind: "choice",
        id: "q2",
        prompt: "Is this a new tenancy or a takeover of an existing premises?",
        options: [
          { id: "new-tenancy", label: "New tenancy" },
          { id: "takeover", label: "Takeover of an existing premises" },
        ],
      },
      {
        kind: "yesno",
        id: "q3",
        prompt: "Will the approved use or occupancy type change?",
      },
      {
        kind: "checks",
        id: "q4",
        prompt: "Which statements describe the premises?",
        options: [
          {
            id: "apron-bhs",
            label:
              "Some utilities can only be accessed from the apron or baggage handling area",
          },
          {
            id: "shopfront",
            label: "The shopfront faces travelling passengers",
          },
          { id: "enclosed-rooms", label: "The premises contains enclosed rooms" },
          { id: "duplex", label: "The premises is a duplex" },
        ],
      },
    ],
  },
  {
    id: "scope",
    title: "3. Scope and Duration",
    fields: [
      {
        kind: "checks",
        id: "q5",
        prompt: "What is the overall scope of the proposed works?",
        exclusive: [NO_RENO_ID, NOT_SURE_ID],
        options: [
          { id: NO_RENO_ID, label: "No renovation works" },
          {
            id: MINOR_FITOUT_ID,
            label:
              "Minor fit-out, such as built-in furniture or finishes, with no M&E changes",
          },
          {
            id: "major-renovation",
            label: "Major renovation, including strip-out or rebuild",
          },
          {
            id: "additional-works",
            label: "Additional works beyond an earlier approval",
          },
          {
            id: "retain-reuse",
            label: "Retain or reuse items left by the previous tenant",
          },
        ],
      },
      {
        kind: "choice",
        id: "q6",
        prompt: "How long are the renovation works expected to take?",
        options: [
          { id: "under-1m", label: "Less than 1 month" },
          { id: "1-to-3m", label: "1 month to less than 3 months" },
          { id: "3-to-6m", label: "3 months to less than 6 months" },
          { id: "6m-plus", label: "6 months or more" },
          { id: NOT_SURE_ID, label: "Not sure" },
        ],
      },
    ],
  },
  {
    id: "arch",
    title: "4. Architectural and Structural Works",
    fields: [
      {
        kind: "checks",
        id: "q7",
        prompt: "Which architectural or structural elements will be affected?",
        options: [
          {
            id: "partitions",
            label: "New, removed or modified partitions",
          },
          { id: "ceiling-works", label: "Ceiling removal or replacement" },
          { id: "floor-hacking", label: "Floor or wall hacking" },
          { id: "finishes", label: "Flooring or wall finishes" },
          { id: "doors-shutters", label: "Doors or shutters" },
          {
            id: "structural-elements",
            label: "Structural walls or structural elements",
          },
          { id: "slab-coring", label: "Slab coring" },
          {
            id: "furniture-only",
            label: "Built-in furniture or fittings only",
          },
          { id: "remove-fixtures", label: "Removal of existing fixtures" },
        ],
      },
      {
        kind: "checks",
        id: "q8",
        prompt:
          "Will the works require access above the ceiling, on the roof or on a catwalk?",
        options: [
          { id: "above-ceiling", label: "Above-ceiling access" },
          { id: "roof", label: "Roof access" },
          { id: "catwalk", label: "Catwalk access" },
        ],
      },
    ],
  },
  {
    id: "services",
    title: "5. Building Services",
    fields: [
      {
        kind: "checks",
        id: "q9",
        prompt: "Which building services will be added, removed or modified?",
        options: [
          { id: "electrical", label: "Electrical wiring or equipment" },
          { id: "acmv", label: "ACMV or air-conditioning system" },
          {
            id: "plumbing",
            label: "Plumbing, sanitary pipes or floor traps",
          },
          { id: "sprinkler-pipe", label: "Sprinkler pipework" },
          { id: "pa", label: "Public address system" },
          {
            id: "data-cabling",
            label: "Data or telephone cabling within the premises",
          },
          {
            id: "telco-cabling",
            label: "Telecommunications service-provider cabling",
          },
        ],
      },
    ],
  },
  {
    id: "fire",
    title: "6. Fire and Life Safety",
    fields: [
      {
        kind: "checks",
        id: "q10",
        prompt: "Which fire protection systems will be affected?",
        options: [
          { id: "smoke-detectors", label: "Smoke detectors" },
          { id: "sprinklers", label: "Sprinklers" },
          { id: "fire-alarm-devices", label: "Fire alarm devices" },
          { id: "hose-reels", label: "Hose reels" },
          { id: "smoke-control", label: "Smoke control system" },
          { id: "stair-press", label: "Stair pressurisation system" },
          { id: "fire-mode-interlocks", label: "Fire mode interlocks" },
        ],
      },
      {
        kind: "yesno",
        id: "q11",
        prompt: "Will fire alarm isolation be required during the works?",
      },
      {
        kind: "checks",
        id: "q12",
        prompt: "Will any means-of-escape provisions change?",
        options: [
          { id: "exit-routes", label: "Exit routes" },
          { id: "exit-signs", label: "Exit signs" },
          { id: "emergency-lighting", label: "Emergency lighting" },
          { id: "occupant-load", label: "Occupant load will increase" },
        ],
      },
      {
        kind: "checks",
        id: "q13",
        prompt: "Will any fire-rated or smoke-control barriers be affected?",
        options: [
          { id: "fire-rated-walls", label: "Fire-rated walls" },
          { id: "fire-rated-doors", label: "Fire-rated doors" },
          { id: "smoke-barriers", label: "Smoke barriers" },
        ],
      },
    ],
  },
  {
    id: "hazards",
    title: "7. Work Activities and Hazards",
    fields: [
      {
        kind: "checks",
        id: "q14",
        prompt: "Which work activities will be carried out?",
        options: [
          {
            id: "hot-works",
            label: "Hot works, such as welding, cutting, grinding or open flame",
          },
          { id: "dust-works", label: "Dust-producing works" },
          {
            id: "alarm-sprinkler-risk",
            label: "Works that may activate fire alarms or sprinklers",
          },
          { id: "hacking-coring", label: "Hacking or coring" },
          { id: "isolate-services", label: "Isolation of building services" },
        ],
      },
      {
        kind: "checks",
        id: "q15",
        prompt: "Will any of the following be introduced, used or stored?",
        options: [
          { id: "lpg", label: "LPG" },
          { id: "cooking", label: "Cooking operations" },
          { id: "hazardous", label: "Hazardous materials" },
          { id: "flammable", label: "Flammable liquids" },
          { id: "ev", label: "Battery charging or EV equipment" },
        ],
      },
    ],
  },
  {
    id: "wet",
    title: "8. Kitchen, Pantry and Wet Areas",
    fields: [
      {
        kind: "yesno",
        id: "q16",
        prompt: "Will the works involve a kitchen, pantry or wet area?",
      },
      {
        kind: "checks",
        id: "q17",
        prompt: "Which kitchen, pantry or wet-area works are proposed?",
        options: [
          { id: "waterproofing", label: "Waterproofing works" },
          { id: "pest-mesh", label: "Pest-prevention wire mesh" },
          {
            id: "grease-trap",
            label: "Portable grease trap or food-waste digester",
          },
          { id: "new-floor-trap", label: "New floor trap" },
          { id: "new-pipes", label: "New or modified pipes" },
          {
            id: "kitchen-suppression",
            label: "Kitchen fire suppression system",
          },
        ],
      },
    ],
  },
  {
    id: "access",
    title: "9. Access and External Approvals",
    fields: [
      {
        kind: "checks",
        id: "q18",
        prompt:
          "Will the works require access to any restricted or specialised area?",
        options: [
          { id: "apron", label: "Apron" },
          { id: "bhs", label: "Baggage handling area" },
          { id: "skytrain", label: "Skytrain area or system" },
          { id: "roof", label: "Roof" },
          { id: "catwalk", label: "Catwalk" },
        ],
      },
      {
        kind: "yesno",
        id: "q19",
        prompt:
          "Will approval from a government agency or external service provider be required?",
      },
      {
        kind: "notes",
        id: "q20",
        prompt:
          "Provide any additional details that may affect the renovation or permit requirements.",
      },
    ],
  },
];

const UNANSWERED: QuestionAnswer = { kind: "unanswered" };

type AnswerMap = Record<string, QuestionAnswer>;

export function v28Answer(state: QuizState, id: string): QuestionAnswer {
  return (state.answers as AnswerMap)[id] ?? UNANSWERED;
}

function withAnswers(state: QuizState, answers: AnswerMap): QuizState {
  return {
    ...state,
    status: state.status === "idle" ? "editing" : state.status,
    answers: answers as QuizState["answers"],
  };
}

function setAnswer(
  state: QuizState,
  id: string,
  answer: QuestionAnswer,
): QuizState {
  return withAnswers(state, {
    ...completeAnswers(state.answers),
    ...(state.answers as AnswerMap),
    [id]: answer,
  });
}

export function v28ChoiceValue(state: QuizState, id: string): string {
  const answer = v28Answer(state, id);
  if (answer.kind === "choice") return answer.value;
  if (answer.kind === "not-sure") return NOT_SURE_ID;
  if (answer.kind === "selected" && answer.slugs.length === 1) {
    return answer.slugs[0] ?? "";
  }
  return "";
}

export function v28NotesValue(state: QuizState): string {
  return v28ChoiceValue(state, "q20");
}

export function v28TextValue(state: QuizState, id: V28FieldId): string {
  const answer = v28Answer(state, id);
  return answer.kind === "choice" ? answer.value : "";
}

/** Show the saved project name in the questionnaire when the field is still empty. */
export function v28QuizForWork(
  work: { title: string; quiz: QuizState },
  unit: Unit,
): QuizState {
  const quiz = hydrateV28FromLegacy(work.quiz, unit);
  if (v28TextValue(quiz, "q-name").trim()) return quiz;
  const title = work.title.trim();
  if (
    !title ||
    title.startsWith("Works ·") ||
    title.startsWith("New work") ||
    title === "New project" ||
    title === "New Project" ||
    title === "Further works" ||
    title === "Further Works" ||
    title === "Opening fit-out" ||
    title === "Opening Fit-Out"
  ) {
    return quiz;
  }
  return setV28Text(quiz, "q-name", title);
}

export function v28YesNoValue(
  state: QuizState,
  id: string,
): "yes" | "no" | "not-sure" | null {
  const answer = v28Answer(state, id);
  if (answer.kind === "not-sure") return "not-sure";
  if (answer.kind === "choice") {
    if (answer.value === "yes" || answer.value === "no" || answer.value === "not-sure") {
      return answer.value;
    }
  }
  return null;
}

export function q5IsNoRenovation(state: QuizState): boolean {
  return isOptionOn(v28Answer(state, "q5"), NO_RENO_ID);
}

export function q5IsMinorFitout(state: QuizState): boolean {
  return isOptionOn(v28Answer(state, "q5"), MINOR_FITOUT_ID);
}

export function v28FieldVisible(state: QuizState, id: V28FieldId): boolean {
  if (id === "q1-other") return v28ChoiceValue(state, "q1") === "other";
  if (id === "q17") return v28YesNoValue(state, "q16") === "yes";
  if (
    id === "q1" ||
    id === "q2" ||
    id === "q3" ||
    id === "q4" ||
    id === "q5" ||
    id === "q20" ||
    id === "q-name" ||
    id === "q-about"
  ) {
    return true;
  }
  return !q5IsNoRenovation(state);
}

function withV37ProjectFields(sections: V28Section[], state: QuizState): V28Section[] {
  const unitId = v28ChoiceValue(state, "q-unit");
  const onUnit = unitId ? v37TenanciesOnUnit(unitId) : [];
  const place: V28Field[] = [
    {
      kind: "choice",
      id: "q-unit",
      prompt: "Which unit is this renovation for?",
      options: v37UnitOptions(),
    },
  ];
  if (onUnit.length > 1) {
    place.push({
      kind: "choice",
      id: "q-tenancy",
      prompt: "Which tenancy is this for?",
      options: onUnit.map((row) => ({
        id: row.id,
        label: `${row.tenantName} · ${row.outlet}, ${row.side}`,
      })),
    });
  }
  return sections.map((section) => {
    if (section.id !== "project") return section;
    const rest = section.fields.filter(
      (field) => field.id === "q-name" || field.id === "q-about",
    );
    return {
      ...section,
      fields: [
        ...place,
        ...rest.map((field) =>
          field.kind === "text" && field.id === "q-about"
            ? {
                ...field,
                placeholder:
                  "A fit-out for a new outlet, or stripping out before leaving",
              }
            : field,
        ),
      ],
    };
  });
}

export function v28VisibleSections(state: QuizState): V28Section[] {
  const sections = V28_QUIZ_SECTIONS.map((section) => ({
    ...section,
    fields: section.fields.filter((field) => v28FieldVisible(state, field.id)),
  })).filter((section) => section.fields.length > 0);
  if (typeof window !== "undefined" && usesV37Cut(window.location.pathname)) {
    return withV37ProjectFields(sections, state);
  }
  return sections;
}

export type V28SummaryLine = { label: string; value: string };

const V28_SUMMARY_LABEL: Partial<Record<V28FieldId, string>> = {
  "q-name": "Project name",
  q1: "Use of premises",
  q2: "Tenancy",
  q3: "Change of use",
  q4: "Premises",
  q5: "Overall scope",
  q6: "Duration",
  q11: "Fire alarm isolation",
  q14: "Work activities",
  q20: "Anything else",
};

/** Confirmed answers only — skips empty, none, and No. */
export function v28ScopeSummary(state: QuizState): V28SummaryLine[] {
  const lines: V28SummaryLine[] = [];
  for (const section of v28VisibleSections(state)) {
    for (const field of section.fields) {
      const value = fieldSummaryValue(state, field);
      if (!value) continue;
      lines.push({
        label: V28_SUMMARY_LABEL[field.id] ?? field.prompt,
        value,
      });
    }
  }
  return lines;
}

function fieldSummaryValue(state: QuizState, field: V28Field): string | null {
  if (field.kind === "notes") {
    const text = v28NotesValue(state).trim();
    return text || null;
  }
  if (field.kind === "text") {
    const text = v28TextValue(state, field.id).trim();
    return text || null;
  }
  if (field.kind === "choice") {
    const value = v28ChoiceValue(state, field.id);
    if (!value) return null;
    if (value === "other") return v28ChoiceValue(state, "q1-other") || "Other";
    return field.options.find((option) => option.id === value)?.label ?? null;
  }
  if (field.kind === "yesno") {
    const value = v28YesNoValue(state, field.id);
    if (value === "yes") return "Yes";
    if (value === "not-sure") return "Not sure";
    return null;
  }
  const answer = v28Answer(state, field.id);
  if (answer.kind === "not-sure") return "Not sure";
  if (answer.kind === "none") return null;
  if (field.kind !== "checks") return null;
  const labels = field.options
    .filter((option) => isOptionOn(answer, option.id))
    .map((option) => option.label);
  return labels.length > 0 ? labels.join(", ") : null;
}

function fieldAnswered(state: QuizState, field: V28Field): boolean {
  if (field.kind === "notes") return true;
  if (field.kind === "text") {
    if (v28TextValue(state, field.id).trim()) return true;
    return state.status === "done" || state.confirmed;
  }
  if (field.kind === "choice") {
    const value = v28ChoiceValue(state, field.id);
    if (!value) return false;
    if (value === "other") return Boolean(v28ChoiceValue(state, "q1-other"));
    return true;
  }
  if (field.kind === "yesno") return v28YesNoValue(state, field.id) !== null;
  const answer = v28Answer(state, field.id);
  if (answer.kind === "none" || answer.kind === "not-sure") return true;
  if (answer.kind === "selected") return answer.slugs.length > 0;
  if (answer.kind === "flags") return answer.on.length > 0 || answer.off.length > 0;
  return false;
}

export function v28QuizProgress(state: QuizState): {
  answered: number;
  total: number;
} {
  const fields = v28VisibleSections(state)
    .flatMap((section) => section.fields)
    .filter((field) => field.kind !== "notes");
  let answered = 0;
  for (const field of fields) {
    if (fieldAnswered(state, field)) answered += 1;
  }
  return { answered, total: fields.length };
}

export function v28HasSavedAnswers(state: QuizState): boolean {
  if (
    V28_QUIZ_SECTIONS.flatMap((section) => section.fields).some((field) => {
      if (field.kind === "notes") return Boolean(v28NotesValue(state));
      return fieldAnswered(state, field);
    })
  ) {
    return true;
  }
  return quizHasSavedAnswers(state);
}

export function settleV28Write(state: QuizState): QuizState {
  if (!v28HasSavedAnswers(state)) {
    return { ...state, status: "idle", confirmed: false };
  }
  const { answered, total } = v28QuizProgress(state);
  return {
    ...state,
    status: answered >= total ? "done" : "paused",
  };
}

export function setV28Choice(
  state: QuizState,
  id: V28FieldId,
  value: string,
): QuizState {
  if (!value) return setAnswer(state, id, UNANSWERED);
  if (value === NOT_SURE_ID) return setAnswer(state, id, { kind: "not-sure" });
  const next = setAnswer(state, id, { kind: "choice", value });
  if (id === "q1" && value !== "other") {
    return setAnswer(next, "q1-other", UNANSWERED);
  }
  return next;
}

export function setV28YesNo(
  state: QuizState,
  id: V28FieldId,
  value: "yes" | "no" | "not-sure",
): QuizState {
  const current = v28YesNoValue(state, id);
  if (current === value) return setAnswer(state, id, UNANSWERED);
  if (value === "not-sure") return setAnswer(state, id, { kind: "not-sure" });
  return setAnswer(state, id, { kind: "choice", value });
}

export function setV28Notes(state: QuizState, value: string): QuizState {
  return setV28Text(state, "q20", value);
}

export function setV28Text(
  state: QuizState,
  id: V28FieldId,
  value: string,
): QuizState {
  return setAnswer(
    state,
    id,
    value.trim() ? { kind: "choice", value } : UNANSWERED,
  );
}

export function setV28Check(
  state: QuizState,
  id: V28FieldId,
  optionId: string,
): QuizState {
  const field = V28_QUIZ_SECTIONS.flatMap((section) => section.fields).find(
    (row) => row.kind === "checks" && row.id === id,
  );
  const exclusive = field?.kind === "checks" ? (field.exclusive ?? [NONE_ID, NOT_SURE_ID]) : [NONE_ID, NOT_SURE_ID];
  const current = v28Answer(state, id);

  if (exclusive.includes(optionId)) {
    if (optionId === NONE_ID) {
      return setAnswer(
        state,
        id,
        current.kind === "none" ? UNANSWERED : { kind: "none" },
      );
    }
    if (optionId === NOT_SURE_ID) {
      return setAnswer(
        state,
        id,
        current.kind === "not-sure" ? UNANSWERED : { kind: "not-sure" },
      );
    }
    if (isOptionOn(current, optionId)) return setAnswer(state, id, UNANSWERED);
    return setAnswer(state, id, { kind: "selected", slugs: [optionId as PlannedWorkSlug] });
  }

  const selected =
    current.kind === "selected"
      ? current.slugs.filter((slug) => !exclusive.includes(slug))
      : current.kind === "flags"
        ? current.on.filter((slug) => !exclusive.includes(slug))
        : [];
  const next = new Set(selected);
  if (next.has(optionId as PlannedWorkSlug)) next.delete(optionId as PlannedWorkSlug);
  else next.add(optionId as PlannedWorkSlug);
  if (next.size === 0) return setAnswer(state, id, UNANSWERED);
  return setAnswer(state, id, {
    kind: "selected",
    slugs: [...next] as PlannedWorkSlug[],
  });
}

/** Options that still drive the existing Works pack / permit list. */
const SLUG_FROM_OPTION: Record<string, PlannedWorkSlug[]> = {
  "q3:yes": ["change-of-use"],
  "q4:apron-bhs": ["apron"],
  "q4:shopfront": ["facing-travelling-pax"],
  "q4:enclosed-rooms": ["closed-door-rooms"],
  "q4:duplex": ["duplex"],
  "q5:major-renovation": ["large-scale-renovation"],
  "q5:additional-works": ["additional-renovation-scope"],
  "q5:retain-reuse": ["takeover-from-exiting-tenant"],
  "q7:floor-hacking": ["structural-works"],
  "q7:structural-elements": ["structural-works"],
  "q7:slab-coring": ["structural-works"],
  "q8:above-ceiling": ["above-ceiling-works"],
  "q8:roof": ["roof-works"],
  "q8:catwalk": ["catwalk-access"],
  "q9:electrical": ["mep-changes"],
  "q9:acmv": ["mep-changes"],
  "q9:plumbing": ["mep-changes"],
  "q9:sprinkler-pipe": ["mep-changes"],
  "q9:pa": ["mep-changes"],
  "q9:data-cabling": ["structured-cabling"],
  "q9:telco-cabling": ["telco-cabling"],
  "q10:smoke-detectors": ["fire-protection-detection-works"],
  "q10:sprinklers": ["fire-protection-detection-works"],
  "q10:fire-alarm-devices": ["fire-protection-detection-works"],
  "q10:hose-reels": ["fire-protection-detection-works"],
  "q10:smoke-control": ["fire-protection-detection-works"],
  "q10:stair-press": ["fire-protection-detection-works"],
  "q10:fire-mode-interlocks": ["fire-protection-detection-works"],
  "q11:yes": ["fire-alarm-isolation"],
  "q12:exit-routes": ["fire-safety-submission"],
  "q12:exit-signs": ["fire-safety-submission"],
  "q12:emergency-lighting": ["fire-safety-submission"],
  "q12:occupant-load": ["fire-safety-submission"],
  "q13:fire-rated-walls": ["fire-protection-detection-works"],
  "q13:fire-rated-doors": ["fire-protection-detection-works"],
  "q13:smoke-barriers": ["fire-protection-detection-works"],
  "q14:hot-works": ["hot-work"],
  "q14:dust-works": ["fire-alarm-isolation"],
  "q14:alarm-sprinkler-risk": ["fire-alarm-isolation"],
  "q14:hacking-coring": ["structural-works"],
  "q14:isolate-services": ["mep-changes"],
  "q15:lpg": ["gas-supply"],
  "q15:cooking": ["deep-frying-open-flame"],
  "q17:waterproofing": ["waterproofing-works"],
  "q17:new-floor-trap": ["mep-changes"],
  "q17:new-pipes": ["mep-changes"],
  "q17:kitchen-suppression": ["fire-protection-detection-works"],
  "q18:apron": ["apron"],
  "q18:bhs": ["apron"],
  "q18:skytrain": ["skytrain-work"],
  "q18:roof": ["roof-works"],
  "q18:catwalk": ["catwalk-access"],
  "q19:yes": ["authority-approval"],
};

const PACK_BUCKET: Record<
  QuestionId,
  PlannedWorkSlug[]
> = {
  unit: ["apron", "facing-travelling-pax", "closed-door-rooms", "duplex"],
  scope: [
    "large-scale-renovation",
    "change-of-use",
    "additional-renovation-scope",
    "takeover-from-exiting-tenant",
  ],
  fire: [
    "hot-work",
    "fire-alarm-isolation",
    "fire-protection-detection-works",
    "fire-safety-submission",
  ],
  structure: ["above-ceiling-works", "roof-works", "structural-works"],
  mep: ["mep-changes", "waterproofing-works"],
  external: [
    "structured-cabling",
    "telco-cabling",
    "catwalk-access",
    "skytrain-work",
    "authority-approval",
  ],
  features: ["gas-supply", "deep-frying-open-flame"],
  terminal: [],
  trade: [],
};

function selectedIds(answer: QuestionAnswer): string[] {
  if (answer.kind === "selected") return answer.slugs;
  if (answer.kind === "flags") return answer.on;
  if (answer.kind === "choice" && answer.value) return [answer.value];
  if (answer.kind === "not-sure") return [NOT_SURE_ID];
  if (answer.kind === "none") return [NONE_ID];
  return [];
}

function slugsFromVisible(state: QuizState): Set<PlannedWorkSlug> {
  const slugs = new Set<PlannedWorkSlug>();
  for (const section of v28VisibleSections(state)) {
    for (const field of section.fields) {
      if (field.kind === "notes" || field.kind === "text") continue;
      if (field.kind === "yesno") {
        const value = v28YesNoValue(state, field.id);
        if (value === "yes") {
          for (const slug of SLUG_FROM_OPTION[`${field.id}:yes`] ?? []) {
            slugs.add(slug);
          }
        }
        continue;
      }
      if (field.kind === "choice") continue;
      const answer = v28Answer(state, field.id);
      if (answer.kind === "none" || answer.kind === "not-sure") continue;
      for (const optionId of selectedIds(answer)) {
        for (const slug of SLUG_FROM_OPTION[`${field.id}:${optionId}`] ?? []) {
          slugs.add(slug);
        }
      }
    }
  }
  return slugs;
}

/** Write pack slugs into the shared quiz buckets Works already reads. */
export function syncV28Slugs(state: QuizState): QuizState {
  if (!anyV28Keyed(state)) return state;
  const slugs = slugsFromVisible(state);
  const answers: AnswerMap = {
    ...completeAnswers(state.answers),
    ...(state.answers as AnswerMap),
  };
  (Object.entries(PACK_BUCKET) as [QuestionId, PlannedWorkSlug[]][]).forEach(
    ([questionId, bucket]) => {
      if (bucket.length === 0) return;
      const on = bucket.filter((slug) => slugs.has(slug));
      answers[questionId] =
        on.length > 0 ? { kind: "selected", slugs: on } : { kind: "none" };
    },
  );
  return { ...state, answers: answers as QuizState["answers"] };
}

const LEGACY_TO_V28: Partial<Record<PlannedWorkSlug, { id: V28FieldId; option: string }[]>> =
  {
    "facing-travelling-pax": [{ id: "q4", option: "shopfront" }],
    "closed-door-rooms": [{ id: "q4", option: "enclosed-rooms" }],
    duplex: [{ id: "q4", option: "duplex" }],
    apron: [
      { id: "q4", option: "apron-bhs" },
      { id: "q18", option: "apron" },
    ],
    "large-scale-renovation": [{ id: "q5", option: "major-renovation" }],
    "change-of-use": [{ id: "q3", option: "yes" }],
    "additional-renovation-scope": [{ id: "q5", option: "additional-works" }],
    "takeover-from-exiting-tenant": [{ id: "q5", option: "retain-reuse" }],
    "hot-work": [{ id: "q14", option: "hot-works" }],
    "fire-alarm-isolation": [{ id: "q11", option: "yes" }],
    "fire-protection-detection-works": [{ id: "q10", option: "sprinklers" }],
    "fire-safety-submission": [{ id: "q12", option: "occupant-load" }],
    "above-ceiling-works": [{ id: "q8", option: "above-ceiling" }],
    "roof-works": [
      { id: "q8", option: "roof" },
      { id: "q18", option: "roof" },
    ],
    "structural-works": [
      { id: "q7", option: "structural-elements" },
      { id: "q7", option: "floor-hacking" },
    ],
    "mep-changes": [{ id: "q9", option: "electrical" }],
    "waterproofing-works": [
      { id: "q16", option: "yes" },
      { id: "q17", option: "waterproofing" },
    ],
    "structured-cabling": [{ id: "q9", option: "data-cabling" }],
    "telco-cabling": [{ id: "q9", option: "telco-cabling" }],
    "catwalk-access": [
      { id: "q8", option: "catwalk" },
      { id: "q18", option: "catwalk" },
    ],
    "skytrain-work": [{ id: "q18", option: "skytrain" }],
    "authority-approval": [{ id: "q19", option: "yes" }],
    "gas-supply": [{ id: "q15", option: "lpg" }],
    "deep-frying-open-flame": [{ id: "q15", option: "cooking" }],
  };

function anyV28Keyed(state: QuizState): boolean {
  return V28_QUIZ_SECTIONS.some((section) =>
    section.fields.some((field) => v28Answer(state, field.id).kind !== "unanswered"),
  );
}

function addCheck(answers: AnswerMap, id: V28FieldId, option: string) {
  if (option === "yes") {
    answers[id] = { kind: "choice", value: "yes" };
    return;
  }
  const current = answers[id] ?? UNANSWERED;
  if (current.kind === "none" || current.kind === "not-sure") return;
  const slugs =
    current.kind === "selected"
      ? current.slugs
      : current.kind === "flags"
        ? current.on
        : [];
  if (slugs.includes(option as PlannedWorkSlug)) return;
  answers[id] = {
    kind: "selected",
    slugs: [...slugs, option] as PlannedWorkSlug[],
  };
}

/** Fill empty v28 questions from older Works slugs so stock demos still read. */
export function hydrateV28FromLegacy(state: QuizState, _unit: Unit): QuizState {
  if (anyV28Keyed(state)) return state;
  if (!quizHasSavedAnswers(state)) return state;
  const answers: AnswerMap = {
    ...completeAnswers(state.answers),
    ...(state.answers as AnswerMap),
  };
  for (const [slug, targets] of Object.entries(LEGACY_TO_V28)) {
    const on = Object.values(state.answers).some((answer) =>
      isOptionOn(answer, slug),
    );
    if (!on) continue;
    for (const target of targets ?? []) addCheck(answers, target.id, target.option);
  }
  return { ...state, answers: answers as QuizState["answers"] };
}
