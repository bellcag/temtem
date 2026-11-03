import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { LmsJourneyNote } from "@/components/v31/LmsJourneyNote";
import { useApp, type Role } from "@/lib/app-state";
import { DOCUMENTS, UNITS, type Unit } from "@/lib/tenancy-data";
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
  v26WhoSelected,
  V26_GUIDE_FILTERS,
  V26_PHASES,
  type V26Card,
  type V26PhaseId,
} from "@/lib/process-v26-guide";
import { FilterChip } from "@/components/dls/Chip";
import filterOff from "@/assets/figma/filter-off.svg";
import closeIcon from "@/assets/figma/close.svg";
import exclamationAlert from "@/assets/figma/exclamation-alert.svg";
import arrowTop from "@/assets/figma/arrow-top.svg";
import { Button } from "@/components/Button/Button";
import {
  V31PhaseCards,
  V31_PHASE_NAME,
} from "@/components/v31/PhaseGuide";
import { PossibleWorks } from "@/components/v31/PossibleWorks";
import { isV34Path, isV35Path, isV36Path, isV37Path, isV40Path, processV31Href, usesV35Flow, usesV36Chrome, usesV37Cut, usesV38Modules, worksV31Href } from "@/lib/process-v31-preview";
import { v38JourneyAsks, v38JourneyPhases } from "@/lib/process-v38-guide";
import { v40JourneyAsks, v40JourneyPhases } from "@/lib/process-v40-guide";
import { v35FreshSteps } from "@/lib/process-v35-updates";
import { v35StepUpdates } from "@/lib/process-v35-updates";
import {
  V28_CHAPTER_LEAD,
  v28IfTheyAsk,
  v28PhaseIntro,
  v28SharedFact,
} from "@/lib/process-v28-voice";
import { v28LinkedFact, v28SystemsNotInFact } from "@/lib/process-v28-systems";
import {
  readV26OutletStory,
  v26TenantShowsOutletPicker,
  v26UnitsForStory,
  V26_OUTLET_CHANGED,
} from "@/lib/process-v26-outlets";
import {
  isV26EmptyStockSlot,
  readV26Works,
  V26_WORKS_CHANGED,
  type V26Work,
} from "@/lib/process-v26-works";
import { v37UnitsForTenant, v37VisibleWorks, V37_CHANGED } from "@/lib/process-v37";
import { ensureV31WorksStory } from "@/lib/process-v31-seed";
import {
  isV31Complete,
  readV31Archived,
  readV31Deleted,
  v31ProjectTitle,
  V31_ARCHIVED_CHANGED,
  V31_COMPLETED_CHANGED,
  V31_DELETED_CHANGED,
} from "@/lib/process-v31-works";
import {
  hydrateV28FromLegacy,
  q5IsMinorFitout,
  q5IsNoRenovation,
} from "@/lib/process-v28-quiz";
import { BecauseBanner, BecauseTitleHint, V26GuideCard } from "@/pages/v26-guide-card";
import {
  PROCESS_WORKS_SITTING,
  v33ProcessBecause,
} from "@/lib/process-v33-feed";
import {
  StepInset,
  StepInsetList,
  StepSection,
} from "@/components/v31/StepSection";
import { cn } from "@/lib/utils";

/**
 * Door titles match the project names: Opening fit-out, Further works, Exit works.
 * The paragraph introduces the step and guides the next move.
 */
const V31_CARD_TITLE: Record<string, string> = {
  "opening-works": "Opening fit-out",
  "lease-works": "Further works",
};

const V31_RENO_FACT: Record<string, string> = {
  "opening-works": "Start this renovation with the IFM briefing on site rules.",
  "lease-works": "Start a further renovation with its own Permit to Work.",
  "exit-works": "Get the Permit to Work for removing the fit-out.",
};

const V31_CHAPTER_LEAD: Record<string, string> = {
  access: "Terminal and unit access, then the systems this unit uses.",
  "exit-works": "The reinstatement Permit to Work is in Projects.",
};

function v31SharedFact(card: V26Card) {
  if (
    typeof window !== "undefined" &&
    isV37Path(window.location.pathname) &&
    V31_RENO_FACT[card.id]
  ) {
    return "Open Projects for this renovation.";
  }
  return V31_RENO_FACT[card.id] ?? v28SharedFact(card);
}

