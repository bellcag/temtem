import type { V26Card, V26Source } from "@/lib/process-v26-guide";
import { v26CardFact, type V26PhaseId, type V26TellLine } from "@/lib/process-v26-guide";
import type { V26DraftStep } from "@/lib/process-v26-works";

/**
 * One sentence for every login. What the step is for.
 * Project cards use the same sentence as STEP_LEAD.
 */
const FACT: Record<string, string> = {
  onecalendar:
    "Get the project team into the terminal and the unit before works.",
  "staff-systems":
    "Register front-of-house staff for Quality Service Management where the outlet faces travelling passengers.",
  "pos-setup": "Link POS setup with NEC when the unit is Retail or F&B.",
  "kickoff-invite": "Confirm who attends the first site meeting.",
  kickoff:
    "Align the renovation plan, site rules, and fire safety for this unit.",
  // Confirmation of Renovation Plans sends the pack to the Project Officer.
  // The rule on that step also says upload the layout to OneCalendar.
  "design-pack":
    "Get written approval of the drawings before a renovation Permit to Work.",
  handover: "Take the unit before renovation starts.",
  "opening-works": "Start this renovation with the IFM briefing on site rules.",
  "topaz-account": "Open the account used to lodge this unit's service reports.",
  "fire-declaration":
    "Keep this unit's yearly fire safety training and declaration current.",
  sales: "Declare this unit's sales for the month.",
  // This step's lines are the TOPAZ reports. They do not give an FCU cadence.
  // Monthly pest-control reports are RR 3.3.6, and pest control is its own step.
  servicing: "Lodge this unit's service reports on schedule.",
  "lease-works": "Start a further renovation with its own Permit to Work.",
  "exit-pack": "Get the drawings needed to remove the fit-out.",
  // The step submits in OneCalendar. The door on this card still opens Projects.
  "exit-works": "Get the Permit to Work for removing the fit-out.",
  takeover: "Hand the unit back.",
  // Joint Site Inspection names Building Maintenance.
  // RR 5.4.2 also says CAG's M&E contractor.
  jsi: "Confirm fire isolation needs before that permit can be approved.",
  hot: "Get approval for welding, cutting, grinding, or an open flame.",
  fai: "Get approval to isolate alarms or drain sprinklers for this work.",
  apply: "Submit this renovation's Permit to Work.",
  review: "Check the pack before the Permit to Work is issued.",
  "qp-letter": "Cover leftover items kept from the previous tenant.",
  briefing: "Brief the site rules before work starts.",
  site: "Run this renovation under the Permit to Work.",
  waterproof: "Check waterproofing on a wet area.",
  asbuilt: "File the finished drawings for this renovation.",
  defects: "Clear the items CAG raises before the unit opens.",
  poi: "Check the unit before it opens.",
};

/** Same bullets for tenant and contractor, one move per line. */
function sharedAsk(bullets: readonly string[]) {
  const text = bullets.join("\n");
  return { tenant: text, contractor: text };
}

