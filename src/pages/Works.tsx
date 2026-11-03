import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useApp } from "@/lib/app-state";
import { CONTRACTOR_JOBS, LS_JOB } from "@/lib/process-job-context";
import {
  completeAnswers,
  quizHasSavedAnswers,
  quizIsConfirmed,
  quizProgress,
  settleQuizWrite,
  toggleQuestionOption,
  type QuizState,
} from "@/lib/process-planned-works-quiz";
import {
  setV25Check,
  setV25Choice,
  setV25YesNo,
  v25QuizProgress,
} from "@/lib/process-v25-quiz";
import { QuizQuestionBlock } from "@/components/dls/QuizChecklist";
import { QuizChecklistV25 } from "@/components/dls/QuizChecklistV25";
import {
  applyWorksDemoStory,
  canFillWorksJob,
  canLockWorksJob,
  canStartWorksJob,
  ensureOpeningJob,
  ensureToolQuiz,
  jobStatusLabel,
  liveWorksKind,
  lockWorksJob,
  openingBypassLabel,
  questionsForJobKind,
  readOpeningBypass,
  readWorksDemoStory,
  readWorksJobs,
  startWorksJob,
  upsertWorksJob,
  worksOutcome,
  WORKS_CHANGED_EVENT,
  type WorksJob,
  type WorksJobKind,
} from "@/lib/process-works-jobs";
import { WorksLockedOutcome } from "@/components/WorksLockedOutcome";
import type { Unit } from "@/lib/tenancy-data";
import caretDown from "@/assets/figma/caret-down.svg";

const PROCESS_FOR_KIND: Record<WorksJobKind, string> = {
  opening: "/process?phase=build",
  operate: "/process?phase=operate",
  exit: "/process?phase=exit",
};

const TERTIARY_BACK =
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

function persistJob(unit: Unit, job: WorksJob, nextQuiz: QuizState) {
  const answers = completeAnswers(nextQuiz.answers);
  const settled = settleQuizWrite(
    { ...nextQuiz, answers, confirmed: job.quiz.confirmed },
    unit,
  );
  const next = { ...job, quiz: settled };
  upsertWorksJob(unit.id, next);
  return next;
}