/** Why this card opens Projects. The chip names the list it opens. */
function v31WorksDoor(
  cardId: string,
  open: boolean,
  role: Role,
): { title?: string; hint: string; label: string } {
  const v35 =
    typeof window !== "undefined" &&
    usesV35Flow(window.location.pathname);
  const v37 =
    typeof window !== "undefined" &&
    isV37Path(window.location.pathname);
  if (v35) {
    const work = v37
      ? "renovation"
      : cardId === "exit-works"
        ? "reinstatement"
        : cardId === "lease-works"
          ? "further renovation"
          : "renovation";
    if (role === "contractor") {
      return {
        title: `Apply for the ${work} permit`,
        hint: open
          ? "Answer a few questions about the work. We tell you which permits and files you need, then check your files before you submit."
          : "Start a project and answer a few questions about the work. We tell you which permits and files you need.",
        label: open ? "Open Project" : "Start a Project",
      };
    }
    if (role === "officer") {
      return {
        title: `Track the ${work} permit`,
        hint: "See which permits this work needs and which documents the contractor has ready.",
        label: open ? "Open Project" : "Open Projects",
      };
    }
    return {
      title: `Follow your ${work} permit`,
      hint: open
        ? "Your contractor applies for the permit. See which permits are needed and how far they have got."
        : "Your contractor applies for the permit in Projects. You can follow it there once they start.",
      label: open ? "Open Project" : "Open Projects",
    };
  }
  if (cardId === "exit-works") {
    return {
      hint: open
        ? "The reinstatement permit and the steps that follow live in Projects."
        : "Start the reinstatement in Projects. The permit and the steps that follow live there.",
      label: "See Projects",
    };
  }
  if (cardId === "lease-works") {
    return {
      hint: open
        ? "The permit and the steps for this further renovation live in Projects."
        : "Start a further renovation in Projects. It has its own Permit to Work.",
      label: "See Projects",
    };
  }
  return {
    hint: open
      ? "The renovation permit and the steps that follow live in Projects."
      : "Start this renovation in Projects. The permit and the steps that follow live there.",
    label: "See Projects",
  };
}

function doorMatchesWork(cardId: string, work: V26Work, unit: Unit) {
  const quiz = hydrateV28FromLegacy(work.quiz, unit);
  const title = v31ProjectTitle(work, unit);
  if (cardId === "lease-works") return title === "Further works";
  if (cardId === "exit-works") return /reinstat|exit/i.test(title);
  if (q5IsNoRenovation(quiz) || q5IsMinorFitout(quiz)) return false;
  return title !== "Further works";
}

