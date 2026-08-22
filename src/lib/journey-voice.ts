import {
  isListed,
  type JourneyCard,
  type JourneyRule,
  type RuleRank,
} from "@/lib/journey-cards";

const TITLE_FIRST: Record<string, string> = {
  Accesses: "Access",
  Activates: "Activate",
  Adds: "Add",
  Advice: "Advise",
  Applies: "Apply",
  Approves: "Approve",
  Arranges: "Arrange",
  Attends: "Attend",
  Books: "Book",
  Checks: "Check",
  Clarifies: "Clarify",
  Communicates: "Communicate",
  Compiles: "Compile",
  Completes: "Complete",
  Conducts: "Conduct",
  Confirms: "Confirm",
  Creates: "Create",
  Does: "Do",
  Endorses: "Endorse",
  Explains: "Explain",
  Facilitates: "Facilitate",
  Fills: "Fill",
  Follows: "Follow",
  Gathers: "Gather",
  Hands: "Hand",
  Identifies: "Identify",
  Initiates: "Initiate",
  Inspects: "Inspect",
  Installs: "Install",
  Introduces: "Introduce",
  Links: "Link",
  Monitors: "Monitor",
  Notifies: "Notify",
  Obtains: "Obtain",
  Performs: "Perform",
  Presents: "Present",
  Publishes: "Publish",
  Records: "Record",
  Rectifies: "Rectify",
  Registers: "Register",
  Releases: "Release",
  Requests: "Request",
  Retrieves: "Retrieve",
  Retrives: "Retrieve",
  Reviews: "Review",
  Revises: "Revise",
  Routes: "Route",
  Schedules: "Schedule",
  Selects: "Select",
  Sends: "Send",
  Sets: "Set",
  Settles: "Settle",
  Shares: "Share",
  Signs: "Sign",
  Submits: "Submit",
  Synthesizes: "Synthesize",
  Tracks: "Track",
  Updates: "Update",
  Uploads: "Upload",
  Verifies: "Verify",
  Walks: "Walk",
  Witnesses: "Witness",
};

export const STAGE_FACE: Record<string, string> = {
  "Tenancy Platform Onboarding": "Get onto the tenancy platform",
  "Pre-Kickoff": "Get ready for kick-off",
  Kickoff: "Hold the kick-off",
  "Post-Kickoff": "Follow up after kick-off",
  "Design Review": "Review the design",
  "Permit Application": "Apply for permits",
  Handover: "Hand over the unit",
  Renovation: "Carry out renovation",
  Opening: "Open the outlet",
  Operations: "Run the outlet",
  Reinstatement: "Reinstate the unit",
};

export const STEP_FACE: Record<string, string> = {
  "Set Up Systems Required for Works and Setup":
    "Set up the systems you need for works",
  "Set Up Systems Required for Staff": "Set up the systems you need for staff",
  "Set Up Systems Required for Operations":
    "Set up the systems you need for operations",
  "Kickoff Documents Gathered & Shared": "Gather and share kick-off documents",
  "High-Level Design Review": "Review the high-level design",
  "Confirmation of Meeting Attendees": "Confirm who will attend",
  "Requirements & Plan Alignment": "Align requirements and plans",
  "Onboarding Guidelines Shared": "Share the onboarding guidelines",
  "Confirmation of Renovation Plans": "Confirm the renovation plans",
  "Permit Selection & Document Preparation by Tenant/Contractor":
    "Select permits and prepare documents",
  "Joint Site Inspection": "Do the joint site inspection",
  "Permit Selection & Supporting Document Submission":
    "Select permits and submit supporting documents",
  "Multi-Party Review by Changi Airport Group Stakeholders":
    "Review with CAG stakeholders",
  "Requests / Permissions Outside OneCalendar":
    "Request permissions outside OneCalendar",
  "Site Walkthrough, Technical Verification & Handover Sign Off":
    "Walk the site, verify, and sign off handover",
  "Integrated Facilities Management Pre-Renovation Briefing":
    "Hold the IFM pre-renovation briefing",
  "Pre-Renovation Works": "Do the pre-renovation works",
  "Renovation Works": "Do the renovation works",
  "Pre-Opening Checks and Certifications":
    "Do pre-opening checks and certifications",
  "Document Submission": "Submit the documents",
  "Store Opening": "Open the store",
  "Point of Sales Data Reporting": "Report point-of-sales data",
  "Regular Servicing Reporting": "Report regular servicing",
  "Staff Reporting & Training": "Report staff and complete training",
  "Commercial Sales Declaration": "Declare commercial sales",
  "Unit Documents Gathered & Shared": "Gather and share unit documents",
  "Permit Submission via OneCal 3.0": "Submit the permit in OneCal 3.0",
  "Pre-Reinstatement Works": "Do the pre-reinstatement works",
  "Reinstatement Works": "Do the reinstatement works",
  "Pre-Takeover Inspection": "Do the pre-takeover inspection",
  "Takeover Meeting": "Hold the takeover meeting",
  "Post-Takeover Meeting": "Hold the post-takeover meeting",
  "Security Deposit Release / Utility Bill Settlement":
    "Release the security deposit and settle utility bills",
};

