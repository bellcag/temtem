import { useEffect, useId, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useSearchParams } from "react-router-dom";
import { useApp, type Role } from "@/lib/app-state";
import { UNITS, type Unit } from "@/lib/tenancy-data";
import {
  CONTRACTOR_JOBS,
  LS_JOB,
  LS_OUTLET,
} from "@/lib/process-job-context";
import { UnitSelection } from "@/components/dls/UnitSelection";
import {
  filterV26Chapters,
  filterV26ChaptersByWho,
  v26FilterAcrossPhases,
  v26GuideFilter,
  v26PhaseById,
  v26VisibleCardCount,
  v26WhoChipNames,
  v26WhoParamFor,
  v26WhoSelected,
  V26_GUIDE_FILTERS,
  V26_PHASES,
} from "@/lib/process-v26-guide";
import { FilterChip } from "@/components/dls/Chip";
import filterOff from "@/assets/figma/filter-off.svg";
import closeIcon from "@/assets/figma/close.svg";
import { markV28Preview, processV28Href, worksV28Href } from "@/lib/process-v28-preview";
import {
  V28_CHAPTER_LEAD,
  V28_PHASE_LEAD,
  V28_PHASE_NAME,
  v28IfTheyAsk,
  v28PhaseIntro,
  v28SharedFact,
  v28WorksDoorHint,
} from "@/lib/process-v28-voice";
import { v28LinkedFact, v28SystemsNotInFact } from "@/lib/process-v28-systems";
import {
  readV26OutletStory,
  v26TenantShowsOutletPicker,
  v26UnitsForStory,
  V26_OUTLET_CHANGED,
} from "@/lib/process-v26-outlets";
import { seedV26Works } from "@/lib/process-v26-works";
import { readV28WorksStory } from "@/lib/process-v28-seed";
import { V26GuideCard, whoTag } from "@/pages/v26-guide-card";
import { cn } from "@/lib/utils";

