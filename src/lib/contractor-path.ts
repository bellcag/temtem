import {
  JOURNEY_CARDS,
  isListed,
  type JourneyRule,
  type PhaseId,
} from "@/lib/journey-cards";
import { splitListed } from "@/lib/journey-voice";

export type ContractorLink = { label: string };

export type ContractorPathStep = {
  id: number;
  phase: PhaseId;
  stage: string;
  title: string;
  when: string;
  what: string;
  how: string;
  needs: string[];
  links: ContractorLink[];
  done: string;
  wait?: boolean;
  onlyIf: string[];
  rules: JourneyRule[];
  source: number[];
};

function card(n: number) {
  return JOURNEY_CARDS.find((c) => c.n === n);
}

function mergeRules(ns: number[]) {
  const seen = new Set<string>();
  const rules: JourneyRule[] = [];
  for (const n of ns) {
    const c = card(n);
    if (!c) continue;
    for (const r of c.rules) {
      const k = `${r.rank}:${r.line}`;
      if (seen.has(k)) continue;
      seen.add(k);
      rules.push(r);
    }
  }
  return rules;
}

function needsFrom(ns: number[]) {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const n of ns) {
    const c = card(n);
    if (!c) continue;
    for (const item of splitListed(c.input)) {
      if (seen.has(item)) continue;
      seen.add(item);
      out.push(item);
    }
  }
  return out;
}