export const PHASE_FACE: Record<
  string,
  { name: string; description: string }
> = {
  Setup: {
    name: "Get set up",
    description:
      "Get your access, kick-off, design, and permits sorted so works can start.",
  },
  Build: {
    name: "Build the unit",
    description:
      "Hand over the unit, brief the contractor, and carry out the works.",
  },
  Operate: {
    name: "Open and run",
    description: "Open the outlet and keep servicing reports current.",
  },
  Exit: {
    name: "Close the unit",
    description: "Reinstate the unit and close the tenancy.",
  },
};

function stripWhoPrefix(text: string, who: string) {
  const t = text.trim();
  const whoRe = new RegExp(
    `^${who.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+`,
    "i",
  );
  return t.replace(whoRe, "");
}

function lowerFirst(text: string) {
  if (!text) return text;
  return text.charAt(0).toLowerCase() + text.slice(1);
}

export function faceTitle(title: string) {
  const t = title.trim();
  if (!t) return t;
  const [first, ...rest] = t.split(/\s+/);
  const keyed = first.charAt(0).toUpperCase() + first.slice(1);
  const mapped = TITLE_FIRST[keyed] ?? TITLE_FIRST[first] ?? first;
  return [mapped, ...rest].join(" ");
}

export function faceStage(stage: string) {
  return STAGE_FACE[stage] ?? stage;
}

export function faceStep(step: string) {
  return STEP_FACE[step] ?? step;
}

export function splitListed(value: string | null | undefined): string[] {
  if (!isListed(value)) return [];
  return value!
    .split(/\n|;(?=\s)|,(?=\s)/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function faceAction(card: JourneyCard, mine: boolean) {
  const raw = isListed(card.task) ? card.task : card.title;
  const stripped = stripWhoPrefix(raw, card.who);
  const verb = faceTitle(stripped || card.title);
  const lead = mine
    ? `You'll ${lowerFirst(verb)}.`
    : `${card.who} will ${lowerFirst(verb)}.`;
  const bits = [lead];
  const hay = `${card.task} ${card.title}`;
  if (isListed(card.channel) && !hay.includes(card.channel)) {
    bits.push(`Do this in ${card.channel}.`);
  } else if (isListed(card.channel) && !lead.includes(card.channel)) {
    bits.push(`Do this in ${card.channel}.`);
  }
  if (
    isListed(card.system) &&
    card.system !== card.channel &&
    !hay.includes(card.system)
  ) {
    bits.push(`You'll use ${card.system}.`);
  }
  if (isListed(card.output)) {
    bits.push(`You'll get ${card.output}.`);
  }
  return bits.join(" ");
}

export function eligibilityLines(card: JourneyCard): string[] {
  const rows: [string, string | null][] = [
    ["unit type", card.unitType],
    ["area or location", card.area],
    ["work scope", card.workScope],
    ["unit features", card.unitFeatures],
    ["tenant type", card.tenantType],
    ["project officer type", card.poType],
  ];
  return rows
    .filter(([, v]) => isListed(v))
    .map(([label, v]) => `${label}: ${v}`);
}

export function faceRule(line: string) {
  return line
    .replace(/\bthey must\b/gi, "they'll need to")
    .replace(/\bit is mandatory that\b/gi, "you'll need to")
    .replace(/\bThe applicant shall\b/g, "You'll")
    .replace(/\busers must\b/gi, "you'll need to");
}

export function ruleBadge(rank: RuleRank) {
  if (rank === "must-do") return "You'll need to";
  if (rank === "must-not") return "Don't";
  return "Only if";
}

export function faceRules(rules: JourneyRule[]) {
  return rules.map((r) => ({
    ...r,
    line: faceRule(r.line),
    badge: ruleBadge(r.rank),
  }));
}
