import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ExternalLink, FileText, MapPin, Users } from "lucide-react";
import { PHASES, UNITS, type Phase, type Unit } from "@/lib/tenancy-data";
import { useApp, type Role } from "@/lib/app-state";
import {
  alsoLine,
  classifyStage,
  docsForStep,
  stepWhat,
  type ClassifiedStep,
} from "@/lib/process-guide";
import { DocumentPreviewDrawerV4 } from "@/components/DocumentPreviewDrawerV4";
import { cn } from "@/lib/utils";
import {
  Alert,
  AttributeChip,
  Badge,
  Button,
  Dropdown,
  Field,
  FilterChip,
  StatusChip,
  Tabs,
  Text,
} from "@/dls";

const LS_KEY = "tempo:v4:lastPhase";
const LS_OUTLET = "tempo:v4:outlet";
const LS_JOB = "tempo:v4:job";

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
  kind: "you" | "context";
  stageName: string;
  classified: ClassifiedStep;
};

export function ProcessV4Page() {
  const {
    role,
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

  useEffect(() => {
    if (!isTenant) return;
    const saved = window.localStorage.getItem(LS_OUTLET);
    const hit = units.find((u) => u.id === saved);
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

  const activeJob =
    CONTRACTOR_JOBS.find((j) => j.id === jobId) ?? CONTRACTOR_JOBS[0];

  const ctxUnit: Unit = useMemo(() => {
    if (isContractor) return activeJob.unit;
    if (isOfficer) return effectiveUnit ?? unit;
    return unit;
  }, [isContractor, isOfficer, activeJob, effectiveUnit, unit]);

  const needsContext = isOfficer && isUnscoped && processView !== "full";
  const showFull = isOfficer && (processView === "full" || isUnscoped);

  const selectPhase = (id: Phase["id"]) => {
    setActiveId(id);
    window.localStorage.setItem(LS_KEY, id);
    setFocusedStep(null);
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
    return active.stages
      .map((stage, si) => {
        const { yours, also } = classifyStage(
          stage,
          role,
          ctxUnit.tenancyType,
          ctxUnit.terminal,
          showFull,
        );
        return { stage, si, yours, also };
      })
      .filter((b) => b.yours.length > 0 || b.also.length > 0);
  }, [active, role, ctxUnit.tenancyType, ctxUnit.terminal, showFull]);

  const yourStepsFlat = useMemo(() => {
    const list: { stageName: string; classified: ClassifiedStep }[] = [];
    for (const b of stageBlocks) {
      for (const c of b.yours)
        list.push({ stageName: b.stage.name, classified: c });
    }
    return list;
  }, [stageBlocks]);

  const journeyItems = useMemo(() => {
    const list: JourneyItem[] = [];
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

  const phaseStageMap = useMemo(() => {
    return active.stages.map((stage, si) => {
      const { yours, also } = classifyStage(
        stage,
        role,
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
  }, [active, role, ctxUnit.tenancyType, ctxUnit.terminal, showFull]);

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

  useEffect(() => {
    const keys = navSteps.map((s) => stepFocusKey(s.stageName, s.stepName));
    setFocusedStep((prev) => {
      if (keys.length === 0) return null;
      if (prev && keys.includes(prev)) return prev;
      return keys[0] ?? null;
    });
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
    ? "Static guide for this job (Setup, Build, Exit) — not live status."
    : isOfficer
      ? showFull
        ? "Full process catalogue for coaching — not live status."
        : "Unit guide for coaching — not live status."
      : "Static playbook for this outlet — not live status.";

  return (
    <div className="dls-page">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <Text as="h1" size="h5">
              Process
            </Text>
            <StatusChip color="grey" dot>
              Guide only
            </StatusChip>
          </div>
          <Text size="body-sm" className="mt-1 max-w-2xl text-grey-500">
            {roleBlurb}
          </Text>
        </div>
        <Link to="/process-v3">
          <Button variant="tertiary" size="sm">
            Open v3
          </Button>
        </Link>
      </header>

      <section className="mb-10 rounded-[12px] border border-grey-100 bg-white p-4 shadow-light tablet:p-6 desktop:p-8">
        <div className="dls-grid-12 items-start">
          <div className="min-w-0 desktop:col-span-8">
            <Text size="xx-small">
              {isContractor
                ? "Active job"
                : isOfficer
                  ? "Active unit"
                  : "Active outlet"}
            </Text>
            {needsContext ? (
              <Alert tone="warning" className="mt-3" title="Choose a unit">
                Pick a unit below (or switch to Full process) so this guide can
                filter to Airside F&amp;B / Retail.
              </Alert>
            ) : (
              <>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0 text-primary-600" />
                  <Text as="span" size="body-lg" className="font-bold">
                    {isContractor ? activeJob.label : ctxUnit.unitNo}
                  </Text>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <AttributeChip>{ctxUnit.terminal}</AttributeChip>
                  <AttributeChip>{ctxUnit.tenancyType}</AttributeChip>
                  <AttributeChip>{ctxUnit.zone}</AttributeChip>
                  {!isContractor && (
                    <AttributeChip>{ctxUnit.company}</AttributeChip>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="flex w-full flex-col gap-3 desktop:col-span-4 desktop:items-end">
            {isTenant && (
              <Field
                label="Switch outlet"
                className="desktop:max-w-xs"
                htmlFor="v4-outlet"
              >
                <Dropdown
                  id="v4-outlet"
                  value={unit.id}
                  onChange={(e) => {
                    const next = units.find((u) => u.id === e.target.value);
                    if (next) pickOutlet(next);
                  }}
                >
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.unitNo} · {u.tenancyType}
                    </option>
                  ))}
                </Dropdown>
              </Field>
            )}

            {isContractor && (
              <Field
                label="Switch job"
                className="desktop:max-w-xs"
                htmlFor="v4-job"
              >
                <Dropdown
                  id="v4-job"
                  value={jobId}
                  onChange={(e) => pickJob(e.target.value)}
                >
                  {CONTRACTOR_JOBS.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.label}
                    </option>
                  ))}
                </Dropdown>
              </Field>
            )}

            {isOfficer && (
              <Tabs
                value={processView}
                onChange={(id) =>
                  setProcessView(id as "my-unit" | "full")
                }
                items={[
                  {
                    id: "my-unit",
                    label: "My unit",
                    disabled: isUnscoped,
                  },
                  { id: "full", label: "Full process" },
                ]}
              />
            )}
          </div>
        </div>

        {isOfficer && isUnscoped && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-grey-75 pt-4">
            <Text as="span" size="x-small" className="text-grey-500">
              Quick-scope a unit:
            </Text>
            {UNITS.slice(0, 4).map((u) => (
              <FilterChip
                key={u.id}
                onClick={() =>
                  setOfficerSelection({
                    terminal: u.terminal as "T1" | "T2" | "T3" | "T4",
                    tenancyType: u.tenancyType as "Retail" | "F&B",
                    zone: "Airside",
                  })
                }
              >
                {u.unitNo}
              </FilterChip>
            ))}
          </div>
        )}
      </section>

      <div className="flex flex-col gap-6 tablet:grid tablet:grid-cols-[minmax(220px,280px)_minmax(0,1fr)] tablet:items-start tablet:gap-6 desktop:grid-cols-[minmax(240px,300px)_minmax(0,1fr)] desktop:gap-8">
        <aside className="tablet:sticky tablet:top-6">
          <div className="overflow-hidden rounded-[12px] border border-grey-100 bg-white shadow-light">
            <div className="flex items-center justify-between border-b border-grey-75 px-3 py-3 tablet:px-4">
              <Text size="xx-small">Lifecycle overview</Text>
              <Badge label={PHASES.length} />
            </div>

            <nav aria-label="Lifecycle phases">
              <div className="tablet:hidden">
                <div className="flex gap-2 overflow-x-auto px-3 py-3">
                  {PHASES.map((p, i) => {
                    const isActive = p.id === activeId;
                    return (
                      <FilterChip
                        key={p.id}
                        selected={isActive}
                        onClick={() => selectPhase(p.id)}
                        leadingIcon={
                          <span className="grid h-4 w-4 place-items-center text-xxsmall font-black">
                            {i + 1}
                          </span>
                        }
                      >
                        {p.name}
                      </FilterChip>
                    );
                  })}
                </div>
                <div className="border-t border-primary-100 bg-primary-100/40 px-3 py-3">
                  <PhaseStepsPanel
                    active={active}
                    visibleStageCount={visibleStageCount}
                    navSteps={navSteps}
                    focusedStep={focusedStep}
                    onSelectStep={scrollToStep}
                  />
                </div>
              </div>

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
                          "focus-visible:outline-none focus-visible:shadow-ring-light",
                          isActive
                            ? "border-l-primary-600 bg-primary-100 text-primary-700"
                            : "border-l-transparent text-grey-400 hover:border-l-primary-300 hover:bg-primary-100 hover:text-primary-700",
                        )}
                      >
                        <span
                          className={cn(
                            "grid h-6 w-6 shrink-0 place-items-center rounded-full text-xsmall font-black transition",
                            isActive
                              ? "bg-primary-600 text-white"
                              : "border border-grey-200 bg-white text-grey-400 group-hover:border-transparent group-hover:bg-primary-600 group-hover:text-white",
                          )}
                        >
                          <span className="sr-only">Phase </span>
                          {i + 1}
                        </span>
                        <span className="min-w-0 flex-1">
                          <Text
                            as="span"
                            size="body-sm"
                            className={cn(
                              "block font-bold",
                              isActive
                                ? "text-primary-700"
                                : "text-grey-400 group-hover:text-primary-700",
                            )}
                          >
                            {p.name}
                          </Text>
                          <Text
                            as="span"
                            size="x-small"
                            className={cn(
                              "block font-semibold",
                              isActive
                                ? "text-primary-600"
                                : "text-grey-400 group-hover:text-primary-600",
                            )}
                          >
                            {p.stages.length} stage
                            {p.stages.length === 1 ? "" : "s"}
                          </Text>
                        </span>
                      </button>

                      {isActive && (
                        <div className="border-l-2 border-l-primary-600 bg-primary-100/40 px-3 py-3 pl-4">
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

        <div className="min-w-0">
          {!startHere && stageBlocks.every((b) => b.also.length === 0) && (
            <Alert tone="neutral" title={`Nothing in this guide for ${active.name}`}>
              {isContractor && active.id === "operate"
                ? "Operate stays with the tenant account — this works guide covers Setup, Build and Exit."
                : "No steps apply to this role and unit in this phase."}
            </Alert>
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
                      role={role}
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
                    summary={alsoLine(item.classified, role)}
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

      <DocumentPreviewDrawerV4
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
      <Text size="body-sm" className="text-grey-600">
        {active.description}
      </Text>
      {visibleStageCount < active.stages.length && (
        <Text size="x-small" className="mt-2 font-semibold text-primary-700">
          {visibleStageCount} of {active.stages.length} stages in this guide
        </Text>
      )}

      <Text size="xx-small" className="mt-3">
        Steps in {active.name}
      </Text>
      {navSteps.length === 0 ? (
        <Text size="body-sm" className="mt-2 text-grey-500">
          No guide steps in this phase for your unit.
        </Text>
      ) : (
        <ol aria-label={`${active.name} guide steps`} className="mt-2 space-y-0.5">
          {navSteps.map((item, idx) => {
            const key = stepFocusKey(item.stageName, item.stepName);
            const isFocused = key === focusedStep;
            const isNote = item.kind === "context";
            return (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => onSelectStep(item.stageName, item.stepName)}
                  className={cn(
                    "group flex w-full items-start gap-2 rounded-[8px] border-l-2 px-2.5 py-2 text-left transition",
                    "focus-visible:outline-none focus-visible:shadow-ring-light",
                    isFocused
                      ? isNote
                        ? "border-l-grey-400 bg-white/90 text-grey-800"
                        : "border-l-primary-600 bg-white/90 text-primary-700 shadow-light"
                      : "border-l-transparent text-grey-700 hover:bg-white/60 hover:text-primary-700",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 grid h-5 w-5 shrink-0 place-items-center text-xxsmall font-black",
                      isNote ? "rounded-[8px]" : "rounded-full",
                      isFocused
                        ? isNote
                          ? "border border-grey-400 bg-white text-grey-700"
                          : "bg-primary-600 text-white"
                        : "border border-grey-200 bg-white text-grey-500 group-hover:border-primary-300 group-hover:text-primary-700",
                    )}
                  >
                    {idx + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <Text
                      as="span"
                      size="body-sm"
                      className={cn("block", isFocused ? "font-bold" : "font-semibold")}
                    >
                      {item.stepName}
                    </Text>
                    <Text
                      as="span"
                      size="xx-small"
                      className={cn(
                        "mt-0.5 block",
                        isFocused
                          ? isNote
                            ? "text-grey-500"
                            : "text-primary-600"
                          : "text-grey-500 group-hover:text-primary-600",
                      )}
                    >
                      {item.stageName}
                    </Text>
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

  const flow = useMemo(() => {
    const rows: {
      kind: "you" | "others";
      text: string;
      tag?: string;
    }[] = [];
    for (const s of mine) rows.push({ kind: "you", text: s.text, tag: s.tag });
    for (const s of others)
      rows.push({ kind: "others", text: s.text, tag: s.tag });
    return rows;
  }, [mine, others]);

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
          stepFocused ? "bg-primary-300" : "bg-grey-100",
          isLast ? "h-6" : "bottom-0",
        )}
      />
      <span
        className={cn(
          "absolute top-0 left-0 z-10 grid place-items-center rounded-full text-xsmall font-black transition",
          stepFocused
            ? "h-7 w-7 border-2 border-primary-600 bg-white text-primary-700 shadow-ring-light"
            : "h-6 w-6 border border-grey-200 bg-white text-grey-500",
        )}
      >
        <span className="sr-only">Step </span>
        {index}
      </span>

      <article
        id={stepDomId(stageName, step.name)}
        tabIndex={0}
        onClick={() => onFocusStep(stageName, step.name)}
        className={cn(
          "scroll-mt-20 cursor-pointer rounded-[12px] border bg-white p-4 outline-none tablet:p-6 desktop:scroll-mt-8 desktop:p-8",
          "focus-visible:shadow-ring-light",
          stepFocused
            ? "border-primary-300 border-l-4 border-l-primary-600 bg-primary-100/40 shadow-light"
            : "border-grey-100 shadow-light hover:border-primary-200",
        )}
      >
        <header className="border-b border-grey-75 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            {(showStage || stepFocused) && (
              <StatusChip color={stepFocused ? "primary" : "grey"}>
                {stageName}
              </StatusChip>
            )}
          </div>
          <Text as="h3" size="h6" className="mt-2">
            {step.name}
          </Text>
          <Text size="body-sm" className="mt-2 max-w-3xl text-grey-500">
            {stepWhat(step, role)}
          </Text>
        </header>

        {flow.length > 0 && (
          <div className="pt-4">
            <Text size="xx-small">In this guide step</Text>
            <ul className="mt-3 space-y-3">
              {flow.map((row, i) => (
                <li key={i} className="flex items-start gap-3">
                  <StatusChip
                    color={row.kind === "you" ? "primary" : "grey"}
                    size="sm"
                  >
                    {row.kind === "you" ? "You" : "Others"}
                  </StatusChip>
                  <span
                    className={cn(
                      "min-w-0 text-body-s leading-[18px]",
                      row.kind === "you" ? "text-black" : "text-grey-600",
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

        {(people.length > 0 || systems.length > 0 || guideDocs.length > 0) && (
          <div className="mt-6 space-y-4 border-t border-grey-75 pt-4">
            {people.length > 0 && (
              <div>
                <Text size="xx-small" className="inline-flex items-center gap-2">
                  <Users className="h-3 w-3" /> People
                </Text>
                <div className="mt-2 flex flex-wrap gap-2">
                  {people.map((p) => (
                    <Link key={p} to="/contacts">
                      <AttributeChip className="hover:border-primary-300 hover:text-primary-700">
                        {p}
                      </AttributeChip>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {systems.length > 0 && (
              <div>
                <Text size="xx-small" className="inline-flex items-center gap-2">
                  <ExternalLink className="h-3 w-3" /> Systems
                </Text>
                <div className="mt-2 flex flex-wrap gap-2">
                  {systems.map((s) => (
                    <Link
                      key={s.label}
                      to="/apps"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="secondary_mono"
                        size="sm"
                        trailingIcon={<ExternalLink className="h-3 w-3" />}
                      >
                        {s.label}
                      </Button>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {guideDocs.length > 0 && (
              <div>
                <Text size="xx-small" className="inline-flex items-center gap-2">
                  <FileText className="h-3 w-3" /> Sample & reference documents
                </Text>
                <ul className="mt-2 flex flex-col gap-2">
                  {guideDocs.map((d) => (
                    <li key={d.id}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPreviewDoc(d.id);
                        }}
                        className="flex w-full flex-wrap items-center gap-2 rounded-[8px] border border-grey-200 bg-white px-3 py-2 text-left hover:border-primary-300 focus-visible:outline-none focus-visible:shadow-ring-light"
                      >
                        <FileText className="h-3.5 w-3.5 shrink-0 text-primary-600" />
                        <Text
                          as="span"
                          size="body-sm"
                          className="min-w-0 flex-1 font-bold"
                        >
                          {d.name}
                        </Text>
                        <StatusChip color="grey" size="sm">
                          {d.type}
                        </StatusChip>
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
          "absolute top-0 left-0 z-10 grid place-items-center rounded-[8px] bg-white text-xsmall font-black transition",
          stepFocused
            ? "h-7 w-7 border-2 border-grey-400 text-grey-700"
            : "h-6 w-6 border border-grey-200 text-grey-500",
        )}
      >
        <span className="sr-only">Step </span>
        {index}
      </span>
      <div
        id={stepDomId(stageName, title)}
        tabIndex={0}
        onClick={() => onFocusStep(stageName, title)}
        className={cn(
          "scroll-mt-20 cursor-pointer rounded-[8px] px-3 py-2.5 outline-none transition desktop:scroll-mt-8",
          "focus-visible:shadow-ring-light",
          stepFocused ? "bg-grey-75" : "bg-grey-50 hover:bg-grey-75",
        )}
      >
        <Text size="xx-small" className="text-grey-400">
          {stageName}
        </Text>
        <Text size="body-sm" className="mt-0.5 font-semibold text-grey-700">
          {title}
        </Text>
        <Text size="x-small" className="mt-1 text-grey-500">
          {summary}
        </Text>
        {guideDocs.length > 0 && (
          <ul className="mt-2 flex flex-col gap-1">
            {guideDocs.map((d) => (
              <li key={d.id}>
                <Button
                  variant="tertiary"
                  size="sm"
                  className="h-auto min-h-0 justify-start px-0 text-grey-500"
                  leadingIcon={<FileText className="h-3 w-3" />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onPreviewDoc(d.id);
                  }}
                >
                  {d.name}
                </Button>
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
    (tag.toLowerCase().includes("f&b") || tag.toLowerCase().includes("retail"));
  if (!showTag && !categoryCallout) return null;
  return (
    <StatusChip color="warning" size="sm" className="ml-2 align-middle">
      {showTag ? tag : `${tenancyType} relevant`}
    </StatusChip>
  );
}
