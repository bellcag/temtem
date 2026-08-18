import type {
  Audience,
  DocItem,
  Phase,
  Stage,
  Step,
  SubStep,
  Unit,
} from "@/lib/tenancy-data";
import { DOCUMENTS, PHASES, unitProfile, type UnitProfile } from "@/lib/tenancy-data";
import type { Role } from "@/lib/app-state";

export function audienceForRole(role: Role, audience: Audience): boolean {
  if (audience === "shared") return true;
  if (Array.isArray(audience)) return audience.includes(role);
  return audience === role;
}

function isWorkTag(tag: string): boolean {
  const t = tag.toLowerCase();
  if (t === "ceiling" || t === "hotwork" || t === "fai") return true;
  if (t === "permit-arch" || t === "permit-mep" || t === "permit-cabling") return true;
  if (t.includes("based on selected permit")) return true;
  if (t.includes("ceiling work") || t.includes("ceiling panel") || t.includes("false ceiling")) return true;
  if (t.includes("hotwork") || t.includes("hot work")) return true;
  if (t.includes("fire alarm isolation") || t.includes("above-ceiling") || t.includes("roof work")) return true;
  if (t.includes("affect fire protection") || t.includes("affected fire protection")) return true;
  if (t.includes("selected permit type")) return true;
  return false;
}

/** Unit-profile filter. Role tags and work-scope tags never hide a block. */
export function tagAppliesToUnit(
  tag: string | undefined,
  unit: Unit,
  profile: UnitProfile = unitProfile(unit),
): boolean {
  if (!tag) return true;
  if (isWorkTag(tag)) return true;

  const t = tag.toLowerCase();

  if (t.includes("duplex")) return profile.duplex;
  if (t.includes("outgoing")) return profile.outgoing;
  if (t.includes("landside")) return profile.landsideConcessions;
  if (t.includes("facing travelling pax") || t.includes("facing traveling pax")) {
    return profile.facesTravellingPax;
  }
  if (t.includes("t4 only") || t === "t4" || t.includes("terminal 4 only")) {
    return profile.terminal === "T4";
  }
  if (t.includes("t3 only") || t.includes("terminal 3 (")) {
    return profile.terminal === "T3";
  }
  if (t.includes("t1 / t3") || t.includes("t1, t2, t3") || t.includes("terminal 1, terminal 2, terminal 3")) {
    return profile.terminal === "T1" || profile.terminal === "T2" || profile.terminal === "T3";
  }
  if (t.includes("t2 / t4")) return profile.terminal === "T2" || profile.terminal === "T4";
  if (t.includes("retail") && t.includes("f&b")) {
    return profile.tenancyType === "F&B" || profile.tenancyType === "Retail";
  }
  if (t.includes("f&b") && !t.includes("retail") && profile.tenancyType !== "F&B") return false;
  if (t.includes("retail") && !t.includes("f&b") && profile.tenancyType !== "Retail") return false;
  if (t.includes("need gas") && profile.tenancyType !== "F&B") return false;
  if (t.includes("closed-door")) return false;
  if (t.includes("event space")) return false;
  if (t.includes("servers/computer") || t.includes("computer rooms")) return false;
  if (t.includes("lack of perm meter")) return false;
  return true;
}

/** @deprecated Use tagAppliesToUnit. showFull is ignored — one unit = one map. */
export function tagApplies(
  tag: string | undefined,
  tenancyType: string,
  terminal: string,
  _showFull?: boolean,
) {
  return tagAppliesToUnit(tag, unitFromFacts(tenancyType, terminal));
}

export function unitFromFacts(
  tenancyType: string,
  terminal: string,
  extras: Partial<Unit> = {},
): Unit {
  const zone = extras.zone ?? "Airside";
  return {
    id: extras.id ?? "compat",
    unitNo: extras.unitNo ?? "",
    terminal: (terminal as Unit["terminal"]) || "T3",
    tenancyType: tenancyType as Unit["tenancyType"],
    zone,
    company: extras.company ?? "",
    facesTravellingPax: extras.facesTravellingPax,
    duplex: extras.duplex,
    landsideConcessions: extras.landsideConcessions,
    outgoing: extras.outgoing,
  };
}

