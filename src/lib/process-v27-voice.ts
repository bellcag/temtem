import type { V26Card } from "@/lib/process-v26-guide";
import { v26CardFact, type V26PhaseId, type V26TellLine } from "@/lib/process-v26-guide";

/** One paragraph for every login. What it is for, then who does what on this card. */
const FACT: Record<string, string> = {
  onecalendar:
    "OneCalendar access is terminal and unit access for this renovation. Project Officer creates the unit records, then Contractor applies, and Tenant approves unit access when asked.",
  "kickoff-invite":
    "The KickOff invite is how this unit’s first site meeting is set. Project Officer confirms who must come, then Tenant and Contractor attend.",
  kickoff:
    "KickOff is the first site meeting for this unit. AES and IFM brief site and fire rules against the drawings, then Project Officer records what the room agreed.",
  "design-pack":
    "The design pack is the drawings for this renovation. Tenant sends one pack to Project Officer, then Design Management gives written approval before anyone files a renovation Permit to Work.",
  handover:
    "Handover is the walk of this unit with IFM before renovation starts. Tenant checks the provision list, then signs and collects the keys.",
  "opening-works":
    "Opening Works is the site briefing on the rules before this renovation starts. IFM briefs the renovation team, then Contractor attends.",
  "topaz-account":
    "The TOPAZ account is where this unit’s service reports are lodged. Project Officer creates the account, then Tenant can lodge those reports.",
  "fire-declaration":
    "The yearly fire declaration is the fire safety training and declaration for this unit. Tenant lodges it in the Fire Safety Portal, and AES follows up if it is late.",
  sales:
    "The monthly sales declaration is this unit’s sales for the month. Tenant lodges it in the Lease Management System.",
  servicing:
    "The servicing reports are the service records for this unit. Tenant lodges them in TOPAZ, then IFM approves.",
  "lease-works":
    "Further Works is a renovation after this unit has opened. Contractor starts it in Works and applies for that renovation Permit to Work.",
  "exit-pack":
    "The reinstatement pack is the unit drawings Tenant and Contractor need to remove the fit-out. Project Officer emails it, then Tenant and Contractor receive that set.",
  "exit-works":
    "Exit works is removing the fit-out from this unit. Contractor applies for the reinstatement Permit to Work in OneCalendar.",
  takeover:
    "Takeover is the meeting where Tenant hands the unit back to IFM and both sign the form.",
};

const ASK: Record<string, { tenant: string; contractor: string }> = {
  onecalendar: {
    tenant:
      "You only approve unit access when OneCalendar asks you. Contractor applies; you do not create the account.",
    contractor:
      "Create your account, then apply for terminal and unit access. Tenant approves the unit.",
  },
  "kickoff-invite": {
    tenant:
      "Watch for the KickOff invite from your Project Officer. Bring your consultant and contractor.",
    contractor:
      "Go to KickOff when you receive the invite, and bring the drawings.",
  },
  kickoff: {
    tenant:
      "Bring your consultant, contractor, and drawings. AES and IFM brief the unit.",
    contractor:
      "Bring the drawings. Ask IFM and AES which permits you need.",
  },
  "design-pack": {
    tenant:
      "Send one design pack to your Project Officer. Wait for written approval before anyone files a renovation Permit to Work.",
    contractor:
      "Wait for written approval of the design pack before anyone files a renovation Permit to Work.",
  },
  handover: {
    tenant:
      "Walk the unit, note what does not match, then sign and collect the keys. Raise differences before you sign.",
    contractor:
      "Join the walk if Tenant or IFM invites you. Check the unit against the provision list and raise what does not match before you start work. Tenant signs and collects the keys.",
  },
  "opening-works": {
    tenant:
      "This briefing is for the renovation team. Join if IFM or your Project Officer invites you.",
    contractor:
      "Attend the IFM briefing on site rules before this renovation starts.",
  },
  "topaz-account": {
    tenant:
      "Your Project Officer sets the TOPAZ account up so you can lodge service reports.",
    contractor:
      "TOPAZ service reports sit with Tenant. You do not create the account.",
  },
  "fire-declaration": {
    tenant:
      "Lodge the yearly fire safety training and declaration in the Fire Safety Portal. AES follows up if it is late.",
    contractor:
      "Tenant lodges the yearly fire declaration in the Fire Safety Portal. Help with the training or paperwork if Tenant asks you to.",
  },
  sales: {
    tenant: "Lodge the monthly sales declaration in the Lease Management System.",
    contractor: "Monthly sales sit with Tenant in the Lease Management System.",
  },
  servicing: {
    tenant: "Lodge the service reports for this unit in TOPAZ on schedule.",
    contractor: "Recurring service reports sit with Tenant in TOPAZ.",
  },
  "lease-works": {
    tenant:
      "Contractor starts a further renovation in Works. You can follow that Permit to Work there.",
    contractor: "Start a further renovation in Works. It has its own Permit to Work.",
  },
  "exit-pack": {
    tenant:
      "Your Project Officer emails the reinstatement pack. You receive the drawings you need to remove the fit-out. The drawings from the renovation are a different set.",
    contractor:
      "Your Project Officer emails the reinstatement pack. You receive the drawings you need to remove the fit-out. The drawings from the renovation are a different set.",
  },
  "exit-works": {
    tenant: "Your contractor applies for the reinstatement Permit to Work in OneCalendar. You do not file that permit.",
    contractor:
      "Apply for the reinstatement Permit to Work in OneCalendar before you remove the fit-out.",
  },
  takeover: {
    tenant: "Attend takeover, hand the unit back to IFM, and sign the form.",
    contractor: "Attend takeover. Tenant signs the form with IFM.",
  },
};

