import type { Role } from "@/lib/app-state";
import type { Unit } from "@/lib/tenancy-data";

export type PermitExplain = {
  what: string;
  why: (unit: Unit) => string;
  who: Record<Role, string>;
  otherTerminals?: (unit: Unit) => string | null;
  sampleDocIds: string[];
};

const APPLY = {
  tenant: "Your contractor applies in OneCalendar.",
  contractor: "Apply in OneCalendar.",
  officer: "Check they applied in OneCalendar.",
} as const;

const AES_ISSUES = {
  tenant: "Your contractor applies. AES issues it.",
  contractor: "Apply in OneCalendar. AES issues it.",
  officer: "Check AES issued this permit.",
} as const;

const EXPLAIN: Record<string, PermitExplain> = {
  renovation: {
    what: "The main renovation permit for the unit.",
    why: (unit) => `Every fit-out at ${unit.terminal} needs this.`,
    who: APPLY,
    sampleDocIds: ["doc-method", "doc-hoarding"],
  },
  extra: {
    what: "Works beyond what was already approved.",
    why: (unit) => `Needed at ${unit.terminal} when the job grew.`,
    who: APPLY,
    sampleDocIds: ["doc-method"],
  },
  "hot-work": {
    what: "Welding, cutting, grinding, or an open flame.",
    why: (unit) =>
      `Needed at ${unit.terminal} when those works apply.`,
    who: AES_ISSUES,
    sampleDocIds: ["doc-method"],
  },
  ceiling: {
    what: "Open ceiling panels outside the unit.",
    why: (unit) =>
      `Needed at ${unit.terminal} when you work above the ceiling.`,
    who: APPLY,
    sampleDocIds: ["doc-method"],
  },
  fai: {
    what: "Work that could set off alarms or sprinklers.",
    why: (unit) =>
      `Needed at ${unit.terminal} before you isolate fire systems.`,
    who: AES_ISSUES,
    sampleDocIds: [],
  },
  authority: {
    what: "Approval from a government agency.",
    why: (unit) =>
      `Needed at ${unit.terminal} when an agency must endorse the works.`,
    who: APPLY,
    sampleDocIds: [],
  },
  mep: {
    what: "Electrical, air-con, plumbing, or sprinklers.",
    why: (unit) =>
      `Needed at ${unit.terminal} when you change those systems.`,
    who: APPLY,
    sampleDocIds: ["doc-elec"],
  },
  bim: {
    what: "A 3D model of the fit-out.",
    why: (unit) =>
      unit.terminal === "T3"
        ? "Needed at T3 for larger fit-outs."
        : `Not required at ${unit.terminal}.`,
    otherTerminals: (unit) =>
      unit.terminal === "T3" ? "T1, T2, and T4 do not need BIM." : null,
    who: APPLY,
    sampleDocIds: [],
  },
  "t3-phone": {
    what: "Phone or data lines inside T3.",
    why: (unit) =>
      unit.terminal === "T3"
        ? "Needed at T3 when you add phone or data."
        : `Not used at ${unit.terminal}.`,
    otherTerminals: (unit) =>
      unit.terminal === "T3"
        ? "T1, T2, and T4 use a different cabling request."
        : null,
    who: APPLY,
    sampleDocIds: [],
  },
  "indoor-cabling": {
    what: "Indoor or outdoor data cabling.",
    why: (unit) =>
      `Needed at ${unit.terminal} when you add cabling.`,
    otherTerminals: (unit) =>
      unit.terminal === "T3"
        ? "T3 also needs a telephone cabling permit."
        : null,
    who: APPLY,
    sampleDocIds: [],
  },
  telco: {
    what: "Phone or internet company cabling.",
    why: (unit) =>
      `Needed at ${unit.terminal} when a telco runs cable.`,
    who: APPLY,
    sampleDocIds: [],
  },
  catwalk: {
    what: "Access to the T4 catwalk.",
    why: (unit) =>
      unit.terminal === "T4"
        ? "Needed at T4 for catwalk access."
        : `Not used at ${unit.terminal}.`,
    otherTerminals: (unit) =>
      unit.terminal === "T4"
        ? "T1, T2, and T3 do not use this permit."
        : null,
    who: APPLY,
    sampleDocIds: [],
  },
  skytrain: {
    what: "Work near the Skytrain.",
    why: (unit) =>
      unit.terminal === "T4"
        ? "Not used at T4."
        : `Needed at ${unit.terminal} near the Skytrain.`,
    otherTerminals: (unit) =>
      unit.terminal === "T4" ? null : "T4 has no Skytrain permit.",
    who: APPLY,
    sampleDocIds: [],
  },
  airside: {
    what: "Work on the airside.",
    why: (unit) =>
      unit.zone === "Airside"
        ? `Needed at ${unit.terminal} airside units.`
        : `Not used on ${unit.terminal} landside.`,
    who: APPLY,
    sampleDocIds: [],
  },
  "t4-transit": {
    what: "Security rules in the T4 transit area.",
    why: (unit) =>
      unit.terminal === "T4"
        ? "Needed at T4 transit units."
        : `Not used at ${unit.terminal}.`,
    otherTerminals: (unit) =>
      unit.terminal === "T4"
        ? "T1, T2, and T3 do not use this."
        : null,
    who: APPLY,
    sampleDocIds: [],
  },
};

const ALIAS: Record<string, string> = {
  "Renovation (Terminal) Permit": "renovation",
  "Renovation permit": "renovation",
  "Tenancy Project work": "renovation",
  "Renovation (Terminal – Additional) Permit": "extra",
  "Extra renovation permit": "extra",
  "Hotwork Permit": "hot-work",
  "Hot Work permit": "hot-work",
  "Ceiling Permit": "ceiling",
  "Ceiling permit": "ceiling",
  "Fire Alarm Isolation / Sprinkler Draining Permit": "fai",
  "Fire alarm isolation permit": "fai",
  "Architectural Changes & Authority Approvals": "authority",
  "Authority approvals permit": "authority",
  "MEP Changes Permit": "mep",
  "MEP changes permit": "mep",
  "BIM Model Submission": "bim",
  "BIM model": "bim",
  "Structured Cabling (T3 Tenant Telephone Lines) Permit": "t3-phone",
  "T3 telephone cabling": "t3-phone",
  "Structured Cabling Indoor/Outdoor Permit": "indoor-cabling",
  "Indoor outdoor cabling": "indoor-cabling",
  "Telco Cabling Permit": "telco",
  "Telco cabling permit": "telco",
  "Catwalk Access Permit (Terminal 4)": "catwalk",
  "T4 catwalk access": "catwalk",
  "Skytrain Permit-To-Work": "skytrain",
  "Skytrain permit": "skytrain",
  "Airside Work Permit": "airside",
  "Airside work permit": "airside",
  "T4 Transit Area Security Requirements": "t4-transit",
  "T4 transit security": "t4-transit",
};

export function permitIdFor(name: string): string | null {
  return ALIAS[name] ?? null;
}

export function permitExplainFor(name: string): PermitExplain | null {
  const id = permitIdFor(name);
  return id ? EXPLAIN[id] ?? null : null;
}