function useV26Unit() {
  const {
    role,
    unit,
    setUnit,
    units,
    effectiveUnit,
    isUnscoped,
    setOfficerSelection,
  } = useApp();
  const [jobId, setJobId] = useState(CONTRACTOR_JOBS[0].id);
  const [outletStory, setOutletStory] = useState(readV26OutletStory);
  const tenantUnits = useMemo(
    () => v26UnitsForStory(outletStory),
    [outletStory],
  );

  useEffect(() => {
    if (role !== "contractor") return;
    const saved = window.localStorage.getItem(LS_JOB);
    if (saved && CONTRACTOR_JOBS.some((job) => job.id === saved)) {
      setJobId(saved);
    }
  }, [role]);

  useEffect(() => {
    const refresh = () => setOutletStory(readV26OutletStory());
    refresh();
    window.addEventListener(V26_OUTLET_CHANGED, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(V26_OUTLET_CHANGED, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  useEffect(() => {
    if (role !== "tenant") return;
    if (tenantUnits.some((row) => row.id === unit.id)) return;
    const next = tenantUnits[0];
    if (!next) return;
    setUnit(next);
    window.localStorage.setItem(LS_OUTLET, next.id);
  }, [role, unit.id, tenantUnits, setUnit]);

  const ctxUnit: Unit = useMemo(() => {
    if (role === "contractor") {
      return (
        CONTRACTOR_JOBS.find((job) => job.id === jobId)?.unit ??
        CONTRACTOR_JOBS[0].unit
      );
    }
    if (role === "officer") return effectiveUnit ?? unit;
    return unit;
  }, [role, jobId, effectiveUnit, unit]);

  return {
    role,
    ctxUnit,
    units: role === "tenant" ? tenantUnits : units,
    showOutletPicker:
      role !== "tenant" || v26TenantShowsOutletPicker(outletStory),
    jobId,
    isUnscoped: role === "officer" && isUnscoped,
    pickJob: (id: string) => {
      setJobId(id);
      window.localStorage.setItem(LS_JOB, id);
    },
    pickOutlet: (next: Unit) => {
      setUnit(next);
      window.localStorage.setItem(LS_OUTLET, next.id);
    },
    pickOfficer: (next: Unit) => {
      setOfficerSelection({
        terminal: next.terminal as "T1" | "T2" | "T3" | "T4",
        tenancyType: next.tenancyType as "Retail" | "F&B",
        zone: "Airside",
      });
    },
  };
}

function UnitPicker({
  role,
  jobId,
  unit,
  units,
  needsContext,
  showSelect,
  onPickJob,
  onPickOutlet,
  onPickOfficer,
}: {
  role: Role;
  jobId: string;
  unit: Unit;
  units: Unit[];
  needsContext: boolean;
  showSelect: boolean;
  onPickJob: (id: string) => void;
  onPickOutlet: (u: Unit) => void;
  onPickOfficer: (u: Unit) => void;
}) {
  const value =
    role === "contractor" ? jobId : role === "tenant" ? unit.id : unit.unitNo;
  const options =
    role === "contractor"
      ? CONTRACTOR_JOBS.map((job) => ({ value: job.id, label: job.label }))
      : role === "tenant"
        ? units.map((row) => ({ value: row.id, label: row.unitNo }))
        : UNITS.map((row) => ({ value: row.unitNo, label: row.unitNo }));
  const chips = needsContext
    ? ["All Terminals", "All Zones"]
    : [unit.terminal, unit.zone, unit.tenancyType];

  return (
    <UnitSelection
      className="w-full tablet:w-full desktop:w-[259px] desktop:shrink-0"
      chipsClassName="tablet:justify-start desktop:justify-end"
      value={value}
      options={options}
      chips={chips}
      showSelect={showSelect}
      onChange={(next) => {
        if (role === "contractor") {
          onPickJob(next);
          return;
        }
        if (role === "tenant") {
          const hit = units.find((row) => row.id === next);
          if (hit) onPickOutlet(hit);
          return;
        }
        const hit = UNITS.find((row) => row.unitNo === next);
        if (hit) onPickOfficer(hit);
      }}
    />
  );
}

function GuideFilterButton({
  open,
  activeTitle,
  onOpen,
  onClose,
  onPick,
}: {
  open: boolean;
  activeTitle: string | null;
  onOpen: () => void;
  onClose: () => void;
  onPick: (view: string | null) => void;
}) {
  const titleId = useId();
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <>
      <FilterChip
        selected={Boolean(activeTitle)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => (open ? onClose() : onOpen())}
        className="shrink-0 gap-1.5 whitespace-nowrap"
      >
        <img src={filterOff} alt="" width={16} height={16} />
        {activeTitle ?? "Filter"}
      </FilterChip>
      {open
        ? createPortal(
            <div className="fixed inset-0 z-[60] flex items-end justify-center tablet:items-center tablet:p-8">
              <button
                type="button"
                aria-label="Close filter"
                className="absolute inset-0 bg-[rgba(18,18,18,0.4)]"
                onClick={onClose}
              />
              <aside
                id={listId}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className={cn(
                  "relative flex w-full flex-col bg-white shadow-[var(--shadow-light-bg)]",
                  "max-h-[80vh] rounded-t-[var(--radius-2xl)]",
                  "tablet:max-w-md tablet:rounded-[var(--radius-2xl)]",
                )}
              >
                <header className="flex items-center justify-between gap-3 border-b border-grey-75 px-4 py-3">
                  <h2
                    id={titleId}
                    className="text-lg leading-[22px] font-bold text-black"
                  >
                    Filter
                  </h2>
                  <button
                    type="button"
                    aria-label="Close filter"
                    onClick={onClose}
                    className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-md)] text-black hover:bg-grey-50 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
                  >
                    <img src={closeIcon} alt="" width={16} height={16} />
                  </button>
                </header>
                <ul className="min-h-0 flex-1 overflow-y-auto py-2">
                  <li>
                    <button
                      type="button"
                      aria-current={!activeTitle ? "true" : undefined}
                      onClick={() => onPick(null)}
                      className={cn(
                        "flex w-full flex-col items-start gap-0.5 px-4 py-3 text-left",
                        !activeTitle
                          ? "bg-purple-100"
                          : "hover:bg-grey-50",
                      )}
                    >
                      <span
                        className={cn(
                          "text-sm leading-[18px] font-bold",
                          !activeTitle ? "text-purple-700" : "text-black",
                        )}
                      >
                        Show all
                      </span>
                      <span className="text-xs leading-4 text-grey-500">
                        Every step on this unit
                      </span>
                    </button>
                  </li>
                  {V26_GUIDE_FILTERS.map((row) => {
                    const selected = activeTitle === row.title;
                    return (
                      <li key={row.view}>
                        <button
                          type="button"
                          aria-current={selected ? "true" : undefined}
                          onClick={() => onPick(row.view)}
                          className={cn(
                            "flex w-full flex-col items-start gap-0.5 px-4 py-3 text-left",
                            selected ? "bg-purple-100" : "hover:bg-grey-50",
                          )}
                        >
                          <span
                            className={cn(
                              "text-sm leading-[18px] font-bold",
                              selected ? "text-purple-700" : "text-black",
                            )}
                          >
                            {row.title}
                          </span>
                          <span className="text-xs leading-4 text-grey-500">
                            {row.hint}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </aside>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

export function ProcessV28Page() {
  const ctx = useV26Unit();
  const [params, setParams] = useSearchParams();
  const phase = v26PhaseById(params.get("phase"));
  const viewParam = params.get("view");
  const whoParam = params.get("who");
  const guideFilter = v26GuideFilter(viewParam);
  const worksOnly = guideFilter?.view === "works";
  const typeCardId = guideFilter?.cardId ?? null;
  const activeView = guideFilter?.view ?? null;
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    markV28Preview();
    if (!readV28WorksStory()) seedV26Works(ctx.ctxUnit.id);
  }, [ctx.ctxUnit.id]);

  const filterOn = Boolean(activeView);
  const rawSlices = filterOn
    ? v26FilterAcrossPhases(worksOnly, typeCardId)
    : [{ phase, chapters: filterV26Chapters(phase, false) }];
  const whoNames = v26WhoChipNames(
    rawSlices.flatMap((row) => row.chapters),
    ctx.ctxUnit,
    ctx.role,
  );
  const slices = rawSlices
    .map((row) => ({
      ...row,
      chapters: filterV26ChaptersByWho(
        row.chapters,
        ctx.ctxUnit,
        ctx.role,
        whoParam,
      ),
    }))
    .filter((row) => row.chapters.length > 0);

  const setGuideView = (view: string | null) => {
    const next = new URLSearchParams(params);
    if (!view) next.delete("view");
    else next.set("view", view);
    setParams(next, { replace: true });
  };

  const whoStillValid =
    !whoParam ||
    whoNames.some((name) => v26WhoSelected(name, ctx.role, whoParam));

  useEffect(() => {
    if (whoStillValid) return;
    const next = new URLSearchParams(params);
    next.delete("who");
    setParams(next, { replace: true });
  }, [whoStillValid, params, setParams]);

  const pickWho = (value: string) => {
    const next = new URLSearchParams(params);
    if (!value) next.delete("who");
    else next.set("who", value);
    setParams(next, { replace: true });
  };

  return (
    <div className="dls-page flex flex-col gap-6 !pt-5 tablet:!pt-8">
      <header className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 desktop:flex-row desktop:items-start desktop:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <p className="text-xs leading-4 font-bold uppercase tracking-[0.08em] text-grey-400">
              Guidebook
            </p>
            <h1 className="text-[28px] leading-9 font-bold text-black">
              Process
            </h1>
            <p className="text-sm leading-[18px] text-grey-500">
              {v28PhaseIntro(ctx.role)}
            </p>
          </div>
          <UnitPicker
            role={ctx.role}
            jobId={ctx.jobId}
            unit={ctx.ctxUnit}
            units={ctx.units}
            needsContext={ctx.isUnscoped}
            showSelect={ctx.showOutletPicker}
            onPickJob={ctx.pickJob}
            onPickOutlet={ctx.pickOutlet}
            onPickOfficer={ctx.pickOfficer}
          />
        </div>
        <div className="flex flex-col gap-3">
          <div
            role="toolbar"
            aria-label="Guidebook filters"
            className="process-chip-scroll flex flex-nowrap gap-2 overflow-x-auto"
          >
            <GuideFilterButton
              open={filterOpen}
              activeTitle={guideFilter?.title ?? null}
              onOpen={() => setFilterOpen(true)}
              onClose={() => setFilterOpen(false)}
              onPick={(view) => {
                setGuideView(view);
                setFilterOpen(false);
              }}
            />
            {V26_PHASES.map((row) => {
              const on = !filterOn && row.id === phase.id;
              const count = v26VisibleCardCount(
                row,
                ctx.ctxUnit,
                ctx.role,
                false,
                whoStillValid ? whoParam : null,
              );
              return (
                <Link
                  key={row.id}
                  aria-current={on ? "page" : undefined}
                  aria-label={`${V28_PHASE_NAME[row.id]}, ${count} ${count === 1 ? "card" : "cards"}`}
                  to={processV28Href({
                    phase: row.id,
                    who: whoParam ?? undefined,
                  })}
                  className={cn(
                    "inline-flex h-8 shrink-0 items-center rounded-full px-3 text-sm leading-[18px] whitespace-nowrap",
                    "focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]",
                    on
                      ? "border border-purple-600 bg-purple-100 font-bold text-purple-700"
                      : "border border-grey-200 bg-white text-grey-700 hover:border-purple-600 hover:bg-purple-100 hover:text-purple-700",
                  )}
                >
                  {V28_PHASE_NAME[row.id]}
                </Link>
              );
            })}
          </div>
          {ctx.role === "officer" && whoNames.length > 0 ? (
            <label className="flex min-w-0 items-center gap-2">
              <span className="shrink-0 text-sm leading-[18px] font-bold text-grey-500">
                Who
              </span>
              <select
                value={whoStillValid ? (whoParam ?? "") : ""}
                onChange={(e) => pickWho(e.target.value)}
                className="h-8 min-w-0 flex-1 rounded-[var(--radius-md)] border border-grey-200 bg-white px-3 text-sm leading-[18px] text-black tablet:w-auto tablet:flex-none tablet:min-w-[10rem] focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
              >
                <option value="">Everyone</option>
                {whoNames.map((name) => (
                  <option
                    key={name}
                    value={v26WhoParamFor(name, ctx.role)}
                  >
                    {whoTag(name, ctx.role)}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {filterOn ? null : (
            <p className="text-sm leading-[18px] text-grey-500">
              {V28_PHASE_LEAD[phase.id]}
            </p>
          )}
        </div>
      </header>

      <div className="flex flex-col gap-8">
        {slices.length === 0 ? (
          <p className="text-sm leading-[18px] text-grey-600">
            {whoParam
              ? "No cards for this person. Turn the filter off or pick another."
              : "No cards in this view."}
          </p>
        ) : (
          slices.flatMap((slice) =>
            slice.chapters.map((chapter) => (
              <section
                key={`${slice.phase.id}-${chapter.id}`}
                className="flex flex-col gap-3"
              >
                <div>
                  {filterOn ? (
                    <p className="text-xs leading-4 font-bold uppercase tracking-[0.08em] text-grey-400">
                      {V28_PHASE_NAME[slice.phase.id]}
                    </p>
                  ) : null}
                  <h2
                    className={cn(
                      "text-lg leading-[22px] font-bold text-black",
                      filterOn && "mt-1",
                    )}
                  >
                    {chapter.title}
                  </h2>
                  <p className="mt-1 text-sm leading-[18px] text-grey-500">
                    {V28_CHAPTER_LEAD[chapter.id] ?? chapter.lead}
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  {chapter.cards.map((card) => {
                    const resolved = {
                      ...card,
                      href:
                        card.href &&
                        (card.href.includes("/works-v26") ||
                          card.href === "/works" ||
                          card.href.startsWith("/works?"))
                          ? worksV28Href()
                          : card.href,
                    };
                    return (
                      <V26GuideCard
                        key={card.id}
                        card={resolved}
                        role={ctx.role}
                        unit={ctx.ctxUnit}
                        sharedVoice
                        sharedFact={v28SharedFact(resolved)}
                        ifTheyAsk={v28IfTheyAsk(resolved.id)}
                        doorHint={v28WorksDoorHint(resolved.id)}
                        linkFact={v28LinkedFact}
                        filterSystems={v28SystemsNotInFact}
                        timingNote
                      />
                    );
                  })}
                </div>
              </section>
            )),
          )
        )}
      </div>
    </div>
  );
}