function outputsFrom(ns: number[]) {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const n of ns) {
    const c = card(n);
    if (!c || !isListed(c.output)) continue;
    const t = c.output?.trim();
    if (!t) continue;
    if (seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

function onlyIfFrom(ns: number[]) {
  return mergeRules(ns)
    .filter((r) => r.rank === "only-if")
    .map((r) => r.line);
}

function isTenantTakeoverNoise(line: string) {
  const t = line.toLowerCase();
  return (
    t.includes("incoming tenant takes over") ||
    t.includes("exiting tenant")
  );
}

function eligibilityFrom(ns: number[]) {
  const lines: string[] = [];
  for (const n of ns) {
    const c = card(n);
    if (!c) continue;
    const bits = [
      c.unitType,
      c.area,
      c.workScope,
      c.unitFeatures,
      c.tenantType,
    ].filter(isListed);
    if (bits.length) {
      const line = bits.join("; ");
      if (!isTenantTakeoverNoise(line)) lines.push(line);
    }
  }
  return lines;
}

function doneLine(ns: number[], fallback: string) {
  const outs = outputsFrom(ns);
  if (!outs.length) return fallback;
  const short = outs.filter((o) => o.split(/\s+/).length <= 8);
  if (short.length) return `You'll get ${short.join("; ")}.`;
  return outs.join(" ");
}

function step(
  partial: Omit<ContractorPathStep, "rules" | "onlyIf" | "needs"> & {
    needs?: string[];
    extraOnlyIf?: string[];
    skipEligibility?: boolean;
  },
): ContractorPathStep {
  const rules = mergeRules(partial.source);
  const onlyIf = [
    ...onlyIfFrom(partial.source),
    ...(partial.skipEligibility ? [] : eligibilityFrom(partial.source)),
    ...(partial.extraOnlyIf ?? []),
  ];
  return {
    ...partial,
    needs: partial.needs ?? needsFrom(partial.source),
    onlyIf,
    rules,
  };
}

export const CONTRACTOR_PATH: ContractorPathStep[] = [
  step({
    id: 1,
    phase: "Setup",
    stage: "Get onto the tenancy platform",
    title: "Get OneCalendar access",
    when: "This happens first, before you can apply for permits.",
    what: "You'll create your OneCalendar account, then apply for terminal access and unit access.",
    how: "Do this in OneCalendar. If loading-bay access is required, also create an Access Control & Scheduling System account.",
    needs: [
      "Contractor Details",
      "Terminal Access Details",
      "Unit Access Details",
      "Tenant, Unit, Contractor Details — Only if loading-bay access is required",
    ],
    links: [
      { label: "Open OneCalendar" },
      { label: "Open Access Control & Scheduling System" },
    ],
    done: doneLine(
      [2, 3, 5],
      "Your OneCalendar account and access applications are in.",
    ),
    extraOnlyIf: [
      "Only if loading-bay access is required: create an Access Control & Scheduling System account.",
    ],
    source: [2, 3, 5, 44],
  }),
  {
    id: 2,
    phase: "Setup",
    stage: "Get onto the tenancy platform",
    title: "Wait for the tenant to approve unit access",
    when: "This happens after you apply for unit access in OneCalendar.",
    what: "You don't have an action here. The tenant approves unit access in OneCalendar.",
    how: "There's nothing for you to open on this step.",
    needs: [],
    links: [],
    done: "Unit access is approved. You can enter the unit.",
    wait: true,
    onlyIf: [],
    rules: [],
    source: [],
  },
  step({
    id: 3,
    phase: "Setup",
    stage: "Apply for permits",
    title: "Start the Tenancy Project in OneCalendar",
    when: "This happens after unit access is approved, before you fill the permits that apply.",
    what: "You'll select the Tenancy Project work type from the planned works, then fill in the project details. Airport-specific risks apply for this work (for example work near a skytrain track or baggage handling system). Get a CAG renovation permit in OneCalendar before work starts.",
    how: "Do this in OneCalendar.",
    needs: [
      "Selection of Tenancy Project work type",
      "Project Title",
      "Scope of Work (Public / Maintenance)",
      "Description",
      "Tenant Area",
      "Work at Skytrain Height",
      "Applicant Name",
      "Site Supervisor",
      "Letter of Indemnity",
      "Optional: Architectural drawings, Method of statement, Risk Assessment, Schedule Timeline, Mechanical Drawings, Electrical Drawings, Heat Load Calculation, BIM, Letter of No Objection, Hoarding Support and Design",
    ],
    links: [{ label: "Open OneCalendar" }],
    done: "The Tenancy Project is started. OneCalendar shows the permit types that apply.",
    source: [65, 66],
  }),
  step({
    id: 4,
    phase: "Setup",
    stage: "Apply for permits",
    title: "Fill the permits that apply, then submit as 1 Permit To Work",
    when: "This happens after you start the Tenancy Project. Apply at least two weeks before work starts.",
    what: "You'll fill only the permits that apply to this job, then submit them as 1 Permit To Work.",
    how: "Do this in OneCalendar.",
    needs: [
      "Renovation (Terminal)",
      "Ceiling — Only if work is above the ceiling outside the tenanted premises",
      "Fire Alarm Isolation — Only if fire alarm isolation or sprinkler draining is required",
      "Hotwork — Only if cutting, welding, grinding, or other work that makes heat or sparks",
      "Archi Changes, Authority Submission and Approvals",
      "MEP Changes",
      "Structured Cabling (T3 Tenant Telephone lines) — Only if T3 tenant telephone",
      "Structured Cabling Indoor/Outdoor",
      "Telco Cabling",
      "Catwalk Access — Terminal 4 only",
      "Renovation (Terminal - Additional)",
      "Letter of Indemnity, Method of Statement, and Risk Assessment where that permit asks for them",
    ],
    links: [
      { label: "Open OneCalendar" },
      { label: "Submit PTW in OneCalendar" },
    ],
    done: doneLine([81], "The permits are submitted as 1 Permit To Work."),
    extraOnlyIf: [
      "Only if work is above the ceiling outside the tenanted premises: submit a Ceiling permit.",
      "Only if cutting, welding, grinding, or other work that makes heat or sparks: submit a Hotwork Permit.",
      "Only if T3 tenant telephone lines: submit Structured Cabling (T3 Tenant Telephone lines).",
      "Only if Terminal 4 catwalk access: submit a Catwalk Access permit.",
      "Only if work is on or within 6 m of the Skytrain guideway, in a Skytrain car, or uses cranes, excavators, scaffolds, or heavy equipment within 6 m of the guideway: apply for a Skytrain PTW.",
    ],
    skipEligibility: true,
    source: [67, 68, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81],
  }),
  step({
    id: 5,
    phase: "Setup",
    stage: "Apply for permits",
    title: "Book a joint site inspection with BMC",
    when: "This happens when the work needs a joint site inspection with the Building Maintenance Contractor.",
    what: "You'll book a Joint Site Inspection slot with the Building Maintenance Contractor.",
    how: "Terminal 1 and Terminal 3: book by web link or QR. Terminal 2 and Terminal 4: walk in.",
    needs: [
      "Preferred Joint Site Inspection date and time",
      "Terminal 1: Web link / QR booking",
      "Terminal 3: Web link / QR booking",
      "Terminal 2: Walk-in",
      "Terminal 4: Walk-in",
    ],
    links: [
      { label: "Open T1 booking" },
      { label: "Open T3 booking" },
    ],
    done: doneLine(
      [69],
      "The Joint Site Inspection slot is booked with the Building Maintenance Contractor.",
    ),
    source: [69],
  }),
  step({
    id: 6,
    phase: "Setup",
    stage: "Apply for permits",
    title: "Identify fire isolation on site with BMC",
    when: "This happens at the joint site inspection, on site with the Building Maintenance Contractor.",
    what: "You'll identify the fire alarm isolation and fire protection system required for the works with the Building Maintenance Contractor.",
    how: "Do this at the physical site. You'll use the Building Management System.",
    links: [],
    done: doneLine(
      [70],
      "Fire isolation needs are identified with the Building Maintenance Contractor.",
    ),
    source: [70],
  }),
  step({
    id: 7,
    phase: "Setup",
    stage: "Apply for permits",
    title: "Email the Qualified Person letter of undertaking",
    when: "This can happen alongside the permit pack. Only if you want to start before statutory approvals.",
    what: "You'll email the Qualified Person Endorsed Letter of Undertaking to the Project Officer.",
    how: "Do this in Email. You'll use OneCalendar.",
    links: [],
    done: doneLine([82], "The letter of undertaking is with the Project Officer."),
    source: [82],
  }),
  step({
    id: 8,
    phase: "Setup",
    stage: "Apply for permits",
    title: "Revise and resubmit if CAG asks",
    when: "This happens if BMC, AES, or IFM rejects the pack or asks you to refile.",
    what: "If BMC, AES, or IFM asks you to refile, you'll revise the documents and resubmit in OneCalendar.",
    how: "Do this in OneCalendar.",
    links: [{ label: "Open OneCalendar" }],
    done: doneLine([87, 90, 93], "The revised submissions are in."),
    source: [87, 90, 93],
  }),
  step({
    id: 9,
    phase: "Setup",
    stage: "Apply for permits",
    title: "Submit permissions that sit outside OneCalendar",
    when: "This can happen alongside the OneCalendar permit pack, when IFM needs a request that is not in OneCalendar.",
    what: "You'll upload and submit requests or permissions outside OneCalendar to Integrated Facilities Management.",
    how: "Do this in Email.",
    links: [],
    done: doneLine([96], "The IFM request is in."),
    source: [96],
  }),
  step({
    id: 10,
    phase: "Build",
    stage: "Apply for permits",
    title: "Engage a Qualified Person or Professional Engineer",
    when: "This happens when the proposed works need a fire-safety assessment.",
    what: "You'll engage a Qualified Person or Professional Engineer to assess whether the works need a Fire Safety Certificate, Minor Addition & Alteration, or Temporary Fire Permit.",
    how: "Do this at the physical site.",
    links: [],
    done: doneLine(
      [83],
      "The QP or PE assessment is done.",
    ),
    source: [83],
  }),
  step({
    id: 11,
    phase: "Build",
    stage: "Carry out renovation",
    title: "Get airport passes for the work team",
    when: "This happens before the team enters the airport to work.",
    what: "You'll obtain airport passes for the work team.",
    how: "Do this in Airport Pass In Changi.",
    links: [{ label: "Open Airport Pass In Changi" }],
    done: doneLine([105], "The work team has airport access."),
    source: [105],
  }),
  step({
    id: 12,
    phase: "Build",
    stage: "Carry out renovation",
    title: "Install hoarding",
    when: "This happens before actual work starts. Keep all work inside the hoarded area.",
    what: "You'll install hoarding.",
    how: "Do this at the physical unit. Use non-combustible hoarding material (gypsum board). Make hoarding doors sliding, or make them open inward.",
    links: [],
    done: doneLine([106], "Hoarding is installed."),
    source: [106],
  }),
  step({
    id: 13,
    phase: "Build",
    stage: "Carry out renovation",
    title: "Request temporary power",
    when: "This happens when the unit lacks a permanent meter, before works that need temporary supply.",
    what: "You'll request temporary power from Integrated Facilities Management.",
    how: "Do this in OneCalendar.",
    links: [{ label: "Open OneCalendar" }],
    done: doneLine([107], "The temporary power request is in."),
    source: [107],
  }),
  step({
    id: 14,
    phase: "Build",
    stage: "Carry out renovation",
    title: "Submit the FSSD Notice of Approval",
    when: "This happens for fire protection or fire detection addition or alteration works.",
    what: "You'll submit the Fire Safety & Shelter Department Notice of Approval in OneCalendar.",
    how: "Do this in OneCalendar.",
    links: [{ label: "Open OneCalendar" }],
    done: "The Notice of Approval is in OneCalendar.",
    source: [109],
  }),
  step({
    id: 15,
    phase: "Build",
    stage: "Carry out renovation",
    title: "Do the renovation works",
    when: "This happens after CAG has issued the Work Permit. If fire protection or detection on site could set off an alarm, also wait for an approved AES isolation permit.",
    what: "You'll perform the renovation works for the tenant, in line with the approved drawings.",
    how: "Do this at the physical unit.",
    links: [],
    done: doneLine([110], "The unit is renovated."),
    source: [110],
  }),
  step({
    id: 16,
    phase: "Build",
    stage: "Carry out renovation",
    title: "Submit the aircon balancing test report",
    when: "This happens after internal air-con balancing, before the concession opens.",
    what: "You'll submit the aircon balancing test report.",
    how: "Do this in OneCalendar.",
    links: [{ label: "Open OneCalendar" }],
    done: doneLine([122], "The aircon balancing test report is in."),
    source: [122],
  }),
  step({
    id: 17,
    phase: "Build",
    stage: "Carry out renovation",
    title: "Upload as-built drawings",
    when: "As-built drawings go in within three weeks of renovation completion.",
    what: "You'll upload as-built drawings into OneCalendar.",
    how: "Do this in OneCalendar.",
    links: [{ label: "Open OneCalendar" }],
    done: doneLine([126], "The as-built drawings are in OneCalendar."),
    source: [126],
  }),
  step({
    id: 18,
    phase: "Build",
    stage: "Carry out renovation",
    title: "Rectify defects",
    when: "This happens when there are inspection comments.",
    what: "You'll rectify defects for stakeholders.",
    how: "Do this at the physical unit.",
    links: [],
    done: doneLine([127], "Defects are rectified."),
    source: [127],
  }),
  step({
    id: 19,
    phase: "Exit",
    stage: "Reinstate the unit",
    title: "Submit the reinstatement Permit to Work",
    when: "This happens when reinstatement works are required.",
    what: "You'll submit the reinstatement Permit to Work in OneCalendar.",
    how: "Do this in OneCalendar.",
    links: [{ label: "Open OneCalendar" }],
    done: doneLine(
      [186],
      "The reinstatement Permit to Work application is in.",
    ),
    extraOnlyIf: ["Outgoing Tenant"],
    source: [186],
  }),
  step({
    id: 20,
    phase: "Exit",
    stage: "Reinstate the unit",
    title: "Install hoarding before reinstatement works",
    when: "This happens after the reinstatement Permit to Work, before reinstatement works start.",
    what: "You'll install hoarding before reinstatement works.",
    how: "Do this at the physical unit. Use non-combustible hoarding material (gypsum board).",
    links: [],
    done: doneLine([195], "Hoarding is installed."),
    extraOnlyIf: ["Outgoing Tenant"],
    source: [195],
  }),
  step({
    id: 21,
    phase: "Exit",
    stage: "Reinstate the unit",
    title: "Do the reinstatement works",
    when: "This happens after hoarding is up and the reinstatement Permit to Work is in hand.",
    what: "You'll conduct the reinstatement works.",
    how: "Do this at the physical unit.",
    links: [],
    done: doneLine([196], "The unit is reinstated."),
    extraOnlyIf: ["Outgoing Tenant"],
    source: [196],
  }),
];

export function contractorStepsInPhase(phase: PhaseId) {
  return CONTRACTOR_PATH.filter((s) => s.phase === phase);
}

export function contractorPathTotal() {
  return CONTRACTOR_PATH.length;
}
