import {
  Children,
  createContext,
  Fragment,
  useCallback,
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
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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
import { cardLead, cardTitle, cardWhy, lifeSgCard } from "@/lib/process-v10-copy";
import {
  copyForRole,
  groupTimings,
  timingsForStep,
  type GuideTiming,
  type RoleCopy,
  type TimingKind,
} from "@/lib/process-rules-v6";
import {
  fileKind,
  splitStepDocs,
  verbForDoc,
  type FileKind,
} from "@/lib/process-v12-docs";
import { permitExplainFor } from "@/lib/process-permit-explain";
import {
  supportingDocsFor,
  type DocNeed,
  type SupportingDoc,
} from "@/lib/process-permit-supporting-docs";
import {
  foldPtwPackSteps,
  PTW_PACK_ALWAYS_LEAD,
  PTW_PACK_ALWAYS_NOTE,
  PTW_PACK_QUIZ_NOTE,
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
  injectPlannedWorksQuiz,
  isOptionOn,
  filledDemoQuiz,
  midwayDemoQuiz,
  readOperateQuizState,
  writeOperateQuizState,
  questionHasAnswer,
  NONE_ID,
  NOT_SURE_ID,
  questionsForUnit,
  quizCanWrite,
  quizCopy,
  quizUiCopy,
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
  OPEN_PLANNED_WORKS_EVENT,
  QUIZ_STAGE_NAME,
  QUIZ_STEP_NAME,
  readQuizState,
  slugFlags,
  stepCertainty,
  toggleQuestionOption,
  writeQuizState,
  type QuestionId,
  type QuizQuestion,
  type QuizScope,
  type QuizState,
  type QuizStickyTone,
  type QuizStickyTrackStep,
  type SlugFlag,
} from "@/lib/process-planned-works-quiz";
import {
  IFM_BRIEFING_STEP,
  PHASE_DESKS,
  allChapterTopics,
  phaseGroupForStep,
  topicValue,
  type PhaseDeskId,
} from "@/lib/process-v24-doors";
import {
  SEARCH_CHIP_CANDIDATES,
  keywordPoolForBlobs,
  normalizeQuery,
  suggestKeywords,
  textMatches,
} from "@/lib/process-v15-search";
import { Button } from "@/components/Button/Button";
import { SearchField } from "@/components/dls/SearchField";
import { SearchHitRow } from "@/components/dls/SearchHitRow";
import { StepCardShell } from "@/components/dls/StepCardShell";
import { DocumentPreviewDrawer } from "@/components/DocumentPreviewDrawer";
import { cn } from "@/lib/utils";
import caretDown from "@/assets/figma/caret-down.svg";
import arrowTop from "@/assets/figma/arrow-top.svg";
import checkIcon from "@/assets/figma/check.svg";
import closeIcon from "@/assets/figma/close.svg";
import dotIcon from "@/assets/figma/dot.svg";
import exclamationAlert from "@/assets/figma/exclamation-alert.svg";
import externalLink from "@/assets/figma/external-link.svg";
import documentsIcon from "@/assets/figma/documents.svg";
import fileIcon from "@/assets/figma/file.svg";
import filterOff from "@/assets/figma/filter-off.svg";
import writeFormsIcon from "@/assets/figma/write-forms.svg";
import helpQuestions from "@/assets/figma/help-questions.svg";
import infoIcon from "@/assets/figma/info.svg";
import linkIcon from "@/assets/figma/link.svg";
import reviewsIcon from "@/assets/figma/reviews.svg";

type GuideItem = {
  stageName: string;
  classified: ClassifiedStep;
  packMembers?: ClassifiedStep[];
};

const LS_KEY = "tempo:v24:lastPhase";

/** Runway All Caps — 12/16 Bold, Grey/400. Swimlane and section labels. */
const LABEL_CAPS =
  "text-xs leading-4 font-bold uppercase tracking-[0.08em] text-grey-400";
/** Phase / drilled topic — H6 mobile, H5 desktop (Admin header). */
const TITLE_PAGE =
  "text-xl leading-[26px] font-black text-black tablet:text-2xl tablet:leading-[30px]";
/** Topic group under a phase — Body L mobile, H6 desktop. */
const TITLE_GROUP =
  "text-base leading-5 font-bold text-grey-700 tablet:text-xl tablet:leading-[26px]";
/** Search count / empty / opened hit — Subheading mobile, H6 desktop. */
const TITLE_SEARCH =
  "text-lg leading-[22px] font-bold text-black tablet:text-xl tablet:leading-[26px]";

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

function findRowDomId(stageName: string, stepName: string) {
  return `find-${stepDomId(stageName, stepName)}`;
}

function rowElForStepKey(key: string) {
  const sep = key.indexOf("::");
  if (sep < 0) return null;
  return document.getElementById(
    findRowDomId(key.slice(0, sep), key.slice(sep + 2)),
  );
}

type ProcessFindStepHit = {
  id: string;
  kind: "guide";
  phaseId: PhaseDeskId;
  groupId: string;
  title: string;
  chapterTitle: string;
  preview?: string;
  hint: string;
  stageName: string;
  stepName: string;
};

type ProcessFindFileHit = {
  id: string;
  kind: "file";
  title: string;
  preview?: string;
  hint: string;
  docId: string;
  fileKind: FileKind;
  phaseIds: PhaseDeskId[];
  groupIds: string[];
};

type ProcessFindSystemHit = {
  id: string;
  kind: "system";
  title: string;
  hint: string;
  label: string;
  phaseIds: PhaseDeskId[];
  groupIds: string[];
};

type ProcessFindHit =
  | ProcessFindStepHit
  | ProcessFindFileHit
  | ProcessFindSystemHit;

function fileKindLabel(kind: FileKind) {
  if (kind === "template") return "Template";
  if (kind === "sample") return "Sample";
  return "Guide";
}

type GuideSearchRow = {
  phaseId: PhaseDeskId;
  groupId: string;
  stageName: string;
  stepName: string;
  title: string;
  chapterTitle: string;
  preview?: string;
  snippets: string[];
  blob: string;
  docs: DocItem[];
  systems: { label: string }[];
};

function lifeSgLines(role: Role, stageName: string, stepName: string): string[] {
  const copy = lifeSgCard(role, stageName, stepName);
  if (!copy) return [];
  const heads = Array.isArray(copy.subheader)
    ? copy.subheader
    : [copy.subheader];
  return [copy.why, ...heads, ...(copy.how ?? [])]
    .map((line) => line?.trim() ?? "")
    .filter(Boolean);
}

function cardPreviewLine(
  role: Role,
  stageName: string,
  stepName: string,
): string | undefined {
  const copy = lifeSgCard(role, stageName, stepName);
  const heads = copy
    ? Array.isArray(copy.subheader)
      ? copy.subheader
      : [copy.subheader]
    : [];
  return (
    heads.map((line) => line?.trim() ?? "").find(Boolean) ??
    cardLead(role, stageName, stepName) ??
    cardWhy(role, stageName, stepName)
  );
}

function guideChapter(
  stageName: string,
  stepName: string,
): { phaseId: PhaseDeskId; title: string; lead: string } | null {
  for (const phaseId of Object.keys(PHASE_DESKS) as PhaseDeskId[]) {
    const group = PHASE_DESKS[phaseId].groups.find((row) =>
      row.match(stageName, stepName),
    );
    if (group) {
      return { phaseId, title: group.title, lead: group.lead };
    }
  }
  return null;
}

const PERSON_FACE: Record<string, Partial<Record<Role, string>> | string> = {
  Tenant: { tenant: "You", contractor: "Tenant", officer: "Tenant" },
  Contractor: {
    tenant: "Your contractor",
    contractor: "You",
    officer: "Contractor",
  },
  "Project Officer": {
    tenant: "Your Project Officer",
    contractor: "Your Project Officer",
    officer: "You",
  },
  "Integrated Facilities Management": "IFM",
  "Airport Emergency & Safety": "AES",
};

function facePerson(name: string, role: Role): string {
  const row = PERSON_FACE[name];
  if (!row) return name;
  if (typeof row === "string") return row;
  return row[role] ?? name;
}

function whoLine(role: Role, people?: string[]): string | undefined {
  if (!people?.length) return undefined;
  return [...new Set(people.map((person) => facePerson(person, role)))].join(
    " · ",
  );
}

const WHO_CHIP_NAME: Record<string, string> = {
  Tenant: "Tenant",
  Contractor: "Contractor",
  "Project Officer": "Project Officer",
  "Integrated Facilities Management": "IFM",
  "Airport Emergency & Safety": "AES",
};

function whoChipName(name: string, role: Role): string {
  if (name === "Tenant" && role === "tenant") return "You";
  if (name === "Contractor" && role === "contractor") return "You";
  if (name === "Project Officer" && role === "officer") return "You";
  return WHO_CHIP_NAME[name] ?? name;
}

function whoChips(role: Role, people?: string[]): string[] {
  if (!people?.length) return [];
  return [...new Set(people.map((person) => whoChipName(person, role)))];
}

function cardWhoPreview(role: Role, people?: string[]): string | undefined {
  const who = whoLine(role, people);
  return who && who !== "You" ? who : undefined;
}

function FactField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-1">
      <h4 className={LABEL_CAPS}>{label}</h4>
      {children}
    </section>
  );
}

function itemsFromBlocks(
  blocks: ReturnType<typeof blocksForPhase>,
): GuideItem[] {
  const list: GuideItem[] = [];
  for (const block of blocks) {
    for (const folded of foldPtwPackSteps(block.steps)) {
      list.push({
        stageName: block.stage.name,
        classified: folded.classified,
        packMembers: folded.packMembers,
      });
    }
  }
  return list;
}

function buildGuideSearchRows(
  phases: Phase[],
  role: Role,
  unit: Unit,
  showQuiz: boolean,
  flags: Record<PlannedWorkSlug, SlugFlag> | null,
  locked: boolean,
): GuideSearchRow[] {
  const rows: GuideSearchRow[] = [];
  for (const phase of phases) {
    const blocks = blocksForPhase(
      phase,
      role,
      unit,
      showQuiz,
      flags,
      locked,
      true,
    );
    for (const block of blocks) {
      for (const folded of foldPtwPackSteps(block.steps)) {
        const stageName = block.stage.name;
        const stepName = folded.classified.step.name;
        const groupId = phaseGroupForStep(phase.id, stageName, stepName);
        if (!groupId) continue;
        const chapter = PHASE_DESKS[phase.id].groups.find(
          (group) => group.id === groupId,
        );
        const isPtwPack = Boolean(folded.packMembers?.length);
        const copyStep = isPtwPack ? PTW_PACK_HOST : stepName;
        const title = cardTitle(role, stageName, copyStep);
        const lead = cardLead(role, stageName, copyStep) ?? "";
        const why = cardWhy(role, stageName, copyStep) ?? "";
        const what = stepWhat(folded.classified.step, role) ?? "";
        const docs = docsForStep(
          stepName,
          unit.tenancyType,
          unit.terminal,
          unit.zone,
          stageName,
        );
        const packNames = (folded.packMembers ?? []).map(
          (member) => member.step.name,
        );
        const noteLines = notesYouFollow(
          folded.classified.mine,
          folded.classified.others,
          role,
        )
          .map((note) => displayText(note, true, role))
          .filter(Boolean);
        const cardLines = lifeSgLines(role, stageName, copyStep);
        const who = cardWhoPreview(role, folded.classified.step.people);
        const systems = mergeSystems(
          systemsVisibleToRole(folded.classified.step.systems, role),
          packSystemsNamedIn(
            [title, lead, why, what, ...cardLines, ...noteLines].join(" "),
            role,
          ),
        );
        const systemLabels = systems.map((system) => system.label);
        const preview = cardPreviewLine(role, stageName, copyStep);
        const snippets = [
          title,
          lead,
          why,
          who,
          ...systemLabels,
          ...cardLines,
          what,
          ...noteLines,
          ...docs.map((doc) => doc.name),
          ...packNames,
        ].filter(Boolean);
        const visible = snippets.join(" ");
        rows.push({
          phaseId: phase.id,
          groupId,
          stageName,
          stepName,
          title,
          chapterTitle: chapter?.title ?? "",
          preview,
          snippets,
          docs,
          systems,
          blob: [visible, stepName, chapter?.title].join(" "),
        });
      }
    }
  }
  return rows;
}

function findFileHits(
  rows: GuideSearchRow[],
  query: string,
): ProcessFindFileHit[] {
  const byId = new Map<
    string,
    { doc: DocItem; phases: Set<PhaseDeskId>; groups: Set<string> }
  >();
  for (const row of rows) {
    for (const doc of row.docs) {
      if (!textMatches(doc.name, query) && !textMatches(doc.type, query)) {
        continue;
      }
      const cur = byId.get(doc.id) ?? {
        doc,
        phases: new Set<PhaseDeskId>(),
        groups: new Set<string>(),
      };
      cur.phases.add(row.phaseId);
      cur.groups.add(row.groupId);
      byId.set(doc.id, cur);
    }
  }
  return [...byId.values()]
    .sort((a, b) => a.doc.name.localeCompare(b.doc.name))
    .map(({ doc, phases, groups }) => {
      const kind = fileKind(doc);
      return {
        id: `file::${doc.id}`,
        kind: "file" as const,
        title: doc.name,
        preview: doc.type,
        hint: fileKindLabel(kind),
        docId: doc.id,
        fileKind: kind,
        phaseIds: [...phases],
        groupIds: [...groups],
      };
    });
}

function systemMatchesQuery(label: string, query: string): boolean {
  if (textMatches(label, query)) return true;
  return needlesForSystem(label).some((needle) => textMatches(needle, query));
}

function findSystemHits(
  rows: GuideSearchRow[],
  query: string,
): ProcessFindSystemHit[] {
  const byLabel = new Map<
    string,
    { label: string; phases: Set<PhaseDeskId>; groups: Set<string> }
  >();
  for (const row of rows) {
    for (const system of row.systems) {
      if (!systemMatchesQuery(system.label, query)) continue;
      const key = system.label.toLowerCase();
      const cur = byLabel.get(key) ?? {
        label: system.label,
        phases: new Set<PhaseDeskId>(),
        groups: new Set<string>(),
      };
      cur.phases.add(row.phaseId);
      cur.groups.add(row.groupId);
      byLabel.set(key, cur);
    }
  }
  return [...byLabel.values()]
    .sort((a, b) => a.label.localeCompare(b.label))
    .map(({ label, phases, groups }) => ({
      id: `system::${label}`,
      kind: "system" as const,
      title: label,
      hint: "System",
      label,
      phaseIds: [...phases],
      groupIds: [...groups],
    }));
}

function findHitsForQuery(
  rows: GuideSearchRow[],
  query: string,
): ProcessFindHit[] {
  if (!normalizeQuery(query)) return [];
  const seen = new Set<string>();
  const steps = rows
    .filter((row) => textMatches(row.blob, query))
    .map((row) => {
      const named =
        textMatches(row.title, query) || textMatches(row.stepName, query);
      const chapterHit = textMatches(row.chapterTitle, query);
      return {
        score: named ? 3 : chapterHit ? 2 : 1,
        hit: {
          id: `guide::${row.phaseId}::${row.groupId}::${row.stageName}::${row.stepName}`,
          kind: "guide" as const,
          phaseId: row.phaseId,
          groupId: row.groupId,
          title: row.title,
          chapterTitle: row.chapterTitle,
          preview: row.preview,
          hint: TAB_LABEL[row.phaseId],
          stageName: row.stageName,
          stepName: row.stepName,
        } satisfies ProcessFindStepHit,
      };
    })
    .sort(
      (a, b) => b.score - a.score || a.hit.title.localeCompare(b.hit.title),
    )
    .map((row) => row.hit)
    .filter((hit) => {
      if (seen.has(hit.id)) return false;
      seen.add(hit.id);
      return true;
    });
  return [
    ...findFileHits(rows, query),
    ...findSystemHits(rows, query),
    ...steps,
  ];
}

