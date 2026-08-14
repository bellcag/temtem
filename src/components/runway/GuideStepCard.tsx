import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { StatusChip } from "./StatusChip";

/**
 * Runway: gap — process guide action step card.
 * Closest: Cards (_excluded stub). Focusable chapter card for one guide step.
 */
export function GuideStepCard({
  id,
  focused,
  stageName,
  showStage,
  title,
  summary,
  onFocus,
  children,
}: {
  id: string;
  focused: boolean;
  stageName: string;
  showStage: boolean;
  title: string;
  summary: string;
  onFocus: () => void;
  children?: ReactNode;
}) {
  return (
    <article
      id={id}
      tabIndex={0}
      onClick={onFocus}
      className={cn(
        "scroll-mt-20 cursor-pointer rounded-[var(--radius-md)] border bg-white p-4 outline-none tablet:p-6 desktop:scroll-mt-8 desktop:p-8",
        focused
          ? "border-purple-300 border-l-4 border-l-purple-600 bg-purple-100/40 shadow-[var(--shadow-light-bg)]"
          : "border-grey-100 shadow-[var(--shadow-light-bg)] hover:border-purple-200",
      )}
    >
      <header className="border-b border-grey-75 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          {(showStage || focused) &&
            (focused ? (
              <StatusChip
                tone="emphasis"
                className="!bg-purple-600 !text-white !normal-case tracking-wider"
              >
                {stageName}
              </StatusChip>
            ) : (
              <span className="text-[11px] font-bold uppercase tracking-wider text-grey-500">
                {stageName}
              </span>
            ))}
        </div>
        <h3 className="mt-1 text-base font-bold text-black desktop:text-lg desktop:leading-6">
          {title}
        </h3>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-grey-500 desktop:text-base desktop:leading-5">
          {summary}
        </p>
      </header>
      {children}
    </article>
  );
}
