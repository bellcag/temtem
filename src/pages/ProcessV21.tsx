import {
  Children,
  createContext,
  Fragment,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { Link, useSearchParams } from "react-router-dom";
import {
  PHASES,
  UNITS,
  type DocItem,
  type Phase,
  type PlannedWorkSlug,
  type Unit,
} from "@/lib/tenancy-data";
import { useApp, type Role } from "@/lib/app-state";
import {
  actorLabelsForSub,
  alsoHappeningText,
  cardActor,
  classifyStage,
  displayText,
  docsByIds,
  docsForStep,
  groupGuideBlocks,
  notesYouFollow,
  phasesForUnit,
  stepWhat,
  systemsVisibleToRole,
  type ClassifiedStep,
} from "@/lib/process-guide";
import { cardLead, cardTitle, lifeSgCard } from "@/lib/process-v10-copy";
import {
  copyForRole,
  groupTimings,
  timingsForStep,
  type GuideTiming,
  type RoleCopy,
  type TimingKind,
} from "@/lib/process-rules-v6";
import { splitStepDocs, verbForDoc } from "@/lib/process-v12-docs";
import { permitExplainFor } from "@/lib/process-permit-explain";
import {
  EMPTY_SUPPORTING_DOCS,
  needLabelCompact,
  supportingDocsFor,
} from "@/lib/process-permit-supporting-docs";
import {
  foldPtwPackSteps,
  PTW_PACK_HOST,
  PTW_PACK_TYPES_LABEL,
} from "@/lib/process-ptw-pack";
import {
  CONTRACTOR_JOBS,
  LS_JOB,
  LS_OUTLET,
  kickoffSoonForUnit,
} from "@/lib/process-job-context";
import {
  answerSummaryLines,
  applySlugsToQuiz,
  completeAnswers,
  confirmPlannedWorks,
  dismissSlugsFromQuiz,
  EMPTY_QUIZ,
  filterClassifiedByPlannedWorks,
  injectPlannedWorksQuiz,
  isOptionOn,
  filledDemoQuiz,
  midwayDemoQuiz,
  questionHasAnswer,
  KICKOFF_STAGE_NAME,
  KICKOFF_STEP_NAME,
  NONE_ID,
  NOT_SURE_ID,
  questionsForUnit,
  quizCanWrite,
  quizCopy,
  quizEditMode,
  quizHasSavedAnswers,
  quizHasUnanswered,
  quizIsConfirmed,
  quizNeedsOfficerGuide,
  quizPermitResult,
  quizProgress,
  quizStickyCopy,
  quizReviewRows,
  settleQuizWrite,
  unansweredReviewCount,
  type QuizEditMode,
  type QuizPermitResult,
  type QuizReviewRow,
  QUIZ_STAGE_NAME,
  QUIZ_STEP_NAME,
  readQuizState,
  slugFlags,
  stepCertainty,
  toggleQuestionOption,
  writeQuizState,
  type QuestionId,
  type QuizQuestion,
  type QuizState,
  type QuizStickyTone,
  type QuizStickyTrackStep,
  type SlugFlag,
} from "@/lib/process-planned-works-quiz";
import {
  injectLaterRenoStep,
  laterRenoNeedLine,
  LATER_RENO_CARD_FOCUS,
  LATER_RENO_NEED_FOCUS,
  LATER_RENO_NEED_ID,
  LATER_RENO_STAGE,
  LATER_RENO_STEP_NAME,
} from "@/lib/process-v21-later-reno";
import { Button } from "@/components/Button/Button";
import { DocumentPreviewDrawer } from "@/components/DocumentPreviewDrawer";
import { cn } from "@/lib/utils";
import caretDown from "@/assets/figma/caret-down.svg";
import caretUp from "@/assets/figma/caret-up.svg";
import checkIcon from "@/assets/figma/check.svg";
import closeIcon from "@/assets/figma/close.svg";
import dotIcon from "@/assets/figma/dot.svg";
import exclamationAlert from "@/assets/figma/exclamation-alert.svg";
import externalLink from "@/assets/figma/external-link.svg";
import helpQuestions from "@/assets/figma/help-questions.svg";
import infoIcon from "@/assets/figma/info.svg";
import linkIcon from "@/assets/figma/link.svg";
import pdfIcon from "@/assets/figma/pdf.svg";
import reviewsIcon from "@/assets/figma/reviews.svg";

const LS_KEY = "tempo:v17:lastPhase";

/** Runway All Caps — 12/16 Bold, Grey/400. Swimlane and section labels. */
const LABEL_CAPS =
  "text-xs leading-4 font-bold uppercase tracking-[0.08em] text-grey-400";

const TAB_LABEL: Record<Phase["id"], string> = {
  setup: "SetUp",
  build: "Build",
  operate: "Operate",
  exit: "Exit",
};

function stepDomId(stageName: string, stepName: string) {
  return `step-${stageName}-${stepName}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
}

function stepFocusKey(stageName: string, stepName: string) {
  return `${stageName}::${stepName}`;
}

const RAIL_ID = "v17-stage-topics";
const MOBILE_MQ = "(max-width: 767px)";
const DESKTOP_MQ = "(min-width: 1280px)";

function useMobileViewport() {
  const [mobile, setMobile] = useState(
    () =>
      typeof window !== "undefined" && window.matchMedia(MOBILE_MQ).matches,
  );
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ);
    const sync = () => setMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return mobile;
}

function useDesktopViewport() {
  const [desktop, setDesktop] = useState(
    () =>
      typeof window !== "undefined" && window.matchMedia(DESKTOP_MQ).matches,
  );
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_MQ);
    const sync = () => setDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return desktop;
}

function nearestScroller(el: HTMLElement | null): HTMLElement | Window {
  const main = document.querySelector("main");
  if (main instanceof HTMLElement) {
    const { overflowY } = window.getComputedStyle(main);
    if (
      (overflowY === "auto" || overflowY === "scroll") &&
      (!el || main.contains(el))
    ) {
      return main;
    }
  }
  let node: HTMLElement | null = el;
  while (node) {
    const { overflowY } = window.getComputedStyle(node);
    if (overflowY === "auto" || overflowY === "scroll") return node;
    node = node.parentElement;
  }
  return window;
}

/** Viewport line the spy treats as “here”. */
function spyReadLine() {
  const pin = railPinEl();
  if (pin) return pin.getBoundingClientRect().bottom + 8;
  const main = document.querySelector("main");
  if (main instanceof HTMLElement) {
    return Math.max(48, main.getBoundingClientRect().top + 48);
  }
  return 48;
}

function scrollYOf(scroller: HTMLElement | Window) {
  return scroller === window
    ? window.scrollY
    : (scroller as HTMLElement).scrollTop;
}

function isScrollerAtEnd(scroller: HTMLElement | Window, slop = 24) {
  if (scroller === window) {
    const doc = document.documentElement;
    return (
      window.scrollY + window.innerHeight >= doc.scrollHeight - slop
    );
  }
  const el = scroller as HTMLElement;
  return el.scrollTop + el.clientHeight >= el.scrollHeight - slop;
}

function setScrollY(
  scroller: HTMLElement | Window,
  top: number,
  behavior: ScrollBehavior,
) {
  if (scroller === window) {
    window.scrollTo({ top, behavior });
    return;
  }
  (scroller as HTMLElement).scrollTo({ top, behavior });
}

function visiblePinEl(el: HTMLElement | null): HTMLElement | null {
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  if (rect.height < 1 || rect.bottom <= 0) return null;
  return el;
}

function railPinEl(): HTMLElement | null {
  return visiblePinEl(document.getElementById("process-v21-mobile-pin"));
}

/** Pin a card just below the mobile sticky journey chrome. */
function alignCardToRail(el: HTMLElement, behavior: ScrollBehavior = "smooth") {
  const pin = railPinEl();
  const scroller = nearestScroller(el);
  const pinTop = pin ? pin.getBoundingClientRect().bottom + 16 : 32;
  const delta = el.getBoundingClientRect().top - pinTop;
  if (Math.abs(delta) < 2) return;
  setScrollY(scroller, scrollYOf(scroller) + delta, behavior);
}

/** Figma icon leaf inside a fixed outer box — do not stretch the glyph. */
function IconLeaf({
  src,
  leafW,
  leafH,
  frame = 24,
  rotate,
  colorClass,
}: {
  src: string;
  leafW: number;
  leafH: number;
  frame?: number;
  rotate?: number;
  colorClass?: string;
}) {
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center",
        colorClass,
      )}
      style={{ width: frame, height: frame }}
    >
      {colorClass ? (
        <span
          className="block bg-current"
          style={{
            width: leafW,
            height: leafH,
            transform: rotate ? `rotate(${rotate}deg)` : undefined,
            WebkitMaskImage: `url("${src}")`,
            maskImage: `url("${src}")`,
            WebkitMaskSize: "contain",
            maskSize: "contain",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            maskPosition: "center",
          }}
        />
      ) : (
        <img
          src={src}
          alt=""
          width={leafW}
          height={leafH}
          className="block max-w-none"
          style={rotate ? { transform: `rotate(${rotate}deg)` } : undefined}
        />
      )}
    </span>
  );
}

/** B2B icon-only — Icon Semi-Rounded Tertiary (Runway Buttons). */
function OverlayIconBtn({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-md)] text-black hover:bg-grey-50 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
    >
      {children}
    </button>
  );
}

function OverlayCloseGlyph() {
  return (
    <IconLeaf
      src={closeIcon}
      leafW={16}
      leafH={16}
      frame={24}
      colorClass="text-black"
    />
  );
}

function OverlayBackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 text-sm leading-[18px] font-bold text-purple-600 hover:text-purple-700 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
    >
      <IconLeaf
        src={caretDown}
        leafW={10}
        leafH={5.83}
        frame={16}
        rotate={90}
        colorClass="text-current"
      />
      Back
    </button>
  );
}

function OutlineChip({
  children,
  warn,
}: {
  children: string;
  warn?: boolean;
}) {
  if (warn) {
    return (
      <span className="inline-flex h-6 w-fit shrink-0 items-center rounded-[var(--radius-sm)] bg-warning-200 px-2 text-xs leading-4 font-bold text-warning-800">
        {children}
      </span>
    );
  }
  return (
    <span className="inline-flex h-6 w-fit shrink-0 items-center rounded-[var(--radius-sm)] border border-grey-200 bg-white px-2 text-xs leading-4 font-bold text-grey-700">
      {children}
    </span>
  );
}

function FieldSection({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 border-t border-grey-100 pt-4">
      <h4 className={LABEL_CAPS}>
        {label}
      </h4>
      {children}
    </section>
  );
}

/** Possible-apply nudge — cream panel with the fill action. */
function Banner({
  children,
  subtitle,
  hint,
  actions,
  body,
  footer,
  fold,
  tone = "warn",
  onActivate,
  activateLabel,
}: {
  children?: ReactNode;
  subtitle?: string;
  hint?: string;
  actions?: ReactNode;
  body?: ReactNode;
  footer?: ReactNode;
  fold?: boolean;
  tone?: QuizStickyTone;
  onActivate?: () => void;
  activateLabel?: string;
  /** Kept so callers can pass it. Fold always opens overlay, so it is unused. */
  defaultOpen?: boolean;
}) {
  const titleId = useId();
  const titleText = typeof children === "string" ? children : "Details";
  const faceSubtitle = hint ?? (!fold ? subtitle : undefined);
  const detailSubtitle = fold ? subtitle : undefined;
  const [open, setOpen] = useState(false);
  const overlayFold = Boolean(fold);

  const headerIcon = (
    <span
      aria-hidden
      className={cn("inline-flex shrink-0", faceSubtitle && "mt-0.5")}
    >
      <IconLeaf
        src={infoIcon}
        leafW={16}
        leafH={16}
        frame={16}
        colorClass={
          tone === "start"
            ? "text-purple-600"
            : tone === "quiet"
              ? "text-grey-600"
              : "text-warning-600"
        }
      />
    </span>
  );
  const message = children ? (
    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
      <p className="text-sm leading-[18px] font-bold text-grey-700">
        {children}
      </p>
      {faceSubtitle ? (
        <p className="text-sm leading-[18px] font-normal text-grey-600">
          {faceSubtitle}
        </p>
      ) : null}
    </div>
  ) : null;
  const surface = cn(
    "flex flex-col gap-3 rounded-[var(--radius-md)] border px-3",
    tone === "start"
      ? "border-purple-200 bg-purple-100"
      : tone === "quiet"
        ? "border-grey-100 bg-grey-50"
        : "border-warning-200 bg-warning-100",
    overlayFold ? "py-2" : "py-3",
    onActivate &&
      "w-full cursor-pointer text-left focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]",
    onActivate &&
      (tone === "start"
        ? "hover:bg-purple-200"
        : tone === "quiet"
          ? "hover:bg-grey-100"
          : "hover:bg-warning-200"),
  );
  const caret = (
    <span
      className="inline-flex size-7 shrink-0 items-center justify-center"
      aria-hidden
    >
      <IconLeaf
        src={caretDown}
        leafW={10}
        leafH={5.83}
        frame={16}
        rotate={-90}
      />
    </span>
  );
  const row = (
    <>
      {overlayFold ? (
        <button
          type="button"
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-controls={titleId}
          onClick={() => setOpen(true)}
          className="flex w-full items-center gap-2 text-left focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--color-purple-600)]"
        >
          {headerIcon}
          {message}
          {caret}
        </button>
      ) : (
        <div
          className={cn(
            "flex gap-2",
            faceSubtitle ? "items-start" : "items-center",
          )}
        >
          {headerIcon}
          {message}
          {actions ? <div className="shrink-0">{actions}</div> : null}
          {onActivate ? caret : null}
        </div>
      )}
      {overlayFold ? (
        <PermitDetailOverlay
          open={open}
          title={titleText}
          titleId={titleId}
          subtitle={detailSubtitle}
          footer={
            footer ? (
              <div onClickCapture={() => setOpen(false)}>{footer}</div>
            ) : undefined
          }
          onClose={() => setOpen(false)}
        >
          <div className="flex w-full flex-col items-stretch gap-3">
            {actions}
            {body}
          </div>
        </PermitDetailOverlay>
      ) : (
        body
      )}
    </>
  );
  if (onActivate && !overlayFold) {
    return (
      <button
        type="button"
        onClick={onActivate}
        aria-label={activateLabel}
        className={surface}
      >
        {row}
      </button>
    );
  }
  return (
    <div role="status" className={surface}>
      {row}
    </div>
  );
}

function GuideNote({ children }: { children: string }) {
  return (
    <div
      role="note"
      className="flex w-full items-start gap-2 rounded-[var(--radius-md)] border border-purple-200 bg-purple-100 px-3 py-3"
    >
      <span className="mt-0.5 inline-flex shrink-0" aria-hidden>
        <IconLeaf
          src={infoIcon}
          leafW={16}
          leafH={16}
          frame={16}
          colorClass="text-purple-600"
        />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className={LABEL_CAPS}>Note</p>
        <p className="text-sm leading-[18px] font-bold text-grey-700">
          {children}
        </p>
      </div>
    </div>
  );
}

function leadTiming(rows: GuideTiming[]) {
  return rows[0] ?? null;
}

function timingItems(rows: GuideTiming[]) {
  const { general, nested } = groupTimings(rows);
  return [
    ...general.map((row) => ({
      key: `${row.cite}-${row.duration}`,
      cite: row.cite,
      duration: row.duration,
      kind: row.kind,
      workIf: undefined as string | undefined,
    })),
    ...[...nested.entries()].flatMap(([workIf, list]) =>
      list.map((row) => ({
        key: `${workIf}-${row.cite}-${row.duration}`,
        cite: row.cite,
        workIf,
        duration: row.duration,
        kind: row.kind,
      })),
    ),
  ];
}

/**
 * When two leads share a work type (gas install vs turn-on), keep the event.
 */
const NAMED_LEAD_EVENT: Record<string, string> = {
  "gas install": "install",
  "gas turn-on": "turn-on",
};

function namedLeadEvent(duration: string): string | undefined {
  const match = duration.match(/\bbefore\s+(.+)$/i);
  return match ? NAMED_LEAD_EVENT[match[1].trim().toLowerCase()] : undefined;
}

function leadAmount(duration: string): string {
  return duration
    .replace(/\s+noisy work$/i, "")
    .replace(/\s+weekdays$/i, "")
    .replace(/\s+to replace$/i, "")
    .replace(/\s+before\s+.+$/i, "")
    .replace(/\s+before$/i, "")
    .replace(/\s+after\s+.+$/i, "")
    .replace(/\s+after$/i, "")
    .trim();
}

/**
 * Attribute chip label — 2–4 words, one line.
 * Full apply-by line stays in the title tooltip.
 */
function shortTimingLabel(
  duration: string,
  kind?: TimingKind,
  keepWhen = true,
) {
  let label = duration
    .replace(/\s+noisy work$/i, "")
    .replace(/\s+weekdays$/i, "")
    .replace(/\s+to replace$/i, "")
    .trim();
  if (kind === "lead" && /\bbefore\b/i.test(duration)) {
    const amount = leadAmount(duration);
    return keepWhen ? `${amount} before` : amount;
  }
  if (kind === "lead" && /\bafter\b/i.test(duration)) {
    const amount = leadAmount(duration);
    return keepWhen ? `${amount} after` : amount;
  }
  if (!keepWhen) {
    label = leadAmount(duration);
  }
  return label;
}

const SHORT_WORK_IF: Record<string, string> = {
  "works near Skytrain": "Skytrain",
  "T3 structured cabling": "T3 cabling",
  "fire alarm isolation or sprinkler drain": "Isolation",
  "hot work": "Hot work",
  "sprinkler A&A": "Sprinkler",
  gas: "Gas",
  "smart meter relocated": "Smart meter",
  "electrical works": "Electrical",
};

/** Chip stays 2–4 words. This line is the job. 4–10 words. */
const TIMING_TASK_LINE: Record<string, RoleCopy> = {
  "RR 3.2.21::window": {
    tenant: "Note noisy work is only 01:00–05:00.",
    contractor: "Do noisy work only 01:00–05:00.",
    officer: "Check noisy work stays 01:00–05:00.",
  },
  "RR 3.2.21::lead": {
    tenant: "Get CAG notice 3 days before noisy work.",
    contractor: "Tell CAG 3 days before noisy work.",
    officer: "Check CAG notice 3 days before noisy work.",
  },
  "RR 5.4(x)::window": {
    tenant: "Note isolation is 09:00–16:30 on weekdays.",
    contractor: "Isolate fire protection only 09:00–16:30 weekdays.",
    officer: "Check isolation stays 09:00–16:30 on weekdays.",
  },
  "RR 5.4(ix)::lead": {
    tenant: "Get 7 working days’ notice before sprinkler works.",
    contractor: "Give AES 7 working days’ notice before sprinkler works.",
    officer: "Check 7 working days’ notice before sprinkler works.",
  },
  "RR 5.5(xiii)::lead": {
    tenant: "Get 2 weeks’ notice and City Energy inspection.",
    contractor: "Give CAG 2 weeks’ notice and book City Energy.",
    officer: "Check 2 weeks’ notice and City Energy booking.",
  },
  "RR 5.5(v)::lead": {
    tenant: "Get the gas turn-on certificate 2 days before.",
    contractor: "Submit the gas turn-on certificate 2 days before.",
    officer: "Check the gas turn-on certificate 2 days before.",
  },
  "RR 3.5.4::lead": {
    tenant: "Get as-built drawings in OneCalendar 3 weeks after completion.",
    contractor: "Upload as-built drawings in OneCalendar 3 weeks after completion.",
    officer: "Check as-built drawings in OneCalendar 3 weeks after completion.",
  },
};

function timingTaskKey(cite: string, kind?: TimingKind) {
  return `${cite}::${kind ?? "lead"}`;
}

function chipTypeLabel(workIf: string | undefined, duration: string) {
  const base = workIf ? (SHORT_WORK_IF[workIf] ?? workIf) : undefined;
  const event = namedLeadEvent(duration);
  if (base && event) return `${base} ${event}`;
  return base;
}

/** Attribute chip — timing / SLA. Blue info so lead time scans. */
const CHIP_WHEN =
  "inline-flex w-fit shrink-0 items-center rounded-full border border-blue-600 bg-blue-100 px-2 py-1 text-xs leading-4 font-bold whitespace-nowrap text-blue-600";
/** Status chip — only when Planned works has not confirmed this row. */
const CHIP_MAY_APPLY =
  "inline-flex h-6 w-fit shrink-0 items-center rounded-[var(--radius-sm)] bg-warning-100 px-2 text-xs leading-4 font-bold text-warning-600";

function WhenChip({
  duration,
  workIf,
  kind,
  keepWhen,
}: {
  duration: string;
  workIf?: string;
  kind?: TimingKind;
  keepWhen?: boolean;
}) {
  const hasType = Boolean(workIf);
  const when = shortTimingLabel(duration, kind, keepWhen ?? !hasType);
  const typeLabel = chipTypeLabel(workIf, duration);
  const label = typeLabel ? `${typeLabel} · ${when}` : when;
  const full =
    kind === "lead" && /\bbefore\b/i.test(duration)
      ? `Apply in OneCalendar at least ${duration}. This is lead time to apply, not AES review time.`
      : workIf
        ? `${workIf} · ${duration}`
        : duration;
  return (
    <span title={full} className={CHIP_WHEN}>
      {label}
    </span>
  );
}

function WhenChips({ rows, role }: { rows: GuideTiming[]; role: Role }) {
  const items = timingItems(rows);
  if (items.length === 0) return null;
  const tasks = items
    .map((row) => {
      const copy = TIMING_TASK_LINE[timingTaskKey(row.cite, row.kind)];
      const line = copy ? copyForRole(copy, role) : "";
      if (!line) return null;
      return { key: `${row.key}-task`, line };
    })
    .filter((row): row is { key: string; line: string } => Boolean(row));
  const chips = items.filter(
    (row) => !TIMING_TASK_LINE[timingTaskKey(row.cite, row.kind)],
  );
  if (chips.length === 0 && tasks.length === 0) return null;
  return (
    <div className="flex flex-col gap-3">
      {chips.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {chips.map((row) => (
            <li key={row.key}>
              <WhenChip
                duration={row.duration}
                workIf={row.workIf}
                kind={row.kind}
              />
            </li>
          ))}
        </ul>
      )}
      {tasks.length > 0 && (
        <ul className="flex flex-col gap-2">
          {tasks.map((row) => (
            <li key={row.key} className="flex items-start gap-1.5">
              <span className="mt-1 shrink-0">
                <IconLeaf src={dotIcon} leafW={5.33} leafH={5.33} frame={16} />
              </span>
              <p className="min-w-0 flex-1 text-base leading-5 text-grey-600">
                {row.line}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function fileVerbLabel(doc: DocItem) {
  if (doc.externalUrl) return "Open";
  return verbForDoc(doc) === "Use as sample" ? "Sample" : verbForDoc(doc);
}

function DocFileRow({
  doc,
  stageName,
  stepName,
  highlighted,
  onPreview,
}: {
  doc: DocItem;
  stageName: string;
  stepName: string;
  highlighted?: boolean;
  onPreview: (id: string) => void;
}) {
  const external = Boolean(doc.externalUrl);
  const verb = fileVerbLabel(doc);
  const rowClass = cn(
    "group flex w-full items-start gap-2 px-3 py-2 text-left",
    "hover:bg-grey-25 focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--color-purple-600)]",
    highlighted && "bg-purple-100",
  );
  const inner = (
    <>
      <span className="mt-px shrink-0" aria-hidden>
        <IconLeaf src={pdfIcon} leafW={14} leafH={16} frame={16} />
      </span>
      <span className="min-w-0 flex-1 break-words text-sm leading-[18px] font-bold text-black group-hover:text-purple-700">
        {doc.name}
      </span>
      {external && (
        <span className="mt-px shrink-0" aria-hidden>
          <IconLeaf src={externalLink} leafW={16} leafH={16} frame={16} />
        </span>
      )}
    </>
  );
  return (
    <li className="border-t border-grey-100 first:border-t-0">
      {external && doc.externalUrl ? (
        <a
          id={fileRowDomId(stageName, stepName, doc.id)}
          href={doc.externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${verb} ${doc.name} (opens in a new tab)`}
          onClick={(e) => e.stopPropagation()}
          className={rowClass}
        >
          {inner}
        </a>
      ) : (
        <button
          type="button"
          id={fileRowDomId(stageName, stepName, doc.id)}
          onClick={(e) => {
            e.stopPropagation();
            onPreview(doc.id);
          }}
          aria-label={`${verb} ${doc.name}`}
          className={rowClass}
        >
          {inner}
        </button>
      )}
    </li>
  );
}

