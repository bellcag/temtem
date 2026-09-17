import type { Role } from "@/lib/app-state";
import {
  timingsForStep,
  type GuideTiming,
  type TimingKind,
} from "@/lib/process-rules-v6";
import type { Unit } from "@/lib/tenancy-data";

export type WorksSla = {
  label: string;
  title: string;
  kind: TimingKind;
  /** What the lead time is for — isolation, works start, hot work. */
  about: string;
};

export type PermitSlaGroup = {
  key: string;
  sla: WorksSla;
  names: string[];
};

const CATALOGUE: Record<string, { stage: string; step: string }> = {
  "Extra renovation permit": {
    stage: "Permit Application",
    step: "Submit Combined Permit To Work Application",
  },
  "Tenancy Project work": {
    stage: "Permit Application",
    step: "Submit Combined Permit To Work Application",
  },
  "Fire alarm isolation permit": {
    stage: "Permit Application",
    step: "Fire Alarm Isolation / Sprinkler Draining Permit",
  },
  "Hot Work permit": {
    stage: "Permit Application",
    step: "Hotwork Permit",
  },
  "Skytrain permit": {
    stage: "Permit Application",
    step: "Skytrain Permit-To-Work",
  },
  "T3 telephone cabling": {
    stage: "Permit Application",
    step: "Structured Cabling (T3 Tenant Telephone Lines) Permit",
  },
  "Reinstatement Permit to Work": {
    stage: "Reinstatement",
    step: "Reinstatement Permit Submission via OneCalendar",
  },
  "Structured cabling disconnection": {
    stage: "Reinstatement",
    step: "Takeover Meeting",
  },
  "First design concept": {
    stage: "Pre-Kickoff",
    step: "High-Level Design Review",
  },
  "Fire permit route": {
    stage: "Post-Kickoff",
    step: "Confirm Fire Safety Submission Route",
  },
  "Fire permit assessment": {
    stage: "Renovation",
    step: "QP Assessment: FSC / MAA / Temporary Fire Permit",
  },
  "Qualified Person letter": {
    stage: "Permit Application",
    step: "Qualified Person Endorsed Letter of Undertaking",
  },
  "BIM model": {
    stage: "Permit Application",
    step: "BIM Model Submission",
  },
  "FSSD notice of approval": {
    stage: "Renovation",
    step: "FSSD Notice of Approval Submission",
  },
  "Opening FSSD notice": {
    stage: "Opening",
    step: "FSSD Notice of Approval Submission",
  },
  "Waterproofing and ponding": {
    stage: "Renovation",
    step: "Waterproofing Checks & Water Ponding Test",
  },
  "Fire safety certificate": {
    stage: "Renovation",
    step: "Fire Safety Certificate / MAA / Temporary Fire Permit Submission",
  },
};

const ONECALENDAR_DEFAULT = [
  "Ceiling permit",
  "MEP changes permit",
  "Authority approvals permit",
  "Indoor outdoor cabling",
  "Telco cabling permit",
  "T4 catwalk access",
  "Airside work permit",
];

/** Sourced prerequisite — not a numbered CAG review SLA. */
const QUALITATIVE: Record<string, GuideTiming> = {
  "First design concept": {
    kind: "lead",
    duration: "Before you apply",
    binds: "contractor",
    cite: "RR 3.6.5",
    text: {
      tenant:
        "Wait for written design clearance before your contractor applies.",
      contractor: "Wait for written design clearance before you apply.",
      officer: "Permits wait on written design clearance.",
    },
  },
  "Fire permit route": {
    kind: "lead",
    duration: "Before you lock the pack",
    binds: "contractor",
    cite: "RR 5.9",
    text: {
      tenant:
        "Your contractor’s Qualified Person confirms the fire route before the pack is locked.",
      contractor:
        "Confirm the fire route with your Qualified Person before you lock the pack.",
      officer: "Check the fire route is named before the pack is locked.",
    },
  },
  "Qualified Person letter": {
    kind: "lead",
    duration: "Before permit review",
    binds: "contractor",
    cite: "RR 3.1(v)",
    text: {
      tenant: "Your contractor emails the QP letter before permit review.",
      contractor: "Email the QP letter before permit review.",
      officer: "Check the QP letter is in before permit review.",
    },
  },
  "BIM model": {
    kind: "lead",
    duration: "With the permit pack",
    binds: "contractor",
    cite: "RR 3.7",
    text: {
      tenant: "Your contractor submits the BIM model with the pack when it applies.",
      contractor: "Submit the BIM model with the pack when it applies.",
      officer: "Check the BIM model is in with the pack when it applies.",
    },
  },
  "Fire safety certificate": {
    kind: "lead",
    duration: "Before opening",
    binds: "contractor",
    cite: "RR 5.9.8(i)",
    text: {
      tenant: "Have the fire permit in hand before opening.",
      contractor: "Have the fire permit in hand before opening.",
      officer: "Check the fire permit is in hand before opening.",
    },
  },
};

