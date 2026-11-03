import type { Role } from "@/lib/app-state";
import {
  EMPTY_ANSWERS,
  type QuizState,
} from "@/lib/process-planned-works-quiz";
import { UNITS, type Unit } from "@/lib/tenancy-data";
import type { V26Work } from "@/lib/process-v26-works";
import { v28FullRenovationQuiz } from "@/lib/process-v28-seed";
import {
  readV28Screen,
  resetV28PackState,
  writeV28Submitted,
} from "@/lib/process-v28-screener";
import { usesV37Cut } from "@/lib/process-v31-preview";
import { reopenV31Work } from "@/lib/process-v31-works";
import {
  v28WorkReadiness,
  type V28WorkReadiness,
} from "@/lib/process-v28-readiness";

export type V37TenantId = "lagardere" | "outgoing";
export type V37ContractorId = "buildright" | "aeromaintain";

export type V37Tenancy = {
  id: string;
  tenantId: V37TenantId;
  tenantName: string;
  outlet: string;
  unitId: string;
  unitNo: string;
  side: "joining" | "leaving";
};

export type V37Work = V26Work & { tenancyId: string };

const TENANT_KEY = "tempo:v37:tenant";
const CONTRACTOR_KEY = "tempo:v37:contractor";
const STORE_KEY = "tempo:v37:projects";
export const V37_CHANGED = "tempo:v37:projects";

export const V37_TENANCIES: V37Tenancy[] = [
  {
    id: "tory",
    tenantId: "lagardere",
    tenantName: "Lagardère",
    outlet: "Tory Burch",
    unitId: "u-301",
    unitNo: "T3-AS-114",
    side: "joining",
  },
  {
    id: "discover",
    tenantId: "lagardere",
    tenantName: "Lagardère",
    outlet: "Discover Singapore",
    unitId: "u-302",
    unitNo: "T3-AS-208",
    side: "joining",
  },
  {
    id: "kopi-leave",
    tenantId: "outgoing",
    tenantName: "Kopi & Co. Pte Ltd",
    outlet: "Kopi & Co.",
    unitId: "u-301",
    unitNo: "T3-AS-114",
    side: "leaving",
  },
];

const CONTRACTOR_NAME: Record<V37ContractorId, string> = {
  buildright: "BuildRight Contractors Pte Ltd",
  aeromaintain: "AeroMaintain Pte Ltd",
};

export function v37Tenancy(id: string) {
  return V37_TENANCIES.find((row) => row.id === id) ?? null;
}

export function v37TenanciesOnUnit(unitId: string) {
  return V37_TENANCIES.filter((row) => row.unitId === unitId);
}

export function v37UnitOptions() {
  const seen = new Set<string>();
  const options: { id: string; label: string }[] = [];
  for (const row of V37_TENANCIES) {
    if (seen.has(row.unitId)) continue;
    seen.add(row.unitId);
    options.push({ id: row.unitId, label: row.unitNo });
  }
  return options;
}

export function v37UnitById(unitId: string): Unit | null {
  return UNITS.find((row) => row.id === unitId) ?? null;
}

export function captureV37Actor(search: string) {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(search);
  const tenant = params.get("tenant");
  const contractor = params.get("contractor");
  if (tenant === "lagardere" || tenant === "outgoing") {
    window.localStorage.setItem(TENANT_KEY, tenant);
  }
  if (contractor === "buildright" || contractor === "aeromaintain") {
    window.localStorage.setItem(CONTRACTOR_KEY, contractor);
  }
}

export function v37TenantId(): V37TenantId {
  try {
    const saved = window.localStorage.getItem(TENANT_KEY);
    if (saved === "outgoing") return "outgoing";
  } catch {
    /* ignore */
  }
  return "lagardere";
}

export function v37ContractorId(): V37ContractorId {
  try {
    const saved = window.localStorage.getItem(CONTRACTOR_KEY);
    if (saved === "aeromaintain") return "aeromaintain";
  } catch {
    /* ignore */
  }
  return "buildright";
}

