import type { Role } from "@/lib/app-state";
import type { V26Card, V26PhaseGuide, V26TellLine } from "@/lib/process-v26-guide";
import type { Unit } from "@/lib/tenancy-data";
import { V40_STEPS, type V40Step } from "@/lib/process-v40-steps";

const PHASES = [
  { sheet: "SetUp", id: "setup", name: "Setup", intro: "Before opening" },
  { sheet: "Build", id: "build", name: "Build", intro: "During the fit-out" },
  { sheet: "Operate", id: "operate", name: "Operate", intro: "While the outlet is open" },
  { sheet: "Exit", id: "exit", name: "Exit", intro: "Leaving the unit" },
] as const;

const WHO: Record<Role, V26TellLine["who"]> = {
  tenant: "Tenant",
  contractor: "Contractor",
  officer: "Project Officer",
};

const INTERNAL = /onedrive|newforma|sharepoint|hard disk|key management system|procurement|customer discovery/i;

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function stepId(step: V40Step) {
  return `v40-${step.phase.toLowerCase()}-${slug(step.step)}`;
}

function scrub(text: string, role: Role) {
  if (role === "officer") return text;
  return text
    .replace(/ from the Key Management System/gi, "")
    .replace(/\b(OneDrive|Newforma|SharePoint|Hard Disk|Key Management System|Procurement|Customer Discovery Insights)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;])/g, "$1")
    .trim();
}

function visible(step: V40Step, unit: Unit, role: Role) {
  if (/officer only/i.test(step.audience) && role !== "officer") return false;
  if (step.area === "Landside" && unit.zone !== "Landside") return false;
  if (step.unitType === "Retail or F&B" && unit.tenancyType !== "Retail" && unit.tenancyType !== "F&B") {
    return false;
  }
  if (/F&B with cooking/i.test(step.unitType) && unit.tenancyType !== "F&B") return false;
  return true;
}

function because(step: V40Step) {
  const tags: string[] = [];
  for (const why of [step.unitTypeWhy, step.areaWhy, step.workScopeWhy, step.unitFeatureWhy]) {
    if (!why || /keep to|system-resolved/i.test(why)) continue;
    if (!tags.includes(why)) tags.push(why);
  }
  return tags;
}

function toCard(step: V40Step, role: Role): V26Card {
  const lines = step.description.map((line) => scrub(line, role)).filter(Boolean);
  return {
    id: stepId(step),
    title: step.step,
    kind: step.action ? "works-door" : "guide",
    sources: [],
    sheetPeople: step.people,
    sheetSystemLinks: step.systems.filter((system) => role === "officer" || !INTERNAL.test(system.label)),
    sheetDocs: step.documents,
    sheetBecause: because(step),
    sheetBanner: step.action,
    sheetSla: step.sla,
    steps: {
      tenant: lines,
      contractor: lines,
      officer: lines,
    },
  };
}

export function v40JourneyPhases(unit: Unit, role: Role): V26PhaseGuide[] {
  return PHASES.map((phase) => {
    const rows = V40_STEPS.filter((step) => step.phase === phase.sheet && visible(step, unit, role));
    const chapters: V26PhaseGuide["chapters"] = [];
    const usedIds = new Set<string>();
    for (const row of rows) {
      const last = chapters[chapters.length - 1];
      if (!last || last.title !== row.stage) {
        const base = `v40-${phase.id}-${slug(row.stage)}`;
        let id = base;
        let n = 2;
        while (usedIds.has(id)) {
          id = `${base}-${n}`;
          n += 1;
        }
        usedIds.add(id);
        chapters.push({ id, title: row.stage, lead: "", cards: [] });
      }
      chapters[chapters.length - 1].cards.push(toCard(row, role));
    }
    return {
      id: phase.id,
      name: phase.name,
      intro: phase.intro,
      chapters,
    };
  }).filter((phase) => phase.chapters.some((chapter) => chapter.cards.length > 0));
}

export function v40JourneyAsks(cardId: string, role: Role, unit: Unit): V26TellLine[] | null {
  const step = V40_STEPS.find((row) => stepId(row) === cardId);
  if (!step || !visible(step, unit, role)) return null;
  const lines = step.description.map((line) => scrub(line, role)).filter(Boolean);
  return lines.map((text) => ({ who: WHO[role], text }));
}
