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
import { DocumentPreviewDrawer } from "@/components/DocumentPreviewDrawer";
import {
  AttributeChip,
  Button,
  ContextNote as ContextNoteView,
  DropdownField,
  GuideStepCard,
  GuideTimeline,
  GuideTimelineItem,
  LifecycleNav,
  LinkChip,
  MicroLabel,
  SegmentedControl,
  StatusChip,
} from "@/components/runway";
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

export function ProcessV3Page() {
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
            <h1>Process</h1>
            <StatusChip tone="neutral" className="!px-2 !py-1 !text-xs !normal-case tracking-normal">
              Guide only
            </StatusChip>
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
                  <AttributeChip>{ctxUnit.terminal}</AttributeChip>
                  <AttributeChip>{ctxUnit.tenancyType}</AttributeChip>
                  <AttributeChip>{ctxUnit.zone}</AttributeChip>
                  {!isContractor && <AttributeChip>{ctxUnit.company}</AttributeChip>}
                </div>
              </>
            )}
          </div>

          <div className="flex w-full flex-col gap-3 desktop:col-span-4 desktop:items-end">
            {isTenant && (
              <DropdownField
                label="Switch outlet"
                value={unit.id}
                onChange={(e) => {
                  const next = units.find((u) => u.id === e.target.value);
                  if (next) pickOutlet(next);
                }}
                className="desktop:max-w-xs"
              >
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.unitNo} · {u.tenancyType}
                  </option>
                ))}
              </DropdownField>
            )}

            {isContractor && (
              <DropdownField
                label="Switch job"
                value={jobId}
                onChange={(e) => pickJob(e.target.value)}
                className="desktop:max-w-xs"
              >
                {CONTRACTOR_JOBS.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.label}
                  </option>
                ))}
              </DropdownField>
            )}

            {isOfficer && (
              <SegmentedControl
                className="w-full desktop:w-auto"
                options={[
                  { id: "my-unit" as const, label: "My unit", disabled: isUnscoped },
                  { id: "full" as const, label: "Full process" },
                ]}
                value={processView === "full" ? "full" : "my-unit"}
                onSelect={(v) => setProcessView(v)}
              />
            )}
          </div>
        </div>

        {isOfficer && isUnscoped && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-grey-75 pt-4">
            <span className="self-center text-[11px] text-grey-500">
              Quick-scope a unit:
            </span>
            {UNITS.slice(0, 4).map((u) => (
              <Button
                key={u.id}
                variant="secondary"
                size="sm"
                onClick={() =>
                  setOfficerSelection({
                    terminal: u.terminal as "T1" | "T2" | "T3" | "T4",
                    tenancyType: u.tenancyType as "Retail" | "F&B",
                    zone: "Airside",
                  })
                }
              >
                {u.unitNo}
              </Button>
            ))}
          </div>
        )}
      </section>

      {/* F2 + F3 — side-by-side from tablet: overview nav | guide content */}
      <div className="flex flex-col gap-6 tablet:grid tablet:grid-cols-[minmax(220px,280px)_minmax(0,1fr)] tablet:items-start tablet:gap-6 desktop:grid-cols-[minmax(240px,300px)_minmax(0,1fr)] desktop:gap-8">
        <aside className="tablet:sticky tablet:top-6">
          <LifecycleNav
            phases={PHASES}
            activeId={activeId}
            onSelectPhase={selectPhase}
            active={active}
            visibleStageCount={visibleStageCount}
            navSteps={navSteps}
            focusedStep={focusedStep}
            onSelectStep={scrollToStep}
          />
        </aside>

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
            <GuideTimeline>
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
                  <ContextNoteItem
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
            </GuideTimeline>
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

  /** One reading order: your moves first, others woven in the same list. */
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
    <GuideTimelineItem
      index={index}
      focused={stepFocused}
      variant="action"
      isLast={isLast}
      nextIsNote={nextIsNote}
    >
      <GuideStepCard
        id={stepDomId(stageName, step.name)}
        focused={stepFocused}
        stageName={stageName}
        showStage={showStage}
        title={step.name}
        summary={stepWhat(step, role)}
        onFocus={() => onFocusStep(stageName, step.name)}
      >
        {flow.length > 0 && (
          <div className="pt-4">
            <MicroLabel>In this guide step</MicroLabel>
            <ul className="mt-3 space-y-3">
              {flow.map((row, i) => (
                <li key={i} className="flex items-start gap-3">
                  <StatusChip
                    tone={row.kind === "you" ? "emphasis" : "neutral"}
                    className="mt-0.5 shrink-0"
                  >
                    {row.kind === "you" ? "You" : "Others"}
                  </StatusChip>
                  <span
                    className={cn(
                      "min-w-0 text-sm leading-relaxed",
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

        {(people.length > 0 ||
          systems.length > 0 ||
          guideDocs.length > 0) && (
          <div className="mt-6 space-y-4 border-t border-grey-75 pt-4">
            {people.length > 0 && (
              <div>
                <MicroLabel>
                  <Users className="h-3 w-3" /> People
                </MicroLabel>
                <div className="mt-2 flex flex-wrap gap-2">
                  {people.map((p) => (
                    <LinkChip key={p} to="/contacts">
                      {p}
                    </LinkChip>
                  ))}
                </div>
              </div>
            )}

            {systems.length > 0 && (
              <div>
                <MicroLabel>
                  <ExternalLink className="h-3 w-3" /> Systems
                </MicroLabel>
                <div className="mt-2 flex flex-wrap gap-2">
                  {systems.map((s) => (
                    <LinkChip
                      key={s.label}
                      to="/apps"
                      outlined
                      onClick={(e) => e.stopPropagation()}
                      endAdornment={<ExternalLink className="h-3 w-3" />}
                    >
                      {s.label}
                    </LinkChip>
                  ))}
                </div>
              </div>
            )}

            {guideDocs.length > 0 && (
              <div>
                <MicroLabel>
                  <FileText className="h-3 w-3" /> Sample & reference documents
                </MicroLabel>
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
                        <AttributeChip>{d.type}</AttributeChip>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </GuideStepCard>
    </GuideTimelineItem>
  );
}

function ContextNoteItem({
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
    <GuideTimelineItem
      index={index}
      focused={stepFocused}
      variant="note"
      isLast={isLast}
      nextIsNote={nextIsNote}
    >
      <ContextNoteView
        id={stepDomId(stageName, title)}
        stageName={stageName}
        title={title}
        summary={summary}
        focused={stepFocused}
        onFocus={() => onFocusStep(stageName, title)}
      >
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
      </ContextNoteView>
    </GuideTimelineItem>
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
    <StatusChip tone="warning" className="ml-2">
      {showTag ? tag : `${tenancyType} relevant`}
    </StatusChip>
  );
}