function groupGuideHits(hits: ProcessFindHit[]): {
  phaseId: PhaseDeskId;
  chapters: { groupId: string; title: string; hits: ProcessFindStepHit[] }[];
}[] {
  const byPhase = new Map<PhaseDeskId, Map<string, ProcessFindStepHit[]>>();
  for (const hit of hits) {
    if (hit.kind !== "guide") continue;
    let chapters = byPhase.get(hit.phaseId);
    if (!chapters) {
      chapters = new Map();
      byPhase.set(hit.phaseId, chapters);
    }
    const list = chapters.get(hit.groupId) ?? [];
    list.push(hit);
    chapters.set(hit.groupId, list);
  }
  return (Object.keys(PHASE_DESKS) as PhaseDeskId[])
    .filter((phaseId) => byPhase.has(phaseId))
    .map((phaseId) => ({
      phaseId,
      chapters: PHASE_DESKS[phaseId].groups
        .filter((group) => byPhase.get(phaseId)?.has(group.id))
        .map((group) => ({
          groupId: group.id,
          title: group.title,
          hits: byPhase.get(phaseId)?.get(group.id) ?? [],
        })),
    }));
}

function topicCountMap(
  itemsByPhase: Partial<Record<PhaseDeskId, GuideItem[]>>,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const topic of allChapterTopics()) {
    const group = PHASE_DESKS[topic.phaseId].groups.find(
      (row) => row.id === topic.id,
    );
    if (!group) continue;
    const items = itemsByPhase[topic.phaseId] ?? [];
    out[topicValue(topic.phaseId, topic.id)] = items.filter((item) =>
      group.match(item.stageName, item.classified.step.name),
    ).length;
  }
  return out;
}

function hitCountMap(hits: ProcessFindHit[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const hit of hits) {
    if (hit.kind !== "guide") continue;
    const key = topicValue(hit.phaseId, hit.groupId);
    out[key] = (out[key] ?? 0) + 1;
  }
  return out;
}

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
  return visiblePinEl(document.getElementById("process-guide-mobile-pin"));
}

function railSafeTop() {
  const bar = document.querySelector<HTMLElement>("header.fixed");
  const barHidden = !bar || window.getComputedStyle(bar).display === "none";
  const barBottom = barHidden ? 0 : bar.getBoundingClientRect().bottom;
  const pin = document.getElementById("process-guide-mobile-pin");
  const pinStuck = Boolean(
    pin && window.getComputedStyle(pin).position === "sticky",
  );
  if (pinStuck && pin) {
    return barBottom + pin.offsetHeight + 16;
  }
  if (pin && visiblePinEl(pin)) {
    return pin.getBoundingClientRect().bottom + 16;
  }
  return Math.max(barBottom, 16) + 16;
}

