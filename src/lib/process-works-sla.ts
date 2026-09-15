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

export function slaForWorksItem(
  name: string,
  unit: Unit,
  role: Role,
): WorksSla[] {
  if (name === "Joint site inspection") return [toSla(JOINT_SITE)];
  const mapped = CATALOGUE[name];
  if (mapped) {
    return timingsForStep(mapped.stage, mapped.step, unit, role).map(toSla);
  }
  if (ONECALENDAR_DEFAULT.includes(name)) {
    return ptwLead(unit, role).map(toSla);
  }
  return [];
}
