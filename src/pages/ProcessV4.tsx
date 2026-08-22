import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronDown, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { useApp, type Role } from "@/lib/app-state";
import { UNITS, type Unit } from "@/lib/tenancy-data";
import {
  JOURNEY_CARDS,
  PHASES,
  STAKEHOLDERS,
  cardApplies,
  cardsInPhase,
  displayValue,
  isListed,
  isMyCard,
  stagesInPhase,
  type JourneyCard,
  type JourneyRule,
  type PhaseId,
  type Stakeholder,
} from "@/lib/journey-cards";
import { cn } from "@/lib/utils";

const LS_PHASE = "tempo:v4:phase";
const LS_WHO = "tempo:v4:who";

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

function previewLines(value: string | null, count = 2) {
  if (!isListed(value)) return { shown: [] as string[], more: 0 };
  const parts = value!
    .split(/\n|,(?=\s)/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length <= 1) {
    const lines = value!.split("\n").map((l) => l.trim()).filter(Boolean);
    return { shown: lines.slice(0, count), more: Math.max(0, lines.length - count) };
  }
  return { shown: parts.slice(0, count), more: Math.max(0, parts.length - count) };
}

const PRIMARY_ROLES: { who: Stakeholder; role: Role; hint: string }[] = [
  { who: "Tenant", role: "tenant", hint: "Your outlet cards" },
  { who: "Contractor", role: "contractor", hint: "Works and permits" },
  { who: "Project Officer", role: "officer", hint: "Advise and approve" },
];