function resolveUnit(
  tenancyTypeOrUnit: string | Unit,
  terminal?: string,
): Unit {
  if (typeof tenancyTypeOrUnit !== "string") return tenancyTypeOrUnit;
  return unitFromFacts(tenancyTypeOrUnit, terminal ?? "T3");
}

/** Unit-profile filter only. Role never drops a task from the step. */
export function filterSubSteps(
  step: Step,
  roleOrUnit: Role | Unit,
  tenancyType?: string,
  terminal?: string,
  _showFull?: boolean,
): SubStep[] {
  const unit =
    typeof roleOrUnit !== "string"
      ? roleOrUnit
      : resolveUnit(tenancyType ?? "F&B", terminal);
  return step.subSteps.filter((s) => tagAppliesToUnit(s.tag, unit));
}

export function stepWhat(step: Step, role: Role) {
  return step.whatFor?.[role] ?? step.what;
}

/** Concrete action or “what you get” for the signed-in role. */
export function isMyAction(role: Role, audience: Audience): boolean {
  if (audience === "shared") return true;
  if (audience === role) return true;
  if (Array.isArray(audience)) return audience.includes(role);
  return false;
}

export function displayText(sub: SubStep, mine: boolean, role?: Role) {
  if (mine || role === "officer") return sub.text;
  return sub.alsoText ?? sub.text;
}

export function partitionGuide(subs: SubStep[], role: Role) {
  const mine: SubStep[] = [];
  const others: SubStep[] = [];
  for (const s of subs) {
    if (isMyAction(role, s.audience)) mine.push(s);
    else others.push(s);
  }
  return { mine, others };
}

export type ClassifiedSub = SubStep & { mine: boolean };

export type ClassifiedStep = {
  step: Step;
  mine: SubStep[];
  others: SubStep[];
  flow: ClassifiedSub[];
  kind: "yours" | "also";
};

export function groupGuideBlocks(subs: SubStep[]) {
  const sequential: SubStep[] = [];
  const parallel: SubStep[] = [];
  const nested: SubStep[] = [];
  for (const s of subs) {
    if (s.workIf) nested.push(s);
    else if (s.seq === "parallel") parallel.push(s);
    else sequential.push(s);
  }
  return { sequential, parallel, nested };
}

/**
 * A step stays in the rail if the unit has any tasks in it.
 * Role never drops the chapter — empty-for-this-login becomes a handoff.
 */
export function classifyStep(
  step: Step,
  role: Role,
  tenancyTypeOrUnit: string | Unit,
  terminal?: string,
  _showFull?: boolean,
): ClassifiedStep | null {
  const unit = resolveUnit(tenancyTypeOrUnit, terminal);
  const subs = step.subSteps.filter((s) => tagAppliesToUnit(s.tag, unit));
  if (subs.length === 0) return null;
  const { mine, others } = partitionGuide(subs, role);
  const flow: ClassifiedSub[] = subs.map((s) => ({
    ...s,
    mine: isMyAction(role, s.audience),
  }));
  return { step, mine, others, flow, kind: mine.length ? "yours" : "also" };
}

export function classifyStage(
  stage: Stage,
  role: Role,
  tenancyTypeOrUnit: string | Unit,
  terminal?: string,
  _showFull?: boolean,
) {
  const unit = resolveUnit(tenancyTypeOrUnit, terminal);
  const steps: ClassifiedStep[] = [];
  for (const step of stage.steps) {
    const c = classifyStep(step, role, unit);
    if (c) steps.push(c);
  }
  // Same skeleton for every login: every unit-applicable step is a chapter.
  return { yours: steps, also: [] as ClassifiedStep[], steps };
}

export function countYourSteps(
  phase: Phase,
  role: Role,
  tenancyTypeOrUnit: string | Unit,
  terminal?: string,
  _showFull?: boolean,
) {
  return phase.stages.reduce((n, stage) => {
    const { yours } = classifyStage(stage, role, tenancyTypeOrUnit, terminal);
    return n + yours.length;
  }, 0);
}

export function phasesForUnit(unit: Unit, phases: Phase[] = PHASES): Phase[] {
  const profile = unitProfile(unit);
  return phases.filter((phase) => {
    if (phase.id === "exit" && !profile.outgoing) return false;
    return phase.stages.some((stage) => classifyStage(stage, "officer", unit).steps.length > 0);
  });
}

