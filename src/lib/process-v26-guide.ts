import type { Role } from "@/lib/app-state";
import {
  PHASES,
  type DocItem,
  type Phase,
  type Step,
  type Unit,
} from "@/lib/tenancy-data";
import { worksV26Href } from "@/lib/process-v26-preview";
import { v26PresentDoc, type V26ShownDoc } from "@/lib/process-v26-documents";
import {
  displayText,
  docsForStep,
  filterSubSteps,
  isMyAction,
  notesYouFollow,
  partitionGuide,
  stepWhat,
  systemsVisibleToRole,
} from "@/lib/process-guide";
import { timingsForStep, type GuideTiming } from "@/lib/process-rules-v6";

export type V26PhaseId = Phase["id"];

/** Bump when a process step is added, swapped, or removed from the source guides. */
export const V26_GUIDE_UPDATED = "2026-10-13T00:00:00.000Z";

export type V26CardKind = "guide" | "works-door" | "works-adjacent";

export type V26Source = { stage: string; step: string };

export type V26Card = {
  id: string;
  title: string;
  kind: V26CardKind;
  lead?: Record<Role, string>;
  steps?: Record<Role, string[]>;
  href?: string;
  sources?: V26Source[];
  /** Skip RR When rows from `sources` (e.g. lighting SLA on a TOPAZ report). */
  hideTimings?: boolean;
  /** v38 blueprint. Used only when `sources` is empty, so older cards stay on PHASES. */
  sheetSystems?: string[];
  sheetDocs?: string[];
  /** v38 blueprint conditions, shown as the Required for tip. */
  sheetBecause?: string[];
  /** v40 journey. People named on the step. */
  sheetPeople?: string[];
  /** v40 journey. System name plus its link, when the sheet has one. */
  sheetSystemLinks?: { label: string; href?: string }[];
  /** v40 journey. Action banner into Projects. */
  sheetBanner?: string;
  /** v40 journey. SLA line on the card. */
  sheetSla?: string;
};

export type V26Chapter = {
  id: string;
  title: string;
  lead: string;
  cards: V26Card[];
};

export type V26PhaseGuide = {
  id: V26PhaseId;
  name: string;
  intro: string;
  chapters: V26Chapter[];
};