export function ProcessV4Page() {
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

  const [params] = useSearchParams();
  const [who, setWho] = useState<Stakeholder>(roleFromApp(role));
  const [activeId, setActiveId] = useState<PhaseId>("Setup");
  const [focusedN, setFocusedN] = useState<number | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    setWho(roleFromApp(role));
  }, [role]);

  useEffect(() => {
    const raw = (params.get("phase") ?? "").toLowerCase();
    const fromUrl = PHASES.find((p) => p.id.toLowerCase() === raw);
    if (fromUrl) {
      setActiveId(fromUrl.id);
      return;
    }
    const saved = window.localStorage.getItem(LS_PHASE) as PhaseId | null;
    if (saved && PHASES.some((p) => p.id === saved)) setActiveId(saved);
  }, [params]);

  useEffect(() => {
    const next = !isOfficer ? "my-unit" : isUnscoped ? "full" : "my-unit";
    if (processView !== next) setProcessView(next);
  }, [isUnscoped, isOfficer, processView, setProcessView]);

  const ctxUnit: Unit = effectiveUnit ?? unit;
  const showFull = isOfficer && (processView === "full" || isUnscoped);

  const ctx = {
    tenancyType: ctxUnit.tenancyType,
    terminal: ctxUnit.terminal,
    showFull,
  };

  const phaseCards = useMemo(() => {
    return cardsInPhase(activeId).filter((c) =>
      cardApplies(c, {
        tenancyType: ctxUnit.tenancyType,
        terminal: ctxUnit.terminal,
        showFull,
      }),
    );
  }, [activeId, ctxUnit.tenancyType, ctxUnit.terminal, showFull]);

  const journeyItems = useMemo<JourneyItem[]>(() => {
    return phaseCards.map((card) => ({
      kind: isMyCard(card, who) ? "you" : "context",
      card,
    }));
  }, [phaseCards, who]);

  const yourItems = journeyItems.filter((i) => i.kind === "you");
  const startHere = yourItems[0] ?? journeyItems[0] ?? null;

  const journeyKey = journeyItems.map((i) => i.card.n).join(",");
  const startN = startHere?.card.n ?? null;
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

  const selectPhase = (id: PhaseId) => {
    setActiveId(id);
    window.localStorage.setItem(LS_PHASE, id);
  };

  const pickWho = (next: Stakeholder) => {
    setWho(next);
    window.localStorage.setItem(LS_WHO, next);
    const mapped = PRIMARY_ROLES.find((r) => r.who === next);
    if (mapped && mapped.role !== role) setRole(mapped.role);
  };

  const focusCard = (n: number) => {
    setFocusedN(n);
    setShowDetails(false);
    document.getElementById(`card-${n}`)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const visibleStages = stagesInPhase(activeId).filter((stage) =>
    journeyItems.some((i) => i.card.stage === stage),
  );

  const yourCount = yourItems.length;
  const contextCount = journeyItems.length - yourCount;

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
            One Excel task is one card. Rules on a card come only from the
            renovation guidelines when they belong to that task.
          </p>
        </div>
        <Link
          to="/process-v3"
          className="shrink-0 text-xs font-bold text-grey-500 hover:text-purple-700"
        >
          Open previous guide
        </Link>
      </header>

      <section className="mb-10 rounded-[var(--radius-md)] border border-grey-100 bg-white p-4 shadow-[var(--shadow-light-bg)] tablet:p-6 desktop:p-8">
        <div className="dls-grid-12 items-start">
          <div className="min-w-0 desktop:col-span-7">
            <div className="text-[10px] font-bold uppercase tracking-wider text-grey-500">
              Active unit
            </div>
            {isOfficer && isUnscoped && processView !== "full" ? (
              <p className="mt-2 text-sm text-grey-600">
                Choose a unit so this guide can hide tasks that do not apply.
              </p>
            ) : (
              <>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0 text-purple-600" />
                  <span className="text-base font-bold text-black">
                    {ctxUnit.unitNo}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Chip>{ctxUnit.terminal}</Chip>
                  <Chip>{ctxUnit.tenancyType}</Chip>
                  <Chip>{ctxUnit.zone}</Chip>
                  <Chip>{ctxUnit.company}</Chip>
                </div>
              </>
            )}
          </div>

          <div className="flex w-full flex-col gap-3 desktop:col-span-5 desktop:items-end">
            <div className="w-full desktop:max-w-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-grey-500">
                Interact as
              </span>
              <div className="mt-1 grid grid-cols-3 gap-1 rounded-[var(--radius-sm)] border border-grey-200 bg-grey-25 p-1">
                {PRIMARY_ROLES.map((r) => (
                  <button
                    key={r.who}
                    type="button"
                    onClick={() => pickWho(r.who)}
                    className={cn(
                      "rounded-[var(--radius-sm)] px-2 py-2 text-[11px] font-bold leading-tight",
                      who === r.who
                        ? "bg-purple-600 text-white"
                        : "text-grey-600 hover:text-black",
                    )}
                    title={r.hint}
                  >
                    {r.who === "Project Officer" ? "Officer" : r.who}
                  </button>
                ))}
              </div>
            </div>
            <label className="flex w-full flex-col gap-1 desktop:max-w-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-grey-500">
                Or another stakeholder
              </span>
              <select
                value={who}
                onChange={(e) => pickWho(e.target.value as Stakeholder)}
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

            {role === "tenant" && (
              <label className="flex w-full flex-col gap-1 desktop:max-w-sm">
                <span className="text-[10px] font-bold uppercase tracking-wider text-grey-500">
                  Switch outlet
                </span>
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
                    "flex-1 rounded-[var(--radius-sm)] px-3 py-2 text-xs font-bold desktop:flex-none",
                    processView === "full"
                      ? "bg-purple-600 text-white"
                      : "text-grey-500 hover:text-black",
                  )}
                >
                  Full process
                </button>
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

        <p className="mt-4 text-sm text-grey-600">
          {yourCount} card{yourCount === 1 ? "" : "s"} for {who}
          {contextCount > 0
            ? ` · ${contextCount} other ${contextCount === 1 ? "task" : "tasks"} in this phase`
            : ""}
          {showFull ? " · full catalogue" : ""}.
        </p>
      </section>

      <div className="flex flex-col gap-6 tablet:grid tablet:grid-cols-[minmax(220px,280px)_minmax(0,1fr)] tablet:items-start tablet:gap-6 desktop:grid-cols-[minmax(240px,300px)_minmax(0,1fr)] desktop:gap-8">
        <aside className="tablet:sticky tablet:top-6">
          <div className="overflow-hidden rounded-[var(--radius-md)] border border-grey-100 bg-white shadow-[var(--shadow-light-bg)]">
            <div className="border-b border-grey-75 px-3 py-3 tablet:px-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-grey-500">
                Lifecycle overview
              </p>
            </div>
            <nav aria-label="Lifecycle phases">
              <ol>
                {PHASES.map((p, i) => {
                  const isActive = p.id === activeId;
                  const count = JOURNEY_CARDS.filter(
                    (c) => c.phase === p.id && cardApplies(c, ctx),
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
                            {p.name}
                          </span>
                          <span className="block text-xs font-semibold text-purple-600">
                            {count} task{count === 1 ? "" : "s"}
                          </span>
                        </span>
                      </button>
                      {isActive && (
                        <div className="max-h-[55vh] overflow-y-auto border-l-2 border-l-purple-600 bg-purple-100/40 px-3 py-3 pl-4">
                          <p className="text-sm leading-[18px] text-grey-600">
                            {p.description}
                          </p>
                          <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-grey-500">
                            Cards in {p.name}
                          </p>
                          {visibleStages.map((stage) => (
                            <div key={stage} className="mt-3">
                              <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-purple-700">
                                {stage}
                              </p>
                              <ol className="space-y-0.5">
                                {journeyItems
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
                                              {item.card.title}
                                            </span>
                                            <span className="mt-0.5 block text-[11px] font-semibold text-grey-500">
                                              {item.card.who}
                                              {isNote ? " · others" : ""}
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

        <div className="min-w-0">
          {!focused && (
            <div className="rounded-[var(--radius-md)] border border-grey-100 bg-white px-4 py-8 text-center text-sm text-grey-500">
              Nothing in {activeId} for {who} on this unit.
            </div>
          )}

          {focused && (
            <StepCard
              item={focused}
              showDetails={showDetails}
              onToggleDetails={() => setShowDetails((v) => !v)}
              onPrev={prevItem ? () => focusCard(prevItem.card.n) : undefined}
              onNext={nextItem ? () => focusCard(nextItem.card.n) : undefined}
              prevTitle={prevItem?.card.title}
              nextTitle={
                nextItem?.card.title ??
                (focusIndex === journeyItems.length - 1 &&
                activeId === "Exit"
                  ? "End of journey (no next task in the sheet)"
                  : undefined)
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
  prevTitle,
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
  const inputPrev = previewLines(card.input);
  const outputPrev = previewLines(card.output);
  const channelPrev = previewLines(card.channel);
  const systemPrev = previewLines(card.system);
  const faceRules = card.rules.filter((r) =>
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
            {card.phase}
          </span>
          <span className="rounded-[var(--radius-sm)] bg-grey-75 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-grey-700">
            {card.stage}
          </span>
          {!mine && (
            <span className="rounded-[var(--radius-sm)] bg-grey-75 px-2 py-0.5 text-[11px] font-bold text-grey-600">
              Others · {card.who}
            </span>
          )}
        </div>
        <h3 className="mt-2 text-base font-bold text-black desktop:text-lg desktop:leading-6">
          {card.title}
        </h3>
        <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-grey-500">
          {card.step}
        </p>
      </header>

      <section className="space-y-4 border-b border-grey-75 py-4">
        <Field label="Who">{displayValue(card.who, "Not listed on this task")}</Field>
        <Field label="Do this">{displayValue(card.task, "Not listed on this task")}</Field>
        <Field label="Channel">
          <MultiFace value={card.channel} preview={channelPrev} empty="Not listed on this task" open={showDetails} />
        </Field>
      </section>

      <section className="space-y-4 border-b border-grey-75 py-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-grey-500">
          What you need
        </p>
        <Field label="You need">
          <MultiFace value={card.input} preview={inputPrev} empty="None listed on this task" open={showDetails} />
        </Field>
        <Field label="You produce">
          <MultiFace value={card.output} preview={outputPrev} empty="None listed on this task" open={showDetails} />
        </Field>
        <Field label="Use this system">
          <MultiFace value={card.system} preview={systemPrev} empty="None listed on this task" open={showDetails} />
        </Field>
      </section>

      <section className="py-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-grey-500">
          Rules for this step
        </p>
        {card.rules.length === 0 ? (
          <p className="mt-3 text-sm text-grey-600">
            None in the attached guidelines
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {faceRules.map((rule) => (
              <RuleBlock key={`${rule.rank}-${rule.source}`} rule={rule} open={showDetails} />
            ))}
          </ul>
        )}
        {hiddenOnlyIf.length > 0 && (
          <p className="mt-3 text-xs font-semibold text-grey-500">
            {hiddenOnlyIf.length} Only-if rule
            {hiddenOnlyIf.length === 1 ? "" : "s"} behind Show details
          </p>
        )}
      </section>

      <button
        type="button"
        onClick={onToggleDetails}
        className="inline-flex items-center gap-1 text-sm font-bold text-purple-700 hover:text-purple-800"
      >
        <ChevronDown className={cn("h-4 w-4", showDetails && "rotate-180")} />
        {showDetails ? "Hide details" : "Show details"}
      </button>

      {showDetails && (
        <dl className="mt-4 space-y-2 rounded-[var(--radius-sm)] bg-white p-4 text-sm">
          <DetailRow label="Task Group" value={card.taskGroup} />
          <DetailRow label="Sheet action verb" value={card.verb} />
          <DetailRow label="Dependency" value={card.dependency} />
          <DetailRow label="Input artefact type" value={card.inputType} />
          <DetailRow label="Output artefact type" value={card.outputType} />
          <DetailRow label="Unit Type" value={card.unitType} />
          <DetailRow label="Area / Location" value={card.area} />
          <DetailRow label="Work Scope" value={card.workScope} />
          <DetailRow label="Unit Features" value={card.unitFeatures} />
          <DetailRow label="Tenant Type" value={card.tenantType} />
          <DetailRow
            label="Project Officer Type"
            value={card.poType}
          />
          <DetailRow
            label="Viewing as"
            value={`${who}${mine ? " · this card is yours" : ` · this card belongs to ${card.who}`}`}
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
          {prevTitle ? `Previous · ${prevTitle}` : "Previous"}
        </button>
        <button
          type="button"
          disabled={!onNext && !nextTitle}
          onClick={onNext}
          className="inline-flex max-w-[60%] items-center gap-1 text-right text-sm font-bold text-purple-700 disabled:text-grey-300"
        >
          <span className="truncate">
            {nextTitle ? `Next · ${nextTitle}` : "Next"}
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
  const label =
    rule.rank === "must-do"
      ? "Must do"
      : rule.rank === "must-not"
        ? "Must not"
        : "Only if";
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
      <p className="mt-2 text-sm leading-relaxed text-black">{rule.line}</p>
      {open && (
        <p className="mt-2 text-xs leading-relaxed text-grey-500">
          {rule.source} — “{rule.quote}”
        </p>
      )}
    </li>
  );
}

function MultiFace({
  value,
  preview,
  empty,
  open,
}: {
  value: string | null;
  preview: { shown: string[]; more: number };
  empty: string;
  open: boolean;
}) {
  if (!isListed(value)) return <span>{empty}</span>;
  if (open) {
    return (
      <span className="whitespace-pre-wrap">{value}</span>
    );
  }
  if (preview.shown.length <= 1 && preview.more === 0) {
    return <span>{value}</span>;
  }
  return (
    <span>
      {preview.shown.join("; ")}
      {preview.more > 0 ? ` +${preview.more} more` : ""}
    </span>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-grey-500">
        {label}
      </div>
      <div className="mt-1 text-sm leading-relaxed text-black">{children}</div>
    </div>
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
        {isListed(value) ? value : "(blank in the sheet)"}
      </dd>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-[var(--radius-sm)] border border-grey-100 bg-white px-2 py-1 text-[11px] font-bold text-grey-700">
      {children}
    </span>
  );
}