export function alsoLine(c: ClassifiedStep, role: Role) {
  const fromOthers = c.others[0];
  if (fromOthers) return displayText(fromOthers, false);
  const fromMine = c.mine[0];
  if (fromMine) return displayText(fromMine, true);
  return stepWhat(c.step, role);
}

export function primarySystemLink(step: Step, subs: SubStep[]) {
  if (!step.systems?.length) return null;
  const blob = subs.map((s) => s.text.toLowerCase()).join(" ");
  const preferred = ["OneCalendar", "TOPAZ", "Lease Management System", "WebEpic"];
  for (const label of preferred) {
    const hit = step.systems.find((s) => s.label === label);
    if (hit && blob.includes(label.toLowerCase())) return hit;
  }
  const named = step.systems.find((s) => blob.includes(s.label.toLowerCase()));
  return named ?? null;
}

/** Library docs to surface on each Process guide step (by step name). */
const STEP_DOC_IDS: Record<string, string[]> = {
  "Kickoff Documents Gathered & Shared": [
    "doc-provision",
    "doc-me",
    "doc-renovation",
    "doc-fire",
    "doc-elec",
  ],
  "High-Level Design Review": ["doc-design"],
  "Requirements & Plan Alignment": [
    "doc-renovation",
    "doc-fire",
    "doc-provision",
    "doc-me",
  ],
  "Onboarding Guidelines Shared": [
    "doc-renovation",
    "doc-jsi",
    "doc-fire",
    "doc-design",
    "doc-sfa",
  ],
  "Confirmation of Renovation Plans": ["doc-design", "doc-hoarding"],
  "Permit Selection & Document Preparation": [
    "doc-method",
    "doc-hoarding",
    "doc-fire",
    "doc-elec",
  ],
  "Joint Site Inspection": ["doc-jsi", "doc-fire"],
  "Supporting Document Submission": [
    "doc-method",
    "doc-hoarding",
    "doc-fire",
  ],
  "Multi-Party Review by CAG Stakeholders": ["doc-fire", "doc-method"],
  "Fire Safety Authority Assessment": ["doc-fire"],
  "Site Handover & Sign-Off": ["doc-handover", "doc-provision", "doc-me"],
  "IFM Pre-Renovation Briefing": ["doc-renovation", "doc-fire"],
  "Pre-Renovation Works": ["doc-hoarding", "doc-method"],
  "Renovation Works": ["doc-method", "doc-fire", "doc-elec", "doc-renovation"],
  "Pre-Opening Checks & Certifications": ["doc-poi", "doc-cof", "doc-sfa"],
  "Opening Document Submission": ["doc-cof", "doc-sfa", "doc-poi"],
  "TOPAZ Account Setup": ["doc-topaz"],
  "Regular Servicing Reporting": ["doc-topaz", "doc-cof"],
  "Staff Fire Safety Declaration": ["doc-fire", "doc-cof"],
  "Unit Documents Gathered & Shared": ["doc-provision", "doc-me", "doc-renovation"],
  "Reinstatement Requirements Alignment": ["doc-renovation", "doc-me"],
  "Reinstatement Permit Submission": ["doc-method", "doc-hoarding", "doc-fire"],
  "Reinstatement Multi-Party Review": ["doc-method", "doc-fire"],
  "Pre-Reinstatement Works": ["doc-hoarding"],
  "Pre-Takeover Inspection": ["doc-takeover", "doc-poi"],
  "Takeover Meeting": ["doc-takeover"],
};

/** Resolve sample / reference docs for a guide step, filtered to the active unit. */
export function docsForStep(
  stepName: string,
  tenancyType: string,
  terminal: string,
  zone: string = "Airside",
): DocItem[] {
  const ids = STEP_DOC_IDS[stepName];
  if (!ids?.length) return [];
  return ids
    .map((id) => DOCUMENTS.find((d) => d.id === id))
    .filter((d): d is DocItem => Boolean(d))
    .filter(
      (d) =>
        d.zone.includes(zone as DocItem["zone"][number]) &&
        d.terminal.includes(terminal as DocItem["terminal"][number]) &&
        d.tenancyType.includes(tenancyType as DocItem["tenancyType"][number]),
    );
}