export function v27SharedFact(card: V26Card): string {
  return FACT[card.id] || v26CardFact(card) || "";
}

export function v27IfTheyAsk(cardId: string): V26TellLine[] | null {
  const row = ASK[cardId];
  if (!row) return null;
  return [
    { who: "Tenant", text: row.tenant },
    { who: "Contractor", text: row.contractor },
  ];
}

export function v27WorksDoorHint(cardId: string): string {
  if (cardId === "exit-works") {
    return "The reinstatement Permit to Work is in Works, along with what to do next.";
  }
  if (cardId === "lease-works") {
    return "The permits for a further renovation are in Works, along with what to do next.";
  }
  return "The permits for this renovation are in Works, along with what to do next.";
}

/** @deprecated Use v27WorksDoorHint(card.id) so opening / later / exit stay distinct. */
export const V27_WORKS_DOOR_HINT = v27WorksDoorHint("opening-works");

export const V27_CHAPTER_LEAD: Record<string, string> = {
  access: "Terminal and unit access.",
  align: "KickOff invite, then the meeting, then written design approval.",
  "take-unit": "Walk the unit, then sign and collect the keys.",
  "opening-works":
    "IFM briefs the renovation team, then the permits for this renovation.",
  "after-opening":
    "Fire each year, sales each month, and the account for service reports.",
  "topaz-reports": "Service reports for the rest of the tenancy.",
  "lease-works": "A new renovation, with its own Permit to Work.",
  plan: "The reinstatement pack, then the leave plan.",
  "exit-works": "The reinstatement Permit to Work is in Works.",
  "hand-back": "Inspect, then return the keys.",
};

/** User-facing stretch names. IDs stay setup / build / operate / exit. */
export const V27_PHASE_NAME: Record<V26PhaseId, string> = {
  setup: "Before opening",
  build: "Starting the fit-out",
  operate: "While open",
  exit: "When leaving",
};

export const V27_PHASE_LEAD: Record<V26PhaseId, string> = {
  setup:
    "Terminal and unit access, KickOff, then written design approval.",
  build:
    "Walk the unit and collect the keys, then the briefing and permits for this renovation.",
  operate:
    "Yearly fire and monthly sales, servicing through the tenancy, then a further renovation.",
  exit: "The reinstatement pack, the Permit to Work to remove the fit-out, then hand the unit back.",
};

export function v27PhaseIntro(_role: "tenant" | "contractor" | "officer"): string {
  return "The steps for this unit.";
}
