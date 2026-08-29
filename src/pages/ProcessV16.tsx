import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronDown, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { useApp, type Role } from "@/lib/app-state";
import { UNITS, type Unit } from "@/lib/tenancy-data";
import {
  JOURNEY_CARDS,
  PHASES,
  STAKEHOLDERS,
  cardVisible,
  cardsInPhase,
  isListed,
  isMyCard,
  stagesInPhase,
  type JourneyCard,
  type JourneyRule,
  type PhaseId,
  type Stakeholder,
} from "@/lib/journey-cards";
import {
  PHASE_FACE,
  eligibilityLines,
  faceAction,
  faceRule,
  faceStage,
  faceStep,
  faceTitle,
  ruleBadge,
  splitListed,
} from "@/lib/journey-voice";
import {
  TENANT_PATH,
  tenantPathTotal,
  tenantStepsInPhase,
} from "@/lib/tenant-path";
import {
  CONTRACTOR_PATH,
  contractorPathTotal,
  contractorStepsInPhase,
} from "@/lib/contractor-path";
import { TenantStepCard } from "@/components/TenantStepCard";
import { ContractorStepCard } from "@/components/ContractorStepCard";
import { cn } from "@/lib/utils";

const LS_PHASE = "tempo:v16:phase";
const LS_WHO = "tempo:v16:who";

const ROLE_TO_WHO: Record<Role, Stakeholder> = {
  tenant: "Tenant",
  contractor: "Contractor",
  officer: "Project Officer",
};

type JourneyItem = {
  kind: "you" | "context";
  card: JourneyCard;
};

function roleFromApp(role: Role): Stakeholder {
  return ROLE_TO_WHO[role];
}

const PRIMARY_ROLES: { who: Stakeholder; role: Role; hint: string }[] = [
  { who: "Tenant", role: "tenant", hint: "You'll only see your steps" },
  { who: "Contractor", role: "contractor", hint: "You'll only see your steps" },
  {
    who: "Project Officer",
    role: "officer",
    hint: "You'll see everyone's steps so you can guide them",
  },
];

