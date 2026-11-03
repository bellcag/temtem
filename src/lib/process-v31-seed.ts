import type { Role } from "@/lib/app-state";
import type { Unit } from "@/lib/tenancy-data";
import { readV26Works, writeV26Works, type V26Work } from "@/lib/process-v26-works";
import {
  applyV28WorksStory,
  applyV31LifespanStory,
  applyV31StatusCatalog,
  applyV34ScopeFullProject,
  applyV34ScopeMixedProject,
  applyV34ScopeNoneProject,
  applyV35ArchiveStory,
  ensureV31StatusCatalog,
  readV28WorksStory,
  writeV28WorksStory,
} from "@/lib/process-v28-seed";
import { copyV28PackState } from "@/lib/process-v28-screener";
import {
  completeV31Work,
  readV31Archived,
  readV31Completed,
  resetV31ListState,
  setV31Archived,
  writeV31Completed,
} from "@/lib/process-v31-works";
import { usesV37Cut } from "@/lib/process-v31-preview";
import { V35_INTRO_KEY } from "@/lib/process-v35";
import {
  v37FirstProjectWork,
  v37StampWork,
  v37TenantId,
  v37UnitById,
  writeV37Works,
  V37_TENANCIES,
} from "@/lib/process-v37";

export type V31WorksStory =
  | "busy"
  | "lifespan"
  | "first"
  | "exit"
  | "scope-full"
  | "scope-mixed"
  | "scope-none"
  | "archive"
  | "intro"
  | "past";

export const V31_WORKS_STORY_KEY = "tempo:v31:works-story";
export const V31_WORKS_STORY_CHANGED = "tempo:v31:works-story";

export const V31_WORKS_STORIES: { id: V31WorksStory; label: string }[] = [
  { id: "busy", label: "Every status" },
  { id: "lifespan", label: "Mid-lease tenancy · 50 projects" },
  { id: "first", label: "First project" },
  { id: "exit", label: "Exit works" },
];

/** v35 demo picker — archive first, plus the usual list stories. */
export const V35_WORKS_STORIES: { id: V31WorksStory; label: string }[] = [
  { id: "intro", label: "First visit to Projects" },
  { id: "archive", label: "Archive · 90 days" },
  { id: "scope-none", label: "No permit needed" },
  { id: "scope-full", label: "Full renovation · mixed documents" },
  { id: "busy", label: "Every status" },
  { id: "lifespan", label: "Mid-lease tenancy · 50 projects" },
  { id: "first", label: "First project" },
  { id: "exit", label: "Exit works" },
];

/** v37 demo picker — two mixed-document packs to compare. */
export const V37_WORKS_STORIES: { id: V31WorksStory; label: string }[] = [
  { id: "intro", label: "First visit to Projects" },
  { id: "archive", label: "Archive · 90 days" },
  { id: "scope-none", label: "No permit needed" },
  { id: "scope-full", label: "Full renovation · mixed documents" },
  { id: "scope-mixed", label: "Ceiling + renovation · mixed documents" },
  { id: "busy", label: "Every status" },
  { id: "lifespan", label: "Mid-lease tenancy · 50 projects" },
  { id: "first", label: "First project" },
  { id: "exit", label: "Exit works" },
];

/** v34 demo picker — scope feedback first, plus the usual list stories. */
export const V34_WORKS_STORIES: { id: V31WorksStory; label: string }[] = [
  { id: "scope-full", label: "Scope results · permits & steps" },
  { id: "scope-none", label: "Scope results · nothing needed" },
  { id: "busy", label: "Every status" },
  { id: "first", label: "First project" },
  { id: "exit", label: "Exit works" },
];

