import type { Role } from "@/lib/app-state";
import { UNITS, type Unit } from "@/lib/tenancy-data";

export const LS_JOB = "tempo:v7:job";
export const LS_OUTLET = "tempo:v7:outlet";

export type ContractorJob = {
  id: string;
  label: string;
  unit: Unit;
  appointed: boolean;
  kickoffSoon?: boolean;
};

export const CONTRACTOR_JOBS: ContractorJob[] = [
  {
    id: "job-kopi-t3",
    label: "Kopi & Co. · T3-AS-114",
    unit: UNITS[0],
    appointed: true,
  },
  {
    id: "job-kopi-t2",
    label: "Kopi & Co. · T2-AS-045",
    unit: UNITS[2],
    appointed: true,
    kickoffSoon: true,
  },
  {
    id: "job-watch-t2",
    label: "The Watch Boutique · A1-22",
    unit: {
      id: "wb-a122",
      unitNo: "A1-22",
      terminal: "T2",
      tenancyType: "Retail",
      zone: "Airside",
      company: "The Watch Boutique",
    },
    appointed: true,
  },
  {
    id: "job-pending-t2",
    label: "Pending appointment · T2-AS-045",
    unit: UNITS[2],
    appointed: false,
  },
];

export function readSavedJobId(): string {
  try {
    const saved = window.localStorage.getItem(LS_JOB);
    if (saved && CONTRACTOR_JOBS.some((j) => j.id === saved)) return saved;
  } catch {
    /* ignore */
  }
  return CONTRACTOR_JOBS[0].id;
}

export function writeSavedJobId(id: string) {
  window.localStorage.setItem(LS_JOB, id);
}

export function jobById(id: string): ContractorJob {
  return CONTRACTOR_JOBS.find((j) => j.id === id) ?? CONTRACTOR_JOBS[0];
}

/** Tenant / officer: KickOff is soon if an appointed job on this unit says so. */
export function kickoffSoonForUnit(unit: Unit): boolean {
  return CONTRACTOR_JOBS.some(
    (job) => job.appointed && job.kickoffSoon && job.unit.id === unit.id,
  );
}

export function unitJobLabel(unit: Unit): string {
  const company = unit.company.replace(/\s+Pte Ltd$/i, "");
  return `${company} · ${unit.unitNo}`;
}

export function resolveProcessUnit(
  role: Role,
  {
    unit,
    effectiveUnit,
    jobId,
  }: {
    unit: Unit;
    effectiveUnit: Unit | null;
    jobId?: string | null;
  },
): Unit {
  if (role === "contractor") return jobById(jobId ?? readSavedJobId()).unit;
  if (role === "officer") return effectiveUnit ?? unit;
  return unit;
}