/** Keep an open card fully on screen — below sticky chrome, above the fold. */
function alignCardToRail(el: HTMLElement, behavior: ScrollBehavior = "smooth") {
  const scroller = nearestScroller(el);
  const pinTop = railSafeTop();
  const rect = el.getBoundingClientRect();
  const viewBottom =
    scroller === window
      ? window.innerHeight
      : (scroller as HTMLElement).getBoundingClientRect().bottom;
  const safeBottom = viewBottom - 16;
  const available = Math.max(0, safeBottom - pinTop);

  let delta = 0;
  if (rect.height > available) {
    delta = rect.top - pinTop;
  } else if (rect.top < pinTop - 2) {
    delta = rect.top - pinTop;
  } else if (rect.bottom > safeBottom + 2) {
    delta = rect.bottom - safeBottom;
  }

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
          className="block bg-current transition-transform duration-200 ease-out"
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

function OverlayBackBtn({
  onClick,
  children = "Back",
}: {
  onClick: () => void;
  children?: ReactNode;
}) {
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
      {children}
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

function isOptionalNeed(need: DocNeed) {
  return need === "optional" || need === "rr-if-applies";
}

function supportIntro(role: Role, packCount: number) {
  const many = packCount > 1;
  if (role === "contractor") {
    return {
      title: "Send these",
      lead: many
        ? "All of them go in with the application."
        : "It goes in with the application.",
    };
  }
  if (role === "officer") {
    return {
      title: "In the pack",
      lead: many
        ? "All of these need to be attached."
        : "This needs to be attached.",
    };
  }
  return {
    title: many ? "These go with the application" : "This goes with the application",
    lead: many
      ? "All of them are needed. Your contractor sends them."
      : "Your contractor sends it.",
  };
}

function SupportFileNames({ docs }: { docs: SupportingDoc[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {docs.map((doc) => (
        <li key={doc.name} className="flex items-start gap-2">
          <span
            className="inline-flex h-[18px] w-4 shrink-0 items-center justify-center"
            aria-hidden
          >
            <IconLeaf
              src={fileIcon}
              leafW={14}
              leafH={14}
              frame={16}
              colorClass="text-grey-600"
            />
          </span>
          <span className="min-w-0 text-sm leading-[18px] text-black">
            {doc.name}
          </span>
        </li>
      ))}
    </ul>
  );
}

function SupportingDocList({
  docs,
  role,
}: {
  docs: SupportingDoc[];
  role: Role;
}) {
  const pack = docs.filter((doc) => !isOptionalNeed(doc.need));
  const optional = docs.filter((doc) => isOptionalNeed(doc.need));
  const intro = supportIntro(role, pack.length);
  return (
    <section className="flex flex-col gap-3 border-t border-grey-100 pt-4">
      <div className="flex flex-col gap-0.5">
        <h4 className="text-sm leading-[18px] font-bold text-black">
          {intro.title}
        </h4>
        <p className="text-sm leading-[18px] text-grey-600">{intro.lead}</p>
      </div>
      {pack.length > 0 ? <SupportFileNames docs={pack} /> : null}
      {optional.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm leading-[18px] text-grey-600">
            Only if that work is in the pack.
          </p>
          <SupportFileNames docs={optional} />
        </div>
      ) : null}
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

/** Short “before/after what” for the chip. Type chips already name the work. */
const SHORT_LEAD_EVENT: Record<string, string> = {
  "works start": "works start",
  "skytrain works": "Skytrain",
  "cabling works": "cabling",
  isolation: "isolation",
  "hot work": "hot work",
  "noisy work": "noisy work",
  "sprinkler a&a": "sprinkler",
  "gas install": "install",
  "gas turn-on": "turn-on",
  opening: "opening",
  "supply turn-on": "turn-on",
  "strip-out": "strip-out",
  handover: "handover",
  completion: "completion",
  "power on": "power on",
};

function leadEventTail(
  duration: string,
  word: "before" | "after",
): string | undefined {
  const match = duration.match(new RegExp(`\\b${word}\\s+(.+)$`, "i"));
  if (!match) return undefined;
  const raw = match[1].trim();
  return SHORT_LEAD_EVENT[raw.toLowerCase()] ?? raw;
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
 * Attribute chip label — amount + event, one line.
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
    if (!keepWhen) return amount;
    const event = leadEventTail(duration, "before");
    return event ? `${amount} before ${event}` : `${amount} before`;
  }
  if (kind === "lead" && /\bafter\b/i.test(duration)) {
    const amount = leadAmount(duration);
    if (!keepWhen) return amount;
    const event = leadEventTail(duration, "after");
    return event ? `${amount} after ${event}` : `${amount} after`;
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
  "inline-flex w-fit shrink-0 items-center gap-1 rounded-[var(--radius-sm)] border border-blue-600 bg-blue-100 px-2 py-1 text-xs leading-4 font-bold whitespace-nowrap text-blue-600";
/** Status chip — only when Planned works has not confirmed this row. */
const CHIP_MAY_APPLY =
  "inline-flex h-6 w-fit shrink-0 items-center rounded-[var(--radius-sm)] bg-warning-100 px-2 text-xs leading-4 font-bold text-warning-600";

function isLeadBefore(duration: string, kind?: TimingKind) {
  return kind === "lead" && /\bbefore\b/i.test(duration);
}

function leadApplyTip(duration: string, kind?: TimingKind) {
  if (!isLeadBefore(duration, kind)) return null;
  return "Lead time to apply, not CAG review time.";
}

/** Runway Tooltip trigger — info icon, hover/focus desktop, tap mobile. */
function WhenTip({ text, label }: { text: string; label: string }) {
  const tipId = useId();
  const mobile = useMobileViewport();
  const [tipOn, setTipOn] = useState(false);
  const tipAnchorRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!tipOn || !mobile) return;
    const onDoc = (e: PointerEvent) => {
      if (tipAnchorRef.current?.contains(e.target as Node)) return;
      setTipOn(false);
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
  }, [tipOn, mobile]);

  return (
    <span ref={tipAnchorRef} className="relative inline-flex shrink-0">
      <button
        type="button"
        aria-label={`${label}. ${text}`}
        aria-expanded={tipOn}
        aria-describedby={tipOn ? tipId : undefined}
        onClick={(e) => {
          e.stopPropagation();
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
        className="inline-flex shrink-0 appearance-none bg-transparent p-0 text-blue-600 hover:text-blue-700 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
      >
        <span aria-hidden className="inline-flex shrink-0">
          <IconLeaf
            src={infoIcon}
            leafW={14}
            leafH={14}
            frame={16}
            colorClass="text-current"
          />
        </span>
      </button>
      <DlsTooltip
        id={tipId}
        open={tipOn}
        side="top"
        anchorRef={tipAnchorRef}
      >
        {text}
      </DlsTooltip>
    </span>
  );
}

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
  const tip = leadApplyTip(duration, kind);
  return (
    <span className={CHIP_WHEN}>
      {label}
      {tip ? <WhenTip text={tip} label={label} /> : null}
    </span>
  );
}

function WhenChips({
  rows,
  role,
  asLead,
}: {
  rows: GuideTiming[];
  role: Role;
  asLead?: boolean;
}) {
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
    <div className="flex flex-col gap-2">
      {chips.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className={LABEL_CAPS}>When</p>
          <ul className="flex flex-wrap items-center gap-1.5">
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
        </div>
      )}
      {tasks.length > 0 &&
        (asLead ? (
          <div className="flex flex-col gap-2">
            {tasks.map((row) => (
              <p
                key={row.key}
                className="text-sm leading-[18px] text-grey-700"
              >
                {row.line}
              </p>
            ))}
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {tasks.map((row) => (
              <li key={row.key} className="flex items-start gap-3">
                <span
                  className="inline-flex h-5 w-2 shrink-0 items-center justify-center"
                  aria-hidden
                >
                  <IconLeaf src={dotIcon} leafW={5.33} leafH={5.33} frame={8} />
                </span>
                <p className="min-w-0 flex-1 text-base leading-5 text-grey-600">
                  {row.line}
                </p>
              </li>
            ))}
          </ul>
        ))}
    </div>
  );
}

function fileVerbLabel(doc: DocItem) {
  if (verbForDoc(doc) === "Use as sample") return "Sample";
  if (doc.externalUrl) return "Open";
  return verbForDoc(doc);
}

const FILE_KIND_ICON: Record<FileKind, string> = {
  guide: fileIcon,
  template: writeFormsIcon,
  sample: documentsIcon,
};

const FILE_GROUPS: {
  kind: FileKind;
  title: string;
  lead: string;
}[] = [
  { kind: "guide", title: "Guides", lead: "Rules for this step." },
  { kind: "template", title: "Templates", lead: "Forms you can start from." },
  { kind: "sample", title: "Samples", lead: "Filled examples to copy." },
];

function resourceRowClass(highlighted?: boolean) {
  return cn(
    "flex w-full items-start gap-1 rounded-[var(--radius-sm)] py-1.5 text-left",
    "text-sm leading-[18px] font-bold text-purple-600",
    "hover:text-purple-700",
    "focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]",
    highlighted && "text-purple-700",
  );
}

function resourceChipClass(highlighted?: boolean) {
  return cn(
    "inline-flex max-w-full items-center gap-1.5 rounded-full border px-3 py-1.5 text-left",
    "border-grey-200 bg-white text-sm leading-[18px] font-bold text-purple-600",
    "hover:border-purple-600 hover:bg-purple-100 hover:text-purple-700",
    "focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]",
    highlighted && "border-purple-600 bg-purple-100 text-purple-700",
  );
}

function DocFileRow({
  doc,
  stageName,
  stepName,
  highlighted,
  onPreview,
  layout = "chip",
}: {
  doc: DocItem;
  stageName: string;
  stepName: string;
  highlighted?: boolean;
  onPreview: (id: string) => void;
  layout?: "chip" | "row";
}) {
  const external = Boolean(doc.externalUrl);
  const verb = fileVerbLabel(doc);
  const kind = fileKind(doc);
  const rowClass =
    layout === "row" ? resourceRowClass(highlighted) : resourceChipClass(highlighted);
  const inner = (
    <>
      <span
        className="inline-flex h-[18px] w-3.5 shrink-0 items-center justify-center"
        aria-hidden
      >
        <IconLeaf
          src={FILE_KIND_ICON[kind]}
          leafW={14}
          leafH={14}
          frame={14}
          colorClass="text-current"
        />
      </span>
      <span className="min-w-0 flex-1 break-words">{doc.name}</span>
    </>
  );
  return (
    <li>
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

const DOC_PREVIEW_LIMIT = 6;

function StepFilesRail({
  guides,
  samples,
  systems,
  stageName,
  stepName,
  highlightedDocId,
  highlightedLabel,
  onPreview,
  compact,
}: {
  guides: DocItem[];
  samples: DocItem[];
  systems?: { label: string }[];
  stageName: string;
  stepName: string;
  highlightedDocId?: string | null;
  highlightedLabel?: string | null;
  onPreview: (id: string) => void;
  compact?: boolean;
}) {
  const docs = [...guides, ...samples];
  const overflow = docs.length > DOC_PREVIEW_LIMIT;
  const hitInRest =
    Boolean(highlightedDocId) &&
    docs.slice(DOC_PREVIEW_LIMIT).some((d) => d.id === highlightedDocId);
  const [open, setOpen] = useState(hitInRest);
  useEffect(() => {
    if (hitInRest) setOpen(true);
  }, [hitInRest, highlightedDocId]);
  const links = systems ?? [];
  if (docs.length === 0 && links.length === 0) return null;
  const shown = new Set(
    (overflow && !open ? docs.slice(0, DOC_PREVIEW_LIMIT) : docs).map((d) => d.id),
  );
  const hiddenCount = docs.length - DOC_PREVIEW_LIMIT;
  const moreBtn =
    overflow && docs.length > 0 ? (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="w-fit px-2 py-1 text-sm leading-[18px] font-bold text-purple-600 hover:text-purple-700 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
      >
        {open ? "Show less" : `${hiddenCount} more`}
      </button>
    ) : null;

  if (compact) {
    const files = docs.filter((d) => shown.has(d.id));
    const groups = FILE_GROUPS.map((group) => ({
      ...group,
      items: files.filter((d) => fileKind(d) === group.kind),
    })).filter((group) => group.items.length > 0);
    return (
      <section className="flex min-w-0 flex-col gap-4">
        {links.length > 0 ? (
          <FactField label={links.length === 1 ? "System" : "Systems"}>
            <ul className="flex flex-wrap gap-1.5" aria-label="Systems">
              {links.map((s) => {
                const highlighted =
                  Boolean(highlightedLabel) &&
                  s.label.toLowerCase() === highlightedLabel?.toLowerCase();
                return (
                  <li key={s.label} className="min-w-0">
                    <Link
                      id={systemRowDomId(stageName, stepName, s.label)}
                      to="/apps"
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Open ${s.label} (opens Apps)`}
                      className={resourceChipClass(highlighted)}
                    >
                      <span className="shrink-0" aria-hidden>
                        <IconLeaf
                          src={linkIcon}
                          leafW={14}
                          leafH={14}
                          frame={16}
                          colorClass="text-current"
                        />
                      </span>
                      <span className="min-w-0 break-words">{s.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </FactField>
        ) : null}
        {groups.map((group) => (
          <FactField key={group.kind} label={group.title}>
            <ul className="flex min-w-0 flex-col" aria-label={group.title}>
              {group.items.map((d) => (
                <DocFileRow
                  key={d.id}
                  doc={d}
                  stageName={stageName}
                  stepName={stepName}
                  highlighted={d.id === highlightedDocId}
                  onPreview={onPreview}
                  layout="row"
                />
              ))}
            </ul>
          </FactField>
        ))}
        {moreBtn}
      </section>
    );
  }

  const groups = FILE_GROUPS.map((group) => ({
    ...group,
    items: docs.filter((d) => fileKind(d) === group.kind && shown.has(d.id)),
  })).filter((group) => group.items.length > 0);
  return (
    <section className="flex min-w-0 flex-col gap-4">
      {groups.map((group) => (
        <div key={group.kind} className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-col gap-0.5">
            <h4 className="text-sm leading-[18px] font-bold text-black">
              {group.title}
            </h4>
            <p className="text-sm leading-[18px] text-grey-600">{group.lead}</p>
          </div>
          <ul className="flex flex-wrap gap-2">
            {group.items.map((d) => (
              <DocFileRow
                key={d.id}
                doc={d}
                stageName={stageName}
                stepName={stepName}
                highlighted={d.id === highlightedDocId}
                onPreview={onPreview}
              />
            ))}
          </ul>
        </div>
      ))}
      {moreBtn}
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
    <FactField label={systems.length === 1 ? "System" : "Systems"}>
      <ul className="flex flex-wrap gap-2" aria-label="Systems">
      {systems.map((s) => {
        const highlighted =
          Boolean(highlightedLabel) &&
          s.label.toLowerCase() === highlightedLabel?.toLowerCase();
        return (
          <li key={s.label}>
            <Link
              id={systemRowDomId(stageName, stepName, s.label)}
              to="/apps"
              onClick={(e) => e.stopPropagation()}
              aria-label={`Open ${s.label} (opens Apps)`}
              className={resourceChipClass(highlighted)}
            >
              <span className="shrink-0" aria-hidden>
                <IconLeaf
                  src={linkIcon}
                  leafW={14}
                  leafH={14}
                  frame={16}
                  colorClass="text-current"
                />
              </span>
              <span className="min-w-0 break-words">{s.label}</span>
            </Link>
          </li>
        );
      })}
      </ul>
    </FactField>
  );
}

function BulletList({ lines }: { lines: string[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {lines.map((line) => (
        <li key={line} className="flex items-start gap-3">
          <span
            className="inline-flex h-[18px] w-2 shrink-0 items-center justify-center"
            aria-hidden
          >
            <IconLeaf src={dotIcon} leafW={5.33} leafH={5.33} frame={8} />
          </span>
          <span className="text-sm leading-[18px] text-black">{line}</span>
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
    <li className="flex items-start gap-3">
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center",
          size === "body" ? "h-5 w-2" : "h-[18px] w-2",
        )}
        aria-hidden
      >
        <IconLeaf src={dotIcon} leafW={5.33} leafH={5.33} frame={8} />
      </span>
      <p
        className={
          size === "body"
            ? "min-w-0 flex-1 text-base leading-5 text-grey-600"
            : "min-w-0 flex-1 text-sm leading-[18px] text-black"
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
        "text-xs leading-4 font-bold",
        mine ? "text-purple-700" : "text-grey-600",
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


function MapChip({
  selected,
  disabled,
  children,
  onClick,
}: {
  selected?: boolean;
  disabled?: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center rounded-full px-3 text-sm leading-[18px]",
        "focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]",
        "disabled:opacity-40",
        selected
          ? "border border-purple-600 bg-purple-100 font-bold text-purple-700"
          : "border border-grey-200 bg-white text-grey-700 hover:border-purple-600 hover:bg-purple-100 hover:text-purple-700",
      )}
    >
      {children}
    </button>
  );
}

/** Exclusive map sections — dropdown of phases and their topics. */
function topicFilterOptions(
  phases: PhaseDeskId[],
  counts: Record<string, number>,
  allowAll?: boolean,
): DropdownOption[] {
  const topics = allChapterTopics().filter((topic) => {
    if (!phases.includes(topic.phaseId)) return false;
    return (counts[topicValue(topic.phaseId, topic.id)] ?? 0) > 0;
  });
  return [
    ...(allowAll ? [{ value: "all", label: "All", tone: "group" as const }] : []),
    ...phases.flatMap((id) => {
      const rows = topics.filter((topic) => topic.phaseId === id);
      if (rows.length === 0 && !allowAll) return [];
      const phaseCount = rows.reduce(
        (sum, topic) =>
          sum + (counts[topicValue(topic.phaseId, topic.id)] ?? 0),
        0,
      );
      return [
        {
          value: `phase:${id}`,
          label: TAB_LABEL[id],
          tone: "group" as const,
          hint: String(phaseCount),
        },
        ...rows.map((topic) => ({
          value: `topic:${id}:${topic.id}`,
          label: topic.title,
          prefix: TAB_LABEL[id],
          tone: "item" as const,
          hint: String(counts[topicValue(topic.phaseId, topic.id)] ?? 0),
        })),
      ];
    }),
  ];
}

function applyTopicFilterValue(
  next: string,
  onChange: (phaseId: PhaseDeskId | null) => void,
  onSelectTopic: (phaseId: PhaseDeskId, groupId: string | null) => void,
) {
  if (next === "all") {
    onChange(null);
    return;
  }
  if (next.startsWith("phase:")) {
    onChange(next.slice("phase:".length) as PhaseDeskId);
    return;
  }
  const rest = next.slice("topic:".length);
  const sep = rest.indexOf(":");
  if (sep < 0) return;
  onSelectTopic(rest.slice(0, sep) as PhaseDeskId, rest.slice(sep + 1));
}

function topicFilterValue(
  allowAll: boolean | undefined,
  value: PhaseDeskId | null,
  topicId: string | null,
) {
  return allowAll && !value
    ? "all"
    : value && topicId
      ? `topic:${value}:${topicId}`
      : value
        ? `phase:${value}`
        : "all";
}

function PhaseTabs({
  phases,
  value,
  topicId,
  counts,
  allowAll,
  disabled,
  alignSearch,
  tall,
  onChange,
  onSelectTopic,
}: {
  phases: PhaseDeskId[];
  value: PhaseDeskId | null;
  topicId: string | null;
  counts: Record<string, number>;
  allowAll?: boolean;
  disabled?: boolean;
  alignSearch?: boolean;
  tall?: boolean;
  onChange: (phaseId: PhaseDeskId | null) => void;
  onSelectTopic: (phaseId: PhaseDeskId, groupId: string | null) => void;
}) {
  const options = topicFilterOptions(phases, counts, allowAll);
  const selectedValue = topicFilterValue(allowAll, value, topicId);
  return (
    <DropdownField
      label={alignSearch ? "Filter results" : "Topics"}
      value={selectedValue}
      disabled={disabled}
      alignSearch={alignSearch}
      tall={tall}
      options={options}
      onChange={(next) => applyTopicFilterValue(next, onChange, onSelectTopic)}
    />
  );
}

function FilterIconButton({
  active,
  open,
  disabled,
  onClick,
}: {
  active: boolean;
  open: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={active ? "Filter results, filter on" : "Filter results"}
      aria-haspopup="dialog"
      aria-expanded={open}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "relative grid size-12 shrink-0 place-items-center",
        "rounded-[var(--radius-sm)] border bg-white",
        "focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]",
        "disabled:opacity-40",
        open || active
          ? "border-purple-600 text-purple-600"
          : "border-grey-200 text-grey-700 hover:bg-grey-50",
      )}
    >
      <IconLeaf
        src={filterOff}
        leafW={24}
        leafH={24}
        frame={24}
        colorClass="text-current"
      />
      {active ? (
        <span
          className="absolute top-2.5 right-2.5 size-1.5 rounded-full bg-[#ff4333]"
          aria-hidden
        />
      ) : null}
    </button>
  );
}

function groupDropdownSections(options: DropdownOption[]) {
  const sections: { group: DropdownOption | null; items: DropdownOption[] }[] =
    [];
  let current: { group: DropdownOption | null; items: DropdownOption[] } | null =
    null;
  for (const option of options) {
    if (option.tone === "group") {
      if (current) sections.push(current);
      current = { group: option, items: [] };
    } else {
      if (!current) current = { group: null, items: [] };
      current.items.push(option);
    }
  }
  if (current) sections.push(current);
  return sections;
}

function FilterSheetList({
  options,
  selectedValue,
  activeIndex,
  listId,
  listRef,
  labelledBy,
  onPick,
  onListKey,
  onActive,
}: {
  options: DropdownOption[];
  selectedValue: string;
  activeIndex: number;
  listId: string;
  listRef: RefObject<HTMLUListElement | null>;
  labelledBy?: string;
  onPick: (value: string) => void;
  onListKey: (e: KeyboardEvent<HTMLUListElement>) => void;
  onActive: (index: number) => void;
}) {
  const sections = groupDropdownSections(options);
  let index = 0;
  return (
    <ul
      ref={listRef}
      id={listId}
      role="listbox"
      aria-labelledby={labelledBy}
      tabIndex={-1}
      onKeyDown={onListKey}
      className="min-h-0 flex-1 overflow-y-auto pb-2"
    >
      {sections.map((section, sectionIndex) => {
        const group = section.group;
        const groupIndex = group ? index++ : -1;
        const groupSelected = Boolean(group && group.value === selectedValue);
        return (
          <li
            key={group?.value ?? `section-${sectionIndex}`}
            className={cn(sectionIndex > 0 && "border-t border-grey-100")}
          >
            {group ? (
              <div
                role="option"
                aria-selected={groupSelected}
                data-index={groupIndex}
                onPointerEnter={() => onActive(groupIndex)}
                onClick={() => onPick(group.value)}
                className={cn(
                  "flex w-full cursor-pointer items-baseline justify-between gap-3 px-4 pb-1 pt-4 text-left text-sm leading-[18px] font-bold",
                  groupSelected
                    ? "text-purple-700"
                    : activeIndex === groupIndex
                      ? "text-purple-700"
                      : "text-black",
                )}
              >
                <span className="min-w-0">{group.label}</span>
                {group.hint ? (
                  <span className="shrink-0 text-xs leading-4 font-normal text-grey-400">
                    {group.hint}
                  </span>
                ) : null}
              </div>
            ) : null}
            <ul>
              {section.items.map((item) => {
                const itemIndex = index++;
                const isSelected = item.value === selectedValue;
                const isActive = itemIndex === activeIndex;
                return (
                  <li key={item.value}>
                    <div
                      role="option"
                      aria-selected={isSelected}
                      data-index={itemIndex}
                      onPointerEnter={() => onActive(itemIndex)}
                      onClick={() => onPick(item.value)}
                      className={cn(
                        "flex w-full cursor-pointer items-baseline justify-between gap-3 px-4 py-3 text-left text-sm leading-[18px]",
                        isSelected && "bg-purple-100 font-bold text-purple-700",
                        !isSelected && isActive && "bg-purple-100",
                        !isSelected && !isActive && "text-black",
                      )}
                    >
                      <span className="min-w-0">{item.label}</span>
                      {item.hint ? (
                        <span
                          className={cn(
                            "shrink-0 text-xs leading-4 font-normal",
                            isSelected ? "text-purple-500" : "text-grey-400",
                          )}
                        >
                          {item.hint}
                        </span>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </li>
        );
      })}
    </ul>
  );
}

function FilterOptionList({
  options,
  selectedValue,
  onPick,
}: {
  options: DropdownOption[];
  selectedValue: string;
  onPick: (value: string) => void;
}) {
  return (
    <ul className="min-h-0 flex-1 overflow-y-auto py-1">
      {options.map((option) => {
        const isSelected = option.value === selectedValue;
        const isGroup = option.tone === "group";
        const isItem = option.tone === "item";
        return (
          <li key={option.value}>
            <button
              type="button"
              aria-current={isSelected ? "true" : undefined}
              onClick={() => onPick(option.value)}
              className={cn(
                "flex w-full items-baseline justify-between gap-3 py-3 text-left text-sm leading-[18px] tablet:text-base tablet:leading-5",
                isItem ? "pr-4 pl-8" : "px-4",
                isGroup && !isSelected && "font-bold",
                isSelected && "bg-purple-100 font-bold text-purple-700",
                !isSelected && isGroup && "text-grey-500",
                !isSelected && !isGroup && "text-black",
              )}
            >
              <span className="min-w-0">
                <DropdownLabel
                  prefix={isItem ? undefined : option.prefix}
                  label={option.label}
                />
              </span>
              {option.hint ? (
                <span
                  className={cn(
                    "shrink-0 text-xs leading-4 font-normal",
                    isSelected ? "text-purple-500" : "text-grey-400",
                  )}
                >
                  {option.hint}
                </span>
              ) : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function SearchFilter({
  open,
  active,
  disabled,
  phases,
  value,
  topicId,
  counts,
  onOpen,
  onClose,
  onChange,
  onSelectTopic,
}: {
  open: boolean;
  active: boolean;
  disabled?: boolean;
  phases: PhaseDeskId[];
  value: PhaseDeskId | null;
  topicId: string | null;
  counts: Record<string, number>;
  onOpen: () => void;
  onClose: () => void;
  onChange: (phaseId: PhaseDeskId | null) => void;
  onSelectTopic: (phaseId: PhaseDeskId, groupId: string | null) => void;
}) {
  const mobile = useMobileViewport();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const options = topicFilterOptions(phases, counts, true);
  const selectedValue = topicFilterValue(true, value, topicId);
  const pick = (next: string) => {
    applyTopicFilterValue(next, onChange, onSelectTopic);
    onClose();
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || mobile) return;
    const onDoc = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) onClose();
    };
    window.addEventListener("pointerdown", onDoc);
    return () => window.removeEventListener("pointerdown", onDoc);
  }, [open, mobile, onClose]);

  useEffect(() => {
    if (!open || !mobile) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, mobile]);

  const header = (
    <header className="flex items-center justify-between gap-3 border-b border-grey-75 px-4 py-3">
      <h2
        id="filter-results-title"
        className="text-lg leading-[22px] font-bold text-black"
      >
        Filter
      </h2>
      <OverlayIconBtn label="Close" onClick={onClose}>
        <OverlayCloseGlyph />
      </OverlayIconBtn>
    </header>
  );

  return (
    <div ref={rootRef} className="relative shrink-0">
      <FilterIconButton
        active={active}
        open={open}
        disabled={disabled}
        onClick={() => (open ? onClose() : onOpen())}
      />
      {open && !mobile ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="filter-results-title"
          className="absolute top-full right-0 z-40 mt-1 flex max-h-[min(28rem,70vh)] w-80 flex-col rounded-[var(--radius-md)] border border-grey-200 bg-white shadow-[var(--shadow-light-bg)]"
        >
          {header}
          <FilterOptionList
            options={options}
            selectedValue={selectedValue}
            onPick={pick}
          />
        </div>
      ) : null}
      {open && mobile
        ? createPortal(
            <div className="fixed inset-0 z-50 flex items-end justify-center">
              <button
                type="button"
                aria-label="Close filter"
                className="absolute inset-0 bg-black/40"
                onClick={onClose}
              />
              <aside
                role="dialog"
                aria-modal="true"
                aria-labelledby="filter-results-title"
                className="relative flex max-h-[80vh] w-full flex-col rounded-t-[var(--radius-2xl)] bg-white shadow-[var(--shadow-light-bg)]"
              >
                {header}
                <FilterOptionList
                  options={options}
                  selectedValue={selectedValue}
                  onPick={pick}
                />
              </aside>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

function ChapterRail({
  phases,
  activePhaseId,
  openGroupId,
  activeGroupId = null,
  counts,
  disabled,
  flat,
  hideHeading,
  searching,
  findPhaseId,
  findGroupId,
  onSelectPhase,
  onSelectTopic,
}: {
  phases: PhaseDeskId[];
  activePhaseId: PhaseDeskId;
  openGroupId: string | null;
  activeGroupId?: string | null;
  counts: Record<string, number>;
  disabled?: boolean;
  flat?: boolean;
  hideHeading?: boolean;
  searching?: boolean;
  findPhaseId?: PhaseDeskId | null;
  findGroupId?: string | null;
  onSelectPhase: (phaseId: PhaseDeskId | null) => void;
  onSelectTopic: (phaseId: PhaseDeskId, groupId: string | null) => void;
}) {
  const phaseId = searching ? (findPhaseId ?? null) : activePhaseId;
  const topicId = searching
    ? (findGroupId ?? null)
    : (openGroupId ?? activeGroupId ?? null);
  const topics = allChapterTopics().filter((topic) => {
    if (!phases.includes(topic.phaseId)) return false;
    return (counts[topicValue(topic.phaseId, topic.id)] ?? 0) > 0;
  });
  const phaseTopics = phaseId
    ? topics.filter((topic) => topic.phaseId === phaseId)
    : [];

  if (flat) {
    if (!phaseId) {
      return (
        <p className="text-sm leading-[18px] text-grey-600">
          Pick a phase to see topics.
        </p>
      );
    }
    return (
      <div className="flex flex-col gap-3">
        {hideHeading ? null : <p className={LABEL_CAPS}>Topics</p>}
        <div className="flex flex-col gap-1" role="group" aria-label="Topics">
          {phaseTopics.map((topic) => {
            const on = topicId === topic.id;
            const n = counts[topicValue(topic.phaseId, topic.id)] ?? 0;
            return (
              <button
                key={topicValue(topic.phaseId, topic.id)}
                type="button"
                disabled={disabled}
                aria-current={on ? "location" : undefined}
                onClick={() =>
                  onSelectTopic(topic.phaseId, on ? null : topic.id)
                }
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-[var(--radius-sm)] px-3 py-2 text-left text-sm leading-[18px]",
                  "focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]",
                  "disabled:opacity-40",
                  on
                    ? "bg-purple-100 font-bold text-purple-600"
                    : "text-black hover:bg-grey-25",
                )}
              >
                <span className="min-w-0">{topic.title}</span>
                {n > 0 ? (
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-xs leading-4 font-bold",
                      on
                        ? "bg-purple-200 text-purple-700"
                        : "bg-grey-75 text-grey-600",
                    )}
                  >
                    {n}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className={LABEL_CAPS}>Topics</p>
      <div className="flex flex-col gap-1">
        {phases.map((id) => {
          const rows = topics.filter((topic) => topic.phaseId === id);
          if (rows.length === 0 && !searching) return null;
          const expanded = phaseId === id;
          const phaseCount = rows.reduce(
            (sum, topic) =>
              sum + (counts[topicValue(topic.phaseId, topic.id)] ?? 0),
            0,
          );
          return (
            <div key={id} className="flex flex-col gap-0.5">
              <button
                type="button"
                disabled={disabled}
                aria-expanded={expanded}
                aria-current={expanded ? "location" : undefined}
                onClick={() => onSelectPhase(id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-3 text-left text-sm leading-[18px] font-bold",
                  "focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]",
                  "disabled:opacity-40",
                  expanded
                    ? "py-2 text-purple-600"
                    : "py-2 text-grey-500 hover:bg-grey-25 hover:text-grey-700",
                )}
              >
                <span className="min-w-0 flex-1">{TAB_LABEL[id]}</span>
                {!expanded && phaseCount > 0 ? (
                  <span className="shrink-0 text-xs leading-4 text-grey-400">
                    {phaseCount}
                  </span>
                ) : null}
              </button>
              {expanded
                ? rows.map((topic) => {
                    const on =
                      phaseId === topic.phaseId && topicId === topic.id;
                    const n = counts[topicValue(topic.phaseId, topic.id)] ?? 0;
                    return (
                      <button
                        key={topicValue(topic.phaseId, topic.id)}
                        type="button"
                        disabled={disabled}
                        aria-current={on ? "location" : undefined}
                        onClick={() => onSelectTopic(topic.phaseId, topic.id)}
                        className={cn(
                          "flex w-full items-baseline justify-between gap-3 rounded-[var(--radius-sm)] py-2 pr-3 pl-8 text-left text-sm leading-[18px]",
                          "focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]",
                          "disabled:opacity-40",
                          on
                            ? "bg-purple-100 font-bold text-purple-600"
                            : "text-black hover:bg-grey-25",
                        )}
                      >
                        <span>{topic.title}</span>
                        <span
                          className={cn(
                            "shrink-0 text-xs leading-4 font-normal",
                            on ? "text-purple-500" : "text-grey-400",
                          )}
                        >
                          {n}
                        </span>
                      </button>
                    );
                  })
                : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SearchGlyph() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
      className="size-5"
    >
      <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.67" />
      <path
        d="M13 13l4 4"
        stroke="currentColor"
        strokeWidth="1.67"
        strokeLinecap="round"
      />
    </svg>
  );
}


function ProcessFind({
  query,
  chips,
  keywords,
  hits,
  disabled,
  trailing,
  showChips = true,
  onQuery,
  onChip,
  onOpenHit,
  onViewAll,
  onSuggestOpen,
}: {
  query: string;
  chips: readonly string[];
  keywords: readonly string[];
  hits: ProcessFindHit[];
  disabled?: boolean;
  trailing?: ReactNode;
  showChips?: boolean;
  onQuery: (value: string) => void;
  onChip: (chip: string) => void;
  onOpenHit: (hit: ProcessFindHit) => void;
  onViewAll: () => void;
  onSuggestOpen?: (open: boolean) => void;
}) {
  const inputId = useId();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const skipFocusOpen = useRef(false);
  const [open, setOpen] = useState(false);
  const typed = Boolean(normalizeQuery(query));
  const suggestions = suggestKeywords(query, typed ? keywords : chips);
  const fileHits = typed ? hits.filter((hit) => hit.kind === "file") : [];
  const systemHits = typed ? hits.filter((hit) => hit.kind === "system") : [];
  const stepHits = typed ? hits.filter((hit) => hit.kind === "guide") : [];
  const peekKinds = [fileHits, systemHits, stepHits].filter(
    (list) => list.length > 0,
  ).length;
  const peekEach = peekKinds > 1 ? 1 : 2;
  const peekFiles = fileHits.slice(0, peekEach);
  const peekSystems = systemHits.slice(0, peekEach);
  const peekSteps = stepHits.slice(0, peekEach);
  const peeks = [...peekFiles, ...peekSystems, ...peekSteps];
  const showOverlay =
    open &&
    !disabled &&
    (suggestions.length > 0 || peeks.length > 0 || (typed && hits.length > 0));

  useEffect(() => {
    onSuggestOpen?.(showOverlay);
  }, [onSuggestOpen, showOverlay]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const closeOverlay = () => setOpen(false);

  return (
    <div>
      <div className={cn(trailing && "flex items-center gap-3")}>
        <div
          ref={rootRef}
          className={cn("relative min-w-0 flex-1", showOverlay && "z-30")}
        >
          <form
            role="search"
            className={cn(showOverlay && "relative z-30")}
            onSubmit={(event) => {
              event.preventDefault();
              closeOverlay();
              onViewAll();
            }}
          >
            <label className="sr-only" htmlFor={inputId}>
              Search guides
            </label>
            <SearchField
              ref={inputRef}
              id={inputId}
              label="Search guides"
              role="combobox"
              aria-expanded={showOverlay}
              aria-controls={listId}
              aria-autocomplete="list"
              disabled={disabled}
              placeholder="Search guides"
              value={query}
              onFocus={() => {
                if (skipFocusOpen.current) return;
                setOpen(true);
              }}
              onMouseDown={() => {
                if (skipFocusOpen.current) return;
                setOpen(true);
              }}
              onChange={(event) => {
                onQuery(event.target.value);
                setOpen(true);
              }}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.preventDefault();
                  if (open) {
                    closeOverlay();
                    return;
                  }
                  if (query) onQuery("");
                }
              }}
              onClear={() => {
                skipFocusOpen.current = true;
                onQuery("");
                setOpen(false);
                requestAnimationFrame(() => {
                  inputRef.current?.blur();
                  skipFocusOpen.current = false;
                });
              }}
              leading={<SearchGlyph />}
            />
          </form>
          {showOverlay ? (
            <div
              id={listId}
              role="listbox"
              aria-label="Suggested guides"
              className="absolute inset-x-0 top-full z-20 -mt-1 max-h-[min(28rem,70dvh)] overflow-y-auto rounded-[var(--radius-2xl)] border border-grey-200 bg-white pt-1 pb-2 shadow-[var(--shadow-light-bg)]"
            >
              {suggestions.length > 0 ? (
                <div>
                  <p className={cn(LABEL_CAPS, "px-4 pt-3 pb-1")}>
                    {typed ? "Suggested" : "Try these"}
                  </p>
                  {suggestions.map((chip) => {
                    const selected =
                      normalizeQuery(chip) === normalizeQuery(query);
                    return (
                      <button
                        key={chip}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        disabled={disabled}
                        onClick={() => {
                          onChip(chip);
                          (
                            document.getElementById(
                              inputId,
                            ) as HTMLInputElement | null
                          )?.blur();
                          closeOverlay();
                        }}
                        className={cn(
                          "flex w-full items-center px-4 py-2.5 text-left",
                          "focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--color-purple-600)]",
                          "disabled:opacity-40",
                          selected
                            ? "bg-purple-100"
                            : "hover:bg-grey-50",
                        )}
                      >
                        <span
                          className={cn(
                            "min-w-0 flex-1 text-sm leading-[18px]",
                            selected
                              ? "font-bold text-purple-600"
                              : "text-black",
                          )}
                        >
                          {chip}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : null}
              {peeks.length > 0 ? (
                <div
                  className={cn(suggestions.length > 0 && "border-t border-grey-100")}
                >
                  {peekFiles.length > 0 ? (
                    <div>
                      <p className={cn(LABEL_CAPS, "px-4 pt-3 pb-1")}>Files</p>
                      {peekFiles.map((hit) => (
                        <SearchHitRow
                          key={hit.id}
                          title={hit.title}
                          preview={hit.hint}
                          icon={
                            <IconLeaf
                              src={FILE_KIND_ICON[hit.fileKind]}
                              leafW={14}
                              leafH={14}
                              frame={16}
                              colorClass="text-purple-600"
                            />
                          }
                          onClick={() => {
                            onOpenHit(hit);
                            closeOverlay();
                          }}
                        />
                      ))}
                    </div>
                  ) : null}
                  {peekSystems.length > 0 ? (
                    <div
                      className={cn(
                        peekFiles.length > 0 && "border-t border-grey-100",
                      )}
                    >
                      <p className={cn(LABEL_CAPS, "px-4 pt-3 pb-1")}>
                        Systems
                      </p>
                      {peekSystems.map((hit) => (
                        <SearchHitRow
                          key={hit.id}
                          title={hit.title}
                          icon={
                            <IconLeaf
                              src={linkIcon}
                              leafW={14}
                              leafH={14}
                              frame={16}
                              colorClass="text-purple-600"
                            />
                          }
                          onClick={() => {
                            onOpenHit(hit);
                            closeOverlay();
                          }}
                        />
                      ))}
                    </div>
                  ) : null}
                  {peekSteps.length > 0 ? (
                    <div
                      className={cn(
                        (peekFiles.length > 0 || peekSystems.length > 0) &&
                          "border-t border-grey-100",
                      )}
                    >
                      <p className={cn(LABEL_CAPS, "px-4 pt-3 pb-1")}>Steps</p>
                      {peekSteps.map((hit) => (
                        <SearchHitRow
                          key={hit.id}
                          title={hit.title}
                          preview={hit.preview}
                          onClick={() => {
                            onOpenHit(hit);
                            closeOverlay();
                          }}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
              {typed && hits.length > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    closeOverlay();
                    onViewAll();
                  }}
                  className={cn(
                    "flex w-full items-center border-t border-grey-100 px-4 py-3 text-left text-sm leading-[18px] font-bold text-purple-600",
                    "hover:bg-purple-100",
                    "focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]",
                  )}
                >
                  {hits.length === 1
                    ? "View all 1 result"
                    : `View all ${hits.length} results`}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
        {trailing}
      </div>
      {showChips && !typed && !showOverlay && chips.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {chips.map((chip) => (
            <MapChip
              key={chip}
              disabled={disabled}
              onClick={() => onChip(chip)}
            >
              {chip}
            </MapChip>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SearchResults({
  query,
  hits,
  openKey,
  onOpen,
  onBack,
  renderHit,
}: {
  query: string;
  hits: ProcessFindHit[];
  openKey: string | null;
  onOpen: (hit: ProcessFindHit) => void;
  onBack: () => void;
  renderHit: (hit: ProcessFindHit) => ReactNode;
}) {
  const files = hits.filter((hit): hit is ProcessFindFileHit => hit.kind === "file");
  const systems = hits.filter(
    (hit): hit is ProcessFindSystemHit => hit.kind === "system",
  );
  const groups = groupGuideHits(hits);
  const hasSteps = groups.some((phase) => phase.chapters.length > 0);
  const q = query.trim();
  const opened =
    hits.find((hit) => hit.kind === "guide" && hit.id === openKey) ?? null;
  const resultWord =
    files.length > 0 || systems.length > 0 ? "result" : "guide";
  if (hits.length === 0) {
    return (
      <div className="rounded-[var(--radius-2xl)] bg-white px-4 py-6 shadow-[var(--shadow-light-bg)] tablet:px-6">
        <h2 className={TITLE_SEARCH}>
          No guides match “{q}”
        </h2>
        <p className="mt-1 text-sm leading-[18px] text-grey-600">
          Try another name, or clear search to return to the map.
        </p>
      </div>
    );
  }
  if (opened) {
    const backLabel =
      hits.length === 1
        ? `Back to 1 ${resultWord} for “${q}”`
        : `Back to ${hits.length} ${resultWord}s for “${q}”`;
    return (
      <div className="flex flex-col gap-4">
        <OverlayBackBtn onClick={onBack}>{backLabel}</OverlayBackBtn>
        <div className="overflow-hidden rounded-[var(--radius-2xl)] bg-white px-4 py-4 shadow-[var(--shadow-light-bg)] tablet:px-6 tablet:py-5">
          <p className="text-sm leading-[18px] text-grey-400">{opened.hint}</p>
          <h2 className={cn("mt-1", TITLE_SEARCH)}>
            {opened.title}
          </h2>
          {opened.preview ? (
            <p className="mt-1 text-sm leading-[18px] text-grey-500">
              {opened.preview}
            </p>
          ) : null}
          <div className="mt-4 border-t border-grey-100 pt-4">
            {renderHit(opened)}
          </div>
        </div>
      </div>
    );
  }
  const stepCount = groups.reduce(
    (sum, phase) =>
      sum + phase.chapters.reduce((n, chapter) => n + chapter.hits.length, 0),
    0,
  );
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h2 className={TITLE_SEARCH} aria-live="polite">
          {hits.length === 1
            ? `1 ${resultWord} for “${q}”`
            : `${hits.length} ${resultWord}s for “${q}”`}
        </h2>
      </header>
      {files.length > 0 ? (
        <FindLane title="Files" count={files.length}>
          {files.map((hit) => (
            <FindHitButton
              key={hit.id}
              title={hit.title}
              preview={hit.hint}
              icon={
                <IconLeaf
                  src={FILE_KIND_ICON[hit.fileKind]}
                  leafW={16}
                  leafH={16}
                  frame={20}
                  colorClass="text-purple-600"
                />
              }
              onClick={() => onOpen(hit)}
            />
          ))}
        </FindLane>
      ) : null}
      {systems.length > 0 ? (
        <FindLane title="Systems" count={systems.length}>
          {systems.map((hit) => (
            <FindHitButton
              key={hit.id}
              title={hit.title}
              icon={
                <IconLeaf
                  src={linkIcon}
                  leafW={16}
                  leafH={16}
                  frame={20}
                  colorClass="text-purple-600"
                />
              }
              onClick={() => onOpen(hit)}
            />
          ))}
        </FindLane>
      ) : null}
      {hasSteps ? (
        <FindLane title="Steps" count={stepCount}>
          <div className="flex flex-col gap-5 px-4 py-4 tablet:px-6">
            {groups.flatMap((phase) =>
              phase.chapters.map((chapter) => (
                <div
                  key={`${phase.phaseId}-${chapter.groupId}`}
                  className="flex flex-col gap-2"
                >
                  <p className="text-sm leading-[18px] font-bold text-grey-600">
                    {chapter.title}
                  </p>
                  <div className="overflow-hidden rounded-[var(--radius-md)] border border-grey-100">
                    {chapter.hits.map((hit) => (
                      <FindHitButton
                        key={hit.id}
                        title={hit.title}
                        preview={hit.preview}
                        onClick={() => onOpen(hit)}
                      />
                    ))}
                  </div>
                </div>
              )),
            )}
          </div>
        </FindLane>
      ) : null}
    </div>
  );
}

function FindLane({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[var(--radius-2xl)] bg-white shadow-[var(--shadow-light-bg)]">
      <header className="flex items-baseline justify-between gap-3 border-b border-grey-100 px-4 py-3 tablet:px-6">
        <h3 className="text-base leading-5 font-bold text-black">{title}</h3>
        <p className="text-sm leading-[18px] text-grey-500">{count}</p>
      </header>
      <div className="flex flex-col">{children}</div>
    </section>
  );
}

function FindHitButton({
  title,
  preview,
  icon,
  onClick,
}: {
  title: string;
  preview?: string;
  icon?: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full items-center gap-3 border-t border-grey-100 px-4 py-3.5 text-left first:border-t-0 tablet:px-5",
        "hover:bg-grey-25",
        "focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--color-purple-600)]",
      )}
    >
      {icon ? (
        <span className="shrink-0" aria-hidden>
          {icon}
        </span>
      ) : null}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-base leading-5 font-bold text-purple-600 group-hover:text-purple-700">
          {title}
        </span>
        {preview ? (
          <span className="text-sm leading-[18px] text-grey-500">{preview}</span>
        ) : null}
      </span>
    </button>
  );
}

function PhaseDesk({
  phaseId,
  items,
  role,
  openId,
  renderCard,
  focusStep = null,
  onSelectGroup,
  onOpenStep,
  allowGroupJump = true,
}: {
  phaseId: PhaseDeskId;
  items: GuideItem[];
  role: Role;
  openId: string | null;
  renderCard: (item: GuideItem) => ReactNode;
  focusStep?: { stageName: string; stepName: string } | null;
  onSelectGroup?: (groupId: string | null) => void;
  onOpenStep?: (
    step: { stageName: string; stepName: string } | null,
  ) => void;
  allowGroupJump?: boolean;
}) {
  const desk = PHASE_DESKS[phaseId];
  const groups = desk.groups
    .map((group) => ({
      group,
      members: items.filter((item) =>
        group.match(item.stageName, item.classified.step.name),
      ),
    }))
    .filter((row) => row.members.length > 0);
  const visible = openId
    ? groups.filter((row) => row.group.id === openId)
    : groups;
  const focusKey = focusStep
    ? stepFocusKey(focusStep.stageName, focusStep.stepName)
    : null;
  const [openStepKey, setOpenStepKey] = useState<string | null>(focusKey);

  useEffect(() => {
    setOpenStepKey(focusKey);
  }, [openId, phaseId, focusKey]);

  useEffect(() => {
    if (!openStepKey) {
      onOpenStep?.(null);
      return;
    }
    const sep = openStepKey.indexOf("::");
    if (sep < 0) {
      onOpenStep?.(null);
      return;
    }
    onOpenStep?.({
      stageName: openStepKey.slice(0, sep),
      stepName: openStepKey.slice(sep + 2),
    });
  }, [openStepKey, onOpenStep]);

  useLayoutEffect(() => {
    if (!openStepKey) return;
    const el = rowElForStepKey(openStepKey);
    if (!el) return;
    const frame =
      el.parentElement instanceof HTMLElement ? el.parentElement : el;
    const align = () => alignCardToRail(frame, "smooth");
    let inner = 0;
    const outer = window.requestAnimationFrame(() => {
      inner = window.requestAnimationFrame(align);
    });
    return () => {
      window.cancelAnimationFrame(outer);
      window.cancelAnimationFrame(inner);
    };
  }, [openStepKey, openId, phaseId]);

  return (
    <div className="flex flex-col gap-8 pb-[calc(100dvh-16rem)]">
      {visible.map(({ group, members }) => {
        const heading = (
          <div
            className={cn(
              "min-w-0 flex-1",
              openId && "flex flex-col gap-3",
            )}
          >
            {openId && onSelectGroup ? (
              <button
                type="button"
                onClick={() => onSelectGroup(null)}
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
                All topics
              </button>
            ) : null}
            {openId ? (
              <h2 className={TITLE_PAGE}>{group.title}</h2>
            ) : allowGroupJump && onSelectGroup ? (
              <span className={TITLE_GROUP}>{group.title}</span>
            ) : (
              <h3 className={TITLE_GROUP}>{group.title}</h3>
            )}
            {openId ? (
              <p className="text-sm leading-[18px] text-grey-500">
                {group.lead}
              </p>
            ) : null}
          </div>
        );
        return (
        <section
          key={group.id}
          id={`topic-${group.id}`}
          aria-label={group.title}
          className={cn(
            "flex scroll-mt-[12rem] flex-col tablet:scroll-mt-8",
            openId ? "gap-5" : "gap-3",
          )}
        >
          {onSelectGroup && allowGroupJump && !openId ? (
            <button
              type="button"
              onClick={() => onSelectGroup(group.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-[var(--radius-sm)] text-left",
                "hover:bg-grey-25",
                "focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]",
              )}
            >
              {heading}
            </button>
          ) : (
            <header className="flex items-center gap-3">{heading}</header>
          )}
          {(() => {
            const segments: { open: boolean; items: GuideItem[] }[] = [];
            let closed: GuideItem[] = [];
            for (const item of members) {
              const key = stepFocusKey(
                item.stageName,
                item.classified.step.name,
              );
              if (key === openStepKey) {
                if (closed.length) {
                  segments.push({ open: false, items: closed });
                  closed = [];
                }
                segments.push({ open: true, items: [item] });
              } else {
                closed.push(item);
              }
            }
            if (closed.length) segments.push({ open: false, items: closed });
            return (
              <div
                className={cn(
                  "flex flex-col overflow-visible",
                  openStepKey && "gap-5",
                )}
              >
                {segments.map((seg) => {
                  const segKey = stepFocusKey(
                    seg.items[0].stageName,
                    seg.items[0].classified.step.name,
                  );
                  return (
                    <div
                      key={`${seg.open ? "open" : "stack"}-${segKey}`}
                      className={cn(
                        "rounded-[var(--radius-2xl)] bg-white",
                        "shadow-[var(--shadow-light-bg)]",
                        "transition-[box-shadow] duration-200 ease-out",
                        seg.open
                          ? "relative z-10 outline outline-2 outline-purple-400"
                          : "overflow-hidden",
                      )}
                    >
                      {seg.items.map((item, index) => {
                        const key = stepFocusKey(
                          item.stageName,
                          item.classified.step.name,
                        );
                        const stepOpen = seg.open;
                        const copyStep = item.packMembers?.length
                          ? PTW_PACK_HOST
                          : item.classified.step.name;
                        const title = cardTitle(
                          role,
                          item.stageName,
                          copyStep,
                        );
                        const why = cardWhy(role, item.stageName, copyStep);
                        const who = whoLine(
                          role,
                          item.classified.step.people,
                        );
                        return (
                          <div
                            key={key}
                            id={findRowDomId(
                              item.stageName,
                              item.classified.step.name,
                            )}
                            data-step-key={key}
                            className="scroll-mt-[12rem] tablet:scroll-mt-8"
                          >
                            <button
                              type="button"
                              aria-expanded={stepOpen}
                              onClick={() =>
                                setOpenStepKey(stepOpen ? null : key)
                              }
                              className={cn(
                                "flex w-full items-start gap-3 px-5 py-4 text-left tablet:px-6",
                                stepOpen ? "pb-4" : "hover:bg-grey-25",
                                index > 0 && "border-t border-grey-100",
                                "focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--color-purple-600)]",
                              )}
                            >
                              <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                                <span className="text-base leading-5 font-bold text-black">
                                  {title}
                                </span>
                                {why ? (
                                  <span
                                    className={cn(
                                      "text-sm leading-[18px]",
                                      stepOpen
                                        ? "text-grey-700"
                                        : "text-grey-600",
                                    )}
                                  >
                                    {why}
                                  </span>
                                ) : who && who !== "You" ? (
                                  <span className="text-xs leading-4 text-grey-400">
                                    {who}
                                  </span>
                                ) : null}
                              </span>
                              <IconLeaf
                                src={caretDown}
                                leafW={10}
                                leafH={5.83}
                                frame={16}
                                rotate={stepOpen ? 180 : 0}
                                colorClass="mt-0.5 text-grey-400"
                              />
                            </button>
                            {stepOpen ? (
                              <div className="border-t border-grey-100 px-5 pb-6 pt-4 tablet:px-6">
                                {renderCard(item)}
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </section>
        );
      })}
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
            ? "min-h-20 gap-3 px-4 py-4 desktop:gap-4 desktop:p-4 border border-grey-200 bg-white hover:bg-grey-50"
            : finished
              ? "min-h-20 gap-3 px-4 py-3 desktop:gap-4 desktop:p-4 bg-purple-100 hover:bg-purple-200"
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

function PlannedWorksSheet({
  open,
  questions,
  state,
  onToggle,
  onSave,
  onClose,
  allowUnsure = true,
  scope = "fitout",
}: {
  open: boolean;
  questions: QuizQuestion[];
  state: QuizState;
  onToggle: (questionId: QuestionId, optionId: string) => void;
  onSave: () => void;
  onClose: () => void;
  allowUnsure?: boolean;
  scope?: QuizScope;
}) {
  const ui = quizUiCopy(scope);
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
        className="absolute inset-0 bg-black/40"
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
              {ui.sheetTitle}
            </h2>
            <p className="mt-1 text-sm leading-[18px] text-grey-700">
              {ui.bannerContractor}
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
            {ui.pauseHint}
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
              {ui.officerCancelCta}
            </GuideCta>
            <GuideCta
              className={cn("h-10 min-h-10 w-full px-4", !mobile && "flex-1")}
              onClick={onSave}
            >
              {ui.sheetSaveCta}
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
  scope = "fitout",
}: {
  open: boolean;
  onConfirm: () => void;
  onClose: () => void;
  scope?: QuizScope;
}) {
  const ui = quizUiCopy(scope);
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
        className="absolute inset-0 bg-black/40"
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
            {ui.officerEditGateTitle}
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
            {ui.officerEditGateBody}
          </p>
        </div>
        <footer className="flex flex-col gap-3 border-t border-grey-75 px-4 py-3 tablet:px-5 tablet:flex-row tablet:justify-end">
          <GuideCta
            tone="ghost"
            className="h-10 min-h-10 w-full px-4 tablet:w-fit"
            onClick={onClose}
          >
            {ui.officerEditGateCancel}
          </GuideCta>
          <GuideCta
            className="h-10 min-h-10 w-full px-4 tablet:w-fit"
            onClick={onConfirm}
          >
            {ui.officerEditGateCta}
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
  scope = "fitout",
}: {
  open: boolean;
  rows: QuizReviewRow[];
  onClose: () => void;
  onEdit: () => void;
  onConfirm: () => void;
  onBlocked: () => void;
  scope?: QuizScope;
}) {
  const ui = quizUiCopy(scope);
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
        className="absolute inset-0 bg-black/40"
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
            {ui.officerConfirmSheetTitle}
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
                hint={ui.officerBlockedHint}
                onActivate={onBlocked}
                activateLabel={ui.officerBlockedTitle(openCount)}
              >
                {ui.officerBlockedTitle(openCount)}
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
            {ui.officerEditCta}
          </GuideCta>
          <GuideCta
            className={cn(
              "h-10 min-h-10 w-full px-4",
              !mobile && "flex-1",
              !canLock && "opacity-40",
            )}
            onClick={canLock ? onConfirm : onBlocked}
          >
            {ui.officerConfirmCta}
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
  scope = "fitout",
}: {
  open: boolean;
  openCount: number;
  onClose: () => void;
  onEdit: () => void;
  scope?: QuizScope;
}) {
  const ui = quizUiCopy(scope);
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
        className="absolute inset-0 bg-black/40"
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
            {ui.officerGateTitle}
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
            {ui.officerGateBody(openCount)}
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
            {ui.officerCancelCta}
          </GuideCta>
          <GuideCta
            className={cn("h-10 min-h-10 w-full px-4", !mobile && "flex-1")}
            onClick={onEdit}
          >
            {ui.officerGateEdit}
          </GuideCta>
        </footer>
      </aside>
    </div>
  );
}

function OfficerLockToast({
  open,
  onClose,
  scope = "fitout",
}: {
  open: boolean;
  onClose: () => void;
  scope?: QuizScope;
}) {
  const ui = quizUiCopy(scope);
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
          {ui.officerLockSuccessTitle}
        </p>
        <p className="text-sm leading-[18px] text-grey-600">
          {ui.officerLockSuccessBody}
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
}: {
  n: number;
  children: ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <span
        aria-hidden
        className="grid size-6 shrink-0 place-items-center rounded-full bg-grey-100 text-xs leading-4 font-bold text-grey-700"
      >
        {n}
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-sm leading-[18px] text-black">{children}</p>
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
        <div className="flex items-start gap-2 rounded-[var(--radius-md)] border border-blue-200 bg-blue-100 px-3 py-3">
          <span className="mt-0.5 inline-flex shrink-0" aria-hidden>
            <IconLeaf
              src={infoIcon}
              leafW={16}
              leafH={16}
              frame={16}
              colorClass="text-blue-600"
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
        <PermitExplainStep n={1}>{explain.what}</PermitExplainStep>
        <PermitExplainStep n={2}>
          {explain.who[role]}
        </PermitExplainStep>
      </ol>
      {why || other ? (
        <FactField label="For this unit">
          {why ? (
            <p className="text-sm leading-[18px] text-grey-600">{why}</p>
          ) : null}
          {other ? (
            <p className="text-sm leading-[18px] text-grey-600">{other}</p>
          ) : null}
        </FactField>
      ) : null}
      {supporting.docs.length > 0 ? (
        <SupportingDocList docs={supporting.docs} role={role} />
      ) : null}
      {samples.length > 0 && (
        <FieldSection label="Samples">
          <ul className="flex flex-wrap gap-1.5">
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
          className="absolute inset-0 bg-black/40"
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
              <div className="flex min-h-10 flex-wrap items-center gap-2">
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
                  className="text-sm leading-[18px] font-normal text-grey-600"
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
        "focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--color-purple-600)]",
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

/** V24: conditional reno cards leave Process. Works owns that list. */
function filterStepsForPlannedWorks(
  steps: ClassifiedStep[],
  _flags: Record<PlannedWorkSlug, SlugFlag> | null,
  _locked: boolean,
) {
  return steps.filter((row) => !row.step.whenSlugs?.length);
}

function blocksForPhase(
  phase: Phase,
  role: Role,
  unit: Unit,
  showQuiz: boolean,
  flags: Record<PlannedWorkSlug, SlugFlag> | null,
  locked = false,
  includeConditional = false,
) {
  const blocks = phase.stages
    .map((stage) => {
      const { steps } = classifyStage(stage, role, unit);
      return {
        stage,
        steps: includeConditional
          ? steps
          : filterStepsForPlannedWorks(steps, flags, locked),
      };
    })
    .filter((b) => b.steps.length > 0);
  return injectPlannedWorksQuiz(blocks, role, showQuiz);
}

export function ProcessV24Page() {
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
  const navigate = useNavigate();
  const isOfficer = role === "officer";
  const isContractor = role === "contractor";
  const isTenant = role === "tenant";

  const phaseFromUrl = params.get("phase") as Phase["id"] | null;
  const chapterFromUrl = params.get("chapter");
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);
  const [openCardTopicId, setOpenCardTopicId] = useState<string | null>(null);
  const [spyTopicId, setSpyTopicId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [findSuggestOpen, setFindSuggestOpen] = useState(false);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [findPhaseId, setFindPhaseId] = useState<PhaseDeskId | null>(null);
  const [findGroupId, setFindGroupId] = useState<string | null>(null);
  const [openFindKey, setOpenFindKey] = useState<string | null>(null);
  const [searchFocus, setSearchFocus] = useState<{
    stageName: string;
    stepName: string;
  } | null>(null);
  const [previewDocId, setPreviewDocId] = useState<string | null>(null);
  const [jobId, setJobId] = useState(CONTRACTOR_JOBS[0].id);
  const [quiz, setQuiz] = useState<QuizState>(EMPTY_QUIZ);
  const [operateQuiz, setOperateQuiz] = useState<QuizState>(EMPTY_QUIZ);
  const [quizScope, setQuizScope] = useState<QuizScope>("fitout");
  const [officerDraft, setOfficerDraft] = useState<QuizState | null>(null);
  const [quizSheetOpen, setQuizSheetOpen] = useState(false);
  const [officerEditGateOpen, setOfficerEditGateOpen] = useState(false);
  const [officerConfirmOpen, setOfficerConfirmOpen] = useState(false);
  const [officerLockGateOpen, setOfficerLockGateOpen] = useState(false);
  const [officerLockToastOpen, setOfficerLockToastOpen] = useState(false);
  const [showToTop, setShowToTop] = useState(false);
  const returnToConfirm = useRef(false);
  /** Phone only. Tablet+ matches SideNav and shows the topic rail. */
  const isCompact = useMobileViewport();

  const pendingStageScroll = useRef<{
    stageName: string;
    stepName: string;
  } | null>(null);

  useEffect(() => {
    const pin = document.getElementById("process-guide-mobile-pin");
    const scroller = nearestScroller(pin ?? document.body);
    if (scroller === window) return;
    const box = scroller as HTMLElement;
    const apply = () => {
      box.style.scrollPaddingTop = `${railSafeTop()}px`;
    };
    apply();
    const ro = new ResizeObserver(apply);
    if (pin) ro.observe(pin);
    window.addEventListener("resize", apply);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", apply);
      box.style.scrollPaddingTop = "";
    };
  }, [isCompact]);

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
  /** Guide drop: Works owns the quiz. Process is directory + step cards. */
  const showQuiz = false;

  useEffect(() => {
    if (!showQuiz) {
      setQuiz(EMPTY_QUIZ);
      setOperateQuiz(EMPTY_QUIZ);
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
    const operateSaved = readOperateQuizState(ctxUnit.id);
    if (
      role === "officer" &&
      operateSaved.status === "editing" &&
      quizHasSavedAnswers(operateSaved)
    ) {
      const closed: QuizState = {
        ...operateSaved,
        status: "done",
        answers: completeAnswers(operateSaved.answers),
      };
      setOperateQuiz(closed);
      writeOperateQuizState(ctxUnit.id, closed);
    } else {
      setOperateQuiz(operateSaved);
    }
    setOfficerDraft(null);
  }, [showQuiz, ctxUnit.id, role, params]);

  const selectPhase = (id: Phase["id"]) => {
    setSearchParams({ phase: id });
    window.localStorage.setItem(LS_KEY, id);
    setOpenGroupId(null);
    setSearchFocus(null);
  };

  const jumpTopic = (phaseId: PhaseDeskId, groupId: string) => {
    window.localStorage.setItem(LS_KEY, phaseId);
    setSearchFocus(null);
    setOpenGroupId(groupId);
    setSearchParams({ phase: phaseId, chapter: groupId });
  };

  const pickOutlet = (u: Unit) => {
    setUnit(u);
    window.localStorage.setItem(LS_OUTLET, u.id);
  };

  const pickJob = (id: string) => {
    setJobId(id);
    window.localStorage.setItem(LS_JOB, id);
  };

  const scopedQuiz = (scope: QuizScope) =>
    scope === "operate" ? operateQuiz : quiz;

  const persistFor = (scope: QuizScope, next: QuizState) => {
    const current = scopedQuiz(scope);
    if (!quizCanWrite(role, current)) return;
    const answers = completeAnswers(next.answers);
    const empty = !quizHasSavedAnswers({ ...next, answers });
    const safe: QuizState = {
      status: empty ? "idle" : next.status,
      answers,
      confirmed:
        role === "officer" && !empty ? Boolean(next.confirmed) : false,
    };
    if (scope === "operate") {
      setOperateQuiz(safe);
      writeOperateQuizState(ctxUnit.id, safe);
    } else {
      setQuiz(safe);
      writeQuizState(ctxUnit.id, safe);
    }
  };

  const openOfficerDraft = (scope: QuizScope = quizScope) => {
    const current = scopedQuiz(scope);
    setQuizScope(scope);
    setOfficerDraft({
      status: "editing",
      answers: completeAnswers(current.answers),
      confirmed: current.confirmed,
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
  const operateSummary = useMemo(
    () => (showQuiz ? answerSummaryLines(operateQuiz, ctxUnit) : []),
    [showQuiz, operateQuiz, ctxUnit],
  );
  const operateFlags = useMemo(
    () => (showQuiz ? slugFlags(operateQuiz, ctxUnit) : null),
    [showQuiz, operateQuiz, ctxUnit],
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
    visiblePhases.find((p) => p.id === "operate") ??
    visiblePhases[0] ??
    PHASES[0];

  useEffect(() => {
    if (phaseFromUrl === active.id) return;
    const next: Record<string, string> = { phase: active.id };
    const quiz = params.get("quiz");
    if (quiz) next.quiz = quiz;
    const chapter = params.get("chapter");
    if (chapter) next.chapter = chapter;
    setSearchParams(next, { replace: true });
    window.localStorage.setItem(LS_KEY, active.id);
  }, [phaseFromUrl, active.id, setSearchParams]);

  useEffect(() => {
    const main = document.querySelector("main");
    if (!(main instanceof HTMLElement)) return;
    if (!isCompact) return;
    main.style.scrollPaddingTop = needsContext ? "3.5rem" : "5.5rem";
    return () => {
      main.style.scrollPaddingTop = "";
    };
  }, [needsContext, isCompact]);

  useEffect(() => {
    const pin = document.getElementById("process-guide-mobile-pin");
    const scroller = nearestScroller(pin ?? document.body);
    const sync = () => {
      if (scroller === window) {
        setShowToTop(
          document.documentElement.scrollHeight > window.innerHeight + 48,
        );
        return;
      }
      const box = scroller as HTMLElement;
      setShowToTop(box.scrollHeight > box.clientHeight + 48);
    };
    sync();
    const node = scroller === window ? window : (scroller as HTMLElement);
    node.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    const ro = new ResizeObserver(sync);
    if (scroller !== window) ro.observe(scroller as HTMLElement);
    for (const child of document.querySelector("main")?.children ?? []) {
      ro.observe(child);
    }
    return () => {
      node.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      ro.disconnect();
    };
  }, [openGroupId, active.id]);

  const officerReviewRows = useMemo(
    () =>
      showQuiz && isOfficer
        ? quizReviewRows(officerDraft ?? scopedQuiz(quizScope), ctxUnit)
        : [],
    [showQuiz, isOfficer, officerDraft, quiz, operateQuiz, quizScope, ctxUnit],
  );
  const officerOpenCount = unansweredReviewCount(officerReviewRows);

  const openOfficerQuizSheet = (scope: QuizScope = quizScope) => {
    openOfficerDraft(scope);
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
    const src = officerDraft ?? scopedQuiz(quizScope);
    if (unansweredReviewCount(quizReviewRows(src, ctxUnit)) > 0) {
      setOfficerLockGateOpen(true);
      return;
    }
    persistFor(quizScope, confirmPlannedWorks(src));
    setOfficerDraft(null);
    setOfficerConfirmOpen(false);
    setOfficerLockGateOpen(false);
    setOfficerLockToastOpen(true);
  };

  const openQuizSheet = (edit = true, scope: QuizScope = "fitout") => {
    setQuizScope(scope);
    const current = scopedQuiz(scope);
    if (role === "tenant") {
      pendingStageScroll.current = {
        stageName: QUIZ_STAGE_NAME,
        stepName: QUIZ_STEP_NAME,
      };
      if (active.id !== "build") selectPhase("build");
      else scrollToStep(QUIZ_STAGE_NAME, QUIZ_STEP_NAME);
      return;
    }
    if (role === "contractor" && !quizCanWrite(role, current)) return;
    if (role === "officer") {
      if (edit && quizHasSavedAnswers(current)) {
        setOfficerEditGateOpen(true);
        return;
      }
      persistFor(scope, {
        status: "editing",
        answers: current.answers,
        confirmed: current.confirmed,
      });
      setQuizSheetOpen(true);
      return;
    }
    if (edit && quizCanWrite(role, current)) {
      persistFor(scope, {
        status: "editing",
        answers: current.answers,
        confirmed: current.confirmed,
      });
    }
    setQuizSheetOpen(true);
  };

  const openQuizSheetRef = useRef(openQuizSheet);
  openQuizSheetRef.current = openQuizSheet;
  const openedQuizFromUrl = useRef(false);
  const showQuizRef = useRef(showQuiz);
  showQuizRef.current = showQuiz;
  const activePhaseRef = useRef(active.id);
  activePhaseRef.current = active.id;
  const setSearchParamsRef = useRef(setSearchParams);
  setSearchParamsRef.current = setSearchParams;
  const scrollToQuizStepRef = useRef<(stage: string, step: string) => void>(
    () => {},
  );

  const closeQuizSheet = () => {
    const current = scopedQuiz(quizScope);
    if (
      (role === "contractor" || role === "officer") &&
      quizCanWrite(role, current)
    ) {
      persistFor(quizScope, settleQuizWrite(current, ctxUnit));
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
    if (!isContractor) return;
    if (quizIsConfirmed(scopedQuiz(quizScope))) setQuizSheetOpen(false);
  }, [isContractor, quiz, operateQuiz, quizScope]);

  const quizLocked = quizIsConfirmed(quiz);

  const searchRows = useMemo(() => {
    if (needsContext) return [];
    return buildGuideSearchRows(
      visiblePhases,
      role,
      ctxUnit,
      showQuiz,
      plannedFlags,
      quizLocked,
    );
  }, [
    needsContext,
    visiblePhases,
    role,
    ctxUnit,
    showQuiz,
    plannedFlags,
    quizLocked,
  ]);

  const searchHits = useMemo(
    () => findHitsForQuery(searchRows, searchQuery),
    [searchRows, searchQuery],
  );

  const typedQuery = Boolean(normalizeQuery(searchQuery));

  useEffect(() => {
    if (!typedQuery) setFilterSheetOpen(false);
  }, [typedQuery]);
  const showMapTopics = isCompact && !typedQuery && !needsContext;

  const filteredHits = useMemo(
    () =>
      searchHits.filter((hit) => {
        if (hit.kind === "file" || hit.kind === "system") {
          if (findPhaseId && !hit.phaseIds.includes(findPhaseId)) return false;
          if (findGroupId && !hit.groupIds.includes(findGroupId)) return false;
          return true;
        }
        if (findPhaseId && hit.phaseId !== findPhaseId) return false;
        if (findGroupId && hit.groupId !== findGroupId) return false;
        return true;
      }),
    [searchHits, findPhaseId, findGroupId],
  );

  const searchChips = useMemo(
    () =>
      SEARCH_CHIP_CANDIDATES.filter((chip) =>
        searchRows.some((row) => textMatches(row.blob, chip)),
      ),
    [searchRows],
  );

  const searchKeywords = useMemo(
    () => keywordPoolForBlobs(searchRows.map((row) => row.blob)),
    [searchRows],
  );

  const pickFindChip = (chip: string) => {
    setSearchQuery(chip);
    setFindPhaseId(null);
    setFindGroupId(null);
    setOpenFindKey(null);
  };

  const handleSearchQuery = (value: string) => {
    setSearchQuery(value);
    if (!normalizeQuery(value)) {
      setFindPhaseId(null);
      setFindGroupId(null);
      setOpenFindKey(null);
    }
  };

  const handleSelectPhase = (phaseId: PhaseDeskId | null) => {
    if (typedQuery) {
      setFindPhaseId(phaseId);
      setFindGroupId(null);
      return;
    }
    if (phaseId) selectPhase(phaseId);
  };

  const handleSelectTopic = (
    phaseId: PhaseDeskId,
    groupId: string | null,
  ) => {
    if (typedQuery) {
      setFindPhaseId(phaseId);
      setFindGroupId(groupId);
      return;
    }
    if (groupId) jumpTopic(phaseId, groupId);
    else selectPhase(phaseId);
  };

  const stageBlocks = useMemo(() => {
    if (needsContext) return [];
    return blocksForPhase(
      active,
      role,
      ctxUnit,
      showQuiz,
      plannedFlags,
      quizLocked,
    );
  }, [active, role, ctxUnit, needsContext, showQuiz, plannedFlags, quizLocked]);

  const guideItems = useMemo(() => itemsFromBlocks(stageBlocks), [stageBlocks]);

  const catalogueItems = useMemo(() => {
    if (needsContext) return [];
    return itemsFromBlocks(
      blocksForPhase(
        active,
        role,
        ctxUnit,
        showQuiz,
        plannedFlags,
        quizLocked,
        true,
      ),
    );
  }, [needsContext, active, role, ctxUnit, showQuiz, plannedFlags, quizLocked]);

  const itemsByPhase = useMemo(() => {
    const next: Partial<Record<PhaseDeskId, GuideItem[]>> = {};
    if (needsContext) return next;
    for (const phase of visiblePhases) {
      next[phase.id] = itemsFromBlocks(
        blocksForPhase(
          phase,
          role,
          ctxUnit,
          showQuiz,
          plannedFlags,
          quizLocked,
        ),
      );
    }
    return next;
  }, [
    needsContext,
    visiblePhases,
    role,
    ctxUnit,
    showQuiz,
    plannedFlags,
    quizLocked,
  ]);

  const catalogueByKey = useMemo(() => {
    const map = new Map<string, GuideItem>();
    if (needsContext) return map;
    for (const phase of visiblePhases) {
      const items = itemsFromBlocks(
        blocksForPhase(
          phase,
          role,
          ctxUnit,
          showQuiz,
          plannedFlags,
          quizLocked,
          true,
        ),
      );
      for (const item of items) {
        map.set(
          stepFocusKey(item.stageName, item.classified.step.name),
          item,
        );
      }
    }
    return map;
  }, [
    needsContext,
    visiblePhases,
    role,
    ctxUnit,
    showQuiz,
    plannedFlags,
    quizLocked,
  ]);

  const browseCounts = useMemo(() => topicCountMap(itemsByPhase), [itemsByPhase]);
  const queryCounts = useMemo(() => hitCountMap(searchHits), [searchHits]);
  const topicCounts = typedQuery ? queryCounts : browseCounts;
  const visiblePhaseIds = visiblePhases.map((phase) => phase.id);

  const deskItems = useMemo(() => {
    if (!searchFocus) return guideItems;
    const extra = catalogueItems.find(
      (item) =>
        item.stageName === searchFocus.stageName &&
        item.classified.step.name === searchFocus.stepName,
    );
    if (!extra) return guideItems;
    const already = guideItems.some(
      (item) =>
        item.stageName === extra.stageName &&
        item.classified.step.name === extra.classified.step.name,
    );
    if (already) return guideItems;
    const rank = new Map(
      catalogueItems.map((item, index) => [
        stepFocusKey(item.stageName, item.classified.step.name),
        index,
      ]),
    );
    return [...guideItems, extra].sort((a, b) => {
      const left =
        rank.get(stepFocusKey(a.stageName, a.classified.step.name)) ?? 999;
      const right =
        rank.get(stepFocusKey(b.stageName, b.classified.step.name)) ?? 999;
      return left - right;
    });
  }, [guideItems, catalogueItems, searchFocus]);

  const desk = PHASE_DESKS[active.id];
  const deskGroups = useMemo(
    () =>
      desk.groups
        .map((group) => ({
          group,
          members: guideItems.filter((item) =>
            group.match(item.stageName, item.classified.step.name),
          ),
        }))
        .filter((row) => row.members.length > 0),
    [desk, guideItems],
  );

  const deskGroupIdSig = deskGroups.map((row) => row.group.id).join("/");
  const chapterIds = deskGroups.map((row) => row.group.id);
  useEffect(() => {
    if (chapterFromUrl && chapterIds.includes(chapterFromUrl)) {
      setOpenGroupId(chapterFromUrl);
      return;
    }
    setOpenGroupId(null);
    if (!chapterFromUrl) return;
    const next: Record<string, string> = { phase: active.id };
    const quiz = params.get("quiz");
    if (quiz) next.quiz = quiz;
    setSearchParams(next, { replace: true });
  }, [active.id, chapterFromUrl, deskGroupIdSig]);

  const handleOpenStep = useCallback(
    (step: { stageName: string; stepName: string } | null) => {
      if (!step) {
        setOpenCardTopicId(null);
        return;
      }
      setOpenCardTopicId(
        phaseGroupForStep(active.id, step.stageName, step.stepName),
      );
    },
    [active.id],
  );

  const highlightTopicId = typedQuery
    ? findGroupId
    : (openGroupId ?? spyTopicId ?? openCardTopicId);

  useEffect(() => {
    if (typedQuery || needsContext || openGroupId) {
      setSpyTopicId(null);
      return;
    }
    const pin = document.getElementById("process-guide-mobile-pin");
    const scroller = nearestScroller(pin ?? document.body);
    const sync = () => {
      const sections = [
        ...document.querySelectorAll<HTMLElement>("[id^='topic-']"),
      ];
      if (sections.length === 0) {
        setSpyTopicId(null);
        return;
      }
      const line = railSafeTop();
      let current: string | null = null;
      for (const section of sections) {
        if (section.getBoundingClientRect().top <= line + 8) {
          current = section.id.replace(/^topic-/, "");
        }
      }
      if (!current) {
        current = sections[0].id.replace(/^topic-/, "");
      }
      setSpyTopicId(current);
    };
    sync();
    const node = scroller === window ? window : (scroller as HTMLElement);
    node.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    const ro = new ResizeObserver(sync);
    if (scroller !== window) ro.observe(scroller as HTMLElement);
    for (const child of document.querySelector("main")?.children ?? []) {
      ro.observe(child);
    }
    return () => {
      node.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      ro.disconnect();
    };
  }, [typedQuery, needsContext, openGroupId, active.id, deskGroupIdSig, guideItems]);

  useEffect(() => {
    if (!isCompact || !openGroupId) return;
    const el = document.getElementById(`topic-${openGroupId}`);
    if (!el) return;
    const raf = window.requestAnimationFrame(() => {
      alignCardToRail(el, "auto");
    });
    return () => window.cancelAnimationFrame(raf);
  }, [isCompact, openGroupId, active.id]);

  useEffect(() => {
    if (!openFindKey) return;
    if (!filteredHits.some((hit) => hit.id === openFindKey)) {
      setOpenFindKey(null);
    }
  }, [filteredHits, openFindKey]);

  const permitResult = useMemo(
    () => (showQuiz ? quizPermitResult(quiz, ctxUnit) : null),
    [showQuiz, quiz, ctxUnit],
  );
  const operatePermitResult = useMemo(
    () => (showQuiz ? quizPermitResult(operateQuiz, ctxUnit) : null),
    [showQuiz, operateQuiz, ctxUnit],
  );

  const scrollToStep = (stageName: string, stepName: string) => {
    pendingStageScroll.current = { stageName, stepName };
    const el = document.getElementById(stepDomId(stageName, stepName));
    if (!el) return;
    const card = el.closest("article") ?? el;
    pendingStageScroll.current = null;
    alignCardToRail(card, "auto");
    window.requestAnimationFrame(() => alignCardToRail(card, "auto"));
  };

  useEffect(() => {
    const pending = pendingStageScroll.current;
    if (!pending) return;
    const el = document.getElementById(
      stepDomId(pending.stageName, pending.stepName),
    );
    if (!el) return;
    pendingStageScroll.current = null;
    const card = el.closest("article") ?? el;
    alignCardToRail(card, "auto");
    const raf = window.requestAnimationFrame(() => alignCardToRail(card, "auto"));
    return () => {
      window.cancelAnimationFrame(raf);
    };
  }, [guideItems, openGroupId]);

  scrollToQuizStepRef.current = scrollToStep;

  useEffect(() => {
    const openFromEntry = () => {
      if (!showQuizRef.current) return;
      pendingStageScroll.current = {
        stageName: QUIZ_STAGE_NAME,
        stepName: QUIZ_STEP_NAME,
      };
      if (activePhaseRef.current !== "build") {
        setSearchParamsRef.current({ phase: "build", quiz: "open" });
        window.localStorage.setItem(LS_KEY, "build");
        return;
      }
      scrollToQuizStepRef.current(QUIZ_STAGE_NAME, QUIZ_STEP_NAME);
      openQuizSheetRef.current(true, "fitout");
    };

    window.addEventListener(OPEN_PLANNED_WORKS_EVENT, openFromEntry);
    return () => {
      window.removeEventListener(OPEN_PLANNED_WORKS_EVENT, openFromEntry);
    };
  }, []);

  useEffect(() => {
    if (params.get("quiz") !== "open") {
      openedQuizFromUrl.current = false;
      return;
    }
    if (active.id !== "build" || !showQuiz || openedQuizFromUrl.current) return;
    openedQuizFromUrl.current = true;
    pendingStageScroll.current = {
      stageName: QUIZ_STAGE_NAME,
      stepName: QUIZ_STEP_NAME,
    };
    scrollToStep(QUIZ_STAGE_NAME, QUIZ_STEP_NAME);
    openQuizSheetRef.current(true, "fitout");
  }, [showQuiz, active.id, params, scrollToStep]);

  const chips = needsContext
    ? ["All Terminals", "All Zones"]
    : [ctxUnit.terminal, ctxUnit.zone, ctxUnit.tenancyType];

  const unitLabel = needsContext ? "All units" : ctxUnit.unitNo;

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

  const quizBundleFor = (scope: QuizScope) => {
    const state = scopedQuiz(scope);
    return {
      scope,
      kickoffSoon:
        scope === "operate"
          ? false
          : isContractor
            ? Boolean(activeJob.kickoffSoon)
            : kickoffSoonForUnit(ctxUnit),
      state,
      questions: quizQuestions,
      summary: scope === "operate" ? operateSummary : quizSummary,
      flags: scope === "operate" ? operateFlags : plannedFlags,
      permitResult: scope === "operate" ? operatePermitResult : permitResult,
      onStart: () =>
        role === "officer"
          ? openQuizSheet(true, scope)
          : persistFor(scope, {
              status: "editing",
              answers: state.answers,
              confirmed: state.confirmed,
            }),
      onToggle: (questionId: QuestionId, optionId: string) => {
        if (officerDraft && quizScope === scope) {
          setOfficerDraft(
            toggleQuestionOption(officerDraft, questionId, optionId),
          );
          return;
        }
        persistFor(
          scope,
          toggleQuestionOption(scopedQuiz(scope), questionId, optionId),
        );
      },
      onConfirm: () => {
        if (role !== "officer") return;
        setQuizScope(scope);
        openOfficerConfirmSheet();
      },
      onCancel: () => {
        setOfficerDraft(null);
        if (role === "officer" && state.status === "editing") {
          persistFor(scope, {
            status: "done",
            answers: state.answers,
            confirmed: state.confirmed,
          });
        }
      },
      onEdit: () => {
        if (role === "officer") {
          if (quizIsConfirmed(state)) {
            openQuizSheet(true, scope);
            return;
          }
          returnToConfirm.current = false;
          openOfficerQuizSheet(scope);
          return;
        }
        persistFor(scope, {
          status: "editing",
          answers: state.answers,
          confirmed: state.confirmed,
        });
      },
      onOpenQuiz: (edit = true) => {
        openQuizSheet(edit, scope);
      },
      onApplySlugs: (slugs: PlannedWorkSlug[]) => {
        persistFor(scope, applySlugsToQuiz(scopedQuiz(scope), slugs, ctxUnit));
      },
      onDismissSlugs: (slugs: PlannedWorkSlug[]) => {
        persistFor(
          scope,
          dismissSlugsFromQuiz(scopedQuiz(scope), slugs, ctxUnit),
        );
      },
    };
  };

  const pathCards = guideItems.map((item) => {
    const key = stepFocusKey(item.stageName, item.classified.step.name);
    return (
      <PathStep
        key={key}
        classified={item.classified}
        stageName={item.stageName}
        packMembers={item.packMembers}
        role={role}
        tenancyType={ctxUnit.tenancyType}
        terminal={ctxUnit.terminal}
        zone={ctxUnit.zone}
        unit={ctxUnit}
        quiz={null}
        onPreviewDoc={setPreviewDocId}
      />
    );
  });

  const renderDeskCard = (item: GuideItem) => {
    const key = stepFocusKey(item.stageName, item.classified.step.name);
    return (
      <PathStep
        key={key}
        classified={item.classified}
        stageName={item.stageName}
        packMembers={item.packMembers}
        role={role}
        tenancyType={ctxUnit.tenancyType}
        terminal={ctxUnit.terminal}
        zone={ctxUnit.zone}
        unit={ctxUnit}
        quiz={null}
        onPreviewDoc={setPreviewDocId}
        embedded
      />
    );
  };

  const pathSteps = needsContext ? (
    pathCards
  ) : typedQuery ? (
    <SearchResults
      query={searchQuery}
      hits={filteredHits}
      openKey={openFindKey}
      onOpen={(hit) => {
        if (hit.kind === "file") {
          setPreviewDocId(hit.docId);
          return;
        }
        if (hit.kind === "system") {
          navigate("/apps");
          return;
        }
        setOpenFindKey(hit.id);
      }}
      onBack={() => setOpenFindKey(null)}
      renderHit={(hit) => {
        if (hit.kind !== "guide") return null;
        const item = catalogueByKey.get(
          stepFocusKey(hit.stageName, hit.stepName),
        );
        return item ? renderDeskCard(item) : null;
      }}
    />
  ) : (
    <PhaseDesk
      key={active.id}
      phaseId={active.id}
      items={deskItems}
      role={role}
      openId={openGroupId}
      renderCard={renderDeskCard}
      focusStep={searchFocus}
      onSelectGroup={(groupId) => handleSelectTopic(active.id, groupId)}
      onOpenStep={handleOpenStep}
      allowGroupJump
    />
  );

  return (
    <>
      <div
        className="dls-page flex flex-col !pt-5 tablet:!pt-8"
      >
        <header className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 tablet:flex-row tablet:items-start tablet:justify-between tablet:gap-4">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <h1 className={TITLE_PAGE}>Process</h1>
              {needsContext ? (
                <p className="text-sm leading-[18px] text-grey-500">
                  Choose a unit.
                </p>
              ) : typedQuery ? (
                <p className="text-sm leading-[18px] text-grey-500">
                  Clear search to return to the map.
                </p>
              ) : null}
            </div>
            {unitPicker}
          </div>
        </header>

          <div className="mt-3 px-1">
            <ProcessFind
              query={searchQuery}
              chips={searchChips}
              keywords={searchKeywords}
              hits={filteredHits}
              disabled={needsContext}
              showChips={false}
              trailing={
                typedQuery && !needsContext ? (
                  <SearchFilter
                    open={filterSheetOpen}
                    active={Boolean(findPhaseId || findGroupId)}
                    disabled={needsContext}
                    phases={visiblePhaseIds}
                    value={findPhaseId}
                    topicId={findGroupId}
                    counts={topicCounts}
                    onOpen={() => setFilterSheetOpen(true)}
                    onClose={() => setFilterSheetOpen(false)}
                    onChange={handleSelectPhase}
                    onSelectTopic={handleSelectTopic}
                  />
                ) : undefined
              }
              onQuery={handleSearchQuery}
              onChip={pickFindChip}
              onOpenHit={(hit) => {
                if (hit.kind === "file") {
                  setPreviewDocId(hit.docId);
                  return;
                }
                if (hit.kind === "system") {
                  navigate("/apps");
                  return;
                }
                setOpenFindKey(hit.id);
              }}
              onViewAll={() => setOpenFindKey(null)}
              onSuggestOpen={setFindSuggestOpen}
            />
          </div>
          {showMapTopics ? (
            <div
              id="process-guide-mobile-pin"
              className="sticky top-14 z-20 mt-2 border-b border-grey-100 bg-grey-50 py-4"
            >
              <PhaseTabs
                phases={visiblePhaseIds}
                value={active.id}
                topicId={highlightTopicId}
                counts={topicCounts}
                tall
                onChange={handleSelectPhase}
                onSelectTopic={handleSelectTopic}
              />
            </div>
          ) : null}

          <div className="mt-5 grid grid-cols-1 gap-6 tablet:mt-6 tablet:grid-cols-12 tablet:items-start">
            {typedQuery ? null : (
              <aside
                className="hidden min-w-0 tablet:sticky tablet:top-8 tablet:col-span-4 tablet:col-start-1 tablet:flex tablet:flex-col tablet:gap-3 tablet:self-start"
              >
                <ChapterRail
                  phases={visiblePhaseIds}
                  activePhaseId={active.id}
                  openGroupId={openGroupId}
                  activeGroupId={spyTopicId ?? openCardTopicId}
                  counts={topicCounts}
                  searching={typedQuery}
                  findPhaseId={findPhaseId}
                  findGroupId={findGroupId}
                  disabled={needsContext}
                  onSelectPhase={handleSelectPhase}
                  onSelectTopic={handleSelectTopic}
                />
              </aside>
            )}
            <section
              className={cn(
                "flex min-w-0 flex-col gap-6",
                typedQuery
                  ? "tablet:col-span-12"
                  : "tablet:col-span-8 tablet:col-start-5",
              )}
            >
              {pathSteps}
            </section>
          </div>
      </div>

      {showToTop &&
        !findSuggestOpen &&
        !previewDocId &&
        !quizSheetOpen &&
        !(filterSheetOpen && isCompact) &&
        !officerConfirmOpen &&
        !officerEditGateOpen &&
        !officerLockGateOpen && (
        <div className="fixed z-30 right-4 bottom-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.5rem))] tablet:right-8 tablet:bottom-28">
          <Button
            type="Secondary (Mono)"
            size="lg"
            aria-label="Back to top"
            onClick={() => {
              const pin = document.getElementById("process-guide-mobile-pin");
              setScrollY(nearestScroller(pin ?? document.body), 0, "smooth");
            }}
          >
            <IconLeaf
              src={arrowTop}
              leafW={24}
              leafH={24}
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
          scope={quizScope}
          onConfirm={() => openOfficerQuizSheet(quizScope)}
          onClose={() => setOfficerEditGateOpen(false)}
        />
      )}
      {showQuiz && isOfficer && (
        <OfficerConfirmSheet
          open={officerConfirmOpen}
          scope={quizScope}
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
          scope={quizScope}
          openCount={officerOpenCount}
          onClose={() => setOfficerLockGateOpen(false)}
          onEdit={openOfficerDecideFromConfirm}
        />
      )}
      {showQuiz && isOfficer && (
        <OfficerLockToast
          open={officerLockToastOpen}
          scope={quizScope}
          onClose={() => setOfficerLockToastOpen(false)}
        />
      )}
      {showQuiz &&
        (isOfficer ||
          (isContractor && quizCanWrite(role, scopedQuiz(quizScope)))) && (
        <PlannedWorksSheet
          open={quizSheetOpen}
          scope={quizScope}
          questions={quizQuestions}
          state={
            isOfficer
              ? (officerDraft ?? scopedQuiz(quizScope))
              : scopedQuiz(quizScope)
          }
          allowUnsure={!isOfficer}
          onToggle={(questionId, optionId) => {
            if (isOfficer) {
              setOfficerDraft((draft) =>
                toggleQuestionOption(
                  draft ?? scopedQuiz(quizScope),
                  questionId,
                  optionId,
                ),
              );
              return;
            }
            persistFor(
              quizScope,
              toggleQuestionOption(scopedQuiz(quizScope), questionId, optionId),
            );
          }}
          onSave={() => {
            if (isOfficer) {
              const src = officerDraft ?? scopedQuiz(quizScope);
              persistFor(
                quizScope,
                settleQuizWrite(
                  {
                    ...src,
                    confirmed: Boolean(scopedQuiz(quizScope).confirmed),
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
            persistFor(quizScope, {
              status: "done",
              answers: scopedQuiz(quizScope).answers,
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

type DropdownOption = {
  value: string;
  label: string;
  prefix?: string;
  tone?: "group" | "item";
  hint?: string;
};

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
  alignSearch,
  tall,
  showLabel,
  options,
  onChange,
}: {
  label: string;
  value: string;
  disabled?: boolean;
  className?: string;
  compact?: boolean;
  alignSearch?: boolean;
  tall?: boolean;
  showLabel?: boolean;
  options: DropdownOption[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const mobile = useMobileViewport();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const listId = useId();
  const titleId = useId();
  const selected = options.find((o) => o.value === value) ?? options[0];
  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.value === selected?.value),
  );
  const [activeIndex, setActiveIndex] = useState(selectedIndex);
  const sheetSections =
    mobile &&
    options.some((option) => option.tone === "group") &&
    options.some((option) => option.tone === "item");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    if (!mobile) {
      const onDoc = (e: PointerEvent) => {
        if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
      };
      window.addEventListener("pointerdown", onDoc);
      return () => {
        window.removeEventListener("pointerdown", onDoc);
        window.removeEventListener("keydown", onKey);
      };
    }
    return () => window.removeEventListener("keydown", onKey);
  }, [open, selectedIndex, mobile]);

  useEffect(() => {
    if (!open || !mobile) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, mobile]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setActiveIndex(selectedIndex);
  }, [open, selectedIndex]);

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

  const optionItems = options.map((option, index) => {
    const isSelected = option.value === selected?.value;
    const isActive = index === activeIndex;
    const isGroup = option.tone === "group";
    const isItem = option.tone === "item";
    return (
      <li
        key={option.value}
        role="option"
        aria-selected={isSelected}
        data-index={index}
        onPointerEnter={() => setActiveIndex(index)}
        onClick={() => pick(option.value)}
        className={cn(
          "flex cursor-pointer items-baseline justify-between gap-3 py-3 text-sm leading-[18px] tablet:py-2.5 tablet:text-base tablet:leading-5",
          isItem ? "pr-4 pl-8" : "px-4",
          isGroup && !isSelected && "font-bold",
          isSelected && "bg-purple-100 font-bold text-purple-700",
          !isSelected && isActive && "bg-purple-100",
          !isSelected && !isActive && isGroup && "text-grey-500",
          !isSelected && !isActive && !isGroup && "text-black",
        )}
      >
        <span className="min-w-0">
          <DropdownLabel
            prefix={isItem ? undefined : option.prefix}
            label={option.label}
          />
        </span>
        {option.hint ? (
          <span
            className={cn(
              "shrink-0 text-xs leading-4 font-normal",
              isSelected ? "text-purple-500" : "text-grey-400",
            )}
          >
            {option.hint}
          </span>
        ) : null}
      </li>
    );
  });

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
        aria-haspopup={mobile ? "dialog" : "listbox"}
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
          compact ? "h-9" : alignSearch || tall ? "h-12" : "min-h-10 tablet:min-h-12",
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
      {open && !mobile && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={label}
          tabIndex={-1}
          onKeyDown={onListKey}
          className={cn(
            "absolute top-full z-40 mt-1 max-h-[min(28rem,70dvh)] overflow-y-auto rounded-[var(--radius-sm)] border border-grey-200 bg-white py-1 shadow-[var(--shadow-light-bg)]",
            alignSearch
              ? "right-0 w-[min(20rem,calc(100vw-2rem))]"
              : "inset-x-0",
          )}
        >
          {optionItems}
        </ul>
      )}
      {open && mobile
        ? createPortal(
            <div className="fixed inset-0 z-50 flex items-end justify-center">
              <button
                type="button"
                aria-label={`Close ${label}`}
                className="absolute inset-0 bg-black/40"
                onClick={() => setOpen(false)}
              />
              <aside
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className="relative flex max-h-[60vh] w-full flex-col rounded-t-[var(--radius-2xl)] bg-white shadow-[var(--shadow-light-bg)]"
              >
                <header className="flex items-center justify-between gap-3 border-b border-grey-75 px-4 py-3">
                  <h2
                    id={titleId}
                    className="text-lg leading-[22px] font-bold text-black"
                  >
                    {label}
                  </h2>
                  <OverlayIconBtn
                    label={`Close ${label}`}
                    onClick={() => setOpen(false)}
                  >
                    <OverlayCloseGlyph />
                  </OverlayIconBtn>
                </header>
                {sheetSections ? (
                  <FilterSheetList
                    options={options}
                    selectedValue={selected?.value ?? ""}
                    activeIndex={activeIndex}
                    listId={listId}
                    listRef={listRef}
                    labelledBy={titleId}
                    onPick={pick}
                    onListKey={onListKey}
                    onActive={setActiveIndex}
                  />
                ) : (
                  <ul
                    ref={listRef}
                    id={listId}
                    role="listbox"
                    aria-label={label}
                    tabIndex={-1}
                    onKeyDown={onListKey}
                    className="min-h-0 flex-1 overflow-y-auto py-1"
                  >
                    {optionItems}
                  </ul>
                )}
              </aside>
            </div>,
            document.body,
          )
        : null}
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

function PathStep({
  classified,
  stageName,
  packMembers,
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
  embedded = false,
}: {
  classified: ClassifiedStep;
  stageName: string;
  packMembers?: ClassifiedStep[];
  highlightStepName?: string | null;
  highlightDocId?: string | null;
  highlightSystemLabel?: string | null;
  role: Role;
  unit: Unit;
  tenancyType: string;
  terminal: string;
  zone: string;
  quiz: {
    scope?: QuizScope;
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
  embedded?: boolean;
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
  const isOperateQuiz = false;
  const ui = quizUiCopy(quiz?.scope ?? "fitout");
  const hostsPostKickoffPack = step.name === "Onboarding Guidelines Shared";
  const quizStatus = quiz?.state.status ?? "idle";
  const editMode = quizEditMode(role, quiz?.state);
  const confirmed = Boolean(quiz && quizIsConfirmed(quiz.state));
  const contractorCanWrite = role === "contractor" && !confirmed;
  const officerCanFill = role === "officer" && editMode === "fill" && !confirmed;
  const officerCanWrite = role === "officer";
  const canWriteQuiz = contractorCanWrite || officerCanFill;
  const hasAnswers = Boolean(quiz && quizHasSavedAnswers(quiz.state));
  const reviewRows = quiz ? quizReviewRows(quiz.state, unit) : [];
  const needsGuide =
    Boolean(quiz) && quizNeedsOfficerGuide(quiz.state, unit);
  const officerPending = officerCanWrite && !confirmed;
  const reviewLabel = officerPending
    ? hostsQuiz
      ? ui.reviewLabelOfficerConfirm
      : ui.reviewLabelOfficerPending
    : confirmed
      ? officerCanWrite
        ? ui.reviewLabelOfficerAgreed
        : role === "contractor"
          ? ui.reviewLabelContractorAgreed
          : ui.reviewLabelTenantAgreed
      : role === "tenant"
        ? ui.reviewLabelTenantPending
        : ui.reviewLabel;
  const officerReviewHint = hostsQuiz
    ? ui.officerPossibleLine
    : ui.officerReadLine;
  const quizStillOpen = Boolean(quiz && quizHasUnanswered(quiz.state));
  const reviewBannerTitle = officerPending
    ? officerReviewHint
    : role === "contractor" && contractorCanWrite && quizStillOpen
      ? ui.bannerContractorPaused
      : reviewLabel;
  const hideContractorDoneBanner =
    role === "contractor" && contractorCanWrite && !quizStillOpen;

  const copy = lifeSgCard(role, stageName, isPtwPack ? PTW_PACK_HOST : step.name);
  const lead = cardLead(
    role,
    stageName,
    isPtwPack ? PTW_PACK_HOST : step.name,
  );
  const why = cardWhy(
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
      ? ui.tenantFilledLine
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
      ? ui.officerGuideHow
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
      ? ui.officerGuideHow.map((line) => ({
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
    Boolean(permitResult) && hostsQuiz && quizStatus !== "editing";
  const showKickoffCorrection =
    Boolean(quiz) && hostsQuiz && officerCanWrite;
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
    (hostsQuiz &&
      (reviewReady || confirmed || officerKickoffDecide));
  const showLinkedWorks =
    showReview && Boolean(permitResult) && hostsQuiz;
  const showQuizNudge =
    hostsQuiz &&
    Boolean(quiz) &&
    !showReview &&
    !showLinkedWorks &&
    canWriteQuiz &&
    (quizStatus === "idle" || quizStatus === "paused");
  const showContractorDoneSticky =
    hideContractorDoneBanner && Boolean(quiz) && hostsQuiz;
  const nudgeSticky = quiz
    ? quizStickyCopy(quiz.state, unit, role, quiz.scope ?? "fitout")
    : null;
  const nudgeProgress = quiz ? quizProgress(quiz.state, unit) : null;
  const certainty = stepCertainty(step, quiz?.flags ?? null);
  const showPossible =
    certainty === "possible" && Boolean(quiz) && !isPtwPack && !confirmed;
  const packHasPossible = Boolean(
    packMembers?.some(
      (member) =>
        (member.step.whenSlugs?.length ?? 0) > 0 ||
        stepCertainty(member.step, quiz?.flags ?? null) === "possible",
    ),
  );
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
      <div className="flex flex-col gap-1">
        <h4 className={LABEL_CAPS}>{PTW_PACK_TYPES_LABEL}</h4>
        <p className="text-sm leading-[18px] font-bold text-black">
          {PTW_PACK_ALWAYS_LEAD}
        </p>
        <p className="text-sm leading-[18px] text-grey-600">
          {PTW_PACK_ALWAYS_NOTE}
        </p>
        {packHasPossible ? (
          <p className="text-sm leading-[18px] text-grey-600">
            {PTW_PACK_QUIZ_NOTE}
          </p>
        ) : null}
      </div>
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

  const chapter = guideChapter(
    stageName,
    isPtwPack ? PTW_PACK_HOST : step.name,
  );
  const who = whoLine(role, step.people);
  const howToShow = howRows.length > 0 ? howRows : mainRows;
  const hasRail =
    guides.length > 0 || samples.length > 0 || packSystems.length > 0;
  const splitRail =
    hasRail &&
    !embedded &&
    (guides.length + samples.length > 0 || packSystems.length > 2);

  return (
    <StepCardShell id={stepDomId(stageName, step.name)} embedded={embedded}>
      <div
        className={cn(
          "flex flex-col",
          embedded ? "gap-5" : "gap-4 tablet:gap-6",
          splitRail && "desktop:grid desktop:grid-cols-8 desktop:items-start desktop:gap-6",
        )}
      >
      <div className={cn("flex min-w-0 flex-col", embedded ? "gap-5" : "gap-4 tablet:gap-6", splitRail && "desktop:col-span-5")}>
      {!embedded || showPossible ? (
      <div className="flex flex-col gap-3">
        {embedded ? null : (
          <p className={LABEL_CAPS}>
            {stageName}
          </p>
        )}
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            {embedded ? null : (
            <h3 className="text-lg leading-[22px] font-bold text-black">
              {cardTitle(role, stageName, isPtwPack ? PTW_PACK_HOST : step.name)}
            </h3>
            )}
            {showPossible && (
              <MayApplyChip
                label={possibleChip(editMode)}
                hint={possibleChipHint(editMode, tenantFilledUnaligned)}
              />
            )}
          </div>
          {lead && !embedded && (
            <p className="text-base leading-5 text-grey-700">{lead}</p>
          )}
        </div>
        {showPossible && !hasAnswers && (
          <p className="text-sm leading-[18px] text-grey-600">
            {editMode === "correct"
              ? ui.officerPossibleEmptyLine
              : possibleCopy(editMode)}
          </p>
        )}
        {chapter && !embedded ? (
          <p className="text-sm leading-[18px] text-grey-600">
            {TAB_LABEL[chapter.phaseId]} · {chapter.title}
          </p>
        ) : null}
      </div>
      ) : null}

      {whenRows.length > 0 ? (
        <WhenChips rows={whenRows} role={role} asLead={embedded} />
      ) : null}

      {embedded && who && who !== "You" ? (
        <FactField label="Who">
          <ul className="flex flex-wrap gap-1" aria-label="Who is involved">
            {whoChips(role, step.people).map((name) => (
              <li key={name}>
                <OutlineChip>{name}</OutlineChip>
              </li>
            ))}
          </ul>
        </FactField>
      ) : null}

      {why && !embedded ? (
        <p className="text-sm leading-[18px] text-grey-700">{why}</p>
      ) : null}

      {howToShow.length > 0 || subheader ? (
        <div className="flex flex-col gap-2">
          {why || embedded ? <h4 className={LABEL_CAPS}>Your Steps</h4> : null}
          {howToShow.length === 1 && !howToShow[0].labels?.length ? (
            <p
              className={
                embedded
                  ? "text-sm leading-[18px] text-grey-700"
                  : "text-sm leading-[18px] text-black"
              }
            >
              {howToShow[0].line}
            </p>
          ) : howToShow.length > 0 ? (
            <PartyLineList rows={howToShow} size="how" />
          ) : subheader ? (
            <p className="text-sm leading-[18px] text-black">{subheader}</p>
          ) : null}
        </div>
      ) : null}

      {embedded && hasRail ? (
        <StepFilesRail
          guides={guides}
          samples={samples}
          systems={packSystems}
          stageName={stageName}
          stepName={step.name}
          highlightedDocId={highlightDocId}
          highlightedLabel={highlightSystemLabel}
          onPreview={onPreviewDoc}
          compact
        />
      ) : null}

      {who && !embedded && !showParty ? (
        <p className="text-sm leading-[18px] text-grey-600">{who}</p>
      ) : null}

      {step.name === IFM_BRIEFING_STEP ? (
        <p className="text-sm leading-[18px] text-grey-600">
          The agreed list lives in Works.
        </p>
      ) : null}

      {showContractorScreenerCta && <ScreenerPrepBanner />}

      {isPtwPack && packTypesBlock && (!showPackDecide || officerCanWrite) &&
        packTypesBlock}

      {showPermitResults && !showLinkedWorks && !showInlineQuizSummary && permitResult && (
        <FieldSection label={ui.resultsLabel}>
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
              ? ui.kickoffPermitsLabelAgreed
              : ui.kickoffPermitsLabel
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
                      className="flex items-start gap-3"
                    >
                      <span
                        className="inline-flex h-[18px] w-2 shrink-0 items-center justify-center"
                        aria-hidden
                      >
                        <IconLeaf
                          src={dotIcon}
                          leafW={5.33}
                          leafH={5.33}
                          frame={8}
                        />
                      </span>
                      <div className="min-w-0 flex-1">
                        {row.workIf && (
                          <p className="text-xs font-bold leading-4 text-grey-500">
                            {row.workIf}
                          </p>
                        )}
                        <p className="text-sm leading-[18px] text-black">
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

      {hasRail && !embedded ? (
        <aside
          className={cn(
            "flex min-w-0 flex-col gap-3",
            splitRail
              ? "border-t border-grey-100 pt-4 desktop:col-span-3 desktop:border-l desktop:border-t-0 desktop:pt-0 desktop:pl-6"
              : "pt-1",
          )}
        >
          <SystemTypeGroup
            systems={packSystems}
            stageName={stageName}
            stepName={step.name}
            highlightedLabel={highlightSystemLabel}
          />
          <StepFilesRail
            guides={guides}
            samples={samples}
            stageName={stageName}
            stepName={step.name}
            highlightedDocId={highlightDocId}
            onPreview={onPreviewDoc}
          />
        </aside>
      ) : null}
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
              subtitle={canWriteQuiz ? ui.possibleDecideSub : undefined}
              body={
                canWriteQuiz ? undefined : (
                  <p className="text-sm leading-[18px] text-grey-700">
                    {possibleCopy(editMode, tenantFilledUnaligned)}
                  </p>
                )
              }
            >
              {canWriteQuiz
                ? ui.possibleDecideLine
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
              subtitle={canWriteQuiz ? ui.packDecideSub : undefined}
              body={packTypesBlock}
            >
              {canWriteQuiz
                ? ui.packDecideLine
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
                      {role !== "contractor" && !isOperateQuiz ? (
                        <ScreenerCta role={role} />
                      ) : null}
                    </>
                  ) : officerPending ? (
                    <>
                      <QuizAnswerReview rows={reviewRows} />
                      {hostsQuiz && quiz ? (
                        <div className="border-t border-grey-200 pt-4">
                          <GuideCta tone="ghost" onClick={quiz.onEdit}>
                            {ui.officerEditCta}
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
                              ? ui.resumeCta
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
                      {role !== "contractor" && !isOperateQuiz ? (
                        <ScreenerCta role={role} />
                      ) : null}
                    </>
                  ) : (
                    <QuizAnswerReview rows={reviewRows} />
                  )}
                  {confirmed && permitResult ? null : confirmed ? (
                    <div className="border-t border-grey-200 pt-4">
                      {role !== "contractor" && !isOperateQuiz ? (
                        <ScreenerCta role={role} />
                      ) : null}
                    </div>
                  ) : hostsQuiz && contractorCanWrite && quiz ? (
                    <div className="border-t border-grey-200 pt-4">
                      <GuideCta
                        tone="ghost"
                        onClick={() => quiz.onOpenQuiz(true)}
                      >
                        {quizStatus === "paused"
                          ? ui.resumeCta
                          : "Edit Answers"}
                      </GuideCta>
                    </div>
                  ) : hostsQuiz && officerCanWrite && quiz ? (
                    <div className="border-t border-grey-200 pt-4">
                      <GuideCta tone="ghost" onClick={quiz.onEdit}>
                        {ui.officerEditCta}
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
                    ? ui.tenantIdleSoonHint
                    : ui.tenantIdleHint
                  : inlineOpenCount > 0
                    ? `${inlineOpenCount} not answered`
                    : undefined
              }
              subtitle={
                tenantWaitingOnContractor
                  ? tenantIdleSoon
                    ? ui.tenantIdleSoonHint
                    : ui.tenantIdleHint
                  : inlineOpenCount > 0
                    ? `${inlineOpenCount} not answered`
                    : undefined
              }
              footer={
                officerCanWrite ? (
                  <GuideCta tone="ghost" onClick={quiz.onEdit}>
                    {ui.officerEditCta}
                  </GuideCta>
                ) : undefined
              }
              body={<QuizAnswerReview rows={reviewRows} />}
            >
              {tenantWaitingOnContractor
                ? ui.tenantIdleSoonTitle
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
    </StepCardShell>
  );
}
