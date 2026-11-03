import { useEffect, useId, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useSearchParams } from "react-router-dom";
import { useApp, type Role } from "@/lib/app-state";
import type { Unit } from "@/lib/tenancy-data";
import {
  CONTRACTOR_JOBS,
  LS_JOB,
  LS_OUTLET,
} from "@/lib/process-job-context";
import {
  readV26OutletStory,
  v26UnitsForStory,
  V26_OUTLET_CHANGED,
} from "@/lib/process-v26-outlets";
import {
  completeAnswers,
  settleQuizWrite,
} from "@/lib/process-planned-works-quiz";
import { setV25Check, setV25Choice, setV25YesNo } from "@/lib/process-v25-quiz";
import {
  stampV26UnitFacts,
  v26QuizProgress,
  v26QuizSectionsFor,
} from "@/lib/process-v26-quiz";
import { QuizChecklistV25 } from "@/components/dls/QuizChecklistV25";
import {
  markV26Preview,
  processV26Href,
  screenerV26Href,
} from "@/lib/process-v26-preview";
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
  v26DraftStepCard,
  v26PermitCard,
  V26_GROUP_LABEL,
  v26WorkListTitle,
  v26WorkNeedsYou,
  v26WorkNextAction,
  v26WorkStatusLabel,
  V26_WORKS_CHANGED,
  readV26Works,
  type V26Work,
} from "@/lib/process-v26-works";
import { V26GuideCard } from "@/pages/v26-guide-card";
import {
  StepCardShell,
  StepCardTitle,
} from "@/components/dls/StepCardShell";
import caretDown from "@/assets/figma/caret-down.svg";
import closeIcon from "@/assets/figma/x-close.svg";
import { cn } from "@/lib/utils";

const BACK =
  "inline-flex w-fit items-center gap-1 text-sm leading-[18px] font-bold text-purple-600 hover:text-purple-700 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]";

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
  const { role, unit, setUnit, effectiveUnit } = useApp();
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

  return { role, ctxUnit };
}

function persistWork(unit: Unit, work: V26Work, nextQuiz: V26Work["quiz"]) {
  const stamped = stampV26UnitFacts(nextQuiz, unit);
  const answers = completeAnswers(stamped.answers);
  const settled = settleQuizWrite(
    { ...stamped, answers, confirmed: false },
    unit,
  );
  return upsertV26Work(unit.id, { ...work, quiz: settled });
}

