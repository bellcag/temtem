import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ExternalLink, FileText, MapPin, Users } from "lucide-react";
import { PHASES, UNITS, type Phase, type Unit } from "@/lib/tenancy-data";
import { useApp, type Role } from "@/lib/app-state";
import {
  actorLabel,
  alsoLine,
  classifyStageOnPath,
  docsForStep,
  phaseOnRolePath,
  stepWhat,
  type ClassifiedStep,
  type SubActor,
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
    setRole,
    unit,
    setUnit,
    units,
    effectiveUnit,
    isUnscoped,
    processView,
    setProcessView,
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
  const [guideLens, setGuideLens] = useState<Role>("officer");

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

  useEffect(() => {
    const next = !isOfficer ? "my-unit" : isUnscoped ? "full" : "my-unit";
    if (processView !== next) setProcessView(next);
  }, [isUnscoped, isOfficer, processView, setProcessView]);

  const activeJob = CONTRACTOR_JOBS.find((j) => j.id === jobId) ?? CONTRACTOR_JOBS[0];

  const ctxUnit: Unit = useMemo(() => {
    if (isContractor) return activeJob.unit;
    if (isOfficer) return effectiveUnit ?? unit;
    return unit;
  }, [isContractor, isOfficer, activeJob, effectiveUnit, unit]);

  const needsContext = isOfficer && isUnscoped && processView !== "full";
  const showFull = isOfficer && (processView === "full" || isUnscoped);
  const classifyRole: Role =
    isOfficer && processView === "my-unit" && !isUnscoped ? guideLens : role;
  const isPreviewing = isOfficer && classifyRole !== "officer";

  useEffect(() => {
    if (!isOfficer || processView === "full" || isUnscoped) {
      setGuideLens("officer");
    }
  }, [isOfficer, processView, isUnscoped]);

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

  const active = PHASES.find((p) => p.id === activeId)!;

  const stageBlocks = useMemo(() => {
    if (!phaseOnRolePath(active, classifyRole)) return [];
    return active.stages
      .map((stage, si) => {
        const { yours, also } = classifyStageOnPath(
          stage,
          classifyRole,
          ctxUnit.tenancyType,
          ctxUnit.terminal,
          showFull,
        );
        return { stage, si, yours, also };
      })
      .filter((b) => b.yours.length > 0 || b.also.length > 0);
  }, [active, classifyRole, ctxUnit.tenancyType, ctxUnit.terminal, showFull]);

  const yourStepsFlat = useMemo(() => {
    const list: { stageName: string; classified: ClassifiedStep }[] = [];
    for (const b of stageBlocks) {
      for (const c of b.yours) list.push({ stageName: b.stage.name, classified: c });
    }
    return list;
  }, [stageBlocks]);

  /** Stage order, original step order — action steps and notes stay in the journey. */
  const journeyItems = useMemo(() => {
    const list: {
      kind: "you" | "context";
      stageName: string;
      classified: ClassifiedStep;
    }[] = [];
    for (const b of stageBlocks) {
      for (const step of b.stage.steps) {
        const yoursHit = b.yours.find((c) => c.step.name === step.name);
        const alsoHit = b.also.find((c) => c.step.name === step.name);
        if (yoursHit) {
          list.push({
            kind: "you",
            stageName: b.stage.name,
            classified: yoursHit,
          });
        } else if (alsoHit) {
          list.push({
            kind: "context",
            stageName: b.stage.name,
            classified: alsoHit,
          });
        }
      }
    }
    return list;
  }, [stageBlocks]);

  const startHere = yourStepsFlat[0] ?? null;

  /** All stages in the active phase (phase structure), plus path counts. */
  const phaseStageMap = useMemo(() => {
    if (!phaseOnRolePath(active, classifyRole)) {
      return active.stages.map((stage, si) => ({
        index: si + 1,
        name: stage.name,
        purpose: stage.purpose,
        yourCount: 0,
        contextOnly: false,
        hidden: true,
      }));
    }
    return active.stages.map((stage, si) => {
      const { yours, also } = classifyStageOnPath(
        stage,
        classifyRole,
        ctxUnit.tenancyType,
        ctxUnit.terminal,
        showFull,
      );
      return {
        index: si + 1,
        name: stage.name,
        purpose: stage.purpose,
        yourCount: yours.length,
        contextOnly: yours.length === 0 && also.length > 0,
        hidden: yours.length === 0 && also.length === 0,
      };
    });
  }, [active, classifyRole, ctxUnit.tenancyType, ctxUnit.terminal, showFull]);

  const visibleStageCount = phaseStageMap.filter((s) => !s.hidden).length;

  const navSteps = useMemo(
    () =>
      journeyItems.map((item) => ({
        kind: item.kind,
        stageName: item.stageName,
        stepName: item.classified.step.name,
      })),
    [journeyItems],
  );

  const navKeySig = navSteps
    .map((s) => `${s.kind}:${s.stageName}::${s.stepName}`)
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
    ? "Static guide for this job (Setup, Build, Exit) — not live status. Step numbers match the Project Officer and tenant for this unit."
    : isOfficer
      ? showFull
        ? "Full process catalogue for coaching — not live status. Extra variants can change the count; use My unit when talking someone through their path."
        : isPreviewing
          ? `Previewing the ${classifyRole} guide for this unit — same step numbers they see.`
          : "Unit guide for coaching — not live status. Step numbers match the tenant and contractor on this unit."
      : "Static playbook for this outlet — not live status. Step numbers match the Project Officer and contractor for this unit.";

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
        <div className="flex shrink-0 flex-col items-end gap-2">
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-grey-500">
              Demo: sign in as
            </span>
            <select
              value={role}
              onChange={(e) => {
                const next = e.target.value as Role;
                if (next === "officer") {
                  setOfficerSelection({
                    terminal: ctxUnit.terminal as "T1" | "T2" | "T3" | "T4",
                    tenancyType: ctxUnit.tenancyType as "Retail" | "F&B",
                    zone: "Airside",
                  });
                }
                setRole(next);
              }}
              className="rounded-[var(--radius-sm)] border border-grey-200 bg-white px-3 py-2 text-sm font-bold text-black"
              title="Prototype only — switches demo account"
            >
              <option value="tenant">Tenant</option>
              <option value="contractor">Contractor</option>
              <option value="officer">Project Officer</option>
            </select>
          </label>
          <Link
            to="/process-v2"
            className="text-xs font-bold text-grey-500 hover:text-purple-700"
          >
            Open v2
          </Link>
        </div>
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
                Choose a unit below (or switch to Full process) so this guide can
                filter to Airside F&amp;B / Retail.
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

            {isOfficer && (
              <div className="flex w-full flex-col gap-3 desktop:items-end">
                <div className="inline-flex w-full gap-1 rounded-[var(--radius-sm)] border border-grey-200 bg-grey-25 p-1 desktop:w-auto">
                  <button
                    type="button"
                    disabled={isUnscoped}
                    onClick={() => !isUnscoped && setProcessView("my-unit")}
                    className={cn(
                      "flex-1 rounded-[var(--radius-sm)] px-3 py-2 text-xs font-bold transition desktop:flex-none",
                      processView === "my-unit"
                        ? "bg-purple-600 text-white"
                        : "text-grey-500 hover:text-black",
                      isUnscoped && "cursor-not-allowed opacity-50",
                    )}
                  >
                    My unit
                  </button>
                  <button
                    type="button"
                    onClick={() => setProcessView("full")}
                    className={cn(
                      "flex-1 rounded-[var(--radius-sm)] px-3 py-2 text-xs font-bold transition desktop:flex-none",
                      processView === "full"
                        ? "bg-purple-600 text-white"
                        : "text-grey-500 hover:text-black",
                    )}
                  >
                    Full process
                  </button>
                </div>
                {processView === "my-unit" && !isUnscoped && (
                  <div className="flex w-full flex-col gap-1 desktop:max-w-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-grey-500">
                      Preview as
                    </span>
                    <div className="inline-flex w-full gap-1 rounded-[var(--radius-sm)] border border-grey-200 bg-grey-25 p-1">
                      {(
                        [
                          ["officer", "You"],
                          ["tenant", "Tenant"],
                          ["contractor", "Contractor"],
                        ] as const
                      ).map(([id, label]) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setGuideLens(id)}
                          className={cn(
                            "flex-1 rounded-[var(--radius-sm)] px-2 py-2 text-xs font-bold transition",
                            guideLens === id
                              ? "bg-white text-purple-700 shadow-[var(--shadow-light-bg)]"
                              : "text-grey-500 hover:text-black",
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
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
                  {PHASES.map((p, i) => {
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
                          <span
                            className={cn(
                              "text-xs font-bold",
                              isActive ? "text-purple-700" : "text-grey-500",
                            )}
                          >
                            · {p.stages.length}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
                <div className="border-t border-purple-100 bg-purple-100/40 px-3 py-3">
                  <PhaseStepsPanel
                    active={active}
                    visibleStageCount={visibleStageCount}
                    navSteps={navSteps}
                    focusedStep={focusedStep}
                    onSelectStep={scrollToStep}
                  />
                </div>
              </div>

              {/* Tablet+: phases with steps anchored under the selected phase */}
              <ol className="hidden tablet:block">
                {PHASES.map((p, i) => {
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
                          <span
                            className={cn(
                              "block text-xs font-semibold transition",
                              isActive
                                ? "text-purple-600"
                                : "text-grey-400 group-hover:text-purple-600",
                            )}
                          >
                            {p.stages.length} stage
                            {p.stages.length === 1 ? "" : "s"}
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
                            visibleStageCount={visibleStageCount}
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
          {!startHere && stageBlocks.every((b) => b.also.length === 0) && (
            <div className="rounded-[var(--radius-md)] border border-grey-100 bg-white px-4 py-8 text-center text-sm text-grey-500 tablet:px-6">
              Nothing in this guide for {active.name}.
              {isContractor && active.id === "operate"
                ? " Operate stays with the tenant account — this works guide covers Setup, Build and Exit."
                : null}
            </div>
          )}

          {journeyItems.length > 0 && (
            <ol className="relative flex flex-col">
              {journeyItems.map((item, idx) => {
                const isLast = idx === journeyItems.length - 1;
                const nextKind = journeyItems[idx + 1]?.kind;
                const prevStage = journeyItems[idx - 1]?.stageName;
                const stepIndex = idx + 1;
                if (item.kind === "you") {
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
                      role={classifyRole}
                      showFull={showFull}
                      tenancyType={ctxUnit.tenancyType}
                      terminal={ctxUnit.terminal}
                      zone={ctxUnit.zone}
                      onPreviewDoc={setPreviewDocId}
                      onFocusStep={focusStep}
                      isLast={isLast}
                      nextIsNote={nextKind === "context"}
                    />
                  );
                }
                return (
                  <ContextNote
                    key={`${item.stageName}-${item.classified.step.name}`}
                    stageName={item.stageName}
                    title={item.classified.step.name}
                    summary={alsoLine(item.classified, classifyRole)}
                    tenancyType={ctxUnit.tenancyType}
                    terminal={ctxUnit.terminal}
                    zone={ctxUnit.zone}
                    onPreviewDoc={setPreviewDocId}
                    stepFocused={
                      stepFocusKey(
                        item.stageName,
                        item.classified.step.name,
                      ) === focusedStep
                    }
                    onFocusStep={focusStep}
                    isLast={isLast}
                    nextIsNote={nextKind === "context"}
                    index={stepIndex}
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
  visibleStageCount,
  navSteps,
  focusedStep,
  onSelectStep,
}: {
  active: Phase;
  visibleStageCount: number;
  navSteps: {
    kind: "you" | "context";
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
      {visibleStageCount < active.stages.length && (
        <p className="mt-2 text-xs font-semibold text-purple-700">
          {visibleStageCount} of {active.stages.length} stages in this guide
        </p>
      )}

      <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-grey-500">
        Steps in {active.name}
      </p>
      <p className="mt-1 text-[11px] font-semibold leading-4 text-grey-500">
        Same numbers for this unit — role only changes what is yours vs also
        happening.
      </p>
      {navSteps.length === 0 ? (
        <p className="mt-2 text-sm text-grey-500">
          No guide steps in this phase for your unit.
        </p>
      ) : (
        <ol
          aria-label={`${active.name} guide steps`}
          className="mt-2 space-y-0.5"
        >
          {navSteps.map((item, idx) => {
            const key = stepFocusKey(item.stageName, item.stepName);
            const isFocused = key === focusedStep;
            const isNote = item.kind === "context";
            return (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => onSelectStep(item.stageName, item.stepName)}
                  title={`Jump to ${item.stepName}`}
                  className={cn(
                    "group flex w-full items-start gap-2 rounded-[var(--radius-sm)] border-l-2 px-2.5 py-2 text-left transition",
                    isFocused
                      ? isNote
                        ? "border-l-grey-400 bg-white/90 text-grey-800"
                        : "border-l-purple-600 bg-white/90 text-purple-800 shadow-[var(--shadow-light-bg)]"
                      : "border-l-transparent text-grey-700 hover:bg-white/60 hover:text-purple-800",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 grid h-5 w-5 shrink-0 place-items-center text-[10px] font-black",
                      isNote ? "rounded-[var(--radius-sm)]" : "rounded-full",
                      isFocused
                        ? isNote
                          ? "border border-grey-400 bg-white text-grey-700"
                          : "bg-purple-600 text-white"
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
                          ? isNote
                            ? "text-grey-500"
                            : "text-purple-600"
                          : "text-grey-500 group-hover:text-purple-600",
                      )}
                    >
                      {isNote ? `${item.stageName} · Also` : item.stageName}
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

function PathStep({
  classified,
  stageName,
  showStage,
  stepFocused,
  index,
  role,
  showFull,
  tenancyType,
  terminal,
  zone,
  onPreviewDoc,
  onFocusStep,
  isLast,
  nextIsNote,
}: {
  classified: ClassifiedStep;
  stageName: string;
  showStage: boolean;
  stepFocused: boolean;
  index: number;
  role: Role;
  showFull: boolean;
  tenancyType: string;
  terminal: string;
  zone: string;
  onPreviewDoc: (id: string) => void;
  onFocusStep: (stageName: string, stepName: string) => void;
  isLast: boolean;
  nextIsNote: boolean;
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

  /** One reading order: source order, labelled by who acts. */
  const flow = useMemo(() => {
    if (classified.ordered?.length) {
      return classified.ordered.map(({ sub, actor }) => ({
        actor,
        text: sub.text,
        tag: sub.tag,
      }));
    }
    const rows: {
      actor: SubActor;
      text: string;
      tag?: string;
    }[] = [];
    for (const s of mine)
      rows.push({ actor: "you", text: s.text, tag: s.tag });
    for (const s of others)
      rows.push({ actor: "shared", text: s.text, tag: s.tag });
    return rows;
  }, [classified.ordered, mine, others]);

  return (
    <li
      className={cn(
        "relative pl-10",
        !isLast && (nextIsNote ? "pb-4" : "pb-8"),
      )}
    >
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

        {flow.length > 0 && (
          <div className="pt-4">
            <FieldLabel>In this guide step</FieldLabel>
            <ul className="mt-3 space-y-3">
              {flow.map((row, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span
                    className={cn(
                      "mt-0.5 shrink-0 rounded-[var(--radius-sm)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                      row.actor === "you"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-grey-75 text-grey-600",
                    )}
                  >
                    {actorLabel(row.actor)}
                  </span>
                  <span
                    className={cn(
                      "min-w-0 text-sm leading-relaxed",
                      row.actor === "you" ? "text-black" : "text-grey-600",
                    )}
                  >
                    {row.text}
                    <TagCallout
                      tag={row.tag}
                      showTag={showFull}
                      tenancyType={tenancyType}
                    />
                  </span>
                </li>
              ))}
            </ul>
          </div>
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

function ContextNote({
  stageName,
  title,
  summary,
  tenancyType,
  terminal,
  zone,
  onPreviewDoc,
  stepFocused,
  onFocusStep,
  isLast,
  nextIsNote,
  index,
}: {
  stageName: string;
  title: string;
  summary: string;
  tenancyType: string;
  terminal: string;
  zone: string;
  onPreviewDoc: (id: string) => void;
  stepFocused: boolean;
  onFocusStep: (stageName: string, stepName: string) => void;
  isLast: boolean;
  nextIsNote: boolean;
  index: number;
}) {
  const guideDocs = useMemo(
    () => docsForStep(title, tenancyType, terminal, zone),
    [title, tenancyType, terminal, zone],
  );

  return (
    <li
      className={cn(
        "relative pl-10",
        !isLast && (nextIsNote ? "pb-2" : "pb-8"),
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute top-0 left-[13px] w-0.5 bg-grey-100",
          isLast ? "h-5" : "bottom-0",
        )}
      />
      <span
        className={cn(
          "absolute top-0 left-0 z-10 grid place-items-center rounded-[var(--radius-sm)] bg-white text-[11px] font-black transition",
          stepFocused
            ? "h-7 w-7 border-2 border-grey-400 text-grey-700 shadow-[0_0_0_3px_var(--color-grey-75)]"
            : "h-6 w-6 border border-grey-200 text-grey-500",
        )}
        title={`Step ${index}`}
      >
        <span className="sr-only">Step </span>
        {index}
      </span>
      <div
        id={stepDomId(stageName, title)}
        tabIndex={0}
        onClick={() => onFocusStep(stageName, title)}
        className={cn(
          "scroll-mt-20 cursor-pointer rounded-[var(--radius-sm)] px-3 py-2.5 outline-none transition desktop:scroll-mt-8",
          stepFocused ? "bg-grey-75" : "bg-grey-50 hover:bg-grey-75",
        )}
      >
        <p className="text-[10px] font-bold uppercase tracking-wider text-grey-400">
          {stageName} · Also happening
        </p>
        <p className="mt-0.5 text-sm font-semibold leading-[18px] text-grey-700">
          {title}
        </p>
        <p className="mt-1 text-xs leading-4 text-grey-500">{summary}</p>
        {guideDocs.length > 0 && (
          <ul className="mt-2 flex flex-col gap-1">
            {guideDocs.map((d) => (
              <li key={d.id}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPreviewDoc(d.id);
                  }}
                  className="flex w-full items-center gap-1.5 text-left text-xs font-bold text-grey-500 hover:text-grey-700"
                >
                  <FileText className="h-3 w-3 shrink-0" />
                  <span className="min-w-0 truncate">{d.name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}

function TagCallout({
  tag,
  showTag,
  tenancyType,
}: {
  tag?: string;
  showTag: boolean;
  tenancyType: string;
}) {
  if (!tag) return null;
  const categoryCallout =
    !showTag &&
    (tag.toLowerCase().includes("f&b") ||
      tag.toLowerCase().includes("retail"));
  if (!showTag && !categoryCallout) return null;
  return (
    <span className="ml-2 inline-flex items-center rounded-[var(--radius-sm)] bg-warning-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-warning-600">
      {showTag ? tag : `${tenancyType} relevant`}
    </span>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-grey-500">
      {children}
    </div>
  );
}

