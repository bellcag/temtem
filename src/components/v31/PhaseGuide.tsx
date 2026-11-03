import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import {
  V26_GUIDE_UPDATED,
  V26_PHASES,
  type V26PhaseId,
} from "@/lib/process-v26-guide";
import { isV35Path, processV31Href, usesV35Flow, usesV36Chrome } from "@/lib/process-v31-preview";
import { v35FormatDate } from "@/lib/process-v35";
import { v35PhaseUpdatedChapter, v35PhaseUpdatedOn, v35UpdatedStepCount } from "@/lib/process-v35-updates";
import { cn } from "@/lib/utils";
import { phoneOverlayStyle, phonePanelStyle, usePhoneSheetFrame } from "@/components/dls/SheetFrame";
import { HomeSectionHeader } from "@/components/v31/HomeSectionHeader";
import caretDown from "@/assets/figma/caret-down.svg";
import exclamationAlert from "@/assets/figma/exclamation-alert.svg";
import closeIcon from "@/assets/figma/close.svg";
import processIcon from "@/assets/figma-setup/process.svg";

function PhaseIndexChip({
  index,
  selected = false,
  marked = false,
}: {
  index: number;
  selected?: boolean;
  /** A step in this phase changed recently. */
  marked?: boolean;
}) {
  const v35 = usesV35Flow(useLocation().pathname);
  if (v35) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 text-xs leading-4 font-bold uppercase tracking-[0.06em]",
          selected ? "text-purple-700" : "text-grey-500 group-hover:text-purple-700",
        )}
      >
        {marked ? (
          <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-yellow-500" />
        ) : null}
        {`Phase ${index + 1}`}
        {marked ? <span className="sr-only">, updated</span> : null}
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex h-[22px] w-fit max-w-full items-center gap-1 rounded-[var(--radius-sm)] px-2 text-[11px] leading-[14px] font-bold",
        selected
          ? "bg-purple-200 text-purple-700"
          : "bg-grey-50 text-grey-700 group-hover:bg-purple-200 group-hover:text-purple-700",
      )}
    >
      {marked ? (
        <span
          aria-hidden
          className="size-2 shrink-0 rounded-full bg-purple-600"
        />
      ) : null}
      {`Phase ${index + 1}`}
      {marked ? <span className="sr-only">, updated</span> : null}
    </span>
  );
}

/** Inputs / Selectors: Default white + grey-200 stroke. Selected and hover share purple-100 + purple-600 stroke. */
const PHASE_SELECTOR_OFF =
  "border-grey-200 bg-white hover:border-purple-600 hover:bg-purple-100";
const PHASE_SELECTOR_ON = "border-purple-600 bg-purple-100";
const PHASE_SELECTOR_FOCUS =
  "focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]";

/** One-sentence bodies from Home/Desktop/Default and Home/Mobile/Default. */
export const V31_PHASE_GLANCE: Record<V26PhaseId, string> = {
  setup: "From tenancy award to permits approved.",
  build: "From site handover to opening day.",
  operate: "Day-to-day running of the tenancy.",
  exit: "From notice of exit to full handback.",
};

function phaseHref(id: V26PhaseId, chapter?: string) {
  const first = V26_PHASES.find((phase) => phase.id === id)?.chapters[0]?.id;
  return processV31Href({ phase: id, chapter: chapter ?? first });
}

/** v31 phase headers: Set Up / Build / Operate / Exit. */
export const V31_PHASE_NAME: Record<V26PhaseId, string> = {
  setup: "Set Up",
  build: "Build",
  operate: "Operate",
  exit: "Exit",
};