export function v37SignedInLabel(role: Role) {
  if (role === "tenant") {
    return v37TenantId() === "outgoing" ? "Kopi & Co. Pte Ltd" : "Lagardère";
  }
  if (role === "contractor") return CONTRACTOR_NAME[v37ContractorId()];
  return null;
}

export function v37UnitsForTenant(tenantId = v37TenantId()): Unit[] {
  const ids = new Set(
    V37_TENANCIES.filter((row) => row.tenantId === tenantId).map((row) => row.unitId),
  );
  return UNITS.filter((row) => ids.has(row.id));
}

export function v37OutletLabel(unitId: string, tenantId = v37TenantId()) {
  const row = V37_TENANCIES.find(
    (tenancy) => tenancy.unitId === unitId && tenancy.tenantId === tenantId,
  );
  return row ? `${row.outlet} · ${row.unitNo}` : unitId;
}

function choice(value: string) {
  return { kind: "choice" as const, value };
}

function seedQuiz(
  name: string,
  about: string,
  unitId: string,
  tenancyId: string,
): QuizState {
  return {
    status: "paused",
    confirmed: false,
    answers: {
      ...EMPTY_ANSWERS,
      "q-name": choice(name),
      "q-about": choice(about),
      "q-unit": choice(unitId),
      "q-tenancy": choice(tenancyId),
    } as QuizState["answers"],
  };
}

function seedWork(
  id: string,
  tenancyId: string,
  contractorId: V37ContractorId,
  name: string,
  about: string,
  createdAt: string,
): V37Work {
  const tenancy = v37Tenancy(tenancyId)!;
  return {
    id,
    unitId: tenancy.unitId,
    tenancyId,
    title: name,
    createdAt,
    contractorId,
    contractorName: CONTRACTOR_NAME[contractorId],
    quiz: seedQuiz(name, about, tenancy.unitId, tenancyId),
  };
}

function seedFullRenovation(): V37Work {
  const tenancy = v37Tenancy("tory")!;
  const unit = v37UnitById(tenancy.unitId)!;
  const quiz = v28FullRenovationQuiz(unit);
  const answers = {
    ...quiz.answers,
    "q-name": choice("Full Renovation"),
    "q-about": choice("Refit the whole store for the new brand look."),
    "q-unit": choice(tenancy.unitId),
    "q-tenancy": choice(tenancy.id),
  } as QuizState["answers"];
  return {
    id: "v37-tory-full",
    unitId: tenancy.unitId,
    tenancyId: tenancy.id,
    title: "Full Renovation",
    createdAt: "2026-10-12T09:00:00.000Z",
    contractorId: "buildright",
    contractorName: CONTRACTOR_NAME.buildright,
    quiz: { ...quiz, answers, confirmed: true, status: "done" },
  };
}

function seedProjects(): V37Work[] {
  return [
    seedFullRenovation(),
    seedWork(
      "v37-tory-open",
      "tory",
      "buildright",
      "Tory Burch opening",
      "Fit-out for the new Tory Burch outlet.",
      "2026-10-02T09:00:00.000Z",
    ),
    seedWork(
      "v37-tory-light",
      "tory",
      "buildright",
      "Tory Burch lighting",
      "Lighting works for the Tory Burch shopfront.",
      "2026-10-08T09:00:00.000Z",
    ),
    seedWork(
      "v37-discover",
      "discover",
      "aeromaintain",
      "Discover Singapore opening",
      "Fit-out for the Discover Singapore outlet.",
      "2026-10-04T09:00:00.000Z",
    ),
    seedWork(
      "v37-kopi-leave",
      "kopi-leave",
      "buildright",
      "Kopi & Co. handover",
      "Strip out the fit-out before leaving.",
      "2026-09-20T09:00:00.000Z",
    ),
  ];
}

function readStore(): V37Work[] {
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return seedProjects();
    const parsed = JSON.parse(raw) as V37Work[];
    return Array.isArray(parsed) ? parsed : seedProjects();
  } catch {
    return seedProjects();
  }
}