export function readV31WorksStory(): V31WorksStory | null {
  try {
    const raw = window.localStorage.getItem(V31_WORKS_STORY_KEY);
    if (
      raw === "busy" ||
      raw === "lifespan" ||
      raw === "first" ||
      raw === "exit" ||
      raw === "scope-full" ||
      raw === "scope-mixed" ||
      raw === "scope-none" ||
      raw === "archive" ||
      raw === "intro" ||
      raw === "past"
    ) {
      return raw;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function writeV31WorksStory(story: V31WorksStory) {
  window.localStorage.setItem(V31_WORKS_STORY_KEY, story);
  window.dispatchEvent(new Event(V31_WORKS_STORY_CHANGED));
}

function seedBusy(unit: Unit, role: Role) {
  ensureV31StatusCatalog(unit, role);
}

/**
 * Run a story against the shared unit store, then put that store back.
 * v37 keeps the resulting projects in its own list, so v36’s list is left as it was.
 * Completion marks added for the story stay, because the v37 rows still read them.
 */
function preserveUnit(unit: Unit, run: () => void): V26Work[] {
  const prevWorks = readV26Works(unit.id);
  const prevArchived = readV31Archived(unit.id);
  const prevCompleted = readV31Completed(unit.id);
  const prevV28 = readV28WorksStory();
  let next: V26Work[] = [];
  try {
    run();
    next = readV26Works(unit.id);
  } finally {
    const added = readV31Completed(unit.id).filter((id) => !prevCompleted.includes(id));
    writeV26Works(unit.id, prevWorks);
    setV31Archived(unit.id, prevArchived);
    writeV31Completed(unit.id, [...new Set([...prevCompleted, ...added])]);
    writeV28WorksStory(prevV28);
  }
  return next;
}

function resetV37DemoFlags() {
  resetV31ListState("v37");
  resetV31ListState("u-301");
  resetV31ListState("u-302");
}

/** Tenancies the signed-in person can actually see in the list. */
function v37VisibleTenancyIds(role: Role): string[] {
  if (role === "tenant") {
    const mine = V37_TENANCIES.filter((row) => row.tenantId === v37TenantId()).map(
      (row) => row.id,
    );
    if (mine.length > 0) return mine;
  }
  return V37_TENANCIES.map((row) => row.id);
}

function v37StatusSlug(workId: string) {
  return workId.replace(/^v31-status-/, "").replace(/-u-\d+$/, "");
}

/** Keep every catalog status on a row this role can open. Pin no-permit on the first home. */
function v37StoryTenancy(role: Role, workId: string, index: number) {
  const homes = v37VisibleTenancyIds(role);
  if (v37StatusSlug(workId) === "nopermit") return homes[0];
  return homes[index % homes.length];
}

/** v37 picker. Each label has to change this cut’s own project list. */
function applyV37WorksStory(unit: Unit, role: Role, story: V31WorksStory): string | null {
  resetV37DemoFlags();
  if (story === "intro") {
    window.localStorage.removeItem(V35_INTRO_KEY);
    writeV37Works([]);
    return null;
  }
  if (story === "first") {
    writeV37Works([v37FirstProjectWork(role)]);
    return null;
  }
  if (story === "exit") {
    window.localStorage.setItem("tempo:v37:tenant", "outgoing");
    const home = v37UnitById("u-301") ?? unit;
    const works = preserveUnit(home, () => applyV28WorksStory(home, role, "exit"));
    writeV37Works(
      works.map((work) => ({
        ...v37StampWork(work, role, "kopi-leave"),
        title: "Kopi & Co. handover",
      })),
    );
    return null;
  }
  if (story === "scope-none") {
    let id = "";
    const works = preserveUnit(unit, () => {
      id = applyV34ScopeNoneProject(unit);
    });
    writeV37Works(works.map((work) => v37StampWork(work, role)));
    return id;
  }
  if (story === "scope-full") {
    let id = "";
    const works = preserveUnit(unit, () => {
      id = applyV34ScopeFullProject(unit);
    });
    writeV37Works(works.map((work) => v37StampWork(work, role)));
    return id;
  }
  if (story === "scope-mixed") {
    let id = "";
    const works = preserveUnit(unit, () => {
      id = applyV34ScopeMixedProject(unit);
    });
    writeV37Works(works.map((work) => v37StampWork(work, role)));
    return id;
  }
  if (story === "archive") {
    const works = preserveUnit(unit, () => applyV35ArchiveStory(unit, role));
    writeV37Works(works.map((work) => v37StampWork(work, role)));
    return null;
  }
  if (story === "lifespan") {
    const works = preserveUnit(unit, () => applyV31LifespanStory(unit, role));
    writeV37Works(works.map((work) => v37StampWork(work, role)));
    return null;
  }
  if (story === "past") {
    const works = preserveUnit(unit, () => applyV31StatusCatalog(unit, role));
    const finished = new Set([3, 5, 7]);
    const stamped = works.map((work, index) =>
      v37StampWork(
        { ...work, id: `v37-past-${index}` },
        role,
        v37StoryTenancy(role, work.id, index),
      ),
    );
    for (const [index, work] of stamped.entries()) {
      if (finished.has(index)) completeV31Work(work.unitId, work.id);
    }
    writeV37Works(stamped);
    return null;
  }
  const works = preserveUnit(unit, () => applyV31StatusCatalog(unit, role));
  const stamped = works.map((work, index) => {
    const next = v37StampWork(work, role, v37StoryTenancy(role, work.id, index));
    copyV28PackState(unit.id, next.unitId, work.id);
    return next;
  });
  writeV37Works(stamped);
  for (const work of stamped) {
    if (work.id.includes("-status-complete-")) completeV31Work(work.unitId, work.id);
  }
  return null;
}

/** Demo picker. Replaces the unit’s project list. Returns a work id when one should open. */
export function applyV31WorksStory(
  unit: Unit,
  role: Role,
  story: V31WorksStory,
): string | null {
  writeV31WorksStory(story);
  if (typeof window !== "undefined" && usesV37Cut(window.location.pathname)) {
    return applyV37WorksStory(unit, role, story);
  }
  resetV31ListState(unit.id);
  if (story === "intro") {
    window.localStorage.removeItem(V35_INTRO_KEY);
    applyV31StatusCatalog(unit, role);
    return null;
  }
  if (story === "archive") {
    writeV28WorksStory("operate");
    applyV35ArchiveStory(unit, role);
    return null;
  }
  if (story === "scope-full") {
    writeV28WorksStory("opening");
    return applyV34ScopeFullProject(unit);
  }
  if (story === "scope-mixed") {
    writeV28WorksStory("opening");
    return applyV34ScopeMixedProject(unit);
  }
  if (story === "scope-none") {
    writeV28WorksStory("opening");
    return applyV34ScopeNoneProject(unit);
  }
  if (story === "first") {
    writeV28WorksStory("opening");
    writeV26Works(unit.id, []);
    return null;
  }
  if (story === "exit") {
    applyV28WorksStory(unit, role, "exit");
    return null;
  }
  if (story === "lifespan") {
    writeV28WorksStory("operate");
    applyV31LifespanStory(unit, role);
    return null;
  }
  applyV31StatusCatalog(unit, role);
  return null;
}

/** First visit keeps the busy list. The other stories stay as last picked. */
export function ensureV31WorksStory(unit: Unit, role: Role) {
  if (typeof window !== "undefined" && usesV37Cut(window.location.pathname)) {
    if (!readV31WorksStory()) writeV31WorksStory("busy");
    return;
  }
  const story = readV31WorksStory();
  if (!story) {
    writeV31WorksStory("busy");
    seedBusy(unit, role);
    return;
  }
  if (story === "busy") seedBusy(unit, role);
}
