import {
  JOURNEY_CARDS,
  isListed,
  type JourneyRule,
  type PhaseId,
} from "@/lib/journey-cards";
import { splitListed } from "@/lib/journey-voice";

export type TenantLink = { label: string };

export type TenantPathStep = {
  id: number;
  phase: PhaseId;
  stage: string;
  title: string;
  when: string;
  what: string;
  how: string;
  needs: string[];
  links: TenantLink[];
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
    const t = c.output.trim();
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
    if (bits.length) lines.push(bits.join("; "));
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

function step(partial: Omit<TenantPathStep, "rules" | "onlyIf" | "needs"> & {
  needs?: string[];
  extraOnlyIf?: string[];
}): TenantPathStep {
  const rules = mergeRules(partial.source);
  const onlyIf = [
    ...onlyIfFrom(partial.source),
    ...eligibilityFrom(partial.source),
    ...(partial.extraOnlyIf ?? []),
  ];
  return {
    ...partial,
    needs: partial.needs ?? needsFrom(partial.source),
    onlyIf,
    rules,
  };
}

export const TENANT_PATH: TenantPathStep[] = [
  step({
    id: 1,
    phase: "Setup",
    stage: "Get onto the tenancy platform",
    title: "Approve contractor unit access",
    when: "This happens after the contractor applies in OneCalendar.",
    what: "You'll approve contractor unit access in OneCalendar.",
    how: "Do this in OneCalendar.",
    links: [{ label: "Open OneCalendar" }],
    done: doneLine([6], "Unit access is approved."),
    source: [6],
  }),
  step({
    id: 2,
    phase: "Setup",
    stage: "Get onto the tenancy platform",
    title: "Register staff for QSM training",
    when: "This can happen alongside other setup steps.",
    what: "You'll register staff for Quality Service Management training.",
    how: "Do this in ONE Changi App.",
    links: [{ label: "Open ONE Changi App" }],
    done: doneLine([7], "Staff are registered for training."),
    extraOnlyIf: ["area or location: Facing Travelling Pax"],
    source: [7],
  }),
  step({
    id: 3,
    phase: "Setup",
    stage: "Get onto the tenancy platform",
    title: "Apply for your WebEpic account",
    when: "This can happen alongside other setup steps.",
    what: "You'll apply for a WebEpic account on WebEpic.",
    how: "Do this in WebEpic.",
    links: [
      { label: "Download WebEpic Account Creation Form" },
      { label: "Open WebEpic" },
    ],
    done: doneLine([9], "Your WebEpic account application is in."),
    source: [9],
  }),
  step({
    id: 4,
    phase: "Setup",
    stage: "Hold the kick-off",
    title: "Attend kick-off: present your plan and measure the unit",
    when: "This happens at the project kick-off meeting arranged by the CAG Project Officer.",
    what: "You'll present renovation intentions and do site measurements for renovation planning.",
    how: "Do this at the physical meeting.",
    links: [],
    done: doneLine(
      [28, 32],
      "You'll have renovation requirements, work permit requirements, and site measurement notes.",
    ),
    source: [28, 32],
  }),
  step({
    id: 5,
    phase: "Setup",
    stage: "Review the design",
    title: "Submit your design pack",
    when: "This happens after kick-off, before works start.",
    what: "You'll submit coloured perspectives, architectural plans, elevation plans, ceiling layout, signage drawings, and the hoarding plan.",
    how: "Do this in Email, Google Drive. Architectural layout also goes into OneCalendar where that rule already says so.",
    needs: [
      "Coloured Design Perspectives",
      "Architectural Plans",
      "Elevation Plans",
      "Ceiling Layout Plan",
      "Signage Drawings",
      "Hoarding Plan",
    ],
    links: [
      { label: "Open OneCalendar" },
      { label: "Open Google Drive" },
    ],
    done: "You'll have submitted the design pack listed above.",
    source: [49, 50, 51, 52, 53, 54],
  }),
  step({
    id: 6,
    phase: "Setup",
    stage: "Review the design",
    title: "Submit a sample board",
    when: "Only if CAG asks for further assessment of materials.",
    what: "You'll submit a material sample board.",
    how: "Do this as a physical board.",
    links: [],
    done: "The sample board is with CAG.",
    source: [58],
  }),
  step({
    id: 7,
    phase: "Setup",
    stage: "Review the design",
    title: "Revise the design",
    when: "This happens when you have store design review comments.",
    what: "You'll revise the design proposal and resubmit.",
    how: "Do this in Email.",
    links: [{ label: "Open the review comments" }],
    done: doneLine([61], "The revised design pack is in."),
    source: [61],
  }),
  {
    id: 8,
    phase: "Setup",
    stage: "Apply for permits",
    title: "Wait while permits are applied and endorsed",
    when: "This happens after the design is approved, before handover.",
    what: "You don't have an action here. The contractor applies permits in OneCalendar. CAG endorses the pack.",
    how: "There's nothing for you to open on this step.",
    needs: [],
    links: [],
    done: "Permits are applied and endorsed. Handover can be scheduled.",
    wait: true,
    onlyIf: [],
    rules: [],
    source: [],
  },
  step({
    id: 9,
    phase: "Build",
    stage: "Hand over the unit",
    title: "Walk the unit with IFM and sign handover",
    when: "This happens when the handover walkthrough is set.",
    what: "You'll walk through the site with Integrated Facilities Management and sign the handover form.",
    how: "Do this at the physical unit. The signed form is held in Sharepoint.",
    links: [{ label: "Download Handover Form" }],
    done: doneLine([102], "The handover form is signed."),
    source: [99, 102],
  }),
  step({
    id: 10,
    phase: "Build",
    stage: "Carry out renovation",
    title: "Submit the fire safety certificate or TFP",
    when: "This happens where the listed fire-safety document applies, before occupying.",
    what: "You'll submit the Fire Safety Certificate, Minor Addition & Alteration, or Temporary Fire Permit where applicable.",
    how: "Do this in Email. You'll use OneCalendar.",
    links: [{ label: "Open OneCalendar" }],
    done: doneLine([128], "The fire safety document is in."),
    source: [128],
  }),
  step({
    id: 11,
    phase: "Operate",
    stage: "Open the outlet",
    title: "Submit opening files in OneCalendar",
    when: "As-built drawings go in within three weeks of renovation completion.",
    what: "You'll submit the Fire Safety & Shelter Department Notice of Approval and the as-built drawings.",
    how: "Do this in OneCalendar.",
    links: [{ label: "Open OneCalendar" }],
    done: "The NOA and as-built drawings are in OneCalendar.",
    source: [140, 141],
  }),
  step({
    id: 12,
    phase: "Operate",
    stage: "Open the outlet",
    title: "Submit the Certificate of Fitness",
    when: "This happens when the electrical supply is turned on.",
    what: "You'll submit the Certificate of Fitness form to Integrated Facilities Management.",
    how: "Do this in TOPAZ.",
    links: [
      { label: "Download COF Forms N1–N8" },
      { label: "Open TOPAZ" },
    ],
    done: doneLine([142], "The Certificate of Fitness form is in."),
    source: [142],
  }),
  step({
    id: 13,
    phase: "Operate",
    stage: "Open the outlet",
    title: "Send the renovation invoice",
    when: "This happens at store opening, when the invoice is due.",
    what: "You'll submit the renovation invoice.",
    how: "Do this in Email.",
    links: [{ label: "Upload renovation invoice" }],
    done: doneLine([148], "The renovation invoice is in."),
    source: [148],
  }),
  step({
    id: 14,
    phase: "Operate",
    stage: "Open the outlet",
    title: "Fix outstanding defects",
    when: "This happens when there is an outstanding defect list.",
    what: "You'll rectify outstanding defects for Integrated Facilities Management.",
    how: "Do this at the physical unit.",
    links: [],
    done: doneLine([151], "Outstanding defects are rectified."),
    source: [151],
  }),
  step({
    id: 15,
    phase: "Operate",
    stage: "Run the outlet",
    title: "Submit this period's servicing reports",
    when: "These reports are regular. Inspect the FCU every 3 months where that rule applies.",
    what: "You'll submit the servicing reports that apply to this unit, in TOPAZ.",
    how: "Do this in TOPAZ.",
    needs: [
      "Pest Control Report — Only if this is a foodshop/foodstall",
      "Air Handling Unit Servicing Report — Only if Tenant-Maintained AHU",
      "Kitchen Waste Pipe Report",
      "FCU (Fan Coil Unit) Servicing Report — every 3 months where that rule applies",
      "Grease Trap / Portable Grease Trap Servicing Report",
      "Servicing of Floor Trap Report",
      "Kitchen Fire Suppression System Report",
      "Kitchen Fan System Servicing Report",
      "Certificate Of Fitness",
      "Fire Alarm System Report",
      "Engineered Smoke Control System (ESCS) Report",
      "Total Gas Flooding System (TGFS) Report",
      "Kitchen Duct Cleaning Report",
    ],
    links: [{ label: "Open TOPAZ" }],
    done: "The reports that apply are in TOPAZ.",
    source: [153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165],
  }),
  step({
    id: 16,
    phase: "Operate",
    stage: "Run the outlet",
    title: "Complete fire safety training",
    when: "This happens as staff operate the outlet.",
    what: "You'll complete the fire safety training video, quiz, and declaration.",
    how: "Do this in the Tenant Fire Safety Declaration Portal.",
    links: [{ label: "Open Tenant Fire Safety Declaration Portal" }],
    done: doneLine([167], "Training is recorded as complete."),
    source: [167],
  }),
  step({
    id: 17,
    phase: "Operate",
    stage: "Run the outlet",
    title: "Submit monthly sales",
    when: "This happens each month.",
    what: "You'll submit the monthly sales declaration.",
    how: "Do this in the Lease Management System.",
    links: [{ label: "Open Lease Management System" }],
    done: doneLine([171], "The monthly sales declaration is in."),
    source: [171],
  }),
  step({
    id: 18,
    phase: "Exit",
    stage: "Reinstate the unit",
    title: "Fix reinstatement defects if found",
    when: "This happens if Integrated Facilities Management finds defects at takeover inspection.",
    what: "You'll rectify reinstatement defects if any are found.",
    how: "Do this at the physical unit.",
    links: [],
    done: doneLine([200], "Reinstatement defects are rectified."),
    extraOnlyIf: ["Outgoing Tenant"],
    source: [200],
  }),
  step({
    id: 19,
    phase: "Exit",
    stage: "Reinstate the unit",
    title: "Hand back the unit",
    when: "This happens at the takeover meeting.",
    what: "You'll hand the premises back to Integrated Facilities Management.",
    how: "Do this at the physical unit.",
    links: [],
    done: doneLine([202], "Keys are returned."),
    extraOnlyIf: ["Outgoing Tenant"],
    source: [202],
  }),
  step({
    id: 20,
    phase: "Exit",
    stage: "Reinstate the unit",
    title: "Settle utility charges",
    when: "This happens when Finance notifies you of outstanding utility charges.",
    what: "You'll settle outstanding utility charges.",
    how: "Do this in Email.",
    links: [],
    done: doneLine([207], "Utility charges are settled."),
    source: [207],
  }),
];

export function tenantStepsInPhase(phase: PhaseId) {
  return TENANT_PATH.filter((s) => s.phase === phase);
}

export function tenantPathTotal() {
  return TENANT_PATH.length;
}