export function readV37Works(): V37Work[] {
  const rows = readStore();
  if (!window.localStorage.getItem(STORE_KEY)) {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(rows));
    const full = rows.find((row) => row.id === "v37-tory-full");
    if (full) {
      resetV28PackState(full.unitId, full.id);
      writeV28Submitted(full.unitId, full.id, false);
      reopenV31Work(full.unitId, full.id);
    }
  }
  return rows;
}

/** One unscoping project — the contractor’s first job, not a finished fit-out. */
export function v37FirstProjectWork(role: Role): V37Work {
  const outgoing = role === "tenant" && v37TenantId() === "outgoing";
  const tenancyId = outgoing ? "kopi-leave" : "tory";
  const contractorId: V37ContractorId =
    role === "contractor" ? v37ContractorId() : "buildright";
  const tenancy = v37Tenancy(tenancyId)!;
  return {
    id: "v37-first",
    unitId: tenancy.unitId,
    tenancyId,
    title: "New Project",
    createdAt: new Date().toISOString(),
    contractorId,
    contractorName: CONTRACTOR_NAME[contractorId],
    quiz: {
      status: "idle",
      confirmed: false,
      answers: { ...EMPTY_ANSWERS },
    },
  };
}

export function writeV37Works(rows: V37Work[]) {
  window.localStorage.setItem(STORE_KEY, JSON.stringify(rows));
  window.dispatchEvent(new CustomEvent(V37_CHANGED));
}

export function v37WorkVisible(work: V26Work, role: Role) {
  const row = work as V37Work;
  if (role === "officer") return true;
  if (role === "contractor") return row.contractorId === v37ContractorId();
  const tenancy = v37Tenancy(row.tenancyId);
  return tenancy?.tenantId === v37TenantId();
}

