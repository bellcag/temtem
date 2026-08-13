import type {
  Audience,
  DocItem,
  Phase,
  Stage,
  Step,
  SubStep,
} from "@/lib/tenancy-data";
import { DOCUMENTS } from "@/lib/tenancy-data";
import type { Role } from "@/lib/app-state";

export function audienceForRole(role: Role, audience: Audience): boolean {
  if (role === "officer") return true;
  if (audience === "shared") return true;
  if (Array.isArray(audience)) return audience.includes(role);
  if (role === "tenant") return audience === "tenant";
  if (role === "contractor") return audience === "contractor";
  return false;
}

export function tagApplies(
  tag: string | undefined,
  tenancyType: string,
  terminal: string,
  showFull: boolean,
) {
  if (!tag) return true;
  if (showFull) return true;
  const t = tag.toLowerCase();
  if (t.includes("retail") && t.includes("f&b")) return true;
  if (t.includes("f&b") && !t.includes("retail") && tenancyType !== "F&B")
    return false;
  if (t.includes("retail") && !t.includes("f&b") && tenancyType !== "Retail")
    return false;
  if (t.includes("need gas") && tenancyType !== "F&B") return false;
  if (t.includes("t3 only") && terminal !== "T3") return false;
  if (t.includes("t4 only") && terminal !== "T4") return false;
  if (t.includes("t1 / t3") && terminal !== "T1" && terminal !== "T3")
    return false;
  if (t.includes("t2 / t4") && terminal !== "T2" && terminal !== "T4")
    return false;
  if (t.includes("landside")) return false;
  if (t.includes("duplex")) return false;
  if (t.includes("closed-door")) return false;
  if (t.includes("event space")) return false;
  return true;
}

export function filterSubSteps(
  step: Step,
  role: Role,
  tenancyType: string,
  terminal: string,
  showFull: boolean,
): SubStep[] {
  return step.subSteps.filter((s) => {
    if (!audienceForRole(role, s.audience)) return false;
    return tagApplies(s.tag, tenancyType, terminal, showFull);
  });
}

export function stepWhat(step: Step, role: Role) {
  return step.whatFor?.[role] ?? step.what;
}

/** Concrete action for the signed-in role (not dual-visible context). */
export function isMyAction(role: Role, audience: Audience): boolean {
  if (audience === role) return true;
  if (Array.isArray(audience)) {
    if (role === "officer") return audience.includes("officer");
    return audience.includes(role) && !audience.includes("officer");
  }
  return false;
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

export type ClassifiedStep = {
  step: Step;
  mine: SubStep[];
  others: SubStep[];
  kind: "yours" | "also";
};

export function classifyStep(
  step: Step,
  role: Role,
  tenancyType: string,
  terminal: string,
  showFull: boolean,
): ClassifiedStep | null {
  const subs = filterSubSteps(step, role, tenancyType, terminal, showFull);
  if (subs.length === 0) return null;
  const { mine, others } = partitionGuide(subs, role);
  if (mine.length > 0) return { step, mine, others, kind: "yours" };
  return { step, mine, others, kind: "also" };
}

export function classifyStage(
  stage: Stage,
  role: Role,
  tenancyType: string,
  terminal: string,
  showFull: boolean,
) {
  const yours: ClassifiedStep[] = [];
  const also: ClassifiedStep[] = [];
  for (const step of stage.steps) {
    const c = classifyStep(step, role, tenancyType, terminal, showFull);
    if (!c) continue;
    if (c.kind === "yours") yours.push(c);
    else also.push(c);
  }
  return { yours, also };
}

export function countYourSteps(
  phase: Phase,
  role: Role,
  tenancyType: string,
  terminal: string,
  showFull: boolean,
) {
  return phase.stages.reduce((n, stage) => {
    const { yours } = classifyStage(stage, role, tenancyType, terminal, showFull);
    return n + yours.length;
  }, 0);
}

export function alsoLine(c: ClassifiedStep, role: Role) {
  const fromOthers = c.others[0]?.text;
  if (fromOthers) return fromOthers;
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
