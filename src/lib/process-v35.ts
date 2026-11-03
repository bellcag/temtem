import type { Role } from "@/lib/app-state";
import { CONTRACTOR, type Unit } from "@/lib/tenancy-data";
import type { V26Work } from "@/lib/process-v26-works";
import { v28WorkReadiness, type V28ChipTone, type V28WorkReadiness } from "@/lib/process-v28-readiness";
import { readV28Screen } from "@/lib/process-v28-screener";
import { cutWorksHref, usesV37Cut } from "@/lib/process-v31-preview";

export const V35_SELF_CONTRACTOR_ID = "buildright";
export const V35_OTHER_CONTRACTOR_ID = "aeromaintain";

export const V35_CONTRACTORS: Record<
  string,
  { id: string; name: string }
> = {
  [V35_SELF_CONTRACTOR_ID]: {
    id: V35_SELF_CONTRACTOR_ID,
    name: CONTRACTOR.company,
  },
  [V35_OTHER_CONTRACTOR_ID]: {
    id: V35_OTHER_CONTRACTOR_ID,
    name: "AeroMaintain Pte Ltd",
  },
};

/** Prototype “today” so 90-day archive is visible against seeded dates. */
export const V35_TODAY = "2026-10-13T00:00:00.000Z";
export const V35_ARCHIVE_AFTER_MS = 90 * 24 * 60 * 60 * 1000;

/** Bump the suffix when the first-visit banner should show again after an earlier dismiss. */
export const V35_INTRO_KEY = "tempo:v35:projects-intro-dismissed-2";

export type V35StatusId =
  | "scope"
  | "steps-first"
  | "add-documents"
  | "ready-to-check"
  | "needs-fixes"
  | "ready-to-submit"
  | "opening"
  | "no-permit"
  | "waiting"
  | "completed";

export type V35Status = {
  id: V35StatusId;
  label: string;
  tone: V28ChipTone;
};

const TONE: Record<V35StatusId, V28ChipTone> = {
  scope: "draft",
  "steps-first": "action",
  "add-documents": "action",
  "ready-to-check": "action",
  "needs-fixes": "action",
  "ready-to-submit": "ready",
  opening: "action",
  "no-permit": "quiet",
  waiting: "quiet",
  completed: "ready",
};

const LABEL: Record<V35StatusId, string> = {
  scope: "Scoping",
  "steps-first": "In progress",
  "add-documents": "In progress",
  "ready-to-check": "In progress",
  "needs-fixes": "In progress",
  "ready-to-submit": "Ready to submit",
  opening: "In progress",
  "no-permit": "No permit needed",
  waiting: "Waiting on contractor",
  completed: "Completed",
};

export function v35StatusOf(
  ready: V28WorkReadiness,
  role: Role,
): V35Status {
  const id = v35StatusId(ready, role);
  return { id, label: LABEL[id], tone: TONE[id] };
}

function v35StatusId(ready: V28WorkReadiness, _role: Role): V35StatusId {
  if (
    ready.chip === "Complete" &&
    typeof window !== "undefined" &&
    usesV37Cut(window.location.pathname)
  ) {
    return "completed";
  }
  if (
    /nothing to apply/i.test(ready.stepMove ?? ready.nextMove) ||
    ready.chip === "No permits"
  ) {
    return "no-permit";
  }
  if (ready.step === "answers") return "scope";

  const move = (ready.stepMove ?? ready.nextMove).toLowerCase();

  if (move.includes("fix")) return "needs-fixes";
  if (move.includes("screen")) return "ready-to-check";
  if (
    ready.step === "next" ||
    move.includes("onecalendar") ||
    move.includes("download") ||
    ready.chip === "Complete"
  ) {
    return "ready-to-submit";
  }
  if (
    ready.step === "pack" ||
    ready.applyTo === "checklist" ||
    ready.applyTo === "upload" ||
    move.includes("upload")
  ) {
    return "add-documents";
  }
  if (move.includes("submit") || ready.applyTo === "results") return "ready-to-submit";
  return "add-documents";
}

