import { useEffect, useState, type ReactNode } from "react";
import type { Role } from "@/lib/app-state";
import type { Unit } from "@/lib/tenancy-data";
import type { V26DraftStep } from "@/lib/process-v26-works";
import {
  clearV31Step,
  closeV31Step,
  completeV31Work,
  isV31Complete,
  readV31Closes,
  reopenV31Work,
  v31BecauseLine,
  V31_CLOSES_CHANGED,
  V31_COMPLETED_CHANGED,
} from "@/lib/process-v31-works";
import type { V28ApplyStep } from "@/lib/process-v28-screener";
import {
  v28IfTheyAsk,
  v28PackCard,
  v28SharedFact,
} from "@/lib/process-v28-voice";
import { v28LinkedFact, v28SystemsNotInFact } from "@/lib/process-v28-systems";
import { V26GuideCard } from "@/pages/v26-guide-card";
import { StepIndexMark } from "@/components/v31/StepIndexMark";
import { cn } from "@/lib/utils";

const QUIET =
  "text-sm leading-[18px] font-bold text-purple-600 hover:text-purple-700 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]";

/** Number and words sit as one step. A wide gap breaks that link. */
const STEP_TEXT = "min-w-0";
const STEP_TITLE = "block text-base leading-5 font-bold text-black";
const STEP_LINE = "mt-0.5 block text-sm leading-[18px] text-grey-600";
const STEP_BUTTON =
  "flex w-full items-center gap-2 px-4 py-3 text-left focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--color-purple-600)] tablet:px-5";

const APPLY_MOVES: { id: V28ApplyStep; title: string; line: string }[] = [
  {
    id: "checklist",
    title: "Checklist",
    line: "See which documents each permit needs.",
  },
  {
    id: "upload",
    title: "Upload documents",
    line: "Upload the preparing documents for each permit.",
  },
  {
    id: "screen",
    title: "Screen the package",
    line: "Screen the submission package.",
  },
  {
    id: "results",
    title: "Download and submit",
    line: "Download the pack and submit it in OneCalendar.",
  },
];


function StepGuide({
  step,
  role,
  unit,
  stamp,
}: {
  step: V26DraftStep;
  role: Role;
  unit: Unit;
  stamp?: string;
}) {
  const card = v28PackCard(step);
  return (
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
      linkFact={v28LinkedFact}
      filterSystems={v28SystemsNotInFact}
      timingNote
      linkResources
      readerActions
      stamp={stamp}
    />
  );
}

/** Phase 1. One task, then the sentence under it. */
export function V31TaskLead({ title, line }: { title: string; line: string }) {
  return (
    <div className="flex items-center gap-2">
      <StepIndexMark n={1} tone="current" />
      <div className={STEP_TEXT}>
        <p className={STEP_TITLE}>{title}</p>
        <p className={STEP_LINE}>{line}</p>
      </div>
    </div>
  );
}