const ASK: Record<string, { tenant: string; contractor: string }> = {
  onecalendar: sharedAsk([
    "Project Officer creates the tenant, brand, and outlet records in OneCalendar.",
    "Create your OneCalendar account.",
    "Apply for terminal and unit access in OneCalendar.",
    "Project Officer approves terminal access in OneCalendar.",
    "Approve unit access in OneCalendar when asked.",
  ]),
  "staff-systems": sharedAsk([
    "Register staff for Quality Service Management training in the ONE Changi App.",
    "Your Project Officer can guide you.",
  ]),
  "pos-setup": sharedAsk([
    "Project Officer links the tenant with NEC for Point of Sales setup.",
  ]),
  "kickoff-invite": sharedAsk([
    "Project Officer confirms the KickOff attendees.",
    "Watch for the KickOff invite from your Project Officer.",
  ]),
  // Bring the drawings is RR 3.1 on Confirmation of Meeting Attendees.
  // That pack is used at this meeting.
  kickoff: sharedAsk([
    "Attend KickOff.",
    "Bring the drawings.",
    "Present the renovation intentions.",
    "Take site measurements for the renovation.",
    "Project Officer records the agreed actions.",
  ]),
  "design-pack": sharedAsk([
    "Send one design pack to your Project Officer.",
    "Design Management reviews the store design.",
    "Revise the pack and send it again if Design Management sends comments.",
    "Project Officer confirms the written approval.",
  ]),
  // The officer retrieves the keys in the Key Management System.
  // The shared line is collecting them at the walk.
  handover: sharedAsk([
    "Project Officer schedules the handover walk with IFM.",
    "Walk the unit with IFM and check it against the provision list.",
    "Collect the unit keys.",
    "Sign the handover form with IFM.",
  ]),
  "opening-works": sharedAsk([
    "IFM arranges the pre-renovation briefing.",
    "Attend the IFM briefing before work starts on site.",
  ]),
  "topaz-account": sharedAsk([
    "Project Officer creates the TOPAZ account.",
  ]),
  "fire-declaration": sharedAsk([
    "Complete the fire safety training, quiz, and yearly declaration.",
    "AES follows up if the declaration is late.",
    "AES can carry out a chargeable inspection if it is not submitted.",
  ]),
  sales: sharedAsk([
    "Lodge the monthly sales declaration in the Lease Management System.",
  ]),
  servicing: sharedAsk([
    "Submit the service reports for this unit in TOPAZ.",
    "IFM approves the service reports in TOPAZ.",
  ]),
  "lease-works": sharedAsk([
    "Start the further renovation in Projects.",
  ]),
  // The officer asks division reps to pull the drawings from Newforma.
  // The shared lines are the pack the others receive.
  "exit-pack": sharedAsk([
    "Get the reinstatement pack from your Project Officer.",
    "Use that set for the strip-out, not the fit-out drawings.",
  ]),
  "exit-works": sharedAsk([
    "Apply for the reinstatement Permit to Work in OneCalendar two weeks before removing the fit-out.",
  ]),
  takeover: sharedAsk([
    "IFM checks that defects are cleared.",
    "Hand the unit back to IFM.",
    "Sign the takeover form with IFM.",
    "Project Officer keeps a copy of the signed form.",
  ]),
  jsi: sharedAsk([
    "Book the joint site inspection with Building Maintenance.",
    "Confirm the fire alarm isolation needs with Building Maintenance.",
    "Building Maintenance endorses the Joint Site Inspection form.",
  ]),
  hot: sharedAsk([
    "Upload the Hot Work documents in Application Screener.",
    "Submit the permit in OneCalendar at least 7 working days before the work.",
  ]),
  fai: sharedAsk([
    "Upload the fire alarm isolation documents in Application Screener.",
    "Submit the permit in OneCalendar at least 14 working days before the work.",
  ]),
  apply: sharedAsk([
    "Upload the supporting documents for this Permit to Work.",
    "Submit the permits together in OneCalendar.",
  ]),
  review: sharedAsk([
    "Project Officer endorses the permit documents.",
    "Building Maintenance, AES, and IFM review the pack in that order.",
    "Revise the documents and resubmit in OneCalendar if a reviewer asks.",
    "OneCalendar issues the Permit to Work when the reviews are complete.",
  ]),
  "qp-letter": sharedAsk([
    "Email the QP-endorsed letter of undertaking to your Project Officer.",
  ]),
  briefing: sharedAsk([
    "IFM arranges the pre-renovation briefing.",
    "Attend the IFM briefing before work starts on site.",
  ]),
  site: sharedAsk([
    "Carry out the renovation under the Permit to Work.",
    "Project Officer and IFM can stop the work if it does not comply.",
  ]),
  waterproof: sharedAsk([
    "Attend the waterproofing checks with IFM.",
    "Attend the water ponding test with IFM.",
  ]),
  asbuilt: sharedAsk([
    "Upload the as-built drawings in OneCalendar within three weeks of completion.",
  ]),
  defects: sharedAsk([
    "Fix the defects CAG raises before the opening checks.",
  ]),
  poi: sharedAsk([
    "Project Officer schedules Pre-Opening Inspection.",
    "Attend Pre-Opening Inspection at least three days before opening.",
    "IFM signs the Pre-Opening Inspection form.",
    "AES signs the Pre-Opening Inspection form.",
  ]),
};

export function v28SharedFact(card: V26Card): string {
  return FACT[card.id] || v26CardFact(card) || "";
}

/** This reader's move on a Works step. Officers keep the shared fact and If they ask. */
export function v28YourMove(
  cardId: string,
  role: "tenant" | "contractor",
): string | null {
  return ASK[cardId]?.[role] ?? null;
}

