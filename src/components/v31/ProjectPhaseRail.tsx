import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const PHASE_OFF =
  "border-grey-200 bg-white hover:border-purple-600";
const PHASE_ON = "border-purple-600 bg-purple-100";
const PHASE_FOCUS =
  "focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]";

export type ProjectRailNested = {
  id: string;
  title: string;
  detail?: string;
  done?: boolean;
};

export type ProjectRailItem = {
  id: string;
  short: string;
  glance?: string;
  tone: "locked" | "open" | "done" | "error";
  nested?: ProjectRailNested[];
};

export function ProjectPhaseRail({
  items,
  currentId,
  nestedId,
  onPick,
  onPickNested,
  layout = "rail",
}: {
  items: ProjectRailItem[];
  currentId: string;
  nestedId?: string | null;
  onPick: (id: string) => void;
  onPickNested?: (phaseId: string, nestedId: string) => void;
  /** `top` sits in one row above the step content. `rail` is the side column. */
  layout?: "rail" | "top";
}) {
  const currentIndex = items.findIndex((item) => item.id === currentId);
  const passed = (from: number) =>
    from >= 0 && currentIndex >= 0 && from < currentIndex;
  const top = layout === "top";

  if (top) {
    const currentItem = items[currentIndex];
    const nested =
      currentItem &&
      currentItem.tone !== "locked" &&
      (currentItem.nested?.length ?? 0) > 1
        ? currentItem.nested ?? []
        : [];
    return (
      <nav aria-label="Steps in this project" className="@container">
        <ol className="flex w-full list-none flex-col pb-2 @min-[440px]:flex-row @min-[440px]:items-start @min-[440px]:pb-1">
          {items.map((item, index) => {
            const current = item.id === currentId;
            const locked = item.tone === "locked";
            const error = item.tone === "error";
            const done = item.tone === "done";
            const todo = item.tone === "open";
            const lineOn =
              item.tone === "done" || current || index <= currentIndex;
            const next = items[index + 1];
            const spineOn = next
              ? next.tone === "done" ||
                next.id === currentId ||
                index + 1 <= currentIndex
              : false;
            return (
              <li
                key={item.id}
                className="relative flex items-center @min-[440px]:min-w-0 @min-[440px]:flex-1 @min-[440px]:justify-center"
              >
                {index > 0 ? (
                  <span
                    aria-hidden
                    className={cn(
                      "absolute top-2.5 left-0 right-[calc(50%+12px)] z-0 hidden h-1 @min-[440px]:block",
                      lineOn ? "bg-purple-600" : "bg-grey-400",
                    )}
                  />
                ) : null}
                {next ? (
                  <span
                    aria-hidden
                    className={cn(
                      "absolute top-1/2 left-3 z-0 h-full w-1 -translate-x-1/2 @min-[440px]:top-2.5 @min-[440px]:left-[calc(50%+12px)] @min-[440px]:h-1 @min-[440px]:w-auto @min-[440px]:right-0 @min-[440px]:translate-x-0",
                      spineOn ? "bg-purple-600" : "bg-grey-400",
                    )}
                  />
                ) : null}
                <button
                  type="button"
                  disabled={locked}
                  aria-current={current ? "step" : undefined}
                  aria-label={
                    locked
                      ? `${index + 1}. ${item.short}, not yet`
                      : `${index + 1}. ${item.short}${done ? ", done" : error ? ", needs attention" : todo ? ", to do" : ""}`
                  }
                  onClick={() => onPick(item.id)}
                  className={cn(
                    "relative z-[1] flex min-w-0 flex-1 items-center gap-3 rounded-[var(--radius-md)] py-2 text-left",
                    "@min-[440px]:w-full @min-[440px]:flex-col @min-[440px]:items-center @min-[440px]:gap-2 @min-[440px]:px-2 @min-[440px]:py-0",
                    PHASE_FOCUS,
                    locked && "cursor-default",
                  )}
                >
                  <span
                    className={cn(
                      "relative grid size-6 shrink-0 place-items-center rounded-full text-xs leading-4 font-bold",
                      current && done
                        ? "bg-purple-600 text-white shadow-[0_0_0_2px_var(--color-grey-50),0_0_0_4px_var(--color-purple-600)]"
                        : current && todo
                          ? "bg-warning-600 text-white shadow-[0_0_0_2px_var(--color-grey-50),0_0_0_4px_var(--color-warning-600)]"
                          : current
                            ? "bg-purple-600 text-white shadow-[0_0_0_2px_var(--color-grey-50),0_0_0_4px_var(--color-purple-600)]"
                            : error
                              ? "bg-error-200 text-error-600 ring-2 ring-grey-50"
                              : done
                                ? "bg-purple-600 text-white ring-2 ring-grey-50"
                                : locked
                                  ? "border border-dotted border-grey-600 bg-grey-50 text-grey-600"
                                  : todo
                                    ? "bg-warning-200 text-warning-800 ring-2 ring-warning-100"
                                    : "border border-grey-400 bg-white text-grey-700 ring-2 ring-grey-50",
                    )}
                    aria-hidden
                  >
                    {error ? "!" : index + 1}
                    {done ? (
                      <span className="absolute -right-1 -bottom-1 grid size-3.5 place-items-center rounded-full bg-white text-purple-600 ring-1 ring-purple-600">
                        <Check className="size-2.5" strokeWidth={3.5} />
                      </span>
                    ) : null}
                  </span>
                  <span className="flex min-w-0 flex-col @min-[440px]:items-center @min-[440px]:text-center">
                    <span
                      className={cn(
                        "block text-sm leading-[18px] @min-[440px]:whitespace-nowrap",
                        current
                          ? "font-bold text-purple-700"
                          : error || todo
                          ? "font-bold text-black"
                          : done
                            ? "font-bold text-grey-900"
                            : locked
                              ? "font-normal text-grey-600"
                              : "font-normal text-grey-700",
                      )}
                    >
                      {item.short}
                    </span>
                    {todo ? (
                      <span className="mt-0.5 inline-flex w-fit items-center rounded-full bg-warning-200 px-2 py-0.5 text-xs leading-4 font-bold text-warning-800">
                        To Do
                      </span>
                    ) : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        {nested.length > 0 ? (
          <ul
            className="relative mt-3 ml-3 flex list-none flex-col border-l-2 border-purple-600 py-1 after:absolute after:top-full after:-left-0.5 after:h-3 after:w-0.5 after:bg-purple-600"
            aria-label={currentItem.short}
          >
            {nested.map((row) => {
              const on = row.id === nestedId;
              return (
                <li key={row.id}>
                  <button
                    type="button"
                    aria-current={on ? "true" : undefined}
                    onClick={() => onPickNested?.(currentItem.id, row.id)}
                    className={cn(
                      "ml-3 flex w-[calc(100%-0.75rem)] items-start gap-3 rounded-[var(--radius-md)] px-2 py-1.5 text-left",
                      PHASE_FOCUS,
                      on ? "bg-purple-100" : "hover:bg-purple-100",
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full",
                        row.done
                          ? "bg-purple-600 text-white"
                          : on
                            ? "bg-purple-600"
                            : "bg-white ring-2 ring-purple-600",
                      )}
                    >
                      {row.done ? <Check className="size-3" strokeWidth={3} /> : null}
                    </span>
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span
                          className={cn(
                            "text-sm leading-5",
                            on ? "font-bold text-purple-700" : "font-normal text-grey-900",
                          )}
                        >
                          {row.title}
                        </span>
                        {row.done ? (
                          <span className="rounded-full bg-success-200 px-2 py-0.5 text-xs leading-4 font-bold text-success-800">
                            Done
                          </span>
                        ) : null}
                      </span>
                      {row.detail ? (
                        <span className="mt-0.5 block text-xs leading-4 font-normal text-grey-600">
                          {row.detail}
                        </span>
                      ) : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </nav>
    );
  }

  return (
    <nav aria-label="Steps in this project">
      <ol
        className={cn(
          "flex list-none",
          top ? "flex-col gap-2 desktop:flex-row desktop:items-stretch" : "flex-col",
        )}
      >
        {items.map((item, index) => {
          const current = item.id === currentId;
          const locked = item.tone === "locked";
          const nested =
            current && !locked && (item.nested?.length ?? 0) > 1
              ? item.nested ?? []
              : [];
          const last = index === items.length - 1;
          return (
            <li
              key={item.id}
              className={cn("flex gap-3", top && "min-w-0 desktop:flex-1")}
            >
              <div
                className={cn(
                  "flex w-7 shrink-0 flex-col items-center",
                  top && "pt-3 desktop:pt-4",
                )}
                aria-hidden
              >
                <span
                  className={cn(
                    "h-3 w-0.5 shrink-0 desktop:h-4",
                    top && "hidden",
                    index > 0 && "-mb-px",
                    index > 0
                      ? passed(index - 1)
                        ? "bg-purple-600"
                        : "bg-grey-200"
                      : "bg-transparent",
                  )}
                />
                <span
                  className={cn(
                    "relative z-[1] grid size-7 shrink-0 place-items-center rounded-full text-base leading-none font-bold",
                    locked
                      ? "border border-dotted border-grey-300 bg-white text-grey-300"
                      : "bg-purple-200 text-purple-700",
                  )}
                >
                  {index + 1}
                </span>
                <span
                  className={cn(
                    "w-0.5 min-h-0 flex-1",
                    top && "hidden",
                    !last && "-mt-px",
                    !last
                      ? passed(index)
                        ? "bg-purple-600"
                        : "bg-grey-200"
                      : "bg-transparent",
                  )}
                />
              </div>
              <div className={cn("flex min-w-0 flex-1 flex-col", top && "desktop:self-stretch")}>
                <div
                  className={cn(
                    "flex min-w-0 flex-col rounded-[var(--radius-xl)] border",
                    top && "desktop:h-full",
                    current ? PHASE_ON : PHASE_OFF,
                    locked && "hover:border-grey-200",
                  )}
                >
                  <button
                    type="button"
                    disabled={locked}
                    aria-current={current ? "step" : undefined}
                    aria-label={`${index + 1}. ${item.short}${locked ? ", locked" : item.tone === "done" ? ", done" : ""}`}
                    onClick={() => onPick(item.id)}
                    className={cn(
                      "min-w-0 rounded-[calc(var(--radius-xl)-1px)] px-4 py-3 text-left desktop:py-4",
                      top && "desktop:h-full",
                      PHASE_FOCUS,
                      !current && !locked && "hover:bg-purple-100",
                      locked && "cursor-default",
                      nested.length > 0 &&
                        "rounded-b-none",
                    )}
                  >
                    <span
                      className={cn(
                        "block text-sm leading-[18px] font-bold desktop:text-base desktop:leading-5",
                        locked ? "text-grey-400" : "text-black",
                      )}
                    >
                      {item.short}
                    </span>
                    {current && item.glance ? (
                      <span className="mt-2 block text-xs leading-4 text-grey-600 desktop:mt-3 desktop:text-sm desktop:leading-[18px]">
                        {item.glance}
                      </span>
                    ) : null}
                  </button>
                  {nested.length > 0 ? (
                    <ul
                      className="rounded-b-[calc(var(--radius-xl)-1px)] border-t border-purple-200 bg-white p-2"
                      aria-label={item.short}
                    >
                      {nested.map((row) => {
                        const on = row.id === nestedId;
                        return (
                          <li key={row.id}>
                            <button
                              type="button"
                              aria-current={on ? "true" : undefined}
                              onClick={() => onPickNested?.(item.id, row.id)}
                              className={cn(
                                "flex w-full items-center rounded-[var(--radius-xl)] px-3 py-2 text-left text-sm leading-5",
                                PHASE_FOCUS,
                                on
                                  ? "bg-purple-100 font-bold text-purple-700"
                                  : "font-normal text-grey-700 hover:bg-purple-100",
                              )}
                            >
                              <span className="min-w-0 flex-1">{row.title}</span>
                              {row.done ? (
                                <span className="shrink-0 rounded-full bg-success-200 px-2 py-0.5 text-xs leading-4 font-bold text-success-800">
                                  Done
                                </span>
                              ) : null}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </div>
                {!last && !top ? <div className="h-2 shrink-0" aria-hidden /> : null}
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
