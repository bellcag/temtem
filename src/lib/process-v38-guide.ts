import type { Role } from "@/lib/app-state";
import type { QuizState } from "@/lib/process-planned-works-quiz";
import type { V26Card, V26PhaseGuide, V26TellLine } from "@/lib/process-v26-guide";
import type { Unit } from "@/lib/tenancy-data";
import {
  V38_BLUEPRINT,
  type V38BlueprintRow,
} from "@/lib/process-v38-blueprint";

const PHASE_ORDER = ["Setup", "Build", "Operate", "Exit"] as const;

const PHASE_INTRO: Record<(typeof PHASE_ORDER)[number], string> = {
  Setup: "Before opening",
  Build: "During the fit-out",
  Operate: "While the outlet is open",
  Exit: "Leaving the unit",
};

function stripIndex(value: string) {
  return value.replace(/^\d+(?:\.\d+)*\.?\s*/, "").trim() || value.trim();
}

function stepKey(row: V38BlueprintRow) {
  const num = row.step.match(/^(\d+(?:\.\d+)*)/)?.[1]?.replace(/\./g, "-");
  return `v38-${row.phase.toLowerCase()}-${num ?? stripIndex(row.step).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

function taskFor(_role: Role, row: V38BlueprintRow) {
  return row.task.trim();
}

function becauseLabel(raw: string) {
  const text = raw.trim();
  if (!text || text.toUpperCase() === "NA") return [];
  return [text];
}

const SCOPE_LABEL: Record<string, string> = {
  FIRE_PROTECTION_AFFECTED: "Fire protection or detection works",
  FIRE_SAFETY_CERTIFICATE_REQUIRED: "Fire safety certificate",
  WORKS_REQUIRE_JOINT_SITE_INSPECTION: "Joint site inspection",
  WORKS_ARCHI_AUTHORITY_SUBMISSION: "Authority submission",
  TAKEOVER_FROM_EXITING_TENANT: "Takeover from the exiting tenant",
  FIRE_SAFETY_SUBMISSION_REQUIRED: "Fire safety submission",
  PERMIT_SUBSET_SHORTLISTED: "Shortlisted permits",
  PERMIT_TYPE_SELECTED: "Selected permit",
  WORKS_RENOVATION_FITOUT: "Renovation fit-out",
  WORKS_CEILING: "Ceiling works",
  WORKS_FIRE_ALARM_ISOLATION: "Fire alarm isolation",
  WORKS_HOTWORK: "Hot works",
  WORKS_MEP_CHANGES: "MEP changes",
  WORKS_T3_STRUCTURED_CABLING: "T3 structured cabling",
  WORKS_STRUCTURED_CABLING: "Structured cabling",
  WORKS_TELCO_CABLING: "Telco cabling",
  WORKS_T4_CATWALK_ACCESS: "T4 catwalk access",
  WORKS_RENOVATION_ADDITIONAL: "Additional renovation works",
  WORKS_WATERPROOFING: "Waterproofing works",
};

function sheetBecause(rows: V38BlueprintRow[]) {
  const tags: string[] = [];
  const seen = new Set<string>();
  const add = (label: string) => {
    if (seen.has(label)) return;
    seen.add(label);
    tags.push(label);
  };
  for (const row of rows) {
    for (const label of [
      ...becauseLabel(row.area),
      ...becauseLabel(row.features),
      ...becauseLabel(row.tenantType),
      ...becauseLabel(row.officerScope),
      ...becauseLabel(row.unitType),
    ]) {
      add(label);
    }
    for (const code of row.scope.split(",")) {
      const label = SCOPE_LABEL[code.trim()];
      if (label) add(label);
    }
  }
  return tags;
}

/** Every blueprint row, for every role. Audience, unit, and scope filters stay off until Project Officers are ready. */
function visibleRows(
  rows: V38BlueprintRow[],
  _unit: Unit,
  role: Role,
  _quiz?: QuizState,
) {
  return rows.filter((row) => Boolean(taskFor(role, row)));
}

const JOURNEY_ROWS = V38_BLUEPRINT.filter((row) => row.module === "Tenancy Journey");
const PROJECT_ROWS = V38_BLUEPRINT.filter((row) => row.module === "Project Module");

function cardShell(rows: V38BlueprintRow[]) {
  const first = rows[0];
  const systems = new Set<string>();
  const docs = new Set<string>();
  for (const row of rows) {
    row.systems.forEach((system) => systems.add(system));
    row.documents.forEach((doc) => docs.add(doc));
  }
  return {
    id: stepKey(first),
    title: stripIndex(first.step),
    kind: rows.some((row) => row.cardAction) ? ("works-door" as const) : ("guide" as const),
    sources: [] as [],
    sheetSystems: [...systems],
    sheetDocs: [...docs],
    sheetBecause: sheetBecause(rows),
  };
}

export function v38JourneyPhases(unit: Unit, role: Role): V26PhaseGuide[] {
  return PHASE_ORDER.map((name) => {
    const rows = JOURNEY_ROWS.filter((row) => row.phase === name);
    const stages: string[] = [];
    for (const row of rows) {
      if (!stages.includes(row.stage)) stages.push(row.stage);
    }
    const chapters = stages
      .map((stage) => {
        const stageRows = rows.filter((item) => item.stage === stage);
        const steps: string[] = [];
        for (const row of stageRows) {
          if (!steps.includes(row.step)) steps.push(row.step);
        }
        const cards = steps
          .map((step) => {
            const group = visibleRows(
              stageRows.filter((item) => item.step === step),
              unit,
              role,
            );
            if (group.length === 0) return null;
            return cardShell(group);
          })
          .filter((card) => card !== null);
        if (cards.length === 0) return null;
        return {
          id: `v38-${name.toLowerCase()}-${stripIndex(stage).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
          title: stripIndex(stage),
          lead: "",
          cards,
        };
      })
      .filter((chapter) => chapter !== null);
    return {
      id: name.toLowerCase() as V26PhaseGuide["id"],
      name,
      intro: PHASE_INTRO[name],
      chapters,
    };
  }).filter((phase) => phase.chapters.length > 0);
}