const DOC_PREVIEW_LIMIT = 3;

function DocTypeGroup({
  label,
  docs,
  stageName,
  stepName,
  highlightedDocId,
  onPreview,
  flush,
}: {
  label: "Guides" | "Samples";
  docs: DocItem[];
  stageName: string;
  stepName: string;
  highlightedDocId?: string | null;
  onPreview: (id: string) => void;
  flush?: boolean;
}) {
  const overflow = docs.length > DOC_PREVIEW_LIMIT;
  const hitInRest =
    Boolean(highlightedDocId) &&
    docs.slice(DOC_PREVIEW_LIMIT).some((d) => d.id === highlightedDocId);
  const [open, setOpen] = useState(hitInRest);
  useEffect(() => {
    if (hitInRest) setOpen(true);
  }, [hitInRest, highlightedDocId]);
  if (docs.length === 0) return null;
  const shown = overflow && !open ? docs.slice(0, DOC_PREVIEW_LIMIT) : docs;
  const hiddenCount = docs.length - DOC_PREVIEW_LIMIT;
  return (
    <section
      className={cn(
        "flex flex-col gap-2",
        !flush && "border-t border-grey-100 pt-4",
      )}
    >
      <h4 className={LABEL_CAPS}>
        {label}
      </h4>
      <ul className="overflow-hidden rounded-[var(--radius-md)] border border-grey-100 bg-white">
        {shown.map((d) => (
          <DocFileRow
            key={d.id}
            doc={d}
            stageName={stageName}
            stepName={stepName}
            highlighted={d.id === highlightedDocId}
            onPreview={onPreview}
          />
        ))}
        {overflow && (
          <li className="border-t border-grey-100">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpen((v) => !v);
              }}
              className="flex h-9 w-full items-center justify-center gap-1 text-sm leading-[18px] font-bold text-purple-600 hover:bg-grey-25 hover:text-purple-700 focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--color-purple-600)]"
            >
              {open ? "Show less" : `${hiddenCount} more`}
              <span className={cn("inline-flex", open && "rotate-180")}>
                <IconLeaf src={caretDown} leafW={10} leafH={5.83} frame={12} />
              </span>
            </button>
          </li>
        )}
      </ul>
    </section>
  );
}

function systemRowDomId(stageName: string, stepName: string, label: string) {
  return `system-${stepDomId(stageName, stepName)}-${label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")}`;
}

