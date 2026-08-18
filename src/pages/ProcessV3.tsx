import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ExternalLink, FileText, MapPin, Users } from "lucide-react";
import { PHASES, UNITS, type Phase, type Unit } from "@/lib/tenancy-data";
import { useApp, type Role } from "@/lib/app-state";
import {
  classifyStage,
  displayText,
  docsForStep,
  groupGuideBlocks,
  phasesForUnit,
  stepWhat,
  type ClassifiedStep,
} from "@/lib/process-guide";
import { DocumentPreviewDrawer } from "@/components/DocumentPreviewDrawer";
import { cn } from "@/lib/utils";

const LS_KEY = "tempo:v3:lastPhase";
const LS_OUTLET = "tempo:v3:outlet";
const LS_JOB = "tempo:v3:job";

/** Demo contractor assignments — one job = one unit path. */
const CONTRACTOR_JOBS: { id: string; label: string; unit: Unit }[] = [
  {
    id: "job-kopi-t3",
    label: "Kopi & Co. · T3-AS-114",
    unit: UNITS[0],
  },
  {
    id: "job-kopi-t2",
    label: "Kopi & Co. · T2-AS-045",
    unit: UNITS[2],
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
  },
];

function stepDomId(stageName: string, stepName: string) {
  return `step-${stageName}-${stepName}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
}

function stepFocusKey(stageName: string, stepName: string) {
  return `${stageName}::${stepName}`;
}

type JourneyItem = {
  stageName: string;
  classified: ClassifiedStep;
};

function AttrChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-[var(--radius-sm)] border border-grey-100 bg-white px-2 py-1 text-[11px] font-bold text-grey-700">
      {children}
    </span>
  );
}

export function ProcessV3Page() {
  const {
    role,
    unit,
    setUnit,
    units,
    effectiveUnit,
    isUnscoped,
    setOfficerSelection,
  } = useApp();
  const [params] = useSearchParams();
  const isOfficer = role === "officer";
  const isContractor = role === "contractor";
  const isTenant = role === "tenant";

  const [activeId, setActiveId] = useState<Phase["id"]>("setup");
  const [focusedStep, setFocusedStep] = useState<string | null>(null);
  const [previewDocId, setPreviewDocId] = useState<string | null>(null);
  const [jobId, setJobId] = useState(CONTRACTOR_JOBS[0].id);

  // Tenant / contractor active context (F0)
  useEffect(() => {
    if (!isTenant) return;
    const saved = window.localStorage.getItem(LS_OUTLET);
    const hit = units.find((u) => u.id === saved);
    // unit.id is selection-derived (sel-…); match on terminal + type, not id
    if (
      hit &&
      (hit.terminal !== unit.terminal || hit.tenancyType !== unit.tenancyType)
    ) {
      setUnit(hit);
    }
  }, [isTenant, units, setUnit, unit.terminal, unit.tenancyType]);

  useEffect(() => {
    if (!isContractor) return;
    const saved = window.localStorage.getItem(LS_JOB);
    if (saved && CONTRACTOR_JOBS.some((j) => j.id === saved)) setJobId(saved);
  }, [isContractor]);

  useEffect(() => {
    const fromUrl = params.get("phase") as Phase["id"] | null;
    if (fromUrl && PHASES.some((p) => p.id === fromUrl)) {
      setActiveId(fromUrl);
      return;
    }
    const saved = window.localStorage.getItem(LS_KEY) as Phase["id"] | null;
    if (saved && PHASES.some((p) => p.id === saved)) setActiveId(saved);
  }, [params]);

  const activeJob = CONTRACTOR_JOBS.find((j) => j.id === jobId) ?? CONTRACTOR_JOBS[0];

  const ctxUnit: Unit = useMemo(() => {
    if (isContractor) return activeJob.unit;
    if (isOfficer) return effectiveUnit ?? unit;
    return unit;
  }, [isContractor, isOfficer, activeJob, effectiveUnit, unit]);

  const needsContext = isOfficer && isUnscoped;

  const selectPhase = (id: Phase["id"]) => {
    setActiveId(id);
    window.localStorage.setItem(LS_KEY, id);
    setFocusedStep(null); // reset; effect below picks first step card
  };

  const pickOutlet = (u: Unit) => {
    setUnit(u);
    window.localStorage.setItem(LS_OUTLET, u.id);
  };

  const pickJob = (id: string) => {
    setJobId(id);
    window.localStorage.setItem(LS_JOB, id);
  };

  const visiblePhases = useMemo(
    () => (needsContext ? PHASES : phasesForUnit(ctxUnit)),
    [needsContext, ctxUnit],
  );

  useEffect(() => {
    if (visiblePhases.some((p) => p.id === activeId)) return;
    const fallback = visiblePhases[0]?.id ?? "setup";
    setActiveId(fallback);
    window.localStorage.setItem(LS_KEY, fallback);
  }, [visiblePhases, activeId]);

  const active = visiblePhases.find((p) => p.id === activeId) ?? visiblePhases[0] ?? PHASES[0];

  const stageBlocks = useMemo(() => {
    if (needsContext) return [];
    return active.stages
      .map((stage, si) => {
        const { steps } = classifyStage(stage, role, ctxUnit);
        return { stage, si, steps };
      })
      .filter((b) => b.steps.length > 0);
  }, [active, role, ctxUnit, needsContext]);

  const journeyItems = useMemo(() => {
    const list: JourneyItem[] = [];
    for (const b of stageBlocks) {
      for (const classified of b.steps) {
        list.push({ stageName: b.stage.name, classified });
      }
    }
    return list;
  }, [stageBlocks]);

  const startHere = journeyItems[0] ?? null;

  const navSteps = useMemo(
    () =>
      journeyItems.map((item) => ({
        stageName: item.stageName,
        stepName: item.classified.step.name,
      })),
    [journeyItems],
  );

  const navKeySig = navSteps
    .map((s) => `${s.stageName}::${s.stepName}`)
    .join("/");

  // 1:1 focus — one guide card at a time (defaults to first in phase)
  useEffect(() => {
    const keys = navSteps.map((s) =>
      stepFocusKey(s.stageName, s.stepName),
    );
    setFocusedStep((prev) => {
      if (keys.length === 0) return null;
      if (prev && keys.includes(prev)) return prev;
      return keys[0] ?? null;
    });
    // navSteps identity can change every render; navKeySig tracks content.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navKeySig]);

  const focusStep = (stageName: string, stepName: string) => {
    setFocusedStep(stepFocusKey(stageName, stepName));
  };

  const scrollToStep = (stageName: string, stepName: string) => {
    focusStep(stageName, stepName);
    const el = document.getElementById(stepDomId(stageName, stepName));
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const roleBlurb = isContractor
    ? "Guide for this job — what happens on this unit, and your part in it."
    : isOfficer
      ? "Guide for this unit — the same map the tenant and contractor see, with full depth."
      : "Guide for this outlet — what you’ll receive, who does it, and what to do when it arrives.";

  return (
    <div className="dls-page">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <h1>Process</h1>
            <span className="inline-flex items-center rounded-[var(--radius-sm)] bg-grey-75 px-2 py-1 text-xs font-bold text-grey-700">
              Guide only
            </span>
          </div>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-grey-500 desktop:text-base desktop:leading-5">
            {roleBlurb}
          </p>
        </div>
        <Link
          to="/process-v2"
          className="shrink-0 text-xs font-bold text-grey-500 hover:text-purple-700"
        >
          Open v2
        </Link>
      </header>

      {/* F0 — Active context */}
      <section className="mb-10 rounded-[var(--radius-md)] border border-grey-100 bg-white p-4 shadow-[var(--shadow-light-bg)] tablet:p-6 desktop:p-8">
        <div className="dls-grid-12 items-start">
          <div className="min-w-0 desktop:col-span-8">
            <div className="text-[10px] font-bold uppercase tracking-wider text-grey-500">
              {isContractor ? "Active job" : isOfficer ? "Active unit" : "Active outlet"}
            </div>
            {needsContext ? (
              <p className="mt-2 text-sm text-grey-600 desktop:text-base desktop:leading-5">
                Choose a unit below so this guide can follow that unit’s map — not every possible branch.
              </p>
            ) : (
              <>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0 text-purple-600" />
                  <span className="text-base font-bold break-words text-black">
                    {isContractor ? activeJob.label : ctxUnit.unitNo}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <AttrChip>{ctxUnit.terminal}</AttrChip>
                  <AttrChip>{ctxUnit.tenancyType}</AttrChip>
                  <AttrChip>{ctxUnit.zone}</AttrChip>
                  {!isContractor && <AttrChip>{ctxUnit.company}</AttrChip>}
                </div>
              </>
            )}
          </div>

          <div className="flex w-full flex-col gap-3 desktop:col-span-4 desktop:items-end">
            {isTenant && (
              <label className="flex w-full flex-col gap-1 desktop:max-w-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-grey-500">
                  Switch outlet
                </span>
                <select
                  value={unit.id}
                  onChange={(e) => {
                    const next = units.find((u) => u.id === e.target.value);
                    if (next) pickOutlet(next);
                  }}
                  className="w-full rounded-[var(--radius-sm)] border border-grey-200 bg-white px-3 py-2 text-sm font-bold text-black"
                >
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.unitNo} · {u.tenancyType}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {isContractor && (
              <label className="flex w-full flex-col gap-1 desktop:max-w-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-grey-500">
                  Switch job
                </span>
                <select
                  value={jobId}
                  onChange={(e) => pickJob(e.target.value)}
                  className="w-full rounded-[var(--radius-sm)] border border-grey-200 bg-white px-3 py-2 text-sm font-bold text-black"
                >
                  {CONTRACTOR_JOBS.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        </div>

        {isOfficer && isUnscoped && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-grey-75 pt-4">
            <span className="self-center text-[11px] text-grey-500">
              Quick-scope a unit:
            </span>
            {UNITS.slice(0, 4).map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() =>
                  setOfficerSelection({
                    terminal: u.terminal as "T1" | "T2" | "T3" | "T4",
                    tenancyType: u.tenancyType as "Retail" | "F&B",
                    zone: "Airside",
                  })
                }
                className="rounded-[var(--radius-sm)] border border-grey-200 bg-white px-3 py-2 text-xs font-bold text-black hover:border-purple-300 hover:text-purple-700"
              >
                {u.unitNo}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* F2 + F3 — side-by-side from tablet: overview nav | guide content */}
      <div className="flex flex-col gap-6 tablet:grid tablet:grid-cols-[minmax(220px,280px)_minmax(0,1fr)] tablet:items-start tablet:gap-6 desktop:grid-cols-[minmax(240px,300px)_minmax(0,1fr)] desktop:gap-8">
        {/* Left: lifecycle overview (chapter chrome) */}
        <aside className="tablet:sticky tablet:top-6">
          <div className="overflow-hidden rounded-[var(--radius-md)] border border-grey-100 bg-white shadow-[var(--shadow-light-bg)]">
            <div className="border-b border-grey-75 px-3 py-3 tablet:px-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-grey-500">
                Lifecycle overview
              </p>
            </div>

            <nav aria-label="Lifecycle phases">
              {/* Mobile: compact horizontal phases + steps below */}
              <div className="tablet:hidden">
                <ol className="flex gap-2 overflow-x-auto px-3 py-3">
                  {visiblePhases.map((p, i) => {
                    const isActive = p.id === activeId;
                    return (
                      <li key={p.id} className="min-w-0 shrink-0">
                        <button
                          type="button"
                          onClick={() => selectPhase(p.id)}
                          aria-current={isActive ? "true" : undefined}
                          className={cn(
                            "inline-flex items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-left transition",
                            isActive
                              ? "bg-purple-100 text-purple-700"
                              : "bg-grey-25 text-grey-700 hover:bg-grey-75 hover:text-grey-800",
                          )}
                        >
                          <span
                            className={cn(
                              "grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-black",
                              isActive
                                ? "bg-purple-600 text-white"
                                : "border border-grey-200 bg-white text-grey-600",
                            )}
                            title={`Phase ${i + 1}`}
                          >
                            <span className="sr-only">Phase </span>
                            {i + 1}
                          </span>
                          <span className="text-sm font-bold leading-[18px]">
                            {p.name}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
                <div className="border-t border-purple-100 bg-purple-100/40 px-3 py-3">
                  <PhaseStepsPanel
                    active={active}
                    navSteps={navSteps}
                    focusedStep={focusedStep}
                    onSelectStep={scrollToStep}
                  />
                </div>
              </div>

              {/* Tablet+: phases with steps anchored under the selected phase */}
              <ol className="hidden tablet:block">
                {visiblePhases.map((p, i) => {
                  const isActive = p.id === activeId;
                  return (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => selectPhase(p.id)}
                        aria-current={isActive ? "true" : undefined}
                        aria-expanded={isActive}
                        className={cn(
                          "group flex w-full items-center gap-3 border-l-2 px-4 py-3 text-left transition",
                          isActive
                            ? "border-l-purple-600 bg-purple-100 text-purple-800"
                            : "border-l-transparent text-grey-400 hover:border-l-purple-300 hover:bg-purple-100 hover:text-purple-800",
                        )}
                      >
                        <span
                          className={cn(
                            "grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-black transition",
                            isActive
                              ? "bg-purple-600 text-white"
                              : "border border-grey-200 bg-white text-grey-400 group-hover:border-transparent group-hover:bg-purple-600 group-hover:text-white",
                          )}
                          title={`Phase ${i + 1}`}
                        >
                          <span className="sr-only">Phase </span>
                          {i + 1}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span
                            className={cn(
                              "block text-sm font-bold leading-[18px] transition",
                              isActive
                                ? "text-purple-800"
                                : "text-grey-400 group-hover:text-purple-800",
                            )}
                          >
                            {p.name}
                          </span>
                        </span>
                        <span
                          aria-hidden
                          className={cn(
                            "text-sm font-bold transition",
                            isActive
                              ? "text-purple-600"
                              : "text-transparent group-hover:text-purple-600",
                          )}
                        >
                          →
                        </span>
                      </button>

                      {isActive && (
                        <div className="border-l-2 border-l-purple-600 bg-purple-100/40 px-3 py-3 pl-4">
                          <PhaseStepsPanel
                            active={active}
                            navSteps={navSteps}
                            focusedStep={focusedStep}
                            onSelectStep={scrollToStep}
                          />
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            </nav>
          </div>
        </aside>

        {/* Right: guide content */}
        <div className="min-w-0">
          {needsContext && (
            <div className="rounded-[var(--radius-md)] border border-grey-100 bg-white px-4 py-8 text-center text-sm text-grey-500 tablet:px-6">
              Choose a unit to open this guide. The map follows that unit — not a mix of every branch.
            </div>
          )}

          {!needsContext && !startHere && (
            <div className="rounded-[var(--radius-md)] border border-grey-100 bg-white px-4 py-8 text-center text-sm text-grey-500 tablet:px-6">
              Nothing in this guide for {active.name} on this unit.
            </div>
          )}

          {journeyItems.length > 0 && (
            <ol className="relative flex flex-col">
              {journeyItems.map((item, idx) => {
                const isLast = idx === journeyItems.length - 1;
                const prevStage = journeyItems[idx - 1]?.stageName;
                const stepIndex = idx + 1;
                return (
                  <PathStep
                    key={`${item.stageName}-${item.classified.step.name}`}
                    classified={item.classified}
                    stageName={item.stageName}
                    showStage={item.stageName !== prevStage}
                    stepFocused={
                      stepFocusKey(
                        item.stageName,
                        item.classified.step.name,
                      ) === focusedStep
                    }
                    index={stepIndex}
                    role={role}
                    tenancyType={ctxUnit.tenancyType}
                    terminal={ctxUnit.terminal}
                    zone={ctxUnit.zone}
                    onPreviewDoc={setPreviewDocId}
                    onFocusStep={focusStep}
                    isLast={isLast}
                  />
                );
              })}
            </ol>
          )}
        </div>
      </div>

      <DocumentPreviewDrawer
        docId={previewDocId}
        onClose={() => setPreviewDocId(null)}
      />
    </div>
  );
}

function PhaseStepsPanel({
  active,
  navSteps,
  focusedStep,
  onSelectStep,
}: {
  active: Phase;
  navSteps: {
    stageName: string;
    stepName: string;
  }[];
  focusedStep: string | null;
  onSelectStep: (stageName: string, stepName: string) => void;
}) {
  return (
    <>
      <p className="text-sm leading-[18px] text-grey-600 desktop:leading-5">
        {active.description}
      </p>

      <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-grey-500">
        Steps in {active.name}
      </p>
      {navSteps.length === 0 ? (
        <p className="mt-2 text-sm text-grey-500">
          No guide steps in this phase for this unit.
        </p>
      ) : (
        <ol
          aria-label={`${active.name} guide steps`}
          className="mt-2 space-y-0.5"
        >
          {navSteps.map((item, idx) => {
            const key = stepFocusKey(item.stageName, item.stepName);
            const isFocused = key === focusedStep;
            return (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => onSelectStep(item.stageName, item.stepName)}
                  title={`Jump to ${item.stepName}`}
                  className={cn(
                    "group flex w-full items-start gap-2 rounded-[var(--radius-sm)] border-l-2 px-2.5 py-2 text-left transition",
                    isFocused
                      ? "border-l-purple-600 bg-white/90 text-purple-800 shadow-[var(--shadow-light-bg)]"
                      : "border-l-transparent text-grey-700 hover:bg-white/60 hover:text-purple-800",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-black",
                      isFocused
                        ? "bg-purple-600 text-white"
                        : "border border-grey-200 bg-white text-grey-500 group-hover:border-purple-300 group-hover:text-purple-700",
                    )}
                  >
                    {idx + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block text-sm leading-[18px]",
                        isFocused ? "font-bold" : "font-semibold",
                      )}
                    >
                      {item.stepName}
                    </span>
                    <span
                      className={cn(
                        "mt-0.5 block text-[11px] font-semibold uppercase tracking-wider",
                        isFocused
                          ? "text-purple-600"
                          : "text-grey-500 group-hover:text-purple-600",
                      )}
                    >
                      {item.stageName}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </>
  );
}

function GuideBlockList({
  subs,
  mine,
  role,
}: {
  subs: ClassifiedStep["mine"];
  mine: boolean;
  role: Role;
}) {
  const { sequential, parallel, nested } = groupGuideBlocks(subs);
  return (
    <div className="space-y-4">
      {sequential.length > 0 && (
        <ol className="space-y-3">
          {sequential.map((s, i) => (
            <li key={`seq-${i}`} className="flex items-start gap-3">
              <span
                className={cn(
                  "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-black",
                  mine
                    ? "border border-purple-200 bg-purple-100 text-purple-700"
                    : "border border-grey-200 bg-white text-grey-600",
                )}
              >
                {i + 1}
              </span>
              <span
                className={cn(
                  "min-w-0 text-sm leading-relaxed",
                  mine ? "text-black" : "text-grey-600",
                )}
              >
                {displayText(s, mine, role)}
              </span>
            </li>
          ))}
        </ol>
      )}
      {parallel.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-grey-500">
            Also in this step
          </p>
          <ul className="mt-3 space-y-3">
            {parallel.map((s, i) => (
              <li key={`par-${i}`} className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-grey-300" />
                <span
                  className={cn(
                    "min-w-0 text-sm leading-relaxed",
                    mine ? "text-black" : "text-grey-600",
                  )}
                >
                  {displayText(s, mine, role)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {nested.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-grey-500">
            If your works include…
          </p>
          <ul className="mt-3 space-y-3">
            {nested.map((s, i) => (
              <li key={`nest-${i}`} className="rounded-[var(--radius-sm)] bg-grey-25 px-3 py-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-purple-700">
                  {s.workIf}
                </p>
                <p
                  className={cn(
                    "mt-1 text-sm leading-relaxed",
                    mine ? "text-black" : "text-grey-600",
                  )}
                >
                  {displayText(s, mine, role)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function PathStep({
  classified,
  stageName,
  showStage,
  stepFocused,
  index,
  role,
  tenancyType,
  terminal,
  zone,
  onPreviewDoc,
  onFocusStep,
  isLast,
}: {
  classified: ClassifiedStep;
  stageName: string;
  showStage: boolean;
  stepFocused: boolean;
  index: number;
  role: Role;
  tenancyType: string;
  terminal: string;
  zone: string;
  onPreviewDoc: (id: string) => void;
  onFocusStep: (stageName: string, stepName: string) => void;
  isLast: boolean;
}) {
  const { step, mine, others } = classified;
  const people = step.people ?? [];
  const guideDocs = useMemo(
    () => docsForStep(step.name, tenancyType, terminal, zone),
    [step.name, tenancyType, terminal, zone],
  );
  const systems = useMemo(() => {
    if (!step.systems?.length) return [];
    const notASystem = new Set([
      "hard disk",
      "physical board",
      "walk-in",
      "meeting",
      "whatsapp",
      "teams",
      "excel",
    ]);
    const cleaned = step.systems.filter(
      (s) => !notASystem.has(s.label.toLowerCase()),
    );
    if (role === "officer") return cleaned;
    const blob = [...mine, ...others].map((s) => s.text.toLowerCase()).join(" ");
    const matched = cleaned.filter((s) =>
      blob.includes(s.label.toLowerCase()),
    );
    const internal = new Set(["newforma", "customer discovery insights"]);
    if (matched.length > 0) {
      return matched.filter((s) => !internal.has(s.label.toLowerCase()));
    }
    return cleaned.filter((s) => !internal.has(s.label.toLowerCase()));
  }, [step.systems, mine, others, role]);

  const alsoOpen = role === "officer" || mine.length === 0;

  return (
    <li className={cn("relative pl-10", !isLast && "pb-8")}>
      <div
        className={cn(
          "pointer-events-none absolute top-0 left-[13px] w-0.5",
          stepFocused ? "bg-purple-300" : "bg-grey-100",
          isLast ? "h-6" : "bottom-0",
        )}
      />
      <span
        className={cn(
          "absolute top-0 left-0 z-10 grid place-items-center rounded-full text-[11px] font-black transition",
          stepFocused
            ? "h-7 w-7 border-2 border-purple-600 bg-white text-purple-700 shadow-[0_0_0_3px_var(--color-purple-100)]"
            : "h-6 w-6 border border-grey-200 bg-white text-grey-500",
        )}
        title={`Guide step ${index}`}
      >
        <span className="sr-only">Step </span>
        {index}
      </span>

      <article
        id={stepDomId(stageName, step.name)}
        tabIndex={0}
        onClick={() => onFocusStep(stageName, step.name)}
        className={cn(
          "scroll-mt-20 cursor-pointer rounded-[var(--radius-md)] border bg-white p-4 outline-none tablet:p-6 desktop:scroll-mt-8 desktop:p-8",
          stepFocused
            ? "border-purple-300 border-l-4 border-l-purple-600 bg-purple-100/40 shadow-[var(--shadow-light-bg)]"
            : "border-grey-100 shadow-[var(--shadow-light-bg)] hover:border-purple-200",
        )}
      >
        <header className="border-b border-grey-75 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            {(showStage || stepFocused) && (
              <span
                className={cn(
                  "text-[11px] font-bold uppercase tracking-wider",
                  stepFocused
                    ? "rounded-[var(--radius-sm)] bg-purple-600 px-2 py-0.5 text-white"
                    : "text-grey-500",
                )}
              >
                {stageName}
              </span>
            )}
          </div>
          <h3 className="mt-1 text-base font-bold text-black desktop:text-lg desktop:leading-6">
            {step.name}
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-grey-500 desktop:text-base desktop:leading-5">
            {stepWhat(step, role)}
          </p>
        </header>

        {mine.length > 0 && (
          <div className="pt-4">
            <FieldLabel>Your part</FieldLabel>
            <div className="mt-3">
              <GuideBlockList subs={mine} mine role={role} />
            </div>
          </div>
        )}

        {others.length > 0 && (
          mine.length === 0 ? (
            <div className="pt-4">
              <FieldLabel>How this works</FieldLabel>
              <div className="mt-3">
                <GuideBlockList subs={others} mine={false} role={role} />
              </div>
            </div>
          ) : (
            <details
              className="mt-4 border-t border-grey-75 pt-4"
              open={alsoOpen}
              onClick={(e) => e.stopPropagation()}
            >
              <summary className="cursor-pointer text-[10px] font-bold uppercase tracking-wider text-grey-500">
                Also happening
              </summary>
              <div className="mt-3">
                <GuideBlockList subs={others} mine={false} role={role} />
              </div>
            </details>
          )
        )}

        {(people.length > 0 ||
          systems.length > 0 ||
          guideDocs.length > 0) && (
          <div className="mt-6 space-y-4 border-t border-grey-75 pt-4">
            {people.length > 0 && (
              <div>
                <FieldLabel>
                  <Users className="h-3 w-3" /> People
                </FieldLabel>
                <div className="mt-2 flex flex-wrap gap-2">
                  {people.map((p) => (
                    <Link
                      key={p}
                      to="/contacts"
                      className="rounded-[var(--radius-sm)] bg-grey-75 px-2 py-1 text-xs font-bold text-black hover:bg-purple-100 hover:text-purple-700"
                    >
                      {p}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {systems.length > 0 && (
              <div>
                <FieldLabel>
                  <ExternalLink className="h-3 w-3" /> Systems
                </FieldLabel>
                <div className="mt-2 flex flex-wrap gap-2">
                  {systems.map((s) => (
                    <Link
                      key={s.label}
                      to="/apps"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] border border-grey-200 bg-white px-2 py-1 text-xs font-bold text-black hover:border-purple-300 hover:text-purple-700"
                    >
                      {s.label}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {guideDocs.length > 0 && (
              <div>
                <FieldLabel>
                  <FileText className="h-3 w-3" /> Sample & reference documents
                </FieldLabel>
                <ul className="mt-2 flex flex-col gap-2">
                  {guideDocs.map((d) => (
                    <li key={d.id}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPreviewDoc(d.id);
                        }}
                        className="flex w-full flex-wrap items-center gap-2 rounded-[var(--radius-sm)] border border-grey-200 bg-white px-3 py-2 text-left hover:border-purple-300"
                      >
                        <FileText className="h-3.5 w-3.5 shrink-0 text-purple-600" />
                        <span className="min-w-0 flex-1 text-sm font-bold text-black">
                          {d.name}
                        </span>
                        <span className="inline-flex items-center rounded-[var(--radius-sm)] bg-grey-75 px-2 py-1 text-[11px] font-bold text-grey-700">
                          {d.type}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </article>
    </li>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-grey-500">
      {children}
    </div>
  );
}
