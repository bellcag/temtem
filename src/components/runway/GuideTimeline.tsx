import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Runway: gap — numbered vertical journey rail.
 * Closest: Progress Steps (_excluded stub).
 */
export function GuideTimelineItem({
  index,
  focused,
  variant = "action",
  isLast,
  nextIsNote,
  children,
}: {
  index: number;
  focused: boolean;
  variant?: "action" | "note";
  isLast: boolean;
  nextIsNote: boolean;
  children: ReactNode;
}) {
  const isNote = variant === "note";
  const pad = isNote
    ? nextIsNote
      ? "pb-2"
      : "pb-8"
    : nextIsNote
      ? "pb-4"
      : "pb-8";

  return (
    <li className={cn("relative pl-10", !isLast && pad)}>
      <div
        className={cn(
          "pointer-events-none absolute top-0 left-[13px] w-0.5",
          !isNote && focused ? "bg-purple-300" : "bg-grey-100",
          isLast ? (isNote ? "h-5" : "h-6") : "bottom-0",
        )}
      />
      <span
        className={cn(
          "absolute top-0 left-0 z-10 grid place-items-center bg-white text-[11px] font-black transition",
          isNote ? "rounded-[var(--radius-sm)]" : "rounded-full",
          focused
            ? isNote
              ? "h-7 w-7 border-2 border-grey-400 text-grey-700 shadow-[0_0_0_3px_var(--color-grey-75)]"
              : "h-7 w-7 border-2 border-purple-600 text-purple-700 shadow-[0_0_0_3px_var(--color-purple-100)]"
            : "h-6 w-6 border border-grey-200 text-grey-500",
        )}
        title={isNote ? `Step ${index}` : `Guide step ${index}`}
      >
        <span className="sr-only">Step </span>
        {index}
      </span>
      {children}
    </li>
  );
}

export function GuideTimeline({ children }: { children: ReactNode }) {
  return <ol className="relative flex flex-col">{children}</ol>;
}