export function ProcessV16Page() {
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
  const isOfficer = role === "officer";

  const [params, setParams] = useSearchParams();
  const [who, setWho] = useState<Stakeholder>(roleFromApp(role));
  const [activeId, setActiveId] = useState<PhaseId>(() => {
    const raw = (params.get("phase") ?? "").toLowerCase();
    return PHASES.find((p) => p.id.toLowerCase() === raw)?.id ?? "Setup";
  });
  const [focusedN, setFocusedN] = useState<number | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    setWho(roleFromApp(role));
  }, [role]);

  // URL is the source of truth for phase when ?phase= is present.
  useEffect(() => {
    const raw = (params.get("phase") ?? "").toLowerCase();
    const fromUrl = PHASES.find((p) => p.id.toLowerCase() === raw);
    if (fromUrl) {
      setActiveId(fromUrl.id);
      window.localStorage.setItem(LS_PHASE, fromUrl.id);
      return;
    }
    // Seed a shareable phase into the URL once if missing.
    const saved = window.localStorage.getItem(LS_PHASE) as PhaseId | null;
    const seed =
      saved && PHASES.some((p) => p.id === saved) ? saved : ("Setup" as PhaseId);
    setActiveId(seed);
    const next = new URLSearchParams(params);
    next.set("phase", seed.toLowerCase());
    setParams(next, { replace: true });
  }, [params, setParams]);

  useEffect(() => {
    const next = !isOfficer ? "my-unit" : isUnscoped ? "full" : "my-unit";
    if (processView !== next) setProcessView(next);
  }, [isUnscoped, isOfficer, processView, setProcessView]);

  const ctxUnit: Unit = effectiveUnit ?? unit;
  const showFull = isOfficer && (processView === "full" || isUnscoped);
  const seesEveryone = isOfficer;
  const tenantMode = who === "Tenant";
  const contractorMode = who === "Contractor";
  const condensedMode = tenantMode || contractorMode;

  const ctx = {
    tenancyType: ctxUnit.tenancyType,
    terminal: ctxUnit.terminal,
    showFull,
    who,
    seesEveryone,
  };

  const phaseCards = useMemo(() => {
    return cardsInPhase(activeId).filter((c) =>
      cardVisible(c, {
        tenancyType: ctxUnit.tenancyType,
        terminal: ctxUnit.terminal,
        showFull,
        who,
        seesEveryone,
      }),
    );
  }, [
    activeId,
    ctxUnit.tenancyType,
    ctxUnit.terminal,
    showFull,
    who,
    seesEveryone,
  ]);

  const tenantPhaseSteps = useMemo(
    () => tenantStepsInPhase(activeId),
    [activeId],
  );
  const contractorPhaseSteps = useMemo(
    () => contractorStepsInPhase(activeId),
    [activeId],
  );
  const condensedPhaseSteps = tenantMode
    ? tenantPhaseSteps
    : contractorMode
      ? contractorPhaseSteps
      : [];
  const condensedPath = tenantMode
    ? TENANT_PATH
    : contractorMode
      ? CONTRACTOR_PATH
      : [];
  const condensedTotal = tenantMode
    ? tenantPathTotal()
    : contractorMode
      ? contractorPathTotal()
      : 0;

  const journeyItems = useMemo<JourneyItem[]>(() => {
    return phaseCards.map((card) => ({
      kind: isMyCard(card, who) ? "you" : "context",
      card,
    }));
  }, [phaseCards, who]);

  const yourItems = journeyItems.filter((i) => i.kind === "you");
  const startHere = yourItems[0] ?? journeyItems[0] ?? null;
  const condensedStart = condensedPhaseSteps[0]?.id ?? null;

  const journeyKey = condensedMode
    ? condensedPhaseSteps.map((s) => s.id).join(",")
    : journeyItems.map((i) => i.card.n).join(",");
  const startN = condensedMode ? condensedStart : (startHere?.card.n ?? null);
  useEffect(() => {
    const ids = journeyKey ? journeyKey.split(",").map(Number) : [];
    setFocusedN((prev) => {
      if (prev && ids.includes(prev)) return prev;
      return startN;
    });
    setShowDetails(false);
  }, [activeId, who, journeyKey, startN]);

  const focused = journeyItems.find((i) => i.card.n === focusedN) ?? startHere;
  const focusIndex = focused
    ? journeyItems.findIndex((i) => i.card.n === focused.card.n)
    : -1;
  const prevItem = focusIndex > 0 ? journeyItems[focusIndex - 1] : null;
  const nextItem =
    focusIndex >= 0 && focusIndex < journeyItems.length - 1
      ? journeyItems[focusIndex + 1]
      : null;

  const condensedFocus =
    condensedPhaseSteps.find((s) => s.id === focusedN) ??
    condensedPhaseSteps[0] ??
    null;
  const condensedFocusIndex = condensedFocus
    ? condensedPhaseSteps.findIndex((s) => s.id === condensedFocus.id)
    : -1;
  const condensedPrev =
    condensedFocusIndex > 0
      ? condensedPhaseSteps[condensedFocusIndex - 1]
      : null;
  const condensedNext =
    condensedFocusIndex >= 0 &&
    condensedFocusIndex < condensedPhaseSteps.length - 1
      ? condensedPhaseSteps[condensedFocusIndex + 1]
      : null;
  const condensedNextAcross =
    condensedNext ??
    condensedPath.find(
      (s) => condensedFocus && s.id === condensedFocus.id + 1,
    );

  const selectPhase = (id: PhaseId) => {
    setActiveId(id);
    window.localStorage.setItem(LS_PHASE, id);
    const next = new URLSearchParams(params);
    next.set("phase", id.toLowerCase());
    setParams(next, { replace: true });
  };

  const signInAs = (next: Stakeholder) => {
    setWho(next);
    window.localStorage.setItem(LS_WHO, next);
    const mapped = PRIMARY_ROLES.find((r) => r.who === next);
    if (mapped && mapped.role !== role) setRole(mapped.role);
  };

  const highlightWho = (next: Stakeholder) => {
    setWho(next);
    window.localStorage.setItem(LS_WHO, next);
  };

  const focusCard = (n: number) => {
    setFocusedN(n);
    setShowDetails(false);
    document.getElementById(`card-${n}`)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const visibleStages = condensedMode
    ? [...new Set(condensedPhaseSteps.map((s) => s.stage))]
    : stagesInPhase(activeId).filter((stage) =>
        journeyItems.some((i) => i.card.stage === stage),
      );

  const yourCount = condensedMode
    ? condensedPhaseSteps.length
    : yourItems.length;
  const contextCount = journeyItems.length - yourItems.length;
  const condensedPhaseIndex = condensedFocus
    ? condensedPhaseSteps.findIndex((s) => s.id === condensedFocus.id) + 1
    : 0;
  const phaseFaceName = PHASE_FACE[activeId]?.name ?? activeId;

  return (
    <div className="dls-page">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4 desktop:mb-8">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h1 className="text-grey-800">
              {contractorMode
                ? "Your permit workbench"
                : "Follow your renovation"}
            </h1>
          </div>
          <p className="dls-body mt-1 max-w-2xl text-grey-500">
            {tenantMode
              ? "You'll only see your steps. Each card says where you are, when it happens, what to do, and what to open."
              : contractorMode
                ? "You'll only see your steps. Access, the permits that apply, one PTW submit, inspect, hoard, work, as-builts, defects, then reinstatement PTW."
                : "You'll only see the steps that are yours. If you're a Project Officer, you'll see everyone's steps so you can guide them."}
          </p>
        </div>
      </header>

      <section className="mb-6 rounded-[var(--radius-md)] border border-grey-100 bg-white p-4 shadow-[var(--shadow-light-bg)] tablet:p-6 desktop:mb-8 desktop:p-8">
        <div className="dls-grid-12 items-start">
          <div className="min-w-0 desktop:col-span-7">
            <div className="dls-caption">Your unit</div>
            {isOfficer && isUnscoped && processView !== "full" ? (
              <p className="mt-2 text-sm text-grey-600">
                Pick a unit so we can hide steps that don&apos;t apply.
              </p>
            ) : (
              <>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0 text-purple-600" />
                  <span className="text-base font-bold text-grey-800 desktop:text-lg desktop:leading-[22px]">
                    {ctxUnit.unitNo}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="dls-attr-chip">{ctxUnit.terminal}</span>
                  <span className="dls-attr-chip">{ctxUnit.tenancyType}</span>
                  <span className="dls-attr-chip">{ctxUnit.zone}</span>
                  <span className="dls-attr-chip">{ctxUnit.company}</span>
                </div>
              </>
            )}
          </div>

          <div className="flex w-full flex-col gap-3 desktop:col-span-5 desktop:items-end">
            <div className="w-full desktop:max-w-sm">
              <span className="dls-caption">Who you are</span>
              <div className="mt-2 grid grid-cols-3 gap-1 rounded-[var(--radius-md)] border border-grey-200 bg-grey-25 p-1">
                {PRIMARY_ROLES.map((r) => (
                  <button
                    key={r.who}
                    type="button"
                    onClick={() => signInAs(r.who)}
                    className={cn(
                      "rounded-[var(--radius-md)] px-2 py-2 text-[12px] font-bold leading-4",
                      who === r.who
                        ? "border border-purple-600 bg-purple-100 text-purple-600"
                        : "border border-transparent text-grey-600 hover:bg-purple-100 hover:text-purple-600",
                    )}
                    title={r.hint}
                  >
                    {r.who === "Project Officer" ? "Officer" : r.who}
                  </button>
                ))}
              </div>
            </div>
            {isOfficer && (
              <label className="flex w-full flex-col gap-1 desktop:max-w-sm">
                <span className="dls-caption">Whose steps to highlight</span>
                <select
                  value={who}
                  onChange={(e) => highlightWho(e.target.value as Stakeholder)}
                  className="w-full rounded-[var(--radius-sm)] border border-grey-200 bg-white px-3 py-2 text-sm font-bold text-black"
                >
                  {STAKEHOLDERS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                      {s === "System" ? " (OneCalendar)" : ""}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {role === "tenant" && (
              <label className="flex w-full flex-col gap-1 desktop:max-w-sm">
                <span className="dls-caption">Your outlet</span>
                <select
                  value={unit.id}
                  onChange={(e) => {
                    const next = units.find((u) => u.id === e.target.value);
                    if (next) setUnit(next);
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

            {isOfficer && (
              <div className="inline-flex w-full gap-1 rounded-[var(--radius-sm)] border border-grey-200 bg-grey-25 p-1 desktop:w-auto">
                <button
                  type="button"
                  disabled={isUnscoped}
                  onClick={() => !isUnscoped && setProcessView("my-unit")}
                  className={cn(
                    "flex-1 rounded-[var(--radius-sm)] px-3 py-2 text-xs font-bold desktop:flex-none",
                    processView === "my-unit"
                      ? "border border-purple-600 bg-purple-100 text-purple-600"
                      : "border border-transparent text-grey-500 hover:text-purple-600",
                    isUnscoped && "cursor-not-allowed opacity-50",
                  )}
                >
                  This unit
                </button>
                <button
                  type="button"
                  onClick={() => setProcessView("full")}
                  className={cn(
                    "flex-1 rounded-[var(--radius-sm)] px-3 py-2 text-xs font-bold desktop:flex-none",
                    processView === "full"
                      ? "border border-purple-600 bg-purple-100 text-purple-600"
                      : "border border-transparent text-grey-500 hover:text-purple-600",
                  )}
                >
                  Every step
                </button>
              </div>
            )}
          </div>
        </div>

        {isOfficer && isUnscoped && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-grey-75 pt-4">
            <span className="self-center text-[11px] text-grey-500">
              Or pick a unit:
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

        <p className="dls-body mt-4 text-grey-600">
          {condensedMode && condensedFocus
            ? `You're on step ${condensedPhaseIndex} of ${yourCount} in ${phaseFaceName} — ${condensedTotal} steps in the whole path.`
            : condensedMode
              ? `You're on ${phaseFaceName} — ${yourCount} of your ${yourCount === 1 ? "step" : "steps"} here, ${condensedTotal} in the whole path.`
              : seesEveryone
                ? `You'll own ${yourCount} ${who} ${yourCount === 1 ? "step" : "steps"} here, and you can guide ${contextCount} more`
                : `You've got ${yourCount} ${yourCount === 1 ? "step" : "steps"} here`}
          {!condensedMode && showFull ? ". This is every listed step" : ""}
          {!condensedMode ? "." : ""}
        </p>
      </section>

      <div className="mb-6 tablet:hidden">
        <p className="dls-caption">Your steps</p>
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {PHASES.map((p) => {
            const isActive = p.id === activeId;
            const count = condensedMode
              ? tenantMode
                ? tenantStepsInPhase(p.id).length
                : contractorStepsInPhase(p.id).length
              : JOURNEY_CARDS.filter(
                  (c) => c.phase === p.id && cardVisible(c, ctx),
                ).length;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => selectPhase(p.id)}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "shrink-0 rounded-[var(--radius-md)] border px-3 py-2 text-left",
                  isActive
                    ? "border-purple-600 bg-purple-100 text-purple-600"
                    : "border-grey-200 bg-white text-grey-600",
                )}
              >
                <span className="block text-sm font-bold leading-[18px]">
                  {PHASE_FACE[p.id]?.name ?? p.name}
                </span>
                <span className="block text-xs font-semibold text-grey-500">
                  {count} step{count === 1 ? "" : "s"}
                </span>
              </button>
            );
          })}
        </div>
        {condensedMode && condensedPhaseSteps.length > 0 && (
          <label className="mt-4 flex flex-col gap-2">
            <span className="dls-caption">
              Steps in {PHASE_FACE[activeId]?.name ?? activeId}
            </span>
            <select
              value={focusedN ?? condensedPhaseSteps[0]?.id}
              onChange={(e) => focusCard(Number(e.target.value))}
              className="w-full rounded-[var(--radius-md)] border border-grey-200 bg-white px-3 py-2 text-sm font-bold text-grey-800"
            >
              {condensedPhaseSteps.map((s) => {
                const phaseStep =
                  condensedPhaseSteps.findIndex((x) => x.id === s.id) + 1;
                return (
                  <option key={s.id} value={s.id}>
                    {phaseStep}. {s.title}
                  </option>
                );
              })}
            </select>
          </label>
        )}
        {!condensedMode && journeyItems.length > 0 && (
          <label className="mt-4 flex flex-col gap-2">
            <span className="dls-caption">
              Steps in {PHASE_FACE[activeId]?.name ?? activeId}
            </span>
            <select
              value={focusedN ?? journeyItems[0]?.card.n}
              onChange={(e) => focusCard(Number(e.target.value))}
              className="w-full rounded-[var(--radius-md)] border border-grey-200 bg-white px-3 py-2 text-sm font-bold text-grey-800"
            >
              {journeyItems.map((item) => (
                <option key={item.card.n} value={item.card.n}>
                  {item.card.n}. {faceTitle(item.card.title)}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="flex flex-col gap-6 tablet:grid tablet:grid-cols-12 tablet:items-start tablet:gap-6 desktop:gap-8">
        <aside className="hidden tablet:sticky tablet:top-6 tablet:col-span-4 tablet:block desktop:col-span-3">
          <div className="overflow-hidden rounded-[var(--radius-md)] border border-grey-100 bg-white shadow-[var(--shadow-light-bg)]">
            <div className="border-b border-grey-100 px-3 py-3 tablet:px-4">
              <p className="dls-caption">Your steps</p>
            </div>
            <nav aria-label="Your steps">
              <ol>
                {PHASES.map((p, i) => {
                  const isActive = p.id === activeId;
                  const count = condensedMode
                    ? tenantMode
                      ? tenantStepsInPhase(p.id).length
                      : contractorStepsInPhase(p.id).length
                    : JOURNEY_CARDS.filter(
                        (c) => c.phase === p.id && cardVisible(c, ctx),
                      ).length;
                  return (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => selectPhase(p.id)}
                        aria-current={isActive ? "true" : undefined}
                        className={cn(
                          "group flex w-full items-center gap-3 border-l-2 px-4 py-3 text-left transition",
                          isActive
                            ? "border-l-purple-600 bg-purple-100 text-purple-800"
                            : "border-l-transparent text-grey-400 hover:border-l-purple-300 hover:bg-purple-100 hover:text-purple-800",
                        )}
                      >
                        <span
                          className={cn(
                            "grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-black",
                            isActive
                              ? "bg-purple-600 text-white"
                              : "border border-grey-200 bg-white text-grey-400",
                          )}
                        >
                          {i + 1}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-bold leading-[18px]">
                            {PHASE_FACE[p.id]?.name ?? p.name}
                          </span>
                          <span className="block text-xs font-semibold text-purple-600">
                            {count} step{count === 1 ? "" : "s"}
                          </span>
                        </span>
                      </button>
                      {isActive && (
                        <div className="max-h-[55vh] overflow-y-auto border-l-2 border-l-purple-600 bg-purple-100/40 px-3 py-3 pl-4">
                          <p className="text-sm leading-[18px] text-grey-600">
                            {PHASE_FACE[p.id]?.description ?? p.description}
                          </p>
                          <p className="dls-caption mt-3">
                            Steps in {PHASE_FACE[p.id]?.name ?? p.name}
                          </p>
                          {visibleStages.map((stage) => (
                            <div key={stage} className="mt-3">
                              <p className="dls-caption mb-1 text-purple-700">
                                {condensedMode ? stage : faceStage(stage)}
                              </p>
                              <ol className="space-y-0.5">
                                {condensedMode
                                  ? condensedPhaseSteps
                                      .filter((s) => s.stage === stage)
                                      .map((s) => {
                                        const isFocused = s.id === focusedN;
                                        const phaseStep =
                                          condensedPhaseSteps.findIndex(
                                            (x) => x.id === s.id,
                                          ) + 1;
                                        return (
                                          <li key={s.id}>
                                            <button
                                              type="button"
                                              onClick={() => focusCard(s.id)}
                                              className={cn(
                                                "flex w-full items-start gap-2 rounded-[var(--radius-sm)] border-l-2 px-2.5 py-2 text-left",
                                                isFocused
                                                  ? "border-l-purple-600 bg-white/90 shadow-[var(--shadow-light-bg)]"
                                                  : "border-l-transparent hover:bg-white/60",
                                              )}
                                            >
                                              <span
                                                className={cn(
                                                  "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-black",
                                                  isFocused
                                                    ? "bg-purple-600 text-white"
                                                    : "border border-grey-200 bg-white text-grey-500",
                                                )}
                                              >
                                                {phaseStep}
                                              </span>
                                              <span className="min-w-0 flex-1">
                                                <span
                                                  className={cn(
                                                    "block text-sm leading-[18px]",
                                                    isFocused
                                                      ? "font-bold"
                                                      : "font-semibold",
                                                  )}
                                                >
                                                  {s.title}
                                                </span>
                                                <span className="mt-0.5 block text-[11px] font-semibold text-grey-500">
                                                  {s.wait
                                                    ? "You wait here"
                                                    : "This is yours"}
                                                </span>
                                              </span>
                                            </button>
                                          </li>
                                        );
                                      })
                                  : journeyItems
                                      .filter((item) => item.card.stage === stage)
                                      .map((item) => {
                                        const isFocused = item.card.n === focusedN;
                                        const isNote = item.kind === "context";
                                        return (
                                          <li key={item.card.n}>
                                            <button
                                              type="button"
                                              onClick={() => focusCard(item.card.n)}
                                              className={cn(
                                                "flex w-full items-start gap-2 rounded-[var(--radius-sm)] border-l-2 px-2.5 py-2 text-left",
                                                isFocused
                                                  ? isNote
                                                    ? "border-l-grey-400 bg-white/90"
                                                    : "border-l-purple-600 bg-white/90 shadow-[var(--shadow-light-bg)]"
                                                  : "border-l-transparent hover:bg-white/60",
                                              )}
                                            >
                                              <span
                                                className={cn(
                                                  "mt-0.5 grid h-5 w-5 shrink-0 place-items-center text-[10px] font-black",
                                                  isNote
                                                    ? "rounded-[var(--radius-sm)]"
                                                    : "rounded-full",
                                                  isFocused && !isNote
                                                    ? "bg-purple-600 text-white"
                                                    : "border border-grey-200 bg-white text-grey-500",
                                                )}
                                              >
                                                {item.card.n}
                                              </span>
                                              <span className="min-w-0 flex-1">
                                                <span
                                                  className={cn(
                                                    "block text-sm leading-[18px]",
                                                    isFocused
                                                      ? "font-bold"
                                                      : "font-semibold",
                                                  )}
                                                >
                                                  {faceTitle(item.card.title)}
                                                </span>
                                                <span className="mt-0.5 block text-[11px] font-semibold text-grey-500">
                                                  {isNote
                                                    ? `This is for the ${item.card.who}`
                                                    : "This is yours"}
                                                </span>
                                              </span>
                                            </button>
                                          </li>
                                        );
                                      })}
                              </ol>
                            </div>
                          ))}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            </nav>
          </div>
        </aside>

        <div className="min-w-0 tablet:col-span-8 desktop:col-span-9">
          {condensedMode && !condensedFocus && (
            <div className="rounded-[var(--radius-md)] border border-grey-100 bg-white px-4 py-8 text-center text-sm text-grey-500">
              There are no steps for you in{" "}
              {PHASE_FACE[activeId]?.name ?? activeId} on this unit.
            </div>
          )}

          {tenantMode && condensedFocus && (
            <TenantStepCard
              step={condensedFocus}
              showDetails={showDetails}
              onToggleDetails={() => setShowDetails((v) => !v)}
              phaseStep={condensedPhaseIndex}
              phaseTotal={yourCount}
              onPrev={
                condensedPrev
                  ? () => {
                      if (condensedPrev.phase !== activeId) {
                        selectPhase(condensedPrev.phase);
                      }
                      focusCard(condensedPrev.id);
                    }
                  : undefined
              }
              onNext={
                condensedNextAcross
                  ? () => {
                      if (condensedNextAcross.phase !== activeId) {
                        selectPhase(condensedNextAcross.phase);
                      }
                      focusCard(condensedNextAcross.id);
                    }
                  : undefined
              }
              nextTitle={
                condensedNextAcross
                  ? condensedNextAcross.title
                  : "You've reached the last step in this guide."
              }
            />
          )}

          {contractorMode && condensedFocus && (
            <ContractorStepCard
              step={condensedFocus}
              showDetails={showDetails}
              onToggleDetails={() => setShowDetails((v) => !v)}
              phaseStep={condensedPhaseIndex}
              phaseTotal={yourCount}
              onPrev={
                condensedPrev
                  ? () => {
                      if (condensedPrev.phase !== activeId) {
                        selectPhase(condensedPrev.phase);
                      }
                      focusCard(condensedPrev.id);
                    }
                  : undefined
              }
              onNext={
                condensedNextAcross
                  ? () => {
                      if (condensedNextAcross.phase !== activeId) {
                        selectPhase(condensedNextAcross.phase);
                      }
                      focusCard(condensedNextAcross.id);
                    }
                  : undefined
              }
              nextTitle={
                condensedNextAcross
                  ? condensedNextAcross.title
                  : "You've reached the last step in this guide."
              }
            />
          )}

          {!condensedMode && !focused && (
            <div className="rounded-[var(--radius-md)] border border-grey-100 bg-white px-4 py-8 text-center text-sm text-grey-500">
              There are no steps for you in{" "}
              {PHASE_FACE[activeId]?.name ?? activeId} on this unit.
            </div>
          )}

          {!condensedMode && focused && (
            <StepCard
              item={focused}
              showDetails={showDetails}
              onToggleDetails={() => setShowDetails((v) => !v)}
              onPrev={prevItem ? () => focusCard(prevItem.card.n) : undefined}
              onNext={nextItem ? () => focusCard(nextItem.card.n) : undefined}
              prevTitle={
                prevItem ? faceTitle(prevItem.card.title) : undefined
              }
              nextTitle={
                nextItem
                  ? faceTitle(nextItem.card.title)
                  : focusIndex === journeyItems.length - 1 &&
                      activeId === "Exit"
                    ? "You've reached the last step in this guide"
                    : undefined
              }
              who={who}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function StepCard({
  item,
  showDetails,
  onToggleDetails,
  onPrev,
  onNext,
  prevTitle: _prevTitle,
  nextTitle,
  who,
}: {
  item: JourneyItem;
  showDetails: boolean;
  onToggleDetails: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  prevTitle?: string;
  nextTitle?: string;
  who: Stakeholder;
}) {
  const card = item.card;
  const mine = item.kind === "you";
  const needs = splitListed(card.input);
  const eligibility = eligibilityLines(card);
  const shownRules = card.rules.filter((r) =>
    showDetails ? true : r.rank !== "only-if" || card.rules.length <= 3,
  );
  const hiddenOnlyIf =
    !showDetails && card.rules.length > 3
      ? card.rules.filter((r) => r.rank === "only-if")
      : [];

  return (
    <article
      id={`card-${card.n}`}
      className={cn(
        "scroll-mt-20 rounded-[var(--radius-md)] border bg-white p-4 tablet:p-6 desktop:scroll-mt-8 desktop:p-8",
        mine
          ? "border-purple-300 border-l-4 border-l-purple-600 bg-purple-100/40 shadow-[var(--shadow-light-bg)]"
          : "border-grey-100 shadow-[var(--shadow-light-bg)]",
      )}
    >
      <header className="border-b border-grey-75 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-[var(--radius-sm)] bg-purple-600 px-2 py-0.5 text-[11px] font-bold text-white">
            Step {card.n}
          </span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-grey-500">
            {PHASE_FACE[card.phase]?.name ?? card.phase}
          </span>
          <span className="rounded-[var(--radius-sm)] bg-grey-75 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-grey-700">
            {faceStage(card.stage)}
          </span>
          {!mine && (
            <span className="rounded-[var(--radius-sm)] bg-grey-75 px-2 py-0.5 text-[11px] font-bold text-grey-600">
              This is for the {card.who}
            </span>
          )}
        </div>
        <h3 className="mt-2 text-base font-bold text-black desktop:text-lg desktop:leading-6">
          {faceTitle(card.title)}
        </h3>
        <p className="mt-1 text-xs font-semibold text-grey-500">
          {faceStep(card.step)}
        </p>
      </header>

      <section className="space-y-3 border-b border-grey-75 py-4">
        <p className="text-sm leading-relaxed text-black">
          {faceAction(card, mine)}
        </p>
        {eligibility.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-grey-500">
              Only available if
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-black">
              {eligibility.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="space-y-3 border-b border-grey-75 py-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-grey-500">
          What you&apos;ll need
        </p>
        {needs.length === 0 ? (
          <p className="text-sm text-grey-600">
            Nothing is listed for this step.
          </p>
        ) : (
          <>
            <p className="text-sm text-black">
              To complete this step, you&apos;ll need:
            </p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-black">
              {needs.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section className="py-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-grey-500">
          For this step
        </p>
        {card.rules.length === 0 ? (
          <p className="mt-3 text-sm text-grey-600">
            The attached guidelines don&apos;t add a rule for this step.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {shownRules.map((rule) => (
              <RuleBlock key={`${rule.rank}-${rule.source}`} rule={rule} open={showDetails} />
            ))}
          </ul>
        )}
        {hiddenOnlyIf.length > 0 && (
          <p className="mt-3 text-xs font-semibold text-grey-500">
            {hiddenOnlyIf.length} Only if{" "}
            {hiddenOnlyIf.length === 1 ? "condition" : "conditions"} sit under
            More about this step
          </p>
        )}
      </section>

      <button
        type="button"
        onClick={onToggleDetails}
        className="inline-flex items-center gap-1 text-sm font-bold text-purple-700 hover:text-purple-800"
      >
        <ChevronDown className={cn("h-4 w-4", showDetails && "rotate-180")} />
        {showDetails ? "Hide extra detail" : "More about this step"}
      </button>

      {showDetails && (
        <dl className="mt-4 space-y-2 rounded-[var(--radius-sm)] bg-white p-4 text-sm">
          <DetailRow label="Task group" value={card.taskGroup} />
          <DetailRow label="Action on the sheet" value={card.verb} />
          <DetailRow label="When this happens" value={card.dependency} />
          <DetailRow label="Type of what you'll need" value={card.inputType} />
          <DetailRow label="Type of what you'll get" value={card.outputType} />
          <DetailRow label="Unit type" value={card.unitType} />
          <DetailRow label="Area or location" value={card.area} />
          <DetailRow label="Work scope" value={card.workScope} />
          <DetailRow label="Unit features" value={card.unitFeatures} />
          <DetailRow label="Tenant type" value={card.tenantType} />
          <DetailRow label="Project officer type" value={card.poType} />
          <DetailRow
            label="You're viewing as"
            value={
              mine
                ? `${who} — this step is yours`
                : `${who} — this step is for the ${card.who}`
            }
          />
        </dl>
      )}

      <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-grey-75 pt-4">
        <button
          type="button"
          disabled={!onPrev}
          onClick={onPrev}
          className="inline-flex items-center gap-1 text-sm font-bold text-purple-700 disabled:text-grey-300"
        >
          <ChevronLeft className="h-4 w-4" />
          Go back
        </button>
        <button
          type="button"
          disabled={!onNext && !nextTitle}
          onClick={onNext}
          className="inline-flex max-w-[60%] items-center gap-1 text-right text-sm font-bold text-purple-700 disabled:text-grey-300"
        >
          <span className="truncate">
            {onNext ? "Continue" : (nextTitle ?? "Continue")}
          </span>
          <ChevronRight className="h-4 w-4 shrink-0" />
        </button>
      </footer>
    </article>
  );
}

function RuleBlock({ rule, open }: { rule: JourneyRule; open: boolean }) {
  const tone =
    rule.rank === "must-do"
      ? "bg-success-100 text-success-600"
      : rule.rank === "must-not"
        ? "bg-error-100 text-error-600"
        : "bg-warning-100 text-warning-600";
  const label = ruleBadge(rule.rank);
  return (
    <li className="rounded-[var(--radius-sm)] border border-grey-100 bg-white p-3">
      <span
        className={cn(
          "inline-flex rounded-[var(--radius-sm)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
          tone,
        )}
      >
        {label}
      </span>
      <p className="mt-2 text-sm leading-relaxed text-black">
        {faceRule(rule.line)}
      </p>
      {open && (
        <p className="mt-2 text-xs leading-relaxed text-grey-500">
          {rule.source} — “{rule.quote}”
        </p>
      )}
    </li>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="grid grid-cols-[140px_minmax(0,1fr)] gap-3">
      <dt className="text-xs font-bold text-grey-500">{label}</dt>
      <dd className="text-xs text-grey-700">
        {isListed(value) ? value : "Nothing is listed"}
      </dd>
    </div>
  );
}

