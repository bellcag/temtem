import {
  Children,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
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
  needLabel,
  supplierLine,
  supportingDocsFor,
} from "@/lib/process-permit-supporting-docs";
import {
  foldPtwPackSteps,
  PTW_PACK_HOST,
  PTW_PACK_TYPES_LABEL,
} from "@/lib/process-ptw-pack";
import {
  answerSummaryLines,
  applySlugsToQuiz,
  completeAnswers,
  dismissSlugsFromQuiz,
  EMPTY_QUIZ,
  filterClassifiedByPlannedWorks,
  injectPlannedWorksQuiz,
  isOptionOn,
  KICKOFF_STAGE_NAME,
  KICKOFF_STEP_NAME,
  NONE_ID,
  NOT_SURE_ID,
  questionsForUnit,
  quizCanWrite,
  quizCopy,
  quizEditMode,
  quizHasSavedAnswers,
  quizIsConfirmed,
  quizNeedsOfficerGuide,
  quizPermitResult,
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
  type SlugFlag,
} from "@/lib/process-planned-works-quiz";
import {
  hitsForQuery,
  matchNeedles,
  preferredHitForQuery,
  QUICK_LINK_CANDIDATES,
  normalizeQuery,
  type CardSearchSurface,
  type SearchHit,
  type SearchVerb,
} from "@/lib/process-v15-search";
import { DocumentPreviewDrawer } from "@/components/DocumentPreviewDrawer";
import { cn } from "@/lib/utils";
import caretDown from "@/assets/figma/caret-down.svg";
import caretUp from "@/assets/figma/caret-up.svg";
import chevronRight from "@/assets/figma/chevron-right.svg";
import closeIcon from "@/assets/figma/close.svg";
import dotIcon from "@/assets/figma/dot.svg";
import externalLink from "@/assets/figma/external-link.svg";
import infoIcon from "@/assets/figma/info.svg";
import linkIcon from "@/assets/figma/link.svg";
import pdfIcon from "@/assets/figma/pdf.svg";

const LS_KEY = "tempo:v17:lastPhase";
const LS_OUTLET = "tempo:v7:outlet";
const LS_JOB = "tempo:v7:job";

type ContractorJob = {
  id: string;
  label: string;
  unit: Unit;
  appointed: boolean;
  kickoffSoon?: boolean;
};

const CONTRACTOR_JOBS: ContractorJob[] = [
  {
    id: "job-kopi-t3",
    label: "Kopi & Co. · T3-AS-114",
    unit: UNITS[0],
    appointed: true,
  },
  {
    id: "job-kopi-t2",
    label: "Kopi & Co. · T2-AS-045",
    unit: UNITS[2],
    appointed: true,
    kickoffSoon: true,
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
    appointed: true,
  },
  {
    id: "job-pending-t2",
    label: "Pending appointment · T2-AS-045",
    unit: UNITS[2],
    appointed: false,
  },
];

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

/** Viewport line the spy treats as “here” — never follow the search card off-screen. */
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
  return (
    visiblePinEl(
      document.querySelector<HTMLElement>(".process-search-sticky.is-stuck"),
    ) ?? visiblePinEl(document.getElementById("process-v18-search-bar"))
  );
}

/** Pin a card just below the stuck You-are-here bar (or the in-flow search). */
function alignCardToRail(el: HTMLElement, behavior: ScrollBehavior = "smooth") {
  const search = railPinEl();
  const scroller = nearestScroller(el);
  const pinTop = search ? search.getBoundingClientRect().bottom + 16 : 32;
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

function OutlineChip({
  children,
  warn,
}: {
  children: string;
  warn?: boolean;
}) {
  if (warn) {
    return (
      <span className="inline-flex h-6 w-fit shrink-0 items-center rounded-[var(--radius-sm)] bg-warning-200 px-2 text-[11px] leading-[14px] font-bold text-warning-800">
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
      <h4 className="text-xs font-bold uppercase tracking-[0.08em] text-grey-400">
        {label}
      </h4>
      {children}
    </section>
  );
}

/** Possible-apply nudge — cream panel with the fill action. */
function Banner({
  children,
  actions,
  body,
  fold,
  compact,
  defaultOpen = false,
}: {
  children?: ReactNode;
  actions?: ReactNode;
  body?: ReactNode;
  fold?: boolean;
  compact?: boolean;
  defaultOpen?: boolean;
}) {
  const panelId = useId();
  const [open, setOpen] = useState(defaultOpen);
  const headerIcon = (
    <span aria-hidden className="inline-flex shrink-0">
      <IconLeaf src={infoIcon} leafW={16} leafH={16} frame={16} />
    </span>
  );
  const message = children ? (
    <p
      className={cn(
        "min-w-0 flex-1 font-bold text-grey-700",
        compact
          ? "truncate text-sm leading-[18px]"
          : "text-base leading-5",
      )}
    >
      {children}
    </p>
  ) : null;
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col gap-3 rounded-[var(--radius-md)] border border-warning-200 bg-warning-100 px-3",
        fold && open ? "py-3" : "py-2",
      )}
    >
      {fold ? (
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center gap-2 text-left focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--color-purple-600)]"
        >
          {headerIcon}
          {message}
          <span
            className="inline-flex size-7 shrink-0 items-center justify-center"
            aria-hidden
          >
            <IconLeaf
              src={caretUp}
              leafW={12}
              leafH={7}
              frame={16}
              rotate={open ? undefined : 180}
            />
          </span>
        </button>
      ) : (
        <div className="flex items-center gap-2">
          {headerIcon}
          {message}
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
      )}
      {fold
        ? open && (
            <div id={panelId} className="flex flex-col items-start gap-3">
              {actions}
              {body}
            </div>
          )
        : body}
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
  "inline-flex w-fit shrink-0 items-center rounded-full border border-blue-600 bg-blue-100 px-2 py-1 text-[11px] leading-[14px] font-bold whitespace-nowrap text-blue-600";
/** Status chip — only when Planned works has not confirmed this row. */
const CHIP_MAY_APPLY =
  "inline-flex h-6 w-fit shrink-0 items-center rounded-[var(--radius-sm)] bg-warning-100 px-2 text-[11px] leading-[14px] font-bold text-warning-600";

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
      <h4 className="text-xs font-bold uppercase tracking-[0.08em] text-grey-400">
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
      <h4 className="text-xs font-bold uppercase tracking-[0.08em] text-grey-400">
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

function possibleCopy(mode: QuizEditMode) {
  if (mode === "read") return quizCopy.tenantPossibleLine;
  if (mode === "correct") return quizCopy.officerPossibleLine;
  return quizCopy.possibleLine;
}

function possibleChip(mode: QuizEditMode) {
  if (mode === "read") return quizCopy.tenantPossibleChip;
  if (mode === "correct") return quizCopy.officerPossibleChip;
  return quizCopy.possibleChip;
}

function QuizNudge({
  status,
  mode,
  onOpen,
}: {
  status: QuizState["status"];
  mode: QuizEditMode;
  onOpen: () => void;
}) {
  const title =
    mode === "read"
      ? quizCopy.bannerTenantTitle
      : mode === "correct"
        ? quizCopy.bannerOfficerTitle
        : quizCopy.bannerContractorTitle;
  const text =
    mode === "read"
      ? quizCopy.bannerTenant
      : mode === "correct"
        ? quizCopy.bannerOfficer
        : status === "paused"
          ? quizCopy.bannerContractorPaused
          : quizCopy.bannerContractor;
  const cta =
    mode === "fill"
      ? status === "idle"
        ? quizCopy.startCta
        : status === "paused"
          ? quizCopy.resumeCta
          : status === "done"
            ? quizCopy.confirmCta
            : "Finish questions"
      : mode === "correct"
        ? quizCopy.officerConfirmCta
        : quizCopy.reviewCta;
  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-2xl)] border border-purple-200 bg-purple-100 px-4 py-3 shadow-[var(--shadow-light-bg)] tablet:flex-row tablet:items-center tablet:justify-between tablet:gap-4">
      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-sm leading-[18px] font-bold text-black">{title}</p>
        <p className="text-sm leading-[18px] text-grey-700">{text}</p>
      </div>
      <button
        type="button"
        onClick={onOpen}
        className="inline-flex h-8 w-fit shrink-0 items-center self-start rounded-[var(--radius-sm)] bg-purple-600 px-3 text-sm leading-[18px] font-bold whitespace-nowrap text-white hover:bg-purple-700 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
      >
        {cta}
      </button>
    </div>
  );
}

