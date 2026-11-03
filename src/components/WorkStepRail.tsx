import { cn } from "@/lib/utils";
import type { V28RailId, V28WorkRail } from "@/lib/process-v28-readiness";

/** Compact four-step progress. Home and the works page share this row. */
export function WorkStepRail({
  rail,
  onStep,
  variant = "default",
}: {
  rail: V28WorkRail;
  onStep?: (id: V28RailId) => void;
  /** Home section card. Older works pages keep the default row. v31 names each step. Summary cards use marks. */
  variant?: "default" | "section" | "named" | "marks";
}) {
  const section = variant === "section";
  if (variant === "named") {
    return <NamedWorkStepRail rail={rail} onStep={onStep} />;
  }
  if (variant === "marks") {
    return <MarkWorkStepRail rail={rail} />;
  }
  return (
    <div className="flex min-w-0 items-center gap-3">
      <ol
        className="flex shrink-0 items-center gap-2"
        aria-label={onStep ? "Steps in this work" : undefined}
        aria-hidden={onStep ? undefined : true}
      >
        {rail.steps.map((row, index) => {
          const locked = row.status === "locked";
          const done = row.status === "done";
          const on = row.status === "current";
          const mark = (
            <span
              className={cn(
                "grid size-6 shrink-0 place-items-center rounded-full text-xs leading-4 font-bold",
                locked
                  ? "border border-dotted border-grey-300 bg-white text-grey-300"
                  : on
                    ? "bg-purple-600 text-white shadow-[0_0_0_3px_var(--color-purple-200)]"
                    : done
                      ? "bg-purple-200 text-purple-700"
                      : section
                        ? "border border-dashed border-grey-300 bg-white text-grey-400"
                        : "border border-dotted border-grey-300 bg-white text-grey-400",
              )}
            >
              {done ? (
                <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden>
                  <path
                    d="M3.5 8.2 6.4 11.2 12.5 4.8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                index + 1
              )}
            </span>
          );
          return (
            <li key={row.id} className="flex items-center">
              {onStep ? (
                <button
                  type="button"
                  disabled={locked}
                  aria-current={on ? "step" : undefined}
                  aria-label={`${index + 1}. ${row.label}`}
                  onClick={() => onStep(row.id)}
                  className="rounded-full focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
                >
                  {mark}
                </button>
              ) : (
                mark
              )}
            </li>
          );
        })}
      </ol>
      {section ? (
        <p className="flex min-w-0 items-center gap-1 text-xs leading-4 text-purple-600">
          <span className="shrink-0 font-bold">{rail.position}</span>
          <span className="size-1 shrink-0 rounded-full bg-purple-600" aria-hidden />
          <span className="truncate">{rail.detail}</span>
        </p>
      ) : (
        <p className="min-w-0 text-xs leading-4">
          <span className="font-bold text-purple-600">{rail.position}</span>
          <span className="text-grey-600"> · {rail.detail}</span>
        </p>
      )}
    </div>
  );
}

/** Four marks that fit a summary card. The status words live in the chip, not in this row. */
function MarkWorkStepRail({ rail }: { rail: V28WorkRail }) {
  return (
    <ol className="flex items-center" aria-label="Steps in this work">
      {rail.steps.map((row, index) => {
        const locked = row.status === "locked";
        const done = row.status === "done";
        const on = row.status === "current";
        const last = index === rail.steps.length - 1;
        const next = rail.steps[index + 1];
        const lineOn = done || (on && next?.status !== "locked");
        return (
          <li key={row.id} className="flex items-center">
            <span
              className={cn(
                "grid size-6 shrink-0 place-items-center rounded-full text-xs leading-4 font-bold",
                locked
                  ? "border border-dotted border-grey-300 bg-white text-grey-300"
                  : on
                    ? "bg-purple-600 text-white"
                    : done
                      ? "bg-purple-200 text-purple-700"
                      : "border border-grey-300 bg-white text-grey-600",
              )}
              aria-hidden
            >
              {done ? (
                <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden>
                  <path
                    d="M3.5 8.2 6.4 11.2 12.5 4.8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                index + 1
              )}
            </span>
            <span className="sr-only">
              {row.label}
              {on ? ", current" : done ? ", done" : locked ? ", locked" : ""}
            </span>
            {last ? null : (
              <span
                aria-hidden
                className={cn(
                  "mx-2 h-px w-4 shrink-0",
                  lineOn ? "bg-purple-400" : "bg-grey-200",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** Names sit beside the circle, with the same gap on every page. */
function NamedWorkStepRail({
  rail,
  onStep,
}: {
  rail: V28WorkRail;
  onStep?: (id: V28RailId) => void;
}) {
  return (
    <ol
      className="flex w-full flex-wrap items-center gap-x-3 gap-y-2 rounded-[var(--radius-2xl)] bg-white px-4 py-3 shadow-[var(--shadow-light-bg)]"
      aria-label="Steps in this work"
    >
      {rail.steps.map((row, index) => {
        const locked = row.status === "locked";
        const done = row.status === "done";
        const on = row.status === "current";
        const mark = (
          <span
            className={cn(
              "grid size-6 shrink-0 place-items-center rounded-full text-xs leading-4 font-bold",
              locked
                ? "border border-dotted border-grey-300 bg-white text-grey-300"
                : on
                  ? "bg-purple-600 text-white"
                  : done
                    ? "bg-purple-200 text-purple-700"
                    : "border border-grey-300 bg-white text-grey-600",
            )}
          >
            {done ? (
              <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden>
                <path
                  d="M3.5 8.2 6.4 11.2 12.5 4.8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              index + 1
            )}
          </span>
        );
        const label = (
          <span
            className={cn(
              "whitespace-nowrap text-sm leading-[18px]",
              locked
                ? "text-grey-400"
                : on
                  ? "font-bold text-purple-700"
                  : done
                    ? "text-grey-700"
                    : "text-grey-500",
            )}
          >
            {row.label}
          </span>
        );
        const body = (
          <>
            {mark}
            {label}
          </>
        );
        return (
          <li key={row.id} className="flex shrink-0 items-center">
            {onStep ? (
              <button
                type="button"
                disabled={locked}
                aria-current={on ? "step" : undefined}
                onClick={() => onStep(row.id)}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-full focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]",
                  locked && "cursor-default",
                )}
              >
                {body}
              </button>
            ) : (
              <div className="flex shrink-0 items-center gap-2">{body}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
