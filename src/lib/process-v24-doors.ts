import type { Phase } from "@/lib/tenancy-data";

export const REINSTATEMENT_DOOR_STEP =
  "Reinstatement Requirements & Plan Alignment";
export const IFM_BRIEFING_STEP =
  "Integrated Facilities Management Pre-Renovation Briefing";

const BUILD_ON_SITE_STEPS = new Set([
  IFM_BRIEFING_STEP,
  "Onboarding Guidelines Shared",
  "Airport Passes & Hoarding Installation",
  "Temporary Power Request",
  "QP Assessment: FSC / MAA / Temporary Fire Permit",
  "Renovation Works & Site Monitoring",
]);

export type PhaseDeskId = Phase["id"];

export type PhaseGroup = {
  id: string;
  title: string;
  lead: string;
  match: (stageName: string, stepName: string) => boolean;
};

export type PhaseDesk = {
  groups: PhaseGroup[];
};

export const PHASE_ORDER: PhaseDeskId[] = [
  "setup",
  "build",
  "operate",
  "exit",
];

export const PHASE_INTRO: Record<PhaseDeskId, string> = {
  setup: "Access",
  build: "Fit-out",
  operate: "Trade",
  exit: "Hand back",
};

export const PHASE_DESKS: Record<PhaseDeskId, PhaseDesk> = {
  setup: {
    groups: [
      {
        id: "access",
        title: "Access for the team",
        lead: "Accounts first.",
        match: (stage) => stage === "Tenancy Platform Onboarding",
      },
      {
        id: "align",
        title: "Approving the design",
        lead: "Drawings, then KickOff.",
        match: (stage) =>
          stage === "Pre-Kickoff" ||
          stage === "Kickoff" ||
          stage === "Post-Kickoff" ||
          stage === "Design Review",
      },
      {
        id: "permits",
        title: "Permits to start work",
        lead: "Before anyone is on site.",
        match: (stage) => stage === "Permit Application",
      },
    ],
  },
  build: {
    groups: [
      {
        id: "take-unit",
        title: "Collecting the keys",
        lead: "Walk the unit, then sign.",
        match: (stage) => stage === "Handover",
      },
      {
        id: "on-site",
        title: "The fit-out on site",
        lead: "Briefing, then works.",
        match: (_stage, step) => BUILD_ON_SITE_STEPS.has(step),
      },
      {
        id: "clear",
        title: "Getting ready to open",
        lead: "Tests, then trade.",
        match: (stage, step) =>
          stage === "Renovation" && !BUILD_ON_SITE_STEPS.has(step),
      },
    ],
  },
  operate: {
    groups: [
      {
        id: "after-opening",
        title: "After opening day",
        lead: "Day-one paperwork.",
        match: (stage) => stage === "Opening",
      },
      {
        id: "reports",
        title: "Service reports",
        lead: "Service on a cycle.",
        match: (_stage, step) =>
          step === "Regular Servicing Reporting" ||
          step === "Pest Control Reporting" ||
          step === "Air Handling Unit Servicing Reporting",
      },
      {
        id: "declarations",
        title: "Declarations",
        lead: "Fire yearly. Sales monthly.",
        match: (_stage, step) =>
          step === "Annual Fire Safety Declaration & Training" ||
          step === "Monthly Sales Declaration",
      },
    ],
  },
  exit: {
    groups: [
      {
        id: "plan",
        title: "Before leaving",
        lead: "Pack, then the leave permit.",
        match: (_stage, step) =>
          step === "Unit Documents Gathered & Shared" ||
          step === REINSTATEMENT_DOOR_STEP ||
          step === "Reinstatement Permit Submission via OneCalendar" ||
          step === "Multi-Party Review by Changi Airport Group Stakeholders",
      },
      {
        id: "reinstate",
        title: "Putting the unit back",
        lead: "Strip out. Restore the shell.",
        match: (_stage, step) =>
          step === "Pre-Reinstatement Works" ||
          step === "Point of Sales Removal" ||
          step === "Structured Cabling Disconnection (Terminal 3)" ||
          step === "Reinstatement Works",
      },
      {
        id: "hand-back",
        title: "Handing the unit back",
        lead: "Inspect, then return keys.",
        match: (_stage, step) =>
          step === "Pre-Takeover Inspection" ||
          step === "Takeover Meeting" ||
          step === "Post-Takeover Closure Announcement" ||
          step === "Security Deposit Release & Utility Bill Settlement",
      },
    ],
  },
};

export function phaseGroupForStep(
  phaseId: PhaseDeskId,
  stageName: string,
  stepName: string,
): string | null {
  return (
    PHASE_DESKS[phaseId].groups.find((group) =>
      group.match(stageName, stepName),
    )?.id ?? null
  );
}

export type ChapterTopic = {
  phaseId: PhaseDeskId;
  id: string;
  title: string;
  lead: string;
};

export function allChapterTopics(): ChapterTopic[] {
  return (Object.keys(PHASE_DESKS) as PhaseDeskId[]).flatMap((phaseId) =>
    PHASE_DESKS[phaseId].groups.map((group) => ({
      phaseId,
      id: group.id,
      title: group.title,
      lead: group.lead,
    })),
  );
}

export function topicValue(phaseId: PhaseDeskId, groupId: string) {
  return `${phaseId}::${groupId}`;
}

export function parseTopicValue(value: string): {
  phaseId: PhaseDeskId;
  id: string;
} | null {
  const [phaseId, id] = value.split("::");
  if (!phaseId || !id) return null;
  if (!(phaseId in PHASE_DESKS)) return null;
  return { phaseId: phaseId as PhaseDeskId, id };
}