export const V26_PHASES: V26PhaseGuide[] = [
  {
    id: "setup",
    name: "Setup",
    intro: "Before opening",
    chapters: [
      {
        id: "access",
        title: "Access for the team",
        lead: "Accounts first.",
        cards: [
          {
            id: "onecalendar",
            title: "OneCalendar access",
            kind: "guide",
            sources: [
              {
                stage: "Tenancy Platform Onboarding",
                step: "Set Up Systems Required for Works and Setup",
              },
            ],
            lead: {
              tenant: "Approve unit access",
              contractor: "Apply for access",
              officer: "Create unit records",
            },
            steps: {
              tenant: ["Approve unit access in OneCalendar when asked."],
              contractor: [
                "Create your OneCalendar account.",
                "Apply for terminal and unit access in OneCalendar.",
              ],
              officer: [
                "Create tenant, brand, and outlet records in OneCalendar.",
              ],
            },
          },
          {
            id: "staff-systems",
            title: "Set Up Systems Required for Staff",
            kind: "guide",
            sources: [
              {
                stage: "Tenancy Platform Onboarding",
                step: "Set Up Systems Required for Staff",
              },
            ],
            lead: {
              tenant: "Register staff for QSM",
              contractor: "Staff QSM sits with the tenant",
              officer: "Guide staff QSM registration",
            },
            steps: {
              tenant: [
                "Register front-of-house staff for Quality Service Management in the ONE Changi App.",
              ],
              contractor: [
                "Front-of-house staff QSM registration sits with the tenant and Project Officer.",
              ],
              officer: [
                "Guide the tenant to register front-of-house staff for Quality Service Management.",
              ],
            },
          },
          {
            id: "pos-setup",
            title: "Point of Sales Setup",
            kind: "guide",
            sources: [
              {
                stage: "Tenancy Platform Onboarding",
                step: "Point of Sales Setup",
              },
            ],
            lead: {
              tenant: "Get POS setup",
              contractor: "POS setup sits with the tenant",
              officer: "Link NEC for POS",
            },
            steps: {
              tenant: [
                "For F&B or Retail, your Project Officer loops in NEC for Point of Sales.",
              ],
              contractor: [
                "Point of Sales setup sits with the tenant and Project Officer.",
              ],
              officer: [
                "Link the tenant with NEC for Point of Sales when this unit is Retail or F&B.",
              ],
            },
          },
        ],
      },
      {
        id: "align",
        title: "Approving the design",
        lead: "Present drawings at KickOff.",
        cards: [
          {
            id: "kickoff-invite",
            title: "KickOff invite",
            kind: "guide",
            sources: [
              {
                stage: "Pre-Kickoff",
                step: "Confirmation of Meeting Attendees",
              },
            ],
            lead: {
              tenant: "Watch for the invite",
              contractor: "Watch for the invite",
              officer: "Confirm attendees",
            },
            steps: {
              tenant: ["Watch for the KickOff invite from your Project Officer."],
              contractor: ["Go to the first site meeting when invited."],
              officer: ["Confirm KickOff meeting attendees."],
            },
          },
          {
            id: "kickoff",
            title: "KickOff meeting",
            kind: "guide",
            sources: [
              {
                stage: "Kickoff",
                step: "Requirements & Plan Alignment",
              },
            ],
            lead: {
              tenant: "Attend KickOff",
              contractor: "Attend KickOff",
              officer: "Run KickOff",
            },
            steps: {
              tenant: [
                "Present renovation intentions at KickOff.",
                "Bring consultant, contractor, and pack drawings.",
              ],
              contractor: ["Attend KickOff. Confirm work procedures and site rules."],
              officer: ["Introduce the room and record agreed actions."],
            },
          },
          {
            id: "design-pack",
            title: "Design pack for approval",
            kind: "guide",
            sources: [
              {
                stage: "Design Review",
                step: "Confirmation of Renovation Plans",
              },
            ],
            lead: {
              tenant: "Send design pack",
              contractor: "Get written approval",
              officer: "Share design pack",
            },
            steps: {
              tenant: [
                "Send one design pack to your Project Officer.",
                "Get written design approval before permits.",
              ],
              contractor: ["Get written design approval before permits."],
              officer: ["Share the design pack with Design Management."],
            },
          },
        ],
      },
    ],
  },
  {
    id: "build",
    name: "Build",
    intro: "Fit-out",
    chapters: [
      {
        id: "take-unit",
        title: "Collecting the keys",
        lead: "Walk the unit, then sign.",
        cards: [
          {
            id: "handover",
            title: "Unit handover walk",
            kind: "guide",
            sources: [
              {
                stage: "Handover",
                step: "Site Walkthrough, Technical Verification & Handover Sign Off",
              },
            ],
            lead: {
              tenant: "Walk the unit",
              contractor: "Walk the unit",
              officer: "Schedule handover walk",
            },
            steps: {
              tenant: [
                "Walk the unit with IFM at handover.",
                "Collect the unit keys.",
                "Sign the handover form.",
              ],
              contractor: ["Walk the unit with IFM when invited."],
              officer: ["Schedule the unit handover walk with IFM."],
            },
          },
        ],
      },
      {
        id: "opening-works",
        title: "Starting this renovation",
        lead: "Start or read a work, then see the draft steps.",
        cards: [
          {
            id: "opening-works",
            title: "Opening Works",
            kind: "works-door",
            href: worksV26Href(),
            sources: [
              {
                stage: "Renovation",
                step: "Integrated Facilities Management Pre-Renovation Briefing",
              },
            ],
            lead: {
              tenant: "Read works",
              contractor: "Start a work",
              officer: "See works",
            },
            steps: {
              tenant: [
                "Read the works your contractor declared.",
                "IFM briefs the works team before renovation starts.",
              ],
              contractor: [
                "Attend the IFM briefing, then start a work.",
                "See the draft steps for this work.",
              ],
              officer: [
                "See the contractor’s declared work.",
                "Check the IFM briefing is booked.",
              ],
            },
          },
        ],
      },
    ],
  },
  {
    id: "operate",
    name: "Operate",
    intro: "Trade",
    chapters: [
      {
        id: "after-opening",
        title: "While the unit is open",
        lead: "Fire each year, sales each month, and the account for service reports.",
        cards: [
          {
            id: "topaz-account",
            title: "TOPAZ account for reports",
            kind: "guide",
            sources: [
              {
                stage: "Opening",
                step: "TOPAZ Account Setup",
              },
            ],
            lead: {
              tenant: "Get the TOPAZ account",
              contractor: "TOPAZ sits with the tenant",
              officer: "Create the TOPAZ account",
            },
            steps: {
              tenant: [
                "Your Project Officer creates the TOPAZ account so you can lodge service reports.",
              ],
              contractor: [
                "The tenant’s TOPAZ account is for their service reports. You do not create it.",
              ],
              officer: [
                "Create the tenant TOPAZ account so they can lodge service reports.",
              ],
            },
          },
          {
            id: "fire-declaration",
            title: "Yearly fire declaration",
            kind: "guide",
            sources: [
              {
                stage: "Operations",
                step: "Annual Fire Safety Declaration & Training",
              },
            ],
            lead: {
              tenant: "Lodge the declaration",
              contractor: "Support if asked",
              officer: "Check the declaration",
            },
            steps: {
              tenant: ["Lodge the yearly fire safety declaration."],
              contractor: ["Support the fire declaration if asked."],
              officer: ["Check the yearly fire safety declaration."],
            },
          },
          {
            id: "sales",
            title: "Monthly sales declaration",
            kind: "guide",
            sources: [
              {
                stage: "Operations",
                step: "Monthly Sales Declaration",
              },
            ],
            lead: {
              tenant: "Lodge monthly sales",
              contractor: "Sales sit with the tenant",
              officer: "Check monthly sales",
            },
            steps: {
              tenant: ["Lodge the monthly sales declaration."],
              contractor: ["Monthly sales sit with the tenant."],
              officer: ["Check the monthly sales declaration."],
            },
          },
        ],
      },
      {
        id: "topaz-reports",
        title: "Keeping the unit serviced",
        lead: "Recurring lodgement for the rest of the tenancy. Not a renovation sitting.",
        cards: [
          {
            id: "servicing",
            title: "Servicing reports",
            kind: "guide",
            hideTimings: true,
            sources: [
              { stage: "Operations", step: "Regular Servicing Reporting" },
            ],
            lead: {
              tenant: "Lodge reports in TOPAZ",
              contractor: "Reports sit with the tenant",
              officer: "Check reports in TOPAZ",
            },
            steps: {
              tenant: [
                "Lodge the service reports for this unit in TOPAZ on schedule.",
              ],
              contractor: [
                "Recurring TOPAZ service reports sit with Tenant. You do not lodge these.",
              ],
              officer: ["Check IFM approved the service reports in TOPAZ."],
            },
          },
        ],
      },
      {
        id: "lease-works",
        title: "Starting a further renovation",
        lead: "A new renovation, with its own Permit to Work.",
        cards: [
          {
            id: "lease-works",
            title: "Further Works",
            kind: "works-door",
            href: worksV26Href(),
            lead: {
              tenant: "Read records for a further renovation on this unit.",
              contractor: "Start a further renovation. It does not overwrite earlier answers.",
              officer: "See each further renovation as its own record.",
            },
          },
        ],
      },
    ],
  },
  {
    id: "exit",
    name: "Exit",
    intro: "Hand back",
    chapters: [
      {
        id: "plan",
        title: "Before leaving",
        lead: "Pack, then the leave plan.",
        cards: [
          {
            id: "exit-pack",
            title: "Reinstatement pack",
            kind: "guide",
            sources: [
              {
                stage: "Reinstatement",
                step: "Unit Documents Gathered & Shared",
              },
            ],
            lead: {
              tenant: "Use the pack",
              contractor: "Use the pack",
              officer: "Send the pack",
            },
            steps: {
              tenant: ["Use the reinstatement pack before leaving."],
              contractor: ["Use the reinstatement pack."],
              officer: ["Send the reinstatement pack."],
            },
          },
        ],
      },
      {
        id: "exit-works",
        title: "Removing the fit-out",
        lead: "Start or read a work for the strip-out.",
        cards: [
          {
            id: "exit-works",
            title: "Exit works",
            kind: "works-door",
            href: worksV26Href(),
            sources: [
              {
                stage: "Reinstatement",
                step: "Reinstatement Permit Submission via OneCalendar",
              },
            ],
            lead: {
              tenant: "Read works",
              contractor: "Start a work",
              officer: "See works",
            },
            steps: {
              tenant: ["Read the work record for this unit."],
              contractor: ["Start a work, then see the draft steps."],
              officer: ["See the work record for this unit."],
            },
          },
        ],
      },
      {
        id: "hand-back",
        title: "Handing the unit back",
        lead: "Inspect, then return keys.",
        cards: [
          {
            id: "takeover",
            title: "Unit takeover meeting",
            kind: "guide",
            sources: [
              {
                stage: "Reinstatement",
                step: "Takeover Meeting",
              },
            ],
            lead: {
              tenant: "Attend takeover",
              contractor: "Attend takeover",
              officer: "Hold takeover",
            },
            steps: {
              tenant: ["Attend the unit takeover meeting."],
              contractor: ["Attend the unit takeover meeting."],
              officer: ["Hold the unit takeover meeting."],
            },
          },
        ],
      },
    ],
  },
];

