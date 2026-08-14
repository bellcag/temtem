import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { MicroLabel } from "./MicroLabel";

/**
 * Runway: gap — context / “also happening” note in the journey.
 * No published Runway counterpart; lighter than GuideStepCard.
 */
export function ContextNote({
  id,
  stageName,
  title,
  summary,
  focused,
  onFocus,
  children,
}: {
  id: string;
  stageName: string;
  title: string;
  summary: string;
  focused: boolean;
  onFocus: () => void;
  children?: ReactNode;
}) {
  return (
    <div
      id={id}
      tabIndex={0}
      onClick={onFocus}
      className={cn(
        "scroll-mt-20 cursor-pointer rounded-[var(--radius-sm)] px-3 py-2.5 outline-none transition desktop:scroll-mt-8",
        focused ? "bg-grey-75" : "bg-grey-50 hover:bg-grey-75",
      )}
    >
      <MicroLabel className="!text-grey-400">{stageName}</MicroLabel>
      <p className="mt-0.5 text-sm font-semibold leading-[18px] text-grey-700">
        {title}
      </p>
      <p className="mt-1 text-xs leading-4 text-grey-500">{summary}</p>
      {children}
    </div>
  );
}
