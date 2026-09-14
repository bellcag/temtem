import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useApp } from "@/lib/app-state";
import { CONTRACTOR_JOBS, LS_JOB } from "@/lib/process-job-context";
import {
  completeAnswers,
  isOptionOn,
  NONE_ID,
  NOT_SURE_ID,
  quizProgress,
  settleQuizWrite,
  toggleQuestionOption,
  type QuestionId,
  type QuizState,
} from "@/lib/process-planned-works-quiz";
import {
  applyWorksDemoStory,
  canFillWorksJob,
  canLockWorksJob,
  canStartWorksJob,
  ensureOpeningJob,
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
import { cn } from "@/lib/utils";
import caretDown from "@/assets/figma/caret-down.svg";

const PROCESS_FOR_KIND: Record<WorksJobKind, string> = {
  opening: "/process-v24?phase=build",
  operate: "/process-v24?phase=operate",
  exit: "/process-v24?phase=exit",
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

function CheckRow({
  label,
  on,
  exclusive,
  disabled,
  onToggle,
}: {
  label: string;
  on: boolean;
  exclusive?: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={on}
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        "flex w-full items-center gap-3 px-3 py-4 text-left",
        "border-t border-grey-100 first:border-t-0",
        disabled ? "cursor-default" : "cursor-pointer",
        on && "bg-purple-100",
        exclusive && "bg-grey-25",
        exclusive && on && "bg-purple-100",
      )}
    >
      <span
        className={cn(
          "grid size-4 shrink-0 aspect-square place-items-center rounded-[var(--radius-sm)] border",
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
          disabled && "text-grey-500",
        )}
      >
        {label}
      </span>
    </button>
  );
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
  const kind = liveWorksKind(ctxUnit.id, jobs);
  const openingSkip = readOpeningBypass(ctxUnit.id);

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

  const visible = jobs
    .filter((job) => job.kind === kind)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const selected = selectedId
    ? (jobs.find((job) => job.id === selectedId) ?? null)
    : null;

  const openJob = (job: WorksJob) => {
    setParams({ job: job.id });
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
  const canWrite = selected ? canFillWorksJob(role, selected) : false;
  const lastPage = Math.max(questions.length - 1, 0);
  const canLock = Boolean(
    selected &&
      page >= lastPage &&
      canLockWorksJob(role, selected, ctxUnit),
  );
  const question = questions[Math.min(page, lastPage)];
  const outcome = selected ? worksOutcome(selected, ctxUnit, role) : null;
  const locked = Boolean(outcome?.locked);
  const agreedLabels =
    selected && question
      ? [
          ...question.options
            .filter((opt) =>
              isOptionOn(selected.quiz.answers?.[question.id], opt.id),
            )
            .map((opt) => opt.label),
          ...(isOptionOn(selected.quiz.answers?.[question.id], NONE_ID)
            ? ["None of these"]
            : []),
          ...(isOptionOn(selected.quiz.answers?.[question.id], NOT_SURE_ID)
            ? ["Not sure yet"]
            : []),
        ]
      : [];
  const progress = selected
    ? quizProgress(selected.quiz, ctxUnit)
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
        {selected ? (
          <button
            type="button"
            onClick={() => setParams({})}
            className={TERTIARY_BACK}
          >
            <BackArrow />
            All works
          </button>
        ) : (
          <Link to={PROCESS_FOR_KIND[kind]} className={TERTIARY_BACK}>
            <BackArrow />
            Back to Process
          </Link>
        )}
        <div className="flex flex-col gap-2">
          <p className="text-xs leading-4 font-bold uppercase tracking-[0.08em] text-grey-400">
            Works
          </p>
          <h1 className="text-[28px] leading-9 font-bold text-black">
            {selected ? selected.title : listTitle}
          </h1>
          <p className="text-sm leading-[18px] text-grey-500">
            {selected ? ctxUnit.unitNo : intro}
          </p>
          {selected && (
            <p className="text-sm leading-[18px] text-grey-700">
              {outcome?.locked
                ? "The Project Officer locked this list."
                : outcome?.ready
                  ? "Filling the list. Not locked yet."
                  : "This list has no answers yet."}
            </p>
          )}
          {!selected && openingSkip ? (
            <p className="text-sm leading-[18px] text-grey-600">
              Opening is not needed. {openingBypassLabel(openingSkip)}
            </p>
          ) : null}
        </div>
      </header>

      {!selected ? (
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
          {role === "tenant" && !outcome?.ready && (
            <p className="text-sm leading-[18px] text-grey-700">
              Your Project Officer fills this with the contractor. You read the
              list when it is ready.
            </p>
          )}

          {question && (canWrite || outcome?.ready) && (
            <section className="flex flex-col gap-4 rounded-[var(--radius-2xl)] bg-white p-4 shadow-[var(--shadow-light-bg)] tablet:p-6">
              <p className="text-sm leading-[18px] text-grey-700">
                {locked
                  ? "Locked answers"
                  : `${progress.answered} of ${progress.total} answered`}
              </p>
              <div className="flex flex-col gap-3">
                <p className="text-base leading-5 font-bold text-black">
                  {question.prompt}
                </p>
                {locked ? (
                  <ul className="flex flex-col overflow-hidden rounded-[var(--radius-md)] border border-grey-100 bg-grey-25">
                    {agreedLabels.length > 0 ? (
                      agreedLabels.map((label) => (
                        <li
                          key={label}
                          className="border-t border-grey-100 px-3 py-4 text-sm leading-[18px] font-bold text-black first:border-t-0"
                        >
                          {label}
                        </li>
                      ))
                    ) : (
                      <li className="px-3 py-4 text-sm leading-[18px] text-grey-600">
                        Nothing agreed on this question.
                      </li>
                    )}
                  </ul>
                ) : (
                <div className="flex flex-col overflow-hidden rounded-[var(--radius-md)] border border-grey-200 bg-white">
                  {question.options.map((opt) => (
                    <CheckRow
                      key={opt.id}
                      label={opt.label}
                      on={isOptionOn(selected.quiz.answers?.[question.id], opt.id)}
                      disabled={!canWrite}
                      onToggle={() => {
                        const next = persistJob(
                          ctxUnit,
                          selected,
                          toggleQuestionOption(
                            selected.quiz,
                            question.id as QuestionId,
                            opt.id,
                          ),
                        );
                        setJobs(readWorksJobs(ctxUnit.id));
                        setParams({ job: next.id });
                      }}
                    />
                  ))}
                  <CheckRow
                    label="None of these"
                    exclusive
                    on={isOptionOn(selected.quiz.answers?.[question.id], NONE_ID)}
                    disabled={!canWrite}
                    onToggle={() => {
                      persistJob(
                        ctxUnit,
                        selected,
                        toggleQuestionOption(
                          selected.quiz,
                          question.id as QuestionId,
                          NONE_ID,
                        ),
                      );
                      setJobs(readWorksJobs(ctxUnit.id));
                    }}
                  />
                  {role !== "officer" && (
                    <CheckRow
                      label="Not sure yet"
                      exclusive
                      on={isOptionOn(
                        selected.quiz.answers?.[question.id],
                        NOT_SURE_ID,
                      )}
                      disabled={!canWrite}
                      onToggle={() => {
                        persistJob(
                          ctxUnit,
                          selected,
                          toggleQuestionOption(
                            selected.quiz,
                            question.id as QuestionId,
                            NOT_SURE_ID,
                          ),
                        );
                        setJobs(readWorksJobs(ctxUnit.id));
                      }}
                    />
                  )}
                </div>
                )}
              </div>
              {questions.length > 1 && (
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
                      onClick={() => setParams({})}
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
                    setParams({ job: next.id });
                  }}
                  className="inline-flex h-10 w-fit items-center justify-center rounded-[var(--radius-sm)] bg-purple-600 px-4 text-sm leading-[18px] font-bold text-white hover:bg-purple-700"
                >
                  Lock this list
                </button>
              )}
            </section>
          )}

          {outcome?.locked && (
            <WorksLockedOutcome
              permits={outcome.permits}
              steps={outcome.steps}
              role={role}
              unit={ctxUnit}
            />
          )}
        </div>
      )}
    </div>
  );
}