function useV31DoorWork(unit: Unit, role: Role) {
  const location = useLocation();
  const v37 = usesV37Cut(location.pathname);
  const [ids, setIds] = useState<Record<string, string>>({});
  useEffect(() => {
    const refresh = () => {
      const deleted = new Set(readV31Deleted(unit.id));
      const archived = new Set(readV31Archived(unit.id));
      const rows = (v37 ? v37VisibleWorks(role) : readV26Works(unit.id)).filter(
        (row) =>
          row.unitId === unit.id &&
          !deleted.has(row.id) &&
          !archived.has(row.id) &&
          !isV26EmptyStockSlot(row) &&
          !isV31Complete(unit.id, row.id),
      );
      const latest = (cardId: string) =>
        (v37 ? rows : rows.filter((row) => doorMatchesWork(cardId, row, unit)))
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]?.id;
      setIds({
        "opening-works": latest("opening-works") ?? "",
        "lease-works": latest("lease-works") ?? "",
        "exit-works": latest("exit-works") ?? "",
      });
    };
    refresh();
    window.addEventListener(V26_WORKS_CHANGED, refresh);
    window.addEventListener(V31_DELETED_CHANGED, refresh);
    window.addEventListener(V31_ARCHIVED_CHANGED, refresh);
    window.addEventListener(V31_COMPLETED_CHANGED, refresh);
    window.addEventListener(V37_CHANGED, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(V26_WORKS_CHANGED, refresh);
      window.removeEventListener(V31_DELETED_CHANGED, refresh);
      window.removeEventListener(V31_ARCHIVED_CHANGED, refresh);
      window.removeEventListener(V31_COMPLETED_CHANGED, refresh);
      window.removeEventListener(V37_CHANGED, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [unit, role, v37]);
  return ids;
}
import { Check } from "lucide-react";
import caretDown from "@/assets/figma/caret-down.svg";

function useV26Unit() {
  const location = useLocation();
  const v37 = usesV37Cut(location.pathname);
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
    () => (v37 ? v37UnitsForTenant() : v26UnitsForStory(outletStory)),
    [outletStory, v37, location.search],
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

function outletLabel(row: Unit) {
  return `${row.company.replace(/\s+Pte Ltd$/i, "")} · ${row.unitNo}`;
}

function UnitPicker({
  role,
  jobId,
  unit,
  units,
  needsContext,
  showSelect,
  namedOutlet = false,
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
  /** Page header shows the tenant and the unit, as in `_Atoms/UnitSelection`. */
  namedOutlet?: boolean;
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
        ? units.map((row) => ({
            value: row.id,
            label: namedOutlet ? outletLabel(row) : row.unitNo,
          }))
        : UNITS.map((row) => ({
            value: row.unitNo,
            label: namedOutlet ? outletLabel(row) : row.unitNo,
          }));
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
                  "max-h-[80vh] rounded-t-[var(--radius-xl)]",
                  "tablet:max-w-md tablet:rounded-[var(--radius-xl)]",
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
                        Show All
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
                            {row.view === "works"
                              ? "Opening fit-out, further works, and exit works"
                              : row.hint}
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

function SectionMenu({
  chapters,
  current,
  phaseName,
  open,
  onToggle,
  onSelect,
  chapterHref,
}: {
  chapters: { id: string; title: string }[];
  current: { id: string; title: string };
  phaseName: string;
  open: boolean;
  onToggle: () => void;
  onSelect: (id: string) => void;
  chapterHref: (id: string) => string;
}) {
  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`${phaseName}, ${current.title}`}
        onClick={onToggle}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-[var(--radius-md)] border bg-white px-3 py-2 text-left focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]",
          open ? "border-purple-600" : "border-grey-200",
        )}
      >
        <span className="min-w-0">
          <span className="block truncate text-xs leading-4 text-grey-500">{phaseName}</span>
          <span className="block truncate text-sm leading-[18px] font-bold text-black">
            {current.title}
          </span>
        </span>
        <span className="grid size-5 shrink-0 place-items-center" aria-hidden>
          <img
            src={caretDown}
            alt=""
            width={10}
            height={6}
            className={cn("transition-transform", open && "rotate-180")}
          />
        </span>
      </button>
      {open && chapters.length > 1 ? (
        <ul
          role="listbox"
          aria-label="Sections"
          className="mt-1 rounded-[var(--radius-md)] border border-grey-200 bg-white p-1 shadow-[var(--shadow-light-bg)]"
        >
          {chapters.map((row) => {
            const on = row.id === current.id;
            return (
              <li key={row.id} role="presentation">
                <Link
                  to={chapterHref(row.id)}
                  role="option"
                  aria-selected={on}
                  aria-current={on ? "page" : undefined}
                  onClick={() => onSelect(row.id)}
                  className={cn(
                    "flex h-10 w-full items-center justify-between gap-2 rounded-[6px] px-3 text-left text-sm leading-[18px] text-black focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--color-purple-600)]",
                    on ? "bg-grey-50" : "hover:bg-grey-50",
                  )}
                >
                  <span className="min-w-0 truncate">{row.title}</span>
                  {on ? <Check className="size-5 shrink-0" aria-hidden /> : null}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </>
  );
}

function SectionScrollMenu({
  chapters,
  currentId,
  phaseName,
  onSelect,
  chapterHref,
  nested = false,
  dropdown = false,
  bare = false,
  flush = false,
}: {
  chapters: { id: string; title: string; lead?: string; cards?: { id: string; title: string }[] }[];
  currentId?: string;
  phaseName: string;
  onSelect: (id: string) => void;
  chapterHref: (id: string) => string;
  nested?: boolean;
  dropdown?: boolean;
  bare?: boolean;
  flush?: boolean;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const inlineRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);
  const [open, setOpen] = useState(false);
  const [frame, setFrame] = useState<{ top: number; left: number; width: number } | null>(null);
  const selected = chapters.find((row) => row.id === currentId);
  const current = selected ?? (nested ? undefined : chapters[0]);

  useEffect(() => {
    const row = (dropdown ? inlineRef : rowRef).current;
    const main = row?.closest("main");
    if (!row || !main) return;
    let lastTop = main.scrollTop;
    const topInset = () => (window.matchMedia("(min-width: 1280px)").matches ? 0 : 56);
    const update = () => {
      if (row.getClientRects().length === 0) {
        setStuck(false);
        return;
      }
      const mainRect = main.getBoundingClientRect();
      const rowRect = row.getBoundingClientRect();
      const inset = topInset();
      if (Math.abs(main.scrollTop - lastTop) > 6) setOpen(false);
      lastTop = main.scrollTop;
      setStuck(rowRect.bottom < mainRect.top + inset);
      setFrame({
        top: Math.max(mainRect.top, inset),
        left: mainRect.left,
        width: mainRect.width,
      });
    };
    update();
    main.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      main.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [dropdown]);

  useEffect(() => {
    setOpen(false);
  }, [currentId]);

  useEffect(() => {
    const row = rowRef.current;
    const chip = row?.querySelector<HTMLElement>(`[data-chapter="${currentId}"]`);
    if (!row || !chip) return;
    const left = chip.offsetLeft - (row.clientWidth - chip.offsetWidth) / 2;
    row.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
  }, [currentId]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (inlineRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (dropdown && current) {
    const sticky = stuck && frame && chapters.length > 1;
    const menu = (menuOpen: boolean) => (
      <SectionMenu
        chapters={chapters}
        current={current}
        phaseName={phaseName}
        open={menuOpen}
        onToggle={() => setOpen((value) => !value)}
        onSelect={onSelect}
        chapterHref={chapterHref}
      />
    );
    return (
      <>
        <div ref={inlineRef}>
          {menu(sticky ? false : open)}
        </div>
        {sticky
          ? createPortal(
              <div
                ref={menuRef}
                className="z-30 border-b border-grey-100 bg-grey-50 px-4 py-2 tablet:px-8"
                style={{ position: "fixed", top: frame.top, left: frame.left, width: frame.width }}
              >
                {menu(open)}
              </div>,
              document.body,
            )
          : null}
      </>
    );
  }

  return (
    <>
      <div
        ref={rowRef}
        role={nested ? "navigation" : "toolbar"}
        aria-label="Sections"
        className={cn(
          nested
            ? flush
              ? "flex flex-col"
              : bare
                ? "flex flex-col gap-1"
                : "flex flex-col gap-1 rounded-[var(--radius-xl)] border border-grey-200 bg-white p-2"
            : "process-chip-scroll -mx-1 flex flex-nowrap gap-2 overflow-x-auto px-1",
        )}
      >
        {chapters.map((row) => {
          const on = row.id === current?.id;
          return (
            <Link
              key={row.id}
              to={chapterHref(row.id)}
              data-chapter={row.id}
              aria-current={on ? "page" : undefined}
              onClick={() => onSelect(row.id)}
              className={cn(
                "focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]",
                nested
                  ? flush
                    ? cn(
                        "flex w-full min-w-0 items-center px-4 py-3 text-left",
                        on ? "bg-purple-100" : "hover:bg-grey-50",
                      )
                    : cn(
                        "flex w-full min-w-0 items-center rounded-[var(--radius-md)] px-2.5 py-1.5 text-left",
                        on ? "bg-purple-100" : "hover:bg-purple-100",
                      )
                  : cn(
                      "inline-flex h-8 shrink-0 items-center rounded-full px-3 text-sm leading-[18px] whitespace-nowrap",
                      on
                        ? "border border-purple-600 bg-purple-100 font-bold text-purple-700"
                        : "border border-grey-200 bg-white text-grey-700 hover:border-purple-600 hover:bg-purple-100 hover:text-purple-700",
                    ),
              )}
            >
              {nested ? (
                <span
                  className={cn(
                    "min-w-0 text-sm leading-[18px]",
                    on
                      ? flush
                        ? "font-bold text-purple-700"
                        : "font-bold text-black"
                      : flush
                        ? "font-normal text-black"
                        : "font-normal text-grey-700",
                  )}
                >
                  {row.title}
                </span>
              ) : (
                row.title
              )}
            </Link>
          );
        })}
        {nested ? null : <span className="w-2 shrink-0" aria-hidden />}
      </div>
      {!nested && stuck && frame && current && chapters.length > 1
        ? createPortal(
            <div
              ref={menuRef}
              className="z-30 border-b border-grey-100 bg-grey-50 px-4 py-2 tablet:px-8 desktop:px-10"
              style={{ position: "fixed", top: frame.top, left: frame.left, width: frame.width }}
            >
              <SectionMenu
                chapters={chapters}
                current={current}
                phaseName={phaseName}
                open={open}
                onToggle={() => setOpen((value) => !value)}
                onSelect={onSelect}
                chapterHref={chapterHref}
              />
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

/** No close control. Leaves 3 months after each policy's effective date. */
function JourneyUpdateNote() {
  const updates = v35FreshSteps();
  const [open, setOpen] = useState(false);
  const listId = useId();
  if (updates.length === 0) return null;
  const count = updates.length === 1 ? "1 step" : `${updates.length} steps`;
  const docs = new Set(updates.flatMap((step) => step.docs)).size;
  const because =
    docs === 1 ? "a document was revised" : `${docs} documents were revised`;
  return (
    <div className="rounded-[var(--radius-lg)] border border-yellow-200 bg-yellow-100 px-4 py-4 tablet:px-5">
      <div className="flex items-start gap-3 tablet:gap-4">
        <span
          aria-hidden
          className="mt-px block size-5 shrink-0 bg-yellow-800"
          style={{
            WebkitMaskImage: `url("${exclamationAlert}")`,
            maskImage: `url("${exclamationAlert}")`,
            WebkitMaskSize: "contain",
            maskSize: "contain",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            maskPosition: "center",
          }}
        />
        <div className="min-w-0 flex-1">
          <p className="text-base leading-5 font-bold text-yellow-800">Requirements updated</p>
          <p className="mt-1 text-base leading-5 text-yellow-800">
            {count} in this journey changed after {because}.
          </p>
        </div>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={listId}
          aria-label={open ? "Hide changes" : "See what changed"}
          onClick={() => setOpen((value) => !value)}
          className="grid size-9 shrink-0 place-items-center rounded-[var(--radius-md)] text-yellow-800 hover:bg-yellow-200 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
        >
          <span
            aria-hidden
            className={cn("block h-1.5 w-2.5 bg-yellow-800 transition-transform", open && "rotate-180")}
            style={{
              WebkitMaskImage: `url("${caretDown}")`,
              maskImage: `url("${caretDown}")`,
              WebkitMaskSize: "contain",
              maskSize: "contain",
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
            }}
          />
        </button>
      </div>
      {open ? (
        <div
          id={listId}
          className="mt-3 flex flex-col gap-2 border-t border-yellow-200 pt-3 tablet:pl-9"
        >
          {updates.map((step) => (
            <p key={step.id} className="text-sm leading-5 text-black">
              <span className="font-bold">{step.title}:</span>
              {v35StepUpdates(step.id).map((row) => {
                const doc = DOCUMENTS.find((item) => item.id === row.doc);
                const text = row.brief ?? row.note;
                const [before, after = ""] = (text.charAt(0).toUpperCase() + text.slice(1)).split("{doc}");
                return (
                  <span key={`${row.doc}-${row.on}`}>
                    {" "}
                    {before}
                    {doc && text.includes("{doc}") ? (
                      <Link
                        to={`/documents/${doc.id}`}
                        className="font-bold text-purple-600 hover:text-purple-700"
                      >
                        {doc.name}
                      </Link>
                    ) : null}
                    {after}
                  </span>
                );
              })}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function v40SheetSystems(
  systems: { label: string; href?: string }[],
  fact: string,
  role?: Role,
  cardId?: string,
) {
  return systems.map((system) => {
    if (system.href?.startsWith("http")) {
      return { label: system.label, href: system.href, external: true as const };
    }
    return v28SystemsNotInFact([system], fact, role, cardId)[0];
  });
}

export function ProcessV31Page() {
  const ctx = useV26Unit();
  const location = useLocation();
  const v40 = isV40Path(location.pathname);
  const v38 = usesV38Modules(location.pathname) && !v40;
  const v36 = usesV36Chrome(location.pathname);
  const v34 = isV34Path(location.pathname) || usesV35Flow(location.pathname);
  const [params, setParams] = useSearchParams();
  const guidePhases = useMemo(
    () =>
      v40
        ? v40JourneyPhases(ctx.ctxUnit, ctx.role)
        : v38
          ? v38JourneyPhases(ctx.ctxUnit, ctx.role)
          : V26_PHASES,
    [v40, v38, ctx.ctxUnit, ctx.role],
  );
  const phase =
    guidePhases.find((row) => row.id === params.get("phase")) ??
    guidePhases[0] ??
    V26_PHASES[0];
  const whoParam = params.get("who");
  const chapterParam = params.get("chapter");
  const allChapters = useMemo(
    () =>
      guidePhases.flatMap((row) =>
        filterV26Chapters(row, false).map((section) => ({
          ...section,
          phaseId: row.id,
        })),
      ),
    [guidePhases],
  );
  const whoNames = v26WhoChipNames(allChapters, ctx.ctxUnit, ctx.role);
  const panelChapters = useMemo(
    () =>
      filterV26ChaptersByWho(
        allChapters,
        ctx.ctxUnit,
        ctx.role,
        whoParam,
      ).map((section) => ({
        ...section,
        phaseId:
          allChapters.find((row) => row.id === section.id)?.phaseId ?? phase.id,
      })),
    [allChapters, ctx.ctxUnit, ctx.role, whoParam, phase.id],
  );
  const phaseGroups = useMemo(
    () =>
      guidePhases.map((row, index) => ({
        id: row.id,
        index,
        chapters: panelChapters.filter((section) => section.phaseId === row.id),
      })).filter((group) => group.chapters.length > 0),
    [guidePhases, panelChapters],
  );
  const stageByChapter = useMemo(() => {
    const map = new Map<string, number>();
    let n = 0;
    for (const group of phaseGroups) {
      for (const section of group.chapters) {
        if (section.cards.length === 0) continue;
        n += 1;
        map.set(section.id, n);
      }
    }
    return map;
  }, [phaseGroups]);
  const chapter =
    panelChapters.find((row) => row.id === chapterParam) ??
    panelChapters.find((row) => row.phaseId === phase.id) ??
    panelChapters[0] ??
    null;
  const clickLock = useRef(false);
  const [showToTop, setShowToTop] = useState(false);
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({});
  const doorWorks = useV31DoorWork(ctx.ctxUnit, ctx.role);
  const chapterIsOpen = (id: string) => openIds[id] ?? true;
  const openChapter = (id: string) => {
    setOpenIds((prev) => (prev[id] ? prev : { ...prev, [id]: true }));
  };
  const toggleChapter = (id: string) => {
    setOpenIds((prev) => ({
      ...prev,
      [id]: !(prev[id] ?? true),
    }));
  };

  useEffect(() => {
    ensureV31WorksStory(ctx.ctxUnit, ctx.role);
  }, [ctx.ctxUnit, ctx.role]);

  useEffect(() => {
    const want = pendingReveal.current;
    if (!want) return;
    const t = window.setTimeout(() => {
      if (pendingReveal.current !== want) return;
      scrollIdIntoView(want, stickyOffset());
    }, 0);
    return () => window.clearTimeout(t);
  }, [chapter?.id, phase.id]);

  useEffect(() => {
    if (!chapter) return;
    if (params.get("phase") === chapter.phaseId && chapterParam === chapter.id)
      return;
    const next = new URLSearchParams(params);
    next.set("phase", chapter.phaseId);
    next.set("chapter", chapter.id);
    next.delete("view");
    setParams(next, { replace: true });
  }, [chapter, chapterParam, params, phase.id, setParams]);

  const whoStillValid =
    !whoParam ||
    whoNames.some((name) => v26WhoSelected(name, ctx.role, whoParam));

  useEffect(() => {
    if (whoStillValid) return;
    const next = new URLSearchParams(params);
    next.delete("who");
    setParams(next, { replace: true });
  }, [whoStillValid, params, setParams]);

  const desktopLayout = () => window.matchMedia("(min-width: 1280px)").matches;

  const scrollMainTo = (top: number, smooth = false) => {
    const main = document.querySelector("main");
    if (!(main instanceof HTMLElement)) return;
    main.scrollTo({ top: Math.max(0, top), behavior: smooth ? "smooth" : "auto" });
  };

  const scrollIdIntoView = (id: string, offset = 0, smooth = false) => {
    const el = document.getElementById(id);
    const main = document.querySelector("main");
    if (!el || !(main instanceof HTMLElement)) return false;
    const top =
      el.getBoundingClientRect().top -
      main.getBoundingClientRect().top +
      main.scrollTop -
      offset;
    main.scrollTo({
      top: Math.max(0, top),
      behavior: smooth ? "smooth" : "auto",
    });
    return true;
  };

  const stickyOffset = () => {
    if (desktopLayout()) return 32;
    const sticky = document.querySelector<HTMLElement>("[data-v31-sticky]");
    if (!sticky || sticky.offsetParent === null) return 16;
    return 56 + sticky.offsetHeight + 12;
  };

  const pendingReveal = useRef<string | null>(null);

  const revealSection = (id: string) => {
    pendingReveal.current = id;
    const run = (done = false) => {
      if (pendingReveal.current !== id) return;
      scrollIdIntoView(id, stickyOffset());
      if (done) pendingReveal.current = null;
    };
    requestAnimationFrame(() => {
      requestAnimationFrame(() => run());
    });
    window.setTimeout(() => run(), 80);
    window.setTimeout(() => run(), 200);
    window.setTimeout(() => run(true), 400);
  };

  const focusCard = (chapterId: string, cardId: string) => {
    openChapter(chapterId);
    clickLock.current = true;
    const owner =
      panelChapters.find((row) => row.id === chapterId)?.phaseId ?? phase.id;
    const next = new URLSearchParams(params);
    next.set("phase", owner);
    next.set("chapter", chapterId);
    next.set("card", cardId);
    next.delete("view");
    setParams(next, { replace: true });
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollMainTo(0, true);
      });
    });
    window.setTimeout(() => {
      clickLock.current = false;
    }, 900);
  };

  const pickChapter = (id: string) => {
    openChapter(id);
    clickLock.current = true;
    const owner =
      panelChapters.find((row) => row.id === id)?.phaseId ?? phase.id;
    if (owner !== phase.id) scrollMainTo(0, false);
    const next = new URLSearchParams(params);
    next.set("phase", owner);
    next.set("chapter", id);
    next.delete("card");
    next.delete("view");
    setParams(next, { replace: true });
    revealSection(`v31-section-${id}`);
    window.setTimeout(() => {
      clickLock.current = false;
    }, 900);
  };

  const pickPhase = (id: V26PhaseId) => {
    const first = panelChapters.find((row) => row.phaseId === id);
    if (!first) return;
    openChapter(first.id);
    clickLock.current = true;
    const next = new URLSearchParams(params);
    next.set("phase", id);
    next.set("chapter", first.id);
    next.delete("card");
    next.delete("view");
    setParams(next, { replace: true });
    if (usesV35Flow(location.pathname)) {
      pendingReveal.current = null;
      const goTop = () => scrollMainTo(0);
      goTop();
      requestAnimationFrame(() => {
        requestAnimationFrame(goTop);
      });
    } else {
      revealSection(`v31-section-${first.id}`);
    }
    window.setTimeout(() => {
      clickLock.current = false;
    }, 900);
  };

  const paramsRef = useRef(params);
  paramsRef.current = params;
  useEffect(() => {
    const main = document.querySelector("main");
    if (!(main instanceof HTMLElement)) return;
    const sync = () => {
      if (clickLock.current) return;
      const frame = main.getBoundingClientRect();
      const room = main.scrollHeight - main.scrollTop - main.clientHeight;
      const atEnd = main.scrollTop > 8 && room <= 72;
      const readY = atEnd
        ? frame.bottom - 80
        : frame.top + Math.round(frame.height * 0.32);
      const visible = panelChapters.filter((row) => row.phaseId === phase.id);
      let active = visible[0];
      for (const section of visible) {
        const el = document.getElementById(`v31-section-${section.id}`);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= readY + 8) active = section;
      }
      if (!active) return;
      const current = paramsRef.current;
      if (
        current.get("chapter") === active.id &&
        current.get("phase") === active.phaseId
      ) {
        return;
      }
      const next = new URLSearchParams(current);
      next.set("phase", active.phaseId);
      next.set("chapter", active.id);
      next.delete("card");
      setParams(next, { replace: true });
    };
    main.addEventListener("scroll", sync, { passive: true });
    return () => main.removeEventListener("scroll", sync);
  }, [panelChapters, phase.id, setParams]);

  const phaseSections = (id: V26PhaseId, flush = false) => {
    const row = v26PhaseById(id);
    const chapters = filterV26ChaptersByWho(
      filterV26Chapters(row, false),
      ctx.ctxUnit,
      ctx.role,
      whoParam,
    );
    const listed = chapters;
    if (listed.length === 0) return null;
    return (
      <SectionScrollMenu
        chapters={listed}
        currentId={id === phase.id ? chapter?.id : undefined}
        phaseName={V31_PHASE_NAME[id]}
        onSelect={pickChapter}
        chapterHref={(chapterId) =>
          processV31Href({ phase: id, chapter: chapterId })
        }
        nested
        bare
        flush={flush}
      />
    );
  };

  useEffect(() => {
    const main = document.querySelector("main");
    if (!(main instanceof HTMLElement)) return;
    const sync = () => {
      setShowToTop(main.scrollHeight > main.clientHeight + 48);
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(main);
    window.addEventListener("resize", sync);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", sync);
    };
  }, [phase.id, chapter?.id, panelChapters.length]);

  const backToTop = () => {
    scrollMainTo(0, true);
  };

  return (
    <div className={cn("process-v31 dls-page dls-grid-12 !pt-5 tablet:!pt-8 desktop:!pb-8", v36 ? "desktop:max-w-[1088px]" : "desktop:max-w-[var(--container-tempo-desktop)]")}>
      <header className="col-span-full flex min-w-0 flex-col gap-4">
        <div className={cn("flex flex-col gap-3 desktop:flex-row desktop:items-start desktop:justify-between", v36 && "desktop:gap-2")}>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <h1 className="text-[28px] leading-9 font-bold text-black">
              Tenancy Journey
            </h1>
            <p className="text-sm leading-[18px] text-grey-500">
              {v28PhaseIntro(ctx.role)}
            </p>
          </div>
          {usesV35Flow(location.pathname) && !v36 ? null : (
          <UnitPicker
            role={ctx.role}
            jobId={ctx.jobId}
            unit={ctx.ctxUnit}
            units={ctx.units}
            needsContext={ctx.isUnscoped}
            showSelect={ctx.showOutletPicker}
            namedOutlet={v36}
            onPickJob={ctx.pickJob}
            onPickOutlet={ctx.pickOutlet}
            onPickOfficer={ctx.pickOfficer}
          />
          )}
        </div>
        {isV35Path(location.pathname) ? <JourneyUpdateNote /> : null}
      </header>

      <div
        className={cn(
          "col-span-full flex w-full min-w-0 flex-col",
          v36 ? "gap-6" : usesV35Flow(location.pathname) ? "gap-3" : "gap-6",
        )}
      >
        <div
          data-v31-sticky
          className={cn(
            "sticky top-14 z-20 -mx-4 px-4 tablet:hidden",
            v36 ? "bg-grey-25" : "bg-grey-50",
            usesV35Flow(location.pathname) ? "py-1" : "py-2",
          )}
        >
          <V31PhaseCards
            currentId={phase.id}
            chapterTitle={chapter?.title}
            compact
            mode="field"
            sectionsFor={(id) => phaseSections(id, true)}
            onPickPhase={pickPhase}
          />
        </div>
        <div className="hidden tablet:block">
          <V31PhaseCards
            currentId={phase.id}
            chapterTitle={chapter?.title}
            compact
            mode="rail"
            layout="row"
            onPickPhase={pickPhase}
          />
        </div>

      <div className={cn("flex min-w-0 flex-col pb-28 desktop:pb-24", v36 ? "gap-6" : "gap-3")}>
        {panelChapters.length === 0 ? (
          <p className="text-sm leading-[18px] text-grey-600">
            {whoParam
              ? "No cards for this person. Turn the filter off or pick another."
              : "No cards in this view."}
          </p>
        ) : (
          phaseGroups
            .filter((group) => group.id === phase.id)
            .map((group) => (
            <section
              key={group.id}
              id={`v31-phase-${group.id}`}
              className={cn("flex min-w-0 scroll-mt-8 flex-col", v36 ? "gap-6" : "gap-3")}
            >
              {group.chapters.map((section) => {
              const doorCards = section.cards;
              if (doorCards.length === 0) return null;
              const cardParam = params.get("card");
              const focusId =
                cardParam && doorCards.some((row) => row.id === cardParam)
                  ? cardParam
                  : null;
              const shown = focusId
                ? doorCards.filter((row) => row.id === focusId)
                : doorCards;
              const focusIndex = focusId
                ? doorCards.findIndex((row) => row.id === focusId)
                : -1;
              const prevCard =
                focusIndex > 0 ? doorCards[focusIndex - 1] : null;
              const nextCard =
                focusIndex >= 0 && focusIndex < doorCards.length - 1
                  ? doorCards[focusIndex + 1]
                  : null;
              return (
              <StepSection
                key={`${section.phaseId}-${section.id}-${focusId ?? "all"}`}
                id={`v31-section-${section.id}`}
                heading="h3"
                className="scroll-mt-[8rem] tablet:scroll-mt-10"
                bare
                well={v36}
                open={chapterIsOpen(section.id)}
                onToggle={() => toggleChapter(section.id)}
                title={
                  isV37Path(location.pathname) &&
                  (section.id === "opening-works" ||
                    section.id === "lease-works" ||
                    section.id === "exit-works")
                    ? "Starting this renovation"
                    : section.title
                }
                mark={
                  usesV35Flow(location.pathname)
                    ? `Stage ${stageByChapter.get(section.id) ?? 1}`
                    : undefined
                }
                lead={
                  isV37Path(location.pathname) &&
                  (section.id === "exit-works" || section.id === "lease-works")
                    ? "The renovation permit is in Projects."
                    : (V31_CHAPTER_LEAD[section.id] ??
                      V28_CHAPTER_LEAD[section.id] ??
                      section.lead)
                }
                extra={
                  focusId && doorCards.length > 1 ? (
                    <p className="mt-2 text-sm leading-[18px] text-grey-600">
                      {doorCards[focusIndex]?.title} · {focusIndex + 1} of{" "}
                      {doorCards.length}
                    </p>
                  ) : null
                }
              >
                <StepInsetList inset>
                  {shown.map((card) => {
                    const openWork = doorWorks[card.id] || undefined;
                    const v37Door =
                      isV37Path(location.pathname) && card.kind === "works-door";
                    const resolved = {
                      ...card,
                      title: v37Door
                        ? "Renovation"
                        : (V31_CARD_TITLE[card.id] ?? card.title),
                      ...(v37Door ? { sources: [], steps: undefined } : {}),
                      href:
                        card.kind === "works-door" ||
                        (card.href &&
                          (card.href.includes("/works") ||
                            card.href.startsWith("/works?")))
                          ? worksV31Href()
                          : card.href,
                    };
                    const door = v31WorksDoor(
                      resolved.id,
                      Boolean(openWork),
                      ctx.role,
                    );
                    const worksSitting = Boolean(PROCESS_WORKS_SITTING[card.id]);
                    const becauseTags = v38 || v40
                      ? (card.sheetBecause ?? [])
                      : worksSitting
                        ? v33ProcessBecause(card.id)
                        : [];
                    const guide = (
                      <V26GuideCard
                        card={resolved}
                        role={ctx.role}
                        unit={ctx.ctxUnit}
                        embedded={worksSitting}
                        stepNo={
                          doorCards.findIndex((row) => row.id === card.id) + 1
                        }
                        titleBelow={
                          v34 && becauseTags.length > 0 ? (
                            <BecauseTitleHint tags={becauseTags} />
                          ) : undefined
                        }
                        updateNotes={
                          isV35Path(location.pathname)
                            ? v35StepUpdates(card.id)
                            : undefined
                        }
                        sharedVoice
                        sharedFact={v38 || v40 ? "" : v31SharedFact(resolved)}
                        ifTheyAsk={
                          v40
                            ? v40JourneyAsks(card.id, ctx.role, ctx.ctxUnit)
                            : v38
                              ? v38JourneyAsks(card.id, ctx.role, ctx.ctxUnit)
                              : v28IfTheyAsk(resolved.id)
                        }
                        omitAsks={v37Door}
                        doorTitle={resolved.kind === "works-door" ? door.title : undefined}
                        doorHint={
                          resolved.kind === "works-door"
                            ? v40 && card.sheetBanner
                              ? card.sheetBanner
                              : door.hint
                            : undefined
                        }
                        doorLabel={resolved.kind === "works-door" ? door.label : undefined}
                        linkFact={v28LinkedFact}
                        filterSystems={v40 ? v40SheetSystems : v28SystemsNotInFact}
                        timingNote
                        linkResources
                        readerActions
                        stepsAside
                        metaBeside
                        compact={resolved.kind === "works-door"}
                        footer={
                          v40 && card.sheetSla ? (
                            <p className="text-sm leading-[18px] text-grey-600">{card.sheetSla}</p>
                          ) : resolved.kind === "works-door" ? (
                            <PossibleWorks cardId={resolved.id} unit={ctx.ctxUnit} />
                          ) : null
                        }
                      />
                    );
                    return (
                      <StepInset
                        key={card.id}
                        id={`v31-card-${card.id}`}
                        inset
                        focus={Boolean(focusId)}
                        className={cn(
                          v36 ? "border-grey-200" : "border-grey-100",
                          worksSitting
                            ? "overflow-hidden bg-white p-0 shadow-none tablet:!p-0"
                            : "bg-white shadow-none tablet:px-8 tablet:py-6",
                        )}
                      >
                        {worksSitting ? (
                          <div className="relative">
                            {!v34 && becauseTags.length > 0 ? (
                              <BecauseBanner
                                tags={becauseTags}
                                className="rounded-none px-4 py-2.5 tablet:px-6"
                              />
                            ) : null}
                            <div className={cn("flex flex-col", v36 ? "gap-4 p-4 desktop:px-8 desktop:py-6" : "gap-3 px-4 pb-4 pt-4 tablet:px-6 tablet:pb-4")}>
                              {v34 ? null : <LmsJourneyNote />}
                              {guide}
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-3">{guide}</div>
                        )}
                      </StepInset>
                    );
                  })}
                </StepInsetList>
                {focusId && (prevCard || nextCard) ? (
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                    {prevCard ? (
                      <button
                        type="button"
                        onClick={() => focusCard(section.id, prevCard.id)}
                        className="w-fit rounded-[var(--radius-sm)] text-sm leading-[18px] font-bold text-purple-600 hover:text-purple-700 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
                      >
                        Previous: {V31_CARD_TITLE[prevCard.id] ?? prevCard.title}
                      </button>
                    ) : (
                      <span />
                    )}
                    {nextCard ? (
                      <button
                        type="button"
                        onClick={() => focusCard(section.id, nextCard.id)}
                        className="w-fit rounded-[var(--radius-sm)] text-sm leading-[18px] font-bold text-purple-600 hover:text-purple-700 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
                      >
                        Next: {V31_CARD_TITLE[nextCard.id] ?? nextCard.title}
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </StepSection>
              );
              })}
            </section>
          ))
        )}
        <div
          aria-hidden
          className="pointer-events-none h-[calc(100dvh-8.5rem)] tablet:h-0"
        />
      </div>
      </div>
      {showToTop ? (
        <div className="fixed right-4 bottom-6 z-30 tablet:right-8 tablet:bottom-8">
          <Button type="Secondary (Mono)" size="lg" aria-label="Back to top" onClick={backToTop}>
            <span
              aria-hidden
              className="block size-6 bg-grey-700"
              style={{
                WebkitMaskImage: `url("${arrowTop}")`,
                maskImage: `url("${arrowTop}")`,
                WebkitMaskSize: "contain",
                maskSize: "contain",
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
              }}
            />
          </Button>
        </div>
      ) : null}
    </div>
  );
}
