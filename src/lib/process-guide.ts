import type {
  Audience,
  AudienceRole,
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

/**
 * Lines this login should follow on the card.
 * If they have no actions, use wait/receive notes written for them
 * (`alsoText`) — never another actor’s how-to.
 */
export function notesYouFollow(
  mine: SubStep[],
  others: SubStep[],
  role: Role,
): SubStep[] {
  if (mine.length > 0) return mine;
  const notes: SubStep[] = [];
  const seen = new Set<string>();
  for (const s of others) {
    const note = s.alsoText?.[role];
    if (!note || seen.has(note)) continue;
    seen.add(note);
    notes.push({ ...s, text: note, audience: role });
  }
  return notes;
}

/** Handoff copy for this reader — never another role’s “you”. */
export function handoffText(sub: SubStep, role?: Role): string | undefined {
  if (!sub.alsoText || !role) return undefined;
  return sub.alsoText[role];
}

function isOfficerOnly(audience: Audience): boolean {
  return audience === "officer";
}

function copyMisaddressesReader(text: string, role: Role): boolean {
  const t = text.toLowerCase();
  if (role === "contractor" && (/\byour contractor\b/.test(t) || t.includes("you can follow along"))) {
    return true;
  }
  if (role === "tenant" && /\byour tenant\b/.test(t)) return true;
  return false;
}

function audienceRoles(audience: Audience): AudienceRole[] {
  if (audience === "shared") return [];
  return Array.isArray(audience) ? audience : [audience];
}

/** PO reading someone else’s task — never that actor’s “you” instructions. */
function officerAlsoHappeningLine(sub: SubStep): string {
  if (sub.audience === "shared") return sub.text;
  if (sub.alsoText?.officer) return sub.alsoText.officer;
  const actors = audienceRoles(sub.audience);
  const t = sub.alsoText;
  if (t) {
    if (actors.includes("contractor") && t.tenant) return t.tenant;
    if (actors.includes("tenant") && t.contractor) return t.contractor;
    return t.tenant ?? t.contractor ?? sub.text;
  }
  return sub.text;
}

/** Wait/receive line for this reader. Null = omit — copy would address the wrong login. */
export function alsoHappeningText(sub: SubStep, role: Role): string | null {
  if (role === "officer") return officerAlsoHappeningLine(sub);
  const handoff = handoffText(sub, role);
  if (handoff) return handoff;
  // PO-only how-to (sourcing, internal ops) stays in the PO view.
  if (isOfficerOnly(sub.audience)) return null;
  if (copyMisaddressesReader(sub.text, role)) return null;
  return sub.text;
}

export function visibleAlsoSubs(subs: SubStep[], role: Role): SubStep[] {
  if (role === "officer") return subs;
  return subs.filter((s) => alsoHappeningText(s, role) != null);
}

export function displayText(sub: SubStep, mine: boolean, role?: Role) {
  if (mine) return sub.text;
  if (!role) return sub.text;
  return alsoHappeningText(sub, role) ?? sub.text;
}

const NOT_A_SYSTEM = new Set([
  "hard disk",
  "physical board",
  "walk-in",
  "meeting",
  "whatsapp",
  "teams",
  "excel",
]);

/** CAG-internal tools. Tenant and contractor never see these chips. */
export const CAG_INTERNAL_SYSTEMS = new Set([
  "onedrive",
  "newforma",
  "sharepoint",
  "hard disk",
  "customer discovery insights",
  "key management system",
  "procurement",
  "tenant directory taxonomy",
]);

export function systemsVisibleToRole(
  systems: { label: string }[] | undefined,
  role: Role,
): { label: string }[] {
  const cleaned = (systems ?? []).filter(
    (s) => !NOT_A_SYSTEM.has(s.label.toLowerCase()),
  );
  if (role === "officer") return cleaned;
  return cleaned.filter((s) => !CAG_INTERNAL_SYSTEMS.has(s.label.toLowerCase()));
}

const PERSON_FOR_ROLE: Record<AudienceRole, string> = {
  tenant: "Tenant",
  contractor: "Contractor",
  officer: "Project Officer",
};

/** People chips that belong on this task line (login roles only). */
export function peopleForSubStep(sub: SubStep, people: string[]): string[] {
  if (sub.audience === "shared") return [];
  const roles = Array.isArray(sub.audience) ? sub.audience : [sub.audience];
  const wanted = new Set(roles.map((r) => PERSON_FOR_ROLE[r]));
  return people.filter((p) => wanted.has(p));
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
 * `hideFrom` drops tenancy / ops chapters this login does not do.
 */
export function classifyStep(
  step: Step,
  role: Role,
  tenancyTypeOrUnit: string | Unit,
  terminal?: string,
  _showFull?: boolean,
): ClassifiedStep | null {
  if (step.hideFrom?.includes(role)) return null;
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
  return phases.filter((phase) =>
    phase.stages.some((stage) => classifyStage(stage, "officer", unit).steps.length > 0),
  );
}

export function alsoLine(c: ClassifiedStep, role: Role) {
  const fromOthers = visibleAlsoSubs(c.others, role)[0];
  if (fromOthers) return displayText(fromOthers, false, role);
  const fromMine = c.mine[0];
  if (fromMine) return displayText(fromMine, true, role);
  return stepWhat(c.step, role);
}

export function primarySystemLink(step: Step, subs: SubStep[], role: Role = "officer") {
  const systems = systemsVisibleToRole(step.systems, role);
  if (!systems.length) return null;
  const blob = subs.map((s) => s.text.toLowerCase()).join(" ");
  const preferred = ["OneCalendar", "TOPAZ", "Lease Management System", "WebEpic"];
  for (const label of preferred) {
    const hit = systems.find((s) => s.label === label);
    if (hit && blob.includes(label.toLowerCase())) return hit;
  }
  const named = systems.find((s) => blob.includes(s.label.toLowerCase()));
  return named ?? null;
}

/**
 * CAG unit drawings and the provision list are not in the portal.
 * Project Officers email them (drawings after division reps pull from Newforma;
 * provision list from Airport Planning).
 * Fire Safety Requirements is a section inside Renovation Requirements, not its own file.
 */
const NOT_IN_PORTAL = new Set(["doc-me", "doc-fire", "doc-provision"]);

/** Library docs to surface on each Process guide step (by step name). */
const STEP_DOC_IDS: Record<string, string[]> = {
  "Kickoff Documents Gathered & Shared": [
    "doc-provision",
    "doc-renovation",
    "doc-elec",
  ],
  "High-Level Design Review": ["doc-design"],
  "Requirements & Plan Alignment": [
    "doc-renovation",
    "doc-provision",
  ],
  "Onboarding Guidelines Shared": [
    "doc-renovation",
    "doc-design",
  ],
  "Confirmation of Renovation Plans": ["doc-design", "doc-hoarding"],
  "Permit Advisory & Tenancy Project Selection": [
    "doc-renovation",
    "doc-method",
    "doc-hoarding",
    "doc-elec",
  ],
  "Joint Site Inspection": ["doc-jsi", "doc-renovation"],
  "Submit Combined Permit To Work Application": [
    "doc-renovation",
    "doc-method",
    "doc-hoarding",
  ],
  "Multi-Party Review by Changi Airport Group Stakeholders": [
    "doc-renovation",
    "doc-method",
  ],
  "Site Walkthrough, Technical Verification & Handover Sign Off": [
    "doc-handover",
    "doc-provision",
  ],
  "Integrated Facilities Management Pre-Renovation Briefing": [
    "doc-renovation",
  ],
  "Airport Passes & Hoarding Installation": ["doc-hoarding", "doc-method"],
  "Renovation Works & Site Monitoring": ["doc-method", "doc-elec", "doc-renovation"],
  "Pre-Opening Inspection": ["doc-poi", "doc-cof", "doc-sfa"],
  "Opening Document Submission": ["doc-cof", "doc-sfa", "doc-poi"],
  "Opening::TOPAZ Account Setup": ["doc-topaz"],
  "Regular Servicing Reporting": ["doc-topaz", "doc-cof"],
  "Annual Fire Safety Declaration & Training": ["doc-renovation", "doc-cof"],
  "Unit Documents Gathered & Shared": ["doc-provision", "doc-renovation"],
  "Reinstatement::Reinstatement Requirements & Plan Alignment": ["doc-renovation"],
  "Reinstatement Permit Submission via OneCalendar": [
    "doc-renovation",
    "doc-method",
    "doc-hoarding",
  ],
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
  stageName?: string,
): DocItem[] {
  const ids =
    (stageName && STEP_DOC_IDS[`${stageName}::${stepName}`]) ||
    STEP_DOC_IDS[stepName];
  if (!ids?.length) return [];
  return ids
    .map((id) => DOCUMENTS.find((d) => d.id === id))
    .filter((d): d is DocItem => Boolean(d))
    .filter((d) => !NOT_IN_PORTAL.has(d.id))
    .filter(
      (d) =>
        d.zone.includes(zone as DocItem["zone"][number]) &&
        d.terminal.includes(terminal as DocItem["terminal"][number]) &&
        d.tenancyType.includes(tenancyType as DocItem["tenancyType"][number]),
    );
}

/** Portal files by id, filtered to the active unit. */
export function docsByIds(
  ids: string[],
  tenancyType: string,
  terminal: string,
  zone: string = "Airside",
): DocItem[] {
  if (!ids.length) return [];
  return ids
    .map((id) => DOCUMENTS.find((d) => d.id === id))
    .filter((d): d is DocItem => Boolean(d))
    .filter((d) => !NOT_IN_PORTAL.has(d.id))
    .filter(
      (d) =>
        d.zone.includes(zone as DocItem["zone"][number]) &&
        d.terminal.includes(terminal as DocItem["terminal"][number]) &&
        d.tenancyType.includes(tenancyType as DocItem["tenancyType"][number]),
    );
}