export function v28IfTheyAsk(cardId: string): V26TellLine[] | null {
  const row = ASK[cardId];
  if (!row) return null;
  return [
    { who: "Tenant", text: row.tenant },
    { who: "Contractor", text: row.contractor },
  ];
}

export function v28WorksDoorHint(cardId: string): string {
  if (cardId === "apply") return "";
  if (cardId === "exit-works") {
    return "The reinstatement Permit to Work is in Works, along with what to do next.";
  }
  if (cardId === "lease-works") {
    return "The permits for a further renovation are in Works, along with what to do next.";
  }
  return "The permits for this renovation are in Works, along with what to do next.";
}

/** @deprecated Use v28WorksDoorHint(card.id) so opening / later / exit stay distinct. */
export const V28_WORKS_DOOR_HINT = v28WorksDoorHint("opening-works");

export const V28_CHAPTER_LEAD: Record<string, string> = {
  access: "Terminal and unit access.",
  align: "KickOff invite, then the meeting, then written design approval.",
  "take-unit": "Walk the unit, then sign and collect the keys.",
  "opening-works":
    "IFM briefs Contractor, then the permits for this renovation.",
  "after-opening":
    "Fire each year, sales each month, and the account for service reports.",
  "topaz-reports": "Service reports for the rest of the tenancy.",
  "lease-works": "A new renovation, with its own Permit to Work.",
  plan: "The reinstatement pack, then the leave plan.",
  "exit-works": "The reinstatement Permit to Work is in Works.",
  "hand-back": "Inspect, then return the keys.",
};

/** User-facing stretch names. IDs stay setup / build / operate / exit. */
export const V28_PHASE_NAME: Record<V26PhaseId, string> = {
  setup: "Before opening",
  build: "Starting the fit-out",
  operate: "While open",
  exit: "When leaving",
};

export const V28_PHASE_LEAD: Record<V26PhaseId, string> = {
  setup:
    "Terminal and unit access, KickOff, then written design approval.",
  build:
    "Walk the unit and collect the keys, then the briefing and permits for this renovation.",
  operate:
    "Yearly fire and monthly sales, servicing through the tenancy, then a further renovation.",
  exit: "The reinstatement pack, the Permit to Work to remove the fit-out, then hand the unit back.",
};

export function v28PhaseIntro(_role: "tenant" | "contractor" | "officer"): string {
  return "The steps for this unit.";
}

export const V28_WORK_TABS = {
  answers: "Questionnaire",
  pack: "Permits and steps",
  listLabel: "Questionnaire, and permits and steps",
  answersStatus: (
    progress: { answered: number; total: number },
    canWrite: boolean,
    locked: boolean,
  ) => {
    const count = `${progress.answered} of ${progress.total}`;
    if (locked) {
      return {
        chip: "Confirmed",
        tone: "ready" as const,
        body: canWrite
          ? `${count} answered. These set the permits and steps for this renovation.`
          : `${count} answered. Your contractor confirmed them. They set the permits and steps.`,
      };
    }
    if (progress.total > 0 && progress.answered >= progress.total) {
      return {
        chip: `${count} answered`,
        tone: "lock" as const,
        body: canWrite
          ? "Saved. Confirm them so the permits and steps can be acted on."
          : "Waiting for the contractor to confirm them.",
      };
    }
    return {
      chip: `${count} answered`,
      tone: "progress" as const,
      body: canWrite
        ? "Saved as you go. Leave and come back."
        : "Your contractor fills this in.",
    };
  },
  packDraftChip: "Draft",
  packDraft: (done: boolean, canWrite: boolean) => {
    if (done) {
      return canWrite
        ? "These steps are not confirmed yet. Confirm what it involves first."
        : "These steps are not confirmed yet. Waiting for the contractor to confirm them.";
    }
    return canWrite
      ? "These steps may change. Finish and confirm what it involves before anyone acts on them."
      : "These steps may change. Your contractor has not confirmed what it involves yet.";
  },
  lockAnswers: "Confirm These Answers",
  seeNext: "See Permits and Steps",
  continueAnswers: "Continue the Questionnaire",
  packEmpty:
    "Answer the questionnaire first. The permits and steps show here.",
  packContents: "Permits in this submission",
  packContentsWhy: "They go in together.",
  checkPackFiles: "Screen the Files Before You Apply",
  seePackFiles: "See the Files in This Submission",
  applyLead: "Screen the files, then submit in OneCalendar",
} as const;