function PhaseBody({
  index,
  id,
  dense = false,
  title = "lg",
  stack = false,
  selected = false,
  updatedOn,
  even = false,
}: {
  index: number;
  id: V26PhaseId;
  dense?: boolean;
  title?: "lg" | "md";
  stack?: boolean;
  selected?: boolean;
  /** v35: a step in this phase changed recently. */
  updatedOn?: string;
  /** Row of phase cards: leave the update tag off so the boxes stay even. */
  even?: boolean;
}) {
  return (
    <>
      <span
        className={cn(
          "flex min-w-0 items-baseline",
          title === "md" ? "gap-2" : "gap-3",
          stack && "flex-col items-start gap-2 tablet:flex-row tablet:items-baseline tablet:gap-2",
        )}
      >
        <span className="flex shrink-0 leading-none">
          <PhaseIndexChip index={index} selected={selected} marked={Boolean(updatedOn)} />
        </span>
        <span
          className={cn(
            "min-w-0 font-bold text-black",
            title === "md"
              ? stack
                ? "text-sm leading-[18px] tablet:text-base tablet:leading-5"
                : usesV36Chrome(useLocation().pathname)
                  ? "text-lg leading-[22px]"
                  : "text-base leading-5 desktop:text-lg desktop:leading-6"
              : "text-lg leading-6",
          )}
        >
          {V31_PHASE_NAME[id].replaceAll("-", "\u2011")}
        </span>
      </span>
      {dense ? null : (
        <span
          className={cn(
            "block text-grey-600",
            stack
              ? "mt-2 text-xs leading-4 tablet:text-sm tablet:leading-[18px]"
              : "mt-2 block text-sm leading-[18px]",
          )}
        >
          {V31_PHASE_GLANCE[id]}
        </span>
      )}
      {even ? null : updatedOn ? (
        <PhaseUpdatedTag on={updatedOn} />
      ) : null}
    </>
  );
}

/** Compact version of the journey "Requirements updated" banner. */
function PhaseUpdatedTag({
  on,
  flush = false,
}: {
  on: string;
  flush?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 w-fit items-center gap-1 rounded-full bg-yellow-100 px-2 text-xs leading-4 font-bold text-yellow-800",
        flush ? "" : "mt-2",
      )}
      title={`Requirements updated ${v35ShortDate(on)}`}
    >
      <span
        aria-hidden
        className="block size-3.5 shrink-0 bg-yellow-800"
        style={{
          WebkitMaskImage: `url("${exclamationAlert}")`,
          maskImage: `url("${exclamationAlert}")`,
          WebkitMaskSize: "contain",
          maskSize: "contain",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
        }}
      />
      Requirements updated
    </span>
  );
}

