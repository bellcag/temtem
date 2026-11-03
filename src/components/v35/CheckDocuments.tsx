import { useEffect, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";
import type { Role } from "@/lib/app-state";
import type { Unit } from "@/lib/tenancy-data";
import type { QuizState } from "@/lib/process-planned-works-quiz";
import type { V26ChecklistDoc, V26Work } from "@/lib/process-v26-works";
import {
  docAttachKey,
  readV28Attachments,
  readV28Screen,
  V28_APPLY_STEPS,
  type V28ApplyStep,
} from "@/lib/process-v28-screener";
import { cutHomeHref, cutWorksHref, usesV37Cut } from "@/lib/process-v31-preview";
import { cn } from "@/lib/utils";
import { Banner } from "@/components/dls/Banner";
import { QuizChecklistV28 } from "@/components/dls/QuizChecklistV28";
import { PackHowItWorks } from "@/components/v31/PackHowItWorks";
import { WorksV28Screener } from "@/pages/WorksV28Screener";
import helpIcon from "@/assets/figma/help-questions.svg";

type Pane = "answers" | V28ApplyStep;

const PANES: { id: Pane; label: string }[] = [
  { id: "answers", label: "Questionnaire" },
  ...V28_APPLY_STEPS,
];

const V37_PANES: { id: Pane; label: string }[] = [
  { id: "upload", label: "Upload" },
  { id: "screen", label: "Screen" },
  { id: "results", label: "Results" },
];

function screenPane(apply: V28ApplyStep | null, v37: boolean): Pane {
  if (apply === "screen" || apply === "results" || apply === "upload") return apply;
  if (apply === "checklist") return v37 ? "upload" : "checklist";
  return v37 ? "upload" : "checklist";
}

export function V35CheckDocuments({
  work,
  unit,
  role,
  docs,
  quiz,
  canWrite,
  apply,
  viewAnswers,
  onUnlock,
  onSubmitted,
}: {
  work: V26Work;
  unit: Unit;
  role: Role;
  docs: V26ChecklistDoc[];
  quiz: QuizState;
  canWrite: boolean;
  apply: V28ApplyStep | null;
  viewAnswers?: boolean;
  onUnlock: (back?: V28ApplyStep) => void;
  onSubmitted: () => void;
}) {
  const pathname = useLocation().pathname;
  const v37 = usesV37Cut(pathname);
  const homeHref = v37 ? cutWorksHref(pathname) : cutHomeHref(pathname);
  const [params, setParams] = useSearchParams();
  const [help, setHelp] = useState(false);
  const [pane, setPane] = useState<Pane>(() => {
    if (viewAnswers) return "answers";
    if (readV28Screen(unit.id, work.id).result === "error") return "screen";
    return screenPane(apply, v37);
  });

  useEffect(() => {
    if (viewAnswers) {
      setPane("answers");
      return;
    }
    if (apply === "results" && readV28Screen(unit.id, work.id).result === "error") {
      setPane("screen");
      return;
    }
    if (
      apply === "screen" ||
      apply === "results" ||
      apply === "upload" ||
      apply === "checklist"
    ) {
      setPane(v37 && apply === "checklist" ? "upload" : apply);
    }
  }, [apply, viewAnswers, unit.id, work.id, v37]);

  const attachments = readV28Attachments(unit.id, work.id);
  const screen = readV28Screen(unit.id, work.id);
  const required = docs.filter((row) => row.need === "Required");
  const attachedRequired = required.filter(
    (row) => attachments[docAttachKey(row.permitName, row.doc.name)],
  ).length;
  const filesReady = required.length === 0 || attachedRequired >= required.length;
  const screenFailed = screen.result === "error";
  const screenDone =
    screen.result === "pass" ||
    screen.result === "issues" ||
    screenFailed;

  const reached: Record<Pane, boolean> = {
    answers: true,
    checklist: true,
    upload: true,
    screen: filesReady || screenDone,
    results: screen.result === "pass" || screen.result === "issues",
  };

  const go = (next: Pane) => {
    if (!reached[next]) return;
    setPane(next);
    const query = new URLSearchParams(params);
    query.set("work", work.id);
    query.set("tab", "pack");
    if (next === "answers") {
      query.set("result", "answers");
      if (!query.get("apply")) query.set("apply", v37 ? "upload" : "checklist");
    } else {
      query.set("apply", next);
      query.delete("result");
    }
    setParams(query);
  };

  const backToPermits = () => {
    const query = new URLSearchParams();
    query.set("work", work.id);
    query.set("tab", "answers");
    query.set("result", "scope");
    setParams(query);
  };

  return (
    <article
      className={
        v37
          ? "rounded-[var(--radius-md)] border border-grey-100 bg-white"
          : "rounded-[var(--radius-2xl)] bg-white shadow-[var(--shadow-light-bg)]"
      }
    >
      <header
        className={cn(
          "flex flex-col gap-5 border-b border-grey-100 px-5 py-5 tablet:px-8 tablet:py-6",
          !(pane === "answers" && v37) && "pb-0 tablet:pb-0",
        )}
      >
        {v37 ? (
          <button
            type="button"
            onClick={backToPermits}
            className="inline-flex w-fit items-center gap-1 text-sm leading-[18px] font-bold text-purple-600 hover:text-purple-700 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
          >
            <ArrowLeft aria-hidden size={16} />
            Back to Overview
          </button>
        ) : null}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg leading-[22px] font-bold text-black">
              {v37 ? "Screen Documents" : "Check permit documents"}
            </h2>
            <p className="mt-1 text-sm leading-5 text-grey-600">
              {v37
                ? "Upload and screen before you submit in OneCalendar. This is not the application."
                : "Move between the answers, the files, and the check. You can go back to re-upload."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setHelp(true)}
            className="inline-flex shrink-0 items-center gap-1.5 text-sm leading-[18px] font-bold text-grey-600 hover:text-grey-700"
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
        {pane === "answers" && v37 ? null : (
          <CheckStepper
            panes={v37 ? V37_PANES : PANES}
            current={pane}
            reached={reached}
            failed={screenFailed ? "screen" : null}
            onPick={go}
          />
        )}
      </header>
      {v37 && pane !== "answers" ? (
        <div className="flex flex-col gap-3 px-5 py-4 tablet:px-8">
          <Banner tone="info">
            This is a preliminary screening only and{" "}
            <span className="font-bold">not submission</span>. OneCalendar still has to approve.
          </Banner>
        </div>
      ) : null}

      {pane === "answers" ? (
        <div className="flex flex-col gap-6 px-5 py-5 tablet:px-8 tablet:py-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-lg leading-[22px] font-bold text-black">
                Scope of Works
              </h3>
              <p className="mt-1 text-sm leading-5 text-grey-600">
                These are the answers that generated the permits and documents.
              </p>
            </div>
            {canWrite ? (
              <button
                type="button"
                onClick={() => onUnlock(v37 ? "upload" : undefined)}
                className="inline-flex h-10 w-fit shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-purple-600 bg-white px-4 text-sm leading-[18px] font-bold text-purple-600 hover:bg-purple-100"
              >
                Edit Answers
              </button>
            ) : null}
          </div>
          <QuizChecklistV28
            state={quiz}
            disabled
            locked={false}
            note={
              canWrite
                ? null
                : role === "tenant"
                  ? "Your contractor filled in these answers."
                  : "The contractor filled in these answers."
            }
            intro={null}
            friendly
            plain
            onChange={() => {}}
          />
          <div className="flex justify-end border-t border-grey-100 pt-4">
            <button
              type="button"
              onClick={() => go(v37 ? "upload" : "checklist")}
              className="inline-flex h-10 w-fit items-center justify-center rounded-[var(--radius-sm)] bg-purple-600 px-4 text-sm leading-[18px] font-bold text-white hover:bg-purple-700"
            >
              {v37 ? "Screen Documents" : "Next: Checklist"}
            </button>
          </div>
        </div>
      ) : (
        <div className={cn("px-5 py-5 tablet:px-8 tablet:py-6", v37 && "pt-2 tablet:pt-2")}>
          <WorksV28Screener
            work={work}
            unit={unit}
            role={role}
            docs={docs}
            step={pane}
            edition="v35"
            hideHelp
            homeHref={homeHref}
            onPrevFromChecklist={v37 ? backToPermits : () => go("answers")}
            onStep={(next) => {
              if (next === "checklist" || next === "upload" || next === "screen" || next === "results") {
                go(next);
              }
            }}
            onSubmitted={onSubmitted}
          />
        </div>
      )}
      {help ? <PackHowItWorks onClose={() => setHelp(false)} /> : null}
    </article>
  );
}

function CheckStepper({
  panes,
  current,
  reached,
  failed,
  onPick,
}: {
  panes: { id: Pane; label: string }[];
  current: Pane;
  reached: Record<Pane, boolean>;
  failed?: Pane | null;
  onPick: (pane: Pane) => void;
}) {
  const index = panes.findIndex((row) => row.id === current);
  return (
    <ol className="-mx-5 -mt-2 flex overflow-x-auto px-5 tablet:mx-0 tablet:px-0">
      {panes.map((row, i) => {
        const on = row.id === current;
        const error = on && failed === row.id;
        const done = i < index;
        const open = reached[row.id];
        return (
          <li key={row.id} className="shrink-0">
            <button
              type="button"
              disabled={!open}
              aria-current={on ? "step" : undefined}
              onClick={() => onPick(row.id)}
              className={cn(
                "relative inline-flex h-11 items-center gap-2 px-4 text-sm leading-[18px]",
                i === 0 && "pl-0",
                "focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--color-purple-600)]",
                on && "after:absolute after:right-4 after:bottom-0 after:h-0.5",
                on && (i === 0 ? "after:left-0" : "after:left-4"),
                error
                  ? "font-bold text-error-600 after:bg-error-600"
                  : on
                    ? "font-bold text-purple-600 after:bg-purple-600"
                    : done
                      ? "text-grey-700"
                      : "text-grey-400",
                open ? "hover:text-purple-700" : "cursor-default",
              )}
            >
              <span
                className={cn(
                  "grid size-5 place-items-center rounded-full text-xs leading-4 font-bold",
                  error
                    ? "bg-error-600 text-white"
                    : on
                      ? "bg-purple-600 text-white"
                      : done
                        ? "bg-purple-100 text-purple-700"
                        : "bg-grey-100 text-grey-400",
                )}
              >
                {error ? "!" : done ? <Check className="size-3" strokeWidth={2.5} /> : i + 1}
              </span>
              {row.label}
            </button>
          </li>
        );
      })}
    </ol>
  );
}
