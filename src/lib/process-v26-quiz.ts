import type { PlannedWorkSlug, Unit } from "@/lib/tenancy-data";
import {
  completeAnswers,
  type QuestionAnswer,
  type QuizState,
} from "@/lib/process-planned-works-quiz";
import {
  choiceValue,
  setV25Choice,
  type V25Section,
  yesNoValue,
} from "@/lib/process-v25-quiz";

/**
 * v26 quiz omits unit identity already shown on Page Header
 * (`_Atoms/UnitSelection`): unit number, terminal, zone, tenancy type.
 * Those facts come from the selected unit, not from this form.
 */
export const V26_QUIZ_SECTIONS: V25Section[] = [
  {
    id: "unit",
    title: "About your unit",
    fields: [
      {
        kind: "checks",
        id: "unit",
        prompt: "Which of these describe your unit? (select all)",
        options: [
          {
            id: "apron",
            label: "Apron or baggage area",
          },
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
        // Monday feasibility: derive from the PO on this unit (LCD / ACD / RP)
        // instead of asking. Keep the question until the project team confirms
        // that officer team maps cleanly to who handles the lease.
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
            id: "catwalk-access",
            label: "Workers need the Terminal 4 catwalk",
          },
          {
            id: "skytrain-work",
            label: "Work on or within 6 metres of the Skytrain",
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
        questionId: "features",
        slug: "lack-of-perm-meter",
        invert: true,
      },
      {
        kind: "yesno",
        id: "ahu",
        prompt:
          "Does your unit have an Air Handling Unit that you maintain yourself?",
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

/** Apron is only a real extra grain on airside units. Zone already answers landside vs airside. */
export function v26QuizSectionsFor(unit: Unit): V25Section[] {
  return V26_QUIZ_SECTIONS.map((section) => ({
    ...section,
    fields: section.fields.map((field) => {
      if (field.kind !== "checks") return field;
      if (field.id === "unit") {
        return {
          ...field,
          options: field.options.filter(
            (option) => option.id !== "apron" || unit.zone === "Airside",
          ),
        };
      }
      if (field.id === "external") {
        return {
          ...field,
          options: field.options.filter((option) => {
            if (option.id === "catwalk-access") return unit.terminal === "T4";
            if (option.id === "skytrain-work") {
              return (
                unit.terminal === "T1" ||
                unit.terminal === "T2" ||
                unit.terminal === "T3"
              );
            }
            return true;
          }),
        };
      }
      return field;
    }),
  }));
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

export function v26QuizProgress(state: QuizState, unit: Unit) {
  const fields = v26QuizSectionsFor(unit).flatMap((section) => section.fields);
  let answered = 0;
  for (const field of fields) {
    if (field.kind === "choice") {
      if (choiceValue(state.answers[field.id], field.fallback?.(unit) ?? "")) {
        answered += 1;
      }
      continue;
    }
    if (field.kind === "yesno") {
      if (
        yesNoValue(state.answers[field.questionId], field.slug, field.invert) !==
        null
      ) {
        answered += 1;
      }
      continue;
    }
    if (
      checksFieldAnswered(
        state.answers[field.id],
        field.options.map((option) => option.id),
      )
    ) {
      answered += 1;
    }
  }
  return { answered, total: fields.length };
}

/** Keep terminal / trade on the record from the header unit. Do not ask them. */
export function stampV26UnitFacts(state: QuizState, unit: Unit): QuizState {
  let next = setV25Choice(state, "terminal", unit.terminal);
  next = setV25Choice(next, "trade", unit.tenancyType);
  return {
    ...next,
    answers: completeAnswers(next.answers),
  };
}