function WorksSticky({
  title,
  cta,
  onOpen,
}: {
  title: string;
  cta: string;
  onOpen: () => void;
}) {
  return (
    <Banner
      compact
      actions={<GuideCta onClick={onOpen}>{cta}</GuideCta>}
    >
      {title}
    </Banner>
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
      className="flex w-full gap-1 rounded-[var(--radius-xl)] border border-grey-200 bg-grey-50 p-1 tablet:w-fit desktop:w-full"
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
              "h-9 min-w-0 flex-1 rounded-[var(--radius-md)] px-2 text-sm leading-[18px] text-grey-700 tablet:flex-none tablet:px-3",
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

function PossibleDecideActions({
  onApply,
  onDismiss,
}: {
  onApply: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <GuideCta tone="ghost" onClick={onApply}>
        {quizCopy.thisAppliesCta}
      </GuideCta>
      <GuideCta tone="text" onClick={onDismiss}>
        {quizCopy.doesNotApplyCta}
      </GuideCta>
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
}: {
  open: boolean;
  questions: QuizQuestion[];
  state: QuizState;
  onToggle: (questionId: QuestionId, optionId: string) => void;
  onSave: () => void;
  onClose: () => void;
}) {
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
    <div className="fixed inset-0 z-50 flex justify-end">
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
        className="relative mt-auto flex max-h-[90vh] w-full flex-col rounded-t-[var(--radius-2xl)] border-t border-grey-100 bg-white shadow-[var(--shadow-light-bg)] tablet:mt-0 tablet:h-full tablet:max-h-none tablet:max-w-xl tablet:rounded-none tablet:border-t-0 tablet:border-l desktop:max-w-xl"
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
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-sm)] text-black hover:bg-grey-50 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
          >
            <IconLeaf src={closeIcon} leafW={12} leafH={12} frame={16} />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 tablet:px-5">
          <PlannedWorksForm
            questions={questions}
            state={state}
            onToggle={onToggle}
          />
          <p className="mt-4 text-sm leading-[18px] text-grey-700">
            {quizCopy.pauseHint}
          </p>
        </div>
        <footer className="border-t border-grey-75 px-4 py-3 tablet:px-5">
          <GuideCta className="w-full tablet:w-fit" onClick={onSave}>
            {quizCopy.sheetSaveCta}
          </GuideCta>
        </footer>
      </aside>
    </div>
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
}: {
  name: string;
  unit: Unit;
  role: Role;
  stageName: string;
  stepName: string;
  highlightedDocId?: string | null;
  onPreview: (id: string) => void;
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
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm leading-[18px] text-grey-700">{explain.what}</p>
      <p className="text-sm leading-[18px] text-grey-700">{explain.why(unit)}</p>
      <p className="text-sm leading-[18px] text-grey-700">{explain.who[role]}</p>
      {other && (
        <p className="text-sm leading-[18px] text-grey-700">{other}</p>
      )}
      <div className="flex flex-col gap-1.5 pt-1">
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-grey-400">
          Supporting documents
        </p>
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
          <ul className="flex flex-col overflow-hidden rounded-[var(--radius-md)] border border-grey-100 bg-white">
            {supporting.docs.map((doc) => (
              <li
                key={doc.name}
                className="flex flex-col gap-0.5 border-t border-grey-100 px-3 py-2 first:border-t-0"
              >
                <p className="text-sm leading-[18px] font-bold text-black">
                  {doc.name}
                </p>
                <p className="text-[11px] leading-[14px] text-grey-600">
                  {needLabel(doc.need)} · {supplierLine(doc.supplier, role)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
      {samples.length > 0 && (
        <div className="flex flex-col gap-1.5 pt-1">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-grey-400">
            Samples
          </p>
          <ul className="overflow-hidden rounded-[var(--radius-md)] border border-grey-100 bg-grey-25">
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
        </div>
      )}
    </div>
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
  onApply,
  onDismiss,
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
  onApply?: () => void;
  onDismiss?: () => void;
}) {
  const title = cardTitle(role, stageName, member.step.name);
  const explain = permitExplainFor(member.step.name) ?? permitExplainFor(title);
  const panelId = useId();
  const [open, setOpen] = useState(
    highlighted || member.step.name === "Renovation (Terminal) Permit",
  );
  useEffect(() => {
    if (highlighted) setOpen(true);
  }, [highlighted]);
  const what = stepWhat(member.step, role);
  const timingRow = timing ? (
    <WhenChip duration={timing.duration} kind={timing.kind} />
  ) : null;
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
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center gap-2 px-3 py-2.5 text-left hover:bg-grey-50 focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--color-purple-600)]"
        >
          <span className="min-w-0 flex-1 text-sm leading-[18px] font-bold text-black">
            {title}
          </span>
          {possible && <span className={CHIP_MAY_APPLY}>{possibleLabel}</span>}
          <span
            className={cn("inline-flex shrink-0 text-grey-500", open && "rotate-180")}
            aria-hidden
          >
            <IconLeaf src={caretDown} leafW={10} leafH={5.83} frame={12} />
          </span>
        </button>
      ) : (
        <div className="flex items-center gap-2 px-3 py-2.5">
          <p className="min-w-0 flex-1 text-sm leading-[18px] font-bold text-black">
            {title}
          </p>
          {possible && <span className={CHIP_MAY_APPLY}>{possibleLabel}</span>}
        </div>
      )}
      {possible && onApply && onDismiss && (
        <div className="px-3 pb-2.5">
          <PossibleDecideActions onApply={onApply} onDismiss={onDismiss} />
        </div>
      )}
      {explain && open && (
        <div
          id={panelId}
          className="flex flex-col gap-2 border-t border-grey-100 bg-grey-50 px-3 py-2.5"
        >
          {timingRow}
          <p className="text-sm leading-[18px] text-grey-600">{what}</p>
          <PermitExplainBody
            name={member.step.name}
            unit={unit}
            role={role}
            stageName={stageName}
            stepName={member.step.name}
            highlightedDocId={highlightDocId}
            onPreview={onPreview}
          />
        </div>
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
  const panelId = useId();
  const [open, setOpen] = useState(false);
  return (
    <li className="border-t border-grey-100 first:border-t-0">
      {explain ? (
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
          className="flex w-full min-w-0 items-center gap-2 px-3 py-2.5 text-left hover:bg-grey-50 focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--color-purple-600)]"
        >
          <span className="min-w-0 flex-1 text-sm leading-[18px] font-bold text-black">
            {name}
          </span>
          {badge && (
            <span className="inline-flex h-[18px] shrink-0 items-center rounded-[var(--radius-sm)] border border-grey-200 px-1.5 text-[11px] leading-[14px] font-bold text-grey-700">
              {badge}
            </span>
          )}
          <span
            className={cn("inline-flex shrink-0 text-grey-500", open && "rotate-180")}
            aria-hidden
          >
            <IconLeaf src={caretDown} leafW={10} leafH={5.83} frame={12} />
          </span>
        </button>
      ) : (
        <div className="flex min-w-0 items-center gap-2 px-3 py-2.5">
          <span className="min-w-0 flex-1 text-sm leading-[18px] font-bold text-black">
            {name}
          </span>
          {badge && (
            <span className="inline-flex h-[18px] shrink-0 items-center rounded-[var(--radius-sm)] border border-grey-200 px-1.5 text-[11px] leading-[14px] font-bold text-grey-700">
              {badge}
            </span>
          )}
        </div>
      )}
      {explain && open && (
        <div id={panelId} className="border-t border-grey-100 bg-grey-50 px-3 py-2.5">
          <PermitExplainBody
            name={name}
            unit={unit}
            role={role}
            stageName={stageName}
            stepName={name}
            highlightedDocId={highlightedDocId}
            onPreview={onPreview}
          />
        </div>
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
      <GuideCta className="w-full tablet:w-fit" onClick={onEdit}>
        {quizCopy.officerUpdateCta}
      </GuideCta>
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
        "flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left",
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

function QuizReviewLines({ row }: { row: QuizReviewRow }) {
  const open = row.flag === "not-sure" || row.flag === "unanswered";
  return (
    <div className="grid min-w-0 grid-cols-1 items-baseline gap-y-0.5 tablet:grid-cols-[minmax(7.5rem,38%)_1fr] tablet:gap-x-4">
      <p className="text-sm leading-[18px] text-grey-800">{row.topic}</p>
      {open ? (
        <p className="text-sm leading-[18px] italic text-grey-800">
          {row.detail}
        </p>
      ) : (
        <p className="min-w-0 text-sm leading-[18px] font-bold break-words text-black">
          {row.detail}
        </p>
      )}
    </div>
  );
}

function QuizAnswerReview({ rows }: { rows: QuizReviewRow[] }) {
  return (
    <ul className="flex flex-col divide-y divide-grey-200">
      {rows.map((row) => (
        <li key={row.questionId} className="py-3 first:pt-0 last:pb-0">
          <QuizReviewLines row={row} />
        </li>
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
    (role === "contractor" && stillOpen
      ? null
      : hasExtras && role !== "contractor"
        ? role === "officer"
          ? quizCopy.linkedLeadOfficer
          : quizCopy.linkedLeadTenant
        : quizCopy.extrasHow[role]);
  const foot = hasExtras
    ? permitListCaveat(role, confirmed)
    : stillOpen
      ? null
      : quizCopy.resultsMainOnly;
  return (
    <div className="flex flex-col gap-4">
      {extrasLead && (
        <p className="text-sm leading-[18px] text-grey-800">{extrasLead}</p>
      )}
      <ul className="flex flex-col divide-y divide-grey-200">
        {rows.map((row) => {
          return (
            <li
              key={row.questionId}
              className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0"
            >
              <QuizReviewLines row={row} />
              {row.permits.length > 0 && (
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
              )}
            </li>
          );
        })}
      </ul>
      {foot && (
        <p className="text-sm leading-[18px] text-grey-800">{foot}</p>
      )}
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
}: {
  questions: QuizQuestion[];
  state: QuizState;
  onToggle: (questionId: QuestionId, optionId: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      {questions.map((question) => {
        const answer = state.answers?.[question.id] ?? { kind: "unanswered" };
        return (
          <div key={question.id} className="flex flex-col gap-2">
            <p className="text-sm leading-[18px] font-bold text-black">
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
              <CheckRow
                label="Not sure yet"
                exclusive
                on={isOptionOn(answer, NOT_SURE_ID)}
                onToggle={() => onToggle(question.id, NOT_SURE_ID)}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

function searchVerbForDoc(doc: DocItem): SearchVerb {
  if (doc.externalUrl) return "Open";
  return verbForDoc(doc) === "Read" ? "Read" : "Download";
}

type QuizSearchBits = {
  kickoffSoon: boolean;
  state: QuizState;
  questions: QuizQuestion[];
  summary: string[];
  flags: Record<PlannedWorkSlug, SlugFlag> | null;
  permitResult: QuizPermitResult | null;
};

function cardSearchSurface(
  classified: ClassifiedStep,
  stageName: string,
  phaseId: Phase["id"],
  role: Role,
  unit: Unit,
  quiz: QuizSearchBits | null,
): CardSearchSurface {
  const { step, mine, others } = classified;
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
    }))
    .filter((row): row is { workIf: string; line: string } => Boolean(row.line));

  const docs = docsForStep(
    step.name,
    unit.tenancyType,
    unit.terminal,
    unit.zone,
    stageName,
  );
  const hostsQuiz = Boolean(quiz) && step.name === QUIZ_STEP_NAME;
  const quizStatus = quiz?.state.status ?? "idle";

  const copy = lifeSgCard(role, stageName, step.name);
  const lead = cardLead(role, stageName, step.name);
  const rawSubheader = copy?.subheader ?? purpose;
  const subheaderLines = Array.isArray(rawSubheader)
    ? rawSubheader
    : rawSubheader
      ? [rawSubheader]
      : [];
  const subheader = subheaderLines.join(" ");
  const remainingHow = copy ? (copy.how ?? []) : howLines;
  const whenRows = timingsForStep(stageName, step.name, unit, role);
  const showOnlyIf = onlyIf.length > 0 && !copy?.hideOnlyIf;
  const packSystems = mergeSystems(
    packSystemsNamedIn(subheader, role),
    ...remainingHow.map((line) => packSystemsNamedIn(line, role)),
    ...(showOnlyIf
      ? onlyIf.map((row) => packSystemsNamedIn(row.line, role))
      : []),
  );
  const { guides, samples } = splitStepDocs(docs);
  const hostsKickoff =
    stageName === KICKOFF_STAGE_NAME && step.name === KICKOFF_STEP_NAME;
  const showKickoffCorrection =
    Boolean(quiz) && quizStatus === "done" && hostsKickoff;
  const certainty = stepCertainty(step, quiz?.flags ?? null);

  const bullets = [
    ...(lead ? [lead] : []),
    ...subheaderLines,
    ...whenRows.flatMap((row) =>
      [row.duration, row.workIf].filter((v): v is string => Boolean(v)),
    ),
    ...remainingHow,
    ...(showOnlyIf
      ? onlyIf.flatMap((row) => [row.workIf, row.line].filter(Boolean))
      : []),
    ...(hostsQuiz && quizStatus === "editing"
      ? (quiz?.questions.flatMap((q) => [
          q.prompt,
          ...q.options.map((o) => o.label),
          "None of these",
          "Not sure yet",
        ]) ?? [])
      : []),
    ...(hostsQuiz && quiz && quizHasSavedAnswers(quiz.state)
      ? quizReviewRows(quiz.state, unit).flatMap((row) => [
          row.prompt,
          row.detail,
          ...row.permits,
        ])
      : []),
    ...(showKickoffCorrection && quiz
      ? quizReviewRows(quiz.state, unit).flatMap((row) => [
          row.prompt,
          row.detail,
          ...row.permits,
        ])
      : []),
    ...(showKickoffCorrection ? quizCopy.kickoffCorrection : []),
    ...((hostsQuiz || hostsKickoff) && quiz?.permitResult
      ? [
          quizCopy.resultsLabel,
          quiz.permitResult.main,
          ...quiz.permitResult.extras,
          quiz.permitResult.extras.length > 0
            ? quizCopy.resultsExtrasLabel
            : unansweredReviewCount(quizReviewRows(quiz.state, unit)) === 0
              ? quizCopy.resultsMainOnly
              : "",
          quiz.permitResult.caveat,
        ]
      : []),
    ...(!hostsQuiz && certainty === "possible"
      ? [possibleChip(quizEditMode(role)), possibleCopy(quizEditMode(role))]
      : []),
  ];

  return {
    phaseId,
    stageName,
    stepName: step.name,
    displayTitle: cardTitle(role, stageName, step.name),
    bullets,
    docs: [...guides, ...samples].map((doc) => ({
      id: doc.id,
      name: doc.name,
      verb: searchVerbForDoc(doc),
    })),
    systems: packSystems.map((s) => s.label),
  };
}

function fileRowDomId(stageName: string, stepName: string, docId: string) {
  return `file-${stepDomId(stageName, stepName)}-${docId}`;
}

type JourneyItem = {
  stageName: string;
  classified: ClassifiedStep;
  packMembers?: ClassifiedStep[];
};

function blocksForPhase(
  phase: Phase,
  role: Role,
  unit: Unit,
  showQuiz: boolean,
  flags: Record<PlannedWorkSlug, SlugFlag> | null,
) {
  const blocks = phase.stages
    .map((stage) => {
      const { steps } = classifyStage(stage, role, unit);
      return {
        stage,
        steps: flags ? filterClassifiedByPlannedWorks(steps, flags) : steps,
      };
    })
    .filter((b) => b.steps.length > 0);
  return injectPlannedWorksQuiz(blocks, role, showQuiz);
}

type SearchHighlight = {
  stepKey: string;
  docId: string | null;
  systemLabel: string | null;
};

function SearchGlyph({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      <circle cx="7" cy="7" r="5" stroke="#999999" strokeWidth="1.67" />
      <path
        d="M11 11l3.5 3.5"
        stroke="#999999"
        strokeWidth="1.67"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Highlighted({ text, query }: { text: string; query: string }) {
  const needles = matchNeedles(query);
  if (needles.length === 0) return <>{text}</>;
  const re = new RegExp(
    `(${needles.map((n) => escapeRegExp(n)).join("|")})`,
    "gi",
  );
  const parts = text.split(re);
  return (
    <>
      {parts.map((part, i) => {
        const hit = needles.some(
          (n) => n.toLowerCase() === part.toLowerCase(),
        );
        if (!hit) return <span key={i}>{part}</span>;
        return (
          <mark
            key={i}
            className="rounded-[2px] bg-purple-100 text-inherit"
          >
            {part}
          </mark>
        );
      })}
    </>
  );
}

function ChipRow({
  rows,
  disabled,
  align = "start",
  onChip,
}: {
  rows: { chip: string; hit: SearchHit }[];
  disabled?: boolean;
  align?: "start" | "center";
  onChip: (chip: string) => void;
}) {
  if (rows.length === 0) return null;
  return (
    <div
      aria-label="Quick links"
      className={cn(
        "process-chip-scroll -mx-1 flex flex-nowrap gap-2 overflow-x-auto px-1 tablet:mx-0 tablet:flex-wrap tablet:overflow-visible tablet:px-0",
        align === "center" && "tablet:justify-center",
      )}
    >
      {rows.map(({ chip, hit }) => (
        <button
          key={chip}
          type="button"
          disabled={disabled}
          aria-label={`Go to ${hit.displayTitle}`}
          title={hit.displayTitle}
          onClick={() => onChip(chip)}
          className="inline-flex h-8 shrink-0 items-center rounded-full border border-grey-200 bg-white px-3 text-sm leading-[18px] whitespace-nowrap text-grey-700 hover:border-purple-600 hover:bg-purple-100 hover:text-purple-700 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)] disabled:opacity-60"
        >
          {chip}
        </button>
      ))}
    </div>
  );
}

function GuideSearch({
  query,
  hits,
  disabled,
  overlayOpen,
  size = "bar",
  onQuery,
  onClear,
  onJump,
  onOpenOverlay,
}: {
  query: string;
  hits: SearchHit[];
  disabled?: boolean;
  overlayOpen: boolean;
  size?: "hero" | "bar" | "toolbar";
  onQuery: (value: string) => void;
  onClear: () => void;
  onJump: (hit: SearchHit) => void;
  onOpenOverlay: () => void;
}) {
  const active = normalizeQuery(query);
  const showPanel = overlayOpen && !disabled && Boolean(active);
  const hero = size === "hero";
  const toolbar = size === "toolbar";
  return (
    <div className="relative flex min-w-0 w-full flex-col">
      <form
        role="search"
        onSubmit={(e) => e.preventDefault()}
        className="relative"
      >
        <label className="sr-only" htmlFor="process-v18-search">
          Find a step, form, or system
        </label>
        <span
          className={cn(
            "pointer-events-none absolute top-1/2 -translate-y-1/2",
            hero ? "left-5" : toolbar ? "left-3" : "left-3.5",
          )}
        >
          <SearchGlyph size={hero ? 20 : toolbar ? 24 : 16} />
        </span>
        <input
          id="process-v18-search"
          type="search"
          autoComplete="off"
          disabled={disabled}
          placeholder="Find a step, form, or system."
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          onFocus={() => {
            if (active) onOpenOverlay();
          }}
          className={cn(
            "w-full appearance-none border border-grey-200 bg-white text-black placeholder:text-grey-300 disabled:bg-grey-50 disabled:text-grey-300 [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden",
            hero
              ? "h-14 rounded-[var(--radius-md)] py-3 pr-12 pl-14 text-base leading-5 shadow-[0px_1px_2px_rgba(18,18,18,0.05)] tablet:h-16"
              : toolbar
                ? "h-12 rounded-[var(--radius-md)] py-3 pr-12 pl-12 text-base leading-5"
                : "h-10 rounded-[var(--radius-md)] py-2.5 pr-10 pl-10 text-sm leading-[18px] shadow-[0px_1px_2px_rgba(18,18,18,0.05)]",
          )}
        />
        {query.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className={cn(
              "absolute top-1/2 -translate-y-1/2 grid place-items-center rounded-[var(--radius-sm)] hover:bg-grey-50 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]",
              hero || toolbar ? "right-3 size-8" : "right-2 size-7",
            )}
            aria-label="Clear search"
          >
            <IconLeaf src={closeIcon} leafW={12} leafH={12} frame={16} />
          </button>
        )}
      </form>
      {showPanel && (
        <div
          id="process-v18-search-overlay"
          className="absolute inset-x-0 top-full z-40 mt-2 max-h-[min(48vh,400px)] overflow-y-auto rounded-[var(--radius-xl)] border border-grey-100 bg-white shadow-[var(--shadow-light-bg)]"
        >
          {hits.length === 0 ? (
            <div className="flex flex-col gap-3 px-4 py-3">
              <p className="text-sm leading-[18px] text-grey-500">
                {`Nothing matching “${query.trim()}”`}
              </p>
            </div>
          ) : (
            <ul>
              {hits.map((hit) => (
                <li key={hit.id} className="border-t border-grey-100 first:border-t-0">
                  <button
                    type="button"
                    onClick={() => onJump(hit)}
                    className="group flex w-full flex-col gap-0.5 px-4 py-2.5 text-left hover:bg-grey-50 focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--color-purple-600)] tablet:flex-row tablet:items-baseline tablet:gap-2"
                  >
                    <span className="min-w-0 truncate text-sm leading-[18px] font-bold text-black group-hover:text-purple-700">
                      <Highlighted text={hit.displayTitle} query={query} />
                    </span>
                    <span className="hidden text-grey-400 tablet:inline">→</span>
                    <span className="min-w-0 truncate text-sm leading-[18px] text-grey-700 group-hover:text-purple-700">
                      <Highlighted text={hit.target} query={query} />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export function ProcessV18Page() {
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
  const [searchQuery, setSearchQuery] = useState("");
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [searchHighlight, setSearchHighlight] =
    useState<SearchHighlight | null>(null);
  const [searchStuck, setSearchStuck] = useState(false);
  const [quizSheetOpen, setQuizSheetOpen] = useState(false);
  const autoOpenedFor = useRef<string | null>(null);
  const isMobile = useMobileViewport();
  const pinYouAreHere = searchStuck && isMobile;

  const spyLock = useRef(false);
  const holdStuckUntilTop = useRef(false);
  const pendingHit = useRef<SearchHit | null>(null);
  const pendingStageScroll = useRef<{
    stageName: string;
    stepName: string;
  } | null>(null);
  const searchBarRef = useRef<HTMLDivElement | null>(null);
  const searchSentinelRef = useRef<HTMLDivElement | null>(null);

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
    const saved = readQuizState(ctxUnit.id);
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
  }, [showQuiz, ctxUnit.id, role]);

  const selectPhase = (id: Phase["id"]) => {
    setSearchParams({ phase: id });
    window.localStorage.setItem(LS_KEY, id);
    setFocusedStep(null);
    setOverlayOpen(false);
  };

  const showLanding = () => {
    setSearchParams({});
    setFocusedStep(null);
    setSearchHighlight(null);
    pendingHit.current = null;
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
    const safe: QuizState = {
      status: next.status,
      answers: completeAnswers(next.answers),
      confirmed:
        role === "officer"
          ? next.status === "done" || Boolean(next.confirmed)
          : false,
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

  const browsingPhase = Boolean(
    phaseFromUrl && visiblePhases.some((p) => p.id === phaseFromUrl),
  );

  useEffect(() => {
    if (!phaseFromUrl) return;
    if (visiblePhases.some((p) => p.id === phaseFromUrl)) return;
    setSearchParams({}, { replace: true });
  }, [visiblePhases, phaseFromUrl, setSearchParams]);

  const active =
    (browsingPhase
      ? visiblePhases.find((p) => p.id === phaseFromUrl)
      : undefined) ??
    visiblePhases[0] ??
    PHASES[0];

  const showWorksSticky =
    isContractor &&
    showQuiz &&
    browsingPhase &&
    !needsContext &&
    !quizIsConfirmed(quiz);

  const worksSticky = quizStickyCopy(quiz, ctxUnit);

  useEffect(() => {
    const main = document.querySelector("main");
    if (!(main instanceof HTMLElement)) return;
    const stickyChrome = browsingPhase && !needsContext;
    main.style.scrollPaddingTop = isMobile
      ? stickyChrome
        ? showWorksSticky
          ? "16rem"
          : "12rem"
        : "3.5rem"
      : "";
    return () => {
      main.style.scrollPaddingTop = "";
    };
  }, [browsingPhase, needsContext, isMobile, showWorksSticky]);

  const openQuizSheet = (edit = true) => {
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
    setQuizSheetOpen(false);
  };

  useEffect(() => {
    if (!isContractor) setQuizSheetOpen(false);
  }, [isContractor]);

  useEffect(() => {
    if (!isContractor || !showQuiz || !browsingPhase) return;
    if (quizIsConfirmed(quiz) || quizHasSavedAnswers(quiz)) return;
    if (quiz.status !== "idle") return;
    if (autoOpenedFor.current === ctxUnit.id) return;
    autoOpenedFor.current = ctxUnit.id;
    setQuizSheetOpen(true);
  }, [isContractor, showQuiz, browsingPhase, quiz, ctxUnit.id]);

  const stageBlocks = useMemo(() => {
    if (needsContext) return [];
    return blocksForPhase(active, role, ctxUnit, showQuiz, plannedFlags);
  }, [active, role, ctxUnit, needsContext, showQuiz, plannedFlags]);

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

  const searchCards = useMemo(() => {
    if (needsContext) return [];
    const bits: QuizSearchBits | null = showQuiz
      ? {
          kickoffSoon: Boolean(activeJob.kickoffSoon),
          state: quiz,
          questions: quizQuestions,
          summary: quizSummary,
          flags: plannedFlags,
          permitResult,
        }
      : null;
    const cards: CardSearchSurface[] = [];
    for (const phase of visiblePhases) {
      const blocks = blocksForPhase(
        phase,
        role,
        ctxUnit,
        showQuiz,
        plannedFlags,
      );
      for (const b of blocks) {
        for (const classified of b.steps) {
          cards.push(
            cardSearchSurface(
              classified,
              b.stage.name,
              phase.id,
              role,
              ctxUnit,
              bits,
            ),
          );
        }
      }
    }
    return cards;
  }, [
    needsContext,
    visiblePhases,
    role,
    ctxUnit,
    showQuiz,
    plannedFlags,
    activeJob.kickoffSoon,
    quiz,
    quizQuestions,
    quizSummary,
    permitResult,
  ]);

  const searchHits = useMemo(
    () => hitsForQuery(searchCards, searchQuery),
    [searchCards, searchQuery],
  );
  const usualJumps = useMemo(
    () =>
      QUICK_LINK_CANDIDATES.flatMap((chip) => {
        const hit = preferredHitForQuery(searchCards, chip);
        return hit ? [{ chip, hit }] : [];
      }),
    [searchCards],
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

  const syncStuckFromScroll = () => {
    const y = scrollYOf(nearestScroller(searchBarRef.current));
    if (y <= 16) {
      holdStuckUntilTop.current = false;
      setSearchStuck(false);
      return;
    }
    if (holdStuckUntilTop.current) {
      setSearchStuck(true);
      return;
    }
    const sentinel = searchSentinelRef.current;
    if (!sentinel) return;
    const scroller = nearestScroller(searchBarRef.current);
    const rootRect =
      scroller instanceof HTMLElement
        ? scroller.getBoundingClientRect()
        : { top: 0, bottom: window.innerHeight };
    const s = sentinel.getBoundingClientRect();
    const intersecting = s.bottom > rootRect.top && s.top < rootRect.bottom;
    setSearchStuck(!intersecting);
  };

  const releaseSpyLock = () => {
    window.setTimeout(() => {
      spyLock.current = false;
      syncStuckFromScroll();
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

  const applyHit = (hit: SearchHit) => {
    setSearchHighlight({
      stepKey: stepFocusKey(hit.stageName, hit.stepName),
      docId: hit.docId ?? null,
      systemLabel: hit.systemLabel ?? null,
    });
    pendingStageScroll.current = {
      stageName: hit.stageName,
      stepName: hit.stepName,
    };
    focusStep(hit.stageName, hit.stepName);
    const el = document.getElementById(stepDomId(hit.stageName, hit.stepName));
    if (!el) return;
    const card = el.closest("article") ?? el;
    pendingStageScroll.current = null;
    spyLock.current = true;
    const pin = card;
    alignCardToRail(pin, "auto");
    window.requestAnimationFrame(() => alignCardToRail(pin, "auto"));
    releaseSpyLock();
  };

  const scrollToSearch = () => {
    const bar = searchBarRef.current;
    const scroller = nearestScroller(bar);
    setScrollY(scroller, 0, "smooth");
  };

  const jumpToHit = (hit: SearchHit) => {
    setOverlayOpen(false);
    pendingHit.current = hit;
    setSearchHighlight({
      stepKey: stepFocusKey(hit.stageName, hit.stepName),
      docId: hit.docId ?? null,
      systemLabel: hit.systemLabel ?? null,
    });
    if (!browsingPhase || hit.phaseId !== phaseFromUrl) {
      setSearchParams({ phase: hit.phaseId });
      window.localStorage.setItem(LS_KEY, hit.phaseId);
      return;
    }
    pendingHit.current = null;
    applyHit(hit);
  };

  useEffect(() => {
    const hit = pendingHit.current;
    if (!hit || !browsingPhase || hit.phaseId !== phaseFromUrl) return;
    const ready = journeyItems.some(
      (item) =>
        item.stageName === hit.stageName &&
        (item.classified.step.name === hit.stepName ||
          (item.packMembers ?? []).some((m) => m.step.name === hit.stepName)),
    );
    if (!ready) return;
    pendingHit.current = null;
    const id = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => applyHit(hit));
    });
    return () => window.cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phaseFromUrl, browsingPhase, navKeySig, journeyItems]);

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

  const clearSearch = () => {
    setSearchQuery("");
    setOverlayOpen(false);
    setSearchHighlight(null);
    pendingHit.current = null;
  };

  const openOverlay = () => {
    if (needsContext) return;
    setOverlayOpen(true);
    window.requestAnimationFrame(() => {
      document.getElementById("process-v18-search")?.focus();
    });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        const tag = (e.target as HTMLElement | null)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
          if (e.target !== document.getElementById("process-v18-search")) {
            return;
          }
        }
        e.preventDefault();
        openOverlay();
        return;
      }
      if (e.key === "Escape" && overlayOpen) {
        e.preventDefault();
        setOverlayOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [overlayOpen, needsContext]);

  useEffect(() => {
    if (!browsingPhase) {
      setSearchStuck(false);
      return;
    }
    const sentinel = searchSentinelRef.current;
    const bar = searchBarRef.current;
    if (!sentinel || !bar) return;
    const scroller = nearestScroller(bar);
    const root = scroller instanceof HTMLElement ? scroller : null;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (spyLock.current) return;
        const y = scrollYOf(scroller);
        if (y <= 16) {
          holdStuckUntilTop.current = false;
          setSearchStuck(false);
          return;
        }
        if (holdStuckUntilTop.current) {
          setSearchStuck(true);
          return;
        }
        setSearchStuck(!entry.isIntersecting);
      },
      { root, threshold: 0 },
    );
    io.observe(sentinel);
    return () => io.disconnect();
  }, [browsingPhase]);

  useEffect(() => {
    if (!overlayOpen) return;
    const onPointer = (e: PointerEvent) => {
      const bar = searchBarRef.current;
      const target = e.target as Node | null;
      if (bar && target && bar.contains(target)) return;
      setOverlayOpen(false);
    };
    window.addEventListener("pointerdown", onPointer);
    return () => window.removeEventListener("pointerdown", onPointer);
  }, [overlayOpen]);

  useEffect(() => {
    if (!browsingPhase || needsContext || visibleJourneyItems.length === 0) return;

    const first = document.getElementById(
      stepDomId(visibleJourneyItems[0].stageName, visibleJourneyItems[0].classified.step.name),
    );
    const scroller = nearestScroller(first);

    const syncFromScroll = () => {
      if (spyLock.current) return;
      const line = spyReadLine();
      let next = visibleJourneyItems[0];
      for (const item of visibleJourneyItems) {
        const el = document.getElementById(
          stepDomId(item.stageName, item.classified.step.name),
        );
        if (!el) continue;
        const card = el.closest("article") ?? el;
        if (card.getBoundingClientRect().top <= line) next = item;
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

  useEffect(() => {
    if (!searchHighlight || overlayOpen || pendingHit.current) return;
    const onHit =
      focusedStep === searchHighlight.stepKey ||
      visibleJourneyItems.some((item) => {
        const key = stepFocusKey(item.stageName, item.classified.step.name);
        if (key !== focusedStep) return false;
        if (key === searchHighlight.stepKey) return true;
        return (item.packMembers ?? []).some(
          (m) =>
            stepFocusKey(item.stageName, m.step.name) ===
            searchHighlight.stepKey,
        );
      });
    if (!onHit) {
      setSearchQuery("");
      setOverlayOpen(false);
      setSearchHighlight(null);
    }
  }, [focusedStep, overlayOpen, searchHighlight, visibleJourneyItems]);

  const chips = needsContext
    ? ["All Terminals", "All Zones"]
    : [ctxUnit.terminal, ctxUnit.zone, ctxUnit.tenancyType];

  const unitLabel = needsContext ? "All units" : ctxUnit.unitNo;

  const onSearchQuery = (value: string) => {
    setSearchQuery(value);
    setSearchHighlight(null);
    setOverlayOpen(true);
  };
  const onSearchChip = (chip: string) => {
    const row = usualJumps.find((r) => r.chip === chip);
    setSearchQuery("");
    setOverlayOpen(false);
    if (row) jumpToHit(row.hit);
  };
  const searchField = (size: "hero" | "bar" | "toolbar") => (
    <GuideSearch
      query={searchQuery}
      hits={searchHits}
      disabled={needsContext}
      overlayOpen={overlayOpen}
      size={size}
      onQuery={onSearchQuery}
      onClear={clearSearch}
      onJump={jumpToHit}
      onOpenOverlay={openOverlay}
    />
  );

  const jumpStage = (name: string) => {
    const first = journeyItems.find((i) => i.stageName === name);
    if (!first) return;
    if (journeyItems[0]?.stageName === name) {
      holdStuckUntilTop.current = false;
      focusStep(first.stageName, first.classified.step.name);
      spyLock.current = true;
      setSearchStuck(false);
      const bar = searchBarRef.current;
      setScrollY(nearestScroller(bar), 0, "auto");
      releaseSpyLock();
      return;
    }
    holdStuckUntilTop.current = true;
    scrollToStep(first.stageName, first.classified.step.name);
  };

  const renderWorksSticky = () =>
    showWorksSticky ? (
      <WorksSticky
        title={worksSticky.title}
        cta={worksSticky.cta}
        onOpen={() => openQuizSheet(true)}
      />
    ) : null;

  const searchDock = () => {
    return (
      <div
        ref={searchSentinelRef}
        className="h-px w-px overflow-hidden"
        aria-hidden
      />
    );
  };

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

  const pathSteps = visibleJourneyItems.map((item) => {
    const key = stepFocusKey(item.stageName, item.classified.step.name);
    const packKeys = (item.packMembers ?? []).map((m) =>
      stepFocusKey(item.stageName, m.step.name),
    );
    const hitOnCard =
      searchHighlight?.stepKey === key ||
      packKeys.includes(searchHighlight?.stepKey ?? "");
    return (
      <PathStep
        key={key}
        classified={item.classified}
        stageName={item.stageName}
        packMembers={item.packMembers}
        highlightStepName={
          item.packMembers?.find(
            (m) =>
              stepFocusKey(item.stageName, m.step.name) ===
              searchHighlight?.stepKey,
          )?.step.name ?? null
        }
        jumpedTo={hitOnCard}
        highlightDocId={hitOnCard ? searchHighlight?.docId : null}
        highlightSystemLabel={hitOnCard ? searchHighlight?.systemLabel : null}
        role={role}
        tenancyType={ctxUnit.tenancyType}
        terminal={ctxUnit.terminal}
        zone={ctxUnit.zone}
        unit={ctxUnit}
        quiz={
          showQuiz
            ? {
                kickoffSoon: Boolean(activeJob.kickoffSoon),
                state: officerDraft ?? quiz,
                questions: quizQuestions,
                summary: quizSummary,
                flags: plannedFlags,
                permitResult,
                onStart: () =>
                  role === "officer"
                    ? openOfficerDraft()
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
                  const src = officerDraft ?? quiz;
                  persistQuiz({
                    status: "done",
                    answers: src.answers,
                    confirmed: role === "officer",
                  });
                  setOfficerDraft(null);
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
                onEdit: () =>
                  role === "officer"
                    ? openOfficerDraft()
                    : persistQuiz({
                        status: "editing",
                        answers: quiz.answers,
                        confirmed: quiz.confirmed,
                      }),
                onOpenQuiz: (edit = true) => {
                  if (role === "officer") {
                    if (edit && quizCanWrite(role, quiz)) {
                      openOfficerDraft();
                    }
                    scrollToStep(KICKOFF_STAGE_NAME, KICKOFF_STEP_NAME);
                    return;
                  }
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
                  : browsingPhase
                    ? active.description
                    : "Find a step, form, or system."}
              </p>
            </div>
            {unitPicker}
          </div>

          {!browsingPhase && (
            <PhaseTabStrip
              phases={visiblePhases}
              activeId={active.id}
              browsing={false}
              disabled={needsContext}
              onSelect={selectPhase}
            />
          )}

          <div
            id="process-v18-search-bar"
            ref={searchBarRef}
            className="relative z-30 flex flex-col gap-3"
          >
            <div
              className={cn(
                "process-search-card flex flex-col overflow-visible rounded-[var(--radius-2xl)] shadow-[var(--shadow-light-bg)]",
                browsingPhase ? "gap-3 p-4" : "gap-4 p-5 tablet:p-6",
              )}
            >
              <div className="flex min-w-0 flex-col gap-1">
                <h2
                  className={cn(
                    "font-bold text-black",
                    browsingPhase
                      ? "text-lg leading-[22px]"
                      : "text-xl leading-7 tablet:text-2xl tablet:leading-[30px]",
                  )}
                >
                  {needsContext ? "Choose a unit first." : "Search this guide"}
                </h2>
                <p className="text-sm leading-[18px] text-grey-700">
                  {needsContext
                    ? "Then find a step, form, or system."
                    : "Find a step, form, or system."}
                </p>
              </div>
              {searchField(browsingPhase ? "toolbar" : "hero")}
              {usualJumps.length > 0 && (
                <ChipRow
                  rows={usualJumps}
                  disabled={needsContext}
                  align={browsingPhase ? "start" : "center"}
                  onChip={onSearchChip}
                />
              )}
            </div>
          </div>
        </header>

        {!browsingPhase ? (
          <>
            {usualJumps.length > 0 && (
              <section className="flex flex-col gap-4">
                <h2 className="text-xl leading-7 font-bold text-black">
                  Quick links
                </h2>
                <UsualJumpList
                  rows={usualJumps}
                  disabled={needsContext}
                  onJump={jumpToHit}
                />
              </section>
            )}

            <section className="flex flex-col gap-4">
              <h2 className="text-xl leading-7 font-bold text-black">
                Process guides
              </h2>
              <PhaseGuideGrid
                phases={visiblePhases}
                onSelect={selectPhase}
              />
            </section>
          </>
        ) : (
          <div className="flex min-w-0 flex-col">
            {searchDock()}

            <div className="sticky top-0 z-20 -mx-4 border-b border-grey-100 bg-grey-50 px-4 py-3 desktop:hidden">
              <div className="flex flex-col gap-3">
                <PhaseTabStrip
                  phases={visiblePhases}
                  activeId={active.id}
                  browsing
                  disabled={needsContext}
                  onSelect={selectPhase}
                  onReselectActive={showLanding}
                />
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
                {renderWorksSticky()}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-6 desktop:mt-6 desktop:grid-cols-12 desktop:items-start">
              <aside className="hidden min-w-0 desktop:sticky desktop:top-8 desktop:col-span-4 desktop:col-start-9 desktop:row-start-1 desktop:block desktop:self-start">
                <div className="flex flex-col gap-4">
                  <PhaseTabStrip
                    phases={visiblePhases}
                    activeId={active.id}
                    browsing
                    disabled={needsContext}
                    onSelect={selectPhase}
                    onReselectActive={showLanding}
                  />
                  <DocumentFilterPanel onClose={showLanding}>
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
                  {renderWorksSticky()}
                </div>
              </aside>
              <section
                className={cn(
                  "flex min-w-0 flex-col gap-6 desktop:col-span-8 desktop:col-start-1 desktop:row-start-1",
                  pinYouAreHere && "pb-16",
                )}
              >
                {pathSteps}
              </section>
            </div>

            {searchStuck && !previewDocId && (
              <button
                type="button"
                onClick={scrollToSearch}
                aria-label="Back to Search"
                className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 grid size-10 place-items-center rounded-full bg-purple-600 text-white shadow-[var(--shadow-light-bg)] hover:bg-purple-700 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)] tablet:right-8 tablet:bottom-8 tablet:size-12"
              >
                <span
                  className="grid size-5 place-items-center [&_img]:brightness-0 [&_img]:invert tablet:size-6"
                  aria-hidden
                >
                  <IconLeaf
                    src={caretDown}
                    leafW={10}
                    leafH={6}
                    frame={20}
                    rotate={180}
                  />
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      <DocumentPreviewDrawer
        docId={previewDocId}
        onClose={() => setPreviewDocId(null)}
      />
      {isContractor && showQuiz && (
        <PlannedWorksSheet
          open={quizSheetOpen}
          questions={quizQuestions}
          state={quiz}
          onToggle={(questionId, optionId) =>
            persistQuiz(toggleQuestionOption(quiz, questionId, optionId))
          }
          onSave={() => {
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

type DropdownOption = { value: string; label: string };

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
          {selected?.label ?? ""}
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
                {option.label}
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
function DocumentFilterPanel({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-[var(--radius-md)] border border-grey-100 bg-white shadow-[var(--shadow-light-bg)]">
      <div className="relative flex items-start gap-2 bg-white px-6">
        <div className="flex min-w-0 flex-1 flex-col gap-1 pt-6 pb-2">
          <p className="text-xl leading-7 font-bold text-grey-900">View By</p>
          <p className="text-sm leading-[18px] text-grey-700">
            Select something, to view a card etc....
          </p>
        </div>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute top-3 right-4 grid size-10 shrink-0 place-items-center rounded-[var(--radius-sm)] text-black hover:bg-grey-50 focus-visible:outline-none focus-visible:shadow-[0_0_0_4px_var(--color-purple-200)]"
        >
          <IconLeaf src={closeIcon} leafW={11.67} leafH={11.67} frame={20} />
        </button>
      </div>
      <div className="max-h-[calc(100dvh-16rem)] overflow-y-auto p-6">
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
  const phaseLabel = TAB_LABEL[activePhaseId] ?? activePhaseId;

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
              label: `${phaseLabel} · ${block.stage.name}`,
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
      <div id={RAIL_ID} className="flex flex-col gap-4">
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
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-grey-400">
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
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-grey-400">
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

function PhaseGuideGrid({
  phases,
  onSelect,
}: {
  phases: Phase[];
  onSelect: (id: Phase["id"]) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 tablet:grid-cols-2 desktop:grid-cols-4">
      {phases.map((phase) => (
        <button
          key={phase.id}
          type="button"
          onClick={() => onSelect(phase.id)}
          className="flex flex-col gap-2 rounded-[var(--radius-2xl)] bg-white p-6 text-left shadow-[var(--shadow-light-bg)] hover:shadow-[0_0_0_2px_var(--color-purple-600)] focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
        >
          <h3 className="text-lg leading-[22px] font-bold text-black">
            {TAB_LABEL[phase.id] ?? phase.name}
          </h3>
          <p className="text-sm leading-[18px] text-grey-500">
            {phase.description}
          </p>
        </button>
      ))}
    </div>
  );
}

function UsualJumpList({
  rows,
  disabled,
  onJump,
}: {
  rows: { chip: string; hit: SearchHit }[];
  disabled?: boolean;
  onJump: (hit: SearchHit) => void;
}) {
  return (
    <ul className="grid grid-cols-2 gap-3 desktop:grid-cols-4">
      {rows.map(({ chip, hit }) => (
        <li key={chip}>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onJump(hit)}
            className="flex h-full min-h-[88px] w-full flex-col justify-between gap-3 rounded-[var(--radius-2xl)] border border-grey-100 bg-white p-4 text-left shadow-[var(--shadow-light-bg)] hover:shadow-[0_0_0_2px_var(--color-purple-600)] disabled:opacity-60 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
          >
            <span className="text-base leading-5 font-bold text-black">
              {chip}
            </span>
            <span className="flex items-end justify-between gap-2">
              <span className="min-w-0 truncate text-sm leading-[18px] text-grey-500">
                {hit.displayTitle}
              </span>
              <span className="shrink-0 text-purple-600" aria-hidden>
                <IconLeaf src={chevronRight} leafW={6} leafH={10} frame={12} />
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
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
  const { step, mine, others } = classified;
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
    }))
    .filter((row): row is { workIf: string; line: string } => Boolean(row.line));

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
  const quizStatus = quiz?.state.status ?? "idle";
  const quizDone = quizStatus === "done";
  const editMode = quizEditMode(role);
  const confirmed = Boolean(quiz && quizIsConfirmed(quiz.state));
  const contractorCanWrite = editMode === "fill" && !confirmed;
  const officerCanWrite = editMode === "correct";
  const canWriteQuiz = contractorCanWrite;
  const hasAnswers = Boolean(quiz && quizHasSavedAnswers(quiz.state));
  const reviewRows = quiz ? quizReviewRows(quiz.state, unit) : [];
  const openReviewCount = unansweredReviewCount(reviewRows);
  const needsGuide =
    Boolean(quiz) && quizNeedsOfficerGuide(quiz.state, unit);
  const officerPending = officerCanWrite && !confirmed;
  const reviewLabel = officerPending
    ? hostsKickoff
      ? quizCopy.reviewLabelOfficerConfirm
      : quizCopy.reviewLabelOfficerPending
    : officerCanWrite && confirmed
      ? quizCopy.reviewLabelOfficerAgreed
      : quizCopy.reviewLabel;
  const officerReviewHint = hostsKickoff
    ? quizCopy.officerPossibleLine
    : quizCopy.officerReadLine;
  const reviewBannerTitle = officerPending
    ? officerReviewHint
    : role === "contractor" && contractorCanWrite && openReviewCount > 0
      ? quizCopy.bannerContractorPaused
      : reviewLabel;

  const copy = lifeSgCard(role, stageName, isPtwPack ? PTW_PACK_HOST : step.name);
  const lead = cardLead(
    role,
    stageName,
    isPtwPack ? PTW_PACK_HOST : step.name,
  );
  const rawSubheader = copy?.subheader ?? purpose;
  const subheaderLines = Array.isArray(rawSubheader) ? rawSubheader : null;
  const subheader = Array.isArray(rawSubheader)
    ? rawSubheader.join(" ")
    : rawSubheader;
  const remainingHow = [
    ...(copy ? (copy.how ?? []) : howLines),
    ...(hostsQuiz && editMode === "correct" && needsGuide
      ? quizCopy.officerGuideHow
      : []),
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
    ...onlyIf.map((row) => packSystemsNamedIn(row.line, role)),
    ...(packMembers ?? []).map((m) =>
      packSystemsNamedIn(stepWhat(m.step, role), role),
    ),
  );
  const { guides, samples } = splitStepDocs(docs);
  const showOnlyIf = onlyIf.length > 0 && !copy?.hideOnlyIf;
  const permitResult = quiz?.permitResult ?? null;
  const showQuizNudge =
    hostsQuiz &&
    Boolean(quiz) &&
    officerCanWrite &&
    !confirmed &&
    quizStatus !== "editing" &&
    !hasAnswers;
  const showPermitResults =
    Boolean(permitResult) && hostsQuiz && quizStatus !== "editing";
  const showKickoffChecklist =
    Boolean(permitResult) &&
    stageName === KICKOFF_STAGE_NAME &&
    step.name === KICKOFF_STEP_NAME &&
    quizStatus !== "editing";
  const showOfficerQuizForm =
    officerCanWrite &&
    Boolean(quiz) &&
    quizStatus === "editing" &&
    (hostsQuiz || hostsKickoff);
  const showKickoffCorrection =
    Boolean(quiz) &&
    hostsKickoff &&
    !showOfficerQuizForm &&
    officerCanWrite;
  const showReview =
    Boolean(quiz) &&
    hasAnswers &&
    !showOfficerQuizForm &&
    quizStatus !== "editing" &&
    (hostsQuiz ||
      showKickoffCorrection ||
      (hostsKickoff && contractorCanWrite && quizDone));
  const showLinkedWorks =
    showReview &&
    Boolean(permitResult) &&
    (hostsQuiz || hostsKickoff);
  const certainty = stepCertainty(step, quiz?.flags ?? null);
  const showPossible = certainty === "possible" && Boolean(quiz) && !isPtwPack;
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
            onApply={
              canWriteQuiz &&
              (member.step.whenSlugs?.length ?? 0) > 0 &&
              quiz
                ? () => quiz.onApplySlugs(member.step.whenSlugs ?? [])
                : undefined
            }
            onDismiss={
              canWriteQuiz &&
              (member.step.whenSlugs?.length ?? 0) > 0 &&
              quiz
                ? () => quiz.onDismissSlugs(member.step.whenSlugs ?? [])
                : undefined
            }
          />
        ))
      : null;
  const packTypesBlock = packTypeRows ? (
    <div className="flex w-full flex-col gap-3">
      <h4 className="text-xs font-bold uppercase tracking-[0.08em] text-grey-400">
        {PTW_PACK_TYPES_LABEL}
      </h4>
      <ul className="overflow-hidden rounded-[var(--radius-md)] border border-grey-200 bg-white">
        {packTypeRows}
      </ul>
    </div>
  ) : null;

  const hasRail =
    guides.length > 0 || samples.length > 0 || packSystems.length > 0;

  return (
    <article
      id={stepDomId(stageName, step.name)}
      className={cn(
        "flex flex-col gap-4 rounded-[var(--radius-2xl)] bg-white p-4 tablet:gap-6 tablet:p-6",
        "scroll-mt-[16rem] tablet:scroll-mt-[12rem] desktop:scroll-mt-8",
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
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-grey-400">
          {stageName}
        </p>
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg leading-[22px] font-bold text-black">
              {cardTitle(role, stageName, isPtwPack ? PTW_PACK_HOST : step.name)}
            </h3>
            {showPossible && (
              <span className={CHIP_MAY_APPLY}>{possibleChip(editMode)}</span>
            )}
          </div>
          {lead && (
            <p className="text-base leading-5 text-grey-700">{lead}</p>
          )}
        </div>
        {showPossible && quiz && (
          <Banner
            actions={
              officerCanWrite ? (
                <GuideCta
                  tone="ghost"
                  onClick={() => quiz.onOpenQuiz(true)}
                >
                  {confirmed
                    ? quizCopy.officerUpdateCta
                    : quizCopy.officerConfirmCta}
                </GuideCta>
              ) : undefined
            }
            body={
              canWriteQuiz && (step.whenSlugs?.length ?? 0) > 0 ? (
                <PossibleDecideActions
                  onApply={() => quiz.onApplySlugs(step.whenSlugs ?? [])}
                  onDismiss={() => quiz.onDismissSlugs(step.whenSlugs ?? [])}
                />
              ) : undefined
            }
          >
            {canWriteQuiz
              ? quizCopy.possibleDecideLine
              : possibleCopy(editMode)}
          </Banner>
        )}
        {whenRows.length > 0 && <WhenChips rows={whenRows} role={role} />}
        {subheaderLines && subheaderLines.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {subheaderLines.map((line) => (
              <li key={line} className="flex items-start gap-1.5">
                <span className="mt-1 shrink-0">
                  <IconLeaf src={dotIcon} leafW={5.33} leafH={5.33} frame={16} />
                </span>
                <p className="min-w-0 flex-1 text-base leading-5 text-grey-600">
                  {line}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          subheader && (
            <p className="text-base leading-5 text-grey-600">
              {subheader}
            </p>
          )
        )}
      </div>

      {remainingHow.length > 0 && (
        <FieldSection label="How">
          <ul className="flex flex-col gap-3">
            {remainingHow.map((line, i) => (
              <li key={`${i}-${line}`} className="flex items-start gap-1.5">
                <span className="mt-0.5 shrink-0">
                  <IconLeaf src={dotIcon} leafW={5.33} leafH={5.33} frame={16} />
                </span>
                <span className="text-sm leading-[18px] text-grey-900">
                  {line}
                </span>
              </li>
            ))}
          </ul>
        </FieldSection>
      )}

      {isPtwPack && packTypesBlock && (
        <Banner
          fold
          defaultOpen
          actions={
            quiz && officerCanWrite ? (
              <GuideCta
                tone="ghost"
                onClick={() => quiz.onOpenQuiz(true)}
              >
                {confirmed
                  ? quizCopy.officerUpdateCta
                  : quizCopy.officerConfirmCta}
              </GuideCta>
            ) : undefined
          }
          body={packTypesBlock}
        >
          {canWriteQuiz
            ? quizCopy.possibleDecideLine
            : possibleCopy(editMode)}
        </Banner>
      )}

      {showPermitResults && !showLinkedWorks && permitResult && (
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

      {showLinkedWorks && permitResult && (
        <Banner
          fold
          defaultOpen={officerPending}
          actions={
            officerPending && hostsKickoff && quiz ? (
              <GuideCta tone="ghost" onClick={quiz.onConfirm}>
                {quizCopy.officerConfirmCta}
              </GuideCta>
            ) : undefined
          }
          body={
            <div className="flex w-full flex-col gap-4">
              {officerPending ? (
                <>
                  <QuizAnswerReview rows={reviewRows} />
                  {hostsKickoff && quiz && (
                    <GuideCta tone="ghost" onClick={quiz.onEdit}>
                      {quizCopy.officerEditCta}
                    </GuideCta>
                  )}
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
                    (hostsQuiz && contractorCanWrite && quiz) ||
                    (officerCanWrite && quiz && hostsKickoff) ? (
                      <>
                        {hostsQuiz && contractorCanWrite && quiz && (
                          <GuideCta tone="ghost" onClick={() => quiz.onOpenQuiz(true)}>
                            {quizStatus === "paused"
                              ? quizCopy.resumeCta
                              : "Edit answers"}
                          </GuideCta>
                        )}
                        {officerCanWrite && quiz && hostsKickoff && (
                          <OfficerQuizActions
                            confirmed={confirmed}
                            onConfirm={quiz.onConfirm}
                            onEdit={quiz.onEdit}
                          />
                        )}
                      </>
                    ) : undefined
                  }
                />
              )}
            </div>
          }
        >
          {reviewBannerTitle}
        </Banner>
      )}

      {showReview && !showLinkedWorks && (
        <Banner
          fold
          defaultOpen={officerPending}
          actions={
            officerPending && hostsKickoff && quiz ? (
              <GuideCta tone="ghost" onClick={quiz.onConfirm}>
                {quizCopy.officerConfirmCta}
              </GuideCta>
            ) : undefined
          }
          body={
            <div className="flex w-full flex-col gap-4">
              <QuizAnswerReview rows={reviewRows} />
              {hostsQuiz && contractorCanWrite && quiz && (
                <div className="border-t border-grey-200 pt-4">
                  <GuideCta tone="ghost" onClick={() => quiz.onOpenQuiz(true)}>
                    {quizStatus === "paused"
                      ? quizCopy.resumeCta
                      : "Edit answers"}
                  </GuideCta>
                </div>
              )}
              {officerCanWrite && quiz && hostsKickoff && officerPending && (
                <GuideCta tone="ghost" onClick={quiz.onEdit}>
                  {quizCopy.officerEditCta}
                </GuideCta>
              )}
              {officerCanWrite && quiz && hostsKickoff && !officerPending && (
                <div className="border-t border-grey-200 pt-4">
                  <OfficerQuizActions
                    confirmed={confirmed}
                    onConfirm={quiz.onConfirm}
                    onEdit={quiz.onEdit}
                  />
                </div>
              )}
            </div>
          }
        >
          {reviewBannerTitle}
        </Banner>
      )}

      {showQuizNudge && quiz && (
        <QuizNudge
          status={quiz.state.status}
          mode={editMode}
          onOpen={
            officerCanWrite ? () => quiz.onOpenQuiz(true) : quiz.onStart
          }
        />
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

      {showOfficerQuizForm && quiz && (
        <FieldSection label={reviewLabel}>
          <PlannedWorksForm
            questions={quiz.questions}
            state={quiz.state}
            onToggle={quiz.onToggle}
          />
          <div className="flex flex-wrap items-center gap-2">
            <GuideCta onClick={quiz.onConfirm}>
              {confirmed
                ? quizCopy.officerUpdateCta
                : quizCopy.officerConfirmCta}
            </GuideCta>
            <GuideCta tone="ghost" onClick={quiz.onCancel}>
              {quizCopy.officerCancelCta}
            </GuideCta>
          </div>
        </FieldSection>
      )}

      {showKickoffCorrection && quiz && (
        <FieldSection
          label={
            confirmed
              ? quizCopy.kickoffUpdateLabel
              : quizCopy.kickoffConfirmLabel
          }
        >
          <BulletList
            lines={
              confirmed ? quizCopy.kickoffCorrection : quizCopy.kickoffConfirm
            }
          />
          {!showLinkedWorks && (
            <OfficerQuizActions
              confirmed={confirmed}
              onConfirm={quiz.onConfirm}
              onEdit={quiz.onEdit}
            />
          )}
        </FieldSection>
      )}

      {showOnlyIf && (
        <FieldSection label="Only if">
          <ul className="flex flex-col gap-3">
            {onlyIf.map((row) => (
              <li key={`${row.workIf}-${row.line}`} className="flex items-start gap-1.5">
                <span className="mt-0.5 shrink-0">
                  <IconLeaf src={dotIcon} leafW={5.33} leafH={5.33} frame={16} />
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
    </article>
  );
}
