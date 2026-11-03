import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useApp, type Role } from "@/lib/app-state";
import { UNITS, type Unit } from "@/lib/tenancy-data";
import {
  CONTRACTOR_JOBS,
  LS_JOB,
  LS_OUTLET,
} from "@/lib/process-job-context";
import { FilterChip } from "@/components/dls/Chip";
import { UnitSelection } from "@/components/dls/UnitSelection";
import {
  filterV26Chapters,
  filterV26ChaptersByWho,
  v26PhaseById,
  v26PhaseKicker,
  v26PhaseWhat,
  v26VisibleCardCount,
  v26WhoChipNames,
  v26WhoParamFor,
  v26WhoSelected,
  V26_PHASES,
} from "@/lib/process-v26-guide";
import { markV26Preview, processV26Href } from "@/lib/process-v26-preview";
import {
  readV26OutletStory,
  v26TenantShowsOutletPicker,
  v26UnitsForStory,
  V26_OUTLET_CHANGED,
} from "@/lib/process-v26-outlets";
import { seedV26Works } from "@/lib/process-v26-works";
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

export function ProcessV26Page() {
  const ctx = useV26Unit();
  const [params, setParams] = useSearchParams();
  const phase = v26PhaseById(params.get("phase"));
  const viewParam = params.get("view");
  const whoParam = params.get("who");
  const worksOnly = viewParam === "works";

  useEffect(() => {
    markV26Preview();
    seedV26Works(ctx.ctxUnit.id);
  }, [ctx.ctxUnit.id]);

  const scopedChapters = filterV26Chapters(phase, worksOnly);
  const whoNames = v26WhoChipNames(scopedChapters, ctx.ctxUnit, ctx.role);
  const chapters = filterV26ChaptersByWho(
    scopedChapters,
    ctx.ctxUnit,
    ctx.role,
    whoParam,
  );

  const setWorksView = (on: boolean) => {
    const next = new URLSearchParams(params);
    next.set("view", on ? "works" : "all");
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
        <div className="flex flex-col gap-3 tablet:flex-row tablet:items-start tablet:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <p className="text-xs leading-4 font-bold uppercase tracking-[0.08em] text-grey-400">
              Guidebook
            </p>
            <h1 className="text-[28px] leading-9 font-bold text-black">
              {phase.name}
            </h1>
            <p className="text-sm leading-[18px] text-grey-500">
              {ctx.role === "officer"
                ? "Same guidebook they see. Facts come from the unit process and renovation rules. If they are lost, use Who and If they ask."
                : "This is the unit guidebook. It is the same for everyone. The works quiz does not change these cards."}
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
        <div
          role="tablist"
          aria-label="Guidebook phase"
          className="-mb-px flex w-full overflow-x-auto border-b border-grey-100"
        >
          {V26_PHASES.map((row) => {
            const on = row.id === phase.id;
            const count = v26VisibleCardCount(
              row,
              ctx.ctxUnit,
              ctx.role,
              worksOnly,
              whoStillValid ? whoParam : null,
            );
            return (
              <Link
                key={row.id}
                role="tab"
                aria-selected={on}
                aria-current={on ? "page" : undefined}
                aria-label={`${row.name}, ${count} ${count === 1 ? "card" : "cards"}`}
                to={processV26Href({
                  phase: row.id,
                  view: worksOnly ? "works" : undefined,
                  who: whoParam ?? undefined,
                })}
                className={cn(
                  "relative inline-flex h-11 shrink-0 items-center gap-1 px-4 text-sm leading-[18px]",
                  "focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--color-purple-600)]",
                  on
                    ? "font-bold text-purple-600 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-purple-600"
                    : "text-grey-500 hover:text-grey-700",
                )}
              >
                {row.name}
                <span
                  className={cn(
                    "text-xs font-normal tabular-nums",
                    on ? "text-purple-400" : "text-grey-400",
                  )}
                >
                  {count}
                </span>
              </Link>
            );
          })}
        </div>
        <div className="flex flex-col gap-3">
          <div
            className="flex flex-wrap items-center gap-3"
            role="group"
            aria-label="Guidebook filters"
          >
            <FilterChip
              selected={worksOnly}
              onClick={() => setWorksView(!worksOnly)}
            >
              Works-related
            </FilterChip>
            {whoNames.length > 0 ? (
              <label className="flex min-w-0 items-center gap-2">
                <span className="shrink-0 text-sm leading-[18px] font-bold text-grey-500">
                  Who
                </span>
                <select
                  value={whoStillValid ? (whoParam ?? "") : ""}
                  onChange={(e) => pickWho(e.target.value)}
                  className="h-8 min-w-[10rem] rounded-[var(--radius-md)] border border-grey-200 bg-white px-3 text-sm leading-[18px] text-black focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
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
          </div>
          <p className="text-sm leading-[18px] text-grey-500">
            <span className="font-bold text-grey-700">
              {v26PhaseKicker(phase.id)}.
            </span>{" "}
            {v26PhaseWhat(phase.id)}
          </p>
        </div>
      </header>

      <div className="flex flex-col gap-8">
        {chapters.length === 0 ? (
          <p className="text-sm leading-[18px] text-grey-600">
            {whoParam
              ? "No cards for this person in this phase. Turn the filter off or pick another."
              : worksOnly
                ? "No works-related steps in this phase. Try Setup or Operate."
                : "No cards in this phase."}
          </p>
        ) : (
          chapters.map((chapter) => (
            <section key={chapter.id} className="flex flex-col gap-3">
              <div>
                <h2 className="text-lg leading-[22px] font-bold text-black">
                  {chapter.title}
                </h2>
                <p className="mt-1 text-sm leading-[18px] text-grey-500">
                  {chapter.lead}
                </p>
              </div>
              <div className="flex flex-col gap-3">
                {chapter.cards.map((card) => (
                  <V26GuideCard
                    key={card.id}
                    card={card}
                    role={ctx.role}
                    unit={ctx.ctxUnit}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
