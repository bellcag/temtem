import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ChevronDown,
  ExternalLink,
  FileText,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import {
  PHASES,
  type Audience,
  type Phase,
  type Stage,
  type Step,
  type SubStep,
} from "@/lib/tenancy-data";
import { useApp, type Role } from "@/lib/app-state";
import { cn } from "@/lib/utils";

const LS_KEY = "tempo:lastPhase";

function audienceForRole(role: Role, audience: Audience): boolean {
  if (role === "officer") return true;
  if (audience === "shared") return true;
  if (Array.isArray(audience)) return audience.includes(role);
  if (role === "tenant") return audience === "tenant";
  if (role === "contractor") return audience === "contractor";
  return false;
}

function tagApplies(
  tag: string | undefined,
  tenancyType: string,
  terminal: string,
  showFull: boolean,
) {
  if (!tag) return true;
  if (showFull) return true;
  const t = tag.toLowerCase();
  if (t.includes("retail") && t.includes("f&b")) return true;
  if (t.includes("f&b") && !t.includes("retail") && tenancyType !== "F&B")
    return false;
  if (t.includes("retail") && !t.includes("f&b") && tenancyType !== "Retail")
    return false;
  if (t.includes("need gas") && tenancyType !== "F&B") return false;
  if (t.includes("t3 only") && terminal !== "T3") return false;
  if (t.includes("t4 only") && terminal !== "T4") return false;
  if (t.includes("t1 / t3") && terminal !== "T1" && terminal !== "T3")
    return false;
  if (t.includes("t2 / t4") && terminal !== "T2" && terminal !== "T4")
    return false;
  if (t.includes("landside")) return false;
  if (t.includes("duplex")) return false;
  if (t.includes("closed-door")) return false;
  if (t.includes("event space")) return false;
  return true;
}

function filterSubSteps(
  step: Step,
  role: Role,
  tenancyType: string,
  terminal: string,
  showFull: boolean,
): SubStep[] {
  return step.subSteps.filter((s) => {
    if (!audienceForRole(role, s.audience)) return false;
    return tagApplies(s.tag, tenancyType, terminal, showFull);
  });
}

function stepWhat(step: Step, role: Role) {
  return step.whatFor?.[role] ?? step.what;
}

/** Concrete action for the signed-in role (not dual-visible context). */
function isMyAction(role: Role, audience: Audience): boolean {
  if (audience === role) return true;
  if (Array.isArray(audience)) {
    if (role === "officer") return audience.includes("officer");
    return audience.includes(role) && !audience.includes("officer");
  }
  return false;
}

function partitionGuide(subs: SubStep[], role: Role) {
  const mine: SubStep[] = [];
  const others: SubStep[] = [];
  for (const s of subs) {
    if (isMyAction(role, s.audience)) mine.push(s);
    else others.push(s);
  }
  return { mine, others };
}

type ClassifiedStep = {
  step: Step;
  mine: SubStep[];
  others: SubStep[];
  kind: "yours" | "also";
};

function classifyStep(
  step: Step,
  role: Role,
  tenancyType: string,
  terminal: string,
  showFull: boolean,
): ClassifiedStep | null {
  const subs = filterSubSteps(step, role, tenancyType, terminal, showFull);
  if (subs.length === 0) return null;
  const { mine, others } = partitionGuide(subs, role);
  if (mine.length > 0) return { step, mine, others, kind: "yours" };
  return { step, mine, others, kind: "also" };
}

function classifyStage(
  stage: Stage,
  role: Role,
  tenancyType: string,
  terminal: string,
  showFull: boolean,
) {
  const yours: ClassifiedStep[] = [];
  const also: ClassifiedStep[] = [];
  for (const step of stage.steps) {
    const c = classifyStep(step, role, tenancyType, terminal, showFull);
    if (!c) continue;
    if (c.kind === "yours") yours.push(c);
    else also.push(c);
  }
  return { yours, also };
}

function countYourSteps(
  phase: Phase,
  role: Role,
  tenancyType: string,
  terminal: string,
  showFull: boolean,
) {
  return phase.stages.reduce((n, stage) => {
    const { yours } = classifyStage(stage, role, tenancyType, terminal, showFull);
    return n + yours.length;
  }, 0);
}

function alsoLine(c: ClassifiedStep, role: Role) {
  // Prefer a short human context line from others, else role purpose
  const fromOthers = c.others[0]?.text;
  if (fromOthers) return fromOthers;
  return stepWhat(c.step, role);
}