export function v35IsPast(ready: V28WorkReadiness, role: Role) {
  if (typeof window !== "undefined" && usesV37Cut(window.location.pathname)) {
    return (
      ready.chip === "Complete" ||
      ready.chip === "No permits" ||
      /nothing to (apply|take)/i.test(ready.stepMove ?? ready.nextMove)
    );
  }
  const id = v35StatusOf(ready, role).id;
  return id === "ready-to-submit" || id === "no-permit";
}

export function v35OpensCheck(status: V35Status) {
  return (
    status.id === "ready-to-check" ||
    status.id === "needs-fixes" ||
    status.id === "ready-to-submit" ||
    status.id === "waiting"
  );
}

/** Where a project opens, for every role. The status label can differ; the page is the next action. */
export function v35OpenParams(work: V26Work, unit: Unit, role: Role) {
  const ready = v28WorkReadiness(work, unit, role, "v35");
  const params = new URLSearchParams();
  params.set("work", work.id);
  if (typeof window !== "undefined" && usesV37Cut(window.location.pathname)) {
    const home = work.unitId || unit.id;
    if (readV28Screen(home, work.id).result === "running") {
      params.set("tab", "pack");
      params.set("apply", "screen");
      return params;
    }
    params.set("tab", "answers");
    params.set("result", "scope");
    return params;
  }
  if (ready.step === "answers") return params;
  const status = v35StatusId(ready, role);
  if (status === "no-permit") {
    params.set("tab", "answers");
    params.set("result", "scope");
    return params;
  }
  const screen = readV28Screen(unit.id, work.id);
  params.set("tab", "pack");
  if (screen.result === "issues" || screen.result === "pass") {
    params.set("apply", "results");
  } else if (screen.result === "error" || screen.result === "running") {
    params.set("apply", "screen");
  } else if (ready.applyTo) {
    params.set("apply", ready.applyTo);
  } else {
    params.set("apply", "checklist");
  }
  return params;
}

export function v35WorkHref(pathname: string, work: V26Work, unit: Unit, role: Role) {
  return `${cutWorksHref(pathname)}?${v35OpenParams(work, unit, role).toString()}`;
}

export function v35ContractorOf(work: V26Work): {
  id: string;
  name: string;
} {
  if (work.contractorId && V35_CONTRACTORS[work.contractorId]) {
    return V35_CONTRACTORS[work.contractorId];
  }
  if (work.contractorName) {
    return {
      id: work.contractorId ?? V35_SELF_CONTRACTOR_ID,
      name: work.contractorName,
    };
  }
  const other =
    /kiosk|signage|ceiling/i.test(work.title) ||
    work.id.includes("v34-scope-none");
  return other
    ? V35_CONTRACTORS[V35_OTHER_CONTRACTOR_ID]
    : V35_CONTRACTORS[V35_SELF_CONTRACTOR_ID];
}

export function v35WorkVisible(work: V26Work, role: Role) {
  if (role !== "contractor") return true;
  return v35ContractorOf(work).id === V35_SELF_CONTRACTOR_ID;
}

export function v35CanStart(role: Role) {
  return role === "contractor";
}

export function v35CanWrite(role: Role) {
  return role === "contractor";
}

export function v35CanArchive(role: Role) {
  return role === "contractor" || role === "tenant" || role === "officer";
}

export function v35CanDelete(role: Role) {
  return role === "contractor";
}

export function v35FormatDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function v35ShouldAutoArchive(ready: V28WorkReadiness, createdAt: string) {
  const status = v35StatusOf(ready, "contractor");
  if (status.id !== "ready-to-submit" && status.id !== "no-permit") {
    return false;
  }
  const created = new Date(createdAt).getTime();
  const today = new Date(V35_TODAY).getTime();
  if (Number.isNaN(created) || Number.isNaN(today)) return false;
  return today - created >= V35_ARCHIVE_AFTER_MS;
}

export function readV35IntroDismissed() {
  try {
    return window.localStorage.getItem(V35_INTRO_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeV35IntroDismissed() {
  window.localStorage.setItem(V35_INTRO_KEY, "1");
}