export type V28PackPhase = "before" | "application" | "after";

/** Sentence-case noun phrase. 2–5 words. Same title on every login. */
const PACK_TITLE: Record<string, string> = {
  jsi: "Joint site inspection",
  hot: "Hot Work permit",
  fai: "Fire alarm isolation permit",
  apply: "Renovation permit pack",
  review: "Permit review",
  "qp-letter": "Letter of undertaking",
  briefing: "IFM site briefing",
  site: "Renovation on site",
  waterproof: "Waterproofing checks",
  asbuilt: "As-built drawings",
  defects: "Defects before opening",
  poi: "Pre-Opening Inspection",
};

/**
 * Process chapter rules: title orients the stretch; lead is not a second card.
 * Never put a pack card title in the chapter title or lead.
 */
export const V28_PACK_PHASE: Record<V28PackPhase, { title: string; why: string }> =
  {
    before: {
      title: "Before You Apply",
      why: "Building Maintenance goes first.",
    },
    application: {
      title: "Applying for permits",
      why: "One submission in OneCalendar.",
    },
    after: {
      title: "Before this unit opens",
      why: "The permit is issued, then the remaining checks.",
    },
  };

function assertPackChapterDoesNotRepeatCardTitle() {
  for (const [phase, row] of Object.entries(V28_PACK_PHASE)) {
    const hay = `${row.title} ${row.why}`.toLowerCase();
    for (const cardTitle of Object.values(PACK_TITLE)) {
      if (hay.includes(cardTitle.toLowerCase())) {
        throw new Error(
          `Works pack chapter "${phase}" repeats card title "${cardTitle}". The header orients the group; the card keeps the sitting name.`,
        );
      }
    }
  }
}
assertPackChapterDoesNotRepeatCardTitle();

const PACK_SOURCE: Record<string, V26Source[]> = {
  apply: [
    {
      stage: "Permit Application",
      step: "Permit Advisory & Tenancy Project Selection",
    },
    {
      stage: "Permit Application",
      step: "Renovation (Terminal) Permit",
    },
  ],
  jsi: [{ stage: "Permit Application", step: "Joint Site Inspection" }],
  hot: [{ stage: "Permit Application", step: "Hotwork Permit" }],
  fai: [
    {
      stage: "Permit Application",
      step: "Fire Alarm Isolation / Sprinkler Draining Permit",
    },
  ],
  review: [
    {
      stage: "Permit Application",
      step: "Multi-Party Review by Changi Airport Group Stakeholders",
    },
  ],
  "qp-letter": [
    {
      stage: "Permit Application",
      step: "Qualified Person Endorsed Letter of Undertaking",
    },
  ],
  briefing: [
    {
      stage: "Renovation",
      step: "Integrated Facilities Management Pre-Renovation Briefing",
    },
  ],
  site: [{ stage: "Renovation", step: "Renovation Works & Site Monitoring" }],
  waterproof: [
    { stage: "Renovation", step: "Waterproofing Checks & Water Ponding Test" },
  ],
  asbuilt: [{ stage: "Renovation", step: "As-Built Drawings Upload" }],
  defects: [{ stage: "Renovation", step: "Defects Rectification" }],
  poi: [{ stage: "Renovation", step: "Pre-Opening Inspection" }],
};

export function v28PackCard(step: V26DraftStep): V26Card {
  return {
    id: step.id,
    title: PACK_TITLE[step.id] ?? step.title,
    kind: "guide",
    sources: step.sources ?? PACK_SOURCE[step.id],
    // Site monitoring inherits every Renovation Works RR row (gas, sprinkler…).
    // Those are other sittings. Keep How early on as-built / POI only.
    hideTimings: step.id === "site",
  };
}

export function v28ApplyCard(title = PACK_TITLE.apply): V26Card {
  return {
    id: "apply",
    title,
    kind: "guide",
    sources: PACK_SOURCE.apply,
  };
}

export function v28PermitVoiceId(permitName: string) {
  if (/hot work/i.test(permitName)) return "hot";
  if (/isolation/i.test(permitName)) return "fai";
  return "apply";
}