function primarySystemLink(step: Step, subs: SubStep[]) {
  if (!step.systems?.length) return null;
  const blob = subs.map((s) => s.text.toLowerCase()).join(" ");
  const preferred = ["OneCalendar", "TOPAZ", "Lease Management System", "WebEpic"];
  for (const label of preferred) {
    const hit = step.systems.find((s) => s.label === label);
    if (hit && blob.includes(label.toLowerCase())) return hit;
  }
  const named = step.systems.find((s) => blob.includes(s.label.toLowerCase()));
  return named ?? null;
}

export function ProcessPage() {
  const {
    role,
    unit,
    effectiveUnit,
    isUnscoped,
    processView,
    setProcessView,
  } = useApp();
  const [params] = useSearchParams();
  const isOfficer = role === "officer";
  const isContractor = role === "contractor";
  const [activeId, setActiveId] = useState<Phase["id"]>("setup");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [detail, setDetail] = useState<{
    phaseId: Phase["id"];
    stageName: string;
    step: Step;
  } | null>(null);

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

  useEffect(() => {
    setDetail(null);
  }, [role]);

  const selectPhase = (id: Phase["id"]) => {
    setActiveId(id);
    window.localStorage.setItem(LS_KEY, id);
    setDetail(null);
  };

  const active = PHASES.find((p) => p.id === activeId)!;
  const ctxUnit = effectiveUnit ?? unit;
  const showFull = isOfficer && (processView === "full" || isUnscoped);
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

  const roleBlurb = isContractor
    ? `Your works path · ${ctxUnit.terminal} · ${ctxUnit.tenancyType} · Airside`
    : isOfficer
      ? showFull
        ? "Your officer coordination path — full catalogue for this walkthrough."
        : `Your officer path for ${ctxUnit.unitNo} · ${ctxUnit.terminal} · ${ctxUnit.tenancyType} · Airside`
      : `Your tenant path for ${ctxUnit.unitNo} · ${ctxUnit.terminal} · ${ctxUnit.tenancyType} · Airside`;

  const yourStepsFlat = useMemo(() => {
    const list: { stageName: string; classified: ClassifiedStep }[] = [];
    for (const b of stageBlocks) {
      for (const c of b.yours) {
        list.push({ stageName: b.stage.name, classified: c });
      }
    }
    return list;
  }, [stageBlocks]);

  const startHere = yourStepsFlat[0] ?? null;
  const yourCount = yourStepsFlat.length;

  const openDetail = (stageName: string, step: Step) => {
    setDetail({ phaseId: active.id, stageName, step });
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1>Process</h1>
          <p className="mt-1 text-grey-500">{roleBlurb}</p>
        </div>
        <Link
          to="/process-v2"
          className="text-xs font-bold text-purple-700 hover:underline"
        >
          Open v2
        </Link>
      </header>

      {isOfficer && (
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <div className="inline-flex gap-1 rounded-[var(--radius-sm)] border border-grey-200 bg-white p-1">
            <button
              type="button"
              disabled={isUnscoped}
              onClick={() => !isUnscoped && setProcessView("my-unit")}
              className={cn(
                "rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-bold transition",
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
                "rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-bold transition",
                processView === "full"
                  ? "bg-purple-600 text-white"
                  : "text-grey-500 hover:text-black",
              )}
            >
              Full process
            </button>
          </div>
          {isUnscoped && (
            <span className="text-[11px] text-grey-500">
              Select unit context in the sidebar to filter tagged branches.
            </span>
          )}
        </div>
      )}

      {/* Phase chips */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {PHASES.map((p, i) => {
          const isActive = p.id === activeId;
          const n = countYourSteps(
            p,
            role,
            ctxUnit.tenancyType,
            ctxUnit.terminal,
            showFull,
          );
          const empty = n === 0;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => selectPhase(p.id)}
              className={cn(
                "rounded-[var(--radius-2xl)] border px-4 py-3 text-left transition",
                isActive
                  ? "border-purple-600 bg-purple-100"
                  : empty
                    ? "border-grey-100 bg-grey-25 opacity-70 hover:border-grey-200"
                    : "border-grey-100 bg-white hover:border-purple-300",
              )}
            >
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-grey-500">
                <span
                  className={cn(
                    "grid h-5 w-5 place-items-center rounded-full text-[10px]",
                    isActive
                      ? "bg-purple-600 text-white"
                      : "bg-grey-75 text-grey-600",
                  )}
                >
                  {i + 1}
                </span>
                {p.name}
              </div>
              <p className="mt-2 text-sm font-bold text-black">
                {empty ? "Nothing in your path" : `${n} for you`}
              </p>
              {!empty && (
                <p className="mt-1 text-xs leading-snug text-grey-500">
                  {p.description}
                </p>
              )}
            </button>
          );
        })}
      </div>

      {/* Start here */}
      {startHere && (
        <div className="mt-8 rounded-[var(--radius-2xl)] border border-purple-200 bg-purple-50 px-5 py-4">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-purple-700">
            <Sparkles className="h-3.5 w-3.5" />
            Start here for {active.name}
          </div>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-black">
                {startHere.classified.step.name}
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-grey-600">
                {stepWhat(startHere.classified.step, role)}
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                openDetail(startHere.stageName, startHere.classified.step)
              }
              className="rounded-[var(--radius-sm)] bg-purple-600 px-3 py-2 text-xs font-bold text-white hover:bg-purple-700"
            >
              View full guidance
            </button>
          </div>
        </div>
      )}

      {yourCount === 0 && stageBlocks.every((b) => b.also.length === 0) && (
        <div className="mt-8 rounded-[var(--radius-2xl)] border border-grey-100 bg-white px-5 py-8 text-center text-sm text-grey-500">
          Nothing in your path for {active.name}.
          {isContractor && active.id === "operate"
            ? " Operate is for the tenant account — your works path covers Setup, Build and Exit."
            : null}
        </div>
      )}

      {/* Stages */}
      <div className="mt-8 space-y-8">
        {stageBlocks.map(({ stage, si, yours, also }) => {
          const key = `${active.id}-${si}`;
          const isCollapsed = collapsed[key];
          const contextOnly = yours.length === 0 && also.length > 0;
          return (
            <section key={key}>
              <button
                type="button"
                onClick={() =>
                  setCollapsed((c) => ({ ...c, [key]: !c[key] }))
                }
                className="mb-3 flex w-full items-start justify-between gap-3 text-left"
              >
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-grey-500">
                    Stage {si + 1}
                    {contextOnly ? " · Also happening" : ""}
                  </div>
                  <h3 className="mt-0.5 text-lg font-black text-black">
                    {stage.name}
                  </h3>
                  <p className="mt-0.5 text-sm text-grey-500">{stage.purpose}</p>
                </div>
                <ChevronDown
                  className={cn(
                    "mt-1 h-5 w-5 shrink-0 text-grey-400 transition",
                    isCollapsed && "-rotate-90",
                  )}
                />
              </button>

              {!isCollapsed && (
                <div className="space-y-5">
                  {yours.length > 0 && (
                    <div>
                      <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-purple-700">
                        Your steps
                      </div>
                      <div className="space-y-3">
                        {yours.map((c, idx) => (
                          <YourStepCard
                            key={c.step.name}
                            classified={c}
                            index={idx + 1}
                            role={role}
                            showFull={showFull}
                            tenancyType={ctxUnit.tenancyType}
                            onOpen={() => openDetail(stage.name, c.step)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {also.length > 0 && (
                    <div
                      className={cn(
                        yours.length > 0 && "border-t border-grey-75 pt-4",
                      )}
                    >
                      <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-grey-500">
                        Also happening
                      </div>
                      <ul className="space-y-2">
                        {also.map((c) => (
                          <li key={c.step.name}>
                            <button
                              type="button"
                              onClick={() => openDetail(stage.name, c.step)}
                              className="group flex w-full items-start gap-2 rounded-[var(--radius-sm)] px-1 py-1 text-left hover:bg-grey-25"
                            >
                              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-grey-300" />
                              <span className="min-w-0">
                                <span className="text-xs font-bold text-grey-500 group-hover:text-purple-700">
                                  {c.step.name}
                                </span>
                                <span className="mt-0.5 block text-sm leading-relaxed text-grey-500">
                                  {alsoLine(c, role)}
                                </span>
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </section>
          );
        })}
      </div>

      {detail && (
        <StepDetailDrawer
          phaseName={PHASES.find((p) => p.id === detail.phaseId)!.name}
          stageName={detail.stageName}
          step={detail.step}
          role={role}
          showFull={showFull}
          tenancyType={ctxUnit.tenancyType}
          terminal={ctxUnit.terminal}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  );
}

function YourStepCard({
  classified,
  index,
  role,
  showFull,
  tenancyType,
  onOpen,
}: {
  classified: ClassifiedStep;
  index: number;
  role: Role;
  showFull: boolean;
  tenancyType: string;
  onOpen: () => void;
}) {
  const { step, mine, others } = classified;
  const system = primarySystemLink(step, [...mine, ...others]);

  return (
    <article className="rounded-[var(--radius-2xl)] border border-grey-100 bg-white p-5 shadow-[var(--shadow-light-bg)]">
      <div className="flex items-start gap-3">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-purple-100 text-xs font-black text-purple-700">
          {index}
        </span>
        <div className="min-w-0 flex-1">
          <h4 className="leading-snug font-bold text-black">{step.name}</h4>
          <p className="mt-1 text-sm leading-relaxed text-grey-500">
            {stepWhat(step, role)}
          </p>

          {mine.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {mine.map((s, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-black"
                >
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-purple-600" />
                  <span className="leading-relaxed">
                    {s.text}
                    {showFull && s.tag && (
                      <span className="ml-1.5 inline-flex items-center rounded bg-warning-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-warning-600">
                        {s.tag}
                      </span>
                    )}
                    {!showFull &&
                      s.tag &&
                      (s.tag.toLowerCase().includes("f&b") ||
                        s.tag.toLowerCase().includes("retail")) && (
                        <span className="ml-1.5 inline-flex items-center rounded bg-warning-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-warning-600">
                          {tenancyType} relevant
                        </span>
                      )}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {others.length > 0 && (
            <p className="mt-2 text-xs leading-relaxed text-grey-400">
              Around this step: {others[0].text}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onOpen}
              className="rounded-[var(--radius-sm)] bg-purple-600 px-3 py-2 text-xs font-bold text-white hover:bg-purple-700"
            >
              View full guidance
            </button>
            {system && (
              <Link
                to="/apps"
                className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] border border-grey-200 bg-white px-3 py-2 text-xs font-bold text-black hover:border-purple-300 hover:text-purple-700"
              >
                Open {system.label}
                <ExternalLink className="h-3 w-3" />
              </Link>
            )}
            {step.documents?.slice(0, 1).map((d) => (
              <Link
                key={d.id}
                to={`/documents/${d.id}`}
                className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] bg-purple-100 px-2 py-1.5 text-xs font-bold text-purple-700"
              >
                <FileText className="h-3 w-3" />
                {d.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

function StepDetailDrawer({
  phaseName,
  stageName,
  step,
  role,
  showFull,
  tenancyType,
  terminal,
  onClose,
}: {
  phaseName: string;
  stageName: string;
  step: Step;
  role: Role;
  showFull: boolean;
  tenancyType: string;
  terminal: string;
  onClose: () => void;
}) {
  const classified = useMemo(
    () => classifyStep(step, role, tenancyType, terminal, showFull),
    [step, role, tenancyType, terminal, showFull],
  );
  const mine = classified?.mine ?? [];
  const others = classified?.others ?? [];
  const people = step.people ?? [];
  const systems = useMemo(() => {
    if (!step.systems?.length) return [];
    if (role === "officer") return step.systems;
    const blob = [...mine, ...others].map((s) => s.text.toLowerCase()).join(" ");
    const matched = step.systems.filter((s) =>
      blob.includes(s.label.toLowerCase()),
    );
    const internal = new Set([
      "newforma",
      "hard disk",
      "customer discovery insights",
      "excel",
    ]);
    if (matched.length > 0) return matched;
    return step.systems.filter((s) => !internal.has(s.label.toLowerCase()));
  }, [step.systems, mine, others, role]);
  const systemCta = primarySystemLink(step, [...mine, ...others]);

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-[rgba(18,18,18,0.4)]">
      <button
        type="button"
        className="flex-1 cursor-default"
        aria-label="Close"
        onClick={onClose}
      />
      <aside className="flex h-full w-full max-w-xl flex-col bg-white shadow-[var(--shadow-light-bg)]">
        <header className="flex items-start justify-between border-b border-grey-75 px-6 py-5">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-grey-500">
              {phaseName} · {stageName}
            </div>
            <h2 className="mt-1">{step.name}</h2>
            <span
              className={cn(
                "mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold",
                classified?.kind === "yours"
                  ? "bg-purple-100 text-purple-700"
                  : "bg-grey-75 text-grey-700",
              )}
            >
              {classified?.kind === "yours" ? "Your step" : "Also happening"}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[var(--radius-sm)] p-1.5 text-grey-500 hover:bg-grey-50"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          <p className="text-sm leading-relaxed text-grey-600">
            {stepWhat(step, role)}
          </p>

          {mine.length > 0 && (
            <div>
              <FieldLabel>What you do</FieldLabel>
              <ul className="mt-2 space-y-2">
                {mine.map((s, i) => (
                  <GuideLine
                    key={i}
                    text={s.text}
                    tag={s.tag}
                    showTag={showFull}
                    tenancyType={tenancyType}
                    emphasis
                  />
                ))}
              </ul>
            </div>
          )}

          {others.length > 0 && (
            <div>
              <FieldLabel>Around this step</FieldLabel>
              <ul className="mt-2 space-y-2">
                {others.map((s, i) => (
                  <GuideLine
                    key={i}
                    text={s.text}
                    tag={s.tag}
                    showTag={showFull}
                    tenancyType={tenancyType}
                    emphasis={false}
                  />
                ))}
              </ul>
            </div>
          )}

          {people.length > 0 && (
            <div>
              <FieldLabel>
                <Users className="h-3 w-3" /> People involved
              </FieldLabel>
              <div className="mt-2 flex flex-wrap gap-1.5">
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
              <div className="mt-2 flex flex-wrap gap-1.5">
                {systems.map((s) => (
                  <Link
                    key={s.label}
                    to="/apps"
                    className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] border border-grey-200 bg-white px-2 py-1 text-xs font-bold text-black hover:border-purple-300 hover:text-purple-700"
                  >
                    {s.label}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {step.documents && step.documents.length > 0 && (
            <div>
              <FieldLabel>
                <FileText className="h-3 w-3" /> Documents
              </FieldLabel>
              <div className="mt-2 flex flex-col gap-1.5">
                {step.documents.map((d) => (
                  <Link
                    key={d.id}
                    to={`/documents/${d.id}`}
                    className="inline-flex w-fit items-center gap-1.5 rounded-[var(--radius-sm)] bg-purple-100 px-2 py-1.5 text-xs font-bold text-purple-700"
                  >
                    <FileText className="h-3 w-3" />
                    {d.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {systemCta && (
            <Link
              to="/apps"
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-[var(--radius-sm)] bg-purple-600 px-3 py-2.5 text-xs font-bold text-white hover:bg-purple-700"
            >
              Go to {systemCta.label}
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          )}

          <div className="rounded-[var(--radius-2xl)] border border-grey-100 bg-grey-25 p-4">
            <FieldLabel>Need help?</FieldLabel>
            <p className="mt-1 text-sm text-grey-600">
              {role === "officer"
                ? "Open Contacts for stakeholders and query channels."
                : "Open Contacts for your Project Officer and query channels."}
            </p>
            <div className="mt-3">
              <Link
                to="/contacts"
                className="rounded-[var(--radius-sm)] border border-grey-200 bg-white px-3 py-2 text-xs font-bold text-black"
              >
                Open Contacts
              </Link>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

function GuideLine({
  text,
  tag,
  showTag,
  tenancyType,
  emphasis,
}: {
  text: string;
  tag?: string;
  showTag: boolean;
  tenancyType: string;
  emphasis: boolean;
}) {
  const categoryCallout =
    !showTag &&
    tag &&
    (tag.toLowerCase().includes("f&b") ||
      tag.toLowerCase().includes("retail"));

  return (
    <li
      className={cn(
        "flex items-start gap-2 text-sm",
        emphasis ? "text-black" : "text-grey-600",
      )}
    >
      <span
        className={cn(
          "mt-2 h-1 w-1 shrink-0 rounded-full",
          emphasis ? "bg-purple-600" : "bg-grey-300",
        )}
      />
      <span className="leading-relaxed">
        {text}
        {tag && (showTag || categoryCallout) && (
          <span className="ml-1.5 inline-flex items-center rounded bg-warning-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-warning-600">
            {showTag ? tag : `${tenancyType} relevant`}
          </span>
        )}
      </span>
    </li>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-grey-500">
      {children}
    </div>
  );
}