export function v26PhaseById(id: string | null): V26PhaseGuide {
  return V26_PHASES.find((phase) => phase.id === id) ?? V26_PHASES[0];
}

export function v26PhaseKicker(id: V26PhaseId) {
  const guide = v26PhaseById(id);
  return `${guide.intro} — ${guide.name} for this unit`;
}

function purposeAddsContext(description: string, purpose: string) {
  const a = description
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const b = purpose
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!b || a.includes(b) || b.includes(a)) return false;
  const stop = new Set(["then", "this", "unit", "your", "with", "that", "from"]);
  const words = b.split(" ").filter((word) => word.length > 3 && !stop.has(word));
  if (!words.length) return true;
  const hits = words.filter((word) => a.includes(word)).length;
  return hits / words.length < 0.7;
}

export function v26PhaseWhat(id: V26PhaseId) {
  const row = PHASES.find((phase) => phase.id === id);
  if (!row) return "";
  const extra = row.stages
    .map((stage) => stage.purpose)
    .find((purpose) => purposeAddsContext(row.description, purpose));
  return extra ? `${row.description} ${extra}` : row.description;
}

export const V26_GUIDE_FILTERS = [
  {
    view: "works",
    cardId: null,
    title: "Renovation works",
    hint: "Opening Works, further renovation, and exit works",
  },
  {
    view: "fire",
    cardId: "fire-declaration",
    title: "Yearly fire declaration",
    hint: "Fire safety training and declaration",
  },
  {
    view: "sales",
    cardId: "sales",
    title: "Monthly sales declaration",
    hint: "This unit’s sales for the month",
  },
  {
    view: "servicing",
    cardId: "servicing",
    title: "Servicing reports",
    hint: "Service records lodged in TOPAZ",
  },
] as const;