function v35ShortDate(on: string) {
  return new Date(`${on}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

export function PhaseGroupHeader({
  id,
  index,
  selected,
}: {
  id: V26PhaseId;
  index: number;
  selected: boolean;
}) {
  return (
    <header
      className={cn(
        "flex flex-col border-b px-4 py-4",
        selected
          ? "border-purple-200 bg-purple-100"
          : "border-grey-100 bg-white",
      )}
      aria-current={selected ? "true" : undefined}
    >
      <PhaseBody index={index} id={id} title="md" selected={selected} />
    </header>
  );
}

function pagerProgress(row: HTMLDivElement, align: "center" | "start") {
  const cards = [...row.querySelectorAll<HTMLElement>("[data-phase]")];
  if (cards.length === 0) return 0;
  const last = cards.length - 1;
  const targets = cards.map((card, index) => {
    if (align === "start" && index === last) {
      return Math.max(0, card.offsetLeft + card.offsetWidth - (row.clientWidth - 16));
    }
    const inset = align === "start" ? 16 : (row.clientWidth - card.offsetWidth) / 2;
    return Math.max(0, card.offsetLeft - inset);
  });
  const left = row.scrollLeft;
  if (left <= targets[0]) return 0;
  for (let index = 0; index < last; index += 1) {
    const start = targets[index];
    const end = targets[index + 1];
    if (left <= end) {
      const span = end - start || 1;
      return index + Math.min(1, Math.max(0, (left - start) / span));
    }
  }
  return last;
}

function MobilePhasePager({
  currentId,
  bleed = true,
  align = "center",
  className,
}: {
  currentId?: V26PhaseId;
  bleed?: boolean;
  /** center keeps the card in the middle. start lines the card up with the page header. */
  align?: "center" | "start";
  className?: string;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const drag = useRef({ x: 0, moved: false });
  const [progress, setProgress] = useState(() => {
    const index = V26_PHASES.findIndex((phase) => phase.id === currentId);
    return index < 0 ? 0 : index;
  });

  useEffect(() => {
    const row = scroller.current;
    if (!row) return;
    const card = row.querySelector<HTMLElement>(
      currentId ? `[data-phase="${currentId}"]` : "[data-phase]",
    );
    if (card) {
      const lastId = V26_PHASES[V26_PHASES.length - 1].id;
      const endAlign = align === "start" && card.dataset.phase === lastId;
      const inset =
        align === "start" ? 16 : (row.clientWidth - card.offsetWidth) / 2;
      const left = endAlign
        ? card.offsetLeft + card.offsetWidth - (row.clientWidth - 16)
        : card.offsetLeft - inset;
      row.scrollTo({ left: Math.max(0, left) });
    }

    const update = () => setProgress(pagerProgress(row, align));
    update();
    row.addEventListener("scroll", update, { passive: true });
    return () => row.removeEventListener("scroll", update);
  }, [align, currentId]);

  return (
    <div className={className}>
      <div
        ref={scroller}
        aria-label="Phases, swipe sideways for the others"
        onPointerDown={(event) => {
          drag.current = { x: event.clientX, moved: false };
        }}
        onPointerMove={(event) => {
          if (Math.abs(event.clientX - drag.current.x) > 8) drag.current.moved = true;
        }}
        onClickCapture={(event) => {
          if (!drag.current.moved) return;
          event.preventDefault();
          event.stopPropagation();
        }}
        className={cn(
          "flex snap-x snap-mandatory overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          bleed && "-mx-4",
          align === "start" && "scroll-pl-4 scroll-pr-4 pl-4",
        )}
      >
        {align === "center" ? <div aria-hidden className="w-[14%] shrink-0" /> : null}
        {V26_PHASES.map((phase, index) => {
          const current = phase.id === currentId;
          const last = index === V26_PHASES.length - 1;
          return (
            <Link
              key={phase.id}
              to={phaseHref(phase.id)}
              data-phase={phase.id}
              aria-current={current ? "page" : undefined}
              className={cn(
                "w-[min(15.5rem,58%)] shrink-0 rounded-[var(--radius-xl)] border px-4 py-4",
                "group",
                PHASE_SELECTOR_FOCUS,
                align === "start"
                  ? last
                    ? "snap-end"
                    : "mr-3 snap-start"
                  : "mx-1.5 snap-center",
                current ? PHASE_SELECTOR_ON : PHASE_SELECTOR_OFF,
              )}
            >
              <PhaseBody index={index} id={phase.id} selected={current} />
            </Link>
          );
        })}
        <div
          aria-hidden
          className={align === "start" ? "w-4 shrink-0" : "w-[14%] shrink-0"}
        />
      </div>
      <div
        className={cn(
          "mt-3 flex w-fit gap-1.5",
          align === "start" ? "justify-start" : "justify-center",
        )}
        aria-hidden
      >
        {V26_PHASES.map((phase, index) => {
          const distance = Math.abs(progress - index);
          const width = distance >= 1 ? 6 : 6 + (1 - distance) * 10;
          return (
            <span
              key={phase.id}
              className={cn(
                "h-1.5 rounded-full",
                distance < 0.5 ? "bg-purple-600" : "bg-grey-300",
              )}
              style={{ width }}
            />
          );
        })}
      </div>
    </div>
  );
}

function MobilePhaseDropdown({
  currentId,
  chapterTitle,
  sections,
  sectionsFor,
  onPickPhase,
}: {
  currentId: V26PhaseId;
  chapterTitle?: string;
  sections?: ReactNode;
  sectionsFor?: (id: V26PhaseId) => ReactNode;
  onPickPhase?: (id: V26PhaseId) => void;
}) {
  const [open, setOpen] = useState(false);
  const path = useLocation().pathname;
  const v35 = usesV35Flow(path);
  const v36 = usesV36Chrome(path);
  const frame = usePhoneSheetFrame();
  const titleId = useId();
  const index = Math.max(
    0,
    V26_PHASES.findIndex((phase) => phase.id === currentId),
  );

  useEffect(() => {
    setOpen(false);
  }, [currentId, chapterTitle]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <div className="desktop:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`${V31_PHASE_NAME[currentId]}${chapterTitle ? `, ${chapterTitle}` : ""}`}
        onClick={() => setOpen(true)}
        className={cn(
          "flex min-h-11 w-full items-center justify-between gap-2 border border-grey-200 bg-white px-3 py-2 text-left",
          v36 ? "rounded-[var(--radius-xl)]" : "rounded-[var(--radius-md)]",
          PHASE_SELECTOR_FOCUS,
          open && "border-purple-600",
        )}
      >
        <span className="flex min-w-0 items-baseline gap-2 text-sm leading-[18px]">
          <span className="shrink-0 font-bold uppercase text-purple-700">
            {`Phase ${index + 1}`}
          </span>
          <span className="shrink-0 font-bold text-black">{V31_PHASE_NAME[currentId]}</span>
          {chapterTitle ? (
            <>
              <span className="shrink-0 font-normal text-grey-400" aria-hidden>
                |
              </span>
              <span className="min-w-0 truncate font-normal text-grey-600">{chapterTitle}</span>
            </>
          ) : null}
        </span>
        <img
          src={caretDown}
          alt=""
          width={10}
          height={6}
          className="shrink-0"
        />
      </button>
      {open
        ? createPortal(
            <div
              className="fixed inset-0 z-[60] flex items-end justify-center"
              style={phoneOverlayStyle(v35 ? frame : null)}
            >
              <button
                type="button"
                aria-label="Close sections"
                className="absolute inset-0 bg-[rgba(18,18,18,0.4)]"
                onClick={() => setOpen(false)}
              />
              <aside
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                style={phonePanelStyle(v35 ? frame : null)}
                className="relative flex max-h-[80vh] w-full flex-col rounded-t-[var(--radius-xl)] bg-white pb-[max(16px,env(safe-area-inset-bottom))] shadow-[var(--shadow-light-bg)]"
              >
                <header className={cn("flex items-center justify-between gap-3 border-b border-grey-75", v36 ? "h-[60px] px-6" : "px-4 py-3")}>
                  <h2
                    id={titleId}
                    className="text-lg leading-[22px] font-bold text-black"
                  >
                    Sections
                  </h2>
                  <button
                    type="button"
                    aria-label="Close sections"
                    onClick={() => setOpen(false)}
                    className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-md)] text-black hover:bg-grey-50 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
                  >
                    <img src={closeIcon} alt="" width={16} height={16} />
                  </button>
                </header>
                <div
                  className="min-h-0 flex-1 overflow-y-auto"
                  onClick={(event) => {
                    if ((event.target as HTMLElement).closest("a")) {
                      setOpen(false);
                    }
                  }}
                >
                  <SheetPhaseList
                    currentId={currentId}
                    sections={sections}
                    sectionsFor={sectionsFor}
                    onPickPhase={onPickPhase}
                  />
                </div>
              </aside>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

function SheetPhaseList({
  currentId,
  sections,
  sectionsFor,
  onPickPhase,
}: {
  currentId: V26PhaseId;
  sections?: ReactNode;
  sectionsFor?: (id: V26PhaseId) => ReactNode;
  onPickPhase?: (id: V26PhaseId) => void;
}) {
  const path = useLocation().pathname;
  const v35 = usesV35Flow(path);
  const v36 = usesV36Chrome(path);
  const requirementUpdates = isV35Path(path);
  return (
    <nav aria-label="Process phases">
      <ul className={cn("flex flex-col", v36 && "gap-4")}>
        {V26_PHASES.map((phase, index) => {
          const current = phase.id === currentId;
          const block = sectionsFor
            ? sectionsFor(phase.id)
            : current
              ? sections
              : null;
          if (!block) return null;
          return (
            <li
              key={phase.id}
              className={cn(
                "flex flex-col",
                index > 0 && "border-t border-grey-100",
              )}
            >
              {!v35 ? (
                <>
                  <p className="px-4 pt-3 pb-1 text-sm leading-[18px] font-bold text-black">
                    Phase {index + 1} · {V31_PHASE_NAME[phase.id]}
                  </p>
                  {block}
                </>
              ) : (
              <>
              <div className={cn("px-4 pt-4", v36 ? "pb-3" : "pb-2")}>
                <h3 className="flex flex-wrap items-center gap-x-2 gap-y-1 text-base leading-5 font-bold text-black">
                  <PhaseIndexChip index={index} selected={current} />
                  {V31_PHASE_NAME[phase.id]}
                  {(() => {
                    const on = requirementUpdates ? v35PhaseUpdatedOn(phase.id) : undefined;
                    return on ? <PhaseUpdatedTag on={on} flush /> : null;
                  })()}
                </h3>
                <p className="mt-1 text-xs leading-4 text-grey-500">
                  {V31_PHASE_GLANCE[phase.id]}
                </p>
              </div>
              <div className="pb-2">{block}</div>
              </>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function DesktopPhaseList({
  currentId,
  sections,
  sectionsFor,
  onPickPhase,
  layout = "stack",
  roomy = false,
}: {
  currentId?: V26PhaseId;
  sections?: ReactNode;
  sectionsFor?: (id: V26PhaseId) => ReactNode;
  onPickPhase?: (id: V26PhaseId) => void;
  layout?: "stack" | "row";
  /** Home card: no sticky bar to keep short, so give the cards room below desktop. */
  roomy?: boolean;
}) {
  const path = useLocation().pathname;
  const v36 = usesV36Chrome(path);
  const requirementUpdates = isV35Path(path);
  if (roomy) {
    return (
      <nav className="grid grid-cols-2 desktop:grid-cols-4" aria-label="Process phases">
        {V26_PHASES.map((phase, index) => {
          const updatedOn = requirementUpdates ? v35PhaseUpdatedOn(phase.id) : undefined;
          return (
            <Link
              key={phase.id}
              to={phaseHref(
                phase.id,
                requirementUpdates ? v35PhaseUpdatedChapter(phase.id) : undefined,
              )}
              onClick={() => onPickPhase?.(phase.id)}
              className={cn(
                "flex min-h-16 items-start gap-2 px-4 py-3 hover:bg-grey-50",
                PHASE_SELECTOR_FOCUS,
                index % 2 === 0 && "border-r border-grey-75",
                index < 2 && "border-b border-grey-75 desktop:border-b-0",
                index > 0 && index < 3 && "desktop:border-r desktop:border-grey-75",
              )}
            >
              {updatedOn ? (
                <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-yellow-500" />
              ) : (
                <span aria-hidden className="mt-1.5 size-1.5 shrink-0" />
              )}
              <span className="min-w-0 flex-1">
                <span className="block text-sm leading-[18px] font-bold text-black">
                  {V31_PHASE_NAME[phase.id]}
                  {updatedOn ? <span className="sr-only">, updated</span> : null}
                </span>
                <span className="mt-0.5 block text-sm leading-[18px] text-grey-600">
                  {`Phase ${index + 1}: ${V31_PHASE_GLANCE[phase.id]}`}
                </span>
              </span>
            </Link>
          );
        })}
      </nav>
    );
  }
  return (
    <nav
      className={
        layout === "row"
          ? "grid grid-cols-2 items-stretch gap-1.5 desktop:grid-cols-4 desktop:gap-3"
          : "flex flex-col gap-1.5"
      }
      aria-label="Process phases"
    >
      {V26_PHASES.map((phase, index) => {
        const current = phase.id === currentId;
        const block = sectionsFor
          ? sectionsFor(phase.id)
          : current
            ? sections
            : null;
        return (
          <div
            key={phase.id}
            className={cn(
              "group flex h-full min-w-0 flex-col rounded-[var(--radius-xl)] border",
              current
                ? "border-purple-600 bg-purple-100"
                : v36
                  ? "border-grey-200 bg-white hover:border-purple-600"
                  : "border-grey-75 bg-white hover:border-purple-600",
            )}
          >
            <Link
              to={phaseHref(
                phase.id,
                requirementUpdates ? v35PhaseUpdatedChapter(phase.id) : undefined,
              )}
              aria-current={current ? "page" : undefined}
              onClick={() => onPickPhase?.(phase.id)}
              className={cn(
                "flex h-full min-w-0 flex-col px-4 py-3",
                !v36 && "desktop:py-4",
                PHASE_SELECTOR_FOCUS,
                "rounded-[calc(var(--radius-xl)-1px)]",
                block && "rounded-b-none",
              )}
            >
              <PhaseBody
                index={index}
                id={phase.id}
                title="md"
                selected={current}
                even={layout === "row"}
                updatedOn={requirementUpdates ? v35PhaseUpdatedOn(phase.id) : undefined}
              />
            </Link>
            {block ? (
              <div
                className={cn(
                  "rounded-b-[calc(var(--radius-lg)-1px)] border-t bg-white px-1.5 py-1.5 desktop:rounded-b-[calc(var(--radius-xl)-1px)] desktop:p-2",
                  current ? "border-purple-200" : "border-grey-100",
                )}
              >
                {block}
              </div>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}

export function V31PhaseCards({
  currentId,
  chapterTitle,
  swipe = false,
  compact = false,
  band = false,
  sections,
  sectionsFor,
  align = "center",
  mode = "all",
  onPickPhase,
  layout = "stack",
}: {
  currentId?: V26PhaseId;
  chapterTitle?: string;
  swipe?: boolean;
  compact?: boolean;
  band?: boolean;
  sections?: ReactNode;
  sectionsFor?: (id: V26PhaseId) => ReactNode;
  align?: "center" | "start";
  mode?: "all" | "field" | "rail";
  onPickPhase?: (id: V26PhaseId) => void;
  layout?: "stack" | "row";
}) {
  const showField = compact && currentId && mode !== "rail";
  const showRail = compact && currentId && mode !== "field";
  return (
    <>
      {showField ? (
        <MobilePhaseDropdown
          currentId={currentId}
          chapterTitle={chapterTitle}
          sections={sections}
          sectionsFor={sectionsFor}
          onPickPhase={onPickPhase}
        />
      ) : null}
      {showRail ? (
        <div className={mode === "all" ? "hidden desktop:block" : undefined}>
          <DesktopPhaseList
            currentId={currentId}
            sections={sections}
            sectionsFor={sectionsFor}
            onPickPhase={onPickPhase}
            layout={layout}
          />
        </div>
      ) : null}
      {swipe && !compact ? (
        <>
          <MobilePhasePager
            currentId={currentId}
            bleed
            align={align}
            className={band ? "desktop:hidden" : "tablet:hidden"}
          />
          {band ? (
            <div className="hidden w-full min-w-0 desktop:grid desktop:grid-cols-4 desktop:gap-3">
              {V26_PHASES.map((phase, index) => {
                const current = currentId === phase.id;
                return (
                  <Link
                    key={phase.id}
                    to={phaseHref(phase.id)}
                    aria-current={current ? "page" : undefined}
                    className={cn(
                      "group min-w-0 rounded-[var(--radius-xl)] border px-4 py-4",
                      PHASE_SELECTOR_FOCUS,
                      current ? PHASE_SELECTOR_ON : PHASE_SELECTOR_OFF,
                    )}
                  >
                    <PhaseBody index={index} id={phase.id} selected={current} />
                  </Link>
                );
              })}
            </div>
          ) : null}
        </>
      ) : null}
      <div
        className={cn(
          "w-full min-w-0 max-w-full",
          (compact || band) && "hidden",
          !compact && !band && swipe &&
            "hidden overflow-hidden rounded-[var(--radius-xl)] border border-grey-100 bg-white tablet:grid tablet:grid-cols-2",
          !compact && !band && !swipe && "grid grid-cols-4 gap-2 tablet:gap-3",
        )}
      >
        {V26_PHASES.map((phase, index) => {
          const current = currentId === phase.id;
          return (
            <Link
              key={phase.id}
              to={phaseHref(phase.id)}
              data-phase={phase.id}
              aria-current={current ? "page" : undefined}
              className={cn(
                "group focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]",
                swipe ? "min-w-0 px-4 py-4" : "min-w-0 px-2 py-3 tablet:px-4 tablet:py-4",
                swipe
                  ? cn(
                      current
                        ? "bg-purple-100 shadow-[inset_0_0_0_1px_var(--color-purple-600)]"
                        : "hover:bg-purple-100 hover:shadow-[inset_0_0_0_1px_var(--color-purple-600)]",
                      index % 2 === 0 && "border-r border-grey-200",
                      index < 2 && "border-b border-grey-200",
                    )
                  : cn(
                      "rounded-[var(--radius-md)] border",
                      current
                        ? "border-purple-600 bg-purple-100"
                        : "border-grey-200 bg-white hover:border-purple-600 hover:bg-purple-100",
                    ),
              )}
            >
              <PhaseBody index={index} id={phase.id} title={swipe ? "lg" : "md"} stack={!swipe} selected={current} />
            </Link>
          );
        })}
      </div>
    </>
  );
}

export function V31ProcessSection({
  boxed = false,
  className,
}: {
  boxed?: boolean;
  className?: string;
}) {
  const path = useLocation().pathname;
  const updatedSteps = isV35Path(path) ? v35UpdatedStepCount() : 0;
  const sectionTitle = usesV35Flow(path) ? "Tenancy Journey" : "Process";
  if (!boxed) {
    return (
      <section className={cn("mt-14 tablet:mt-16", className)}>
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 className="min-w-0">Process</h2>
          <Link
            to={processV31Href()}
            className="inline-flex h-7 shrink-0 items-center gap-1 rounded-[var(--radius-md)] border border-purple-300 bg-grey-25/10 px-2 text-sm leading-[18px] font-bold text-purple-600 hover:bg-purple-100"
          >
            View Full Process
            <span
              aria-hidden
              className="block size-4 bg-current"
              style={{
                WebkitMaskImage: `url("${caretDown}")`,
                maskImage: `url("${caretDown}")`,
                WebkitMaskSize: "10px 6px",
                maskSize: "10px 6px",
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                transform: "rotate(-90deg)",
              }}
            />
          </Link>
        </div>
        <V31PhaseCards swipe band align="start" />
      </section>
    );
  }

  return (
    <section
      className={cn(
        "flex h-full min-w-0 flex-col overflow-hidden rounded-[8px] border border-grey-100 bg-white",
        className,
      )}
    >
      <HomeSectionHeader
        icon={
          <span
            aria-hidden
            className="block bg-current"
            style={{
              width: 16,
              height: 16,
              WebkitMaskImage: `url("${processIcon}")`,
              maskImage: `url("${processIcon}")`,
              WebkitMaskSize: "contain",
              maskSize: "contain",
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
            }}
          />
        }
        title={sectionTitle}
        count={updatedSteps > 0 ? updatedSteps : undefined}
        countLabel={updatedSteps === 1 ? "step updated" : "steps updated"}
        countTone="warning"
        note={updatedSteps > 0 ? undefined : `Updated ${v35FormatDate(V26_GUIDE_UPDATED)}`}
        headerClassName={sectionTitle === "Tenancy Journey" ? "px-4 tablet:px-5" : undefined}
        titleClassName={
          sectionTitle === "Tenancy Journey"
            ? "text-base leading-5 tablet:text-lg tablet:leading-[22px]"
            : undefined
        }
        action={{ to: processV31Href(), label: "See All" }}
      />
      <DesktopPhaseList layout="row" roomy />
    </section>
  );
}
