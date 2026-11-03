import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Check, ChevronDown, CircleAlert, CircleCheck, ClipboardList, DoorOpen, ExternalLink, Files, FileText, Info, Loader2, MapPin, MoreHorizontal, Plus, Trash2, Upload } from "lucide-react";
import { PackHowItWorks } from "@/components/v31/PackHowItWorks";
import { CueStatusChip, StatusDot } from "@/components/v31/ProjectCard";
import { ProjectPhaseRail, type ProjectRailItem } from "@/components/v31/ProjectPhaseRail";
import helpIcon from "@/assets/figma/help-questions.svg";
import checkCircleIcon from "@/assets/figma/check.svg";
import documentsOutlineIcon from "@/assets/figma/documents-outline.svg";
import downloadIcon from "@/assets/figma/download.svg";
import permitFileIcon from "@/assets/figma/permit-file.svg";
import infoIcon from "@/assets/figma/info.svg";
import arrowTopIcon from "@/assets/figma/arrow-top.svg";
import { Button } from "@/components/Button/Button";
import projectsIcon from "@/assets/figma-setup/projects.svg";
import {
  StepInset,
  StepInsetList,
  StepSection,
} from "@/components/v31/StepSection";
import { createPortal } from "react-dom";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Banner } from "@/components/dls/Banner";
import { phoneOverlayStyle, phonePanelStyle, usePhoneSheetFrame } from "@/components/dls/SheetFrame";
import { SampleModalHeader } from "@/components/v34/SampleModalHeader";
import { DocumentNeedList } from "@/components/v35/DocumentNeedList";
import { useApp, type Role } from "@/lib/app-state";
import { UNITS, type Unit } from "@/lib/tenancy-data";
import { UnitSelection } from "@/components/dls/UnitSelection";
import { publicUrl } from "@/lib/public-url";
import { permitExplainFor } from "@/lib/process-permit-explain";
import {
  CONTRACTOR_JOBS,
  LS_JOB,
  LS_OUTLET,
} from "@/lib/process-job-context";
import {
  readV26OutletStory,
  v26TenantShowsOutletPicker,
  v26UnitsForStory,
  V26_OUTLET_CHANGED,
} from "@/lib/process-v26-outlets";
import {
  completeAnswers,
  quizIsConfirmed,
  type QuizState,
} from "@/lib/process-planned-works-quiz";
import { stampV26UnitFacts } from "@/lib/process-v26-quiz";
import {
  hydrateV28FromLegacy,
  settleV28Write,
  syncV28Slugs,
  v28HasSavedAnswers,
  v28QuizForWork,
  v28QuizProgress,
  v28ScopeSummary,
  v28TextValue,
} from "@/lib/process-v28-quiz";
import { ActionButton, ActionButtonIcon } from "@/components/dls/ActionButton";
import { DlsTooltipTip } from "@/components/dls/Tooltip";
import editIcon from "@/assets/figma/edit.svg";
import { QuizChecklistV28 } from "@/components/dls/QuizChecklistV28";
import { WorkStepRail } from "@/components/WorkStepRail";
import { markV28Preview, V28_PREVIEW_KEY } from "@/lib/process-v28-preview";
import {
  isV31Path,
  isV33Path,
  isV34Path,
  usesV38Modules,
  usesV37Cut,
  usesV35Flow,
  V31_HOME_HREF,
} from "@/lib/process-v31-preview";
import { V35ProjectsList } from "@/components/v35/ProjectsList";
import { V35CheckDocuments } from "@/components/v35/CheckDocuments";
import {
  v35CanStart,
  v35CanWrite,
  v35ContractorOf,
  V35_SELF_CONTRACTOR_ID,
  v35OpenParams,
  v35StatusOf,
} from "@/lib/process-v35";
import {
  saveV37Work,
  v37ApplyAnswers,
  v37OutletLabel,
  v37StartProject,
  v37UnitById,
  v37UnitsForTenant,
  v37VisibleWorks,
  v37WorkById,
  V37_CHANGED,
  V37_STATUS,
  v37IsNoPermit,
  type V37Work,
} from "@/lib/process-v37";
import { v38FullGuideCards } from "@/lib/process-v38-guide";
import {
  v33StepsLabel,
  v33DocumentChecklist,
  v33PhaseModel,
  v33ProjectOutcome,
  v33RailLabels,
} from "@/lib/process-v33-feed";
import {
  downloadV31PermitZip,
  v31BecauseLine,
  v31NextStep,
  firstActionableRail,
  v31Outcome,
  v31RailLabels,
  V31_WORK_RAIL,
  v31StartTitle,
  isV31Complete,
  completeV31Work,
  reopenV31Work,
  readV31Archived,
  readV31Deleted,
  readV31Closes,
  closeV31Step,
  clearV31Step,
  dropV31Work,
  setV31Archived,
  V31_ARCHIVED_CHANGED,
  V31_DELETED_CHANGED,
  V31_CLOSES_CHANGED,
  V31_COMPLETED_CHANGED,
} from "@/lib/process-v31-works";
import {
  v31IsPast,
  v31PhaseModel,
  v31ProjectCue,
  v34OpensPermit,
  v31UrgencyBand,
  v31UrgencyRank,
  v31WaitingChipTone,
  V31_CHIP_TONE,
  type V31PhaseBase,
  type V31PhaseId,
} from "@/lib/process-v31-cue";
import {
  readV28WorksStory,
  seedV28PassedSample,
  V28_WORKS_STORY_CHANGED,
} from "@/lib/process-v28-seed";
import { ensureV31WorksStory } from "@/lib/process-v31-seed";
import {
  V28_PACK_PHASE,
  V28_WORK_TABS,
  v28ApplyCard,
  v28IfTheyAsk,
  v28PackCard,
  v28SharedFact,
  type V28PackPhase,
} from "@/lib/process-v28-voice";
import { v28LinkedFact, v28SystemsNotInFact } from "@/lib/process-v28-systems";
import { v28DocumentRowMeta, v37DocumentScreen } from "@/lib/process-v28-document-row";
import {
  attachV28Doc,
  docAttachKey,
  isV28ApplyStep,
  readV28Attachments,
  readV28Screen,
  readV28Submitted,
  removeV28Doc,
  v28DecideResult,
  v28FlaggedCount,
  v35DocumentSlots,
  v35DocumentSummary,
  type V35DocSummary,
  V28_APPLY_PARTS,
  V28_APPLY_STEPS,
  V28_SCREEN_EVENT,
  writeV28Screen,
  writeV28Submitted,
  type V28ApplyStep,
  type V28Attachment,
  type V28ScreenState,
} from "@/lib/process-v28-screener";
import {
  v28WorkRail,
  v28WorkReadiness,
  type V28ChipTone,
  type V28RailId,
  type V28WorkRail,
  type V28WorkReadiness,
} from "@/lib/process-v28-readiness";
import { WorksV28Screener } from "@/pages/WorksV28Screener";
import {
  canFillV26Work,
  canStartV26Work,
  isV26EmptyStockSlot,
  seedV26Works,
  startV26Work,
  upsertV26Work,
  v26DocumentChecklist,
  type V26ChecklistDoc,
  v26DraftOutcome,
  v26WorkListTitle,
  V26_WORKS_CHANGED,
  readV26Works,
  deleteV26Work,
  type V26Work,
} from "@/lib/process-v26-works";
import {
  v26CardView,
  type V26Card,
  type V26TellLine,
} from "@/lib/process-v26-guide";
import { BecauseTitleHint, V26GuideCard } from "@/pages/v26-guide-card";
import caretDown from "@/assets/figma/caret-down.svg";
import closeIcon from "@/assets/figma/x-close.svg";
import pdfIcon from "@/assets/figma/pdf.svg";
import { cn } from "@/lib/utils";

/** This sitting runs from the documents through to the OneCalendar submission. */
const V35_PERMIT_STEP_TITLE = "Prepare and Submit in OneCalendar";

function v35PermitDoorTitle(role: Role) {
  if (role === "officer") return "Track the renovation permit";
  if (role === "tenant") return "Follow your renovation permit";
  return "Apply for the renovation permit";
}

const BACK =
  "inline-flex w-fit items-center gap-1 text-sm leading-[18px] font-bold text-purple-600 hover:text-purple-700 print:hidden focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]";

function BackArrow() {
  return (
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
        maskPosition: "center",
        transform: "rotate(90deg)",
      }}
    />
  );
}