export type V26GuideView = (typeof V26_GUIDE_FILTERS)[number]["view"];

export function v26GuideFilter(view: string | null) {
  return V26_GUIDE_FILTERS.find((row) => row.view === view) ?? null;
}

export type V26PhaseSlice = {
  phase: V26PhaseGuide;
  chapters: V26Chapter[];
};

/** Cards that match a chip, across every phase. Phase is a label, not a gate. */
export function v26FilterAcrossPhases(
  worksOnly: boolean,
  typeCardId: string | null,
): V26PhaseSlice[] {
  return V26_PHASES.map((phase) => ({
    phase,
    chapters: filterV26Chapters(phase, worksOnly, typeCardId),
  })).filter((row) => row.chapters.length > 0);
}

export function filterV26Chapters(
  phase: V26PhaseGuide,
  worksOnly: boolean,
  typeCardId: string | null = null,
) {
  if (typeCardId) {
    return phase.chapters
      .map((chapter) => ({
        ...chapter,
        cards: chapter.cards.filter((card) => card.id === typeCardId),
      }))
      .filter((chapter) => chapter.cards.length > 0);
  }
  if (!worksOnly) return phase.chapters;
  return phase.chapters
    .map((chapter) => ({
      ...chapter,
      cards: chapter.cards.filter(
        (card) => card.kind === "works-door" || card.kind === "works-adjacent",
      ),
    }))
    .filter((chapter) => chapter.cards.length > 0);
}

