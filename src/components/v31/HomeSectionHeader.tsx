import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { StatusTag } from "@/components/dls/Chip";
import { isV34Path, usesV35Flow } from "@/lib/process-v31-preview";
import { cn } from "@/lib/utils";
import caretDown from "@/assets/figma/caret-down.svg";

export function HomeSectionHeader({
  icon,
  title,
  count,
  countLabel,
  note,
  action,
  headerClassName,
  titleClassName,
  countTone = "brand",
}: {
  icon: ReactNode;
  title: string;
  count?: number;
  countLabel?: string;
  /** Quiet meta — not a status chip. Use when the count is not a live state. */
  note?: string;
  action?: { to: string; label: string };
  headerClassName?: string;
  titleClassName?: string;
  countTone?: "brand" | "warning";
}) {
  const path = useLocation().pathname;
  const quiet = isV34Path(path) || usesV35Flow(path);
  return (
    <header
      className={cn(
        "flex items-center gap-3 border-b border-grey-100 px-5 py-3",
        headerClassName,
      )}
    >
      <span
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-full",
          quiet ? "bg-grey-50 text-grey-700" : "bg-purple-100 text-purple-600",
        )}
      >
        {icon}
      </span>
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <h3
          className={cn(
            "min-w-0 truncate text-lg leading-[22px] font-bold text-black",
            titleClassName,
          )}
        >
          {title}
        </h3>
        {note ? (
          <span className="shrink-0 text-xs leading-4 text-grey-500">{note}</span>
        ) : count != null ? (
          countLabel && quiet ? (
            <span
              className={cn(
                "inline-flex h-6 shrink-0 items-center rounded-full px-2.5 text-xs leading-4 font-bold",
                countTone === "warning"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-purple-100 text-purple-700",
              )}
            >
              <span className="tabular-nums">{count}</span>&nbsp;{countLabel}
            </span>
          ) : countLabel ? (
            <StatusTag
              label={countLabel}
              count={count}
              tone={quiet ? "grey" : "brand"}
            />
          ) : (
            <StatusTag label={String(count)} tone="grey" />
          )
        ) : null}
      </div>
      {action ? (
        <Link
          to={action.to}
          aria-label={`${action.label} ${title}`}
          title={`${action.label} ${title}`}
          className={cn(
            "grid size-7 shrink-0 place-items-center rounded-[var(--radius-md)] border focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]",
            quiet
              ? "border-grey-200 text-grey-700 hover:bg-grey-50"
              : "border-purple-300 text-purple-600 hover:bg-purple-100",
          )}
        >
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
              transform: "rotate(-90deg)",
            }}
          />
        </Link>
      ) : null}
    </header>
  );
}