function SystemTypeGroup({
  systems,
  stageName,
  stepName,
  highlightedLabel,
}: {
  systems: { label: string }[];
  stageName: string;
  stepName: string;
  highlightedLabel?: string | null;
}) {
  if (systems.length === 0) return null;
  return (
    <section className="flex flex-col gap-2">
      <h4 className={LABEL_CAPS}>
        System links
      </h4>
      <ul className="overflow-hidden rounded-[var(--radius-md)] border border-grey-100 bg-white">
        {systems.map((s) => {
          const highlighted =
            Boolean(highlightedLabel) &&
            s.label.toLowerCase() === highlightedLabel?.toLowerCase();
          return (
            <li key={s.label} className="border-t border-grey-100 first:border-t-0">
              <Link
                id={systemRowDomId(stageName, stepName, s.label)}
                to="/apps"
                onClick={(e) => e.stopPropagation()}
                aria-label={`${s.label} (opens Apps)`}
                className={cn(
                  "group flex w-full items-start gap-2 px-3 py-2 text-left",
                  "hover:bg-grey-25 focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--color-purple-600)]",
                  highlighted && "bg-purple-100",
                )}
              >
                <span className="mt-px shrink-0" aria-hidden>
                  <IconLeaf src={linkIcon} leafW={16} leafH={16} frame={16} />
                </span>
                <span className="min-w-0 flex-1 break-words text-sm leading-[18px] font-bold text-black group-hover:text-purple-700">
                  {s.label}
                </span>
                <span className="mt-px shrink-0" aria-hidden>
                  <IconLeaf src={externalLink} leafW={16} leafH={16} frame={16} />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function BulletList({ lines }: { lines: string[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {lines.map((line) => (
        <li key={line} className="flex items-start gap-1.5">
          <span className="mt-0.5 shrink-0">
            <IconLeaf src={dotIcon} leafW={5.33} leafH={5.33} frame={16} />
          </span>
          <span className="text-sm leading-[18px] text-grey-900">{line}</span>
        </li>
      ))}
    </ul>
  );
}

function possibleCopy(mode: QuizEditMode, aligning = false) {
  if (mode === "read") {
    return aligning ? quizCopy.tenantAlignHint : quizCopy.tenantPossibleLine;
  }
  if (mode === "correct") return quizCopy.officerPossibleLine;
  return quizCopy.possibleLine;
}

function possibleChip(mode: QuizEditMode) {
  if (mode === "read") return quizCopy.tenantPossibleChip;
  if (mode === "correct") return quizCopy.officerPossibleChip;
  return quizCopy.possibleChip;
}

function possibleChipHint(mode: QuizEditMode, aligning = false) {
  if (mode === "read") {
    return aligning
      ? quizCopy.tenantAlignHint
      : quizCopy.tenantPossibleChipHint;
  }
  if (mode === "correct") return quizCopy.officerPossibleChipHint;
  return quizCopy.possibleChipHint;
}

function partyKey(labels?: string[]) {
  return (labels ?? []).join(" · ");
}

function groupByParty<T extends { labels?: string[] }>(rows: T[]) {
  const groups: { key: string; labels: string[]; rows: T[] }[] = [];
  for (const row of rows) {
    const key = partyKey(row.labels);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.rows.push(row);
    else groups.push({ key, labels: row.labels ?? [], rows: [row] });
  }
  return groups;
}

function GuideBullet({
  line,
  size = "body",
}: {
  line: string;
  size?: "body" | "how";
}) {
  return (
    <li className="flex items-start gap-1.5">
      <span className={size === "body" ? "mt-1 shrink-0" : "mt-0.5 shrink-0"}>
        <IconLeaf src={dotIcon} leafW={5.33} leafH={5.33} frame={16} />
      </span>
      <p
        className={
          size === "body"
            ? "min-w-0 flex-1 text-base leading-5 text-grey-600"
            : "min-w-0 flex-1 text-sm leading-[18px] text-grey-900"
        }
      >
        {line}
      </p>
    </li>
  );
}

function PartyHead({ labels }: { labels: string[] }) {
  const mine = labels.length === 1 && labels[0] === "You";
  return (
    <p
      className={cn(
        LABEL_CAPS,
        mine && "text-purple-700",
        "flex items-center gap-1",
      )}
    >
      {labels.map((label, i) => (
        <Fragment key={`${i}-${label}`}>
          {i > 0 && (
            <span aria-hidden className="inline-flex shrink-0">
              <IconLeaf
                src={dotIcon}
                leafW={5.33}
                leafH={5.33}
                frame={8}
                colorClass={mine ? "text-purple-700" : "text-grey-400"}
              />
            </span>
          )}
          <span>{label}</span>
        </Fragment>
      ))}
    </p>
  );
}

function PartyLineList({
  rows,
  size = "body",
}: {
  rows: { line: string; labels?: string[] }[];
  size?: "body" | "how";
}) {
  const groups = groupByParty(rows);
  const showHeads = groups.some((group) => group.labels.length > 0);
  return (
    <div className={showHeads ? "flex flex-col gap-4" : undefined}>
      {groups.map((group, gi) => (
        <div
          key={`${gi}-${group.key}`}
          className={cn(
            "flex flex-col gap-2",
            showHeads &&
              group.labels.length > 0 &&
              cn(
                "rounded-[var(--radius-md)] px-3 py-3",
                group.labels.length === 1 && group.labels[0] === "You"
                  ? "bg-purple-100"
                  : "bg-grey-50",
              ),
          )}
        >
          {showHeads && group.labels.length > 0 && (
            <PartyHead labels={group.labels} />
          )}
          <ul
            className={
              size === "how" ? "flex flex-col gap-3" : "flex flex-col gap-2"
            }
          >
            {group.rows.map((row, i) => (
              <GuideBullet
                key={`${i}-${row.line}`}
                line={row.line}
                size={size}
              />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}


function WorksPip({ on, warn }: { on: boolean; warn: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      className={cn(
        "size-3 shrink-0",
        warn
          ? "text-warning-600"
          : on
            ? "text-purple-600"
            : "text-purple-300",
      )}
      aria-hidden
    >
      {on ? (
        <circle cx="6" cy="6" r="6" fill="currentColor" />
      ) : (
        <circle
          cx="6"
          cy="6"
          r="5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
      )}
    </svg>
  );
}

/** Runway Tooltip — Dark Card on Light Mode. */
function DlsTooltip({
  id,
  open,
  side = "bottom",
  align = "center",
  anchorRef,
  children,
}: {
  id: string;
  open: boolean;
  side?: "top" | "bottom";
  align?: "center" | "end";
  anchorRef?: RefObject<HTMLElement | null>;
  children: string;
}) {
  const [box, setBox] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    tipW: number;
    above: boolean;
    arrowOffset: number;
  } | null>(null);

  useLayoutEffect(() => {
    if (!open || !anchorRef?.current) {
      setBox(null);
      return;
    }
    const place = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const ar = anchor.getBoundingClientRect();
      const pad = 8;
      const gap = 8;
      const tipW = Math.min(240, window.innerWidth - pad * 2);
      const guessH = 88;
      const spaceAbove = ar.top - pad;
      const spaceBelow = window.innerHeight - ar.bottom - pad;
      const above =
        side === "top"
          ? spaceAbove >= guessH || spaceAbove >= spaceBelow
          : spaceBelow >= guessH || spaceBelow > spaceAbove;
      let left =
        align === "end" ? ar.right - tipW : ar.left + ar.width / 2 - tipW / 2;
      left = Math.min(Math.max(left, pad), window.innerWidth - tipW - pad);
      const iconMid = ar.left + ar.width / 2;
      const arrowOffset = Math.min(Math.max(iconMid - left, 12), tipW - 12);
      setBox(
        above
          ? {
              bottom: window.innerHeight - ar.top + gap,
              left,
              tipW,
              above,
              arrowOffset,
            }
          : { top: ar.bottom + gap, left, tipW, above, arrowOffset },
      );
    };
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open, side, align, anchorRef, children]);

  const above = box?.above ?? side === "top";
  const end = align === "end";
  const portaled = Boolean(open && box && anchorRef);

  const node = (
    <span
      id={id}
      role="tooltip"
      style={
        portaled
          ? {
              position: "fixed",
              top: box.top,
              bottom: box.bottom,
              left: box.left,
              width: box.tipW,
            }
          : undefined
      }
      className={cn(
        "pointer-events-none z-50 w-max max-w-[min(240px,calc(100vw-2rem))]",
        !portaled && "absolute",
        !portaled && (end ? "right-0" : "left-1/2 -translate-x-1/2"),
        !portaled && (above ? "bottom-[calc(100%+8px)]" : "top-[calc(100%+8px)]"),
        "rounded-[var(--radius-sm)] bg-black px-3 py-2",
        "text-xs leading-4 font-normal text-white",
        "shadow-[var(--shadow-light-bg)]",
        open ? "block" : "hidden",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute size-2 rotate-45 bg-black",
          above ? "-bottom-1" : "-top-1",
          !portaled && (end ? "right-1.5" : "left-1/2 -translate-x-1/2"),
        )}
        style={
          portaled
            ? { left: box.arrowOffset, transform: "translateX(-50%) rotate(45deg)" }
            : undefined
        }
      />
      {children}
    </span>
  );

  if (portaled) return createPortal(node, document.body);
  return node;
}

function MayApplyChip({ label, hint }: { label: string; hint: string }) {
  const tipId = useId();
  return (
    <span className="group relative inline-flex">
      <span
        tabIndex={0}
        aria-label={`${label}. ${hint}`}
        aria-describedby={tipId}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          CHIP_MAY_APPLY,
          "gap-1 cursor-help focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]",
        )}
      >
        {label}
        <span aria-hidden className="inline-flex shrink-0">
          <IconLeaf
            src={infoIcon}
            leafW={12}
            leafH={12}
            frame={12}
            colorClass="text-warning-600"
          />
        </span>
      </span>
      <span
        id={tipId}
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-[calc(100%+8px)] z-30 hidden w-max max-w-[min(240px,calc(100vw-2rem))] -translate-x-1/2 rounded-[var(--radius-sm)] bg-black px-3 py-2 text-xs leading-4 font-normal text-white shadow-[var(--shadow-light-bg)] group-hover:block group-focus-within:block"
      >
        <span
          aria-hidden
          className="absolute -top-1 left-1/2 size-2 -translate-x-1/2 rotate-45 bg-black"
        />
        {hint}
      </span>
    </span>
  );
}

function SetupTrack({ steps }: { steps: QuizStickyTrackStep[] }) {
  return (
    <ol className="flex w-full min-w-0 items-start" aria-label="SetUp to permit">
      {steps.map((step, i) => (
        <li
          key={step.label}
          className={cn(
            "flex min-w-0 items-start",
            i < steps.length - 1 ? "flex-1" : "shrink-0",
          )}
        >
          <span className="flex min-w-0 flex-col items-center gap-1">
            <WorksPip on={step.state !== "ahead"} warn={false} />
            <span
              className={cn(
                "text-xs leading-4",
                step.state === "ahead"
                  ? "font-normal text-grey-500"
                  : "font-bold text-purple-700",
              )}
            >
              {step.label}
            </span>
          </span>
          {i < steps.length - 1 ? (
            <span
              className={cn(
                "mt-1.5 h-0.5 min-w-3 flex-1",
                step.state === "done" ? "bg-purple-600" : "bg-grey-200",
              )}
              aria-hidden
            />
          ) : null}
        </li>
      ))}
    </ol>
  );
}

function WorksSticky({
  title,
  subtitle,
  cta,
  answered = 0,
  total = 0,
  track,
  tip,
  onOpen,
}: {
  title: string;
  subtitle: string;
  cta: string;
  answered?: number;
  total?: number;
  track?: QuizStickyTrackStep[];
  tip?: string;
  onOpen: () => void;
}) {
  const tipId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const tipAnchorRef = useRef<HTMLSpanElement>(null);
  const mobile = useMobileViewport();
  const [tipOn, setTipOn] = useState(false);
  const pipCount = Math.max(total, 1);
  const fraction = `${answered}/${pipCount}`;
  const milestone = Boolean(track && track.length > 0);
  const finished = !milestone && total > 0 && answered >= total;
  const midway = !milestone && !finished && answered > 0;

  useEffect(() => {
    if (!tipOn) return;
    const onDoc = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setTipOn(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setTipOn(false);
    };
    window.addEventListener("pointerdown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [tipOn]);

  const infoColor = midway ? "text-warning-600" : "text-purple-700";
  const caretColor = midway ? "text-warning-600" : "text-purple-700";
  const countColor = midway ? "text-warning-800" : "text-purple-700";

  return (
    <div ref={rootRef} className={cn("relative", tipOn && "z-20")}>
      <div
        className={cn(
          "relative flex w-full items-center rounded-[var(--radius-2xl)] shadow-[var(--shadow-light-bg)]",
          milestone
            ? "min-h-[76px] gap-3 px-4 py-4 desktop:gap-4 desktop:p-4 border border-grey-200 bg-white hover:bg-grey-50"
            : finished
              ? "min-h-[76px] gap-3 px-4 py-3 desktop:gap-4 desktop:p-4 bg-purple-100 hover:bg-purple-200"
              : midway
                ? "h-16 gap-4 px-4 py-3 bg-warning-100 hover:bg-warning-200"
                : "quiz-sticky-idle h-16 gap-4 px-4 py-3 hover:brightness-[0.97]",
        )}
      >
        <button
          type="button"
          onClick={onOpen}
          aria-label={
            milestone
              ? `${title}. ${subtitle} ${cta}.`
              : `${title}. ${subtitle} ${cta}. ${fraction} answered.`
          }
          className="absolute inset-0 z-0 rounded-[var(--radius-2xl)] focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
        />
        {milestone ? null : (
        <span className="pointer-events-none relative inline-flex size-9 shrink-0 items-center justify-center" aria-hidden>
          {finished ? (
            <IconLeaf
              src={checkIcon}
              leafW={36}
              leafH={36}
              frame={36}
              colorClass="text-purple-700"
            />
          ) : midway ? (
            <IconLeaf
              src={exclamationAlert}
              leafW={36}
              leafH={36}
              frame={36}
              colorClass="text-warning-700"
            />
          ) : (
            <IconLeaf
              src={reviewsIcon}
              leafW={30}
              leafH={25.51}
              frame={36}
              colorClass="text-purple-600"
            />
          )}
        </span>
        )}
        <span
          className={cn(
            "pointer-events-none relative flex min-w-0 flex-1 flex-col",
            milestone ? "gap-3" : "gap-1",
          )}
        >
          <span
            className={cn(
              "inline-flex max-w-full items-center",
              finished || milestone ? "gap-1.5" : "gap-1",
            )}
          >
            <span className="min-w-0 truncate text-sm leading-[18px] font-bold text-black">
              {title}
            </span>
            <span ref={tipAnchorRef} className="relative shrink-0">
            <button
              type="button"
              aria-label="What this is for"
              aria-expanded={tipOn}
              aria-describedby={tipOn ? tipId : undefined}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setTipOn((on) => !on);
              }}
              onMouseEnter={() => {
                if (!mobile) setTipOn(true);
              }}
              onMouseLeave={() => {
                if (!mobile) setTipOn(false);
              }}
              onFocus={() => {
                if (!mobile) setTipOn(true);
              }}
              onBlur={() => {
                if (!mobile) setTipOn(false);
              }}
              className="pointer-events-auto relative z-10 inline-flex shrink-0 appearance-none bg-transparent p-0 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
            >
              <span aria-hidden className="inline-flex shrink-0">
                <IconLeaf
                  src={helpQuestions}
                  leafW={16}
                  leafH={16}
                  frame={16}
                  colorClass={infoColor}
                />
              </span>
            </button>
              <DlsTooltip
                id={tipId}
                open={tipOn}
                side="top"
                align="end"
                anchorRef={tipAnchorRef}
              >
                {tip ?? quizCopy.stickyIntro}
              </DlsTooltip>
            </span>
          </span>
          {milestone && track ? (
            <span className="flex flex-col gap-4">
              <span className="text-xs leading-4 text-grey-700">{subtitle}</span>
              <SetupTrack steps={track} />
            </span>
          ) : (
          <span className="flex items-center gap-2" aria-hidden>
            <span className="flex items-center gap-1.5">
              {Array.from({ length: pipCount }, (_, i) => (
                <WorksPip key={i} on={i < answered} warn={midway} />
              ))}
            </span>
            <span className={cn("text-sm leading-[18px] font-bold", countColor)}>
              {fraction}
            </span>
          </span>
          )}
        </span>
        <span
          className={cn(
            "pointer-events-none relative grid size-6 shrink-0 place-items-center",
            caretColor,
          )}
          aria-hidden
        >
          <IconLeaf
            src={caretDown}
            leafW={12}
            leafH={7}
            frame={24}
            rotate={-90}
            colorClass={caretColor}
          />
        </span>
      </div>
    </div>
  );
}

function PhaseTabStrip({
  phases,
  activeId,
  browsing,
  disabled,
  onSelect,
  onReselectActive,
}: {
  phases: Phase[];
  activeId: Phase["id"];
  browsing: boolean;
  disabled?: boolean;
  onSelect: (id: Phase["id"]) => void;
  onReselectActive?: () => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Phase"
      className="flex w-full items-center gap-1 rounded-[var(--radius-xl)] border border-grey-200 bg-grey-50 p-1 tablet:w-fit desktop:w-full"
    >
      {phases.map((phase) => {
        const on = browsing && phase.id === activeId;
        return (
          <button
            key={phase.id}
            type="button"
            role="tab"
            aria-selected={on}
            disabled={disabled}
            onClick={() =>
              on && browsing ? onReselectActive?.() : onSelect(phase.id)
            }
            className={cn(
              "inline-flex h-9 min-w-0 flex-1 items-center justify-center rounded-[var(--radius-md)] px-2 text-sm leading-[18px] text-grey-700 tablet:flex-none tablet:px-3 desktop:min-w-0 desktop:flex-1 desktop:px-2",
              on &&
                "bg-white font-bold text-grey-700 shadow-[0px_1px_3px_rgba(18,18,18,0.1),0px_1px_2px_rgba(18,18,18,0.06)]",
              disabled && "text-grey-300",
            )}
          >
            {TAB_LABEL[phase.id] ?? phase.name}
          </button>
        );
      })}
    </div>
  );
}

function PlannedWorksSheet({
  open,
  questions,
  state,
  onToggle,
  onSave,
  onClose,
  allowUnsure = true,
}: {
  open: boolean;
  questions: QuizQuestion[];
  state: QuizState;
  onToggle: (questionId: QuestionId, optionId: string) => void;
  onSave: () => void;
  onClose: () => void;
  allowUnsure?: boolean;
}) {
  const mobile = useMobileViewport();
  const [page, setPage] = useState(0);
  const lastPage = Math.max(questions.length - 1, 0);

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

  useEffect(() => {
    if (!open) return;
    const firstOpen = questions.findIndex((question) => {
      const answer = state.answers[question.id];
      if (!questionHasAnswer(answer)) return true;
      return !allowUnsure && answer?.kind === "not-sure";
    });
    setPage(firstOpen === -1 ? 0 : firstOpen);
    // Only when the sheet opens — not when the officer changes an answer.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- open edge
  }, [open]);

  if (!open) return null;

  const pageLabel = `${Math.min(page + 1, questions.length)} of ${questions.length}`;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex",
        mobile
          ? "items-end justify-end"
          : "items-center justify-center p-6 tablet:p-8",
      )}
    >
      <button
        type="button"
        aria-label="Close planned works"
        className="absolute inset-0 bg-[rgba(18,18,18,0.4)]"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="planned-works-sheet-title"
        className={cn(
          "relative flex w-full flex-col bg-white shadow-[var(--shadow-light-bg)]",
          mobile
            ? "max-h-[90vh] rounded-t-[var(--radius-2xl)] border-t border-grey-100"
            : "max-h-[80vh] max-w-xl rounded-[var(--radius-2xl)]",
        )}
      >
        <header className="flex items-start justify-between gap-3 border-b border-grey-75 px-4 py-4 tablet:px-5">
          <div className="min-w-0">
            <h2
              id="planned-works-sheet-title"
              className="text-lg leading-[22px] font-bold text-black"
            >
              {quizCopy.sheetTitle}
            </h2>
            <p className="mt-1 text-sm leading-[18px] text-grey-700">
              {quizCopy.bannerContractor}
            </p>
          </div>
          <OverlayIconBtn label="Close" onClick={onClose}>
            <OverlayCloseGlyph />
          </OverlayIconBtn>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 tablet:px-5">
          <PlannedWorksForm
            questions={questions.slice(page, page + 1)}
            state={state}
            onToggle={onToggle}
            allowUnsure={allowUnsure}
          />
          <p className="mt-4 text-sm leading-[18px] text-grey-700">
            {quizCopy.pauseHint}
          </p>
        </div>
        <footer className="flex flex-col gap-3 border-t border-grey-75 px-4 py-3 tablet:px-5">
          {questions.length > 0 && (
            <div className="flex items-center justify-between gap-3">
              {page > 0 ? (
                <GuideCta
                  tone="text"
                  className="min-h-10 min-w-12 px-1"
                  onClick={() => setPage((i) => i - 1)}
                >
                  Back
                </GuideCta>
              ) : (
                <span className="min-w-12" />
              )}
              <p
                className="inline-flex h-5 min-w-0 items-center rounded-full bg-purple-100 px-2 text-xs leading-4 font-normal text-purple-600"
                aria-live="polite"
              >
                {pageLabel}
              </p>
              {page < lastPage ? (
                <GuideCta
                  tone="text"
                  className="min-h-10 min-w-12 px-1"
                  onClick={() => setPage((i) => i + 1)}
                >
                  Next
                </GuideCta>
              ) : (
                <span className="min-w-12" />
              )}
            </div>
          )}
          <div
            className={cn("flex gap-2", mobile ? "flex-col" : "flex-row")}
          >
            <GuideCta
              tone="ghost"
              className={cn("h-10 min-h-10 w-full px-4", !mobile && "flex-1")}
              onClick={onClose}
            >
              {quizCopy.officerCancelCta}
            </GuideCta>
            <GuideCta
              className={cn("h-10 min-h-10 w-full px-4", !mobile && "flex-1")}
              onClick={onSave}
            >
              {quizCopy.sheetSaveCta}
            </GuideCta>
          </div>
        </footer>
      </aside>
    </div>
  );
}

function OfficerEditGate({
  open,
  onConfirm,
  onClose,
}: {
  open: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const mobile = useMobileViewport();

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

  if (!open) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[60] flex",
        mobile
          ? "items-end justify-end"
          : "items-center justify-center p-6 tablet:p-8",
      )}
    >
      <button
        type="button"
        aria-label="Close edit check"
        className="absolute inset-0 bg-[rgba(18,18,18,0.4)]"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="officer-edit-gate-title"
        aria-describedby="officer-edit-gate-body"
        className={cn(
          "relative flex w-full flex-col bg-white shadow-[var(--shadow-light-bg)]",
          mobile
            ? "rounded-t-[var(--radius-2xl)] border-t border-grey-100"
            : "max-w-md rounded-[var(--radius-2xl)]",
        )}
      >
        <header className="flex items-start justify-between gap-3 border-b border-grey-75 px-4 py-4 tablet:px-5">
          <h2
            id="officer-edit-gate-title"
            className="min-w-0 text-lg leading-[22px] font-bold text-black"
          >
            {quizCopy.officerEditGateTitle}
          </h2>
          <OverlayIconBtn label="Close" onClick={onClose}>
            <OverlayCloseGlyph />
          </OverlayIconBtn>
        </header>
        <div className="px-4 py-4 tablet:px-5">
          <p
            id="officer-edit-gate-body"
            className="text-sm leading-[18px] text-grey-700"
          >
            {quizCopy.officerEditGateBody}
          </p>
        </div>
        <footer className="flex flex-col gap-3 border-t border-grey-75 px-4 py-3 tablet:px-5 tablet:flex-row tablet:justify-end">
          <GuideCta
            tone="ghost"
            className="h-10 min-h-10 w-full px-4 tablet:w-fit"
            onClick={onClose}
          >
            {quizCopy.officerEditGateCancel}
          </GuideCta>
          <GuideCta
            className="h-10 min-h-10 w-full px-4 tablet:w-fit"
            onClick={onConfirm}
          >
            {quizCopy.officerEditGateCta}
          </GuideCta>
        </footer>
      </aside>
    </div>
  );
}

function OfficerConfirmRows({ rows }: { rows: QuizReviewRow[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {rows.map((row) => {
        const open = row.flag === "unanswered" || row.flag === "not-sure";
        return (
          <li
            key={row.questionId}
            className="flex flex-col gap-0.5 border-b border-grey-75 pb-3 last:border-0 last:pb-0"
          >
            <p className="text-sm leading-[18px] font-bold text-grey-700">
              {row.topic}
            </p>
            <p
              className={cn(
                "text-sm leading-[18px]",
                open ? "font-bold text-warning-700" : "text-grey-700",
              )}
            >
              {row.detail}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

function OfficerConfirmSheet({
  open,
  rows,
  onClose,
  onEdit,
  onConfirm,
  onBlocked,
}: {
  open: boolean;
  rows: QuizReviewRow[];
  onClose: () => void;
  onEdit: () => void;
  onConfirm: () => void;
  onBlocked: () => void;
}) {
  const mobile = useMobileViewport();
  const openCount = unansweredReviewCount(rows);
  const canLock = openCount === 0;

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

  if (!open) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex",
        mobile
          ? "items-end justify-end"
          : "items-center justify-center p-6 tablet:p-8",
      )}
    >
      <button
        type="button"
        aria-label="Close confirm answers"
        className="absolute inset-0 bg-[rgba(18,18,18,0.4)]"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="officer-confirm-sheet-title"
        className={cn(
          "relative flex w-full flex-col bg-white shadow-[var(--shadow-light-bg)]",
          mobile
            ? "max-h-[90vh] rounded-t-[var(--radius-2xl)] border-t border-grey-100"
            : "max-h-[80vh] max-w-xl rounded-[var(--radius-2xl)]",
        )}
      >
        <header className="flex items-start justify-between gap-3 border-b border-grey-75 px-4 py-4 tablet:px-5">
          <h2
            id="officer-confirm-sheet-title"
            className="min-w-0 text-lg leading-[22px] font-bold text-black"
          >
            {quizCopy.officerConfirmSheetTitle}
          </h2>
          <OverlayIconBtn label="Close" onClick={onClose}>
            <OverlayCloseGlyph />
          </OverlayIconBtn>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 tablet:px-5">
          <div className="flex flex-col gap-4">
            {openCount > 0 ? (
              <Banner
                tone="warn"
                hint={quizCopy.officerBlockedHint}
                onActivate={onBlocked}
                activateLabel={quizCopy.officerBlockedTitle(openCount)}
              >
                {quizCopy.officerBlockedTitle(openCount)}
              </Banner>
            ) : null}
            <OfficerConfirmRows rows={rows} />
          </div>
        </div>
        <footer
          className={cn(
            "flex gap-2 border-t border-grey-75 px-4 py-3 tablet:px-5",
            mobile ? "flex-col" : "flex-row",
          )}
        >
          <GuideCta
            tone="ghost"
            className={cn("h-10 min-h-10 w-full px-4", !mobile && "flex-1")}
            onClick={onEdit}
          >
            {quizCopy.officerEditCta}
          </GuideCta>
          <GuideCta
            className={cn(
              "h-10 min-h-10 w-full px-4",
              !mobile && "flex-1",
              !canLock && "opacity-40",
            )}
            onClick={canLock ? onConfirm : onBlocked}
          >
            {quizCopy.officerConfirmCta}
          </GuideCta>
        </footer>
      </aside>
    </div>
  );
}

function OfficerLockGate({
  open,
  openCount,
  onClose,
  onEdit,
}: {
  open: boolean;
  openCount: number;
  onClose: () => void;
  onEdit: () => void;
}) {
  const mobile = useMobileViewport();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[60] flex",
        mobile
          ? "items-end justify-end"
          : "items-center justify-center p-6 tablet:p-8",
      )}
    >
      <button
        type="button"
        aria-label="Close open items gate"
        className="absolute inset-0 bg-[rgba(18,18,18,0.4)]"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="officer-lock-gate-title"
        aria-describedby="officer-lock-gate-body"
        className={cn(
          "relative flex w-full flex-col bg-white shadow-[var(--shadow-light-bg)]",
          mobile
            ? "rounded-t-[var(--radius-2xl)] border-t border-grey-100"
            : "max-w-md rounded-[var(--radius-2xl)]",
        )}
      >
        <header className="flex items-start justify-between gap-3 border-b border-grey-75 px-4 py-4 tablet:px-5">
          <h2
            id="officer-lock-gate-title"
            className="min-w-0 text-lg leading-[22px] font-bold text-black"
          >
            {quizCopy.officerGateTitle}
          </h2>
          <OverlayIconBtn label="Close" onClick={onClose}>
            <OverlayCloseGlyph />
          </OverlayIconBtn>
        </header>
        <div className="px-4 py-4 tablet:px-5">
          <p
            id="officer-lock-gate-body"
            className="text-sm leading-[18px] text-grey-700"
          >
            {quizCopy.officerGateBody(openCount)}
          </p>
        </div>
        <footer
          className={cn(
            "flex gap-2 border-t border-grey-75 px-4 py-3 tablet:px-5",
            mobile ? "flex-col" : "flex-row",
          )}
        >
          <GuideCta
            tone="ghost"
            className={cn("h-10 min-h-10 w-full px-4", !mobile && "flex-1")}
            onClick={onClose}
          >
            {quizCopy.officerCancelCta}
          </GuideCta>
          <GuideCta
            className={cn("h-10 min-h-10 w-full px-4", !mobile && "flex-1")}
            onClick={onEdit}
          >
            {quizCopy.officerGateEdit}
          </GuideCta>
        </footer>
      </aside>
    </div>
  );
}

function OfficerLockToast({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(onClose, 6000);
    return () => window.clearTimeout(t);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="status"
      className="fixed top-4 right-4 z-[70] flex max-w-sm items-start gap-3 rounded-[var(--radius-md)] border border-success-600/20 bg-success-100 px-3 py-3 shadow-[var(--shadow-light-bg)]"
    >
      <span className="inline-flex size-6 shrink-0 items-center justify-center" aria-hidden>
        <IconLeaf
          src={checkIcon}
          leafW={16}
          leafH={16}
          frame={16}
          colorClass="text-success-600"
        />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-[18px] font-bold text-grey-700">
          {quizCopy.officerLockSuccessTitle}
        </p>
        <p className="text-sm leading-[18px] text-grey-600">
          {quizCopy.officerLockSuccessBody}
        </p>
      </div>
      <OverlayIconBtn label="Dismiss" onClick={onClose}>
        <OverlayCloseGlyph />
      </OverlayIconBtn>
    </div>
  );
}

function PermitExplainStep({
  n,
  children,
  note,
}: {
  n: number;
  children: ReactNode;
  note?: ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <span
        aria-hidden
        className="grid size-6 shrink-0 place-items-center rounded-full bg-purple-200 text-xs leading-4 font-bold text-purple-700"
      >
        {n}
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-sm leading-[18px] text-black">{children}</p>
        {note ? (
          <p className="mt-2 inline-flex max-w-full rounded-full bg-purple-100 px-3 py-1 text-sm leading-[18px] text-purple-700">
            {note}
          </p>
        ) : null}
      </div>
    </li>
  );
}

function PermitExplainBody({
  name,
  unit,
  role,
  stageName,
  stepName,
  highlightedDocId,
  onPreview,
  action,
  timing,
}: {
  name: string;
  unit: Unit;
  role: Role;
  stageName: string;
  stepName: string;
  highlightedDocId?: string | null;
  onPreview: (id: string) => void;
  action?: string;
  timing?: ReactNode;
}) {
  const explain = permitExplainFor(name);
  const supporting = supportingDocsFor(name);
  const samples = useMemo(
    () =>
      explain
        ? docsByIds(
            explain.sampleDocIds,
            unit.tenancyType,
            unit.terminal,
            unit.zone,
          )
        : [],
    [explain, unit],
  );
  if (!explain) return null;
  const other = explain.otherTerminals?.(unit) ?? null;
  const why = explain.why(unit);
  return (
    <div className="flex flex-col gap-4">
      {(action || timing) && (
        <div className="flex items-start gap-2 rounded-[var(--radius-md)] border border-purple-200 bg-purple-100 px-3 py-3">
          <span className="mt-0.5 inline-flex shrink-0" aria-hidden>
            <IconLeaf
              src={infoIcon}
              leafW={16}
              leafH={16}
              frame={16}
              colorClass="text-purple-600"
            />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            {timing}
            {action && (
              <p className="text-sm leading-[18px] text-grey-700">{action}</p>
            )}
          </div>
        </div>
      )}
      <ol className="flex list-none flex-col gap-4">
        <PermitExplainStep n={1} note={why || undefined}>
          <span className="font-bold">{explain.what}</span>
        </PermitExplainStep>
        <PermitExplainStep n={2}>
          {explain.who[role]}
        </PermitExplainStep>
        {other ? (
          <PermitExplainStep n={3}>{other}</PermitExplainStep>
        ) : null}
      </ol>
      <FieldSection
        label={
          supporting.docs.length > 0
            ? `Supporting documents · ${supporting.docs.length}`
            : "Supporting documents"
        }
      >
        {supporting.unmatched && (
          <p className="text-sm leading-[18px] text-grey-700">
            {supporting.unmatched}
          </p>
        )}
        {supporting.ifmNote && (
          <p className="text-sm leading-[18px] text-grey-700">
            {supporting.ifmNote}
          </p>
        )}
        {supporting.docs.length === 0 ? (
          <p className="text-sm leading-[18px] text-grey-600">
            {EMPTY_SUPPORTING_DOCS}
          </p>
        ) : (
          <ol className="flex list-none flex-col gap-2 text-sm leading-[18px] text-black">
            {supporting.docs.map((doc) => (
              <li key={doc.name} className="flex items-center gap-1.5">
                <span className="font-bold">{doc.name}</span>
                <span className="inline-flex shrink-0" aria-hidden>
                  <IconLeaf
                    src={dotIcon}
                    leafW={5.33}
                    leafH={5.33}
                    frame={16}
                  />
                </span>
                <span className="text-grey-600">
                  {needLabelCompact(doc.need)}
                </span>
              </li>
            ))}
          </ol>
        )}
      </FieldSection>
      {samples.length > 0 && (
        <FieldSection label="Samples">
          <ul className="overflow-hidden rounded-[var(--radius-md)] border border-grey-200 bg-white">
            {samples.map((doc) => (
              <DocFileRow
                key={doc.id}
                doc={doc}
                stageName={stageName}
                stepName={stepName}
                highlighted={doc.id === highlightedDocId}
                onPreview={onPreview}
              />
            ))}
          </ul>
        </FieldSection>
      )}
    </div>
  );
}

type OverlayDrillPage = {
  title: string;
  badge?: string;
  badgeHint?: string;
  body: ReactNode;
};

const OverlayDrillContext = createContext<{
  push: (page: OverlayDrillPage) => void;
} | null>(null);

function PermitDetailOverlay({
  open,
  title,
  titleId,
  subtitle,
  badge,
  badgeHint,
  footer,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  titleId: string;
  subtitle?: string;
  badge?: string;
  badgeHint?: string;
  footer?: ReactNode;
  onClose: () => void;
  children: ReactNode;
}) {
  const desktop = useDesktopViewport();
  const subId = useId();
  const [drill, setDrill] = useState<OverlayDrillPage | null>(null);
  const shownTitle = drill?.title ?? title;
  const shownSubtitle = drill ? undefined : subtitle;
  const shownBadge = drill ? drill.badge : badge;
  const shownHint = drill ? drill.badgeHint : badgeHint;

  useEffect(() => {
    if (!open) setDrill(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (drill) setDrill(null);
      else onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose, drill]);
  if (!open) return null;
  return (
    <OverlayDrillContext.Provider value={{ push: setDrill }}>
      <div
        className={cn(
          "fixed inset-0 z-50 flex",
          desktop ? "items-center justify-center p-8" : "items-end",
        )}
      >
        <button
          type="button"
          aria-label={`Close ${shownTitle}`}
          className="absolute inset-0 bg-[rgba(18,18,18,0.4)]"
          onClick={onClose}
        />
        <aside
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={shownSubtitle ? subId : undefined}
          className={cn(
            "relative flex w-full flex-col bg-white shadow-[var(--shadow-light-bg)]",
            desktop
              ? "max-h-[80vh] max-w-xl rounded-[var(--radius-2xl)]"
              : "max-h-[90vh] rounded-t-[var(--radius-2xl)] border-t border-grey-100",
          )}
        >
          <header className="flex items-start justify-between gap-2 border-b border-grey-75 px-4 py-4 tablet:px-5">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  id={titleId}
                  className="text-lg leading-[22px] font-bold text-black"
                >
                  {shownTitle}
                </h2>
                {shownBadge && (
                  <MayApplyChip
                    label={shownBadge}
                    hint={shownHint ?? quizCopy.possibleChipHint}
                  />
                )}
              </div>
              {shownSubtitle ? (
                <p
                  id={subId}
                  className="mt-1 text-sm leading-[18px] font-normal text-grey-600"
                >
                  {shownSubtitle}
                </p>
              ) : null}
            </div>
            <OverlayIconBtn label="Close" onClick={onClose}>
              <OverlayCloseGlyph />
            </OverlayIconBtn>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 tablet:px-5">
            {drill ? (
              <div className="flex flex-col items-start gap-4">
                <OverlayBackBtn onClick={() => setDrill(null)} />
                {drill.body}
              </div>
            ) : (
              children
            )}
          </div>
          {footer && !drill ? (
            <footer className="border-t border-grey-75 px-4 py-3 tablet:px-5">
              {footer}
            </footer>
          ) : null}
        </aside>
      </div>
    </OverlayDrillContext.Provider>
  );
}

function PermitPackRow({
  member,
  stageName,
  role,
  unit,
  highlighted,
  highlightDocId,
  timing,
  possible,
  possibleLabel,
  onPreview,
}: {
  member: ClassifiedStep;
  stageName: string;
  role: Role;
  unit: Unit;
  highlighted: boolean;
  highlightDocId?: string | null;
  timing?: Pick<GuideTiming, "duration" | "kind">;
  possible: boolean;
  possibleLabel: string;
  onPreview: (id: string) => void;
}) {
  const title = cardTitle(role, stageName, member.step.name);
  const explain = permitExplainFor(member.step.name) ?? permitExplainFor(title);
  const titleId = useId();
  const drill = useContext(OverlayDrillContext);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (highlighted && !drill) setOpen(true);
  }, [highlighted, drill]);
  const what = stepWhat(member.step, role);
  const timingRow = timing ? (
    <WhenChip duration={timing.duration} kind={timing.kind} />
  ) : null;
  const explainBody = (
    <PermitExplainBody
      name={member.step.name}
      unit={unit}
      role={role}
      stageName={stageName}
      stepName={member.step.name}
      highlightedDocId={highlightDocId}
      onPreview={onPreview}
      action={what}
      timing={timingRow}
    />
  );
  const openDetail = () => {
    if (drill) {
      drill.push({
        title,
        badge: possible ? possibleLabel : undefined,
        badgeHint: possible
          ? possibleChipHint(quizEditMode(role))
          : undefined,
        body: explainBody,
      });
      return;
    }
    setOpen(true);
  };
  return (
    <li
      id={stepDomId(stageName, member.step.name)}
      className={cn(
        "border-t border-grey-100 first:border-t-0",
        highlighted && "bg-purple-100",
      )}
    >
      {explain ? (
        <button
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={openDetail}
          className="flex w-full items-center gap-2 px-3 py-2.5 text-left hover:bg-grey-50 focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--color-purple-600)]"
        >
          <span className="min-w-0 flex-1 text-sm leading-[18px] font-bold text-black">
            {title}
          </span>
          {possible && (
            <MayApplyChip
              label={possibleLabel}
              hint={possibleChipHint(quizEditMode(role))}
            />
          )}
          <span className="inline-flex shrink-0 text-grey-500" aria-hidden>
            <IconLeaf
              src={caretDown}
              leafW={10}
              leafH={5.83}
              frame={16}
              rotate={-90}
              colorClass="text-grey-500"
            />
          </span>
        </button>
      ) : (
        <div className="flex items-center gap-2 px-3 py-2.5">
          <p className="min-w-0 flex-1 text-sm leading-[18px] font-bold text-black">
            {title}
          </p>
          {possible && (
            <MayApplyChip
              label={possibleLabel}
              hint={possibleChipHint(quizEditMode(role))}
            />
          )}
        </div>
      )}
      {explain && !drill && (
        <PermitDetailOverlay
          open={open}
          title={title}
          titleId={titleId}
          badge={possible ? possibleLabel : undefined}
          badgeHint={
            possible ? possibleChipHint(quizEditMode(role)) : undefined
          }
          onClose={() => setOpen(false)}
        >
          {explainBody}
        </PermitDetailOverlay>
      )}
    </li>
  );
}

function PermitNameRow({
  name,
  unit,
  role,
  stageName,
  highlightedDocId,
  onPreview,
  badge,
}: {
  name: string;
  unit: Unit;
  role: Role;
  stageName: string;
  highlightedDocId?: string | null;
  onPreview: (id: string) => void;
  badge?: string;
}) {
  const explain = permitExplainFor(name);
  const titleId = useId();
  const drill = useContext(OverlayDrillContext);
  const [open, setOpen] = useState(false);
  const explainBody = (
    <PermitExplainBody
      name={name}
      unit={unit}
      role={role}
      stageName={stageName}
      stepName={name}
      highlightedDocId={highlightedDocId}
      onPreview={onPreview}
    />
  );
  const openDetail = () => {
    if (drill) {
      drill.push({ title: name, body: explainBody });
      return;
    }
    setOpen(true);
  };
  return (
    <li className="border-t border-grey-100 first:border-t-0">
      {explain ? (
        <button
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={openDetail}
          className="flex w-full min-w-0 items-center gap-2 px-3 py-2.5 text-left hover:bg-grey-50 focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--color-purple-600)]"
        >
          <span className="min-w-0 flex-1 text-sm leading-[18px] font-bold text-black">
            {name}
          </span>
          {badge && (
            <span className="inline-flex h-6 shrink-0 items-center rounded-[var(--radius-sm)] border border-grey-200 px-1.5 text-xs leading-4 font-bold text-grey-700">
              {badge}
            </span>
          )}
          <span className="inline-flex shrink-0 text-grey-500" aria-hidden>
            <IconLeaf
              src={caretDown}
              leafW={10}
              leafH={5.83}
              frame={16}
              rotate={-90}
              colorClass="text-grey-500"
            />
          </span>
        </button>
      ) : (
        <div className="flex min-w-0 items-center gap-2 px-3 py-2.5">
          <span className="min-w-0 flex-1 text-sm leading-[18px] font-bold text-black">
            {name}
          </span>
          {badge && (
            <span className="inline-flex h-6 shrink-0 items-center rounded-[var(--radius-sm)] border border-grey-200 px-1.5 text-xs leading-4 font-bold text-grey-700">
              {badge}
            </span>
          )}
        </div>
      )}
      {explain && !drill && (
        <PermitDetailOverlay
          open={open}
          title={name}
          titleId={titleId}
          onClose={() => setOpen(false)}
        >
          {explainBody}
        </PermitDetailOverlay>
      )}
    </li>
  );
}

function permitListCaveat(role: Role, confirmed: boolean) {
  if (confirmed) {
    if (role === "tenant") return quizCopy.confirmedCaveatTenant;
    if (role === "contractor") return quizCopy.confirmedCaveatContractor;
    return quizCopy.confirmedCaveatOfficer;
  }
  if (role === "tenant") return "Check this at the first site meeting.";
  if (role === "contractor") return "Confirm these before you go on site.";
  return quizCopy.resultsCaveat;
}

function PermitList({
  result,
  unit,
  role,
  stageName,
  highlightedDocId,
  onPreview,
}: {
  result: QuizPermitResult;
  unit: Unit;
  role: Role;
  stageName: string;
  highlightedDocId?: string | null;
  onPreview: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <ul className="overflow-hidden rounded-[var(--radius-md)] border border-grey-100 bg-white">
        <PermitNameRow
          name={result.main}
          unit={unit}
          role={role}
          stageName={stageName}
          highlightedDocId={highlightedDocId}
          onPreview={onPreview}
          badge={quizCopy.alwaysNeededChip}
        />
        {result.extras.map((name) => (
          <PermitNameRow
            key={name}
            name={name}
            unit={unit}
            role={role}
            stageName={stageName}
            highlightedDocId={highlightedDocId}
            onPreview={onPreview}
          />
        ))}
      </ul>
      <p className="text-sm leading-[18px] text-grey-600">
        {result.extras.length > 0
          ? permitListCaveat(role, result.confirmed)
          : quizCopy.resultsMainOnly}
      </p>
    </div>
  );
}

function ScreenerCta({
  role,
  className,
}: {
  role: Role;
  className?: string;
}) {
  const label =
    role === "contractor"
      ? quizCopy.screenerCtaContractor
      : role === "tenant"
        ? quizCopy.screenerCtaTenant
        : quizCopy.screenerCtaOfficer;
  return (
    <Link
      to="/screener/drafts"
      className={cn(
        "inline-flex w-fit shrink-0 items-center justify-center text-sm leading-[18px] font-bold focus-visible:outline-none",
        "h-8 rounded-[var(--radius-sm)] border border-purple-600 bg-white px-3 text-purple-600 hover:bg-purple-100 focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]",
        className,
      )}
    >
      {label}
    </Link>
  );
}

function ScreenerPrepBanner() {
  const tipId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const mobile = useMobileViewport();
  const [tipOn, setTipOn] = useState(false);

  useEffect(() => {
    if (!tipOn) return;
    const onDoc = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setTipOn(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setTipOn(false);
    };
    window.addEventListener("pointerdown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [tipOn]);

  return (
    <div
      ref={rootRef}
      role="status"
      className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-purple-200 bg-purple-100 px-3 py-3"
    >
      <div className="flex min-w-0 flex-1 items-start gap-2">
        <button
          type="button"
          aria-label="What this step is for"
          aria-expanded={tipOn}
          aria-describedby={tipOn ? tipId : undefined}
          onClick={() => {
            if (mobile) setTipOn((on) => !on);
          }}
          onMouseEnter={() => {
            if (!mobile) setTipOn(true);
          }}
          onMouseLeave={() => {
            if (!mobile) setTipOn(false);
          }}
          onFocus={() => {
            if (!mobile) setTipOn(true);
          }}
          onBlur={() => {
            if (!mobile) setTipOn(false);
          }}
          className="relative mt-0.5 inline-flex shrink-0 appearance-none bg-transparent p-0 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
        >
          <span aria-hidden className="inline-flex shrink-0">
            <IconLeaf
              src={infoIcon}
              leafW={16}
              leafH={16}
              frame={16}
              colorClass="text-purple-600"
            />
          </span>
          <DlsTooltip id={tipId} open={tipOn}>
            {quizCopy.screenerTipContractor}
          </DlsTooltip>
        </button>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="text-sm leading-[18px] font-bold text-grey-700">
            {quizCopy.screenerBannerTitle}
          </p>
          <p className="text-sm leading-[18px] font-normal text-grey-600">
            {quizCopy.screenerBannerSub}
          </p>
        </div>
      </div>
      <ScreenerCta role="contractor" className="w-full" />
    </div>
  );
}

function GuideCta({
  children,
  onClick,
  tone = "primary",
  className,
}: {
  children: string;
  onClick: () => void;
  tone?: "primary" | "ghost" | "text";
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "inline-flex w-fit shrink-0 items-center justify-center text-sm leading-[18px] font-bold focus-visible:outline-none",
        tone === "text"
          ? "h-auto bg-transparent px-0 text-purple-600 hover:text-purple-700 focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
          : tone === "ghost"
            ? "h-8 rounded-[var(--radius-sm)] border border-purple-600 bg-white px-3 text-purple-600 hover:bg-purple-100 focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
            : "h-8 rounded-[var(--radius-sm)] bg-purple-600 px-3 text-white hover:bg-purple-700 focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]",
        className,
      )}
    >
      {children}
    </button>
  );
}

function OfficerQuizActions({
  confirmed,
  onConfirm,
  onEdit,
}: {
  confirmed: boolean;
  onConfirm: () => void;
  onEdit: () => void;
}) {
  if (confirmed) {
    return (
      <div className="flex flex-col gap-2 tablet:flex-row tablet:flex-wrap tablet:items-center">
        <GuideCta className="w-full tablet:w-fit" onClick={onEdit}>
          {quizCopy.officerUpdateCta}
        </GuideCta>
        <ScreenerCta role="officer" className="w-full tablet:w-fit" />
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2 tablet:flex-row tablet:flex-wrap tablet:items-center">
      <GuideCta className="w-full tablet:w-fit" onClick={onConfirm}>
        {quizCopy.officerConfirmCta}
      </GuideCta>
      <GuideCta className="w-full tablet:w-fit" tone="ghost" onClick={onEdit}>
        {quizCopy.officerEditCta}
      </GuideCta>
    </div>
  );
}

function OfficerConfirmBanner({
  title,
  confirmed,
  children,
  onConfirm,
  onEdit,
}: {
  title: string;
  confirmed: boolean;
  children: ReactNode;
  onConfirm: () => void;
  onEdit: () => void;
}) {
  const actions = (
    <OfficerQuizActions
      confirmed={confirmed}
      onConfirm={onConfirm}
      onEdit={onEdit}
    />
  );
  return (
    <Banner
      tone={confirmed ? "quiet" : "start"}
      fold
      footer={actions}
      body={<div className="flex w-full flex-col gap-4">{children}</div>}
    >
      {title}
    </Banner>
  );
}

function CheckRow({
  label,
  on,
  onToggle,
  exclusive,
}: {
  label: string;
  on: boolean;
  onToggle: () => void;
  exclusive?: boolean;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={on}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={cn(
        "flex w-full cursor-pointer items-center gap-3 px-3 py-4 text-left",
        "border-t border-grey-100 first:border-t-0",
        on && "bg-purple-100",
        exclusive && "bg-grey-25",
        exclusive && on && "bg-purple-100",
      )}
    >
      <span
        className={cn(
          "grid size-4 shrink-0 place-items-center rounded-[var(--radius-sm)] border",
          on ? "border-purple-600 bg-purple-600" : "border-grey-300 bg-white",
        )}
        aria-hidden
      >
        {on && (
          <span className="block h-1.5 w-2.5 -translate-y-px rotate-[-45deg] border-b-2 border-l-2 border-white" />
        )}
      </span>
      <span
        className={cn(
          "min-w-0 flex-1 text-sm leading-[18px] font-bold",
          exclusive ? "text-grey-700" : "text-black",
        )}
      >
        {label}
      </span>
    </button>
  );
}

function reviewDetailBits(detail: string) {
  return detail
    .split(/\s*;\s*/)
    .map((bit) => bit.trim())
    .filter(Boolean);
}

function QuizReviewLines({ row }: { row: QuizReviewRow }) {
  const open = row.flag === "not-sure" || row.flag === "unanswered";
  const bits = reviewDetailBits(row.detail);
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <p className="text-xs leading-4 font-bold uppercase tracking-[0.08em] text-grey-600">
        {row.topic}
      </p>
      {open ? (
        <span
          className="inline-flex h-6 w-fit max-w-full shrink-0 items-center rounded-[var(--radius-sm)] bg-warning-200 px-2 text-xs leading-4 font-bold text-warning-800"
        >
          {row.detail}
        </span>
      ) : bits.length > 1 ? (
        <ul className="flex flex-col gap-1.5">
          {bits.map((bit) => (
            <li key={bit} className="flex items-start gap-1.5">
              <span className="mt-0.5 shrink-0" aria-hidden>
                <IconLeaf src={dotIcon} leafW={5.33} leafH={5.33} frame={16} />
              </span>
              <p className="min-w-0 text-sm leading-[18px] text-black">{bit}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="min-w-0 text-sm leading-[18px] font-bold break-words text-black">
          {row.detail}
        </p>
      )}
    </div>
  );
}

function QuizReviewCard({
  row,
  children,
}: {
  row: QuizReviewRow;
  children?: ReactNode;
}) {
  return (
    <li className="flex w-full flex-col gap-3 rounded-[var(--radius-md)] border border-grey-100 bg-grey-50 px-3 py-3">
      <QuizReviewLines row={row} />
      {children}
    </li>
  );
}

function QuizAnswerReview({ rows }: { rows: QuizReviewRow[] }) {
  return (
    <ul className="flex w-full flex-col gap-3">
      {rows.map((row) => (
        <QuizReviewCard key={row.questionId} row={row} />
      ))}
    </ul>
  );
}

function QuizWorksLink({
  rows,
  role,
  unit,
  stageName,
  confirmed,
  extrasHint,
  actions,
  highlightedDocId,
  onPreview,
}: {
  rows: QuizReviewRow[];
  role: Role;
  unit: Unit;
  stageName: string;
  confirmed: boolean;
  extrasHint?: string;
  actions?: ReactNode;
  highlightedDocId?: string | null;
  onPreview: (id: string) => void;
}) {
  const extraBadge = confirmed ? undefined : quizCopy.possibleApplyChip;
  const hasExtras = rows.some((row) => row.permits.length > 0);
  const stillOpen = unansweredReviewCount(rows) > 0;
  const extrasLead =
    extrasHint ??
    (confirmed
      ? role === "contractor"
        ? quizCopy.contractorLockedLine
        : role === "tenant"
          ? quizCopy.confirmedCaveatTenant
          : quizCopy.linkedLeadOfficer
      : role === "contractor" && stillOpen
        ? null
        : hasExtras && role !== "contractor"
          ? role === "officer"
            ? quizCopy.linkedLeadOfficer
            : quizCopy.linkedLeadTenant
          : quizCopy.extrasHow[role]);
  const foot = confirmed
    ? role === "officer"
      ? quizCopy.officerUpdateNote
      : hasExtras
        ? permitListCaveat(role, true)
        : quizCopy.resultsMainOnly
    : hasExtras
      ? permitListCaveat(role, false)
      : stillOpen
        ? null
        : quizCopy.resultsMainOnly;
  return (
    <div className="flex flex-col gap-4">
      {extrasLead && (
        <p className="text-sm leading-[18px] text-grey-800">{extrasLead}</p>
      )}
      <ul className="flex flex-col gap-3">
        {rows.map((row) => (
          <QuizReviewCard key={row.questionId} row={row}>
            {row.permits.length > 0 ? (
              <ul className="overflow-hidden rounded-[var(--radius-md)] border border-grey-100 bg-white">
                {row.permits.map((name) => (
                  <PermitNameRow
                    key={name}
                    name={name}
                    unit={unit}
                    role={role}
                    stageName={stageName}
                    highlightedDocId={highlightedDocId}
                    onPreview={onPreview}
                    badge={extraBadge}
                  />
                ))}
              </ul>
            ) : null}
          </QuizReviewCard>
        ))}
      </ul>
      {foot && <GuideNote>{foot}</GuideNote>}
      {Children.toArray(actions).length > 0 && (
        <div className="border-t border-grey-200 pt-4">{actions}</div>
      )}
    </div>
  );
}

function PlannedWorksForm({
  questions,
  state,
  onToggle,
  allowUnsure = true,
}: {
  questions: QuizQuestion[];
  state: QuizState;
  onToggle: (questionId: QuestionId, optionId: string) => void;
  allowUnsure?: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      {questions.map((question) => {
        const answer = state.answers?.[question.id] ?? { kind: "unanswered" };
        return (
          <div key={question.id} className="flex flex-col gap-3">
            <p className="text-base leading-5 font-bold text-black">
              {question.prompt}
            </p>
            <div className="flex flex-col overflow-hidden rounded-[var(--radius-md)] border border-grey-200 bg-white">
              {question.options.map((opt) => (
                <CheckRow
                  key={opt.id}
                  label={opt.label}
                  on={isOptionOn(answer, opt.id)}
                  onToggle={() => onToggle(question.id, opt.id)}
                />
              ))}
              <CheckRow
                label="None of these"
                exclusive
                on={isOptionOn(answer, NONE_ID)}
                onToggle={() => onToggle(question.id, NONE_ID)}
              />
              {allowUnsure && (
                <CheckRow
                  label="Not sure yet"
                  exclusive
                  on={isOptionOn(answer, NOT_SURE_ID)}
                  onToggle={() => onToggle(question.id, NOT_SURE_ID)}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Existing copy names that already point at a pack system. */
const SYSTEM_ALIASES: Record<string, string[]> = {
  OneCalendar: ["OneCalendar", "OneCal 3.0", "OneCal"],
  "Point of Sales": [
    "Point of Sales",
    "Point of Sale",
    "point of sale",
    "point-of-sale",
  ],
  SharePoint: ["SharePoint", "Sharepoint"],
};

/** Real pack systems to inline. Channels and record labels stay off the subheader. */
const PACK_SYSTEM_LABELS = [
  "OneCalendar",
  "TOPAZ",
  "Access Control & Scheduling System",
  "Salesforce",
  "Changi Rewards",
  "iShopChangi",
  "ONE Changi App",
  "Quality Service Management",
  "WebEpic",
  "Point of Sales",
  "Lease Management System",
  "Airport Pass In Changi",
  "Tenant Fire Safety Declaration Portal",
  "Tenant Fire Safety Portal",
  "OneDrive",
  "Newforma",
  "SharePoint",
  "Key Management System",
  "Procurement",
  "Customer Discovery Insights",
  "Tenant Directory Taxonomy",
] as const;

function mergeSystems(
  ...lists: { label: string }[][]
): { label: string }[] {
  const seen = new Set<string>();
  const out: { label: string }[] = [];
  for (const list of lists) {
    for (const item of list) {
      const key = item.label.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(item);
    }
  }
  return out;
}

function packSystemsNamedIn(text: string, role: Role): { label: string }[] {
  const found = PACK_SYSTEM_LABELS.filter((label) =>
    systemNamedIn(text, label),
  ).map((label) => ({ label }));
  return systemsVisibleToRole(found, role);
}

function needlesForSystem(label: string): string[] {
  const key = Object.keys(SYSTEM_ALIASES).find(
    (name) => name.toLowerCase() === label.toLowerCase(),
  );
  return [...(key ? SYSTEM_ALIASES[key] : [label])].sort(
    (a, b) => b.length - a.length,
  );
}

function systemNamedIn(text: string, label: string): boolean {
  const lower = text.toLowerCase();
  return needlesForSystem(label).some((needle) =>
    lower.includes(needle.toLowerCase()),
  );
}

function fileRowDomId(stageName: string, stepName: string, docId: string) {
  return `file-${stepDomId(stageName, stepName)}-${docId}`;
}

type JourneyItem = {
  stageName: string;
  classified: ClassifiedStep;
  packMembers?: ClassifiedStep[];
};

/** After lock: unknown is not agreed — hide unless a listed slug is on. */
function filterStepsForPlannedWorks(
  steps: ClassifiedStep[],
  flags: Record<PlannedWorkSlug, SlugFlag> | null,
  locked: boolean,
) {
  if (!flags) return steps;
  if (!locked) return filterClassifiedByPlannedWorks(steps, flags);
  return steps.filter((row) => {
    const slugs = row.step.whenSlugs;
    if (!slugs || slugs.length === 0) return true;
    return slugs.some((slug) => flags[slug] === "on");
  });
}

function blocksForPhase(
  phase: Phase,
  role: Role,
  unit: Unit,
  showQuiz: boolean,
  flags: Record<PlannedWorkSlug, SlugFlag> | null,
  locked = false,
) {
  const blocks = phase.stages
    .map((stage) => {
      const { steps } = classifyStage(stage, role, unit);
      return {
        stage,
        steps: filterStepsForPlannedWorks(steps, flags, locked),
      };
    })
    .filter((b) => b.steps.length > 0);
  return injectPlannedWorksQuiz(blocks, role, showQuiz);
}

function LaterRenoNeedLine({ role }: { role: Role }) {
  return (
    <p
      id={LATER_RENO_NEED_ID}
      className="scroll-mt-[8rem] px-1 py-2 text-sm leading-[18px] text-grey-700 tablet:scroll-mt-[6rem] desktop:scroll-mt-8"
    >
      {laterRenoNeedLine(role)}
    </p>
  );
}

export function ProcessV21Page() {
  const {
    role,
    unit,
    setUnit,
    units,
    effectiveUnit,
    isUnscoped,
    setOfficerSelection,
  } = useApp();
  const [params, setSearchParams] = useSearchParams();
  const isOfficer = role === "officer";
  const isContractor = role === "contractor";
  const isTenant = role === "tenant";

  const phaseFromUrl = params.get("phase") as Phase["id"] | null;
  const [focusedStep, setFocusedStep] = useState<string | null>(null);
  const [previewDocId, setPreviewDocId] = useState<string | null>(null);
  const [jobId, setJobId] = useState(CONTRACTOR_JOBS[0].id);
  const [quiz, setQuiz] = useState<QuizState>(EMPTY_QUIZ);
  const [officerDraft, setOfficerDraft] = useState<QuizState | null>(null);
  const [quizSheetOpen, setQuizSheetOpen] = useState(false);
  const [officerEditGateOpen, setOfficerEditGateOpen] = useState(false);
  const [officerConfirmOpen, setOfficerConfirmOpen] = useState(false);
  const [officerLockGateOpen, setOfficerLockGateOpen] = useState(false);
  const [officerLockToastOpen, setOfficerLockToastOpen] = useState(false);
  const [showToTop, setShowToTop] = useState(false);
  const returnToConfirm = useRef(false);
  const isMobile = useMobileViewport();

  const spyLock = useRef(false);
  const pendingStageScroll = useRef<{
    stageName: string;
    stepName: string;
  } | null>(null);
  const railRef = useRef<HTMLElement | null>(null);

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
    if (phaseFromUrl && PHASES.some((p) => p.id === phaseFromUrl)) {
      window.localStorage.setItem(LS_KEY, phaseFromUrl);
    }
  }, [phaseFromUrl]);

  const activeJob =
    CONTRACTOR_JOBS.find((j) => j.id === jobId) ?? CONTRACTOR_JOBS[0];

  const ctxUnit: Unit = useMemo(() => {
    if (isContractor) return activeJob.unit;
    if (isOfficer) return effectiveUnit ?? unit;
    return unit;
  }, [isContractor, isOfficer, activeJob, effectiveUnit, unit]);

  const needsContext = isOfficer && isUnscoped;
  const showQuiz =
    !needsContext && (role !== "contractor" || activeJob.appointed);

  useEffect(() => {
    if (!showQuiz) {
      setQuiz(EMPTY_QUIZ);
      setOfficerDraft(null);
      return;
    }
    const demoMidway = params.get("demo") === "quiz-midway";
    const demoFilled = params.get("demo") === "quiz-done";
    const saved = demoFilled
      ? filledDemoQuiz()
      : demoMidway
        ? midwayDemoQuiz()
        : readQuizState(ctxUnit.id);
    if (demoMidway || demoFilled) writeQuizState(ctxUnit.id, saved);
    if (
      role === "officer" &&
      saved.status === "editing" &&
      quizHasSavedAnswers(saved)
    ) {
      const closed: QuizState = {
        ...saved,
        status: "done",
        answers: completeAnswers(saved.answers),
      };
      setQuiz(closed);
      writeQuizState(ctxUnit.id, closed);
    } else {
      setQuiz(saved);
    }
    setOfficerDraft(null);
  }, [showQuiz, ctxUnit.id, role, params]);

  const selectPhase = (id: Phase["id"]) => {
    setSearchParams({ phase: id });
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

  const persistQuiz = (next: QuizState) => {
    if (!quizCanWrite(role, quiz)) return;
    const answers = completeAnswers(next.answers);
    const empty = !quizHasSavedAnswers({ ...next, answers });
    const safe: QuizState = {
      status: empty ? "idle" : next.status,
      answers,
      confirmed:
        role === "officer" && !empty ? Boolean(next.confirmed) : false,
    };
    setQuiz(safe);
    writeQuizState(ctxUnit.id, safe);
  };

  const openOfficerDraft = () => {
    setOfficerDraft({
      status: "editing",
      answers: completeAnswers(quiz.answers),
      confirmed: quiz.confirmed,
    });
  };

  const quizQuestions = useMemo(
    () => (showQuiz ? questionsForUnit(ctxUnit) : []),
    [showQuiz, ctxUnit],
  );
  const quizSummary = useMemo(
    () => (showQuiz ? answerSummaryLines(quiz, ctxUnit) : []),
    [showQuiz, quiz, ctxUnit],
  );
  const plannedFlags = useMemo(
    () => (showQuiz ? slugFlags(quiz, ctxUnit) : null),
    [showQuiz, quiz, ctxUnit],
  );

  const visiblePhases = useMemo(
    () => (needsContext ? PHASES : phasesForUnit(ctxUnit)),
    [needsContext, ctxUnit],
  );

  const savedPhase =
    typeof window !== "undefined"
      ? (window.localStorage.getItem(LS_KEY) as Phase["id"] | null)
      : null;

  const active =
    visiblePhases.find((p) => p.id === phaseFromUrl) ??
    visiblePhases.find((p) => p.id === savedPhase) ??
    visiblePhases[0] ??
    PHASES[0];

  const browsingPhase = true;

  useEffect(() => {
    if (phaseFromUrl === active.id) return;
    setSearchParams({ phase: active.id }, { replace: true });
    window.localStorage.setItem(LS_KEY, active.id);
  }, [phaseFromUrl, active.id, setSearchParams]);

  const worksProgress = quizProgress(quiz, ctxUnit);
  const showWorksSticky =
    isContractor &&
    showQuiz &&
    browsingPhase &&
    !needsContext &&
    !quizIsConfirmed(quiz);
  const pinWorksSticky =
    showWorksSticky && worksProgress.answered < worksProgress.total;

  const worksSticky = quizStickyCopy(quiz, ctxUnit, role);

  useEffect(() => {
    const main = document.querySelector("main");
    if (!(main instanceof HTMLElement)) return;
    const stickyChrome = browsingPhase && !needsContext;
    if (!isMobile) return;
    main.style.scrollPaddingTop = stickyChrome
      ? pinWorksSticky
        ? "8rem"
        : "5rem"
      : "3.5rem";
    return () => {
      main.style.scrollPaddingTop = "";
    };
  }, [browsingPhase, needsContext, isMobile, pinWorksSticky]);

  useLayoutEffect(() => {
    const el = railRef.current;
    if (!el) return;
    const fit = () => {
      requestAnimationFrame(() => {
        if (getComputedStyle(el).display === "none") {
          el.style.height = "";
          el.style.maxHeight = "";
          return;
        }
        const top = Math.max(0, el.getBoundingClientRect().top);
        const bottomGap = 24;
        const viewH = window.visualViewport?.height ?? window.innerHeight;
        const h = `${Math.max(256, viewH - top - bottomGap)}px`;
        el.style.height = h;
        el.style.maxHeight = h;
      });
    };
    fit();
    const scroller = el.closest("main");
    scroller?.addEventListener("scroll", fit, { passive: true });
    window.addEventListener("scroll", fit, { passive: true });
    window.addEventListener("resize", fit);
    return () => {
      scroller?.removeEventListener("scroll", fit);
      window.removeEventListener("scroll", fit);
      window.removeEventListener("resize", fit);
      el.style.height = "";
      el.style.maxHeight = "";
    };
  }, [showWorksSticky, needsContext]);

  useEffect(() => {
    const main = document.querySelector("main");
    if (!(main instanceof HTMLElement)) return;
    const onScroll = () => setShowToTop(main.scrollTop > 200);
    onScroll();
    main.addEventListener("scroll", onScroll, { passive: true });
    return () => main.removeEventListener("scroll", onScroll);
  }, []);

  const officerReviewRows = useMemo(
    () =>
      showQuiz && isOfficer
        ? quizReviewRows(officerDraft ?? quiz, ctxUnit)
        : [],
    [showQuiz, isOfficer, officerDraft, quiz, ctxUnit],
  );
  const officerOpenCount = unansweredReviewCount(officerReviewRows);

  const openOfficerQuizSheet = () => {
    openOfficerDraft();
    setOfficerEditGateOpen(false);
    setQuizSheetOpen(true);
  };

  const openOfficerConfirmSheet = () => {
    setOfficerLockGateOpen(false);
    setOfficerConfirmOpen(true);
  };

  const openOfficerDecideFromConfirm = () => {
    returnToConfirm.current = true;
    setOfficerLockGateOpen(false);
    setOfficerConfirmOpen(false);
    openOfficerQuizSheet();
  };

  const lockOfficerAnswers = () => {
    const src = officerDraft ?? quiz;
    if (unansweredReviewCount(quizReviewRows(src, ctxUnit)) > 0) {
      setOfficerLockGateOpen(true);
      return;
    }
    persistQuiz(confirmPlannedWorks(src));
    setOfficerDraft(null);
    setOfficerConfirmOpen(false);
    setOfficerLockGateOpen(false);
    setOfficerLockToastOpen(true);
  };

  const openQuizSheet = (edit = true) => {
    if (role === "tenant") {
      scrollToStep(QUIZ_STAGE_NAME, QUIZ_STEP_NAME);
      return;
    }
    if (role === "contractor" && !quizCanWrite(role, quiz)) return;
    if (role === "officer") {
      if (edit) {
        setOfficerEditGateOpen(true);
        return;
      }
      setQuizSheetOpen(true);
      return;
    }
    if (edit && quizCanWrite(role, quiz)) {
      persistQuiz({
        status: "editing",
        answers: quiz.answers,
        confirmed: quiz.confirmed,
      });
    }
    setQuizSheetOpen(true);
  };

  const closeQuizSheet = () => {
    if (role === "contractor" && quizCanWrite(role, quiz)) {
      persistQuiz(settleQuizWrite(quiz, ctxUnit));
    }
    if (role === "officer") setOfficerDraft(null);
    setQuizSheetOpen(false);
    if (returnToConfirm.current) {
      returnToConfirm.current = false;
      setOfficerConfirmOpen(true);
    }
  };

  useEffect(() => {
    setQuizSheetOpen(false);
    setOfficerDraft(null);
    setOfficerEditGateOpen(false);
    setOfficerConfirmOpen(false);
    setOfficerLockGateOpen(false);
    returnToConfirm.current = false;
  }, [role]);

  useEffect(() => {
    if (isContractor && quizIsConfirmed(quiz)) setQuizSheetOpen(false);
  }, [isContractor, quiz]);

  const quizLocked = quizIsConfirmed(quiz);

  const stageBlocks = useMemo(() => {
    if (needsContext) return [];
    return injectLaterRenoStep(
      blocksForPhase(
        active,
        role,
        ctxUnit,
        showQuiz,
        plannedFlags,
        quizLocked,
      ),
      role,
      ctxUnit,
    );
  }, [active, role, ctxUnit, needsContext, showQuiz, plannedFlags, quizLocked]);

  const journeyItems = useMemo(() => {
    const list: JourneyItem[] = [];
    for (const b of stageBlocks) {
      for (const folded of foldPtwPackSteps(b.steps)) {
        list.push({
          stageName: b.stage.name,
          classified: folded.classified,
          packMembers: folded.packMembers,
        });
      }
    }
    return list;
  }, [stageBlocks]);

  const visibleJourneyItems = journeyItems;

  const permitResult = useMemo(
    () => (showQuiz ? quizPermitResult(quiz, ctxUnit) : null),
    [showQuiz, quiz, ctxUnit],
  );

  const navKeySig = journeyItems
    .map((s) => `${s.stageName}::${s.classified.step.name}`)
    .join("/");

  useEffect(() => {
    const keys = visibleJourneyItems.map((s) =>
      stepFocusKey(s.stageName, s.classified.step.name),
    );
    setFocusedStep((prev) => {
      if (keys.length === 0) return null;
      if (prev && keys.includes(prev)) return prev;
      return keys[0] ?? null;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navKeySig]);

  const focusedItem =
    visibleJourneyItems.find((s) => {
      const key = stepFocusKey(s.stageName, s.classified.step.name);
      if (key === focusedStep) return true;
      return (s.packMembers ?? []).some(
        (m) => stepFocusKey(s.stageName, m.step.name) === focusedStep,
      );
    }) ??
    visibleJourneyItems[0] ??
    null;

  const focusStep = (stageName: string, stepName: string) => {
    setFocusedStep(stepFocusKey(stageName, stepName));
  };

  const releaseSpyLock = () => {
    window.setTimeout(() => {
      spyLock.current = false;
    }, 200);
  };

  const scrollToStep = (stageName: string, stepName: string) => {
    focusStep(stageName, stepName);
    pendingStageScroll.current = { stageName, stepName };
    const el = document.getElementById(stepDomId(stageName, stepName));
    if (!el) return;
    const card = el.closest("article") ?? el;
    pendingStageScroll.current = null;
    spyLock.current = true;
    alignCardToRail(card, "auto");
    window.requestAnimationFrame(() => alignCardToRail(card, "auto"));
    releaseSpyLock();
  };

  useEffect(() => {
    const pending = pendingStageScroll.current;
    if (!pending || !browsingPhase) return;
    const el = document.getElementById(
      stepDomId(pending.stageName, pending.stepName),
    );
    if (!el) return;
    pendingStageScroll.current = null;
    spyLock.current = true;
    const card = el.closest("article") ?? el;
    alignCardToRail(card, "auto");
    const raf = window.requestAnimationFrame(() => alignCardToRail(card, "auto"));
    const t = window.setTimeout(() => {
      spyLock.current = false;
    }, 200);
    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(t);
    };
  }, [visibleJourneyItems, browsingPhase]);

  useEffect(() => {
    if (!browsingPhase || needsContext || visibleJourneyItems.length === 0) return;

    const first = document.getElementById(
      stepDomId(visibleJourneyItems[0].stageName, visibleJourneyItems[0].classified.step.name),
    );
    const scroller = nearestScroller(first);

    const syncFromScroll = () => {
      if (spyLock.current) return;
      const last = visibleJourneyItems[visibleJourneyItems.length - 1];
      let next = visibleJourneyItems[0];
      if (last && isScrollerAtEnd(scroller)) {
        next = last;
      } else {
        const line = spyReadLine();
        for (const item of visibleJourneyItems) {
          const el = document.getElementById(
            stepDomId(item.stageName, item.classified.step.name),
          );
          if (!el) continue;
          const card = el.closest("article") ?? el;
          if (card.getBoundingClientRect().top <= line) next = item;
        }
      }
      const key = stepFocusKey(next.stageName, next.classified.step.name);
      setFocusedStep((prev) => (prev === key ? prev : key));
    };

    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        syncFromScroll();
      });
    };

    scroller.addEventListener("scroll", onScroll, { passive: true });
    syncFromScroll();
    return () => {
      scroller.removeEventListener("scroll", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [navKeySig, needsContext, browsingPhase, visibleJourneyItems]);

  const chips = needsContext
    ? ["All Terminals", "All Zones"]
    : [ctxUnit.terminal, ctxUnit.zone, ctxUnit.tenancyType];

  const unitLabel = needsContext ? "All units" : ctxUnit.unitNo;

  const jumpStage = (name: string) => {
    const first = journeyItems.find((i) => i.stageName === name);
    if (!first) return;
    if (journeyItems[0]?.stageName === name) {
      focusStep(first.stageName, first.classified.step.name);
      spyLock.current = true;
      const el = document.getElementById(
        stepDomId(first.stageName, first.classified.step.name),
      );
      setScrollY(nearestScroller(el), 0, "auto");
      releaseSpyLock();
      return;
    }
    scrollToStep(first.stageName, first.classified.step.name);
  };

  const renderWorksSticky = () =>
    showWorksSticky ? (
      <WorksSticky
        title={worksSticky.title}
        subtitle={worksSticky.subtitle}
        cta={worksSticky.cta}
        answered={worksProgress.answered}
        total={worksProgress.total}
        track={worksSticky.track}
        tip={worksSticky.tip}
        onOpen={() => openQuizSheet(true)}
      />
    ) : null;

  const unitPicker = (
    <div className="flex w-full flex-col gap-2 tablet:w-[259px] tablet:shrink-0 tablet:items-end">
      <label className="flex w-full items-center gap-2">
        <span className="shrink-0 text-sm leading-[18px] font-bold text-grey-500">
          For
        </span>
        <UnitSelect
          isTenant={isTenant}
          isContractor={isContractor}
          isOfficer={isOfficer}
          needsContext={needsContext}
          unitLabel={unitLabel}
          unitId={unit.id}
          jobId={jobId}
          units={units}
          onPickOutlet={pickOutlet}
          onPickJob={pickJob}
          onPickOfficer={(next) =>
            setOfficerSelection({
              terminal: next.terminal as "T1" | "T2" | "T3" | "T4",
              tenancyType: next.tenancyType as "Retail" | "F&B",
              zone: "Airside",
            })
          }
        />
      </label>
      <div className="flex flex-wrap gap-1 tablet:justify-end">
        {chips.map((chip) => (
          <OutlineChip key={chip}>{chip}</OutlineChip>
        ))}
      </div>
    </div>
  );

  const focusFromUrl = params.get("focus");

  const pathCards = visibleJourneyItems.map((item) => {
    const key = stepFocusKey(item.stageName, item.classified.step.name);
    return (
      <PathStep
        key={key}
        classified={item.classified}
        stageName={item.stageName}
        packMembers={item.packMembers}
        jumpedTo={
          focusFromUrl === LATER_RENO_CARD_FOCUS &&
          item.classified.step.name === LATER_RENO_STEP_NAME
        }
        role={role}
        tenancyType={ctxUnit.tenancyType}
        terminal={ctxUnit.terminal}
        zone={ctxUnit.zone}
        unit={ctxUnit}
        quiz={
          showQuiz
            ? {
                kickoffSoon: isContractor
                  ? Boolean(activeJob.kickoffSoon)
                  : kickoffSoonForUnit(ctxUnit),
                state: quiz,
                questions: quizQuestions,
                summary: quizSummary,
                flags: plannedFlags,
                permitResult,
                onStart: () =>
                  role === "officer"
                    ? openQuizSheet(true)
                    : persistQuiz({
                        status: "editing",
                        answers: quiz.answers,
                        confirmed: quiz.confirmed,
                      }),
                onToggle: (questionId, optionId) => {
                  if (officerDraft) {
                    setOfficerDraft(
                      toggleQuestionOption(officerDraft, questionId, optionId),
                    );
                    return;
                  }
                  persistQuiz(toggleQuestionOption(quiz, questionId, optionId));
                },
                onConfirm: () => {
                  if (role !== "officer") return;
                  openOfficerConfirmSheet();
                },
                onCancel: () => {
                  setOfficerDraft(null);
                  if (role === "officer" && quiz.status === "editing") {
                    persistQuiz({
                      status: "done",
                      answers: quiz.answers,
                      confirmed: quiz.confirmed,
                    });
                  }
                },
                onEdit: () => {
                  if (role === "officer") {
                    if (quizIsConfirmed(quiz)) {
                      openQuizSheet(true);
                      return;
                    }
                    returnToConfirm.current = false;
                    openOfficerQuizSheet();
                    return;
                  }
                  persistQuiz({
                    status: "editing",
                    answers: quiz.answers,
                    confirmed: quiz.confirmed,
                  });
                },
                onOpenQuiz: (edit = true) => {
                  openQuizSheet(edit);
                },
                onApplySlugs: (slugs) => {
                  persistQuiz(applySlugsToQuiz(quiz, slugs, ctxUnit));
                },
                onDismissSlugs: (slugs) => {
                  persistQuiz(dismissSlugsFromQuiz(quiz, slugs, ctxUnit));
                },
              }
            : null
        }
        onPreviewDoc={setPreviewDocId}
      />
    );
  });

  const pathSteps = [...pathCards];
  if (active.id === "operate" && !needsContext) {
    const lastOps = visibleJourneyItems.reduce(
      (found, item, index) => (item.stageName === "Operations" ? index : found),
      -1,
    );
    const need = <LaterRenoNeedLine key={LATER_RENO_NEED_ID} role={role} />;
    if (lastOps >= 0) pathSteps.splice(lastOps + 1, 0, need);
    else pathSteps.push(need);
  }

  useEffect(() => {
    if (active.id !== "operate" || needsContext) return;
    if (focusFromUrl === LATER_RENO_NEED_FOCUS) {
      document.getElementById(LATER_RENO_NEED_ID)?.scrollIntoView({
        block: "center",
        behavior: "smooth",
      });
      return;
    }
    if (focusFromUrl === LATER_RENO_CARD_FOCUS) {
      scrollToStep(LATER_RENO_STAGE, LATER_RENO_STEP_NAME);
    }
  }, [active.id, needsContext, focusFromUrl]);

  return (
    <>
      <div
        className="dls-page flex flex-col gap-4 tablet:gap-6 !pt-5 tablet:!pt-8"
      >
        <header className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 tablet:flex-row tablet:items-start tablet:justify-between tablet:gap-2">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <h1 className="text-[28px] leading-9 font-bold text-black">
                Process
              </h1>
              <p className="text-sm leading-[18px] text-grey-500">
                {needsContext
                  ? "Choose a unit to open this guide."
                  : active.description}
              </p>
            </div>
            {unitPicker}
          </div>
        </header>

        <div className="flex min-w-0 flex-col">
          <div className="mt-4 desktop:hidden">
            <PhaseTabStrip
              phases={visiblePhases}
              activeId={active.id}
              browsing
              disabled={needsContext}
              onSelect={selectPhase}
            />
          </div>

          <div
            id="process-v21-mobile-pin"
            className="sticky top-0 z-20 -mx-4 border-b border-grey-100 bg-grey-50 px-4 py-3 desktop:hidden"
          >
            <div className="flex flex-col gap-3">
              <JourneyNav
                phases={visiblePhases}
                activePhaseId={active.id}
                stageBlocks={stageBlocks}
                activeStageName={focusedItem?.stageName ?? null}
                compact
                disabled={needsContext}
                onSelectPhase={selectPhase}
                onSelectStage={jumpStage}
              />
              {pinWorksSticky ? renderWorksSticky() : null}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-6 desktop:mt-6 desktop:grid-cols-12 desktop:items-start">
            <aside
              ref={railRef}
              className="hidden min-w-0 desktop:sticky desktop:top-8 desktop:col-span-4 desktop:col-start-9 desktop:row-start-1 desktop:flex desktop:h-[calc(100dvh-4rem)] desktop:max-h-[calc(100dvh-4rem)] desktop:flex-col desktop:self-start"
            >
              <div className="flex min-h-0 flex-1 flex-col gap-4">
                <PhaseTabStrip
                  phases={visiblePhases}
                  activeId={active.id}
                  browsing
                  disabled={needsContext}
                  onSelect={selectPhase}
                />
                <DocumentFilterPanel>
                  <JourneyNav
                    phases={visiblePhases}
                    activePhaseId={active.id}
                    stageBlocks={stageBlocks}
                    activeStageName={focusedItem?.stageName ?? null}
                    activeStepName={
                      focusedItem
                        ? (focusedItem.packMembers?.find(
                            (member) =>
                              stepFocusKey(
                                focusedItem.stageName,
                                member.step.name,
                              ) === focusedStep,
                          )?.step.name ?? focusedItem.classified.step.name)
                        : null
                    }
                    rail
                    role={role}
                    disabled={needsContext}
                    onSelectPhase={selectPhase}
                    onSelectStage={jumpStage}
                    onSelectStep={scrollToStep}
                  />
                </DocumentFilterPanel>
                {showWorksSticky ? (
                  <div className="mt-auto shrink-0">{renderWorksSticky()}</div>
                ) : null}
              </div>
            </aside>
            <section className="flex min-w-0 flex-col gap-6 desktop:col-span-8 desktop:col-start-1 desktop:row-start-1">
              {pathSteps}
            </section>
          </div>
        </div>
      </div>

      {showToTop &&
        !previewDocId &&
        !quizSheetOpen &&
        !officerConfirmOpen &&
        !officerEditGateOpen &&
        !officerLockGateOpen && (
        <div className="fixed z-30 right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] tablet:right-8 tablet:bottom-8">
          <Button
            type="Secondary (Mono)"
            size="lg"
            aria-label="Back to top"
            onClick={() => {
              setShowToTop(false);
              const main = document.querySelector("main");
              if (main instanceof HTMLElement) {
                setScrollY(main, 0, "smooth");
              }
            }}
          >
            <IconLeaf
              src={caretUp}
              leafW={12}
              leafH={7}
              frame={24}
              colorClass="text-grey-700"
            />
          </Button>
        </div>
      )}
      <DocumentPreviewDrawer
        docId={previewDocId}
        onClose={() => setPreviewDocId(null)}
      />
      {showQuiz && isOfficer && (
        <OfficerEditGate
          open={officerEditGateOpen}
          onConfirm={openOfficerQuizSheet}
          onClose={() => setOfficerEditGateOpen(false)}
        />
      )}
      {showQuiz && isOfficer && (
        <OfficerConfirmSheet
          open={officerConfirmOpen}
          rows={officerReviewRows}
          onClose={() => setOfficerConfirmOpen(false)}
          onEdit={openOfficerDecideFromConfirm}
          onConfirm={lockOfficerAnswers}
          onBlocked={() => setOfficerLockGateOpen(true)}
        />
      )}
      {showQuiz && isOfficer && (
        <OfficerLockGate
          open={officerLockGateOpen}
          openCount={officerOpenCount}
          onClose={() => setOfficerLockGateOpen(false)}
          onEdit={openOfficerDecideFromConfirm}
        />
      )}
      {showQuiz && isOfficer && (
        <OfficerLockToast
          open={officerLockToastOpen}
          onClose={() => setOfficerLockToastOpen(false)}
        />
      )}
      {showQuiz &&
        (isOfficer || (isContractor && quizCanWrite(role, quiz))) && (
        <PlannedWorksSheet
          open={quizSheetOpen}
          questions={quizQuestions}
          state={isOfficer ? (officerDraft ?? quiz) : quiz}
          allowUnsure={!isOfficer}
          onToggle={(questionId, optionId) => {
            if (isOfficer) {
              setOfficerDraft((draft) =>
                toggleQuestionOption(draft ?? quiz, questionId, optionId),
              );
              return;
            }
            persistQuiz(toggleQuestionOption(quiz, questionId, optionId));
          }}
          onSave={() => {
            if (isOfficer) {
              const src = officerDraft ?? quiz;
              persistQuiz(
                settleQuizWrite(
                  {
                    ...src,
                    confirmed: Boolean(quiz.confirmed),
                  },
                  ctxUnit,
                ),
              );
              setOfficerDraft(null);
              setQuizSheetOpen(false);
              if (returnToConfirm.current) {
                returnToConfirm.current = false;
                setOfficerConfirmOpen(true);
              }
              return;
            }
            persistQuiz({
              status: "done",
              answers: quiz.answers,
              confirmed: false,
            });
            setQuizSheetOpen(false);
          }}
          onClose={closeQuizSheet}
        />
      )}
    </>
  );
}

type DropdownOption = { value: string; label: string; prefix?: string };

function DropdownLabel({
  prefix,
  label,
}: {
  prefix?: string;
  label: string;
}) {
  if (!prefix) return <>{label}</>;
  return (
    <>
      <span className="font-normal text-grey-400">{prefix}</span>
      <span className="px-1.5 font-normal text-grey-300" aria-hidden>
        /
      </span>
      <span className="font-bold text-black">{label}</span>
    </>
  );
}

function DropdownField({
  label,
  value,
  disabled,
  className,
  compact,
  showLabel,
  options,
  onChange,
}: {
  label: string;
  value: string;
  disabled?: boolean;
  className?: string;
  compact?: boolean;
  showLabel?: boolean;
  options: DropdownOption[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const listId = useId();
  const selected = options.find((o) => o.value === value) ?? options[0];
  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.value === selected?.value),
  );
  const [activeIndex, setActiveIndex] = useState(selectedIndex);

  useEffect(() => {
    if (!open) return;
    setActiveIndex(selectedIndex);
    const onDoc = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, selectedIndex]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const item = listRef.current?.querySelector<HTMLElement>(
      `[data-index="${activeIndex}"]`,
    );
    item?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex]);

  const pick = (next: string) => {
    onChange(next);
    setOpen(false);
  };

  const onTriggerKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
    }
  };

  const onListKey = (e: KeyboardEvent<HTMLUListElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(options.length - 1, i + 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
      return;
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const next = options[activeIndex];
      if (next) pick(next.value);
      return;
    }
    if (e.key === "Home") {
      e.preventDefault();
      setActiveIndex(0);
      return;
    }
    if (e.key === "End") {
      e.preventDefault();
      setActiveIndex(options.length - 1);
    }
  };

  return (
    <div ref={rootRef} className={cn("relative min-w-0", className)}>
      {showLabel && (
        <p className="mb-2 text-sm leading-[18px] font-bold text-black">
          {label}
        </p>
      )}
      <button
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        disabled={disabled}
        onClick={() => {
          if (!disabled) setOpen((v) => !v);
        }}
        onKeyDown={onTriggerKey}
        className={cn(
          "relative flex w-full min-w-0 items-center border bg-white text-left",
          "rounded-[var(--radius-md)] focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]",
          compact ? "h-9" : "min-h-10 tablet:min-h-12",
          open ? "border-purple-600" : "border-grey-200",
          disabled ? "text-grey-300" : "text-black",
        )}
      >
        <span
          className={cn(
            "min-w-0 flex-1 truncate py-[9px] pl-3",
            compact
              ? "text-sm leading-[18px]"
              : "text-sm leading-[18px] tablet:py-3 tablet:pl-4 tablet:text-base tablet:leading-5",
          )}
        >
          <DropdownLabel prefix={selected?.prefix} label={selected?.label ?? ""} />
        </span>
        <span
          className="pointer-events-none flex shrink-0 items-center px-3 py-2"
          aria-hidden
        >
          <span
            className={cn(
              "inline-flex transition-transform",
              open && "rotate-180",
            )}
          >
            <IconLeaf src={caretDown} leafW={10} leafH={5.83} frame={20} />
          </span>
        </span>
      </button>
      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={label}
          tabIndex={-1}
          onKeyDown={onListKey}
          className="absolute inset-x-0 top-full z-40 mt-1 max-h-80 overflow-y-auto rounded-[var(--radius-sm)] border border-grey-200 bg-white py-1 shadow-[var(--shadow-light-bg)]"
        >
          {options.map((option, index) => {
            const isSelected = option.value === selected?.value;
            const isActive = index === activeIndex;
            return (
              <li
                key={option.value}
                role="option"
                aria-selected={isSelected}
                data-index={index}
                onPointerEnter={() => setActiveIndex(index)}
                onClick={() => pick(option.value)}
                className={cn(
                  "cursor-pointer px-4 py-2.5 text-sm leading-[18px] tablet:text-base tablet:leading-5",
                  isSelected && "bg-purple-100 font-bold text-purple-700",
                  !isSelected && isActive && "bg-purple-100",
                  !isSelected && !isActive && "text-black",
                )}
              >
                <DropdownLabel prefix={option.prefix} label={option.label} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function UnitSelect({
  isTenant,
  isContractor,
  isOfficer,
  needsContext,
  unitLabel,
  unitId,
  jobId,
  units,
  onPickOutlet,
  onPickJob,
  onPickOfficer,
}: {
  isTenant: boolean;
  isContractor: boolean;
  isOfficer: boolean;
  needsContext: boolean;
  unitLabel: string;
  unitId: string;
  jobId: string;
  units: Unit[];
  onPickOutlet: (u: Unit) => void;
  onPickJob: (id: string) => void;
  onPickOfficer: (u: Unit) => void;
}) {
  const value = isContractor ? jobId : isTenant ? unitId : unitLabel;
  return (
    <DropdownField
      label="Unit"
      value={value}
      compact
      className="flex-1"
      options={
        isTenant
          ? units.map((u) => ({ value: u.id, label: u.unitNo }))
          : isContractor
            ? CONTRACTOR_JOBS.map((j) => ({ value: j.id, label: j.label }))
            : [
                ...(needsContext
                  ? [{ value: "All units", label: "All units" }]
                  : []),
                ...UNITS.map((u) => ({ value: u.unitNo, label: u.unitNo })),
              ]
      }
      onChange={(next) => {
        if (isTenant) {
          const unit = units.find((u) => u.id === next);
          if (unit) onPickOutlet(unit);
          return;
        }
        if (isContractor) {
          onPickJob(next);
          return;
        }
        const unit = UNITS.find((u) => u.unitNo === next);
        if (unit) onPickOfficer(unit);
      }}
    />
  );
}

function FilterChip({
  label,
  applied,
  current,
  disabled,
  wide,
  onSelect,
  onClear,
}: {
  label: string;
  applied: boolean;
  current?: boolean;
  disabled?: boolean;
  wide?: boolean;
  onSelect: () => void;
  onClear?: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={applied}
      aria-current={current ? "location" : undefined}
      onClick={() => {
        if (applied && onClear) onClear();
        else onSelect();
      }}
      className={cn(
        "inline-flex h-8 max-w-full items-center gap-1.5 rounded-[var(--radius-sm)] border px-3 text-sm leading-[18px] font-bold",
        "focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]",
        "disabled:border-grey-100 disabled:bg-grey-100 disabled:text-grey-300",
        wide && "w-full justify-start",
        applied
          ? "border-purple-600 bg-purple-100 text-purple-700 hover:border-purple-700 hover:bg-purple-200 hover:text-purple-800"
          : "border-grey-200 bg-white text-grey-700 hover:border-grey-300 hover:bg-grey-50",
      )}
    >
      <span className="min-w-0 truncate">{label}</span>
      {applied && onClear && (
        <span className="inline-flex shrink-0" aria-hidden>
          <IconLeaf src={closeIcon} leafW={12} leafH={12} frame={16} />
        </span>
      )}
    </button>
  );
}

/** `_Components/DocLibrary/DocumentFilterPanel` — Filters header, items, footer. */
function DocumentFilterPanel({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[var(--radius-md)] border border-grey-100 bg-white shadow-[var(--shadow-light-bg)]">
      <div className="relative flex shrink-0 items-start gap-2 bg-white px-6">
        <div className="flex min-w-0 flex-1 flex-col gap-1 pt-6 pb-2">
          <p className="text-xl leading-7 font-bold text-grey-900">View By</p>
          <p className="text-sm leading-[18px] text-grey-700">
            Select something, to view a card etc....
          </p>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-6">
        {children}
      </div>
    </div>
  );
}

function JourneyNav({
  phases,
  activePhaseId,
  stageBlocks,
  activeStageName,
  activeStepName,
  compact,
  pinned,
  rail,
  role = "contractor",
  disabled,
  afterPhases,
  onSelectPhase,
  onSelectStage,
  onSelectStep,
}: {
  phases: Phase[];
  activePhaseId: Phase["id"];
  stageBlocks: { stage: { name: string }; steps: ClassifiedStep[] }[];
  activeStageName: string | null;
  activeStepName?: string | null;
  compact?: boolean;
  pinned?: boolean;
  rail?: boolean;
  role?: Role;
  disabled?: boolean;
  afterPhases?: ReactNode;
  onSelectPhase: (id: Phase["id"]) => void;
  onSelectStage: (name: string) => void;
  onSelectStep?: (stageName: string, stepName: string) => void;
}) {
  const stageRowRef = useRef<HTMLDivElement | null>(null);
  const railListRef = useRef<HTMLDivElement | null>(null);
  const phaseLabel = TAB_LABEL[activePhaseId] ?? activePhaseId;

  useEffect(() => {
    if (!rail) return;
    const current = railListRef.current?.querySelector<HTMLElement>(
      "[aria-current='location']",
    );
    current?.scrollIntoView({ block: "nearest" });
  }, [activeStageName, activeStepName, rail]);

  useEffect(() => {
    if (compact || rail) return;
    const row = stageRowRef.current;
    if (!row || !activeStageName) return;
    const rowRect = row.getBoundingClientRect();
    const inView = rowRect.bottom > 0 && rowRect.top < window.innerHeight;
    if (!inView) return;
    const current = row.querySelector<HTMLElement>("[aria-current='location']");
    current?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [activeStageName, compact, rail]);

  if (compact) {
    if (pinned) {
      return (
        <div id={RAIL_ID}>
          <DropdownField
            label="You are here"
            showLabel
            value={activeStageName ?? stageBlocks[0]?.stage.name ?? ""}
            disabled={disabled || stageBlocks.length === 0}
            className="w-full"
            options={stageBlocks.map((block) => ({
              value: block.stage.name,
              prefix: phaseLabel,
              label: block.stage.name,
            }))}
            onChange={onSelectStage}
          />
        </div>
      );
    }

    return (
      <div id={RAIL_ID} className="flex flex-col gap-3">
        {stageBlocks.length > 0 && (
          <DropdownField
            label="You are here"
            showLabel
            value={activeStageName ?? stageBlocks[0]?.stage.name ?? ""}
            disabled={disabled}
            className="w-full"
            options={stageBlocks.map((block) => ({
              value: block.stage.name,
              prefix: phaseLabel,
              label: block.stage.name,
            }))}
            onChange={onSelectStage}
          />
        )}
      </div>
    );
  }

  if (rail) {
    return (
      <div ref={railListRef} id={RAIL_ID} className="flex flex-col gap-4">
        {stageBlocks.map((block, index) => (
          <div
            key={block.stage.name}
            className="flex flex-col gap-1.5"
          >
            {index > 0 && <div className="h-px bg-grey-100" aria-hidden />}
            <p className="py-1 text-base leading-5 font-bold text-black">
              {block.stage.name}
            </p>
            {block.steps.map((classified) => {
              const stepName = classified.step.name;
              const on =
                block.stage.name === activeStageName &&
                stepName === (activeStepName ?? "");
              return (
                <button
                  key={stepName}
                  type="button"
                  aria-current={on ? "location" : undefined}
                  disabled={disabled}
                  onClick={() =>
                    onSelectStep
                      ? onSelectStep(block.stage.name, stepName)
                      : onSelectStage(block.stage.name)
                  }
                  className={cn(
                    "w-full rounded-[var(--radius-sm)] text-left text-base leading-5",
                    "focus-visible:outline-none focus-visible:shadow-[0_0_0_4px_var(--color-purple-200)]",
                    "disabled:opacity-40",
                    on
                      ? "bg-purple-100 px-3 py-4 font-bold text-purple-600"
                      : "py-3 pl-1.5 text-black",
                  )}
                >
                  <span className="block truncate">
                    {cardTitle(role, block.stage.name, stepName)}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
        {afterPhases}
      </div>
    );
  }

  return (
    <div id={RAIL_ID} className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <p className={LABEL_CAPS}>
          Phase
        </p>
        <div
          role="tablist"
          aria-label="Phase"
          className="process-chip-scroll -mx-1 flex flex-nowrap gap-2 overflow-x-auto px-1 tablet:mx-0 tablet:flex-wrap tablet:overflow-visible tablet:px-0"
        >
          {phases.map((phase) => (
            <FilterChip
              key={phase.id}
              label={TAB_LABEL[phase.id] ?? phase.name}
              applied={phase.id === activePhaseId}
              disabled={disabled}
              onSelect={() => onSelectPhase(phase.id)}
            />
          ))}
        </div>
      </div>
      {stageBlocks.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className={LABEL_CAPS}>
            You are here
          </p>
          <div
            ref={stageRowRef}
            role="tablist"
            aria-label="You are here"
            className="process-chip-scroll -mx-1 flex flex-nowrap gap-2 overflow-x-auto px-1 tablet:mx-0 tablet:flex-wrap tablet:overflow-visible tablet:px-0"
          >
            {stageBlocks.map((block) => (
              <FilterChip
                key={block.stage.name}
                label={block.stage.name}
                applied={block.stage.name === activeStageName}
                current={block.stage.name === activeStageName}
                disabled={disabled}
                onSelect={() => onSelectStage(block.stage.name)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PathStep({
  classified,
  stageName,
  packMembers,
  jumpedTo,
  highlightStepName,
  highlightDocId,
  highlightSystemLabel,
  role,
  unit,
  tenancyType,
  terminal,
  zone,
  quiz,
  onPreviewDoc,
}: {
  classified: ClassifiedStep;
  stageName: string;
  packMembers?: ClassifiedStep[];
  jumpedTo?: boolean;
  highlightStepName?: string | null;
  highlightDocId?: string | null;
  highlightSystemLabel?: string | null;
  role: Role;
  unit: Unit;
  tenancyType: string;
  terminal: string;
  zone: string;
  quiz: {
    kickoffSoon: boolean;
    state: QuizState;
    questions: QuizQuestion[];
    summary: string[];
    flags: Record<PlannedWorkSlug, SlugFlag> | null;
    permitResult: QuizPermitResult | null;
    onStart: () => void;
    onToggle: (questionId: QuestionId, optionId: string) => void;
    onConfirm: () => void;
    onCancel: () => void;
    onEdit: () => void;
    onOpenQuiz: (edit?: boolean) => void;
    onApplySlugs: (slugs: PlannedWorkSlug[]) => void;
    onDismissSlugs: (slugs: PlannedWorkSlug[]) => void;
  } | null;
  onPreviewDoc: (id: string) => void;
}) {
  const { step, mine, others, flow } = classified;
  const notes = notesYouFollow(mine, others, role);
  const purpose = stepWhat(step, role);
  const handoffOnly = mine.length === 0;
  const { sequential, parallel, nested } = groupGuideBlocks(notes);
  const lineOf = (s: (typeof notes)[number]) => displayText(s, true, role);
  const howLines = handoffOnly
    ? []
    : [...sequential, ...parallel]
        .map((s) => lineOf(s))
        .filter((line): line is string => Boolean(line));
  const onlyIf = (handoffOnly ? notes : nested)
    .map((s) => ({
      workIf: s.workIf ?? "",
      line: lineOf(s),
      labels: actorLabelsForSub(s.audience, role),
    }))
    .filter((row): row is { workIf: string; line: string; labels: string[] } =>
      Boolean(row.line),
    );
  const party = role === "officer" ? cardActor(flow, role) : null;
  const showParty = Boolean(party);
  const tagLines = Boolean(party?.mixed);
  const ownPartyLabels = showParty
    ? party && !party.mixed
      ? [party.label]
      : ["You"]
    : undefined;
  const alsoRows = tagLines
    ? others
        .filter((s) => !s.workIf)
        .map((s) => {
          const line = alsoHappeningText(s, role);
          if (!line) return null;
          return {
            line,
            labels: actorLabelsForSub(s.audience, role),
          };
        })
        .filter((row): row is { line: string; labels: string[] } =>
          Boolean(row),
        )
    : [];

  const isPtwPack = packMembers !== undefined;
  const docs = useMemo(() => {
    const own = docsForStep(step.name, tenancyType, terminal, zone, stageName);
    if (!packMembers) return own;
    const seen = new Set(own.map((d) => d.id));
    const extra = packMembers.flatMap((m) =>
      docsForStep(m.step.name, tenancyType, terminal, zone, stageName),
    );
    return [...own, ...extra.filter((d) => !seen.has(d.id) && seen.add(d.id))];
  }, [step.name, packMembers, tenancyType, terminal, zone, stageName]);
  const hostsQuiz = Boolean(quiz) && step.name === QUIZ_STEP_NAME;
  const hostsKickoff =
    stageName === KICKOFF_STAGE_NAME && step.name === KICKOFF_STEP_NAME;
  const hostsPostKickoffPack =
    stageName === "Post-Kickoff" && step.name === "Onboarding Guidelines Shared";
  const quizStatus = quiz?.state.status ?? "idle";
  const editMode = quizEditMode(role);
  const confirmed = Boolean(quiz && quizIsConfirmed(quiz.state));
  const contractorCanWrite = editMode === "fill" && !confirmed;
  const officerCanWrite = editMode === "correct";
  const canWriteQuiz = contractorCanWrite;
  const hasAnswers = Boolean(quiz && quizHasSavedAnswers(quiz.state));
  const reviewRows = quiz ? quizReviewRows(quiz.state, unit) : [];
  const needsGuide =
    Boolean(quiz) && quizNeedsOfficerGuide(quiz.state, unit);
  const officerPending = officerCanWrite && !confirmed;
  const reviewLabel = officerPending
    ? hostsKickoff
      ? quizCopy.reviewLabelOfficerConfirm
      : quizCopy.reviewLabelOfficerPending
    : confirmed
      ? officerCanWrite
        ? quizCopy.reviewLabelOfficerAgreed
        : role === "contractor"
          ? quizCopy.reviewLabelContractorAgreed
          : quizCopy.reviewLabelTenantAgreed
      : role === "tenant"
        ? quizCopy.reviewLabelTenantPending
        : quizCopy.reviewLabel;
  const officerReviewHint = hostsKickoff
    ? quizCopy.officerPossibleLine
    : quizCopy.officerReadLine;
  const quizStillOpen = Boolean(quiz && quizHasUnanswered(quiz.state));
  const reviewBannerTitle = officerPending
    ? officerReviewHint
    : role === "contractor" && contractorCanWrite && quizStillOpen
      ? quizCopy.bannerContractorPaused
      : reviewLabel;
  const hideContractorDoneBanner =
    role === "contractor" && contractorCanWrite && !quizStillOpen;

  const copy = lifeSgCard(role, stageName, isPtwPack ? PTW_PACK_HOST : step.name);
  const lead = cardLead(
    role,
    stageName,
    isPtwPack ? PTW_PACK_HOST : step.name,
  );
  const tenantFilledUnaligned =
    role === "tenant" && hasAnswers && !confirmed;
  const rewriteTenantFilledLine = (line: string) =>
    tenantFilledUnaligned &&
    (line === "Get planned works from your contractor." ||
      line === "Read the works your contractor confirmed.")
      ? quizCopy.tenantFilledLine
      : line;
  const rawSubheader = copy?.subheader ?? purpose;
  const subheaderLines = Array.isArray(rawSubheader)
    ? rawSubheader.map(rewriteTenantFilledLine)
    : null;
  const subheader = Array.isArray(rawSubheader)
    ? rawSubheader.join(" ")
    : rawSubheader;
  const remainingHow = [
    ...(copy ? (copy.how ?? []).map(rewriteTenantFilledLine) : howLines),
    ...(hostsQuiz && editMode === "correct" && needsGuide && !confirmed
      ? quizCopy.officerGuideHow
      : []),
  ];
  const howRows = [
    ...(copy
      ? (copy.how ?? []).map((line) => ({
          line: rewriteTenantFilledLine(line),
          labels: ownPartyLabels,
        }))
      : [...sequential, ...parallel]
          .map((s) => {
            const line = lineOf(s);
            if (!line) return null;
            return {
              line,
              labels: showParty
                ? actorLabelsForSub(s.audience, role)
                : undefined,
            };
          })
          .filter(
            (row): row is { line: string; labels: string[] | undefined } =>
              Boolean(row),
          )),
    ...(hostsQuiz && editMode === "correct" && needsGuide && !confirmed
      ? quizCopy.officerGuideHow.map((line) => ({
          line,
          labels: ownPartyLabels,
        }))
      : []),
  ];
  const seenPartyLines = new Set(
    [...(subheaderLines ?? []), ...remainingHow].map((line) =>
      line.toLowerCase().replace(/[.]+$/g, "").trim(),
    ),
  );
  const extraPartyRows = alsoRows.filter(
    (row) =>
      !seenPartyLines.has(row.line.toLowerCase().replace(/[.]+$/g, "").trim()),
  );
  const mainRows = [
    ...(subheaderLines ?? []).map((line) => ({
      line,
      labels: ownPartyLabels,
    })),
    ...extraPartyRows.map((row) => ({
      line: row.line,
      labels: row.labels,
    })),
  ];
  const whenRows = useMemo(
    () =>
      timingsForStep(
        stageName,
        isPtwPack ? PTW_PACK_HOST : step.name,
        unit,
        role,
      ),
    [stageName, isPtwPack, step.name, unit, role],
  );
  const memberDurations = useMemo(() => {
    const map = new Map<string, Pick<GuideTiming, "duration" | "kind">>();
    for (const member of packMembers ?? []) {
      const timing = leadTiming(
        timingsForStep(stageName, member.step.name, unit, role),
      );
      if (timing) {
        map.set(member.step.name, {
          duration: timing.duration,
          kind: timing.kind,
        });
      }
    }
    return map;
  }, [packMembers, stageName, unit, role]);
  const packSystems = mergeSystems(
    packSystemsNamedIn(subheader, role),
    ...remainingHow.map((line) => packSystemsNamedIn(line, role)),
    ...extraPartyRows.map((row) => packSystemsNamedIn(row.line, role)),
    ...onlyIf.map((row) => packSystemsNamedIn(row.line, role)),
    ...(packMembers ?? []).map((m) =>
      packSystemsNamedIn(stepWhat(m.step, role), role),
    ),
  );
  const { guides, samples } = splitStepDocs(docs);
  const showOnlyIf = onlyIf.length > 0 && !copy?.hideOnlyIf;
  const permitResult = quiz?.permitResult ?? null;
  const showPermitResults =
    Boolean(permitResult) && hostsQuiz && quizStatus !== "editing";
  const showKickoffChecklist =
    Boolean(permitResult) &&
    stageName === KICKOFF_STAGE_NAME &&
    step.name === KICKOFF_STEP_NAME &&
    quizStatus !== "editing";
  const showKickoffCorrection =
    Boolean(quiz) &&
    hostsKickoff &&
    officerCanWrite;
  const officerKickoffDecide =
    showKickoffCorrection && (hasAnswers || confirmed);
  const reviewReady =
    editMode === "read" || editMode === "correct"
      ? confirmed || !quizStillOpen
      : hasAnswers;
  const tenantWaitingOnContractor = role === "tenant" && !hasAnswers;
  const tenantIdleSoon =
    tenantWaitingOnContractor && Boolean(quiz?.kickoffSoon);
  const showInlineQuizSummary =
    hostsQuiz &&
    Boolean(quiz) &&
    !confirmed &&
    quizStatus !== "editing" &&
    (editMode === "read" || editMode === "correct");
  const inlineOpenCount = unansweredReviewCount(reviewRows);
  const showReview =
    Boolean(quiz) &&
    quizStatus !== "editing" &&
    ((hostsQuiz && reviewReady) ||
      (hostsKickoff &&
        (reviewReady || confirmed || officerKickoffDecide)));
  const showLinkedWorks =
    showReview &&
    Boolean(permitResult) &&
    (hostsQuiz || hostsKickoff);
  const showQuizNudge =
    hostsQuiz &&
    Boolean(quiz) &&
    !showReview &&
    !showLinkedWorks &&
    contractorCanWrite &&
    (quizStatus === "idle" || quizStatus === "paused");
  const showContractorDoneSticky =
    hideContractorDoneBanner && Boolean(quiz) && hostsQuiz;
  const nudgeSticky = quiz ? quizStickyCopy(quiz.state, unit, role) : null;
  const nudgeProgress = quiz ? quizProgress(quiz.state, unit) : null;
  const certainty = stepCertainty(step, quiz?.flags ?? null);
  const showPossible =
    certainty === "possible" && Boolean(quiz) && !isPtwPack && !confirmed;
  const packTypeRows =
    packMembers && packMembers.length > 0
      ? packMembers.map((member) => (
          <PermitPackRow
            key={member.step.name}
            member={member}
            stageName={stageName}
            role={role}
            unit={unit}
            highlighted={highlightStepName === member.step.name}
            highlightDocId={highlightDocId}
            timing={memberDurations.get(member.step.name)}
            possible={
              stepCertainty(member.step, quiz?.flags ?? null) === "possible"
            }
            possibleLabel={possibleChip(editMode)}
            onPreview={onPreviewDoc}
          />
        ))
      : null;
  const packTypesBlock = packTypeRows ? (
    <div className="flex w-full flex-col gap-3">
      <h4 className={LABEL_CAPS}>
        {PTW_PACK_TYPES_LABEL}
      </h4>
      <ul className="overflow-hidden rounded-[var(--radius-md)] border border-grey-200 bg-white">
        {packTypeRows}
      </ul>
    </div>
  ) : null;
  const showPossibleDecide = showPossible && Boolean(quiz) && hasAnswers;
  const showPackDecide = Boolean(
    isPtwPack && packTypesBlock && hasAnswers && !confirmed,
  );
  const showContractorScreenerCta =
    role === "contractor" &&
    confirmed &&
    (isPtwPack || hostsPostKickoffPack);
  const showCardFooter =
    (showLinkedWorks && !hideContractorDoneBanner) ||
    (showReview && !hideContractorDoneBanner) ||
    showQuizNudge ||
    showContractorDoneSticky ||
    showInlineQuizSummary ||
    showPossibleDecide ||
    showPackDecide;

  const hasRail =
    guides.length > 0 || samples.length > 0 || packSystems.length > 0;

  return (
    <article
      id={stepDomId(stageName, step.name)}
      className={cn(
        "flex flex-col gap-4 rounded-[var(--radius-2xl)] bg-white p-4 tablet:gap-6 tablet:p-6",
        "scroll-mt-[8rem] tablet:scroll-mt-[6rem] desktop:scroll-mt-8",
        jumpedTo
          ? "shadow-[0_0_0_2px_rgba(122,53,176,0.28),0px_6px_20px_rgba(18,18,18,0.08)] tablet:shadow-[0_0_0_4px_rgba(122,53,176,0.28),0px_6px_20px_rgba(18,18,18,0.08)]"
          : "shadow-[var(--shadow-light-bg)]",
      )}
    >
      <div
        className={cn(
          "flex flex-col gap-4 tablet:gap-6",
          hasRail && "desktop:grid desktop:grid-cols-8 desktop:items-start desktop:gap-6",
        )}
      >
      <div className={cn("flex min-w-0 flex-col gap-4 tablet:gap-6", hasRail && "desktop:col-span-5")}>
      <div className="flex flex-col gap-4">
        <p className={LABEL_CAPS}>
          {stageName}
        </p>
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg leading-[22px] font-bold text-black">
              {cardTitle(role, stageName, isPtwPack ? PTW_PACK_HOST : step.name)}
            </h3>
            {showPossible && (
              <MayApplyChip
                label={possibleChip(editMode)}
                hint={possibleChipHint(editMode, tenantFilledUnaligned)}
              />
            )}
          </div>
          {lead && (
            <p className="text-base leading-5 text-grey-700">{lead}</p>
          )}
        </div>
        {showPossible && !hasAnswers && (
          <p className="text-sm leading-[18px] text-grey-600">
            {editMode === "correct"
              ? quizCopy.officerPossibleEmptyLine
              : possibleCopy(editMode)}
          </p>
        )}
        {whenRows.length > 0 && <WhenChips rows={whenRows} role={role} />}
        {mainRows.length > 0 ? (
          <PartyLineList rows={mainRows} />
        ) : (
          subheader && (
            <p className="text-base leading-5 text-grey-600">
              {subheader}
            </p>
          )
        )}
      </div>

      {howRows.length > 0 && (
        <FieldSection label="How">
          <PartyLineList rows={howRows} size="how" />
        </FieldSection>
      )}

      {showContractorScreenerCta && <ScreenerPrepBanner />}

      {isPtwPack && packTypesBlock && (!showPackDecide || officerCanWrite) &&
        packTypesBlock}

      {showPermitResults && !showLinkedWorks && !showInlineQuizSummary && permitResult && (
        <FieldSection label={quizCopy.resultsLabel}>
          <PermitList
            result={permitResult}
            unit={unit}
            role={role}
            stageName={stageName}
            highlightedDocId={highlightDocId}
            onPreview={onPreviewDoc}
          />
        </FieldSection>
      )}

      {showKickoffChecklist && !showLinkedWorks && permitResult && (
        <FieldSection
          label={
            permitResult.confirmed
              ? quizCopy.kickoffPermitsLabelAgreed
              : quizCopy.kickoffPermitsLabel
          }
        >
          <PermitList
            result={permitResult}
            unit={unit}
            role={role}
            stageName={stageName}
            highlightedDocId={highlightDocId}
            onPreview={onPreviewDoc}
          />
        </FieldSection>
      )}

      {showOnlyIf && (
        <FieldSection label="Only if">
          <div
            className={
              showParty ? "flex flex-col gap-4" : undefined
            }
          >
            {groupByParty(
              onlyIf.map((row) => ({
                ...row,
                labels: showParty ? row.labels : undefined,
              })),
            ).map((group, gi) => (
              <div key={`${gi}-${group.key}`} className="flex flex-col gap-2">
                {showParty && group.labels.length > 0 && (
                  <PartyHead labels={group.labels} />
                )}
                <ul className="flex flex-col gap-3">
                  {group.rows.map((row) => (
                    <li
                      key={`${row.workIf}-${row.line}`}
                      className="flex items-start gap-1.5"
                    >
                      <span className="mt-0.5 shrink-0">
                        <IconLeaf
                          src={dotIcon}
                          leafW={5.33}
                          leafH={5.33}
                          frame={16}
                        />
                      </span>
                      <div className="min-w-0 flex-1">
                        {row.workIf && (
                          <p className="text-xs font-bold leading-4 text-grey-500">
                            {row.workIf}
                          </p>
                        )}
                        <p className="text-sm leading-[18px] text-grey-900">
                          {row.line}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </FieldSection>
      )}

      </div>

      {hasRail && (
        <aside className="flex min-w-0 flex-col gap-6 border-t border-grey-100 pt-4 desktop:col-span-3 desktop:border-l desktop:border-t-0 desktop:pt-0 desktop:pl-6">
          <SystemTypeGroup
            systems={packSystems}
            stageName={stageName}
            stepName={step.name}
            highlightedLabel={highlightSystemLabel}
          />
          <DocTypeGroup
            label="Guides"
            docs={guides}
            stageName={stageName}
            stepName={step.name}
            highlightedDocId={highlightDocId}
            onPreview={onPreviewDoc}
            flush
          />
          <DocTypeGroup
            label="Samples"
            docs={samples}
            stageName={stageName}
            stepName={step.name}
            highlightedDocId={highlightDocId}
            onPreview={onPreviewDoc}
            flush
          />
        </aside>
      )}
      </div>
      {showCardFooter && (
        <div className="min-w-0">
          {showPossibleDecide && quiz && (
            officerCanWrite ? (
              <Banner
                onActivate={quiz.onEdit}
                activateLabel={possibleCopy(editMode, tenantFilledUnaligned)}
              >
                {possibleCopy(editMode, tenantFilledUnaligned)}
              </Banner>
            ) : (
            <Banner
              fold={!canWriteQuiz}
              subtitle={canWriteQuiz ? quizCopy.possibleDecideSub : undefined}
              body={
                canWriteQuiz ? undefined : (
                  <p className="text-sm leading-[18px] text-grey-700">
                    {possibleCopy(editMode, tenantFilledUnaligned)}
                  </p>
                )
              }
            >
              {canWriteQuiz
                ? quizCopy.possibleDecideLine
                : possibleCopy(editMode, tenantFilledUnaligned)}
            </Banner>
            )
          )}
          {showPackDecide && packTypesBlock && (
            officerCanWrite && quiz ? (
              <Banner
                onActivate={quiz.onEdit}
                activateLabel={possibleCopy(editMode, tenantFilledUnaligned)}
              >
                {possibleCopy(editMode, tenantFilledUnaligned)}
              </Banner>
            ) : (
            <Banner
              fold
              defaultOpen
              subtitle={canWriteQuiz ? quizCopy.packDecideSub : undefined}
              body={packTypesBlock}
            >
              {canWriteQuiz
                ? quizCopy.packDecideLine
                : possibleCopy(editMode, tenantFilledUnaligned)}
            </Banner>
            )
          )}
          {showLinkedWorks && permitResult && !hideContractorDoneBanner && (
            officerKickoffDecide && quiz ? (
              <OfficerConfirmBanner
                title={reviewBannerTitle}
                confirmed={confirmed}
                onConfirm={quiz.onConfirm}
                onEdit={quiz.onEdit}
              >
                {confirmed ? (
                  <QuizWorksLink
                    rows={reviewRows}
                    role={role}
                    unit={unit}
                    stageName={stageName}
                    confirmed={confirmed}
                    highlightedDocId={highlightDocId}
                    onPreview={onPreviewDoc}
                  />
                ) : (
                  <QuizAnswerReview rows={reviewRows} />
                )}
              </OfficerConfirmBanner>
            ) : (
            <Banner
              fold
              tone={confirmed ? "quiet" : "warn"}
              defaultOpen={
                officerPending ||
                confirmed ||
                (hostsQuiz && editMode !== "fill")
              }
              body={
                <div className="flex w-full flex-col gap-4">
                  {confirmed && permitResult ? (
                    <>
                      <PermitList
                        result={permitResult}
                        unit={unit}
                        role={role}
                        stageName={stageName}
                        highlightedDocId={highlightDocId}
                        onPreview={onPreviewDoc}
                      />
                      {role !== "contractor" ? <ScreenerCta role={role} /> : null}
                    </>
                  ) : officerPending ? (
                    <>
                      <QuizAnswerReview rows={reviewRows} />
                      {hostsQuiz && quiz ? (
                        <div className="border-t border-grey-200 pt-4">
                          <GuideCta tone="ghost" onClick={quiz.onEdit}>
                            {quizCopy.officerEditCta}
                          </GuideCta>
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <QuizWorksLink
                      rows={reviewRows}
                      role={role}
                      unit={unit}
                      stageName={stageName}
                      confirmed={confirmed}
                      highlightedDocId={highlightDocId}
                      onPreview={onPreviewDoc}
                      actions={
                        hostsQuiz && contractorCanWrite && quiz ? (
                          <GuideCta
                            tone="ghost"
                            onClick={() => quiz.onOpenQuiz(true)}
                          >
                            {quizStatus === "paused"
                              ? quizCopy.resumeCta
                              : "Edit Answers"}
                          </GuideCta>
                        ) : undefined
                      }
                    />
                  )}
                </div>
              }
            >
              {reviewBannerTitle}
            </Banner>
            )
          )}
          {showReview && !showLinkedWorks && !hideContractorDoneBanner && (
            officerKickoffDecide && quiz ? (
              <OfficerConfirmBanner
                title={reviewBannerTitle}
                confirmed={confirmed}
                onConfirm={quiz.onConfirm}
                onEdit={quiz.onEdit}
              >
                <QuizAnswerReview rows={reviewRows} />
              </OfficerConfirmBanner>
            ) : (
            <Banner
              fold
              tone={confirmed ? "quiet" : "warn"}
              defaultOpen={
                officerPending ||
                confirmed ||
                (hostsQuiz && editMode !== "fill")
              }
              body={
                <div className="flex w-full flex-col gap-4">
                  {confirmed && permitResult ? (
                    <>
                      <PermitList
                        result={permitResult}
                        unit={unit}
                        role={role}
                        stageName={stageName}
                        highlightedDocId={highlightDocId}
                        onPreview={onPreviewDoc}
                      />
                      {role !== "contractor" ? <ScreenerCta role={role} /> : null}
                    </>
                  ) : (
                    <QuizAnswerReview rows={reviewRows} />
                  )}
                  {confirmed && permitResult ? null : confirmed ? (
                    <div className="border-t border-grey-200 pt-4">
                      {role !== "contractor" ? <ScreenerCta role={role} /> : null}
                    </div>
                  ) : hostsQuiz && contractorCanWrite && quiz ? (
                    <div className="border-t border-grey-200 pt-4">
                      <GuideCta
                        tone="ghost"
                        onClick={() => quiz.onOpenQuiz(true)}
                      >
                        {quizStatus === "paused"
                          ? quizCopy.resumeCta
                          : "Edit Answers"}
                      </GuideCta>
                    </div>
                  ) : hostsQuiz && officerCanWrite && quiz ? (
                    <div className="border-t border-grey-200 pt-4">
                      <GuideCta tone="ghost" onClick={quiz.onEdit}>
                        {quizCopy.officerEditCta}
                      </GuideCta>
                    </div>
                  ) : null}
                </div>
              }
            >
              {reviewBannerTitle}
            </Banner>
            )
          )}
          {showInlineQuizSummary && quiz && (
            <Banner
              fold
              tone={tenantWaitingOnContractor ? "quiet" : "warn"}
              hint={
                tenantWaitingOnContractor
                  ? tenantIdleSoon
                    ? quizCopy.tenantIdleSoonHint
                    : quizCopy.tenantIdleHint
                  : inlineOpenCount > 0
                    ? `${inlineOpenCount} not answered`
                    : undefined
              }
              subtitle={
                tenantWaitingOnContractor
                  ? tenantIdleSoon
                    ? quizCopy.tenantIdleSoonHint
                    : quizCopy.tenantIdleHint
                  : inlineOpenCount > 0
                    ? `${inlineOpenCount} not answered`
                    : undefined
              }
              footer={
                officerCanWrite ? (
                  <GuideCta tone="ghost" onClick={quiz.onEdit}>
                    {quizCopy.officerEditCta}
                  </GuideCta>
                ) : undefined
              }
              body={<QuizAnswerReview rows={reviewRows} />}
            >
              {tenantWaitingOnContractor
                ? quizCopy.tenantIdleSoonTitle
                : reviewBannerTitle}
            </Banner>
          )}
          {(showQuizNudge || showContractorDoneSticky) &&
            quiz &&
            nudgeSticky &&
            nudgeProgress && (
            <WorksSticky
              title={nudgeSticky.title}
              subtitle={nudgeSticky.subtitle}
              cta={nudgeSticky.cta}
              answered={nudgeProgress.answered}
              total={nudgeProgress.total}
              track={nudgeSticky.track}
              tip={nudgeSticky.tip}
              onOpen={() => quiz.onOpenQuiz(true)}
            />
          )}
        </div>
      )}
    </article>
  );
}