/** Sourced prerequisite — not a numbered CAG review SLA. */
const JOINT_SITE: GuideTiming = {
  kind: "lead",
  duration: "Before works are endorsed",
  binds: "contractor",
  cite: "RR 5.4.2(ii)",
  text: {
    tenant:
      "Your contractor books the joint site inspection before isolation or roof work can be endorsed. Isolation will not be approved without it.",
    contractor:
      "Book the joint site inspection before isolation or roof work. Isolation will not be approved without it.",
    officer:
      "Check the joint site inspection is booked before isolation or roof work is endorsed. You cannot waive it for urgency.",
  },
};

function slaAbout(duration: string): string {
  const before = duration.match(/\bbefore\s+(.+)$/i);
  if (before) return before[1];
  const after = duration.match(/\bafter\s+(.+)$/i);
  if (after) return after[1];
  return "";
}

function slaLabel(duration: string, kind: TimingKind): string {
  if (/^before\b/i.test(duration)) return duration;
  if (kind === "lead" && /\bbefore\b/i.test(duration)) {
    return duration.replace(/\s+before\s+.+$/i, " before").trim();
  }
  if (kind === "lead" && /\bafter\b/i.test(duration)) {
    return duration.replace(/\s+after\s+.+$/i, " after").trim();
  }
  return duration;
}

function slaTitle(row: GuideTiming): string {
  if (/^before\b/i.test(row.duration)) return row.duration;
  if (row.kind === "lead" && /\bbefore\b/i.test(row.duration)) {
    return `Apply at least ${row.duration}. This is lead time to apply, not CAG review time.`;
  }
  return row.duration;
}

function toSla(row: GuideTiming): WorksSla {
  return {
    label: slaLabel(row.duration, row.kind),
    title: slaTitle(row),
    kind: row.kind,
    about: slaAbout(row.duration),
  };
}

function ptwLead(unit: Unit, role: Role): GuideTiming[] {
  return timingsForStep(
    "Permit Application",
    "Submit Combined Permit To Work Application",
    unit,
    role,
  );
}

function slaRank(label: string): number {
  const weeks = label.match(/(\d+)\s*weeks?/i);
  if (weeks) return Number(weeks[1]) * 5;
  const working = label.match(/(\d+)\s*working\s+days?/i);
  if (working) return Number(working[1]);
  const days = label.match(/(\d+)\s*days?/i);
  if (days) return Number(days[1]);
  return 0;
}

/** Longest apply-by in a OneCalendar pack — that date governs the submission. */
export function governingSlaForPermits(
  names: string[],
  unit: Unit,
  role: Role,
): WorksSla | null {
  let best: WorksSla | null = null;
  let bestRank = -1;
  for (const name of names) {
    for (const row of slaForWorksItem(name, unit, role)) {
      const rank = slaRank(row.label);
      if (rank > bestRank) {
        best = row;
        bestRank = rank;
      }
    }
  }
  return best;
}

export function packSlasForPermits(
  names: string[],
  unit: Unit,
  role: Role,
): WorksSla[] {
  const seen = new Set<string>();
  const out: WorksSla[] = [];
  for (const name of names) {
    for (const row of slaForWorksItem(name, unit, role)) {
      if (seen.has(row.label)) continue;
      seen.add(row.label);
      out.push(row);
    }
  }
  return out.sort((a, b) => slaRank(b.label) - slaRank(a.label));
}

const PACK_FALLBACK: WorksSla = {
  label: "With the pack",
  title: "No separate apply-by — submit with the Tenancy Project application.",
  kind: "lead",
  about: "this pack",
};

export function groupPermitsBySla(
  names: string[],
  unit: Unit,
  role: Role,
): PermitSlaGroup[] {
  const map = new Map<string, PermitSlaGroup>();
  for (const name of names) {
    const rows = slaForWorksItem(name, unit, role);
    const sla =
      rows.slice().sort((a, b) => slaRank(b.label) - slaRank(a.label))[0] ??
      PACK_FALLBACK;
    const key = sla.label;
    const existing = map.get(key);
    if (existing) {
      existing.names.push(name);
    } else {
      map.set(key, { key, sla, names: [name] });
    }
  }
  return [...map.values()].sort(
    (a, b) => slaRank(b.sla.label) - slaRank(a.sla.label),
  );
}

export function slaForWorksItem(
  name: string,
  unit: Unit,
  role: Role,
): WorksSla[] {
  if (name === "Joint site inspection") return [toSla(JOINT_SITE)];
  const mapped = CATALOGUE[name];
  if (mapped) {
    const rows = timingsForStep(mapped.stage, mapped.step, unit, role).map(toSla);
    if (rows.length > 0) return rows;
  }
  if (ONECALENDAR_DEFAULT.includes(name)) {
    return ptwLead(unit, role).map(toSla);
  }
  const qualitative = QUALITATIVE[name];
  return qualitative ? [toSla(qualitative)] : [];
}