/** Phase 2. The sittings in this phase, as a numbered list. */
export function V31PrepareList({
  steps,
  role,
  unit,
  stamp,
}: {
  steps: V26DraftStep[];
  role: Role;
  unit: Unit;
  stamp?: string;
}) {
  const [openId, setOpenId] = useState<string | null>(
    steps.length === 1 ? steps[0].id : null,
  );

  const label = steps.length === 1 ? steps[0].title : "Before the permit";
  return (
    <ol
      className="overflow-hidden rounded-[var(--radius-2xl)] bg-white shadow-[var(--shadow-light-bg)]"
      aria-label={label}
    >
      {steps.map((step, index) => {
        const card = v28PackCard(step);
        const open = openId === step.id;
        const because = v31BecauseLine(step.id);
        return (
          <li key={step.id} className="border-t border-grey-100 first:border-t-0">
            <button
              type="button"
              aria-expanded={open}
              onClick={() => setOpenId(open ? null : step.id)}
              className={STEP_BUTTON}
            >
              <StepIndexMark n={index + 1} tone={open ? "current" : "waiting"} />
              <span className={cn(STEP_TEXT, "flex-1")}>
                <span className={STEP_TITLE}>{card.title}</span>
                <span className={STEP_LINE}>{step.lead}</span>
                {because ? <span className={STEP_LINE}>{because}</span> : null}
              </span>
            </button>
            {open ? (
              <div className="px-4 pb-4 tablet:px-6">
                <StepGuide step={step} role={role} unit={unit} stamp={stamp} />
              </div>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

/** Phase 3. The apply moves, with the open one filled. */
export function V31ApplyMoves({
  current,
  onPick,
  children,
}: {
  current: V28ApplyStep | null;
  onPick: (step: V28ApplyStep) => void;
  children?: ReactNode;
}) {
  return (
    <ol
      className="overflow-hidden rounded-[var(--radius-2xl)] bg-white shadow-[var(--shadow-light-bg)]"
      aria-label="Apply for the permit"
    >
      {APPLY_MOVES.map((move, index) => {
        const on = current === move.id;
        const last = index === APPLY_MOVES.length - 1;
        return (
          <li key={move.id} className="relative">
            {last ? null : (
              <span
                aria-hidden
                className="absolute top-12 -bottom-9 left-[27px] z-0 w-px bg-grey-200 tablet:left-[31px]"
              />
            )}
            <button
              type="button"
              aria-current={on ? "step" : undefined}
              aria-expanded={on}
              onClick={() => onPick(move.id)}
              className={cn(STEP_BUTTON, "relative z-10")}
            >
              <StepIndexMark n={index + 1} tone={on ? "current" : "waiting"} />
              <span className={STEP_TEXT}>
                <span className={STEP_TITLE}>{move.title}</span>
                <span className={STEP_LINE}>{move.line}</span>
              </span>
            </button>
            {on && children ? (
              <div className="relative z-10 mr-4 mb-1 ml-12 border-t border-grey-100 pt-4 pb-5 tablet:mr-5 tablet:ml-[3.25rem]">
                {children}
              </div>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

function closeNote(role: Role, allDone: boolean) {
  if (allDone) return "Every check on this project is closed.";
  if (role === "contractor") {
    return "You mark each check for now. A tracker can close the same row from the inspection record later.";
  }
  if (role === "officer") {
    return "The contractor marks each check until a tracker closes it from the inspection record.";
  }
  return "Each check shows here once it is closed.";
}

function SpineRail({
  n,
  tone,
  last,
  done,
}: {
  n: number;
  tone: "current" | "waiting" | "done";
  last: boolean;
  done: boolean;
}) {
  return (
    <div className="flex w-6 shrink-0 flex-col items-center">
      <StepIndexMark n={n} tone={tone} />
      {last ? null : (
        <span
          aria-hidden
          className={cn("my-1 w-px flex-1", done ? "bg-purple-300" : "bg-grey-200")}
        />
      )}
    </div>
  );
}

/** Phase 4. One spine. Permit review leads; each later row can be closed by hand, or later by a tracker. */
export function V31CloseSpine({
  steps,
  lead,
  role,
  unit,
  canWrite,
  unitId,
  workId,
}: {
  steps: V26DraftStep[];
  /** Opens this journey. Not a check the contractor marks. */
  lead?: V26DraftStep | null;
  role: Role;
  unit: Unit;
  canWrite: boolean;
  unitId: string;
  workId: string;
}) {
  const [closes, setCloses] = useState(() => readV31Closes(unitId, workId));
  const [projectDone, setProjectDone] = useState(() =>
    isV31Complete(unitId, workId),
  );
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => {
      setCloses(readV31Closes(unitId, workId));
      setProjectDone(isV31Complete(unitId, workId));
    };
    refresh();
    window.addEventListener(V31_CLOSES_CHANGED, refresh);
    window.addEventListener(V31_COMPLETED_CHANGED, refresh);
    return () => {
      window.removeEventListener(V31_CLOSES_CHANGED, refresh);
      window.removeEventListener(V31_COMPLETED_CHANGED, refresh);
    };
  }, [unitId, workId]);

  const legacyDone = projectDone && Object.keys(closes).length === 0;
  const rowDone = (id: string) => legacyDone || closes[id]?.status === "done";
  const currentId = steps.find((step) => !rowDone(step.id))?.id ?? null;
  const allDone = steps.length > 0 && steps.every((step) => rowDone(step.id));
  const leadCard = lead ? v28PackCard(lead) : null;

  const mark = (stepId: string) => {
    closeV31Step(unitId, workId, stepId, "manual");
    const next = readV31Closes(unitId, workId);
    if (steps.every((step) => next[step.id]?.status === "done")) {
      completeV31Work(unitId, workId);
    }
  };

  const undo = (stepId: string) => {
    clearV31Step(unitId, workId, stepId);
    if (isV31Complete(unitId, workId)) reopenV31Work(unitId, workId);
  };

  return (
    <div className="flex flex-col gap-4">
      <ol
        className="rounded-[var(--radius-2xl)] bg-white px-4 py-4 shadow-[var(--shadow-light-bg)] tablet:px-6"
        aria-label="Checks before opening"
      >
        {lead && leadCard ? (
          <li className="flex items-stretch gap-2">
            <SpineRail
              n={1}
              tone="current"
              last={steps.length === 0}
              done={false}
            />
            <div className={cn("min-w-0 flex-1", steps.length === 0 ? "pb-0" : "pb-5")}>
              <p className="text-base leading-5 font-bold text-black">{leadCard.title}</p>
              <p className="mt-0.5 text-sm leading-[18px] text-grey-600">{lead.lead}</p>
              <div className="mt-3">
                <StepGuide step={lead} role={role} unit={unit} />
              </div>
            </div>
          </li>
        ) : null}
        {steps.map((step, index) => {
          const card = v28PackCard(step);
          const because = v31BecauseLine(step.id);
          const done = rowDone(step.id);
          const close = closes[step.id];
          const last = index === steps.length - 1;
          const open = openId === step.id;
          const tone = done
            ? "done"
            : !lead && step.id === currentId
              ? "current"
              : "waiting";
          return (
            <li key={step.id} className="flex items-stretch gap-2">
              <SpineRail n={index + (lead ? 2 : 1)} tone={tone} last={last} done={done} />
              <div className={cn("min-w-0 flex-1", last ? "pb-0" : "pb-5")}>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-base leading-5 font-bold text-black">
                    {card.title}
                  </p>
                  <span
                    className={cn(
                      "inline-flex h-6 shrink-0 items-center rounded-[var(--radius-sm)] px-2 text-xs leading-4 font-bold",
                      done
                        ? "bg-purple-100 text-purple-700"
                        : "border border-grey-200 text-grey-600",
                    )}
                  >
                    {done ? "Done" : "Open"}
                  </span>
                </div>
                <p className="mt-0.5 text-sm leading-[18px] text-grey-600">{step.lead}</p>
                {because ? (
                  <p className="mt-0.5 text-sm leading-[18px] text-grey-600">{because}</p>
                ) : null}
                {close?.source === "tracked" ? (
                  <p className="mt-1 text-xs leading-4 text-grey-500">
                    Closed from the inspection record.
                  </p>
                ) : null}
                <div className="mt-2 flex flex-wrap gap-3">
                  <button type="button" onClick={() => setOpenId(open ? null : step.id)} className={QUIET}>
                    {open ? "Hide this step" : "Read this step"}
                  </button>
                  {canWrite && !done ? (
                    <button type="button" onClick={() => mark(step.id)} className={QUIET}>
                      Mark done
                    </button>
                  ) : null}
                  {canWrite && close?.source === "manual" ? (
                    <button type="button" onClick={() => undo(step.id)} className={QUIET}>
                      Undo
                    </button>
                  ) : null}
                </div>
                {open ? (
                  <div className="mt-3">
                    <StepGuide step={step} role={role} unit={unit} />
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
      {steps.length > 0 ? (
        <p className="text-sm leading-5 text-grey-600">{closeNote(role, allDone)}</p>
      ) : null}
    </div>
  );
}