function useV26Unit() {
  const location = useLocation();
  const [params] = useSearchParams();
  const v37 = usesV37Cut(location.pathname);
  const {
    role,
    unit,
    setUnit,
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

  const forcedUnit = v37 ? v37UnitById(v37WorkById(params.get("work"))?.unitId ?? "") : null;

  const ctxUnit: Unit = useMemo(() => {
    if (forcedUnit) return forcedUnit;
    if (role === "contractor") {
      return (
        CONTRACTOR_JOBS.find((job) => job.id === jobId)?.unit ??
        CONTRACTOR_JOBS[0].unit
      );
    }
    if (role === "officer") return effectiveUnit ?? unit;
    return unit;
  }, [forcedUnit, role, jobId, effectiveUnit, unit]);

  const picker = (
    <UnitSelection
      className="w-full tablet:w-full desktop:w-[259px] desktop:shrink-0"
      chipsClassName="tablet:justify-start desktop:justify-end"
      value={
        role === "contractor" ? jobId : role === "tenant" ? ctxUnit.id : ctxUnit.unitNo
      }
      options={
        role === "contractor"
          ? CONTRACTOR_JOBS.map((job) => ({ value: job.id, label: job.label }))
          : role === "tenant"
            ? tenantUnits.map((row) => ({
                value: row.id,
                label: v37 ? v37OutletLabel(row.id) : row.unitNo,
              }))
            : UNITS.map((row) => ({ value: row.unitNo, label: row.unitNo }))
      }
      chips={
        role === "officer" && isUnscoped
          ? ["All Terminals", "All Zones"]
          : [ctxUnit.terminal, ctxUnit.zone, ctxUnit.tenancyType]
      }
      showSelect={role !== "tenant" || v26TenantShowsOutletPicker(outletStory)}
      onChange={(next) => {
        if (role === "contractor") {
          setJobId(next);
          window.localStorage.setItem(LS_JOB, next);
          return;
        }
        if (role === "tenant") {
          const hit = tenantUnits.find((row) => row.id === next);
          if (!hit) return;
          setUnit(hit);
          window.localStorage.setItem(LS_OUTLET, hit.id);
          return;
        }
        const hit = UNITS.find((row) => row.unitNo === next);
        if (hit) {
          setOfficerSelection({
            terminal: hit.terminal as "T1" | "T2" | "T3" | "T4",
            tenancyType: hit.tenancyType as "Retail" | "F&B",
            zone: "Airside",
          });
        }
      }}
    />
  );

  return { role, ctxUnit, picker };
}

function persistWork(
  unit: Unit,
  work: V26Work,
  nextQuiz: V26Work["quiz"],
  confirmed = false,
) {
  const hydrated = hydrateV28FromLegacy(nextQuiz, unit);
  const synced = syncV28Slugs(hydrated);
  const stamped = stampV26UnitFacts(synced, unit);
  const answers = completeAnswers(stamped.answers);
  const settled = settleV28Write({
    ...stamped,
    answers: {
      ...answers,
      ...(stamped.answers as QuizState["answers"]),
    },
    confirmed: false,
  });
  const name = v28TextValue(settled, "q-name").trim();
  if (usesV37Cut(window.location.pathname)) {
    return saveV37Work(
      v37ApplyAnswers(
        { ...(work as V37Work), title: name || work.title },
        { ...settled, confirmed },
      ),
    );
  }
  return upsertV26Work(unit.id, {
    ...work,
    ...(name ? { title: name } : {}),
    quiz: { ...settled, confirmed },
  });
}

export function WorksV28Page() {
  const { role, ctxUnit, picker } = useV26Unit();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const [works, setWorks] = useState<V26Work[]>([]);
  const [screenTick, setScreenTick] = useState(0);
  const [generating, setGenerating] = useState(false);
  const editSnapshot = useRef<QuizState | null>(null);
  const selectedId = params.get("work");
  const pullWorks = () =>
    usesV37Cut(location.pathname) ? v37VisibleWorks(role) : readV26Works(ctxUnit.id);

  useEffect(() => {
    if (isV31Path(location.pathname)) {
      try {
        if (window.localStorage.getItem(V28_PREVIEW_KEY) === "1") {
          window.localStorage.removeItem(V28_PREVIEW_KEY);
          window.dispatchEvent(new Event("tempo:v28-preview"));
        }
      } catch {
        /* ignore */
      }
    } else {
      markV28Preview();
    }
    const hydrate = () => {
      if (usesV37Cut(location.pathname)) {
        setWorks(v37VisibleWorks(role));
        return;
      }
      if (!readV28WorksStory()) {
        seedV26Works(ctxUnit.id);
        seedV28PassedSample(ctxUnit, role);
      }
      setWorks(pullWorks());
    };
    const bootDemo = () => {
      if (usesV37Cut(location.pathname)) {
        hydrate();
        return;
      }
      if (isV31Path(location.pathname)) ensureV31WorksStory(ctxUnit, role);
      hydrate();
    };
    bootDemo();
    window.addEventListener(V26_WORKS_CHANGED, hydrate);
    window.addEventListener(V28_WORKS_STORY_CHANGED, bootDemo);
    window.addEventListener(V37_CHANGED, hydrate);
    window.addEventListener("storage", bootDemo);
    return () => {
      window.removeEventListener(V26_WORKS_CHANGED, hydrate);
      window.removeEventListener(V28_WORKS_STORY_CHANGED, bootDemo);
      window.removeEventListener(V37_CHANGED, hydrate);
      window.removeEventListener("storage", bootDemo);
    };
  }, [ctxUnit, role, location.pathname, location.search]);

  useEffect(() => {
    if (usesV37Cut(location.pathname)) {
      setWorks(v37VisibleWorks(role));
      return;
    }
    if (!isV31Path(location.pathname) || selectedId) return;
    ensureV31WorksStory(ctxUnit, role);
    setWorks(pullWorks());
  }, [ctxUnit, role, location.pathname, location.search, selectedId]);

  useEffect(() => {
    const refresh = () => setScreenTick((n) => n + 1);
    window.addEventListener(V28_SCREEN_EVENT, refresh);
    window.addEventListener(V31_CLOSES_CHANGED, refresh);
    window.addEventListener(V31_COMPLETED_CHANGED, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(V28_SCREEN_EVENT, refresh);
      window.removeEventListener(V31_CLOSES_CHANGED, refresh);
      window.removeEventListener(V31_COMPLETED_CHANGED, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const selected = selectedId
    ? (works.find((row) => row.id === selectedId) ?? null)
    : null;

  const visible = [...works]
    .filter((work) => !isV26EmptyStockSlot(work))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const v31 = isV31Path(location.pathname);
  const v35 = usesV35Flow(location.pathname);
  const v34 = isV34Path(location.pathname);
  const v33 = isV33Path(location.pathname);
  const v34Flow = v34 || v35;
  const edition = v35 ? "v35" : v34 ? "v34" : v33 ? "v33" : v31 ? "v31" : "v28";
  const usesV33Feed = v33 || v34Flow;
  const canWrite = Boolean(
    selected &&
      (v35
        ? v35CanWrite(role)
        : v34
          ? canFillV26Work(role)
          : v31
            ? role === "contractor"
            : canFillV26Work(role)),
  );
  const outcome = selected
    ? usesV33Feed
      ? v33ProjectOutcome(selected, role, ctxUnit)
      : v31
        ? v31Outcome(selected, role, ctxUnit)
        : v26DraftOutcome(selected, role, ctxUnit)
    : null;
  const docs = outcome
    ? usesV33Feed
      ? v33DocumentChecklist(outcome.permits, role)
      : v26DocumentChecklist(outcome.permits, role)
    : [];
  const quiz = selected ? v28QuizForWork(selected, ctxUnit) : null;
  const progress = quiz ? v28QuizProgress(quiz) : { answered: 0, total: 0 };

  const openWork = (work: V26Work) => {
    if (v35) {
      setParams(v35OpenParams(work, ctxUnit, role));
      return;
    }
    const next = new URLSearchParams();
    next.set("work", work.id);
    if (
      v34 &&
      v34OpensPermit(
        v31ProjectCue(work, v28WorkReadiness(work, ctxUnit, role, edition), role, ctxUnit),
      )
    ) {
      next.set("tab", "pack");
      next.set("apply", "upload");
    }
    setParams(next);
  };

  const start = () => {
    if (usesV37Cut(location.pathname)) {
      const work = v37StartProject();
      setWorks(v37VisibleWorks(role));
      openWork(work);
      return;
    }
    const work = startV26Work(ctxUnit.id);
    if (v31) {
      upsertV26Work(ctxUnit.id, {
        ...work,
        title: v31StartTitle(),
        ...(v35
          ? {
              contractorId: V35_SELF_CONTRACTOR_ID,
              contractorName: v35ContractorOf({
                ...work,
                contractorId: V35_SELF_CONTRACTOR_ID,
              }).name,
            }
          : {}),
      });
    }
    setWorks(pullWorks());
    openWork(work);
  };

  const applyParam = params.get("apply");
  const quizLocked = Boolean(quiz && quizIsConfirmed(quiz));
  const selectedReady = selected
    ? v28WorkReadiness(selected, ctxUnit, role, edition)
    : null;
  const selectedPast = Boolean(v31 && selectedReady && v31IsPast(selectedReady));
  const onParts = applyParam === V28_APPLY_PARTS && quizLocked;
  const apply =
    isV28ApplyStep(applyParam) && quizLocked ? applyParam : null;
  const inSubmit = Boolean(apply || onParts);
  const v31Lead = usesV37Cut(location.pathname)
    ? role === "contractor"
      ? "See every renovation you’re working on, across units and tenants"
      : role === "officer"
        ? "See every renovation on these units, including when two tenancies overlap"
        : "See the renovations for your tenancy, across the outlets you own"
    : `From scope to opening at ${ctxUnit.unitNo}`;
  const v35Model =
    v35 && selected && quizLocked && outcome ? v33PhaseModel(outcome) : null;
  const projectTabs = v35Model
    ? ([
        ["overview", "Overview"],
        ...(v35Model.hasPermit ? ([["documents", "Permit documents"]] as const) : []),
      ] as [ProjectTab, string][])
    : [];
  const resultParam = params.get("result");
  const onGuide = usesV37Cut(location.pathname) && resultParam === "steps";
  const projectTab: ProjectTab = onGuide
    ? "steps"
    : inSubmit || resultParam === "answers"
      ? "documents"
      : "overview";
  const openProjectTab = (tab: ProjectTab) => {
    if (!selected) return;
    const next = new URLSearchParams();
    next.set("work", selected.id);
    if (tab === "overview") {
      next.set("tab", "answers");
      next.set("result", "scope");
    } else if (tab === "steps") {
      next.set("result", "steps");
    } else {
      const screen = readV28Screen(ctxUnit.id, selected.id);
      next.set("tab", "pack");
      next.set(
        "apply",
        screen.result === "pass" || screen.result === "issues"
          ? "results"
          : screen.result === "error" || screen.result === "running"
            ? "screen"
            : "checklist",
      );
    }
    setParams(next);
  };

  return (
    <div
      className={cn(
        "dls-page min-w-0 !pt-5 tablet:!pt-8",
        v31 && !selected
          ? "dls-grid-12 gap-y-6"
          : v31 && selected
            ? "flex flex-col gap-8 tablet:gap-10"
            : "flex flex-col gap-6",
      )}
    >
      <header
        className={cn(
          "flex min-w-0 flex-col gap-3",
          v31 && !selected && "col-span-full",
          v31
            ? selected
              ? usesV37Cut(location.pathname) || !inSubmit
                ? "w-full"
                : "max-w-3xl"
              : "w-full"
            : inSubmit
              ? "max-w-3xl"
              : selected
                ? "max-w-xl desktop:max-w-none"
                : "max-w-xl",
        )}
      >
        {selected ? (
          v34 && inSubmit ? (
            <button
              type="button"
              onClick={() => {
                const next = new URLSearchParams(params);
                next.set("work", selected.id);
                next.set("result", "steps");
                next.delete("apply");
                next.delete("tab");
                setParams(next);
              }}
              className={BACK}
            >
              <BackArrow />
              Full Guide
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setParams(new URLSearchParams())}
              className={BACK}
            >
              <BackArrow />
              {v31 ? "All Projects" : "All works"}
            </button>
          )
        ) : null}
        <div
          className={cn(
            v34 && !selected &&
              "flex flex-col gap-3 desktop:flex-row desktop:items-start desktop:justify-between",
            usesV37Cut(location.pathname) &&
              selected &&
              "flex items-end justify-between gap-3",
          )}
        >
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <h1
            className={cn(
              "min-w-0 font-bold break-words text-black",
              usesV37Cut(location.pathname)
                ? "text-[28px] leading-9"
                : "text-2xl leading-8 tablet:text-[28px] tablet:leading-9",
            )}
          >
            {selected
              ? v28WorkReadiness(selected, ctxUnit, role, edition).title
              : v31
                ? "Projects"
                : "Works"}
          </h1>
          {v31 && !selected ? (
            <p
              className={cn(
                "text-sm leading-[18px]",
                usesV37Cut(location.pathname)
                  ? "text-grey-700 tablet:text-base tablet:leading-5"
                  : "text-grey-500",
              )}
            >
              {v31Lead}
            </p>
          ) : null}
          {selected ? (
            <p className="min-w-0 text-sm leading-[18px] text-grey-500">
              {v31
                ? selectedPast
                  ? `${
                      usesV37Cut(location.pathname)
                        ? V37_STATUS.downloaded
                        : selectedReady?.chip === "Complete"
                          ? "Completed"
                          : "No Permit Needed"
                    } at ${ctxUnit.unitNo}`
                  : v35
                    ? `${
                        usesV37Cut(location.pathname) &&
                        selectedReady &&
                        v37IsNoPermit(selectedReady)
                          ? V37_STATUS.noPermit
                          : v35StatusOf(selectedReady ?? v28WorkReadiness(selected, ctxUnit, role, edition), role).label
                      } at ${ctxUnit.unitNo}`
                  : v34
                    ? quizLocked
                      ? `In progress at ${ctxUnit.unitNo}`
                      : role === "contractor"
                        ? `Scope in progress at ${ctxUnit.unitNo}`
                        : `Scope in progress at ${ctxUnit.unitNo}. ${role === "tenant" ? "Your" : "The"} contractor fills it in.`
                    : v31Lead
                : inSubmit
                  ? `${ctxUnit.unitNo} · ${V28_WORK_TABS.applyLead}`
                  : `${ctxUnit.unitNo} · ${v28WorkReadiness(selected, ctxUnit, role, "v28").chip}`}
            </p>
          ) : null}
        </div>
        {usesV37Cut(location.pathname) &&
        selected &&
        quizLocked &&
        !(params.get("result") === "review" && !(canWrite && !selectedPast)) ? (
          <ActionButton
            variant="tertiary"
            size="sm"
            className="w-fit shrink-0 print:hidden"
            iconEnd={
              <ActionButtonIcon
                src={canWrite && !selectedPast ? editIcon : documentsOutlineIcon}
              />
            }
            onClick={() => {
              if (canWrite && !selectedPast) {
                editSnapshot.current = quiz ?? selected.quiz;
                persistWork(ctxUnit, selected, quiz ?? selected.quiz, false);
                setWorks(pullWorks());
                const next = new URLSearchParams(params);
                next.set("work", selected.id);
                next.set("tab", "answers");
                next.delete("apply");
                next.delete("result");
                const back = params.get("apply");
                if (
                  back === "checklist" ||
                  back === "upload" ||
                  back === "screen" ||
                  back === "results"
                ) {
                  next.set("return", back);
                }
                setParams(next);
                return;
              }
              const next = new URLSearchParams();
              next.set("work", selected.id);
              next.set("tab", "answers");
              next.set("result", "review");
              setParams(next);
            }}
          >
            {canWrite && !selectedPast ? "Edit Scope" : "View Scope"}
          </ActionButton>
        ) : null}
        {v34 && !selected ? picker : null}
        </div>
        {!usesV37Cut(location.pathname) && projectTabs.length > 1 ? (
          <div
            role="tablist"
            aria-label="Project pages"
            className="mt-1 flex overflow-x-auto border-b border-grey-200"
          >
            {projectTabs.map(([id, label]) => {
              const on = projectTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => openProjectTab(id)}
                  className={cn(
                    "relative inline-flex h-11 shrink-0 items-center px-4 text-sm leading-[18px] first:pl-0",
                    on
                      ? "font-bold text-purple-600 after:absolute after:left-4 after:right-4 after:bottom-[-1px] after:h-0.5 after:bg-purple-600 first:after:left-0"
                      : "text-grey-500 hover:text-grey-700",
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        ) : null}
          {selected && role === "tenant" && !selectedPast && !v34Flow ? (
            <p className="text-sm leading-[18px] text-grey-700">
              {quizLocked
                ? v28WorkReadiness(selected, ctxUnit, role, edition).nextMove
                : "Your contractor fills in what this renovation involves. You can read it here."}
            </p>
          ) : null}
          {selected && v31 && role === "officer" && !selectedPast && !v34Flow ? (
            <p className="text-sm leading-[18px] text-grey-700">
              {quizLocked
                ? v28WorkReadiness(selected, ctxUnit, role, edition).nextMove
                : "The contractor fills in what this renovation involves. You can read it here."}
            </p>
          ) : null}
      </header>

      {!selected ? (
        <WorksList
          role={role}
          unit={ctxUnit}
          works={visible}
          screenTick={screenTick}
          canStart={edition === "v35" ? v35CanStart(role) : canStartV26Work(role)}
          edition={edition}
          onStart={start}
          onOpen={openWork}
        />
      ) : (
        <WorkDetail
          selected={selected}
          unit={ctxUnit}
          role={role}
          canWrite={canWrite}
          outcome={outcome}
          docs={docs}
          quiz={quiz ?? selected.quiz}
          progress={progress}
          edition={edition}
          tabParam={params.get("tab")}
          resultParam={params.get("result")}
          apply={onParts ? V28_APPLY_PARTS : apply}
          onTab={(tab) => {
            const next = new URLSearchParams(params);
            next.set("work", selected.id);
            next.set("tab", tab);
            next.delete("apply");
            next.delete("result");
            setParams(next);
          }}
          onApply={(step) => {
            const next = new URLSearchParams(params);
            next.set("work", selected.id);
            next.set("tab", "pack");
            next.set("apply", step);
            next.delete("result");
            setParams(next);
          }}
          onEnterSteps={() => {
            const next = new URLSearchParams(params);
            next.set("work", selected.id);
            next.set("result", "steps");
            next.delete("apply");
            next.delete("tab");
            setParams(next);
          }}
          onQuiz={(nextQuiz) => {
            persistWork(ctxUnit, selected, nextQuiz);
            setWorks(pullWorks());
          }}
          onLock={() => {
            const finish = () => {
              persistWork(ctxUnit, selected, quiz ?? selected.quiz, true);
              setWorks(pullWorks());
              const next = new URLSearchParams(params);
              next.set("work", selected.id);
              const back = params.get("return");
              if (
                usesV37Cut(location.pathname) &&
                (back === "checklist" || back === "upload" || back === "screen" || back === "results")
              ) {
                next.set("tab", "pack");
                next.set("apply", back);
                next.delete("result");
                next.delete("return");
                setParams(next);
                return;
              }
              if (!v31) {
                next.set("tab", "pack");
                next.delete("apply");
                setParams(next);
                return;
              }
              next.set("tab", "answers");
              next.set("result", "scope");
              next.delete("apply");
              next.delete("return");
              setParams(next);
            };
            if (v35) {
              setGenerating(true);
              window.setTimeout(() => {
                setGenerating(false);
                finish();
              }, usesV37Cut(location.pathname) ? 3200 : 1600);
              return;
            }
            finish();
          }}
          onUnlock={(back) => {
            editSnapshot.current = quiz ?? selected.quiz;
            persistWork(ctxUnit, selected, quiz ?? selected.quiz, false);
            setWorks(pullWorks());
            const next = new URLSearchParams(params);
            next.set("work", selected.id);
            next.set("tab", "answers");
            next.delete("apply");
            next.delete("result");
            if (usesV37Cut(location.pathname) && back) next.set("return", back);
            setParams(next);
          }}
          onCancelEdit={() => {
            const snap = editSnapshot.current;
            const back = params.get("return");
            if (snap) persistWork(ctxUnit, selected, snap, true);
            else persistWork(ctxUnit, selected, quiz ?? selected.quiz, true);
            editSnapshot.current = null;
            setWorks(pullWorks());
            const next = new URLSearchParams(params);
            next.set("work", selected.id);
            next.delete("return");
            if (
              back === "checklist" ||
              back === "upload" ||
              back === "screen" ||
              back === "results"
            ) {
              next.set("tab", "pack");
              next.set("apply", back);
              next.delete("result");
            } else {
              next.set("tab", "answers");
              next.set("result", "scope");
              next.delete("apply");
            }
            setParams(next);
          }}
        />
      )}
      {generating ? (
        usesV37Cut(location.pathname) ? (
          <div
            className="fixed inset-0 z-50 grid place-items-center bg-[rgba(18,18,18,0.4)] px-6"
            role="status"
            aria-live="polite"
          >
            <div className="flex w-full max-w-[311px] flex-col items-center gap-4 rounded-[var(--radius-md)] bg-white p-4 text-center shadow-[var(--shadow-light-bg)] tablet:max-w-[376px]">
              <span className="relative grid size-[38px] shrink-0 place-items-center" aria-hidden>
                <span className="absolute inset-0 rounded-full border-2 border-purple-600 opacity-10" />
                <span className="absolute inset-[5px] rounded-full border-2 border-purple-600 opacity-30" />
                <Loader2 className="relative size-5 animate-spin text-purple-600" />
              </span>
              <div className="flex flex-col gap-1">
                <p className="text-sm leading-[18px] font-bold text-black tablet:text-base tablet:leading-5">
                  Checking What’s Required
                </p>
                <p className="text-xs leading-4 text-grey-400 tablet:text-sm tablet:leading-[18px]">
                  Listing the permits, documents, and checks you need.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="fixed inset-0 z-50 grid place-items-center bg-[rgba(18,18,18,0.35)]"
            role="status"
            aria-live="polite"
          >
            <div className="rounded-[var(--radius-2xl)] bg-white px-8 py-6 text-center shadow-[var(--shadow-light-bg)]">
              <p className="text-base leading-6 font-bold text-black">Building your project</p>
              <p className="mt-2 text-sm leading-5 text-grey-600">
                Working out permits, documents, and next steps from your answers.
              </p>
            </div>
          </div>
        )
      ) : null}
    </div>
  );
}

type WorkTab = "pack" | "answers" | "next";
type ProjectTab = "overview" | "steps" | "documents";

function WorkRail({
  rail,
  onTab,
  onApply,
  named = false,
}: {
  rail: V28WorkRail;
  onTab: (tab: WorkTab) => void;
  onApply: (step: V28ApplyStep | typeof V28_APPLY_PARTS) => void;
  named?: boolean;
}) {
  return (
    <WorkStepRail
      rail={rail}
      variant={named ? "named" : "default"}
      onStep={(id) => {
        if (id === "submit") {
          if (rail.showing !== "submit") onApply(V28_APPLY_PARTS);
          return;
        }
        onTab(id);
      }}
    />
  );
}

type StepTone = "locked" | "current" | "open" | "done";

type PhaseId = V31PhaseId;

type PhaseStop = V31PhaseBase & { tone: StepTone };

const STEP_PRIMARY =
  "inline-flex h-10 w-fit shrink-0 items-center justify-center self-start rounded-[var(--radius-sm)] bg-purple-600 px-4 text-sm leading-[18px] font-bold text-white hover:bg-purple-700 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)] disabled:cursor-default disabled:bg-grey-200 disabled:text-grey-500";

function CompletedMark() {
  return (
    <div className="flex items-center gap-2">
      <span className="grid size-5 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-success-600 text-white">
        <Check className="size-3" strokeWidth={3} aria-hidden />
      </span>
      <p className="text-sm leading-[18px] font-bold text-success-800">
        Completed
      </p>
    </div>
  );
}

const STEP_CHECK =
  "mt-0.5 size-4 shrink-0 rounded-[var(--radius-sm)] border-grey-300 text-success-600 accent-success-600 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)] disabled:cursor-default";

function StepDoneToggle({
  done,
  canWrite,
  onToggle,
}: {
  done: boolean;
  canWrite: boolean;
  onToggle: () => void;
}) {
  if (!canWrite) {
    return (
      <p className="text-sm leading-[18px] text-grey-600">
        {done
          ? "This step is done."
          : "The contractor confirms this step when it is done."}
      </p>
    );
  }
  return (
    <label className="flex w-fit cursor-pointer items-start gap-2">
      <input
        type="checkbox"
        checked={done}
        onChange={onToggle}
        className={STEP_CHECK}
      />
      <span
        className={cn(
          "text-sm leading-[18px]",
          done ? "font-bold text-black" : "text-grey-700",
        )}
      >
        I have done this
      </span>
    </label>
  );
}

function StepDoneFooter({
  done,
  canWrite,
  onToggle,
  nextLabel,
  nextReady,
  onNext,
  note,
  hideToggle = false,
}: {
  done: boolean;
  canWrite: boolean;
  onToggle: () => void;
  nextLabel?: string | null;
  nextReady?: boolean;
  onNext?: () => void;
  note?: string | null;
  hideToggle?: boolean;
}) {
  if (hideToggle && !note && !nextLabel) return null;
  return (
    <div className="flex flex-col gap-3 border-t border-grey-100 pt-4">
      {hideToggle ? null : (
        <StepDoneToggle done={done} canWrite={canWrite} onToggle={onToggle} />
      )}
      {note ? <p className="text-sm leading-5 text-grey-600">{note}</p> : null}
      {nextLabel ? (
        <button
          type="button"
          disabled={!nextReady}
          onClick={onNext}
          className={STEP_PRIMARY}
        >
          {nextLabel}
        </button>
      ) : null}
    </div>
  );
}

function samplePdf(docName: string) {
  const lower = docName.toLowerCase();
  if (lower.includes("hot") || lower.includes("fire")) return publicUrl("/docs/doc-fire.pdf");
  if (lower.includes("method")) return publicUrl("/docs/doc-method.pdf");
  if (lower.includes("design")) return publicUrl("/docs/doc-design.pdf");
  return publicUrl("/docs/sample.pdf");
}

function uniqueDocuments(docs: V26ChecklistDoc[]) {
  const groups = new Map<string, V26ChecklistDoc[]>();
  for (const row of docs) {
    const list = groups.get(row.doc.name) ?? [];
    list.push(row);
    groups.set(row.doc.name, list);
  }
  return [...groups.entries()].map(([name, rows]) => {
    const meta = v28DocumentRowMeta(rows[0]);
    return {
      name,
      rows,
      required: rows.some((row) => row.need === "Required"),
      need: rows[0].need,
      who: rows[0].who,
      preview: meta.description,
      note: rows[0].who,
      formats: meta.formats,
    };
  });
}

function fileFor(
  rows: V26ChecklistDoc[],
  attachments: Record<string, V28Attachment>,
) {
  const files = rows
    .map((row) => attachments[docAttachKey(row.permitName, row.doc.name)])
    .filter((file): file is V28Attachment => Boolean(file));
  return files.find((file) => file.issue) ?? files[0];
}

function UniqueUploadCard({
  name,
  preview,
  note,
  required = true,
  formats,
  file,
  canAttach,
  viewOnly,
  defaultOpen,
  onAttach,
  onRemove,
  onSample,
}: {
  name: string;
  preview: string;
  note?: string;
  required?: boolean;
  formats: string;
  file?: V28Attachment;
  canAttach: boolean;
  viewOnly?: boolean;
  defaultOpen?: boolean;
  onAttach: (fileName: string) => void;
  onRemove: () => void;
  onSample: () => void;
}) {
  const [open, setOpen] = useState(Boolean(defaultOpen));
  const [skipped, setSkipped] = useState(false);
  useEffect(() => {
    if (defaultOpen) setOpen(true);
  }, [defaultOpen]);
  const aside = note && note !== preview ? note : null;
  const flagged = Boolean(file?.issue);
  useEffect(() => {
    if (flagged) setOpen(true);
  }, [flagged]);
  return (
    <article
      className={cn(
        "min-w-0 overflow-hidden rounded-[var(--radius-xl)] border",
        flagged
          ? "border-error-200 bg-white"
          : "border-grey-100 bg-grey-25",
      )}
    >
      <div className="px-4 py-4">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="flex w-full min-w-0 flex-col gap-1 text-left"
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="min-w-0 flex-1 truncate text-base leading-5 font-bold text-black">
              {name}
            </span>
            <UploadStatusChip uploaded={Boolean(file)} flagged={flagged} />
            <ChevronDown
              aria-hidden
              size={16}
              className={cn("shrink-0 text-grey-600 transition-transform", open && "rotate-180")}
            />
          </span>
          {flagged ? (
            <span className="text-sm leading-[18px] font-bold text-error-600">
              {file?.issue}
            </span>
          ) : (
            <span className="text-sm leading-[18px] text-grey-600">{preview}</span>
          )}
          {!flagged && aside ? (
            <span className="text-sm leading-[18px] text-grey-600">{aside}</span>
          ) : null}
        </button>
        <span className="mt-2 flex items-center justify-between gap-3">
          <span className="text-xs leading-4 text-grey-600">
            {required ? "Required" : "If it applies"} · {formats}
          </span>
          <button
            type="button"
            onClick={onSample}
            className="inline-flex shrink-0 items-center gap-1.5 text-sm leading-[18px] font-bold text-purple-600 hover:text-purple-700"
          >
            <FileText aria-hidden size={16} />
            Samples
          </button>
        </span>
      </div>
      {open ? (
        <div className="flex min-w-0 flex-col gap-4 border-t border-grey-100 px-4 py-4">
          {canAttach && !skipped ? (
            <label className="flex cursor-pointer flex-col items-center gap-1 rounded-[var(--radius-md)] border border-dashed border-grey-200 bg-white px-4 py-6 text-center">
              <input
                type="file"
                className="sr-only"
                aria-label={`Upload ${name}`}
                onChange={(event) => {
                  const next = event.target.files?.[0];
                  if (next) onAttach(next.name);
                  event.target.value = "";
                }}
              />
              <Upload aria-hidden size={20} className="text-grey-600" />
              <span className="text-sm leading-[18px] text-grey-700">
                <span className="font-bold text-purple-600">Click to Upload</span> or drag and drop
              </span>
              <span className="text-xs leading-4 text-grey-700">Size limit 25 MB</span>
              <span className="text-xs leading-4 text-grey-700">{formats}</span>
            </label>
          ) : null}
          {!canAttach && !file ? (
            <p className="text-sm leading-[18px] text-grey-600">Your contractor uploads these files.</p>
          ) : null}
          {file ? (
            <div
              className={cn(
                "flex items-start gap-3 rounded-[var(--radius-md)] border px-3 py-3",
                flagged
                  ? "border-error-200 bg-error-100"
                  : "border-grey-100 bg-white",
              )}
            >
              <img src={pdfIcon} alt="" width={20} height={20} className="mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm leading-[18px] text-grey-700">{file.fileName}</p>
                {flagged ? (
                  <p className="mt-1 text-sm leading-[18px] text-grey-700">
                    {viewOnly
                      ? "Your contractor replaces this file, then screens again."
                      : "Replace this file, then screen again."}
                  </p>
                ) : (
                  <p className="inline-flex items-center gap-1 text-sm leading-[18px] text-success-600">
                    <CircleCheck aria-hidden size={16} strokeWidth={1.5} />
                    Upload Complete
                  </p>
                )}
              </div>
              {canAttach ? (
                <button
                  type="button"
                  aria-label={`Remove ${file.fileName}`}
                  onClick={onRemove}
                  className="grid size-8 shrink-0 place-items-center text-grey-600 hover:text-black"
                >
                  <Trash2 aria-hidden size={16} />
                </button>
              ) : null}
            </div>
          ) : null}
          {canAttach ? (
            <label className="flex cursor-pointer items-center gap-2 text-base leading-5 text-black">
              <input
                type="checkbox"
                checked={skipped}
                onChange={(event) => setSkipped(event.target.checked)}
                className="size-4 shrink-0 rounded-[var(--radius-sm)] border-grey-300 accent-purple-600"
              />
              Skip for now
            </label>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function FlaggedPackSection({
  count,
  viewOnly,
  children,
}: {
  count: number;
  viewOnly?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      aria-label="Flagged files"
      className="flex flex-col gap-3 rounded-[var(--radius-xl)] bg-error-100 p-4 tablet:p-5"
    >
      <div className="flex items-start gap-2">
        <CircleAlert
          aria-hidden
          className="mt-0.5 size-5 shrink-0 text-error-600"
          strokeWidth={2}
        />
        <div className="min-w-0">
          <h3 className="text-base leading-5 font-bold text-error-600">
            Flagged · {count} {count === 1 ? "file" : "files"} to replace
          </h3>
          <p className="mt-1 text-sm leading-[18px] text-error-600">
            {viewOnly
              ? "Your contractor replaces the flagged files below, then screens again."
              : "Replace the flagged files below, then screen again."}
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

function UploadStatusChip({
  uploaded,
  flagged,
}: {
  uploaded: boolean;
  flagged?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-[22px] shrink-0 items-center rounded-full px-2 text-[11px] leading-[14px] font-bold",
        flagged
          ? "bg-error-200 text-error-600"
          : uploaded
            ? "bg-success-200 text-success-600"
            : "bg-error-200 text-error-600",
      )}
    >
      {flagged ? "Flagged" : uploaded ? "Uploaded" : "Not uploaded yet"}
    </span>
  );
}

function PermitSampleModal({
  name,
  onClose,
}: {
  name: string;
  onClose: () => void;
}) {
  const titleId = useId();
  const pathname = useLocation().pathname;
  const v34 = isV34Path(pathname);
  const v35 = usesV35Flow(pathname);
  const frame = usePhoneSheetFrame();
  const [kind, setKind] = useState<"good" | "bad">("good");
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end tablet:items-center tablet:justify-center tablet:p-8"
      style={phoneOverlayStyle(v35 ? frame : null)}
    >
      <button
        type="button"
        aria-label="Close samples"
        className="absolute inset-0 bg-[rgba(18,18,18,0.4)]"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={phonePanelStyle(v35 ? frame : null, true)}
        className={cn(
          "relative flex w-full max-w-3xl flex-col bg-white shadow-[var(--shadow-light-bg)]",
          v35
            ? "h-[calc(100svh-3.5rem)] max-h-[calc(100svh-3.5rem)] min-h-0 overflow-hidden rounded-t-[var(--radius-2xl)] pb-[env(safe-area-inset-bottom)] tablet:h-[80vh] tablet:max-h-[80vh] tablet:rounded-[var(--radius-2xl)] tablet:pb-0"
            : "h-[90vh] rounded-t-[var(--radius-2xl)] tablet:h-[80vh] tablet:rounded-[var(--radius-2xl)]",
        )}
      >
        {v34 ? (
          <SampleModalHeader
            titleId={titleId}
            title={`${name} — Samples`}
            kind={kind}
            onKind={setKind}
            onClose={onClose}
          />
        ) : (
        <header className="flex flex-col gap-3 border-b border-grey-75 px-4 py-3 tablet:flex-row tablet:items-center tablet:justify-between tablet:px-5">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <h2 id={titleId} className="min-w-0 truncate text-base leading-5 font-bold text-black">
              {name} — Samples
            </h2>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-sm)] text-black hover:bg-grey-50 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
            >
              <img src={closeIcon} alt="" width={20} height={20} />
            </button>
          </div>
          <div className="flex self-start rounded-full bg-grey-50 p-1 tablet:self-auto">
            {(["good", "bad"] as const).map((row) => (
              <button
                key={row}
                type="button"
                onClick={() => setKind(row)}
                className={cn(
                  "h-8 rounded-full px-3 text-sm leading-[18px]",
                  kind === row
                    ? "bg-white font-bold text-purple-600 shadow-[var(--shadow-light-bg)]"
                    : "text-grey-500",
                )}
              >
                {row === "good" ? "Good" : "Bad"}
              </button>
            ))}
          </div>
        </header>
        )}
        <p className="border-b border-grey-75 px-4 py-2 text-xs leading-4 text-grey-500 tablet:px-5">
          {kind === "good"
            ? "Complete example for this document type."
            : "Common gaps reviewers send back — missing stamps, dates, or pages."}
        </p>
        <iframe
          title={`${name} sample`}
          src={`${samplePdf(name)}#view=FitH`}
          className="min-h-0 flex-1 bg-grey-50"
        />
      </aside>
    </div>,
    document.body,
  );
}


/** Receipt-style numbered list — every row visible, no inner scroll (screenshot pack). */
function ScopeResultNamedList({
  icon: Icon,
  title,
  lead,
  items,
  action,
}: {
  icon: typeof FileText;
  title: string;
  lead: string;
  items: string[];
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="min-w-0 rounded-[var(--radius-lg)] border border-grey-100 bg-grey-25">
      <div className="flex items-start gap-3 px-3.5 py-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white text-grey-600 shadow-[inset_0_0_0_1px_var(--color-grey-100)]">
          <Icon className="size-3.5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-[18px] font-bold text-black">{title}</p>
          <p className="mt-0.5 text-xs leading-4 text-grey-500">{lead}</p>
        </div>
      </div>
      <ol className="border-t border-grey-100 bg-white">
        {items.map((name, i) => (
          <li
            key={name}
            className="flex items-start gap-2 border-t border-grey-100 px-3.5 py-2 text-sm leading-[18px] first:border-t-0"
          >
            <span className="w-5 shrink-0 tabular-nums text-grey-400">
              {i + 1}.
            </span>
            <span className="min-w-0 text-grey-800">{name}</span>
          </li>
        ))}
      </ol>
      {action ? (
        <div className="border-t border-grey-100 bg-white px-3.5 py-2.5">
          <button
            type="button"
            onClick={action.onClick}
            className="text-sm leading-[18px] font-bold text-purple-600 hover:text-purple-700 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
          >
            {action.label}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function OverviewSteps({
  steps,
  onOpenGuide,
  renderStep,
  answers,
}: {
  steps: { title: string; detail?: string; current?: boolean }[];
  onOpenGuide?: () => void;
  renderStep?: (index: number) => ReactNode;
  answers?: { label: string; onClick: () => void; edit?: boolean };
}) {
  const [open, setOpen] = useState<number[]>([]);
  const signature = steps.map((step) => step.title).join("|");
  useEffect(() => {
    setOpen([]);
  }, [signature]);
  const toggle = (index: number) => {
    setOpen((current) =>
      current.includes(index)
        ? current.filter((item) => item !== index)
        : [...current, index],
    );
  };
  return (
    <div className="px-5 py-4 tablet:px-8">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs leading-4 font-bold uppercase tracking-[0.08em] text-grey-500">
          Project Steps
        </p>
        {answers ? (
          <ActionButton
            variant="tertiary"
            size="sm"
            className="w-fit shrink-0"
            iconEnd={answers.edit ? <ActionButtonIcon src={editIcon} /> : undefined}
            onClick={answers.onClick}
          >
            {answers.label}
          </ActionButton>
        ) : renderStep || !onOpenGuide ? null : (
          <button
            type="button"
            onClick={onOpenGuide}
            className="text-sm leading-[18px] font-bold text-purple-600 hover:text-purple-700 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
          >
            See these steps in full
          </button>
        )}
      </div>
      <ol className="mt-3 flex flex-col gap-3">
        {steps.map((step, i) => (
          <li
            key={`${i}-${step.title}`}
            className="overflow-hidden rounded-[var(--radius-lg)] border border-grey-200"
          >
            {renderStep ? (
              <>
              <button
                type="button"
                onClick={() => toggle(i)}
                aria-expanded={open.includes(i)}
                className="group flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-grey-25 focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--color-purple-600)]"
              >
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-grey-50 text-xs leading-4 font-bold text-grey-500 tabular-nums">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm leading-[18px] font-bold text-black">
                    {step.title}
                  </span>
                  {step.detail ? (
                    <span className="mt-0.5 block text-sm leading-[18px] font-normal text-grey-600">
                      {step.detail}
                    </span>
                  ) : null}
                </span>
                <span
                  aria-hidden
                  className="grid size-8 shrink-0 place-items-center rounded-[var(--radius-md)] border border-grey-200 bg-white group-hover:bg-grey-50"
                >
                  <span
                    className="block size-4 bg-grey-600 transition-transform"
                    style={{
                      WebkitMaskImage: `url("${caretDown}")`,
                      maskImage: `url("${caretDown}")`,
                      WebkitMaskSize: "12px 8px",
                      maskSize: "12px 8px",
                      WebkitMaskRepeat: "no-repeat",
                      maskRepeat: "no-repeat",
                      WebkitMaskPosition: "center",
                      transform: open.includes(i) ? "rotate(180deg)" : undefined,
                    }}
                  />
                </span>
                <span className="sr-only">{open.includes(i) ? "Hide this step" : "Show this step"}</span>
              </button>
              {open.includes(i) ? (
                <div>{renderStep(i)}</div>
              ) : null}
              </>
            ) : (
              <div className="flex items-start gap-3 px-3 py-3">
                <span className="-mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-grey-50 text-xs leading-4 font-bold text-grey-500 tabular-nums">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-[18px] font-bold text-black">{step.title}</p>
                  {step.detail ? (
                    <p className="mt-0.5 text-sm leading-[18px] text-grey-600">{step.detail}</p>
                  ) : null}
                </div>
              </div>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

function V37ClipPanel({
  children,
  cap,
  reserve = 0,
  innerRef,
  open: openProp,
  onOpenChange,
}: {
  children: ReactNode;
  /** Matched collapsed height. `undefined` uses leftover viewport. */
  cap?: number | null;
  /** Height kept free below the panel when `cap` is `undefined`. */
  reserve?: number;
  innerRef?: { current: HTMLDivElement | null };
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [localOpen, setLocalOpen] = useState(false);
  const open = openProp ?? localOpen;
  const setOpen = (next: boolean) => {
    onOpenChange?.(next);
    if (openProp === undefined) setLocalOpen(next);
  };
  const [clip, setClip] = useState<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const localInner = useRef<HTMLDivElement>(null);

  const setInner = (node: HTMLDivElement | null) => {
    localInner.current = node;
    if (innerRef) innerRef.current = node;
  };

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const inner = localInner.current;
    const main = wrap?.closest("main");
    if (!wrap || !inner || !main) return;

    const measure = () => {
      if (open || window.matchMedia("print").matches) {
        setClip(null);
        return;
      }
      if (cap === null) {
        setClip(null);
        return;
      }
      let next = cap;
      if (next == null) {
        const mainBox = main.getBoundingClientRect();
        const wrapBox = wrap.getBoundingClientRect();
        const bar = document.querySelector<HTMLElement>("[data-print-hide].fixed.bottom-0");
        const barH = bar?.getBoundingClientRect().height ?? 96;
        const room = Math.floor(mainBox.height - (wrapBox.top - mainBox.top) - barH - reserve);
        next = Math.max(200, room);
      }
      setClip(inner.scrollHeight > next + 12 ? next : null);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(main);
    ro.observe(inner);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [open, children, cap, reserve]);

  const clipped = clip != null && !open;

  return (
    <div
      ref={wrapRef}
      className="relative overflow-hidden rounded-[var(--radius-xl)] border border-grey-100 print:break-inside-avoid"
    >
      <div
        ref={setInner}
        className={cn(clipped && "overflow-hidden print:overflow-visible")}
        style={clipped ? { maxHeight: clip } : undefined}
      >
        {children}
      </div>
      {clipped || open ? (
        <div
          className={cn(
            "flex justify-center print:hidden",
            clipped
              ? "pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-white from-25% to-transparent pt-12 pb-3"
              : "py-3",
          )}
        >
          <ActionButton
            variant="tertiary"
            size="sm"
            className="pointer-events-auto"
            iconEnd={
              <ChevronDown
                className={cn("size-4", open && "rotate-180")}
                aria-hidden
              />
            }
            onClick={() => setOpen(!open)}
          >
            {open ? "Show less" : "Expand"}
          </ActionButton>
        </div>
      ) : null}
    </div>
  );
}

function checksCollapsedHeight(inner: HTMLElement) {
  const header = inner.firstElementChild as HTMLElement | null;
  const first = inner.querySelector("ol")?.firstElementChild as HTMLElement | undefined;
  const natural = inner.scrollHeight;
  if (!header) return natural;
  const peek = header.offsetHeight + (first?.offsetHeight ?? 0) + 100;
  return Math.ceil(Math.min(natural, peek));
}

function V37PackFold({
  pack,
  checks,
  packOpen,
  onPackOpen,
}: {
  pack: ReactNode;
  checks: ReactNode | null;
  packOpen?: boolean;
  onPackOpen?: (open: boolean) => void;
}) {
  const checksInner = useRef<HTMLDivElement>(null);
  const [matchH, setMatchH] = useState<number | null>(null);
  const [wide, setWide] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(min-width: 1280px)").matches,
  );

  useEffect(() => {
    const query = window.matchMedia("(min-width: 1280px)");
    const sync = () => setWide(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useLayoutEffect(() => {
    const inner = checksInner.current;
    if (!inner || !checks) {
      setMatchH(null);
      return;
    }
    const measure = () => {
      if (window.matchMedia("print").matches) {
        setMatchH(null);
        return;
      }
      const peek = checksCollapsedHeight(inner);
      setMatchH(peek > 0 ? peek : null);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(inner);
    const header = inner.firstElementChild;
    if (header) ro.observe(header);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [checks]);

  if (!pack) return checks ? <V37ClipPanel innerRef={checksInner}>{checks}</V37ClipPanel> : null;
  return (
    <div className="flex flex-col gap-6">
      <V37ClipPanel
        cap={wide || !checks ? undefined : matchH}
        reserve={wide && checks && matchH ? matchH + 40 : 0}
        open={packOpen}
        onOpenChange={onPackOpen}
      >
        {pack}
      </V37ClipPanel>
      {checks ? (
        <V37ClipPanel innerRef={checksInner} cap={matchH}>
          {checks}
        </V37ClipPanel>
      ) : null}
    </div>
  );
}

function v37NeedRows(
  needs: { name: string; permits: string[]; kind: "all" | "each" | "one" }[],
  fallback: string[],
) {
  if (needs.length === 0) {
    return fallback.map((name) => ({
      key: name,
      name,
      lead: null as string | null,
      chip: null as string | null,
    }));
  }
  return needs.map((need) => ({
    key: `${need.kind}-${need.name}`,
    name: need.name,
    lead:
      need.kind === "all" && need.permits.length > 1
        ? `Used by ${
            need.permits.length === 2
              ? need.permits.join(" and ")
              : `${need.permits.slice(0, -1).join(", ")} and ${need.permits[need.permits.length - 1]}`
          }`
        : need.kind === "one"
          ? need.permits[0] ?? null
          : null,
    chip:
      need.kind === "all"
        ? "One for All Permits"
        : need.kind === "each"
          ? "One per Permit"
          : null,
  }));
}

/** Same index mark as Tenancy Journey Steps and Permits (`AheadRow`). */
function V37StepNo({ n }: { n: number }) {
  return (
    <span className="w-5 shrink-0 text-right text-sm leading-[18px] tabular-nums text-grey-500">
      {n}.
    </span>
  );
}

function V37NeedRow({
  index,
  name,
  lead,
  chip,
  screen = null,
}: {
  index: number;
  name: string;
  lead: string | null;
  chip: string | null;
  screen?: { requirements: string[]; formats: string } | null;
}) {
  const [open, setOpen] = useState(false);
  const hasRules = (screen?.requirements.length ?? 0) > 0;
  return (
    <li className="flex items-start gap-3 border-t border-grey-100 px-4 py-3">
      <V37StepNo n={index + 1} />
      <span className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="flex flex-col gap-1.5">
          <span className="flex flex-col items-start gap-1.5 tablet:flex-row tablet:flex-wrap tablet:items-center tablet:gap-2">
            <span className="block text-sm leading-[18px] font-bold text-black">{name}</span>
            {chip ? (
              <span className="flex h-[22px] w-fit shrink-0 items-center rounded-full bg-blue-200 px-2 text-xs leading-4 font-bold text-blue-700">
                {chip}
              </span>
            ) : null}
          </span>
          {lead ? (
            <span className="block text-xs leading-4 text-grey-700">{lead}</span>
          ) : null}
        </span>
        {hasRules ? (
          <>
            <button
              type="button"
              aria-expanded={open}
              onClick={() => setOpen((value) => !value)}
              className="flex w-fit items-center gap-1 text-sm leading-[18px] font-bold text-purple-600 hover:text-purple-700 hover:underline focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)] print:hidden"
            >
              {open ? "Hide Requirements" : "Show Requirements"}
              <ChevronDown
                className={cn("size-4 shrink-0", open && "rotate-180")}
                aria-hidden
              />
            </button>
            <span className={cn("flex-col gap-2", open ? "flex" : "hidden print:flex")}>
              <span className="flex flex-col gap-1.5">
                {screen!.requirements.map((line) => (
                  <span key={line} className="flex gap-2 text-xs leading-4 text-grey-700">
                    <span aria-hidden className="text-grey-400">·</span>
                    <span>{line}</span>
                  </span>
                ))}
              </span>
              <span className="block text-xs leading-4 text-grey-500">
                Formats: {screen!.formats}
              </span>
            </span>
          </>
        ) : null}
      </span>
    </li>
  );
}

function V37PackHead({
  icon,
  title,
  lead,
  tone = "purple",
  action,
}: {
  icon: string;
  title: ReactNode;
  lead?: ReactNode;
  tone?: "purple" | "grey" | "white";
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 px-4 py-4">
      <span
        className={cn(
          "grid size-8 shrink-0 place-items-center overflow-hidden rounded-full",
          tone === "purple" && "bg-purple-100",
          tone === "grey" && "bg-grey-100",
          tone === "white" && "bg-white",
        )}
      >
        <img src={icon} alt="" className="size-4 object-contain" />
      </span>
      <div className="min-w-0 flex-1 pt-1">
        <p className="text-base leading-5 font-bold text-black">{title}</p>
        {lead ? (
          <p className="mt-1 text-sm leading-[18px] text-grey-700">{lead}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0 print:hidden">{action}</div> : null}
    </div>
  );
}

function V37NonePack({
  past,
  canWrite,
  role,
  hasGuide,
}: {
  past?: boolean;
  canWrite: boolean;
  role: Role;
  hasGuide: boolean;
}) {
  const officer = role === "officer";
  const guideRow = past
    ? {
        name: "CAG checks still applied",
        lead: "These took place on site, even without a permit",
      }
    : {
        name: "Complete the CAG checks below",
        lead: "These still apply on site, even without a permit",
      };
  const rows = past
    ? [
        {
          name: "Works completed without a permit",
          lead: "No screening was required for these works",
        },
        ...(hasGuide ? [guideRow] : []),
      ]
    : officer
      ? [
          {
            name: "Confirm the works dates",
            lead: "Agree with the contractor when works start and finish on site",
          },
          ...(hasGuide ? [guideRow] : []),
          {
            name: "Review any scope changes",
            lead: "The contractor edits scope if the works change, so the system can check for permits",
          },
        ]
      : [
          {
            name: "Share your works dates",
            lead: "Tell your Project Officer when works start and finish",
          },
          ...(hasGuide ? [guideRow] : []),
          {
            name: "Flag changes early",
            lead: canWrite
              ? "Edit scope if the works change, so we can check whether a permit is now required"
              : "Tell your Project Officer and contractor if the works change",
          },
        ];
  return (
    <>
      <V37PackHead
        icon={documentsOutlineIcon}
        title="What to Do Next"
        lead={
          past
            ? officer
              ? "The contractor kept you informed while works were in progress"
              : "Your Project Officer was kept informed while works were in progress"
            : officer
              ? "The contractor keeps you informed while works are in progress"
              : "Keep your Project Officer informed while works are in progress"
        }
      />
      <div className="px-4 pb-4">
        <div className="overflow-hidden rounded-[var(--radius-md)] border border-grey-100">
          <ol className="[&>li:first-child]:border-t-0">
            {rows.map((row, index) => (
              <V37NeedRow
                key={row.name}
                index={index}
                name={row.name}
                lead={row.lead}
                chip={null}
              />
            ))}
          </ol>
        </div>
      </div>
    </>
  );
}

function v37AnswersCopy({
  role,
  canWrite,
  hasPermit,
  past,
}: {
  role: Role;
  canWrite: boolean;
  hasPermit: boolean;
  past?: boolean;
}) {
  const title = canWrite ? "Your answers" : "Contractor answers";
  if (past) {
    if (hasPermit) {
      return {
        title,
        lead: canWrite
          ? "The permits and steps below came from these answers"
          : role === "tenant"
            ? "Your contractor confirmed these. They produced the permits and steps below"
            : "The contractor confirmed these. They produced the permits and steps below",
      };
    }
    return {
      title,
      lead: canWrite
        ? "The answers confirmed for this project"
        : role === "tenant"
          ? "Your contractor confirmed these for this project"
          : "The contractor confirmed these for this project",
    };
  }
  const who = canWrite
    ? "Change these if the works have changed"
    : role === "tenant"
      ? "Your contractor filled these in"
      : "The contractor filled these in";
  if (!hasPermit) {
    return {
      title,
      lead: `${who}. These works are not screened or submitted in OneCalendar`,
    };
  }
  const fromAnswers = canWrite
    ? "The permits and steps below come from these answers"
    : role === "tenant"
      ? "Your contractor filled these in. They produced the permits and steps below"
      : "The contractor filled these in. They produced the permits and steps below";
  return { title, lead: fromAnswers };
}

/** Page shell inside a project. Matches TenantPOC: white, 8px corner, Grey/100 line, no shadow. */
function v37PageCard(v37: boolean) {
  return v37
    ? "overflow-hidden rounded-[var(--radius-md)] border border-grey-100 bg-white"
    : "overflow-hidden rounded-[var(--radius-2xl)] bg-white shadow-[var(--shadow-light-bg)]";
}

function V37QuizReview({
  quiz,
  lead,
  onBack,
}: {
  quiz: QuizState;
  lead: string;
  onBack: () => void;
}) {
  return (
    <article className={v37PageCard(true)}>
      <header className="flex flex-col gap-4 border-b border-grey-100 px-5 py-5 tablet:px-8 tablet:py-6">
        <button type="button" onClick={onBack} className={BACK}>
          <BackArrow />
          Back to Overview
        </button>
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-purple-100 text-purple-600">
            <ClipboardList className="size-6" aria-hidden />
          </span>
          <div className="min-w-0">
            <h3 className="text-lg leading-[22px] font-bold text-black">Scope of Works</h3>
            <p className="mt-1 text-sm leading-5 text-grey-600">{lead}</p>
          </div>
        </div>
      </header>
      <div className="px-5 py-5 tablet:px-8 tablet:py-6">
        <QuizChecklistV28
          state={quiz}
          disabled
          locked
          note={undefined}
          intro={null}
          friendly
          plain
          dense
          onChange={() => undefined}
        />
      </div>
    </article>
  );
}

/** Shows once the page is scrolled; sits above the sticky step bar when there is one. */
function V37BackToTop() {
  const [pos, setPos] = useState<{ right: number; bottom: number } | null>(null);

  useEffect(() => {
    const main = document.querySelector("main");
    if (!(main instanceof HTMLElement)) return;
    const sync = () => {
      if (main.scrollTop < 480) {
        setPos(null);
        return;
      }
      const box = main.getBoundingClientRect();
      const bar = document.querySelector<HTMLElement>("[data-print-hide].fixed.bottom-0");
      const inset = box.width >= 768 ? 32 : 16;
      setPos({
        right: window.innerWidth - box.right + inset,
        bottom: (bar?.getBoundingClientRect().height ?? 0) + 16,
      });
    };
    sync();
    main.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      main.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, []);

  if (!pos) return null;
  return createPortal(
    <div className="fixed z-30 print:hidden" style={pos}>
      <Button
        type="Secondary (Mono)"
        size="lg"
        aria-label="Back to top"
        onClick={() => document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" })}
      >
        <span
          aria-hidden
          className="block size-6 bg-grey-700"
          style={{
            WebkitMaskImage: `url("${arrowTopIcon}")`,
            maskImage: `url("${arrowTopIcon}")`,
            WebkitMaskSize: "contain",
            maskSize: "contain",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
          }}
        />
      </Button>
    </div>,
    document.body,
  );
}

function V37ScopeReady({
  hasPermit,
  permits,
  docSummary,
  documents,
  guideSteps,
  hasGuide,
  canWrite,
  role,
  onScreen,
  onGuide,
}: {
  hasPermit: boolean;
  permits: string[];
  docSummary: V35DocSummary | null;
  documents: string[];
  guideSteps: string[];
  hasGuide: boolean;
  canWrite: boolean;
  role: Role;
  onScreen: () => void;
  onGuide: () => void;
}) {
  const needs: { name: string; permits: string[]; kind: "all" | "each" | "one" }[] =
    docSummary && docSummary.fileCount > 0
      ? [
          ...docSummary.once.map((need) => ({ ...need, kind: "all" as const })),
          ...docSummary.each.map((need) => ({ ...need, kind: "each" as const })),
          ...docSummary.other.map((need) => ({ ...need, kind: "one" as const })),
        ]
      : [];
  const docRows = v37NeedRows(needs, documents);

  const outcomeHead = (
    <header className="flex flex-col gap-3 px-5 py-5 tablet:flex-row tablet:flex-wrap tablet:items-center tablet:gap-x-3 tablet:gap-y-2 tablet:px-8 tablet:py-6">
      <span
        className={cn(
          "inline-flex h-[30px] w-fit shrink-0 items-center rounded-full px-3 text-sm leading-[18px] font-bold",
          hasPermit
            ? "bg-purple-200 text-purple-700"
            : "bg-grey-100 text-grey-700",
        )}
      >
        {hasPermit ? "Permit Required" : V37_STATUS.noPermit}
      </span>
      <h2 className="min-w-0 text-xl leading-[26px] font-bold text-black tablet:min-w-[12rem] tablet:flex-1">
        {hasPermit
          ? `This Project Needs ${
              permits.length === 0
                ? "a Permit"
                : permits.length === 1
                  ? "1 Permit"
                  : `${permits.length} Permits`
            }${
              hasGuide && guideSteps.length > 0
                ? ` and ${guideSteps.length} ${guideSteps.length === 1 ? "Check" : "Checks"}`
                : ""
            }`
          : hasGuide && guideSteps.length > 0
            ? "Proceed Once the CAG Checks Are Complete"
            : "You May Proceed with These Works."}
      </h2>
    </header>
  );

  return (
    <section className="flex min-w-0 flex-col gap-6 pb-8">
      <V37BackToTop />
      <article className={v37PageCard(true)}>
        {outcomeHead}
        <div className="flex flex-col gap-6 px-5 pb-5 tablet:px-8 tablet:pb-6">
          {hasPermit ? (
            <div className="hidden print:flex items-start gap-3 rounded-[var(--radius-md)] border border-purple-200 bg-purple-100 px-3 py-3">
              <Info className="mt-0.5 size-5 shrink-0 text-purple-600" aria-hidden />
              <p className="min-w-0 text-sm leading-[18px] text-grey-700">
                This is a preliminary screening only and{" "}
                <span className="font-bold">not submission</span>. Your application is still subject to approval in OneCalendar.
              </p>
            </div>
          ) : null}
          <V37PackFold
              pack={
                hasPermit && (permits.length > 0 || docRows.length > 0) ? (
                      <>
                        <V37PackHead
                          icon={documentsOutlineIcon}
                          title="Permits and Documents"
                          lead="Submit these in OneCalendar when you apply. Screening only checks the files."
                        />
                        <div className="flex flex-col gap-4 px-4 pb-4">
                        {permits.length > 0 ? (
                          <div className="overflow-hidden rounded-[var(--radius-md)] border border-grey-100 bg-grey-25">
                            <V37PackHead
                              icon={permitFileIcon}
                              tone="white"
                              title={
                                <>
                                  Permits to Apply
                                  <span className="ml-1.5 font-normal text-grey-700">
                                    · {permits.length}
                                  </span>
                                </>
                              }
                              lead="Screen your documents, then submit in OneCalendar"
                            />
                            <ol>
                              {permits.map((permit, index) => (
                                <li
                                  key={permit}
                                  className="flex items-start gap-3 border-t border-grey-100 px-4 py-2.5"
                                >
                                  <V37StepNo n={index + 1} />
                                  <span className="min-w-0 text-sm leading-[18px] text-black">
                                    {permit}
                                  </span>
                                </li>
                              ))}
                            </ol>
                          </div>
                        ) : null}
                        {docRows.length > 0 ? (
                          <div className="overflow-hidden rounded-[var(--radius-md)] border border-grey-100 bg-grey-25">
                            <V37PackHead
                              icon={documentsOutlineIcon}
                              tone="white"
                              title={
                                <>
                                  Documents to Prepare
                                  <span className="ml-1.5 font-normal text-grey-700">
                                    · {docRows.length}
                                  </span>
                                </>
                              }
                              lead={
                                permits.length > 0
                                  ? needs.some((need) => need.kind === "all")
                                    ? "For the permits above. One copy covers shared documents"
                                    : "Prepare these for the permits you’ll apply for"
                                  : needs.some((need) => need.kind === "all")
                                    ? "One copy covers every permit that shares it"
                                    : "Prepare these, then screen them before OneCalendar"
                              }
                            />
                            <ol>
                              {docRows.map((row, index) => (
                                <V37NeedRow
                                  key={row.key}
                                  index={index}
                                  name={row.name}
                                  lead={row.lead}
                                  chip={row.chip}
                                  screen={v37DocumentScreen(row.name)}
                                />
                              ))}
                            </ol>
                          </div>
                        ) : null}
                        </div>
                      </>
                ) : (
                  <V37NonePack
                    canWrite={canWrite}
                    role={role}
                    hasGuide={hasGuide && guideSteps.length > 0}
                  />
                )
              }
              checks={
                hasGuide && guideSteps.length > 0 ? (
                  <>
                    <V37PackHead
                      icon={checkCircleIcon}
                      title="Checks"
                      lead={
                        hasPermit
                          ? "You still need to do these. Screening does not cover them."
                          : "You still need to do these at CAG, even without a permit."
                      }
                    />
                    <ol>
                      {guideSteps.map((title, index) => (
                        <li
                          key={`${index}-${title}`}
                          className="flex items-start gap-3 border-t border-grey-100 px-4 py-2.5"
                        >
                          <V37StepNo n={index + 1} />
                          <span className="min-w-0 text-sm leading-[18px] text-black">{title}</span>
                        </li>
                      ))}
                    </ol>
                    <div className="border-t border-grey-100 px-4 py-3 print:hidden">
                      <button
                        type="button"
                        onClick={onGuide}
                        className="inline-flex items-center gap-1 text-sm leading-[18px] font-bold text-purple-600 hover:text-purple-700"
                      >
                        View Full Guide
                        <ArrowRight size={16} aria-hidden />
                      </button>
                    </div>
                  </>
                ) : null
              }
            />
          {hasPermit ? (
            <StepForward
              fill={
                <div className="flex w-full flex-col gap-3 tablet:flex-row tablet:items-center tablet:justify-between tablet:gap-6">
                  <p className="flex min-w-0 items-center gap-2 text-sm leading-[18px] text-grey-700">
                    <DlsTooltipTip
                      label="About screening"
                      text="We check your documents before you apply. This doesn’t submit anything. You apply in OneCalendar, and approval happens there."
                    />
                    <span
                      className="min-w-0 truncate whitespace-nowrap"
                      title="We check your documents before you apply. This doesn’t submit anything. You apply in OneCalendar, and approval happens there."
                    >
                      This doesn’t submit.{" "}
                      <span className="font-bold">You apply in OneCalendar</span>
                    </span>
                  </p>
                  <button
                    type="button"
                    onClick={onScreen}
                    className="inline-flex h-11 w-full shrink-0 items-center justify-center gap-1.5 rounded-[var(--radius-md)] bg-purple-600 px-4 text-base leading-5 font-bold text-white hover:bg-purple-700 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)] tablet:w-auto"
                  >
                    {canWrite ? "Start Screening" : "View Screening"}
                    <ArrowRight className="size-4" aria-hidden />
                  </button>
                </div>
              }
            />
          ) : hasGuide ? (
            <StepForward
              fill={
                <div className="flex w-full flex-col gap-3 tablet:flex-row tablet:items-center tablet:justify-between tablet:gap-6">
                  <p className="min-w-0 text-sm leading-[18px] text-grey-700">
                    Complete the CAG checks for this project
                  </p>
                  <button
                    type="button"
                    onClick={onGuide}
                    className="inline-flex h-11 w-full shrink-0 items-center justify-center gap-1.5 rounded-[var(--radius-md)] bg-purple-600 px-4 text-base leading-5 font-bold text-white hover:bg-purple-700 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)] tablet:w-auto"
                  >
                    View Full Guide
                    <ArrowRight className="size-4" aria-hidden />
                  </button>
                </div>
              }
            />
          ) : null}
        </div>
      </article>
    </section>
  );
}

function V37PastReady({
  selected,
  unit,
  outcome,
  docs,
  canWrite,
  role,
  onGuide,
}: {
  selected: V26Work;
  unit: Unit;
  outcome: ReturnType<typeof v26DraftOutcome> | null;
  docs: V26ChecklistDoc[];
  canWrite: boolean;
  role: Role;
  onGuide?: () => void;
}) {
  const model = outcome ? v33PhaseModel(outcome) : null;
  const sittings = model?.sittings ?? [];
  const later = model?.later ?? [];
  const hasPermit = Boolean(model?.hasPermit);
  const permits = outcome?.permits ?? [];
  const docSummary = v35DocumentSummary(docs);
  const needs: { name: string; permits: string[]; kind: "all" | "each" | "one" }[] =
    docSummary.fileCount > 0
      ? [
          ...docSummary.once.map((need) => ({ ...need, kind: "all" as const })),
          ...docSummary.each.map((need) => ({ ...need, kind: "each" as const })),
          ...docSummary.other.map((need) => ({ ...need, kind: "one" as const })),
        ]
      : [];
  const docRows = v37NeedRows(
    needs,
    uniqueDocuments(docs).map((row) => row.name),
  );
  const guideSteps = [
    ...sittings.map((step) => v28PackCard(step).title),
    ...(hasPermit ? [V35_PERMIT_STEP_TITLE] : []),
    ...later.map((step) => v28PackCard(step).title),
  ];
  const [gotPack, setGotPack] = useState(false);
  const attachments = readV28Attachments(unit.id, selected.id);

  const takeZip = () => {
    const files = docs
      .map((row) => {
        const attached = attachments[docAttachKey(row.permitName, row.doc.name)];
        return attached
          ? { permit: row.permitName, fileName: attached.fileName }
          : null;
      })
      .filter(
        (row): row is { permit: string; fileName: string } => Boolean(row),
      );
    downloadV31PermitZip({
      unitNo: unit.unitNo,
      workTitle: v26WorkListTitle(selected),
      files,
    });
    setGotPack(true);
  };

  return (
    <section className="flex min-w-0 flex-col gap-6 pb-8">
      <article className={v37PageCard(true)}>
        <header className="flex flex-col gap-2 px-5 py-5 tablet:flex-row tablet:flex-wrap tablet:items-center tablet:px-8 tablet:py-6">
          <span
            className={cn(
              "inline-flex h-[30px] w-fit shrink-0 items-center rounded-full px-3 text-sm leading-[18px] font-bold",
              hasPermit
                ? "bg-success-200 text-success-600"
                : "bg-grey-100 text-grey-700",
            )}
          >
            {hasPermit ? V37_STATUS.downloaded : V37_STATUS.noPermit}
          </span>
          <h2 className="min-w-0 text-xl leading-[26px] font-bold text-black">
            {hasPermit
              ? `This Project Needs ${
                  permits.length === 0
                    ? "a Permit"
                    : permits.length === 1
                      ? "1 Permit"
                      : `${permits.length} Permits`
                }${
                  guideSteps.length > 0
                    ? ` and ${guideSteps.length} ${guideSteps.length === 1 ? "Check" : "Checks"}`
                    : ""
                }`
              : "What This Project Covered"}
          </h2>
        </header>
        <div className="flex flex-col gap-6 px-5 pb-5 tablet:px-8 tablet:pb-6">
          <V37PackFold
            pack={
              hasPermit && (permits.length > 0 || docRows.length > 0) ? (
                <>
                  <V37PackHead
                    icon={documentsOutlineIcon}
                    title="Permits and Documents"
                    lead="These still needed a OneCalendar submission. Screening only checked the files."
                  />
                  <div className="flex flex-col gap-4 px-4 pb-4">
                    {docRows.length > 0 ? (
                      <div className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-grey-100 bg-grey-25 px-4 py-3 print:hidden tablet:flex-row tablet:items-center tablet:justify-between tablet:gap-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-full bg-white">
                            <img src={downloadIcon} alt="" className="size-4 object-contain" />
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm leading-[18px] font-bold text-black">
                              {gotPack ? "Documents Downloaded" : "Get Every Document Submitted"}
                            </p>
                            <p className="mt-0.5 text-xs leading-4 text-grey-600">
                              {gotPack
                                ? "You can download them again anytime"
                                : `${docRows.length} ${docRows.length === 1 ? "document" : "documents"} in one zip, as sent to OneCalendar`}
                            </p>
                          </div>
                        </div>
                        <ActionButton
                          variant="secondary"
                          size="sm"
                          className="w-full shrink-0 tablet:w-fit"
                          onClick={takeZip}
                        >
                          Download Documents
                        </ActionButton>
                      </div>
                    ) : null}
                    {permits.length > 0 ? (
                      <div className="overflow-hidden rounded-[var(--radius-md)] border border-grey-100 bg-grey-25">
                        <V37PackHead
                          icon={permitFileIcon}
                          tone="white"
                          title={
                            <>
                              Permits Applied For
                              <span className="ml-1.5 font-normal text-grey-700">
                                · {permits.length}
                              </span>
                            </>
                          }
                          lead="Submitted through OneCalendar"
                        />
                        <ol>
                          {permits.map((permit, index) => (
                            <li
                              key={permit}
                              className="flex items-start gap-3 border-t border-grey-100 px-4 py-2.5"
                            >
                              <V37StepNo n={index + 1} />
                              <span className="min-w-0 text-sm leading-[18px] text-black">
                                {permit}
                              </span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    ) : null}
                    {docRows.length > 0 ? (
                      <div className="overflow-hidden rounded-[var(--radius-md)] border border-grey-100 bg-grey-25">
                        <V37PackHead
                          icon={documentsOutlineIcon}
                          tone="white"
                          title={
                            <>
                              Documents Submitted
                              <span className="ml-1.5 font-normal text-grey-700">
                                · {docRows.length}
                              </span>
                            </>
                          }
                          lead="Sent to OneCalendar with the permits above"
                        />
                        <ol>
                          {docRows.map((row, index) => (
                            <V37NeedRow
                              key={row.key}
                              index={index}
                              name={row.name}
                              lead={row.lead}
                              chip={row.chip}
                              screen={v37DocumentScreen(row.name)}
                            />
                          ))}
                        </ol>
                      </div>
                    ) : null}
                  </div>
                </>
              ) : (
                <V37NonePack
                  past
                  canWrite={canWrite}
                  role={role}
                  hasGuide={guideSteps.length > 0}
                />
              )
            }
            checks={
              guideSteps.length > 0 ? (
                <>
                  <V37PackHead
                    icon={checkCircleIcon}
                    title="Checks"
                    lead={
                      hasPermit
                        ? "You still needed to do these. Screening did not cover them."
                        : "You still needed to do these at CAG, even without a permit."
                    }
                  />
                  <ol>
                    {guideSteps.map((title, index) => (
                      <li
                        key={`${index}-${title}`}
                        className="flex items-start gap-3 border-t border-grey-100 px-4 py-2.5"
                      >
                        <V37StepNo n={index + 1} />
                        <span className="min-w-0 text-sm leading-[18px] text-black">
                          {title}
                        </span>
                      </li>
                    ))}
                  </ol>
                  {onGuide ? (
                    <div className="border-t border-grey-100 px-4 py-3 print:hidden">
                      <button
                        type="button"
                        onClick={onGuide}
                        className="inline-flex items-center gap-1 text-sm leading-[18px] font-bold text-purple-600 hover:text-purple-700"
                      >
                        View Full Guide
                        <ArrowRight size={16} aria-hidden />
                      </button>
                    </div>
                  ) : null}
                </>
              ) : null
            }
          />
        </div>
      </article>
    </section>
  );
}

function ScopeResultCard({
  workTitle,
  unitNo,
  sittings,
  later,
  hasPermit,
  permits,
  documents = [],
  docSummary = null,
  packSummary = false,
  canWrite,
  nextStep,
  nextLabel = "Next Step",
  steps = [],
  onUnlock,
  onNext,
  onViewSteps,
  renderStep,
  onCheckDocuments,
  answers,
}: {
  workTitle: string;
  unitNo: string;
  sittings: number;
  later: number;
  hasPermit: boolean;
  permits: string[];
  documents?: string[];
  docSummary?: V35DocSummary | null;
  packSummary?: boolean;
  canWrite: boolean;
  nextStep: { id: string; label: string } | null;
  nextLabel?: string;
  steps?: { title: string; detail?: string; current?: boolean }[];
  onUnlock: () => void;
  onNext: () => void;
  onViewSteps?: () => void;
  renderStep?: (index: number) => ReactNode;
  onCheckDocuments?: () => void;
  answers?: { label: string; onClick: () => void; edit?: boolean };
}) {
  const navigate = useNavigate();
  const hasWork = sittings > 0 || hasPermit || later > 0;
  const canEdit = canWrite && hasWork;
  const permitCount = hasPermit ? Math.max(permits.length, 1) : 0;
  const permitPhrase =
    permitCount === 1 ? "1 permit" : `${permitCount} permits`;
  const v35Summary = usesV35Flow(useLocation().pathname);
  // Preparing the permit pack is its own step, on top of the steps before and after it.
  const stepTotal = sittings + later + (v35Summary && hasPermit ? 1 : 0);
  const stepPhrase = stepTotal === 1 ? "1 step" : `${stepTotal} steps`;
  const headline = !hasWork
    ? "No Permit or Steps Needed"
    : hasPermit && stepTotal > 0
      ? `${permitPhrase} and ${stepPhrase} needed`
      : hasPermit
        ? `${permitPhrase} needed`
        : `${stepPhrase} needed, no permit`;
  const body = hasWork
    ? "Based on your answers, here is what this project needs."
    : "Based on your answers, there is nothing to apply for or arrange.";
  const factSteps = v35Summary ? stepTotal : sittings;
  const showStepList =
    v35Summary && steps.length > 0 && Boolean(onViewSteps || renderStep);
  const facts: { label: string; value: string }[] = [
    { label: "Project", value: workTitle },
    { label: "Unit", value: unitNo },
  ];
  if (!showStepList) {
    facts.push({
      label: v35Summary
        ? "Project Steps"
        : hasPermit
          ? "Steps Before You Apply"
          : "Steps to Take",
      value:
        factSteps === 0
          ? "No steps needed"
          : factSteps === 1
            ? "1 step"
            : `${factSteps} steps`,
    });
  }
  if (!packSummary || !hasPermit || permits.length === 0) {
    facts.push({
      label: "Permits to Apply For",
      value:
        !hasPermit || permits.length === 0
          ? "No permit needed"
          : permits.length === 1
            ? permits[0]
            : `${permits.length} permits`,
    });
  }
  if (later > 0 && !v35Summary) {
    facts.push({
      label: "Pre-Opening",
      value: later === 1 ? "1 check" : `${later} checks`,
    });
  }

  const v35Path = v35Summary && (hasPermit || showStepList);
  const openDocs = hasPermit && onCheckDocuments ? onCheckDocuments : null;

  return (
    <section className="flex min-w-0 flex-col gap-6 pb-8">
      <article className="overflow-hidden rounded-[var(--radius-2xl)] bg-white shadow-[var(--shadow-light-bg)]">
        <header className="flex flex-col gap-3 border-b border-grey-100 px-5 py-5 tablet:px-8 tablet:py-6">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-purple-100 text-purple-600">
              <ClipboardList className="size-6" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-xs leading-4 font-bold uppercase tracking-[0.08em] text-grey-500">
                Scope confirmed
              </p>
              <h2 className="mt-1 text-lg leading-[22px] font-bold text-black">
                {headline}
              </h2>
              <p className="mt-1 text-sm leading-5 text-grey-600">{body}</p>
            </div>
          </div>
        </header>
        {v35Path && showStepList ? (
          <OverviewSteps
            steps={steps}
            onOpenGuide={onViewSteps}
            renderStep={renderStep}
            answers={answers}
          />
        ) : v35Path ? null : (
        <div className="flex min-w-0 flex-col gap-4 px-5 py-5 tablet:px-8 tablet:py-6">
          <dl className="overflow-hidden rounded-[var(--radius-lg)] border border-grey-100 bg-grey-25">
            {facts.map((fact, i) => (
              <div
                key={fact.label}
                className={cn(
                  "flex items-baseline justify-between gap-4 px-3.5 py-2.5 text-sm leading-[18px]",
                  i > 0 && "border-t border-grey-100",
                )}
              >
                <dt className="shrink-0 text-grey-500">{fact.label}</dt>
                <dd className="min-w-0 text-right font-bold text-black">
                  {fact.value}
                </dd>
              </div>
            ))}
          </dl>
          {packSummary && (permits.length > 0 || documents.length > 0 || showStepList) ? (
            <div className="grid gap-3 tablet:grid-cols-2">
              {hasPermit && permits.length > 0 ? (
                <ScopeResultNamedList
                  icon={FileText}
                  title={
                    permits.length === 1
                      ? "1 permit to apply for"
                      : `${permits.length} permits to apply for`
                  }
                  lead="Open project steps for the full guide."
                  items={permits}
                />
              ) : null}
              {docSummary && docSummary.fileCount > 0 ? (
                <DocumentNeedList summary={docSummary} />
              ) : documents.length > 0 ? (
                <ScopeResultNamedList
                  icon={Files}
                  title={
                    documents.length === 1
                      ? "1 document to submit"
                      : `${documents.length} documents to submit`
                  }
                  lead="Required for the permits in this pack."
                  items={documents}
                />
              ) : null}
              {showStepList ? (
                <div className="tablet:col-span-2">
                  <ScopeResultNamedList
                    icon={ClipboardList}
                    title={stepPhrase}
                    lead="A guide for this project. These steps are not tracked."
                    items={steps.map((step) => step.title)}
                    action={{ label: "View the Guide", onClick: onViewSteps! }}
                  />
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
        )}
      </article>
      {v35Path && openDocs ? (
        <StepForward label={V35_PERMIT_STEP_TITLE} ready arrow onNext={openDocs} />
      ) : v35Path ? null : (
      <StepForward
        edit={canEdit && !v35Summary ? { label: "Edit Answers", onClick: onUnlock } : undefined}
        label={
          v35Summary && hasPermit
            ? "Check permit documents"
            : nextStep
              ? nextLabel
              : "Go to Home"
        }
        ready
        onNext={
          v35Summary && hasPermit && onCheckDocuments
            ? onCheckDocuments
            : nextStep
              ? onNext
              : () => navigate(V31_HOME_HREF)
        }
      />
      )}
    </section>
  );
}

function PhaseHeader({
  icon: Icon,
  title,
  lead,
  badge,
}: {
  icon: typeof ClipboardList;
  title: string;
  lead: string;
  badge?: ReactNode;
}) {
  return (
    <header className="border-b border-grey-100 px-5 py-6 tablet:px-8 tablet:py-8">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-purple-100 text-purple-600">
          <Icon className="size-6" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h2 className="text-lg leading-[22px] font-bold text-black">{title}</h2>
            {badge}
          </div>
          <p className="mt-1 text-sm leading-5 text-grey-600">{lead}</p>
        </div>
      </div>
    </header>
  );
}

function sittingAsks(card: V26Card, unit: Unit): V26TellLine[] | null {
  const known = v28IfTheyAsk(card.id);
  if (known) return known;
  const tenant = v26CardView(card, unit, "tenant").you;
  const contractor = v26CardView(card, unit, "contractor").you;
  const lines = [...new Set([...tenant, ...contractor])];
  if (lines.length === 0) return null;
  const text = lines.join("\n");
  return [
    { who: "Tenant", text },
    { who: "Contractor", text },
  ];
}

function sittingFrameClass(done: boolean) {
  const v37 = typeof window !== "undefined" && usesV37Cut(window.location.pathname);
  return cn(
    "overflow-hidden p-0 shadow-none tablet:!p-0",
    done
      ? "border-success-200 bg-white"
      : v37
        ? "border-grey-200 bg-white"
        : "border-grey-100 bg-white",
  );
}

/** Same inner frame as a Tenancy Journey step card (`JourneyStep`): 16 / 32×24, gap 16. */
function sittingBodyClass(v37: boolean) {
  return v37
    ? "flex flex-col gap-4 p-4 desktop:px-8 desktop:py-6"
    : "flex flex-col gap-3 px-4 pb-4 pt-4 tablet:px-6 tablet:pb-4";
}

function ProjectSittingCard({
  step,
  role,
  unit,
  v33,
  stepNo,
  done,
  titleEnd,
  footer,
  hideSystems,
  hideTitle,
}: {
  step: NonNullable<ReturnType<typeof v26DraftOutcome>>["steps"][number];
  role: Role;
  unit: Unit;
  v33: boolean;
  stepNo?: number;
  done?: boolean;
  titleEnd?: ReactNode;
  footer?: ReactNode;
  /** View-only readers do not get the tools used to do the step. */
  hideSystems?: boolean;
  /** The overview row already shows the title. */
  hideTitle?: boolean;
}) {
  const card = v28PackCard(step);
  const v37 = usesV37Cut(useLocation().pathname);
  const becauseTags = v33 ? step.because : undefined;
  const becauseHint =
    becauseTags && becauseTags.length > 0 ? (
      <BecauseTitleHint tags={becauseTags} />
    ) : null;
  return (
    <div className="relative">
      <div className={cn(sittingBodyClass(v37), done && "bg-white")}>
        <V26GuideCard
        card={card}
        role={role}
        unit={unit}
        embedded
        hideTitle={hideTitle}
        stepNo={stepNo}
        stepTone={done ? "done" : "waiting"}
        titleEnd={titleEnd}
        titleBelow={becauseHint}
        sharedVoice
        sharedFact={v28SharedFact(card)}
        ifTheyAsk={sittingAsks(card, unit)}
        linkFact={v28LinkedFact}
        filterSystems={hideSystems ? () => [] : v28SystemsNotInFact}
        timingNote
        linkResources
        readerActions
        stepsAside
        metaBeside
        because={v33 ? null : v31BecauseLine(step.id)}
        footer={footer}
      />
      </div>
    </div>
  );
}

function BlueprintGuideCard({
  card,
  asks,
  role,
  unit,
  stepNo,
  hideSystems,
}: {
  card: V26Card;
  asks: V26TellLine[];
  role: Role;
  unit: Unit;
  stepNo: number;
  hideSystems?: boolean;
}) {
  const v37 = usesV37Cut(useLocation().pathname);
  return (
    <div className="relative">
      <div className={sittingBodyClass(v37)}>
        <V26GuideCard
          card={card}
          role={role}
          unit={unit}
          embedded
          stepNo={stepNo}
          stepTone="waiting"
          sharedVoice
          sharedFact=""
          ifTheyAsk={asks}
          titleBelow={
            card.sheetBecause && card.sheetBecause.length > 0 ? (
              <BecauseTitleHint tags={card.sheetBecause} />
            ) : undefined
          }
          linkFact={v28LinkedFact}
          filterSystems={hideSystems ? () => [] : v28SystemsNotInFact}
          timingNote
          linkResources
          readerActions
          stepsAside
          metaBeside
        />
      </div>
    </div>
  );
}

function ProjectPermitCard({
  card,
  role,
  unit,
  stepNo,
  viewOnly,
  doorHint,
  doorLabel,
  doorTitle,
  permits,
  documents,
  summary,
  onDoor,
  hideTitle,
}: {
  card: V26Card;
  role: Role;
  unit: Unit;
  stepNo: number;
  viewOnly: boolean;
  doorHint: string;
  doorLabel: string;
  doorTitle?: string;
  permits: string[];
  documents: string[];
  summary: V35DocSummary | null;
  onDoor: () => void;
  hideTitle?: boolean;
}) {
  const pathname = useLocation().pathname;
  const v35 = usesV35Flow(pathname);
  const v37 = usesV37Cut(pathname);
  const [glanceOpen, setGlanceOpen] = useState(false);
  const fileCount = summary?.fileCount ?? documents.length;
  return (
    <div className="relative">
      <div className={sittingBodyClass(v37)}>
        <V26GuideCard
          card={card}
          role={role}
          unit={unit}
          embedded
          hideTitle={hideTitle}
          stepNo={stepNo}
          stepTone="waiting"
          sharedVoice
          sharedFact={
            v35
              ? "Get the permit documents ready, then submit them in OneCalendar."
              : v28SharedFact(card)
          }
          ifTheyAsk={sittingAsks(card, unit)}
          linkFact={v28LinkedFact}
          filterSystems={viewOnly ? () => [] : v28SystemsNotInFact}
          timingNote
          linkResources
          readerActions
          stepsAside
          metaBeside
          doorHint={doorHint}
          doorLabel={doorLabel}
          doorTitle={doorTitle}
          onDoorClick={onDoor}
          footer={
            permits.length > 0 || documents.length > 0 ? (
              <PackGlanceTrigger
                permitCount={permits.length}
                documentCount={fileCount}
                open={glanceOpen}
                onOpen={() => setGlanceOpen(true)}
              />
            ) : null
          }
        />
      </div>
      {glanceOpen ? (
        <PackGlanceSheet
          permits={permits}
          documents={documents}
          summary={summary}
          onClose={() => setGlanceOpen(false)}
        />
      ) : null}
    </div>
  );
}

function SummaryDoneList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <p className="text-sm leading-[18px] text-grey-600">None for this project.</p>;
  }
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2 text-sm leading-[18px] text-black">
          <span
            aria-hidden
            className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-[var(--radius-sm)] border border-purple-600 bg-purple-600"
          >
            <span className="block h-1.5 w-2.5 -translate-y-px rotate-[-45deg] border-b-2 border-l-2 border-white" />
          </span>
          {item}
        </li>
      ))}
    </ul>
  );
}

function ScopeSummaryLines({ quiz }: { quiz: QuizState }) {
  const lines = v28ScopeSummary(quiz);
  if (lines.length === 0) {
    return <p className="text-sm leading-[18px] text-grey-600">No answers recorded.</p>;
  }
  return (
    <dl className="flex flex-col gap-4">
      {lines.map((line) => (
        <div key={line.label} className="flex flex-col gap-1">
          <dt className="text-xs leading-4 font-bold uppercase tracking-[0.08em] text-grey-400">
            {line.label}
          </dt>
          <dd className="text-sm leading-[18px] text-black">{line.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function SummarySectionHead({ title, lead }: { title: string; lead: string }) {
  return (
    <div className="flex flex-col gap-1">
      <h3 className="text-base leading-5 font-bold text-black">{title}</h3>
      <p className="text-sm leading-[18px] text-grey-600">{lead}</p>
    </div>
  );
}

function PastProjectSummary({
  selected,
  unit,
  role,
  outcome,
  quiz,
  edition,
  canWrite,
  onReopen,
}: {
  selected: V26Work;
  unit: Unit;
  role: Role;
  outcome: ReturnType<typeof v26DraftOutcome> | null;
  quiz: QuizState;
  edition: "v31" | "v33";
  canWrite?: boolean;
  onReopen?: () => void;
}) {
  const ready = v28WorkReadiness(selected, unit, role, edition);
  const cue = v31ProjectCue(selected, ready, role, unit);
  const complete = ready.chip === "Complete";
  const model = !outcome
    ? null
    : edition === "v33"
      ? v33PhaseModel(outcome)
      : v31PhaseModel(outcome);
  const sittings = model?.sittings.map((step) => v28PackCard(step).title) ?? [];
  const later = model?.later.map((step) => v28PackCard(step).title) ?? [];
  const permits = outcome?.permits ?? [];
  const stepsLabel =
    edition === "v33" ? v33StepsLabel(permits, sittings.length) : "Pre-application";
  const stepsLead =
    permits.length === 0
      ? "These still needed doing, with no permit to apply."
      : "These were finished before the permit application.";
  return (
    <article className="overflow-hidden rounded-[var(--radius-2xl)] bg-white shadow-[var(--shadow-light-bg)]">
      <header className="border-b border-grey-100">
        {complete ? (
          <div className="bg-success-100 px-5 py-3 tablet:px-8">
            <CompletedMark />
          </div>
        ) : (
          <div className="px-5 pt-5 tablet:px-8 tablet:pt-6">
            <CueStatusChip
              label={cue.action}
              toneClass={V31_CHIP_TONE[cue.tone]}
            />
          </div>
        )}
        <div className="px-5 py-6 tablet:px-8 tablet:py-8">
          <h2 className="text-lg leading-[22px] font-bold text-black">
            {complete ? "Project summary" : "Scope summary"}
          </h2>
          <p className="mt-1 text-sm leading-5 text-grey-600">
            {complete
              ? "This project is closed. These are the confirmed details."
              : "These answers did not create a permit application."}
          </p>
          {complete && canWrite && onReopen ? (
            <div className="mt-4 flex flex-col items-start gap-3">
              <p className="text-sm leading-[18px] text-grey-600">
                If the OneCalendar submission needs a change, reopen to edit the
                files and screen again.
              </p>
              <ActionButton
                variant="secondary"
                size="sm"
                className="w-fit"
                onClick={onReopen}
              >
                Reopen application
              </ActionButton>
            </div>
          ) : null}
        </div>
      </header>
      <section className="flex flex-col gap-4 px-5 py-6 tablet:px-8 tablet:py-8">
        <SummarySectionHead
          title="Scope of Works"
          lead="What this renovation was confirmed as."
        />
        <ScopeSummaryLines quiz={quiz} />
      </section>
      {complete ? (
        <>
          <section className="flex flex-col gap-3 border-t border-grey-100 px-5 py-5 tablet:px-8 tablet:py-6">
            <SummarySectionHead
              title="Permits"
              lead="What was applied for this work."
            />
            <SummaryDoneList items={permits} />
          </section>
          {sittings.length > 0 ? (
            <section className="flex flex-col gap-3 border-t border-grey-100 px-5 py-5 tablet:px-8 tablet:py-6">
              <SummarySectionHead title={stepsLabel} lead={stepsLead} />
              <SummaryDoneList items={sittings} />
            </section>
          ) : null}
          {later.length > 0 ? (
            <section className="flex flex-col gap-3 border-t border-grey-100 px-5 py-5 tablet:px-8 tablet:py-6">
              <SummarySectionHead
                title="Pre-Opening"
                lead="These were completed after the permit was issued."
              />
              <SummaryDoneList items={later} />
            </section>
          ) : null}
        </>
      ) : null}
    </article>
  );
}

/** Download and Submit sit the same way: text beside the mark, action under it on mobile. */
const PACK_STEP_ROW =
  "grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-4 gap-y-3 px-4 py-3 tablet:grid-cols-[auto_minmax(0,1fr)_auto] tablet:px-5";

const PACK_STEP_MARK =
  "grid size-6 shrink-0 place-items-center rounded-full bg-purple-200 text-[10px] leading-3 font-bold text-purple-600";

const PACK_STEP_ACTION =
  "col-start-2 inline-flex h-11 w-full items-center justify-center rounded-[var(--radius-md)] px-4 text-base leading-5 font-bold focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)] tablet:col-start-3 tablet:w-auto";

function SketchPermit({
  work,
  unit,
  docs,
  canWrite,
  locked,
  step,
  onStep,
  onSubmitted,
  grouped = false,
  canContinue = true,
  nextLabel = "Next Step",
  onBack,
  onEdit,
  v34 = false,
}: {
  work: V26Work;
  unit: Unit;
  docs: V26ChecklistDoc[];
  canWrite: boolean;
  locked: boolean;
  step: V28ApplyStep;
  onStep: (step: V28ApplyStep) => void;
  onSubmitted: () => void;
  /** v33: one heading per permit, with that permit's files under it. */
  grouped?: boolean;
  canContinue?: boolean;
  nextLabel?: string;
  onBack?: () => void;
  onEdit?: () => void;
  /** v34: briefs on-page, Submit to OneCalendar closes the project. */
  v34?: boolean;
}) {
  const v35 = usesV35Flow(useLocation().pathname);
  const [attachments, setAttachments] = useState<Record<string, V28Attachment>>({});
  const [screen, setScreen] = useState<V28ScreenState>({ result: "idle", runs: 0 });
  const [filed, setFiled] = useState(false);
  const [gotPack, setGotPack] = useState(false);
  const [sampleName, setSampleName] = useState<string | null>(null);
  const [help, setHelp] = useState(false);
  const [permitsOpen, setPermitsOpen] = useState(false);
  const documents = useMemo(() => uniqueDocuments(docs), [docs]);
  const permitNames = useMemo(
    () => [...new Set(docs.map((row) => row.permitName))],
    [docs],
  );
  const onStepRef = useRef(onStep);
  onStepRef.current = onStep;

  useEffect(() => {
    const refresh = () => {
      setAttachments(readV28Attachments(unit.id, work.id));
      setScreen(readV28Screen(unit.id, work.id));
      setFiled(readV28Submitted(unit.id, work.id));
    };
    refresh();
    setGotPack(false);
    window.addEventListener(V28_SCREEN_EVENT, refresh);
    return () => window.removeEventListener(V28_SCREEN_EVENT, refresh);
  }, [unit.id, work.id]);

  useEffect(() => {
    if (locked || step !== "screen") return;
    const current = readV28Screen(unit.id, work.id);
    if (current.result === "pass" || current.result === "issues" || current.result === "error") {
      onStepRef.current("results");
      return;
    }
    if (current.result !== "running") {
      writeV28Screen(unit.id, work.id, { result: "running", runs: current.runs });
    }
    const runs = current.runs;
    const wait = window.setTimeout(() => {
      const atts = readV28Attachments(unit.id, work.id);
      const result = v28DecideResult({
        workId: work.id,
        attached: Object.keys(atts).length,
        runs,
        flagged: v28FlaggedCount(atts),
      });
      writeV28Screen(unit.id, work.id, { result, runs: runs + 1 });
      onStepRef.current("results");
    }, 2200);
    return () => window.clearTimeout(wait);
  }, [locked, step, unit.id, work.id]);

  const takeZip = () => {
    const files = docs
      .map((row) => {
        const attached = attachments[docAttachKey(row.permitName, row.doc.name)];
        return attached ? { permit: row.permitName, fileName: attached.fileName } : null;
      })
      .filter((row): row is { permit: string; fileName: string } => Boolean(row));
    setGotPack(true);
    downloadV31PermitZip({
      unitNo: unit.unitNo,
      workTitle: v26WorkListTitle(work),
      files,
    });
    setGotPack(true);
  };

  const withFiles = documents.map((doc) => ({
    ...doc,
    file: fileFor(doc.rows, attachments),
  }));
  const required = withFiles.filter((doc) => doc.required);
  const optional = withFiles.filter((doc) => !doc.required);
  const requiredDone = required.filter((doc) => doc.file).length;
  const missingRequired = requiredDone < required.length;
  const passed = !locked && screen.result === "pass" && !missingRequired;
  const screening = !locked && (step === "screen" || screen.result === "running");
  const issues = !locked && (screen.result === "issues" || screen.result === "error");
  const missing = required.filter((doc) => !doc.file);
  const flaggedList = withFiles.filter((doc) => doc.file?.issue);
  const flaggedCount = flaggedList.length;
  const listed = [
    ...required.filter((doc) => !doc.file),
    ...required.filter((doc) => doc.file && !doc.file.issue),
    ...optional.filter((doc) => !doc.file?.issue),
  ];
  const canAttach = canWrite && !locked && !screening && !passed;
  const viewOnly = v34 && !canWrite;
  const firstOpenName = useMemo(() => {
    const atts = readV28Attachments(unit.id, work.id);
    return (
      documents.find((doc) => fileFor(doc.rows, atts)?.issue)?.name ??
      documents.find((doc) => doc.required && !fileFor(doc.rows, atts))?.name ??
      ""
    );
  }, [documents, unit.id, work.id]);
  const attachAll = (rows: V26ChecklistDoc[], fileName: string) => {
    for (const row of rows) attachV28Doc(unit.id, work.id, row.permitName, row.doc.name, fileName);
  };
  const removeAll = (rows: V26ChecklistDoc[]) => {
    for (const row of rows) removeV28Doc(unit.id, work.id, row.permitName, row.doc.name);
  };

  if (locked && !v34) {
    return (
      <article className="rounded-[var(--radius-2xl)] bg-white px-4 py-4 shadow-[var(--shadow-light-bg)] tablet:px-5">
        <h3 className="text-base leading-5 font-bold text-grey-500">
          {v35 ? "Check permit documents" : "Permit Application"}
        </h3>
        <p className="mt-1 text-sm leading-[18px] text-grey-500">
          Opens after you confirm the scope of works.
        </p>
      </article>
    );
  }

  return (
    <article className="overflow-hidden rounded-[var(--radius-2xl)] bg-white shadow-[var(--shadow-light-bg)]">
      <header className="border-b border-grey-100 px-5 py-5 tablet:px-8 tablet:py-6">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-purple-100 text-purple-600">
            <Files className="size-6" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h2 className="text-lg leading-[22px] font-bold text-black">
                {v35 ? "Check permit documents" : "Permit Application"}
              </h2>
              <button
                type="button"
                onClick={() => setHelp(true)}
                className="inline-flex w-fit shrink-0 items-center gap-1.5 text-sm leading-[18px] font-bold whitespace-nowrap text-grey-600 hover:text-grey-700 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)] tablet:ml-auto"
              >
                <span
                  aria-hidden
                  className="block size-4 bg-current"
                  style={{
                    WebkitMaskImage: `url("${helpIcon}")`,
                    maskImage: `url("${helpIcon}")`,
                    WebkitMaskSize: "contain",
                    maskSize: "contain",
                    WebkitMaskRepeat: "no-repeat",
                    maskRepeat: "no-repeat",
                    WebkitMaskPosition: "center",
                  }}
                />
                How This Works
              </button>
            </div>
            <p className="mt-2 text-sm leading-5 text-pretty text-grey-600">
              {screening
                ? "Screening the documents. You can leave and come back."
                :                 passed
                  ? viewOnly
                    ? "These files passed screening. Your contractor submits the pack in OneCalendar."
                    : v35
                      ? "These files passed the check. Download the pack and submit it in OneCalendar."
                    : v34
                      ? "These files passed screening. Submit the pack in OneCalendar to close this project."
                      : "These files passed screening."
                  : issues
                    ? flaggedCount > 0
                      ? `${flaggedCount} ${flaggedCount === 1 ? "file" : "files"} flagged.`
                      : "Screening found issues."
                    : missingRequired
                      ? `${requiredDone} of ${required.length} required files uploaded. ${missing.length} still needed.`
                      : viewOnly
                        ? "Your contractor uploads the documents for these permits, then screens them."
                        : v34
                        ? "Upload the documents for these permits, then screen them."
                        : grouped
                          ? `${docs.length} files for this application.`
                          : required.length === 0
                            ? `${withFiles.filter((doc) => doc.file).length} of ${withFiles.length} files uploaded.`
                            : "Attach files for this work. Screening stays on this pack."}
            </p>
            {!v34 && permitNames.length > 0 ? (
              <PermitPackPreview
                permits={permitNames}
                open={permitsOpen}
                onOpen={() => setPermitsOpen(true)}
              />
            ) : null}
          </div>
        </div>
        {v34 && permitNames.length > 0 ? (
          <PermitPackPreview
            permits={permitNames}
            open={permitsOpen}
            onOpen={() => setPermitsOpen(true)}
          />
        ) : null}
      </header>
      {help ? <PackHowItWorks onClose={() => setHelp(false)} /> : null}
      {screening ? (
        <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
          <p className="text-lg leading-[22px] font-bold text-black">Screening Your Documents</p>
          <p className="max-w-sm text-sm leading-[18px] text-grey-500">
            This usually takes 1–3 minutes. You can leave and come back — progress stays on this work as a
            draft.
          </p>
        </div>
      ) : (
        <div className={cn("flex flex-col px-5 py-5 tablet:px-8 tablet:py-6", grouped ? "gap-6" : "gap-3")}>
          {flaggedList.length > 0 || listed.length > 0 ? (
            <div className="flex flex-col gap-1">
              <h3 className="text-base leading-5 font-bold text-black">
                Required Documents
              </h3>
              <p className="text-sm leading-[18px] text-grey-600">
                {permitNames.length > 1
                  ? "Documents required for the permits in this pack."
                  : permitNames.length === 1
                    ? "Documents required for this permit."
                    : "Documents required for this application."}
              </p>
            </div>
          ) : null}
          {flaggedList.length > 0 ? (
            <FlaggedPackSection count={flaggedList.length} viewOnly={viewOnly}>
              {flaggedList.map((doc) => (
                <UniqueUploadCard
                  key={`flagged-${doc.name}`}
                  name={doc.name}
                  preview={doc.preview}
                  note={doc.note}
                  required={doc.required}
                  formats={doc.formats}
                  file={doc.file}
                  canAttach={canAttach}
                  viewOnly={viewOnly}
                  defaultOpen
                  onAttach={(fileName) => attachAll(doc.rows, fileName)}
                  onRemove={() => removeAll(doc.rows)}
                  onSample={() => setSampleName(doc.name)}
                />
              ))}
            </FlaggedPackSection>
          ) : null}
          {listed.map((doc) => (
                <UniqueUploadCard
                  key={doc.name}
                  name={doc.name}
                  preview={doc.preview}
                  note={doc.note}
                  required={doc.required}
                  formats={doc.formats}
                  file={doc.file}
                  canAttach={canAttach}
                  defaultOpen={doc.name === firstOpenName}
                  onAttach={(fileName) => attachAll(doc.rows, fileName)}
                  onRemove={() => removeAll(doc.rows)}
                  onSample={() => setSampleName(doc.name)}
                />
              ))}
        </div>
      )}
      {passed && v34 && !viewOnly ? (
        <div className="flex flex-col gap-3 border-t border-grey-100 px-4 py-4 tablet:px-6">
          <p className="text-sm leading-[18px] text-grey-600">
            {v35
              ? "This is the last page in TeMPo. Download the summary and zip, then submit them in OneCalendar. TeMPo does not send the application."
              : gotPack
                ? "Pack saved. Attach the zip in OneCalendar."
                : "Download the zip to attach in OneCalendar, then submit."}
          </p>
          <div className="flex flex-col gap-3 tablet:flex-row tablet:flex-wrap">
            {v35 ? (
              <ActionButton
                variant="secondary"
                size="md"
                className="w-full tablet:w-fit"
                onClick={() => {
                  const lines = [
                    `Project: ${work.title}`,
                    `Unit: ${unit.unitNo}`,
                    `Status: Ready to submit`,
                    "",
                    "Permits:",
                    ...permitNames.map((name) => `- ${name}`),
                    "",
                    "Documents:",
                    ...documents.map((doc) => `- ${doc.name}`),
                    "",
                    "Submit this summary and the zip in OneCalendar.",
                  ];
                  const blob = new Blob([lines.join("\n")], {
                    type: "text/plain",
                  });
                  const href = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = href;
                  link.download = `${work.title}-results.txt`;
                  link.click();
                  URL.revokeObjectURL(href);
                }}
              >
                Download summary
              </ActionButton>
            ) : null}
            <ActionButton
              variant="secondary"
              size="md"
              className="w-full tablet:w-fit"
              onClick={takeZip}
            >
              {v35 ? "Download zip" : "Download"}
            </ActionButton>
            {canWrite ? (
              <ActionButton
                variant="primary"
                size="md"
                className="w-full gap-1.5 tablet:w-fit"
                onClick={() => {
                  writeV28Submitted(unit.id, work.id, true);
                  setFiled(true);
                  window.open(
                    "https://onecalendar.changiairport.com",
                    "_blank",
                    "noopener,noreferrer",
                  );
                  if (!v35) onSubmitted();
                }}
              >
                {v35 ? "Open OneCalendar" : "Submit to OneCalendar"}
                <ExternalLink className="size-5" strokeWidth={2} aria-hidden />
              </ActionButton>
            ) : (
              <p className="text-sm leading-[18px] text-grey-600">
                {v35
                  ? "Your contractor downloads the pack and submits it in OneCalendar."
                  : "The contractor submits this zip in OneCalendar to close the project."}
              </p>
            )}
            {v35 && onEdit ? (
              <ActionButton
                variant="tertiary"
                size="md"
                className="w-full tablet:w-fit"
                iconEnd={<ActionButtonIcon src={editIcon} />}
                onClick={onEdit}
              >
                Edit Answers
              </ActionButton>
            ) : null}
          </div>
        </div>
      ) : null}
      {passed && !v34 ? (
        <div className="border-t border-grey-100">
          <div className="flex w-full flex-col">
            <ol>
              <li className="border-b border-grey-100">
                <div className={PACK_STEP_ROW}>
                  <span className={PACK_STEP_MARK} aria-hidden>
                    {gotPack ? (
                      <Check className="size-3.5" strokeWidth={2.5} />
                    ) : (
                      "1"
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-base leading-5 font-bold text-black">
                      Download the pack
                    </span>
                    <span className="mt-1 block text-sm leading-[18px] text-grey-600">
                      {gotPack
                        ? "Saved. Attach this zip in OneCalendar."
                        : "The zip is what you attach in OneCalendar."}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={takeZip}
                    className={cn(
                      PACK_STEP_ACTION,
                      "border border-grey-300 bg-grey-25 text-grey-700 hover:bg-grey-50",
                    )}
                  >
                    Download
                  </button>
                </div>
              </li>
              <li>
                <div className={PACK_STEP_ROW}>
                  <span className={PACK_STEP_MARK} aria-hidden>
                    2
                  </span>
                  <span className="min-w-0">
                    <span className="block text-base leading-5 font-bold text-black">
                      Submit in OneCalendar
                    </span>
                    <span className="mt-1 block text-sm leading-[18px] text-grey-600">
                      You must submit your permit application in OneCalendar for approval.
                    </span>
                  </span>
                  <a
                    href="https://onecalendar.changiairport.com"
                    target="_blank"
                    rel="noreferrer"
                    className={cn(
                      PACK_STEP_ACTION,
                      "gap-1.5 bg-purple-600 text-white hover:bg-purple-700",
                    )}
                  >
                    Submit in OneCalendar
                    <ExternalLink className="size-5" strokeWidth={2} aria-hidden />
                  </a>
                </div>
              </li>
            </ol>
            <div className="flex flex-col gap-3 border-t border-grey-100 px-4 py-4 tablet:px-5">
              {canWrite ? (
                <label className="flex cursor-pointer items-start gap-2">
                  <input
                    type="checkbox"
                    checked={filed}
                    onChange={() => {
                      const next = !filed;
                      writeV28Submitted(unit.id, work.id, next);
                      setFiled(next);
                    }}
                    className={STEP_CHECK}
                  />
                  <span
                    className={cn(
                      "text-sm leading-[18px]",
                      filed ? "font-bold text-black" : "text-grey-700",
                    )}
                  >
                    I have submitted this in OneCalendar
                  </span>
                </label>
              ) : (
                <p className="text-sm leading-[18px] text-grey-600">
                  {filed
                    ? "The contractor submitted this in OneCalendar."
                    : "The contractor submits this zip in OneCalendar."}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : null}
      {locked || screening || (v34 && passed) ? null : passed ? (
        <StepForward
          back={onBack}
          edit={onEdit ? { label: "Edit Answers", onClick: onEdit } : undefined}
          label={nextLabel}
          ready={Boolean(filed && canContinue)}
          onNext={onSubmitted}
          arrow={nextLabel === "Next Step"}
        />
      ) : canWrite ? (
        <StepForward
          back={v34 ? undefined : onBack}
          edit={
            v34
              ? undefined
              : onEdit
                ? { label: "Edit Answers", onClick: onEdit }
                : undefined
          }
          label={issues ? "Screen Again" : "Screen These Files"}
          ready={!missingRequired}
          arrow={false}
          onNext={() => {
            writeV28Screen(unit.id, work.id, { result: "idle", runs: screen.runs });
            onStep("screen");
          }}
        />
      ) : onBack || onEdit ? (
        <StepForward
          back={onBack}
          edit={onEdit ? { label: "Edit Answers", onClick: onEdit } : undefined}
        />
      ) : null}
      {sampleName ? <PermitSampleModal name={sampleName} onClose={() => setSampleName(null)} /> : null}
      {permitsOpen ? (
        <PermitListSheet
          permits={permitNames}
          onClose={() => setPermitsOpen(false)}
        />
      ) : null}
    </article>
  );
}

function v34PermitGlance(docs: V26ChecklistDoc[], unitId: string, workId: string) {
  const documents = uniqueDocuments(docs);
  const attachments = readV28Attachments(unitId, workId);
  const screen = readV28Screen(unitId, workId);
  const v35 = usesV35Flow(window.location.pathname);
  const slots = v35 ? v35DocumentSlots(docs) : [];
  const requiredDocs = documents.filter((doc) => doc.required);
  const requiredSlots = slots.filter((slot) =>
    slot.rows.some((row) => row.need === "Required"),
  );
  const withFiles = documents.map((doc) => ({
    ...doc,
    file: fileFor(doc.rows, attachments),
  }));
  const requiredDone = v35
    ? requiredSlots.filter((slot) =>
        slot.rows
          .filter((row) => row.need === "Required")
          .every(
            (row) => attachments[docAttachKey(row.permitName, row.doc.name)],
          ),
      ).length
    : requiredDocs.filter((doc) =>
        Boolean((doc as { file?: V28Attachment }).file),
      ).length;
  const required = v35 ? requiredSlots : requiredDocs;
  const permitCount = [...new Set(docs.map((row) => row.permitName))].length;
  if (screen.result === "pass" && requiredDone >= required.length) {
    return {
      lead: v35
        ? permitCount === 1
          ? "All documents passed. Download the pack and submit it in OneCalendar."
          : `All documents passed for ${permitCount} permits. Download the pack and submit it in OneCalendar.`
        : permitCount === 1
          ? "Files passed screening. Submit in OneCalendar to close this project."
          : `${permitCount} permits. Files passed screening. Submit in OneCalendar to close this project.`,
      action: v35 ? "Continue" : "Continue Permit Application",
      started: true,
    };
  }
  const checkLabel = v35;
  if (screen.result === "issues" || screen.result === "error") {
    return {
      lead: checkLabel
        ? "Some documents need fixing. See which ones."
        : "The check found issues. Open to fix the flagged files.",
      action: checkLabel ? "Continue" : "Continue Permit Application",
      started: true,
    };
  }
  if (screen.result === "running") {
    return {
      lead: checkLabel
        ? "Checking your documents. You can leave and come back."
        : "Documents are being checked. You can leave and come back.",
      action: checkLabel ? "Continue" : "Continue Permit Application",
      started: true,
    };
  }
  if (requiredDone > 0 || withFiles.some((doc) => doc.file)) {
    return {
      lead: checkLabel
        ? required.length === 0
          ? "Some documents uploaded. Finish uploading, then run the check."
          : `${requiredDone} of ${required.length} documents uploaded. Add the rest, then run the check.`
        : required.length === 0
          ? "Some files are attached. Open to finish and check."
          : `${requiredDone} of ${required.length} required files uploaded.`,
      action: checkLabel ? "Continue" : "Continue Permit Application",
      started: true,
    };
  }
  return {
    lead: checkLabel
      ? permitCount === 1
        ? "Upload the documents for this permit, then run the check."
        : `Upload the documents for ${permitCount} permits, then run the check.`
      : permitCount === 1
        ? "Open to upload, screen, and submit the permit pack in OneCalendar."
        : `Open to upload, screen, and submit ${permitCount} permits in OneCalendar.`,
    action: checkLabel ? "Check documents" : "Open Permit Application",
    started: false,
  };
}

function V34JobList({
  selected,
  unit,
  role,
  canWrite,
  outcome,
  docs,
  quiz,
  quizLocked,
  quizDone,
  apply,
  resultParam,
  onApply,
  onClosePermit,
  onEnterSteps,
  onQuiz,
  onLock,
  onUnlock,
  onCancelEdit,
}: {
  selected: V26Work;
  unit: Unit;
  role: Role;
  canWrite: boolean;
  outcome: ReturnType<typeof v26DraftOutcome> | null;
  docs: V26ChecklistDoc[];
  quiz: QuizState;
  quizLocked: boolean;
  quizDone: boolean;
  apply: V28ApplyStep | typeof V28_APPLY_PARTS | null;
  resultParam?: string | null;
  onApply: (step: V28ApplyStep | typeof V28_APPLY_PARTS) => void;
  onClosePermit: () => void;
  onEnterSteps: () => void;
  onQuiz: (next: QuizState) => void;
  onLock: () => void;
  onUnlock: (back?: V28ApplyStep) => void;
  onCancelEdit?: () => void;
}) {
  const pathname = useLocation().pathname;
  const v35 = usesV35Flow(pathname);
  const v37 = usesV37Cut(pathname);
  const [searchParams, setParams] = useSearchParams();
  const backToOverview = () => {
    const next = new URLSearchParams();
    next.set("work", selected.id);
    next.set("tab", "answers");
    next.set("result", "scope");
    setParams(next);
  };
  const returnTo = searchParams.get("return");
  const returnStep =
    v37 &&
    (returnTo === "checklist" ||
      returnTo === "upload" ||
      returnTo === "screen" ||
      returnTo === "results")
      ? returnTo
      : null;
  const [draftSaved, setDraftSaved] = useState(false);
  const [permitTick, setPermitTick] = useState(0);
  const viewOnly = role === "tenant";
  const permitStep: V28ApplyStep =
    apply === "screen" || apply === "results" || apply === "upload"
      ? apply
      : v35 && apply === "checklist"
        ? "checklist"
        : v35
          ? "checklist"
          : "upload";
  const permitOpen = Boolean(apply);
  const model = outcome ? v33PhaseModel(outcome) : null;
  const sittings = model?.sittings ?? [];
  const later = model?.later ?? [];
  const hasPermit = Boolean(model?.hasPermit);
  const blueprintGuide =
    usesV38Modules(pathname) && quizLocked ? v38FullGuideCards(unit, role, quiz) : [];
  const hasWork =
    sittings.length > 0 || hasPermit || later.length > 0 || blueprintGuide.length > 0;
  const progress = v28QuizProgress(quiz);
  const typeLead = quizLocked
    ? canWrite
      ? "These answers are confirmed. Changing them can add or remove steps."
      : "The contractor confirmed what this renovation involves."
      : canWrite
      ? v37
        ? "Tell us about your planned works so we can list the permits you need and the documents to screen before OneCalendar."
        : v35
        ? "Tell us what this renovation involves. You can change answers later if the scope changes."
        : "Tell us what this renovation involves. Not sure is fine — you can clear those at KickOff."
      : "The contractor fills this in before the next step opens.";

  useEffect(() => {
    const refresh = () => setPermitTick((n) => n + 1);
    window.addEventListener(V28_SCREEN_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(V28_SCREEN_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  let stepNo = 0;
  const numberedBefore = sittings.map((step) => ({
    step,
    n: ++stepNo,
  }));
  const permitNo = hasPermit ? ++stepNo : null;
  const numberedLater = later.map((step) => ({
    step,
    n: ++stepNo,
  }));
  void permitTick;
  const glance = hasPermit
    ? v34PermitGlance(docs, unit.id, selected.id)
    : null;
  const applyCard = v28ApplyCard(v35 ? V35_PERMIT_STEP_TITLE : "Permit Application");
  const packPermits = outcome?.permits ?? [];
  const packDocuments = uniqueDocuments(docs).map((doc) => doc.name);
  const docSummary = v35 ? v35DocumentSummary(docs) : null;
  const permitFileCount = docSummary?.fileCount ?? packDocuments.length;
  const permitDoorHint = !glance
    ? ""
    : viewOnly
      ? v35
        ? "Your contractor uploads and checks the documents. View them here."
        : "Your contractor uploads, screens and submits the files. You can view them here."
      : v35 && role === "officer"
        ? "The contractor uploads and checks the documents. Review them here."
        : glance.lead;
  const permitDoorRaw = !glance
    ? ""
    : canWrite
      ? glance.action
      : role === "officer"
        ? v35
          ? "Review documents"
          : "Review Permit Application"
        : v35
          ? "View documents"
          : "View Permit Application";
  const permitDoorLabel =
    typeof window !== "undefined" && usesV37Cut(window.location.pathname)
      ? permitDoorRaw.replace(/\b[a-z]/g, (ch) => ch.toUpperCase())
      : permitDoorRaw;
  const openPermitDocs = () => {
    if (!v35) {
      onApply("upload");
      return;
    }
    const screen = readV28Screen(unit.id, selected.id);
    if (screen.result === "pass" || screen.result === "issues") {
      onApply("results");
      return;
    }
    onApply(v37 ? "upload" : "checklist");
  };
  const overviewEntries = (outcome?.steps ?? []).map((step, index) => {
    const permit = step.id === "html-permit-pack";
    return {
      kind: permit ? ("permit" as const) : ("step" as const),
      title: permit
        ? v35
          ? V35_PERMIT_STEP_TITLE
          : "Permit pack"
        : v28PackCard(step).title,
      n: index + 1,
      step: permit ? null : step,
    };
  });

  if (!quizLocked) {
    return (
      <article className={v37PageCard(v37)}>
        <header className="flex flex-col gap-4 border-b border-grey-100 px-5 py-5 tablet:px-8 tablet:py-6">
          {v37 && onCancelEdit && !returnStep ? (
            <button type="button" onClick={onCancelEdit} className={BACK}>
              <BackArrow />
              Back to Overview
            </button>
          ) : null}
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-purple-100 text-purple-600">
              <ClipboardList className="size-6" aria-hidden />
            </span>
            <div className="min-w-0">
              <h3 className="text-lg leading-[22px] font-bold text-black">
                Scope of Works
              </h3>
              <p className="mt-1 text-sm leading-5 text-grey-600">{typeLead}</p>
            </div>
          </div>
          {returnStep ? (
            <Banner title="You Can Update the Permits">
              <span className="font-bold">Update Permits</span> makes a new
              checklist from these answers.{" "}
              <span className="font-bold">
                {returnStep === "upload"
                  ? "Back to Documents"
                  : returnStep === "checklist"
                    ? "Back to Checklist"
                    : returnStep === "results"
                      ? "Back to Results"
                      : "Back to Screening"}
              </span>{" "}
              keeps the one you have.
            </Banner>
          ) : null}
          {canWrite ? (
            <QuizProgress
              answered={progress.answered}
              total={progress.total}
              saved={draftSaved}
            />
          ) : null}
          {returnStep && onCancelEdit ? (
            <button
              type="button"
              onClick={onCancelEdit}
              className="inline-flex h-10 w-fit items-center gap-1.5 text-sm leading-[18px] font-bold text-purple-600"
            >
              <ArrowLeft aria-hidden size={18} />
              {returnStep === "upload"
                ? "Back to Documents"
                : returnStep === "checklist"
                  ? "Back to Checklist"
                  : returnStep === "results"
                    ? "Back to Results"
                    : "Back to Screening"}
            </button>
          ) : null}
        </header>
        <div className="px-5 py-5 tablet:px-8 tablet:py-6">
          <QuizChecklistV28
            state={quiz}
            disabled={!canWrite}
            locked={false}
            note={!canWrite ? undefined : null}
            intro={null}
            friendly
            plain={v35}
            onChange={(next) => {
              setDraftSaved(false);
              onQuiz(next);
            }}
          />
        </div>
        <StepForward
          draft={
            canWrite && v28HasSavedAnswers(quiz)
              ? {
                  label: draftSaved ? "Draft Saved" : "Save Draft",
                  onClick: () => {
                    onQuiz(quiz);
                    setDraftSaved(true);
                  },
                }
              : undefined
          }
          label={returnStep ? "Update Permits" : "Confirm"}
          ready={canWrite && quizDone}
          onNext={onLock}
        />
      </article>
    );
  }

  if (v35 && hasPermit && (permitOpen || resultParam === "answers")) {
    return (
      <V35CheckDocuments
        work={selected}
        unit={unit}
        role={role}
        docs={docs}
        quiz={quiz}
        canWrite={canWrite}
        apply={permitOpen ? permitStep : v37 ? "upload" : "checklist"}
        viewAnswers={resultParam === "answers"}
        onUnlock={onUnlock}
        onSubmitted={onClosePermit}
      />
    );
  }

  if (v37 && resultParam === "review") {
    const answers = v37AnswersCopy({ role, canWrite, hasPermit });
    return (
      <V37QuizReview quiz={quiz} lead={answers.lead} onBack={backToOverview} />
    );
  }

  const showScopeResults = !hasWork || resultParam === "scope";
  if (
    v37 &&
    quizLocked &&
    !permitOpen &&
    resultParam !== "steps" &&
    resultParam !== "review"
  ) {
    return (
      <V37ScopeReady
        hasPermit={hasPermit}
        permits={outcome?.permits ?? []}
        docSummary={docSummary}
        documents={uniqueDocuments(docs).map((doc) => doc.name)}
        guideSteps={[
          ...numberedBefore.map(({ step }) => v28PackCard(step).title),
          ...(hasPermit ? [V35_PERMIT_STEP_TITLE] : []),
          ...numberedLater.map(({ step }) => v28PackCard(step).title),
          ...blueprintGuide.map(({ card }) => card.title),
        ]}
        hasGuide={hasWork}
        canWrite={canWrite}
        role={role}
        onScreen={openPermitDocs}
        onGuide={onEnterSteps}
      />
    );
  }
  if (showScopeResults) {
    const docNames = uniqueDocuments(docs).map((doc) => doc.name);
    const stepBody = (index: number) => {
      const entry = overviewEntries[index];
      if (!entry) return null;
      if (entry.kind === "permit" && glance) {
        return (
          <ProjectPermitCard
            card={applyCard}
            role={role}
            unit={unit}
            stepNo={entry.n}
            viewOnly={viewOnly}
            doorHint={permitDoorHint}
            doorLabel={permitDoorLabel}
            doorTitle={v35 ? v35PermitDoorTitle(role) : undefined}
            permits={packPermits}
            documents={packDocuments}
            summary={docSummary}
            onDoor={openPermitDocs}
            hideTitle
          />
        );
      }
      if (entry.kind === "step" && entry.step) {
        return (
          <ProjectSittingCard
            step={entry.step}
            role={role}
            unit={unit}
            v33
            stepNo={entry.n}
            hideSystems={viewOnly}
            hideTitle
          />
        );
      }
      return null;
    };
    return (
      <ScopeResultCard
        workTitle={selected.title}
        unitNo={unit.unitNo}
        sittings={sittings.length}
        later={later.length}
        hasPermit={hasPermit}
        permits={outcome?.permits ?? []}
        documents={docNames}
        docSummary={docSummary}
        packSummary={hasWork}
        canWrite={canWrite}
        nextStep={
          !v35 && hasWork ? { id: "steps", label: "View Full Guide" } : null
        }
        nextLabel="View Full Guide"
        steps={overviewEntries.map((entry) => ({
          title: entry.title,
          current: entry.kind === "permit",
          detail:
            entry.kind === "permit"
              ? permitFileCount > 0
                ? `Permit documents · ${permitFileCount} ${permitFileCount === 1 ? "file" : "files"}`
                : "Permit documents"
              : undefined,
        }))}
        onUnlock={onUnlock}
        onNext={onEnterSteps}
        onViewSteps={v35 ? undefined : onEnterSteps}
        renderStep={v35 ? stepBody : undefined}
        answers={
          v35 && quizLocked
            ? {
                label: canWrite ? "Edit Answers" : "Review answers",
                edit: canWrite,
                onClick: () => {
                  if (canWrite) {
                    onUnlock();
                    return;
                  }
                  const next = new URLSearchParams();
                  next.set("work", selected.id);
                  next.set("result", "answers");
                  setParams(next);
                },
              }
            : undefined
        }
        onCheckDocuments={() => {
          const screen = readV28Screen(unit.id, selected.id);
          const ready = v28WorkReadiness(selected, unit, role, "v35");
          const step =
            screen.result === "issues" || screen.result === "pass"
              ? "results"
              : screen.result === "error" || screen.result === "running"
                ? "screen"
                : ready.applyTo ?? "checklist";
          onApply(step);
        }}
      />
    );
  }

  if (permitOpen && hasPermit) {
    return (
      <div className="flex w-full min-w-0 flex-col gap-6">
        <SketchPermit
          work={selected}
          unit={unit}
          docs={docs}
          canWrite={canWrite}
          locked={false}
          step={permitStep}
          grouped
          v34
          onStep={(next) => onApply(next)}
          onBack={onClosePermit}
          onEdit={canWrite ? onUnlock : undefined}
          onSubmitted={() => {
            if (!v35) completeV31Work(unit.id, selected.id);
            onClosePermit();
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      <article className={v37PageCard(v37)}>
        <header className="flex flex-col gap-3 border-b border-grey-100 px-5 py-5 tablet:px-8 tablet:py-6">
          {v37 ? (
            <button type="button" onClick={backToOverview} className={BACK}>
              <BackArrow />
              Back to Overview
            </button>
          ) : null}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg leading-[22px] font-bold text-black">
                Full Guide
              </h2>
              <p className="mt-1 text-sm leading-5 text-grey-600">
                {v35
                  ? "A guide for this project. These steps are not tracked."
                  : viewOnly
                    ? "Everything this project needs, from the scope your contractor confirmed."
                    : "Everything this project needs, from the answers you confirmed."}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {canWrite && !v35 ? (
                <ActionButton
                  variant="tertiary"
                  size="sm"
                  className="w-fit"
                  iconEnd={<ActionButtonIcon src={editIcon} />}
                  onClick={onUnlock}
                >
                  Edit Answers
                </ActionButton>
              ) : null}
            </div>
          </div>
        </header>
        <div className="px-5 py-5 tablet:px-8 tablet:py-6">
          <StepInsetList inset>
            {numberedBefore.map(({ step, n }) => (
              <StepInset
                key={step.id}
                id={`v34-step-${step.id}`}
                inset
                className={sittingFrameClass(false)}
              >
                <ProjectSittingCard
                  step={step}
                  role={role}
                  unit={unit}
                  v33
                  stepNo={n}
                  hideSystems={viewOnly}
                />
              </StepInset>
            ))}
            {hasPermit && permitNo != null && glance ? (
              <StepInset
                id="v34-permit-application"
                inset
                className={sittingFrameClass(false)}
              >
                <ProjectPermitCard
                  card={applyCard}
                  role={role}
                  unit={unit}
                  stepNo={permitNo}
                  viewOnly={viewOnly}
                  doorHint={permitDoorHint}
                  doorLabel={permitDoorLabel}
                  doorTitle={v35 ? v35PermitDoorTitle(role) : undefined}
                  permits={packPermits}
                  documents={packDocuments}
                  summary={docSummary}
                  onDoor={openPermitDocs}
                />
              </StepInset>
            ) : null}
            {numberedLater.map(({ step, n }) => (
              <StepInset
                key={step.id}
                id={`v34-step-${step.id}`}
                inset
                className={sittingFrameClass(false)}
              >
                <ProjectSittingCard
                  step={step}
                  role={role}
                  unit={unit}
                  v33
                  stepNo={n}
                  hideSystems={viewOnly}
                />
              </StepInset>
            ))}
            {blueprintGuide.map(({ card, asks }, index) => (
              <StepInset
                key={card.id}
                id={`v34-step-${card.id}`}
                inset
                className={sittingFrameClass(false)}
              >
                <BlueprintGuideCard
                  card={card}
                  asks={asks}
                  role={role}
                  unit={unit}
                  stepNo={stepNo + index + 1}
                  hideSystems={false}
                />
              </StepInset>
            ))}
          </StepInsetList>
        </div>
        {!hasPermit && canWrite && !v35 ? (
          <StepForward
            label="Finish project"
            ready
            arrow={false}
            onNext={() => completeV31Work(unit.id, selected.id)}
          />
        ) : null}
      </article>
    </div>
  );
}

function V34PastSummary({
  selected,
  unit,
  role,
  outcome,
  docs,
  quiz,
  onGuide,
}: {
  selected: V26Work;
  unit: Unit;
  role: Role;
  outcome: ReturnType<typeof v26DraftOutcome> | null;
  docs: V26ChecklistDoc[];
  quiz: QuizState;
  onGuide?: () => void;
}) {
  const v37 = usesV37Cut(useLocation().pathname);
  const [searchParams, setParams] = useSearchParams();
  const model = outcome ? v33PhaseModel(outcome) : null;
  const sittings = model?.sittings ?? [];
  const later = model?.later ?? [];
  const hasPermit = Boolean(model?.hasPermit);
  const permitNames = outcome?.permits ?? [];
  const [gotPack, setGotPack] = useState(false);
  const attachments = readV28Attachments(unit.id, selected.id);

  let stepNo = 0;
  const numberedBefore = sittings.map((step) => ({
    step,
    n: ++stepNo,
  }));
  const permitNo = hasPermit ? ++stepNo : null;
  const numberedLater = later.map((step) => ({
    step,
    n: ++stepNo,
  }));

  const takeZip = () => {
    const files = docs
      .map((row) => {
        const attached = attachments[docAttachKey(row.permitName, row.doc.name)];
        return attached
          ? { permit: row.permitName, fileName: attached.fileName }
          : null;
      })
      .filter(
        (row): row is { permit: string; fileName: string } => Boolean(row),
      );
    downloadV31PermitZip({
      unitNo: unit.unitNo,
      workTitle: v26WorkListTitle(selected),
      files,
    });
    setGotPack(true);
  };

  if (v37) {
    if (searchParams.get("result") === "review") {
      const answers = v37AnswersCopy({
        role,
        canWrite: false,
        hasPermit,
        past: true,
      });
      return (
        <V37QuizReview
          quiz={quiz}
          lead={answers.lead}
          onBack={() => {
            const next = new URLSearchParams();
            next.set("work", selected.id);
            next.set("tab", "answers");
            next.set("result", "scope");
            setParams(next);
          }}
        />
      );
    }
    return (
      <V37PastReady
        selected={selected}
        unit={unit}
        outcome={outcome}
        docs={docs}
        canWrite={false}
        role={role}
        onGuide={onGuide}
      />
    );
  }

  return (
    <article className="overflow-hidden rounded-[var(--radius-2xl)] bg-white shadow-[var(--shadow-light-bg)]">
      <header className="flex flex-col gap-3 border-b border-grey-100 px-5 py-5 tablet:px-8 tablet:py-6">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-purple-100 text-purple-600">
            <span
              aria-hidden
              className="block size-6 bg-current"
              style={{
                WebkitMaskImage: `url("${checkCircleIcon}")`,
                maskImage: `url("${checkCircleIcon}")`,
                WebkitMaskSize: "contain",
                maskSize: "contain",
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
              }}
            />
          </span>
          <div className="min-w-0">
            <p className="text-xs leading-4 font-bold uppercase tracking-[0.08em] text-grey-500">
              Project closed
            </p>
            <h2 className="mt-1 text-lg leading-[22px] font-bold text-black">
              {hasPermit ? "Permits submitted" : "Nothing left to do"}
            </h2>
            <p className="mt-1 text-sm leading-5 text-grey-600">
              {hasPermit
                ? "The permit pack went to OneCalendar. Here is what this project covered."
                : "Here is what this project covered."}
            </p>
          </div>
        </div>
      </header>
      <div className="flex min-w-0 flex-col gap-4 px-5 py-5 tablet:px-8 tablet:py-6">
        <dl className="overflow-hidden rounded-[var(--radius-lg)] border border-grey-100 bg-grey-25">
          {[
            { label: "Project", value: selected.title },
            { label: "Unit", value: unit.unitNo },
            {
              label: "Steps",
              value:
                sittings.length + later.length === 0
                  ? "No steps needed"
                  : sittings.length + later.length === 1
                    ? "1 step"
                    : `${sittings.length + later.length} steps`,
            },
            {
              label: "Permits",
              value:
                !hasPermit || permitNames.length === 0
                  ? "No permit needed"
                  : permitNames.length === 1
                    ? permitNames[0]
                    : `${permitNames.length} permits`,
            },
          ].map((fact, i) => (
            <div
              key={fact.label}
              className={cn(
                "flex items-baseline justify-between gap-4 px-3.5 py-2.5 text-sm leading-[18px]",
                i > 0 && "border-t border-grey-100",
              )}
            >
              <dt className="shrink-0 text-grey-500">{fact.label}</dt>
              <dd className="min-w-0 text-right font-bold text-black">
                {fact.value}
              </dd>
            </div>
          ))}
        </dl>
        {hasPermit ? (
          <div className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-grey-100 bg-grey-25 px-3.5 py-3 tablet:flex-row tablet:items-center">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-grey-600 shadow-[inset_0_0_0_1px_var(--color-grey-100)]">
                <FileText className="size-4" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-sm leading-[18px] font-bold text-black">
                  Submitted permit pack
                </span>
                <span className="mt-0.5 block text-xs leading-4 text-grey-500">
                  {gotPack
                    ? "Downloaded. You can download it again anytime."
                    : `The zip of ${permitNames.length === 1 ? "the permit" : `all ${permitNames.length} permits`} sent to OneCalendar.`}
                </span>
              </span>
            </div>
            <ActionButton
              variant="secondary"
              size="sm"
              className="w-full tablet:w-fit"
              onClick={takeZip}
            >
              Download
            </ActionButton>
          </div>
        ) : null}
      </div>
      <section className="flex flex-col gap-4 border-t border-grey-100 px-5 py-5 tablet:px-8 tablet:py-6">
        <SummarySectionHead
          title="Scope of Works"
          lead="What this renovation was confirmed as."
        />
        <ScopeSummaryLines quiz={quiz} />
      </section>
      <section className="border-t border-grey-100 px-5 py-5 tablet:px-8 tablet:py-6">
        <SummarySectionHead
          title="Project Steps"
          lead="What this project needed."
        />
        <ol className="mt-4 flex flex-col gap-4">
          {numberedBefore.map(({ step, n }) => (
            <li key={step.id} className="min-w-0">
              <p className="text-sm leading-[18px] font-bold text-black">
                {n}. {v28PackCard(step).title}
              </p>
              <p className="mt-1 text-sm leading-5 text-grey-600">
                {v28PackCard(step).lead}
              </p>
            </li>
          ))}
          {hasPermit && permitNo != null ? (
            <li className="min-w-0">
              <p className="text-sm leading-[18px] font-bold text-black">
                {permitNo}. {usesV35Flow(window.location.pathname) ? V35_PERMIT_STEP_TITLE : "Permit Application"}
              </p>
              <ul className="mt-2 divide-y divide-grey-100 rounded-[var(--radius-md)] border border-grey-100 bg-grey-25">
                {permitNames.map((name) => (
                  <li key={name} className="px-3 py-2.5">
                    <p className="text-sm leading-[18px] font-bold text-black">
                      {name}
                    </p>
                    <p className="mt-0.5 text-xs leading-4 text-grey-600">
                      {permitAbout(name)}
                    </p>
                  </li>
                ))}
              </ul>
            </li>
          ) : null}
          {numberedLater.map(({ step, n }) => (
            <li key={step.id} className="min-w-0">
              <p className="text-sm leading-[18px] font-bold text-black">
                {n}. {v28PackCard(step).title}
              </p>
              <p className="mt-1 text-sm leading-5 text-grey-600">
                {v28PackCard(step).lead}
              </p>
            </li>
          ))}
        </ol>
      </section>
    </article>
  );
}

function V31JobList({
  selected,
  unit,
  role,
  canWrite,
  outcome,
  docs,
  quiz,
  tabParam,
  resultParam,
  apply,
  quizLocked,
  quizDone,
  submitted,
  nextStep,
  v33 = false,
  onTab,
  onApply,
  onQuiz,
  onLock,
  onUnlock,
}: {
  selected: V26Work;
  unit: Unit;
  role: Role;
  canWrite: boolean;
  outcome: ReturnType<typeof v26DraftOutcome> | null;
  docs: V26ChecklistDoc[];
  quiz: QuizState;
  tabParam: string | null;
  resultParam?: string | null;
  apply: V28ApplyStep | typeof V28_APPLY_PARTS | null;
  quizLocked: boolean;
  quizDone: boolean;
  submitted: boolean;
  nextStep: { id: string; label: string } | null;
  v33?: boolean;
  onTab: (tab: WorkTab) => void;
  onApply: (step: V28ApplyStep | typeof V28_APPLY_PARTS) => void;
  onQuiz: (next: QuizState) => void;
  onLock: () => void;
  onUnlock: () => void;
}) {
  const [detailId, setDetailId] = useState<string | null>(null);
  const [answersOpen, setAnswersOpen] = useState(!quizLocked || tabParam === "answers");
  const [closes, setCloses] = useState(() =>
    readV31Closes(unit.id, selected.id),
  );
  const [projectDone, setProjectDone] = useState(() =>
    isV31Complete(unit.id, selected.id),
  );
  const [draftSaved, setDraftSaved] = useState(false);

  useEffect(() => {
    const refresh = () => {
      setCloses(readV31Closes(unit.id, selected.id));
      setProjectDone(isV31Complete(unit.id, selected.id));
    };
    refresh();
    window.addEventListener(V31_CLOSES_CHANGED, refresh);
    window.addEventListener(V31_COMPLETED_CHANGED, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(V31_CLOSES_CHANGED, refresh);
      window.removeEventListener(V31_COMPLETED_CHANGED, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [unit.id, selected.id]);
  const model = outcome
    ? v33
      ? v33PhaseModel(outcome)
      : v31PhaseModel(outcome)
    : null;
  const sittings = model?.sittings ?? [];
  const later = model?.later ?? [];
  const hasPermit = Boolean(model?.hasPermit);
  const beforeConfirm = "Opens after you confirm the scope of works.";
  const afterPermit = "Opens after the permit is submitted.";
  const permitStep: V28ApplyStep =
    apply === "screen" || apply === "results" || apply === "upload" ? apply : "upload";
  const emptySite = sittings.length === 0;
  const emptyPermit = !hasPermit;
  const emptyOpening = later.length === 0;
  const readyStep = v28WorkReadiness(selected, unit, role, v33 ? "v33" : "v31").step;
  const siteDone =
    !emptySite &&
    (readyStep === "submit" ||
      readyStep === "next" ||
      sittings.every((row) => closes[row.id]?.status === "done"));
  const laterDone = !emptyOpening && later.every((row) => closes[row.id]?.status === "done");
  const stops: PhaseStop[] = (model?.bases ?? []).map((stop) => ({
    ...stop,
    tone:
      !quizLocked
        ? "locked"
        : stop.id === "site"
          ? emptySite
            ? "locked"
            : siteDone || submitted
              ? "done"
              : "open"
          : stop.id === "permits"
            ? emptyPermit
              ? "locked"
              : submitted
                ? "done"
                : "open"
            : emptyOpening
              ? "locked"
              : laterDone && submitted
                ? "done"
                : submitted
                  ? "open"
                  : "locked",
  }));
  const landing: PhaseId = submitted && later.length > 0
    ? "opening"
    : sittings.length > 0
      ? "site"
      : hasPermit
        ? "permits"
        : "site";
  const phase: PhaseId =
    tabParam === "next"
      ? "opening"
      : apply
        ? "permits"
        : tabParam === "pack"
          ? "site"
          : landing;
  const phaseHasBody =
    (phase === "site" && sittings.length > 0) ||
    (phase === "permits" && hasPermit) ||
    (phase === "opening" && later.length > 0);

  useEffect(() => {
    setAnswersOpen(!quizLocked || tabParam === "answers" || !phaseHasBody);
  }, [quizLocked, tabParam, phaseHasBody]);

  const progress = v28QuizProgress(quiz);
  const showScopeResult = quizLocked && resultParam === "scope";
  const typeLead = quizLocked
    ? canWrite
      ? "These answers are confirmed. Changing them can add or remove steps."
      : "The contractor confirmed what this renovation involves."
    : canWrite
      ? "Tell us what this renovation involves. Not sure is fine — you can clear those at KickOff."
      : "The contractor fills this in before the next step opens.";

  const currentRailId = answersOpen
    ? "answers"
    : stops.some((stop) => stop.id === phase)
      ? phase
      : (stops[0]?.id ?? "answers");

  const pickRail = (id: PhaseId | "answers") => {
    if (id === "answers") {
      setAnswersOpen(true);
      onTab("answers");
      return;
    }
    setAnswersOpen(false);
    if (id === "opening") onTab("next");
    else if (id === "permits") onApply("upload");
    else onTab("pack");
  };

  const pickNested = (phaseId: string, nested: string) => {
    pickRail(phaseId as PhaseId);
    if (phaseId === "opening") setDetailId(nested);
    requestAnimationFrame(() => {
      document
        .getElementById(
          phaseId === "site" ? `v31-sitting-${nested}` : `v31-check-${nested}`,
        )
        ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    });
  };

  const railItems: ProjectRailItem[] = [
    {
      id: "answers",
      short: "Scope of Works",
      glance: "What this renovation involves.",
      tone: (quizLocked ? "done" : "open") as const,
    },
    ...stops
      .filter((stop) =>
        stop.id === "site"
          ? !emptySite
          : stop.id === "permits"
            ? !emptyPermit
            : !emptyOpening,
      )
      .map((stop) => ({
      id: stop.id,
      short: stop.short,
      glance:
        stop.id === "site"
          ? "Steps to finish before the permit application."
          : stop.id === "permits"
            ? "Attach files for this work."
            : V28_PACK_PHASE.after.why,
      tone:
        stop.tone === "locked" ? "locked" : stop.tone === "done" ? "done" : "open",
    })),
  ];

  const openingFocus =
    detailId && later.some((step) => step.id === detailId)
      ? detailId
      : (later.find((step) => closes[step.id]?.status !== "done")?.id ?? later[0]?.id);
  const openingIndex = later.findIndex((step) => step.id === openingFocus);
  const nextOpening = openingIndex >= 0 ? later[openingIndex + 1] : undefined;
  const currentOpeningDone = Boolean(
    openingFocus && closes[openingFocus]?.status === "done",
  );

  return (
    <div className="flex w-full min-w-0 flex-col gap-6 tablet:gap-8">
      {quizLocked && railItems.length > 1 && !showScopeResult ? (
      <ProjectPhaseRail
        items={railItems}
        currentId={currentRailId}
        nestedId={currentRailId === "opening" ? detailId : undefined}
        onPick={(id) => pickRail(id as PhaseId | "answers")}
        onPickNested={pickNested}
        layout="top"
      />
      ) : null}
      <div className="flex min-w-0 flex-col gap-6">
      {showScopeResult || (quizLocked && !nextStep) ? (
      <ScopeResultCard
        workTitle={selected.title}
        unitNo={unit.unitNo}
        sittings={sittings.length}
        later={later.length}
        hasPermit={hasPermit}
        permits={outcome?.permits ?? []}
        canWrite={canWrite}
        nextStep={nextStep}
        onUnlock={onUnlock}
        onNext={() => {
          if (nextStep?.id === "pack") onTab("pack");
          else if (nextStep?.id === "submit") onApply("upload");
          else if (nextStep?.id === "next") onTab("next");
        }}
      />
      ) : !quizLocked || answersOpen ? (
      <article className="overflow-hidden rounded-[var(--radius-2xl)] bg-white shadow-[var(--shadow-light-bg)]">
        <header className="flex flex-col gap-4 border-b border-grey-100 px-5 py-5 tablet:px-8 tablet:py-6">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-purple-100 text-purple-600">
              <ClipboardList className="size-6" aria-hidden />
            </span>
            <div className="min-w-0">
              <h3 className="text-lg leading-[22px] font-bold text-black">
                Scope of Works
              </h3>
              <p className="mt-1 text-sm leading-5 text-grey-600">{typeLead}</p>
            </div>
          </div>
          {answersOpen && canWrite && !quizLocked ? (
            <QuizProgress
              answered={progress.answered}
              total={progress.total}
              saved={draftSaved}
            />
          ) : null}
        </header>
        {answersOpen ? (
          <>
            <div className="px-5 py-5 tablet:px-8 tablet:py-6">
              <QuizChecklistV28
                state={quiz}
                disabled={!canWrite || quizLocked}
                locked={false}
                note={!canWrite ? undefined : null}
                intro={null}
                friendly
                onChange={(next) => {
                  setDraftSaved(false);
                  onQuiz(next);
                }}
              />
            </div>
            <StepForward
                draft={
                  canWrite && !quizLocked && v28HasSavedAnswers(quiz)
                    ? {
                        label: draftSaved ? "Draft Saved" : "Save Draft",
                        onClick: () => {
                          onQuiz(quiz);
                          setDraftSaved(true);
                        },
                      }
                    : undefined
                }
                edit={
                  quizLocked && canWrite
                    ? { label: "Edit Answers", onClick: onUnlock }
                    : undefined
                }
                label={canWrite && !quizLocked ? "Confirm" : "Next Step"}
                ready={quizLocked ? Boolean(nextStep) : canWrite && quizDone}
                onNext={() => {
                  if (!quizLocked) {
                    onLock();
                    return;
                  }
                  setAnswersOpen(false);
                  if (nextStep?.id === "pack") onTab("pack");
                  else if (nextStep?.id === "submit") onApply("upload");
                  else if (nextStep?.id === "next") onTab("next");
                }}
              />
          </>
        ) : null}
      </article>
      ) : null}

      {stops.length > 0 && !answersOpen && phaseHasBody ? (
        <>
          {phase === "site" && sittings.length > 0 ? (
            <article className="overflow-hidden rounded-[var(--radius-2xl)] bg-white shadow-[var(--shadow-light-bg)]">
              <PhaseHeader
                icon={MapPin}
                title={
                  stops.find((stop) => stop.id === "site")?.label ??
                  "Pre-application"
                }
                lead={
                  !quizLocked
                    ? beforeConfirm
                    : sittings.every((row) => closes[row.id]?.status === "done")
                      ? v33
                        ? sittings.length === 1
                          ? "This step is done."
                          : "These steps are done."
                        : "This inspection is done."
                      : v33
                        ? hasPermit
                          ? "Finish these before the permit application."
                          : "No permit is needed, but these still need doing."
                        : "This comes before the permit application."
                }
              />
              <div className="px-5 py-5 tablet:px-8 tablet:py-6">
                <StepInsetList inset>
                    {sittings.map((step, index) => {
                      const locked = !quizLocked;
                      const done = closes[step.id]?.status === "done";
                      return (
                        <StepInset
                          key={step.id}
                          id={`v31-sitting-${step.id}`}
                          inset
                          className={sittingFrameClass(done)}
                        >
                          {locked ? (
                            <h3 className="px-4 py-4 text-base leading-5 font-bold text-grey-700 tablet:px-6 tablet:py-4">
                              {v28PackCard(step).title}
                            </h3>
                          ) : (
                            <ProjectSittingCard
                              step={step}
                              role={role}
                              unit={unit}
                              v33={v33}
                              stepNo={index + 1}
                              done={done}
                              footer={
                                <StepDoneFooter
                                  done={done}
                                  canWrite={canWrite}
                                  onToggle={() => {
                                    if (done) {
                                      clearV31Step(unit.id, selected.id, step.id);
                                      return;
                                    }
                                    closeV31Step(unit.id, selected.id, step.id, "manual");
                                  }}
                                />
                              }
                            />
                          )}
                        </StepInset>
                      );
                    })}
                  </StepInsetList>
              </div>
              {quizLocked ? (
                <StepForward
                  back={() => pickRail("answers")}
                  label={
                    hasPermit || later.length > 0 ? "Next Step" : undefined
                  }
                  ready={
                    Boolean(
                      siteDone && (hasPermit || later.length > 0),
                    )
                  }
                  onNext={
                    hasPermit || later.length > 0
                      ? () => {
                          if (hasPermit) pickRail("permits");
                          else pickRail("opening");
                        }
                      : undefined
                  }
                />
              ) : null}
            </article>
          ) : null}

          {phase === "permits" && hasPermit ? (
            <SketchPermit
              work={selected}
              unit={unit}
              docs={docs}
              canWrite={canWrite}
              locked={!quizLocked}
              step={permitStep}
              grouped={v33}
              onStep={(next) => onApply(next === "checklist" ? "upload" : next)}
              nextLabel={later.length > 0 ? "Next Step" : "Finish"}
              onSubmitted={() => {
                if (later.length > 0) {
                  onTab("next");
                  return;
                }
                completeV31Work(unit.id, selected.id);
              }}
              onBack={() => onTab("pack")}
              canContinue
            />
          ) : null}

          {phase === "opening" && later.length > 0 ? (
            <article className="overflow-hidden rounded-[var(--radius-2xl)] bg-white shadow-[var(--shadow-light-bg)]">
              <PhaseHeader
                icon={DoorOpen}
                title={
                  stops.find((stop) => stop.id === "opening")?.label ??
                  "Pre-opening"
                }
                lead={
                  !submitted
                    ? quizLocked
                      ? afterPermit
                      : beforeConfirm
                    : later.every((row) => closes[row.id]?.status === "done")
                      ? "These checks are complete."
                      : `${later.filter((row) => closes[row.id]?.status === "done").length} of ${later.length} complete.`
                }
              />
              <div className="px-5 py-5 tablet:px-8 tablet:py-6">
                <StepInsetList inset>
                  {later.map((step, inner) => {
                    const done = closes[step.id]?.status === "done";
                    const locked = !submitted;
                    return (
                      <StepInset
                        key={step.id}
                        id={`v31-check-${step.id}`}
                        inset
                        focus={step.id === detailId}
                        className={sittingFrameClass(done)}
                      >
                        {locked ? (
                          <h3 className="px-4 py-4 text-base leading-5 font-bold text-grey-700 tablet:px-6 tablet:py-4">
                            {v28PackCard(step).title}
                          </h3>
                        ) : (
                          <ProjectSittingCard
                            step={step}
                            role={role}
                            unit={unit}
                            v33={v33}
                            stepNo={inner + 1}
                            done={done}
                            footer={
                              <StepDoneFooter
                                done={done}
                                canWrite={canWrite}
                                onToggle={() => {
                                  if (done) {
                                    clearV31Step(unit.id, selected.id, step.id);
                                    return;
                                  }
                                  closeV31Step(
                                    unit.id,
                                    selected.id,
                                    step.id,
                                    "manual",
                                  );
                                }}
                                note={
                                  projectDone && !nextOpening
                                    ? "This project is done."
                                    : null
                                }
                              />
                            }
                          />
                        )}
                      </StepInset>
                    );
                  })}
                </StepInsetList>
              </div>
              {submitted ? (
                <StepForward
                  back={() => {
                    if (hasPermit) onApply("upload");
                    else if (sittings.length > 0) onTab("pack");
                    else onTab("answers");
                  }}
                  label={nextOpening ? "Next Step" : "Finish"}
                  ready={
                    Boolean(
                      !projectDone &&
                        (nextOpening ? currentOpeningDone : laterDone),
                    )
                  }
                  onNext={() => {
                    if (nextOpening) {
                      setDetailId(nextOpening.id);
                      requestAnimationFrame(() => {
                        document
                          .getElementById(`v31-check-${nextOpening.id}`)
                          ?.scrollIntoView({
                            block: "nearest",
                            behavior: "smooth",
                          });
                      });
                      return;
                    }
                    completeV31Work(unit.id, selected.id);
                  }}
                />
              ) : null}
            </article>
          ) : null}
        </>
      ) : null}
      </div>
    </div>
  );
}

function WorkDetail({
  selected,
  unit,
  role,
  canWrite,
  outcome,
  docs,
  quiz,
  progress,
  edition = "v28",
  tabParam,
  resultParam,
  apply,
  onTab,
  onApply,
  onEnterSteps,
  onQuiz,
  onLock,
  onUnlock,
  onCancelEdit,
}: {
  selected: V26Work;
  unit: Unit;
  role: Role;
  canWrite: boolean;
  outcome: ReturnType<typeof v26DraftOutcome> | null;
  docs: V26ChecklistDoc[];
  quiz: QuizState;
  progress: { answered: number; total: number };
  edition?: "v28" | "v31" | "v33" | "v34" | "v35";
  tabParam: string | null;
  resultParam?: string | null;
  apply: V28ApplyStep | typeof V28_APPLY_PARTS | null;
  onTab: (tab: WorkTab) => void;
  onApply: (step: V28ApplyStep | typeof V28_APPLY_PARTS) => void;
  onEnterSteps?: () => void;
  onQuiz: (next: QuizState) => void;
  onLock: () => void;
  onUnlock: () => void;
  onCancelEdit?: () => void;
}) {
  const v37Path = usesV37Cut(useLocation().pathname);
  const hasPack = Boolean(outcome && outcome.steps.length > 0);
  const quizDone = progress.total > 0 && progress.answered >= progress.total;
  const quizLocked = quizIsConfirmed(quiz);
  const focus = v28WorkReadiness(selected, unit, role, edition).focus;
  const submitted = focus === "after";
  const v34Chrome = edition === "v34" || edition === "v35";
  const v31Chrome = edition === "v31" || edition === "v33" || v34Chrome;
  const railLabels = !v31Chrome || v34Chrome
    ? undefined
    : edition === "v33"
      ? v33RailLabels(outcome)
      : v31RailLabels(outcome?.steps ?? []);
  const nextStep = railLabels
    ? firstActionableRail(railLabels, outcome?.steps ?? [])
    : null;
  let tab: WorkTab =
    tabParam === "answers" || tabParam === "pack" || tabParam === "next"
      ? tabParam
      : quizLocked && submitted
        ? "next"
        : quizLocked && hasPack
          ? "pack"
          : "answers";
  let applyView = apply;
  if (v31Chrome && !v34Chrome && quizLocked && tab === "pack" && !applyView && !tabParam) {
    if (nextStep?.id === "submit") applyView = "checklist";
    else if (nextStep?.id !== "pack") tab = "answers";
  }
  const requested: V28RailId = applyView ? "submit" : tab;
  const rail = v28WorkRail({
    quizLocked,
    submitted,
    requested,
    partLabel:
      applyView && applyView !== V28_APPLY_PARTS
        ? V28_APPLY_STEPS.find((row) => row.id === applyView)?.label
        : undefined,
    labels: railLabels,
  });
  const showing = rail.showing;
  if (v34Chrome) {
    const readyNow = v28WorkReadiness(selected, unit, role, edition);
    const past = v31IsPast(readyNow);
    if (past && !(v37Path && resultParam === "steps")) {
      return (
        <V34PastSummary
          selected={selected}
          unit={unit}
          role={role}
          outcome={outcome}
          docs={docs}
          quiz={quiz}
          onGuide={onEnterSteps}
        />
      );
    }
    return (
      <V34JobList
        selected={selected}
        unit={unit}
        role={role}
        canWrite={canWrite && !past}
        outcome={outcome}
        docs={docs}
        quiz={quiz}
        quizLocked={quizLocked}
        quizDone={quizDone}
        apply={applyView}
        resultParam={resultParam}
        onApply={onApply}
        onClosePermit={() => onEnterSteps?.()}
        onEnterSteps={() => onEnterSteps?.()}
        onQuiz={onQuiz}
        onLock={onLock}
        onUnlock={onUnlock}
        onCancelEdit={onCancelEdit}
      />
    );
  }
  if (v31Chrome) {
    const readyNow = v28WorkReadiness(selected, unit, role, edition);
    if (v31IsPast(readyNow)) {
      return (
        <PastProjectSummary
          selected={selected}
          unit={unit}
          role={role}
          outcome={outcome}
          quiz={quiz}
          edition={edition === "v33" ? "v33" : "v31"}
          canWrite={canWrite}
          onReopen={() => {
            reopenV31Work(unit.id, selected.id);
            writeV28Submitted(unit.id, selected.id, false);
            writeV28Screen(unit.id, selected.id, { result: "idle", runs: 0 });
            if ((outcome?.permits.length ?? 0) > 0) onApply("upload");
            else onTab("pack");
          }}
        />
      );
    }
    return (
      <V31JobList
        selected={selected}
        unit={unit}
        role={role}
        canWrite={canWrite}
        outcome={outcome}
        docs={docs}
        quiz={quiz}
        tabParam={tabParam}
        apply={applyView}
        quizLocked={quizLocked}
        quizDone={quizDone}
        submitted={submitted}
        nextStep={nextStep}
        resultParam={resultParam}
        v33={edition === "v33"}
        onTab={onTab}
        onApply={onApply}
        onQuiz={onQuiz}
        onLock={onLock}
        onUnlock={onUnlock}
      />
    );
  }
  return (
    <div
      className={cn(
        "flex min-w-0 w-full flex-col gap-6",
        showing === "submit"
          ? "max-w-3xl"
          : showing === "answers"
            ? "max-w-xl"
            : "max-w-xl desktop:max-w-none",
      )}
    >
      <WorkRail rail={rail} onTab={onTab} onApply={onApply} />

      {showing === "submit" && applyView ? (
          <WorksV28Screener
            work={selected}
            unit={unit}
            role={role}
            docs={docs}
            step={applyView}
            edition={edition}
            onStep={onApply}
            onSubmitted={() => onTab("next")}
            afterResults={null}
          />
      ) : showing === "pack" || showing === "next" ? (
        hasPack && outcome ? (
          <section className="flex flex-col gap-8">
            {quizLocked ? null : (
              <DraftPackBanner
                done={quizDone}
                canWrite={canWrite}
                onAnswers={() => onTab("answers")}
                onLock={onLock}
              />
            )}
            {shownPackPhases(outcome, quizLocked, showing).map((group) => {
              const rows = outcome.steps.filter((step) => step.group === group);
              const copy = V28_PACK_PHASE[group];
              if (
                group === "application" &&
                outcome.permits.length > 0
              ) {
                return (
                  <ApplicationPack
                    key={group}
                    title={copy.title}
                    lead={copy.why}
                    permits={outcome.permits}
                    docs={docs}
                    role={role}
                    unit={unit}
                    locked={quizLocked}
                    onApply={() => onApply(V28_APPLY_PARTS)}
                  />
                );
              }
              if (rows.length === 0) return null;
              return (
                <StepSection key={group} title={copy.title} lead={copy.why}>
                  <StepInsetList inset>
                    {rows.map((step) => {
                      const card = v28PackCard(step);
                      return (
                        <StepInset key={step.id} inset>
                          <V26GuideCard
                            card={card}
                            role={role}
                            unit={unit}
                            embedded
                            sharedVoice
                            sharedFact={v28SharedFact(card)}
                            ifTheyAsk={v28IfTheyAsk(card.id)}
                            linkFact={v28LinkedFact}
                            filterSystems={v28SystemsNotInFact}
                            timingNote
                            stepsAside
                            metaBeside
                            stamp={
                              quizLocked ? undefined : V28_WORK_TABS.packDraftChip
                            }
                          />
                        </StepInset>
                      );
                    })}
                  </StepInsetList>
                </StepSection>
              );
            })}
          </section>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm leading-[18px] text-grey-600">
              {V28_WORK_TABS.packEmpty}
            </p>
            {canWrite ? (
              <button
                type="button"
                onClick={() => onTab("answers")}
                className={START_PRIMARY}
              >
                {V28_WORK_TABS.continueAnswers}
              </button>
            ) : null}
          </div>
        )
      ) : (
        <section className="flex flex-col gap-4 rounded-[var(--radius-2xl)] bg-white p-4 shadow-[var(--shadow-light-bg)] tablet:p-6">
          <AnswersStatusBanner
            status={V28_WORK_TABS.answersStatus(progress, canWrite, quizLocked)}
          />
          <QuizChecklistV28
            state={quiz}
            disabled={!canWrite || quizLocked}
            locked={false}
            note={!canWrite ? undefined : null}
            onChange={onQuiz}
          />
          {canWrite && quizDone && !quizLocked ? (
            <div className="flex border-t border-grey-100 pt-4">
              <button
                type="button"
                onClick={onLock}
                className={cn(START_PRIMARY, "w-full tablet:w-fit tablet:ml-auto")}
              >
                {V28_WORK_TABS.lockAnswers}
              </button>
            </div>
          ) : quizLocked && hasPack ? (
            <div className="flex border-t border-grey-100 pt-4">
              <button
                type="button"
                onClick={() => onTab("pack")}
                className={cn(START_PRIMARY, "w-full tablet:w-fit tablet:ml-auto")}
              >
                {V28_WORK_TABS.seeNext}
              </button>
            </div>
          ) : null}
        </section>
      )}
    </div>
  );
}


function shownPackPhases(
  outcome: NonNullable<ReturnType<typeof v26DraftOutcome>>,
  locked: boolean,
  view: V28RailId,
): V28PackPhase[] {
  const phases = visiblePackPhases(outcome);
  if (view === "next") return phases.filter((group) => group === "after");
  if (!locked) return phases;
  return phases.filter((group) => group !== "after");
}

function visiblePackPhases(
  outcome: NonNullable<ReturnType<typeof v26DraftOutcome>>,
): V28PackPhase[] {
  return (["before", "application", "after"] as const).filter((group) => {
    if (group === "application" && outcome.permits.length > 0) return true;
    return outcome.steps.some((step) => step.group === group);
  });
}

const ANSWER_TONE: Record<
  ReturnType<typeof V28_WORK_TABS.answersStatus>["tone"],
  { wash: string; chip: string }
> = {
  progress: {
    wash: "bg-purple-100",
    chip: "bg-white text-purple-700",
  },
  lock: {
    wash: "bg-warning-100",
    chip: "bg-white text-warning-800",
  },
  ready: {
    wash: "bg-success-100",
    chip: "bg-white text-success-600",
  },
};

function AnswersStatusBanner({
  status,
}: {
  status: ReturnType<typeof V28_WORK_TABS.answersStatus>;
}) {
  const tone = ANSWER_TONE[status.tone];
  return (
    <div className={cn("flex flex-col gap-3 rounded-[var(--radius-2xl)] px-4 py-4", tone.wash)}>
      <span
        className={cn(
          "w-fit rounded-full px-2 py-0.5 text-xs leading-4 font-bold",
          tone.chip,
        )}
      >
        {status.chip}
      </span>
      <p className="text-sm leading-[18px] text-grey-700">{status.body}</p>
    </div>
  );
}

function DraftPackBanner({
  done,
  canWrite,
  onAnswers,
  onLock,
}: {
  done: boolean;
  canWrite: boolean;
  onAnswers: () => void;
  onLock: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-2xl)] bg-warning-100 px-4 py-4">
      <span className="w-fit rounded-full bg-white px-2 py-0.5 text-xs leading-4 font-bold text-warning-800">
        {V28_WORK_TABS.packDraftChip}
      </span>
      <p className="text-sm leading-[18px] text-grey-700">
        {V28_WORK_TABS.packDraft(done, canWrite)}
      </p>
      {canWrite ? (
        <button
          type="button"
          onClick={done ? onLock : onAnswers}
          className={done ? START_PRIMARY : LINK}
        >
          {done ? V28_WORK_TABS.lockAnswers : V28_WORK_TABS.continueAnswers}
        </button>
      ) : null}
    </div>
  );
}

const LINK =
  "w-fit text-sm leading-[18px] font-bold text-purple-600 hover:text-purple-700 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]";

function ApplicationPack({
  title,
  lead,
  permits,
  docs,
  role,
  unit,
  locked,
  onApply,
}: {
  title: string;
  lead: string;
  permits: string[];
  docs: V26ChecklistDoc[];
  role: Role;
  unit: Unit;
  locked: boolean;
  onApply: () => void;
}) {
  const [openPermit, setOpenPermit] = useState<string | null>(null);
  const card = v28ApplyCard();
  return (
    <StepSection title={title} lead={lead}>
      <StepInset>
      <V26GuideCard
        card={card}
        role={role}
        unit={unit}
        embedded
        sharedVoice
        sharedFact={v28SharedFact(card)}
        ifTheyAsk={v28IfTheyAsk(card.id)}
        stepsAside
        metaBeside
        doorHint=""
        doorLabel={
          locked
            ? role === "tenant"
              ? V28_WORK_TABS.seePackFiles
              : V28_WORK_TABS.checkPackFiles
            : undefined
        }
        onDoorClick={locked ? onApply : undefined}
        linkFact={v28LinkedFact}
        filterSystems={v28SystemsNotInFact}
        timingNote
        stamp={locked ? undefined : V28_WORK_TABS.packDraftChip}
      >
        <div className="border-t border-grey-100 pt-3">
          <p className={SECTION_LABEL}>{V28_WORK_TABS.packContents}</p>
          <p className="mt-1 text-sm leading-[18px] text-grey-500">
            {V28_WORK_TABS.packContentsWhy}
          </p>
          <ul className="mt-1">
            {permits.map((permitName) => (
                <li
                  key={permitName}
                  className="border-t border-grey-100 first:border-t-0"
                >
                  <button
                    type="button"
                    onClick={() => setOpenPermit(permitName)}
                    className="flex w-full items-center gap-2 py-3 text-left hover:bg-grey-50 focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--color-purple-600)]"
                  >
                    <span className="min-w-0 flex-1 text-sm leading-[18px] font-bold text-black">
                      {permitName}
                    </span>
                    <span
                      aria-hidden
                      className="block size-4 shrink-0 bg-grey-400"
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
                  </button>
                </li>
            ))}
          </ul>
        </div>
      </V26GuideCard>
      </StepInset>
      {openPermit ? (
        <PackOverlay
          permit={openPermit}
          onClose={() => setOpenPermit(null)}
        />
      ) : null}
    </StepSection>
  );
}

/** Compact pack summary — count + open full list in the sheet. */
function PermitPackPreview({
  permits,
  open,
  onOpen,
}: {
  permits: string[];
  open: boolean;
  onOpen: () => void;
}) {
  const label =
    permits.length === 1
      ? "1 permit in this pack"
      : `${permits.length} permits in this pack`;

  const viewLabel =
    permits.length === 1
      ? "View permit details"
      : `View all ${permits.length} permits`;

  return (
    <button
      type="button"
      aria-expanded={open}
      aria-haspopup="dialog"
      onClick={onOpen}
      className="mt-3 flex w-full items-start gap-3 rounded-[var(--radius-lg)] border border-grey-100 bg-grey-25 px-3.5 py-3 text-left hover:bg-grey-50 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-grey-600 shadow-[inset_0_0_0_1px_var(--color-grey-100)]">
        <FileText className="size-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm leading-[18px] font-bold text-black">
          {label}
        </span>
        <span className="mt-0.5 block text-xs leading-4 text-grey-500">
          Files in this application cover these permits.
        </span>
        <span className="mt-1.5 inline-flex items-center gap-1 text-sm leading-[18px] font-bold text-purple-600">
          {viewLabel}
          <span
            aria-hidden
            className="block size-3.5 shrink-0 bg-current"
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
        </span>
      </span>
    </button>
  );
}

function PackGlanceTrigger({
  permitCount,
  documentCount,
  open,
  onOpen,
}: {
  permitCount: number;
  documentCount: number;
  open: boolean;
  onOpen: () => void;
}) {
  const pathname = useLocation().pathname;
  const permitLabel =
    permitCount === 1 ? "1 permit" : `${permitCount} permits`;
  const documentLabel =
    documentCount === 1 ? "1 document" : `${documentCount} documents`;
  const summary = [permitCount > 0 ? permitLabel : null, documentCount > 0 ? documentLabel : null]
    .filter(Boolean)
    .join(", ");

  return (
    <button
      type="button"
      aria-expanded={open}
      aria-haspopup="dialog"
      aria-label={
        summary
          ? `Preview required permits and documents: ${summary}`
          : "Preview required permits and documents"
      }
      onClick={onOpen}
      className={
        usesV37Cut(pathname)
          ? "inline-flex h-8 w-fit items-center gap-1.5 rounded-[var(--radius-sm)] text-left text-sm leading-[18px] font-bold text-purple-600 hover:text-purple-700 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
          : "w-fit text-left text-xs leading-4 font-medium text-purple-600 underline-offset-2 hover:text-purple-700 hover:underline focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
      }
    >
      {usesV37Cut(pathname) ? (
        <>
          <span
            aria-hidden
            className="block size-4 shrink-0 bg-current"
            style={{
              WebkitMaskImage: `url("${infoIcon}")`,
              maskImage: `url("${infoIcon}")`,
              WebkitMaskSize: "contain",
              maskSize: "contain",
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
            }}
          />
          See What&rsquo;s Required
        </>
      ) : usesV35Flow(pathname) ? (
        "See what's required"
      ) : (
        "Preview required permits and documents"
      )}
    </button>
  );
}

function GlanceFileList({ summary }: { summary: V35DocSummary }) {
  const rows = [
    ...summary.once.map((need) => ({ need, kind: "all" as const })),
    ...summary.each.map((need) => ({ need, kind: "each" as const })),
    ...summary.other.map((need) => ({ need, kind: "one" as const })),
  ];
  return (
    <div className="min-w-0 overflow-hidden rounded-[var(--radius-sm)] border border-grey-100 bg-white">
      <div className="flex items-center gap-3 bg-grey-25 px-3.5 py-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white text-grey-600 shadow-[inset_0_0_0_1px_var(--color-grey-100)]">
          <Files className="size-4" aria-hidden />
        </span>
        <p className="text-sm leading-[18px] font-bold text-black">
          {summary.fileCount === 1 ? "1 file to upload" : `${summary.fileCount} files to upload`}
        </p>
      </div>
      <ol className="[&>li:first-child]:border-t-0">
        {rows.map((row, index) => (
          <V37NeedRow
            key={`${row.kind}-${row.need.name}`}
            index={index}
            name={row.need.name}
            chip={
              row.kind === "all"
                ? "One for All Permits"
                : row.kind === "each"
                  ? "One per Permit"
                  : null
            }
            lead={row.need.permits.join(", ")}
            screen={v37DocumentScreen(row.need.name)}
          />
        ))}
      </ol>
    </div>
  );
}

function PackGlanceSheet({
  permits,
  documents,
  summary = null,
  onClose,
}: {
  permits: string[];
  documents: string[];
  summary?: V35DocSummary | null;
  onClose: () => void;
}) {
  const titleId = useId();
  const v35 = usesV35Flow(useLocation().pathname);
  const frame = usePhoneSheetFrame();
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end tablet:items-center tablet:justify-center tablet:p-[var(--spacing-32)] desktop:p-[var(--spacing-24)]"
      style={phoneOverlayStyle(v35 ? frame : null)}
    >
      <button
        type="button"
        aria-label="Close pack list"
        className="absolute inset-0 bg-[rgba(18,18,18,0.4)]"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={phonePanelStyle(v35 ? frame : null)}
        className={cn(
          "relative flex w-full min-h-0 flex-col overflow-hidden bg-white shadow-[var(--shadow-light-bg)]",
          "max-h-[calc(100svh-3.5rem)] rounded-t-[var(--radius-2xl)] border-t border-grey-100",
          "pb-[env(safe-area-inset-bottom)]",
          "tablet:max-h-[80vh] tablet:max-w-3xl tablet:rounded-[var(--radius-2xl)] tablet:border-0 tablet:pb-0",
          "desktop:max-h-[calc(100vh-var(--spacing-48))]",
        )}
      >
        <header className="flex items-start justify-between gap-3 border-b border-grey-75 px-4 py-4 tablet:px-5">
          <div className="min-w-0 pt-2">
            <h2
              id={titleId}
              className="text-lg leading-[22px] font-bold text-black"
            >
              Permits and Documents
            </h2>
            <p className="mt-1 text-sm leading-[18px] text-grey-600">
              What this project needs for the permit application.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-sm)] text-black hover:bg-grey-50 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
          >
            <img src={closeIcon} alt="" width={20} height={20} />
          </button>
        </header>
        <div className="scroll-visible min-h-0 flex-1 overflow-y-auto px-4 py-4 tablet:px-5">
          <div className="grid items-start gap-3">
            {permits.length > 0 ? (
              <ScopeResultNamedList
                icon={FileText}
                title={
                  permits.length === 1
                    ? "1 permit to apply for"
                    : `${permits.length} permits to apply for`
                }
                lead="Open the application to upload and screen."
                items={permits}
              />
            ) : null}
            {summary && summary.fileCount > 0 ? (
              <GlanceFileList summary={summary} />
            ) : documents.length > 0 ? (
              <ScopeResultNamedList
                icon={Files}
                title={
                  documents.length === 1
                    ? "1 document to submit"
                    : `${documents.length} documents to submit`
                }
                lead="Required for the permits in this pack."
                items={documents}
              />
            ) : null}
          </div>
        </div>
      </aside>
    </div>,
    document.body,
  );
}

function PermitListSheet({
  permits,
  onClose,
}: {
  permits: string[];
  onClose: () => void;
}) {
  const titleId = useId();
  const v35 = usesV35Flow(useLocation().pathname);
  const frame = usePhoneSheetFrame();
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end tablet:items-center tablet:justify-center tablet:p-[var(--spacing-32)]"
      style={phoneOverlayStyle(v35 ? frame : null)}
    >
      <button
        type="button"
        aria-label="Close permits"
        className="absolute inset-0 bg-[rgba(18,18,18,0.4)]"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={phonePanelStyle(v35 ? frame : null)}
        className={cn(
          "relative flex w-full min-h-0 flex-col overflow-hidden bg-white shadow-[var(--shadow-light-bg)]",
          "max-h-[calc(100svh-3.5rem)] rounded-t-[var(--radius-2xl)] border-t border-grey-100",
          "pb-[env(safe-area-inset-bottom)]",
          "tablet:max-h-[80vh] tablet:max-w-xl tablet:rounded-[var(--radius-2xl)] tablet:border-0 tablet:pb-0",
        )}
      >
        <header className="flex items-start justify-between gap-3 border-b border-grey-75 px-4 py-4 tablet:px-5">
          <div className="min-w-0 pt-2">
            <h2
              id={titleId}
              className="text-lg leading-[22px] font-bold text-black"
            >
              {permits.length === 1 ? "Permit" : `${permits.length} permits`}
            </h2>
            <p className="mt-1 text-sm leading-[18px] text-grey-600">
              What each permit covers for this project.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-sm)] text-black hover:bg-grey-50 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
          >
            <img src={closeIcon} alt="" width={20} height={20} />
          </button>
        </header>
        <ul className="min-h-0 flex-1 overflow-y-auto px-4 tablet:px-5">
          {permits.length === 0 ? (
            <li className="py-4 text-sm leading-[18px] text-grey-600">
              None for this project.
            </li>
          ) : (
            permits.map((permitName) => (
              <li
                key={permitName}
                className="border-t border-grey-100 py-3 first:border-t-0"
              >
                <p className="text-sm leading-[18px] font-bold text-black">
                  {permitName}
                </p>
                <p className="mt-1 text-sm leading-5 text-grey-600">
                  {permitAbout(permitName)}
                </p>
              </li>
            ))
          )}
        </ul>
      </aside>
    </div>,
    document.body,
  );
}

function permitAbout(name: string) {
  return (
    permitExplainFor(name)?.what ??
    "This permit is part of the application for this project."
  );
}

function PackOverlay({
  permit,
  onClose,
}: {
  permit: string;
  onClose: () => void;
}) {
  const titleId = useId();
  useEffect(() => {
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
  }, [onClose]);
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end tablet:items-center tablet:justify-center tablet:p-[var(--spacing-32)]">
      <button
        type="button"
        aria-label={`Close ${permit}`}
        className="absolute inset-0 bg-[rgba(18,18,18,0.4)]"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "relative flex w-full flex-col bg-white shadow-[var(--shadow-light-bg)]",
          "rounded-t-[var(--radius-2xl)] border-t border-grey-100",
          "tablet:max-w-xl tablet:rounded-[var(--radius-2xl)] tablet:border-0",
        )}
      >
        <header className="flex items-start justify-between gap-[var(--spacing-8)] px-[var(--spacing-16)] pt-[var(--spacing-16)] tablet:px-[var(--spacing-20)]">
          <h2
            id={titleId}
            className="min-w-0 flex-1 pt-2 text-lg leading-[22px] font-bold text-black"
          >
            {permit}
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-sm)] text-black hover:bg-grey-50 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
          >
            <img src={closeIcon} alt="" width={20} height={20} />
          </button>
        </header>
        <p className="px-[var(--spacing-16)] pt-2 pb-[var(--spacing-20)] text-sm leading-5 text-grey-600 tablet:px-[var(--spacing-20)]">
          {permitAbout(permit)}
        </p>
      </aside>
    </div>,
    document.body,
  );
}

const SECTION_LABEL =
  "text-xs leading-4 font-bold uppercase tracking-[0.08em] text-grey-400";

const START_PRIMARY =
  "inline-flex h-10 w-fit items-center justify-center rounded-[var(--radius-sm)] bg-purple-600 px-4 text-sm leading-[18px] font-bold text-white hover:bg-purple-700";

const BAR_QUIET =
  "inline-flex h-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-grey-200 bg-grey-25 px-4 text-base leading-5 font-bold text-grey-700 hover:bg-grey-50 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]";

const BAR_NEXT =
  "inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-[var(--radius-md)] bg-purple-600 px-4 text-base leading-5 font-bold text-white hover:bg-purple-700 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]";

function StepForward({
  label,
  ready = false,
  onNext,
  edit,
  draft,
  back,
  backLabel = "Back",
  arrow = true,
  fill,
}: {
  label?: string;
  ready?: boolean;
  onNext?: () => void;
  edit?: { label: string; onClick: () => void };
  draft?: { label: string; onClick: () => void };
  back?: () => void;
  backLabel?: string;
  arrow?: boolean;
  fill?: ReactNode;
}) {
  const slotRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ left: number; width: number } | null>(null);
  const [barH, setBarH] = useState(84);
  /** The bar floats over the page, so the scroll room belongs to the page, not this card. */
  const [scroller, setScroller] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    const slot = slotRef.current;
    const bar = barRef.current;
    const main = slot?.closest("main");
    if (!main || !bar) return;
    setScroller(main);
    const sync = () => {
      const r = main.getBoundingClientRect();
      if (r.width === 0) return;
      setBox({ left: r.left, width: r.width });
      setBarH(bar.getBoundingClientRect().height);
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(main);
    ro.observe(bar);
    window.addEventListener("resize", sync);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", sync);
    };
  }, []);

  return (
    <>
      <div ref={slotRef} className="hidden" aria-hidden />
      {scroller
        ? createPortal(<div style={{ height: barH }} aria-hidden />, scroller)
        : null}
      {createPortal(
      <div
        ref={barRef}
        className={cn(
          "fixed bottom-0 z-40 border-t border-grey-100 bg-white px-4 py-4 print:hidden",
          "pb-[max(16px,env(safe-area-inset-bottom))]",
          "tablet:px-8 tablet:py-5 tablet:pb-[max(20px,env(safe-area-inset-bottom))]",
          "desktop:px-10",
        )}
        data-print-hide
        style={box ? { left: box.left, width: box.width } : { left: 0, right: 0 }}
      >
        <div className={cn("flex items-center justify-end gap-4", fill && "w-full")}>
          {fill ? (
            fill
          ) : back ? (
            <button
              type="button"
              onClick={back}
              className={cn(BAR_QUIET, "mr-auto gap-1.5")}
            >
              <ArrowLeft aria-hidden size={20} />
              {backLabel}
            </button>
          ) : null}
          {fill ? null : (
          <div className="flex shrink-0 items-center gap-3">
            {draft ? (
              <button type="button" onClick={draft.onClick} className={BAR_QUIET}>
                {draft.label}
              </button>
            ) : null}
            {edit ? (
              <button type="button" onClick={edit.onClick} className={BAR_QUIET}>
                {edit.label}
              </button>
            ) : null}
            {label && onNext ? (
              <button
                type="button"
                disabled={!ready}
                onClick={onNext}
                className={cn(
                  BAR_NEXT,
                  "disabled:cursor-default disabled:bg-grey-200 disabled:text-grey-500 disabled:hover:bg-grey-200",
                )}
              >
                {label}
                {arrow ? <ArrowRight aria-hidden size={20} /> : null}
              </button>
            ) : null}
          </div>
          )}
        </div>
      </div>,
      document.body,
      )}
    </>
  );
}

function WorksList({
  role,
  unit,
  works,
  screenTick,
  canStart,
  edition = "v28",
  onStart,
  onOpen,
}: {
  role: Role;
  unit: Unit;
  works: V26Work[];
  screenTick: number;
  canStart: boolean;
  edition?: "v28" | "v31" | "v33" | "v34" | "v35";
  onStart: () => void;
  onOpen: (work: V26Work) => void;
}) {
  const rows = works.map((work) => ({
    work,
    ready: v28WorkReadiness(
      work,
      (typeof window !== "undefined" && usesV37Cut(window.location.pathname)
        ? v37UnitById(work.unitId)
        : null) ?? unit,
      role,
      edition,
    ),
  }));
  void screenTick;
  if (edition === "v35") {
    return (
      <V35ProjectsList
        role={role}
        unit={unit}
        rows={rows}
        onStart={onStart}
        onOpen={onOpen}
      />
    );
  }
  if (edition === "v31" || edition === "v33" || edition === "v34") {
    return (
      <V31ProjectsList
        role={role}
        unit={unit}
        rows={rows}
        onStart={onStart}
        onOpen={onOpen}
      />
    );
  }
  const toFinish = rows.filter((row) => row.ready.needsYou);
  const earlier = rows.filter((row) => !row.ready.needsYou);

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <section className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-3">
          <p className={SECTION_LABEL}>To finish</p>
          {canStart && toFinish.length > 0 ? (
            <button
              type="button"
              onClick={onStart}
              className="text-sm leading-[18px] font-bold text-purple-600 hover:text-purple-700"
            >
              Start a Work
            </button>
          ) : null}
        </div>
        {toFinish.length === 0 ? (
          <div className="flex flex-col gap-3 rounded-[var(--radius-2xl)] bg-white p-4 shadow-[var(--shadow-light-bg)] tablet:p-6">
            <p className="text-sm leading-[18px] text-grey-700">
              Nothing to finish on this unit. Start a work when the next
              renovation begins.
            </p>
            {canStart ? (
              <button type="button" onClick={onStart} className={START_PRIMARY}>
                Start a Work
              </button>
            ) : null}
          </div>
        ) : (
          <ul className="overflow-hidden rounded-[var(--radius-2xl)] bg-white shadow-[var(--shadow-light-bg)]">
            {toFinish.map(({ work, ready }) => (
              <WorkRow
                key={work.id}
                ready={ready}
                onOpen={() => onOpen(work)}
              />
            ))}
          </ul>
        )}
      </section>
      {earlier.length > 0 ? (
        <section className="flex flex-col gap-3">
          <p className={SECTION_LABEL}>Earlier</p>
          <ul className="overflow-hidden rounded-[var(--radius-2xl)] bg-white shadow-[var(--shadow-light-bg)]">
            {earlier.map(({ work, ready }) => (
              <WorkRow
                key={work.id}
                ready={ready}
                onOpen={() => onOpen(work)}
              />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

const CHIP_TONE = V31_CHIP_TONE;
const URGENCY_DOT = {
  urgent: "text-warning-600",
  close: "text-success-600",
  next: "text-blue-600",
  later: "text-grey-400",
} as const;
const URGENCY_CHIP = {
  urgent: "bg-warning-200 text-warning-900",
  close: "bg-success-200 text-success-800",
  next: "bg-blue-200 text-blue-700",
  later: "bg-grey-75 text-grey-700",
} as const;

const SETTINGS_CARD =
  "overflow-hidden rounded-[var(--radius-2xl)] border border-grey-100 bg-white";
const PROJECT_GRID =
  "grid grid-cols-1 items-stretch gap-3 tablet:grid-cols-2";

type V31ListTab = "ongoing" | "past" | "archived";

function V31ListTabs({
  tab,
  counts,
  showArchived,
  onChange,
}: {
  tab: V31ListTab;
  counts: Record<V31ListTab, number>;
  showArchived: boolean;
  onChange: (tab: V31ListTab) => void;
}) {
  const items: { id: V31ListTab; label: string }[] = [
    { id: "ongoing", label: "Ongoing" },
    { id: "past", label: "Past" },
    ...(showArchived ? [{ id: "archived" as const, label: "Archived" }] : []),
  ];
  return (
    <div
      role="tablist"
      aria-label="Project lists"
      className="flex min-w-0"
    >
      {items.map((item) => {
        const on = item.id === tab;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(item.id)}
            className={cn(
              "relative inline-flex h-11 shrink-0 items-center gap-1 px-4 text-sm leading-[18px]",
              "focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--color-purple-600)]",
              on
                ? "font-bold text-purple-600 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-purple-600"
                : "text-grey-500 hover:text-grey-700",
            )}
          >
            {item.label}
            <span
              className={cn(
                "text-xs font-normal tabular-nums",
                on ? "text-purple-400" : "text-grey-400",
              )}
            >
              {counts[item.id]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

const QUIET_BUTTON =
  "inline-flex h-10 w-fit items-center justify-center rounded-[var(--radius-sm)] border border-grey-200 bg-white px-4 text-sm leading-[18px] font-bold text-black hover:bg-grey-50 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]";

function V31ProjectsList({
  role,
  unit,
  rows,
  onStart,
  onOpen,
}: {
  role: Role;
  unit: Unit;
  rows: { work: V26Work; ready: V28WorkReadiness }[];
  onStart: () => void;
  onOpen: (work: V26Work) => void;
}) {
  const unitId = unit.id;
  const [archivedIds, setArchivedIds] = useState<string[]>(() =>
    readV31Archived(unitId),
  );
  const [deletedIds, setDeletedIds] = useState<string[]>(() =>
    readV31Deleted(unitId),
  );
  const [pending, setPending] = useState<{
    id: string;
    kind: "archive" | "delete";
  } | null>(null);
  const [tab, setTab] = useState<V31ListTab>("ongoing");
  const canOpen = role === "contractor";

  useEffect(() => {
    const refresh = () => {
      setArchivedIds(readV31Archived(unitId));
      setDeletedIds(readV31Deleted(unitId));
    };
    refresh();
    window.addEventListener(V31_ARCHIVED_CHANGED, refresh);
    window.addEventListener(V31_DELETED_CHANGED, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(V31_ARCHIVED_CHANGED, refresh);
      window.removeEventListener(V31_DELETED_CHANGED, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [unitId]);

  const forgotten = new Set(deletedIds);
  const ordered = [...rows]
    .filter((row) => !forgotten.has(row.work.id))
    .sort((a, b) => {
      if (v31IsPast(a.ready) && v31IsPast(b.ready)) {
        return b.work.createdAt.localeCompare(a.work.createdAt);
      }
      const cueA = v31ProjectCue(a.work, a.ready, role, unit);
      const cueB = v31ProjectCue(b.work, b.ready, role, unit);
      const rank =
        v31UrgencyRank(a.ready, cueA) - v31UrgencyRank(b.ready, cueB);
      if (rank !== 0) return rank;
      return a.ready.title.localeCompare(b.ready.title);
    });
  const archived = new Set(archivedIds);
  const live = ordered.filter((row) => !archived.has(row.work.id));
  const ongoing = live.filter((row) => !v31IsPast(row.ready));
  const past = live.filter((row) => v31IsPast(row.ready));
  const stored = ordered.filter((row) => archived.has(row.work.id));

  const archive = (id: string) => {
    setV31Archived(unitId, [...new Set([...archivedIds, id])]);
    setPending(null);
  };
  const restore = (id: string) => {
    setV31Archived(
      unitId,
      archivedIds.filter((row) => row !== id),
    );
  };
  const remove = (id: string) => {
    dropV31Work(unitId, id);
    deleteV26Work(unitId, id);
    setPending(null);
  };

  const firstProject = live.length === 0;
  const shown =
    tab === "past" ? past : tab === "archived" ? stored : ongoing;
  const empty =
    tab === "past"
      ? "No finished project on this unit yet."
      : tab === "archived"
        ? "Nothing archived on this unit."
        : "Nothing in progress on this unit.";

  useEffect(() => {
    if (tab === "archived" && stored.length === 0) setTab("ongoing");
  }, [tab, stored.length]);

  const projectRow = (
    { work, ready }: (typeof rows)[number],
    place?: { lead?: boolean },
  ) => (
    <V31ProjectRow
      key={work.id}
      work={work}
      ready={ready}
      role={role}
      unit={unit}
      canDelete={canOpen && !v31IsPast(ready)}
      pending={pending?.id === work.id ? pending.kind : null}
      lead={place?.lead}
      onOpen={() => onOpen(work)}
      onAskArchive={() => setPending({ id: work.id, kind: "archive" })}
      onAskDelete={() => setPending({ id: work.id, kind: "delete" })}
      onCancel={() => setPending(null)}
      onArchive={() => archive(work.id)}
      onDelete={() => remove(work.id)}
    />
  );

  return (
    <div className="col-span-full flex w-full min-w-0 flex-col gap-3">
      {canOpen ? (
        <button
          type="button"
          id="v31-start-guide"
          onClick={onStart}
          className="group flex w-full items-center gap-3 rounded-[var(--radius-2xl)] border border-grey-100 bg-white px-4 py-4 text-left transition-colors hover:border-purple-300 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)] tablet:gap-4 tablet:px-5 tablet:py-5"
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-[var(--radius-md)] bg-purple-100 text-purple-600">
            <span
              aria-hidden
              className="block bg-current"
              style={{
                width: 18,
                height: 21.4,
                WebkitMaskImage: `url("${projectsIcon}")`,
                maskImage: `url("${projectsIcon}")`,
                WebkitMaskSize: "contain",
                maskSize: "contain",
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                maskPosition: "center",
              }}
            />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-lg leading-[22px] font-bold text-black">
              Create a New Project
            </span>
            <span className="mt-1 block text-sm leading-5 text-grey-600">
              {firstProject
                ? "This starts the opening fit-out. Name the project and say what it is for."
                : "Name it yourself, or it takes its name from the scope you pick."}
            </span>
          </span>
          <span
            aria-hidden
            className="grid size-9 shrink-0 place-items-center rounded-[var(--radius-md)] border border-purple-600 bg-purple-600 text-white group-hover:bg-purple-700"
          >
            <Plus size={20} aria-hidden />
          </span>
        </button>
      ) : null}
      <header>
        <V31ListTabs
          tab={stored.length === 0 && tab === "archived" ? "ongoing" : tab}
          counts={{
            ongoing: ongoing.length,
            past: past.length,
            archived: stored.length,
          }}
          showArchived={stored.length > 0}
          onChange={setTab}
        />
      </header>
      <div role="tabpanel" className="flex flex-col gap-3">
        {shown.length === 0 ? (
          <p
            className={cn(
              SETTINGS_CARD,
              "px-4 py-6 text-sm leading-[18px] text-grey-600 tablet:px-6",
            )}
          >
            {empty}
          </p>
        ) : tab === "archived" ? (
          <ul className={PROJECT_GRID}>
            {shown.map(({ work, ready }) => (
              <li
                key={work.id}
                className={cn(
                  SETTINGS_CARD,
                  "group flex min-w-0 flex-col gap-2 px-4 py-3 transition-colors hover:border-purple-400 hover:bg-purple-200 tablet:px-5",
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => onOpen(work)}
                    className="min-w-0 text-left text-base leading-5 font-bold text-black group-hover:text-purple-700 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
                  >
                    {ready.title}
                  </button>
                  <RowMenu
                    label={`Actions for ${ready.title}`}
                    items={[
                      {
                        id: "restore",
                        label: "Restore",
                        onSelect: () => restore(work.id),
                      },
                      ...(canOpen
                        ? [
                            {
                              id: "delete",
                              label: "Delete",
                              onSelect: () =>
                                setPending({ id: work.id, kind: "delete" }),
                            },
                          ]
                        : []),
                    ]}
                  />
                </div>
                {pending?.id === work.id && pending.kind === "delete" ? (
                  <div className="flex flex-col gap-3 rounded-[var(--radius-md)] bg-grey-50 p-3">
                    <p className="text-sm leading-5 text-grey-700">
                      Delete {ready.title}? It leaves this unit. This cannot be undone.
                    </p>
                    <span className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => remove(work.id)}
                        className={START_PRIMARY}
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setPending(null)}
                        className={QUIET_BUTTON}
                      >
                        Cancel
                      </button>
                    </span>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <ul className={SETTINGS_CARD}>
            {shown.map((row, rowIndex) =>
              projectRow(
                row,
                tab === "ongoing" && rowIndex === 0 ? { lead: true } : undefined,
              ),
            )}
          </ul>
        )}
      </div>
    </div>
  );
}

function QuizProgress({
  answered,
  total,
  saved,
}: {
  answered: number;
  total: number;
  saved: boolean;
}) {
  const left = Math.max(0, total - answered);
  const done = total > 0 && answered >= total;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm leading-5 text-grey-700">
          <span className="text-lg leading-[22px] font-bold text-purple-700">
            {answered}
          </span>{" "}
          of {total} answered
        </p>
        <p
          className={cn(
            "shrink-0 text-sm leading-5 font-bold",
            done ? "text-success-600" : "text-purple-700",
          )}
        >
          {done ? "Ready to confirm" : `${left} left`}
        </p>
      </div>
      <ListFillTrack done={answered} total={total} />
      {saved ? (
        <p className="text-xs leading-4 text-grey-500">Draft saved</p>
      ) : null}
    </div>
  );
}

function ListFillTrack({ done, total }: { done: number; total: number }) {
  const pct = total <= 0 ? 0 : Math.min(100, Math.round((done / total) * 100));
  const complete = total > 0 && done >= total;
  return (
    <span
      className="flex h-2 w-full overflow-hidden rounded-full bg-purple-100"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={done}
      aria-label={`${done} of ${total}`}
    >
      <span
        className={cn(
          "h-full rounded-full",
          complete ? "bg-success-600" : "bg-purple-600",
        )}
        style={{ width: `${pct}%` }}
      />
    </span>
  );
}

function V31ProjectRow({
  work,
  ready,
  role,
  unit,
  canDelete,
  pending,
  step,
  lead,
  onOpen,
  onAskArchive,
  onAskDelete,
  onCancel,
  onArchive,
  onDelete,
}: {
  work: V26Work;
  ready: V28WorkReadiness;
  role: Role;
  unit: Unit;
  canDelete: boolean;
  pending: "archive" | "delete" | null;
  step?: number;
  stage?: string;
  lead?: boolean;
  onOpen: () => void;
  onAskArchive: () => void;
  onAskDelete: () => void;
  onCancel: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const viewOnly = isV34Path(useLocation().pathname) && role === "tenant";
  const cue = v31ProjectCue(work, ready, role, unit);
  const urgency = v31UrgencyBand(v31UrgencyRank(ready, cue));
  const flagged = cue.tone === "issue";
  const waiting = cue.action.startsWith("Waiting");
  const settled = cue.tone === "quiet" && !waiting;
  const about = v28TextValue(
    hydrateV28FromLegacy(work.quiz, unit),
    "q-about",
  ).trim();
  const note =
    waiting && cue.detail && cue.detail !== cue.action
      ? cue.detail
      : undefined;
  const waitingTone = v31WaitingChipTone(note, cue.tone);
  const first = lead || step === 1;

  return (
    <li
      className={cn(
        "group relative flex flex-col gap-2 border-t border-grey-100 px-4 py-3 first:border-transparent hover:bg-purple-100 tablet:px-5",
      )}
    >
      <div className="relative grid grid-cols-[minmax(0,1fr)_auto] items-start gap-1 desktop:grid-cols-12 desktop:items-center desktop:gap-6">
      <button
        type="button"
        onClick={onOpen}
        className="absolute inset-0 z-[1] cursor-pointer focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
        aria-label={`${ready.title}. ${cue.action}`}
      />
      <span className="flex min-w-0 items-start gap-3 desktop:col-span-7 desktop:row-start-1">
          {step ? (
            <span
              className={cn(
                "grid size-6 shrink-0 place-items-center rounded-full text-xs leading-4 font-bold",
                first
                  ? "bg-purple-600 text-white"
                  : "bg-white text-grey-700 ring-1 ring-grey-400",
              )}
            >
              {step}
            </span>
          ) : (
            <StatusDot
              className={cn(
                "mt-1.5 desktop:mt-1.5",
                flagged ? "text-error-600" : URGENCY_DOT[urgency],
              )}
            />
          )}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-base leading-5 font-bold text-black group-hover:text-purple-700">
              {ready.title}
            </span>
            {about ? (
              <span
                className="mt-1 block truncate text-sm leading-[18px] text-grey-600"
                title={about}
              >
                {about}
              </span>
            ) : null}
          </span>
      </span>
      <span className="relative z-[2] desktop:col-span-1 desktop:col-start-12 desktop:row-start-1 desktop:justify-self-end">
      {viewOnly ? null : (
        <RowMenu
          label={`Actions for ${ready.title}`}
          items={[
            { id: "archive", label: "Archive", onSelect: onAskArchive },
            ...(canDelete
              ? [{ id: "delete", label: "Delete", onSelect: onAskDelete }]
              : []),
          ]}
        />
      )}
      </span>
      <span className="relative z-[2] col-span-2 flex min-w-0 max-w-full items-center pl-5 desktop:col-span-4 desktop:col-start-8 desktop:row-start-1 desktop:pl-0">
        {waiting ? (
          <CueStatusChip
            label={note ?? cue.action}
            note={note ? cue.action : undefined}
            toneClass={V31_CHIP_TONE[waitingTone]}
          />
        ) : (
          <span
            className={cn(
              "inline-flex h-6 max-w-full items-center rounded-full px-2 text-xs leading-4 font-bold whitespace-nowrap",
              flagged
                ? "bg-error-200 text-error-600"
                : settled
                  ? V31_CHIP_TONE.quiet
                  : URGENCY_CHIP[urgency],
            )}
          >
            <span className="truncate">{cue.action}</span>
          </span>
        )}
      </span>
      </div>
      {pending === "archive" || pending === "delete" ? (
        <div className="flex flex-col gap-3 rounded-[var(--radius-md)] bg-grey-50 p-3">
          <p className="text-sm leading-5 text-grey-700">
            {pending === "archive"
              ? `Archive ${ready.title}? It leaves this list. You can restore it from Archived.`
              : `Delete ${ready.title}? It leaves this unit. This cannot be undone.`}
          </p>
          <span className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={pending === "archive" ? onArchive : onDelete}
              className={START_PRIMARY}
            >
              {pending === "archive" ? "Archive" : "Delete"}
            </button>
            <button type="button" onClick={onCancel} className={QUIET_BUTTON}>
              Cancel
            </button>
          </span>
        </div>
      ) : null}
    </li>
  );
}

function RowMenu({
  label,
  items,
}: {
  label: string;
  items: { id: string; label: string; onSelect: () => void }[];
}) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [box, setBox] = useState<{ top: number; right: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    const place = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      setBox({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    };
    place();
    const close = () => setOpen(false);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("resize", place);
    window.addEventListener("scroll", close, true);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", close, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="grid size-8 shrink-0 place-items-center rounded-[var(--radius-sm)] text-grey-700 hover:bg-white focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
      >
        <MoreHorizontal aria-hidden size={16} />
      </button>
      {open && box
        ? createPortal(
            <>
              <button
                type="button"
                aria-label="Close actions"
                className="fixed inset-0 z-40 cursor-default"
                onClick={() => setOpen(false)}
              />
              <div
                role="menu"
                aria-label={label}
                style={{ top: box.top, right: box.right }}
                className="fixed z-50 min-w-40 overflow-hidden rounded-[var(--radius-md)] bg-white py-1 shadow-[var(--shadow-light-bg)]"
              >
                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setOpen(false);
                      item.onSelect();
                    }}
                    className="flex w-full px-3 py-2 text-left text-sm leading-[18px] font-bold text-black hover:bg-grey-50 focus-visible:outline-none focus-visible:bg-grey-50"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </>,
            document.body,
          )
        : null}
    </>
  );
}

function WorkRow({
  ready,
  onOpen,
}: {
  ready: V28WorkReadiness;
  onOpen: () => void;
}) {
  const gateLabel = `${ready.gatesDone} of ${ready.gatesTotal}`;
  return (
    <li className="border-t border-grey-100 first:border-t-0">
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full flex-col gap-3 px-4 py-4 text-left hover:bg-grey-50"
      >
        <span className="flex items-start justify-between gap-3">
          <span className="min-w-0 text-base leading-5 font-bold text-black">
            {ready.title}
          </span>
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-xs leading-4 font-bold",
              CHIP_TONE[ready.tone],
            )}
          >
            {ready.chip}
          </span>
        </span>
        {ready.showBar ? (
          <span className="flex flex-col gap-2">
            <span
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={ready.gatesTotal}
              aria-valuenow={ready.gatesDone}
              aria-label={`${ready.nextMove}, ${gateLabel}`}
              className="block h-1 overflow-hidden rounded-full bg-grey-100"
            >
              <span
                className="block h-full rounded-full bg-purple-600"
                style={{
                  width: `${(ready.gatesDone / ready.gatesTotal) * 100}%`,
                }}
              />
            </span>
            <span className="text-sm leading-[18px] text-grey-500">
              {ready.countLabel}
              <span className="text-grey-400"> · {ready.started}</span>
            </span>
          </span>
        ) : (
          <span className="text-sm leading-[18px] text-grey-500">
            {ready.countLabel}
            <span className="text-grey-400"> · {ready.started}</span>
          </span>
        )}
      </button>
    </li>
  );
}