const WHO: Record<Role, V26TellLine["who"]> = {
  tenant: "Tenant",
  contractor: "Contractor",
  officer: "Project Officer",
};

export function v38JourneyAsks(
  cardId: string,
  role: Role,
  unit: Unit,
): V26TellLine[] | null {
  const rows = visibleRows(
    JOURNEY_ROWS.filter((row) => stepKey(row) === cardId),
    unit,
    role,
  );
  if (rows.length === 0) return null;
  return rows.map((row) => ({ who: WHO[role], text: taskFor(role, row) }));
}

export type V38ProjectGroup = {
  id: string;
  stage: string;
  step: string;
  tasks: string[];
  door: boolean;
};

export function v38ProjectGroups(
  unit: Unit,
  role: Role,
  quiz: QuizState,
): V38ProjectGroup[] {
  const steps: string[] = [];
  for (const row of PROJECT_ROWS) {
    if (!steps.includes(row.step)) steps.push(row.step);
  }
  return steps
    .map((step) => {
      const group = visibleRows(
        PROJECT_ROWS.filter((row) => row.step === step),
        unit,
        role,
        quiz,
      );
      if (group.length === 0) return null;
      return {
        id: stepKey(group[0]),
        stage: stripIndex(group[0].stage),
        step: stripIndex(step),
        tasks: group.map((row) => taskFor(role, row)).filter(Boolean),
        door: group.some((row) => row.cardAction),
      };
    })
    .filter((group) => group !== null);
}

export function v38FullGuideCards(
  unit: Unit,
  role: Role,
  quiz: QuizState,
): { card: V26Card; asks: V26TellLine[] }[] {
  const steps: string[] = [];
  for (const row of PROJECT_ROWS) {
    if (!steps.includes(row.step)) steps.push(row.step);
  }
  const cards: { card: V26Card; asks: V26TellLine[] }[] = [];
  for (const step of steps) {
    const group = visibleRows(
      PROJECT_ROWS.filter((row) => row.step === step),
      unit,
      role,
      quiz,
    );
    if (group.length === 0) continue;
    const systems = new Set<string>();
    const docs = new Set<string>();
    const asks: V26TellLine[] = [];
    const seen = new Set<string>();
    for (const row of group) {
      row.systems.forEach((item) => systems.add(item));
      row.documents.forEach((item) => docs.add(item));
      const text = taskFor(role, row);
      if (!text || seen.has(text)) continue;
      seen.add(text);
      asks.push({ who: WHO[role], text });
    }
    cards.push({
      card: {
        id: stepKey(group[0]),
        title: stripIndex(step),
        kind: "guide",
        sources: [],
        sheetSystems: [...systems],
        sheetDocs: [...docs],
        sheetBecause: sheetBecause(group),
      },
      asks,
    });
  }
  return cards;
}