export function WorksPage() {
  const { role, unit, effectiveUnit } = useApp();
  const [params, setParams] = useSearchParams();
  const isOfficer = role === "officer";
  const isContractor = role === "contractor";
  const [jobId, setContractorJobId] = useState(CONTRACTOR_JOBS[0].id);
  const [jobs, setJobs] = useState<WorksJob[]>([]);
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (!isContractor) return;
    const saved = window.localStorage.getItem(LS_JOB);
    if (saved && CONTRACTOR_JOBS.some((j) => j.id === saved)) {
      setContractorJobId(saved);
    }
  }, [isContractor]);

  const ctxUnit: Unit = useMemo(() => {
    if (isContractor) {
      return (
        CONTRACTOR_JOBS.find((j) => j.id === jobId)?.unit ??
        CONTRACTOR_JOBS[0].unit
      );
    }
    if (isOfficer) return effectiveUnit ?? unit;
    return unit;
  }, [isContractor, isOfficer, jobId, effectiveUnit, unit]);

  const selectedId = params.get("job");
  const toolMode = params.get("tool") === "1";
  const fromV25 = params.get("from") === "v25";
  const toolPhase =
    params.get("phase") === "operate" ? "operate" : "build";
  const kind = liveWorksKind(ctxUnit.id, jobs);
  const openingSkip = readOpeningBypass(ctxUnit.id);
  const processBack = fromV25
    ? `/process-v25?phase=${toolPhase}`
    : PROCESS_FOR_KIND[kind];

  useEffect(() => {
    if (!readWorksDemoStory()) {
      applyWorksDemoStory(ctxUnit.id, "first-fitout");
    }
    const refresh = () => setJobs(readWorksJobs(ctxUnit.id));
    refresh();
    window.addEventListener(WORKS_CHANGED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(WORKS_CHANGED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [ctxUnit.id]);

  useEffect(() => {
    if (role !== "contractor" || kind !== "opening") return;
    if (readOpeningBypass(ctxUnit.id)) return;
    if (readWorksJobs(ctxUnit.id).some((job) => job.kind === "opening")) return;
    if (!ensureOpeningJob(ctxUnit.id)) return;
    setJobs(readWorksJobs(ctxUnit.id));
  }, [role, kind, ctxUnit.id]);

  useEffect(() => {
    if (!toolMode) return;
    const latest = readWorksJobs(ctxUnit.id);
    const requested = params.get("job");
    if (requested && latest.some((job) => job.id === requested)) {
      setJobs(latest);
      return;
    }
    const preferred =
      toolPhase === "operate"
        ? latest.find((job) => job.kind === "operate")
        : latest.find((job) => job.kind === "opening");
    const job = preferred ?? ensureToolQuiz(ctxUnit.id);
    setJobs(readWorksJobs(ctxUnit.id));
    if (params.get("job") === job.id) return;
    const next = new URLSearchParams(params);
    next.set("tool", "1");
    next.set("job", job.id);
    if (fromV25) next.set("from", "v25");
    if (!next.get("phase")) next.set("phase", toolPhase);
    setParams(next, { replace: true });
  }, [toolMode, ctxUnit.id, fromV25, toolPhase, params, setParams]);

  const visible = jobs
    .filter((job) => job.kind === kind)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const selected = selectedId
    ? (jobs.find((job) => job.id === selectedId) ?? null)
    : null;

  const jobParams = (jobId: string) =>
    toolMode
      ? {
          tool: "1",
          job: jobId,
          phase: toolPhase,
          ...(fromV25 ? { from: "v25" } : {}),
        }
      : { job: jobId };

  const openJob = (job: WorksJob) => {
    setParams(jobParams(job.id));
    setPage(0);
  };

  const start = () => {
    const job = startWorksJob(ctxUnit.id, kind);
    if (!job) return;
    setJobs(readWorksJobs(ctxUnit.id));
    openJob(job);
  };

  const questions = selected
    ? questionsForJobKind(ctxUnit, selected.kind)
    : [];
  const canWrite = selected
    ? toolMode
      ? (role === "officer" || role === "contractor") &&
        !quizIsConfirmed(selected.quiz)
      : canFillWorksJob(role, selected)
    : false;
  const useV25Checklist = fromV25;
  const lastPage = Math.max(questions.length - 1, 0);
  const canLock = Boolean(
    selected &&
      (useV25Checklist
        ? role === "officer" &&
          quizHasSavedAnswers(selected.quiz) &&
          !quizIsConfirmed(selected.quiz)
        : !toolMode &&
          page >= lastPage &&
          canLockWorksJob(role, selected, ctxUnit)),
  );
  const question = questions[Math.min(page, lastPage)];
  const outcome = selected ? worksOutcome(selected, ctxUnit, role) : null;
  const locked = Boolean(outcome?.locked);
  const progress = selected
    ? useV25Checklist
      ? v25QuizProgress(selected.quiz, ctxUnit)
      : quizProgress(selected.quiz, ctxUnit)
    : { answered: 0, total: 0 };

  const listTitle =
    kind === "operate" ? "Works during the lease" : "Opening works";
  const intro =
    kind === "operate"
      ? "Fill before briefing and permits — not at KickOff."
      : "Fill before the IFM briefing and permits — not at KickOff.";

  return (
    <div className="dls-page flex flex-col gap-6 !pt-5 tablet:!pt-8">
      <header className="flex max-w-xl flex-col gap-3">
        {selected && !toolMode ? (
          <button
            type="button"
            onClick={() => setParams({})}
            className={TERTIARY_BACK}
          >
            <BackArrow />
            All works
          </button>
        ) : (
          <Link to={processBack} className={TERTIARY_BACK}>
            <BackArrow />
            Back to Process
          </Link>
        )}
        <div className="flex flex-col gap-2">
          <p className="text-xs leading-4 font-bold uppercase tracking-[0.08em] text-grey-400">
            Works
          </p>
          <h1 className="text-[28px] leading-9 font-bold text-black">
            {toolMode
              ? "Planned Works Quiz"
              : selected
                ? selected.title
                : listTitle}
          </h1>
          <p className="text-sm leading-[18px] text-grey-500">
            {toolMode
              ? "Name the works this unit needs. This does not lock Process."
              : selected
                ? ctxUnit.unitNo
                : intro}
          </p>
          {selected && !toolMode && (
            <p className="text-sm leading-[18px] text-grey-700">
              {outcome?.locked
                ? "The Project Officer locked this list."
                : outcome?.ready
                  ? "Filling the list. Not locked yet."
                  : "This list has no answers yet."}
            </p>
          )}
          {toolMode && role === "tenant" && (
            <p className="text-sm leading-[18px] text-grey-700">
              Your contractor fills this. You can read the answers.
            </p>
          )}
          {!selected && openingSkip ? (
            <p className="text-sm leading-[18px] text-grey-600">
              Opening is not needed. {openingBypassLabel(openingSkip)}
            </p>
          ) : null}
        </div>
      </header>

      {!selected && !toolMode ? (
        <div className="flex max-w-xl flex-col gap-4">
          {canStartWorksJob(role, kind, jobs, ctxUnit.id) &&
            (kind === "operate" || visible.length === 0) && (
              <button
                type="button"
                onClick={start}
                className="inline-flex h-10 w-fit items-center justify-center rounded-[var(--radius-sm)] bg-purple-600 px-4 text-sm leading-[18px] font-bold text-white hover:bg-purple-700"
              >
                Start a list
              </button>
            )}
          {visible.length === 0 ? (
            <p className="text-sm leading-[18px] text-grey-700">
              {role === "officer"
                ? "No list here yet. Start a list when this unit needs one."
                : "No list here yet. Your Project Officer starts it."}
            </p>
          ) : (
            <ul className="overflow-hidden rounded-[var(--radius-2xl)] bg-white shadow-[var(--shadow-light-bg)]">
              {visible.map((job) => (
                <li key={job.id} className="border-t border-grey-100 first:border-t-0">
                  <button
                    type="button"
                    onClick={() => openJob(job)}
                    className="flex w-full items-center gap-3 px-4 py-4 text-left hover:bg-grey-50"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-base leading-5 font-bold text-black">
                        {job.title}
                      </span>
                      <span className="mt-1 block text-sm leading-[18px] text-grey-600">
                        {jobStatusLabel(job)}
                        {" · "}
                        {new Date(job.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="flex max-w-xl flex-col gap-6">
          {role === "tenant" && !toolMode && !outcome?.ready && (
            <p className="text-sm leading-[18px] text-grey-700">
              Your Project Officer fills this with the contractor. You read the
              list when it is ready.
            </p>
          )}

          {(useV25Checklist ? selected : question) &&
            (canWrite || role === "tenant" || outcome?.ready) && (
            <section className="flex flex-col gap-4 rounded-[var(--radius-2xl)] bg-white p-4 shadow-[var(--shadow-light-bg)] tablet:p-6">
              <p className="text-sm leading-[18px] text-grey-700">
                {locked
                  ? "Locked answers"
                  : `${progress.answered} of ${progress.total} answered`}
              </p>
              {useV25Checklist && selected ? (
                <QuizChecklistV25
                  state={selected.quiz}
                  unit={ctxUnit}
                  disabled={!canWrite}
                  locked={locked}
                  onChoice={(id, value) => {
                    const next = persistJob(
                      ctxUnit,
                      selected,
                      setV25Choice(selected.quiz, id, value),
                    );
                    setJobs(readWorksJobs(ctxUnit.id));
                    setParams(jobParams(next.id));
                  }}
                  onCheck={(id, slug) => {
                    const next = persistJob(
                      ctxUnit,
                      selected,
                      setV25Check(selected.quiz, id, slug),
                    );
                    setJobs(readWorksJobs(ctxUnit.id));
                    setParams(jobParams(next.id));
                  }}
                  onYesNo={(field, yes) => {
                    const next = persistJob(
                      ctxUnit,
                      selected,
                      setV25YesNo(selected.quiz, field, yes),
                    );
                    setJobs(readWorksJobs(ctxUnit.id));
                    setParams(jobParams(next.id));
                  }}
                />
              ) : question ? (
                <QuizQuestionBlock
                  question={question}
                  answer={selected.quiz.answers?.[question.id]}
                  unit={ctxUnit}
                  allowUnsure={role !== "officer"}
                  disabled={!canWrite}
                  locked={locked}
                  onToggle={(questionId, optionId) => {
                    const next = persistJob(
                      ctxUnit,
                      selected,
                      toggleQuestionOption(selected.quiz, questionId, optionId),
                    );
                    setJobs(readWorksJobs(ctxUnit.id));
                    setParams(jobParams(next.id));
                  }}
                />
              ) : null}
              {!useV25Checklist && questions.length > 1 && (
                <div className="flex items-center justify-between gap-3">
                  {page > 0 ? (
                    <button
                      type="button"
                      className="min-h-10 min-w-12 px-1 text-sm leading-[18px] font-bold text-purple-600"
                      onClick={() => setPage((i) => i - 1)}
                    >
                      Back
                    </button>
                  ) : (
                    <span className="min-w-12" />
                  )}
                  <p className="inline-flex h-5 items-center rounded-full bg-purple-100 px-2 text-xs leading-4 text-purple-600">
                    {Math.min(page + 1, questions.length)} of {questions.length}
                  </p>
                  {page < lastPage ? (
                    <button
                      type="button"
                      className="min-h-10 min-w-12 px-1 text-sm leading-[18px] font-bold text-purple-600"
                      onClick={() => setPage((i) => i + 1)}
                    >
                      Next
                    </button>
                  ) : canWrite && !locked ? (
                    <button
                      type="button"
                      className="min-h-10 min-w-12 px-1 text-sm leading-[18px] font-bold text-purple-600"
                      onClick={() =>
                        setParams(
                          toolMode && selected
                            ? jobParams(selected.id)
                            : {},
                        )
                      }
                    >
                      Done
                    </button>
                  ) : (
                    <span className="min-w-12" />
                  )}
                </div>
              )}
              {canLock && (
                <button
                  type="button"
                  onClick={() => {
                    const next = lockWorksJob(ctxUnit.id, selected);
                    setJobs(readWorksJobs(ctxUnit.id));
                    setParams(jobParams(next.id));
                  }}
                  className="inline-flex h-10 w-fit items-center justify-center rounded-[var(--radius-sm)] bg-purple-600 px-4 text-sm leading-[18px] font-bold text-white hover:bg-purple-700"
                >
                  Lock this list
                </button>
              )}
            </section>
          )}

          {outcome?.ready && role !== "tenant" && (
            <WorksLockedOutcome
              permits={outcome.permits}
              steps={outcome.steps}
              locked={outcome.locked}
              role={role}
              unit={ctxUnit}
            />
          )}
        </div>
      )}
    </div>
  );
}