const ROLE_PERSON: Record<Role, string> = {
  tenant: "Tenant",
  contractor: "Contractor",
  officer: "Project Officer",
};

const WHO_SLUG: Record<string, string> = {
  "Project Officer": "po",
  Tenant: "tenant",
  Contractor: "contractor",
  "Integrated Facilities Management": "ifm",
  "Airport Emergency & Safety": "aes",
  "Design Management": "design",
  "Qualified Person": "qp",
  "Building Maintenance Contractor": "bmc",
  "Master Planning": "planning",
  "Building Management Centre": "bmc-ops",
  "Airport Planning & Leasing": "leasing",
  Finance: "finance",
};

const WHO_ORDER = [
  "Project Officer",
  "Tenant",
  "Contractor",
  "Integrated Facilities Management",
  "Airport Emergency & Safety",
  "Design Management",
  "Qualified Person",
  "Building Maintenance Contractor",
];

export function v26WhoSlug(name: string) {
  return (
    WHO_SLUG[name] ??
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
  );
}

export function v26WhoParamFor(name: string, role: Role) {
  return name === ROLE_PERSON[role] ? "you" : v26WhoSlug(name);
}

export function v26WhoSelected(name: string, role: Role, who: string | null) {
  if (!who) return false;
  if (name === ROLE_PERSON[role] && (who === "you" || who === v26WhoSlug(name))) {
    return true;
  }
  return who === v26WhoSlug(name);
}

function v26CardHasWho(
  card: V26Card,
  unit: Unit,
  role: Role,
  who: string | null,
) {
  if (!who) return true;
  const people = v26CardView(card, unit, role).people;
  if (who === "you") return people.includes(ROLE_PERSON[role]);
  return people.some((name) => v26WhoSlug(name) === who);
}

export function v26VisibleCardCount(
  phase: V26PhaseGuide,
  unit: Unit,
  role: Role,
  worksOnly: boolean,
  who: string | null,
  typeCardId: string | null = null,
) {
  return filterV26ChaptersByWho(
    filterV26Chapters(phase, worksOnly, typeCardId),
    unit,
    role,
    who,
  ).reduce((total, chapter) => total + chapter.cards.length, 0);
}

export function filterV26ChaptersByWho(
  chapters: V26Chapter[],
  unit: Unit,
  role: Role,
  who: string | null,
) {
  if (!who) return chapters;
  return chapters
    .map((chapter) => ({
      ...chapter,
      cards: chapter.cards.filter((card) => v26CardHasWho(card, unit, role, who)),
    }))
    .filter((chapter) => chapter.cards.length > 0);
}