export function WorksV26Page() {
  const { role, ctxUnit } = useV26Unit();
  const [params, setParams] = useSearchParams();
  const [works, setWorks] = useState<V26Work[]>([]);
  const selectedId = params.get("work");

  useEffect(() => {
    markV26Preview();
    const refresh = () => {
      seedV26Works(ctxUnit.id);
      setWorks(readV26Works(ctxUnit.id));
    };
    refresh();
    window.addEventListener(V26_WORKS_CHANGED, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(V26_WORKS_CHANGED, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [ctxUnit.id]);

  const selected = selectedId
    ? (works.find((row) => row.id === selectedId) ?? null)
    : null;

  const visible = [...works]
    .filter((work) => !isV26EmptyStockSlot(work))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const canWrite = Boolean(selected && canFillV26Work(role));
  const outcome = selected
    ? v26DraftOutcome(selected, role, ctxUnit)
    : null;
  const docs = outcome ? v26DocumentChecklist(outcome.permits, role) : [];
  const progress = selected
    ? v26QuizProgress(selected.quiz, ctxUnit)
    : { answered: 0, total: 0 };

  const openWork = (work: V26Work) => {
    const next = new URLSearchParams();
    next.set("work", work.id);
    setParams(next);
  };

  const start = () => {
    const work = startV26Work(ctxUnit.id);
    setWorks(readV26Works(ctxUnit.id));
    openWork(work);
  };

  const processBack = processV26Href({
    view: role === "contractor" ? "works" : undefined,
  });

  return (
    <div className="dls-page flex flex-col gap-6 !pt-5 tablet:!pt-8">
      <header className="flex max-w-xl flex-col gap-3">
        {selected ? (
          <button
            type="button"
            onClick={() => setParams(new URLSearchParams())}
            className={BACK}
          >
            <BackArrow />
            All works
          </button>
        ) : (
          <Link to={processBack} className={BACK}>
            <BackArrow />
            Back to Process
          </Link>
        )}
        <div className="flex flex-col gap-2">
          <p className="text-xs leading-4 font-bold uppercase tracking-[0.08em] text-grey-400">
            Works
          </p>
          <h1 className="text-[28px] leading-9 font-bold text-black">
            {selected ? v26WorkListTitle(selected) : "Works"}
          </h1>
          <p className="text-sm leading-[18px] text-grey-500">
            {selected
              ? `${ctxUnit.unitNo} · ${v26WorkStatusLabel(selected)}`
              : `${ctxUnit.unitNo} · Confirm the pack, then apply in OneCalendar`}
          </p>
          {selected && role === "tenant" ? (
            <p className="text-sm leading-[18px] text-grey-700">
              Your contractor fills this. You can read the answers.
            </p>
          ) : null}
        </div>
      </header>

      {!selected ? (
        <WorksList
          role={role}
          toFinish={visible.filter(v26WorkNeedsYou)}
          earlier={visible.filter((work) => !v26WorkNeedsYou(work))}
          canStart={canStartV26Work(role)}
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
          progress={progress}
          tabParam={params.get("tab")}
          onTab={(tab) => {
            const next = new URLSearchParams(params);
            next.set("work", selected.id);
            next.set("tab", tab);
            setParams(next);
          }}
          onChoice={(id, value) => {
            persistWork(
              ctxUnit,
              selected,
              setV25Choice(selected.quiz, id, value),
            );
            setWorks(readV26Works(ctxUnit.id));
          }}
          onCheck={(id, slug) => {
            persistWork(
              ctxUnit,
              selected,
              setV25Check(selected.quiz, id, slug),
            );
            setWorks(readV26Works(ctxUnit.id));
          }}
          onYesNo={(field, yes) => {
            persistWork(
              ctxUnit,
              selected,
              setV25YesNo(selected.quiz, field, yes),
            );
            setWorks(readV26Works(ctxUnit.id));
          }}
        />
      )}
    </div>
  );
}

type WorkTab = "pack" | "answers";

function WorkDetail({
  selected,
  unit,
  role,
  canWrite,
  outcome,
  docs,
  progress,
  tabParam,
  onTab,
  onChoice,
  onCheck,
  onYesNo,
}: {
  selected: V26Work;
  unit: Unit;
  role: Role;
  canWrite: boolean;
  outcome: ReturnType<typeof v26DraftOutcome> | null;
  docs: V26ChecklistDoc[];
  progress: { answered: number; total: number };
  tabParam: string | null;
  onTab: (tab: WorkTab) => void;
  onChoice: (id: string, value: string) => void;
  onCheck: (id: string, slug: string) => void;
  onYesNo: (field: string, yes: boolean) => void;
}) {
  const hasPack = Boolean(outcome && outcome.steps.length > 0);
  const tab: WorkTab =
    tabParam === "answers" || tabParam === "pack"
      ? tabParam
      : hasPack
        ? "pack"
        : "answers";

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <div
        role="tablist"
        aria-label="This work"
        className="-mb-2 flex w-full border-b border-grey-100"
      >
        {(
          [
            {
              id: "pack" as const,
              label: "Pack",
              count: hasPack ? outcome?.permits.length : undefined,
            },
            { id: "answers" as const, label: "Answers" },
          ] as const
        ).map((row) => {
          const on = row.id === tab;
          return (
            <button
              key={row.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => onTab(row.id)}
              className={cn(
                "relative inline-flex h-11 items-center gap-1 px-4 text-sm leading-[18px]",
                "focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--color-purple-600)]",
                on
                  ? "font-bold text-purple-600 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-purple-600"
                  : "text-grey-500 hover:text-grey-700",
              )}
            >
              {row.label}
              {"count" in row && row.count != null ? (
                <span
                  className={cn(
                    "text-xs font-normal tabular-nums",
                    on ? "text-purple-400" : "text-grey-400",
                  )}
                >
                  {row.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {tab === "pack" ? (
        hasPack && outcome ? (
          <section className="flex flex-col gap-8">
            {(["before", "application", "after"] as const).map((group) => {
              const rows = outcome.steps.filter((step) => step.group === group);
              if (
                group === "application" &&
                outcome.permits.length > 0
              ) {
                return (
                  <ApplicationPack
                    key={group}
                    permits={outcome.permits}
                    docs={docs}
                    href={screenerV26Href(selected.id)}
                    role={role}
                    unit={unit}
                  />
                );
              }
              if (rows.length === 0) return null;
              return (
                <div key={group} className="flex flex-col gap-3">
                  <h3 className="text-xs leading-4 font-bold uppercase tracking-[0.08em] text-grey-400">
                    {V26_GROUP_LABEL[group]}
                  </h3>
                  <div className="flex flex-col gap-3">
                    {rows.map((step) => (
                      <V26GuideCard
                        key={step.id}
                        card={v26DraftStepCard(step)}
                        role={role}
                        unit={unit}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </section>
        ) : (
          <p className="text-sm leading-[18px] text-grey-600">
            Tick what this work involves. The pack appears here.
          </p>
        )
      ) : (
        <section className="flex flex-col gap-4 rounded-[var(--radius-2xl)] bg-white p-4 shadow-[var(--shadow-light-bg)] tablet:p-6">
          <p className="text-sm leading-[18px] text-grey-700">
            Why this pack looks like this. {progress.answered} of{" "}
            {progress.total} answered
            {canWrite ? " · Draft updates as you tick" : ""}.
          </p>
          <QuizChecklistV25
            state={selected.quiz}
            unit={unit}
            sections={v26QuizSectionsFor(unit)}
            disabled={!canWrite}
            locked={false}
            onChoice={onChoice}
            onCheck={onCheck}
            onYesNo={onYesNo}
          />
        </section>
      )}
    </div>
  );
}

function fileCountLabel(count: number) {
  if (count === 0) return "No extra file";
  if (count === 1) return "1 file";
  return `${count} files`;
}

function packCountLabel(permits: number, files: number) {
  return `${permits} ${permits === 1 ? "permit" : "permits"} · ${files} ${files === 1 ? "file" : "files"}`;
}

function ApplicationPack({
  permits,
  docs,
  href,
  role,
  unit,
}: {
  permits: string[];
  docs: V26ChecklistDoc[];
  href: string;
  role: Role;
  unit: Unit;
}) {
  const [showPack, setShowPack] = useState(false);
  const [openPermit, setOpenPermit] = useState<string | null>(null);
  const summary = packCountLabel(permits.length, docs.length);
  return (
    <div className="flex flex-col gap-[var(--spacing-8)]">
      <h3 className="text-xs leading-4 font-bold uppercase tracking-[0.08em] text-grey-400">
        {V26_GROUP_LABEL.application}
      </h3>
      <StepCardShell>
        <div className="flex flex-col gap-[var(--spacing-8)]">
          <StepCardTitle>Permit application</StepCardTitle>
          <p className="text-sm leading-[18px] text-grey-500">
            Submit these together in OneCalendar.
          </p>
        </div>
        <Link
          to={href}
          className="inline-flex h-10 w-fit items-center justify-center rounded-[var(--radius-sm)] bg-purple-600 px-[var(--spacing-16)] text-sm leading-[18px] font-bold text-white hover:bg-purple-700"
        >
          Attach documents and apply
        </Link>
        <div
          className={cn(
            "-mx-[var(--spacing-16)] -mb-[var(--spacing-16)]",
            "rounded-b-[var(--radius-2xl)] border-t border-grey-100 bg-grey-50 px-[var(--spacing-16)]",
            "tablet:-mx-[var(--spacing-24)] tablet:-mb-[var(--spacing-24)]",
            "tablet:px-[var(--spacing-24)]",
          )}
        >
          <button
            type="button"
            aria-haspopup="dialog"
            aria-expanded={showPack}
            onClick={() => setShowPack(true)}
            className={cn(
              "flex w-full items-center gap-[var(--spacing-8)] py-[var(--spacing-16)] text-left",
              "focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--color-purple-600)]",
            )}
          >
            <span className="text-xs leading-4 font-bold uppercase tracking-[0.08em] text-grey-400">
              In this pack
            </span>
            <span className="min-w-0 flex-1 truncate text-xs leading-4 text-grey-500">
              {summary}
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
        </div>
      </StepCardShell>
      {showPack ? (
        <PackOverlay
          permits={permits}
          docs={docs}
          role={role}
          unit={unit}
          openPermit={openPermit}
          onOpenPermit={setOpenPermit}
          onClose={() => {
            setShowPack(false);
            setOpenPermit(null);
          }}
        />
      ) : null}
    </div>
  );
}

function PackOverlay({
  permits,
  docs,
  role,
  unit,
  openPermit,
  onOpenPermit,
  onClose,
}: {
  permits: string[];
  docs: V26ChecklistDoc[];
  role: Role;
  unit: Unit;
  openPermit: string | null;
  onOpenPermit: (name: string | null) => void;
  onClose: () => void;
}) {
  const titleId = useId();
  const title = openPermit ?? "In this pack";
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (openPermit) onOpenPermit(null);
      else onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [openPermit, onClose, onOpenPermit]);
  const files = openPermit
    ? docs.filter((row) => row.permitName === openPermit)
    : [];
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end tablet:items-center tablet:justify-center tablet:p-[var(--spacing-32)]">
      <button
        type="button"
        aria-label={`Close ${title}`}
        className="absolute inset-0 bg-[rgba(18,18,18,0.4)]"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "relative flex w-full flex-col bg-white shadow-[var(--shadow-light-bg)]",
          "max-h-[90vh] rounded-t-[var(--radius-2xl)] border-t border-grey-100",
          "tablet:max-h-[80vh] tablet:max-w-xl tablet:rounded-[var(--radius-2xl)] tablet:border-0",
        )}
      >
        <header className="flex items-start justify-between gap-[var(--spacing-8)] border-b border-grey-75 px-[var(--spacing-16)] py-[var(--spacing-16)] tablet:px-[var(--spacing-20)]">
          <div className="flex min-w-0 flex-1 items-start gap-[var(--spacing-8)]">
            {openPermit ? (
              <button
                type="button"
                aria-label="Back to pack"
                onClick={() => onOpenPermit(null)}
                className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-sm)] text-black hover:bg-grey-50 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
              >
                <img
                  src={caretDown}
                  alt=""
                  width={10}
                  height={6}
                  className="rotate-90"
                />
              </button>
            ) : null}
            <h2
              id={titleId}
              className="min-w-0 flex-1 pt-2 text-lg leading-[22px] font-bold text-black"
            >
              {title}
            </h2>
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
        <div className="min-h-0 flex-1 overflow-y-auto px-[var(--spacing-16)] py-[var(--spacing-16)] tablet:px-[var(--spacing-20)]">
          {openPermit ? (
            <V26GuideCard
              card={v26PermitCard(openPermit)}
              role={role}
              unit={unit}
              embedded
              hideTitle
              extraResources={files.map((row) => ({
                id: `${row.permitName}-${row.doc.name}`,
                name: row.doc.name,
                type:
                  row.need === "Required" && /you attach this\.?$/i.test(row.who)
                    ? "File"
                    : `${row.need} · ${row.who}`,
              }))}
            />
          ) : (
            <ul>
              {permits.map((permitName) => {
                const count = docs.filter(
                  (row) => row.permitName === permitName,
                ).length;
                return (
                  <li
                    key={permitName}
                    className="border-t border-grey-100 first:border-t-0"
                  >
                    <button
                      type="button"
                      onClick={() => onOpenPermit(permitName)}
                      className="flex w-full items-center gap-[var(--spacing-8)] py-[var(--spacing-12)] text-left hover:bg-grey-50 focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--color-purple-600)]"
                    >
                      <span className="min-w-0 flex-1 truncate text-sm leading-[18px] font-bold text-black">
                        {permitName}
                      </span>
                      <span className="shrink-0 text-xs leading-4 tabular-nums text-grey-500">
                        {fileCountLabel(count)}
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
                );
              })}
            </ul>
          )}
        </div>
      </aside>
    </div>,
    document.body,
  );
}

const SECTION_LABEL =
  "text-xs leading-4 font-bold uppercase tracking-[0.08em] text-grey-400";

const START_PRIMARY =
  "inline-flex h-10 w-fit items-center justify-center rounded-[var(--radius-sm)] bg-purple-600 px-4 text-sm leading-[18px] font-bold text-white hover:bg-purple-700";

function WorksList({
  role,
  toFinish,
  earlier,
  canStart,
  onStart,
  onOpen,
}: {
  role: Role;
  toFinish: V26Work[];
  earlier: V26Work[];
  canStart: boolean;
  onStart: () => void;
  onOpen: (work: V26Work) => void;
}) {
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
              Start a work
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
                Start a work
              </button>
            ) : null}
          </div>
        ) : (
          <ul className="overflow-hidden rounded-[var(--radius-2xl)] bg-white shadow-[var(--shadow-light-bg)]">
            {toFinish.map((work) => (
              <WorkRow
                key={work.id}
                title={v26WorkListTitle(work)}
                detail={v26WorkNextAction(work, role)}
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
            {earlier.map((work) => (
              <WorkRow
                key={work.id}
                title={v26WorkListTitle(work)}
                detail={v26WorkStatusLabel(work)}
                onOpen={() => onOpen(work)}
              />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function WorkRow({
  title,
  detail,
  onOpen,
}: {
  title: string;
  detail: string;
  onOpen: () => void;
}) {
  return (
    <li className="border-t border-grey-100 first:border-t-0">
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center gap-3 px-4 py-4 text-left hover:bg-grey-50"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-base leading-5 font-bold text-black">
            {title}
          </span>
          <span className="mt-1 block text-sm leading-[18px] text-grey-600">
            {detail}
          </span>
        </span>
      </button>
    </li>
  );
}