export function v37VisibleWorks(role: Role): V37Work[] {
  return readV37Works()
    .filter((row) => v37WorkVisible(row, role))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function v37WorkById(id: string | null): V37Work | null {
  if (!id) return null;
  return readV37Works().find((row) => row.id === id) ?? null;
}

export function v37Meta(work: V26Work) {
  const row = work as V37Work;
  const tenancy = v37Tenancy(row.tenancyId);
  const unit = v37UnitById(row.unitId);
  return {
    tenantName: tenancy?.tenantName ?? "",
    outlet: tenancy?.outlet ?? "",
    unitNo: tenancy?.unitNo ?? unit?.unitNo ?? "",
    tenancyId: row.tenancyId ?? "",
  };
}

export function v37ApplyAnswers(work: V37Work, quiz: QuizState): V37Work {
  const answers = quiz.answers as Record<string, { kind: string; value?: string }>;
  const unitId =
    answers["q-unit"]?.kind === "choice" && answers["q-unit"].value
      ? answers["q-unit"].value
      : work.unitId;
  const onUnit = v37TenanciesOnUnit(unitId);
  const picked =
    answers["q-tenancy"]?.kind === "choice" ? answers["q-tenancy"].value : "";
  const tenancyId = onUnit.some((row) => row.id === picked)
    ? picked!
    : onUnit.length === 1
      ? onUnit[0].id
      : "";
  const name =
    answers["q-name"]?.kind === "choice" ? answers["q-name"].value?.trim() : "";
  return {
    ...work,
    unitId: unitId || work.unitId,
    tenancyId,
    title: name || work.title,
    quiz,
  };
}

export function saveV37Work(next: V37Work) {
  const rows = readV37Works();
  const has = rows.some((row) => row.id === next.id);
  writeV37Works(has ? rows.map((row) => (row.id === next.id ? next : row)) : [next, ...rows]);
  return next;
}

export function v37StartProject(): V37Work {
  const contractorId = v37ContractorId();
  const createdAt = new Date().toISOString();
  const work: V37Work = {
    id: `v37-${Date.now()}`,
    unitId: "",
    tenancyId: "",
    title: "New Project",
    createdAt,
    contractorId,
    contractorName: CONTRACTOR_NAME[contractorId],
    quiz: {
      status: "idle",
      confirmed: false,
      answers: { ...EMPTY_ANSWERS },
    },
  };
  saveV37Work(work);
  return work;
}

export function v37OnPath() {
  return typeof window !== "undefined" && usesV37Cut(window.location.pathname);
}

/** The signed-in contractor sees their own rows. Everyone else sees the outlet’s contractor. */
export function v37StampWork(work: V26Work, role: Role, tenancyId?: string): V37Work {
  const tenancy =
    (tenancyId ? V37_TENANCIES.find((row) => row.id === tenancyId) : null) ??
    V37_TENANCIES.find((row) => row.unitId === work.unitId && row.side === "joining") ??
    V37_TENANCIES[0];
  const contractorId: V37ContractorId =
    role === "contractor"
      ? v37ContractorId()
      : tenancy.id === "discover"
        ? "aeromaintain"
        : "buildright";
  const answers = { ...(work.quiz?.answers ?? {}) } as QuizState["answers"];
  if (answers["q-unit"]) answers["q-unit"] = choice(tenancy.unitId);
  if (answers["q-tenancy"]) answers["q-tenancy"] = choice(tenancy.id);
  return {
    ...work,
    unitId: tenancy.unitId,
    tenancyId: tenancy.id,
    contractorId,
    contractorName: CONTRACTOR_NAME[contractorId],
    quiz: work.quiz ? { ...work.quiz, answers } : work.quiz,
  };
}

export function v37SeedWorks(): V37Work[] {
  return seedProjects();
}

export type V37ChipTone = "grey" | "orange" | "blue" | "green" | "red";

/** Runway Status Chip colours, Solid Rect. */
export const V37_CHIP_TONE: Record<V37ChipTone, string> = {
  grey: "bg-grey-100 text-grey-700",
  orange: "bg-warning-200 text-warning-600",
  blue: "bg-[var(--color-info-bg)] text-[#254687]",
  green: "bg-success-200 text-success-600",
  red: "bg-error-200 text-error-600",
};

export const V37_STATUS = {
  new: "New",
  scoping: "Filling Scope of Work",
  draft: "Screening in Draft",
  running: "Screening in Progress",
  passed: "Screening Passed",
  failed: "Screening Failed",
  error: "Screening Error",
  noPermit: "No Permit Required",
  downloaded: "Package Downloaded",
} as const;

export function v37IsNoPermit(ready: V28WorkReadiness) {
  return (
    ready.chip === "No permits" ||
    /nothing to (apply|take)/i.test(ready.stepMove ?? ready.nextMove)
  );
}

/** Status chip for the v37 list. Package Downloaded and No Permit Required sit in Past. */
export function v37ListStatus(
  work: V26Work,
  _ready: V28WorkReadiness,
  _role: Role,
  unit: Unit,
): { label: string; tone: V37ChipTone; past: boolean } {
  const ready = v28WorkReadiness(work, unit, "contractor", "v35");
  const screen = readV28Screen(unit.id, work.id).result;
  if (ready.chip === "Complete") {
    return { label: V37_STATUS.downloaded, tone: "green", past: true };
  }
  if (v37IsNoPermit(ready)) {
    return { label: V37_STATUS.noPermit, tone: "grey", past: true };
  }
  if (ready.step === "answers") {
    const answered = Number(ready.countLabel?.match(/^(\d+)/)?.[1] ?? 0);
    return {
      label: answered > 0 ? V37_STATUS.scoping : V37_STATUS.new,
      tone: "grey",
      past: false,
    };
  }
  if (screen === "running") {
    return { label: V37_STATUS.running, tone: "blue", past: false };
  }
  if (screen === "issues") {
    return { label: V37_STATUS.failed, tone: "red", past: false };
  }
  if (screen === "error") {
    return { label: V37_STATUS.error, tone: "red", past: false };
  }
  if (screen === "pass") {
    return { label: V37_STATUS.passed, tone: "green", past: false };
  }
  return { label: V37_STATUS.draft, tone: "orange", past: false };
}