export function v26WhoChipNames(
  chapters: V26Chapter[],
  unit: Unit,
  role: Role,
) {
  const names = new Set<string>();
  for (const chapter of chapters) {
    for (const card of chapter.cards) {
      for (const name of v26CardView(card, unit, role).people) {
        names.add(name);
      }
    }
  }
  const mine = ROLE_PERSON[role];
  return [...names].sort((a, b) => {
    if (a === mine) return -1;
    if (b === mine) return 1;
    const ia = WHO_ORDER.indexOf(a);
    const ib = WHO_ORDER.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}

export function v26WorksFilterCards() {
  return V26_PHASES.flatMap((phase) =>
    phase.chapters.flatMap((chapter) =>
      chapter.cards
        .filter(
          (card) => card.kind === "works-door" || card.kind === "works-adjacent",
        )
        .map((card) => ({ phaseId: phase.id, card })),
    ),
  );
}

function sourceStep(source: V26Source) {
  for (const phase of PHASES) {
    for (const stage of phase.stages) {
      if (stage.name !== source.stage) continue;
      const step = stage.steps.find((row) => row.name === source.step);
      if (step) return { stage, step };
    }
  }
  return null;
}

const SKIP_PEOPLE = new Set(["System"]);
const YOU_MAX = 3;

export function v26PersonLabel(name: string, role: Role) {
  return name === ROLE_PERSON[role] ? "You" : name;
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function uniqueLines(lines: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of lines) {
    const key = line.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(line);
  }
  return out;
}

function normLine(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const LEAD_STOP = new Set([
  "for",
  "your",
  "the",
  "a",
  "an",
  "and",
  "to",
  "of",
  "in",
  "on",
  "with",
  "before",
  "after",
  "from",
  "if",
  "you",
  "are",
  "asked",
  "through",
  "into",
]);

function contentSeq(text: string) {
  return normLine(text)
    .split(" ")
    .filter((word) => word.length > 2 && !LEAD_STOP.has(word));
}

function repeatsLead(line: string, lead: string) {
  const a = normLine(line);
  const b = normLine(lead);
  if (!a || !b) return false;
  if (a === b || b.includes(a)) return true;
  if (
    splitSentences(lead).some((part) => {
      const p = normLine(part);
      return p.length >= 24 && (a.includes(p) || p.includes(a));
    })
  ) {
    return true;
  }
  const lineWords = contentSeq(line);
  const leadWords = contentSeq(lead);
  const leadJoined = leadWords.join(" ");
  if (lineWords.length < 2) return leadJoined.includes(lineWords[0] ?? "");
  for (let i = 0; i < lineWords.length - 1; i += 1) {
    if (leadJoined.includes(`${lineWords[i]} ${lineWords[i + 1]}`)) return true;
  }
  const leadSet = new Set(leadWords);
  const head = lineWords.slice(0, 4);
  const overlap = head.filter((word) => leadSet.has(word));
  if (head.length >= 2 && overlap.length >= 2) return true;
  return (
    /^attend\b/i.test(line) &&
    /\b(attend|go to|invited|kickoff|site meeting)\b/i.test(lead)
  );
}

function isOtherPartyLine(line: string, role: Role) {
  const t = line.trim();
  if (
    /^(ifm|integrated facilities management|aes|airport emergency(?:\s*&\s*safety)?|design management|cag|building maintenance)\s+will\b/i.test(
      t,
    )
  ) {
    return true;
  }
  if (/^your project officer\s+will\b/i.test(t) && role !== "officer") {
    return true;
  }
  if (/^the tenant\b/i.test(t) && role !== "tenant") return true;
  if (/^the contractor\b/i.test(t) && role !== "contractor") return true;
  if (/^the project officer\b/i.test(t) && role !== "officer") return true;
  return false;
}

function youFromStep(step: Step, unit: Unit, role: Role): string[] {
  const subs = filterSubSteps(step, unit);
  const { mine, others } = partitionGuide(subs, role);
  if (mine.length === 0) return [];
  const follow = notesYouFollow(mine, others, role);
  const fromSubs = uniqueLines(
    follow.flatMap((sub) =>
      splitSentences(displayText(sub, isMyAction(role, sub.audience), role)),
    ),
  ).filter((line) => !isOtherPartyLine(line, role));
  if (fromSubs.length === 0) return [];
  const fromWhat = uniqueLines(splitSentences(stepWhat(step, role)));
  const tooLong =
    fromSubs.length > YOU_MAX || fromSubs.some((line) => line.length > 140);
  return (tooLong ? fromWhat : fromSubs).slice(0, YOU_MAX);
}

export type V26TellLine = {
  who: "Tenant" | "Contractor" | "Project Officer";
  text: string;
};

export type V26CardView = {
  what: string;
  you: string[];
  people: string[];
  timings: GuideTiming[];
  systems: { label: string; href?: string }[];
  docs: V26ShownDoc[];
  tell: V26TellLine[];
};

export function v26CardView(
  card: V26Card,
  unit: Unit,
  role: Role,
): V26CardView {
  const whats: string[] = [];
  const you: string[] = [];
  const timings: GuideTiming[] = [];
  const people: string[] = [];
  const systems: { label: string; href?: string }[] = [];
  const docs: DocItem[] = [];
  const tell: V26TellLine[] = [];
  const seenTiming = new Set<string>();
  const seenPerson = new Set<string>();
  const seenSystem = new Set<string>();
  const seenDoc = new Set<string>();
  const seenTell = new Set<string>();

  for (const source of card.sources ?? []) {
    const hit = sourceStep(source);
    if (!hit) continue;
    const lead = hit.step.whatFor?.[role] ?? hit.step.what;
    if (lead && !whats.includes(lead)) {
      whats.push(lead);
    }
    you.push(...youFromStep(hit.step, unit, role));
    if (role === "officer") {
      for (const who of ["tenant", "contractor"] as const) {
        const text = hit.step.whatFor?.[who];
        if (!text || seenTell.has(who)) continue;
        seenTell.add(who);
        tell.push({
          who: who === "tenant" ? "Tenant" : "Contractor",
          text,
        });
      }
    }
    if (!card.hideTimings) {
      for (const row of timingsForStep(
        hit.stage.name,
        hit.step.name,
        unit,
        role,
      )) {
        const key = `${row.cite}::${row.kind}::${typeof row.text === "string" ? row.text : row.duration}`;
        if (seenTiming.has(key)) continue;
        seenTiming.add(key);
        timings.push(row);
      }
    }
    for (const name of hit.step.people ?? []) {
      if (SKIP_PEOPLE.has(name) || seenPerson.has(name)) continue;
      seenPerson.add(name);
      people.push(name);
    }
    for (const system of systemsVisibleToRole(hit.step.systems, role)) {
      if (seenSystem.has(system.label)) continue;
      seenSystem.add(system.label);
      systems.push(system);
    }
    for (const doc of docsForStep(
      hit.step.name,
      unit.tenancyType,
      unit.terminal,
      unit.zone,
      hit.stage.name,
    )) {
      if (seenDoc.has(doc.id)) continue;
      seenDoc.add(doc.id);
      docs.push(doc);
    }
  }

  const hasSource = (card.sources ?? []).length > 0;
  const sheetDocs: V26ShownDoc[] = [];
  if (!hasSource) {
    for (const label of card.sheetSystems ?? []) {
      if (seenSystem.has(label)) continue;
      seenSystem.add(label);
      systems.push({ label });
    }
    for (const label of card.sheetDocs ?? []) {
      const key = `doc:${label}`;
      if (seenDoc.has(key)) continue;
      seenDoc.add(key);
      sheetDocs.push({
        id: key,
        name: label,
        type: "Guides",
        href: "",
        external: false,
      });
    }
    for (const person of card.sheetPeople ?? []) {
      if (seenPerson.has(person)) continue;
      seenPerson.add(person);
      people.push(person);
    }
    for (const system of card.sheetSystemLinks ?? []) {
      if (seenSystem.has(system.label)) continue;
      seenSystem.add(system.label);
      systems.push({ label: system.label, href: system.href });
    }
  }
  const fallbackYou = uniqueLines(card.steps?.[role] ?? []);
  const fallbackWhat = card.lead?.[role] ?? "";
  const what = whats[0] ?? fallbackWhat;
  const rawYou = uniqueLines(you.length > 0 || hasSource ? you : fallbackYou);
  const extraYou =
    card.kind === "works-door"
      ? []
      : rawYou.filter((line) => !repeatsLead(line, what)).slice(0, YOU_MAX);

  return {
    what,
    you: extraYou,
    people,
    timings,
    systems,
    docs: [
      ...docs
        .map((doc) => v26PresentDoc(doc, role))
        .filter((doc): doc is V26ShownDoc => Boolean(doc)),
      ...sheetDocs,
    ],
    tell,
  };
}

/** Blueprint `what` — same sentence for every login. Not `whatFor[role]`. */
export function v26CardFact(card: V26Card): string {
  for (const source of card.sources ?? []) {
    const hit = sourceStep(source);
    if (hit?.step.what) return hit.step.what;
  }
  return "";
}
