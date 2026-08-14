import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Runway: Status Chips — Enterprise (near)
 * Rectangular B2B chips for system/service status or short role tags.
 * Static — no hover/click behaviour.
 */
export function StatusChip({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "info" | "warning" | "success" | "error" | "emphasis";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[var(--radius-sm)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        tone === "neutral" && "bg-grey-75 text-grey-700",
        tone === "info" && "bg-grey-75 text-grey-700",
        tone === "warning" && "bg-warning-100 text-warning-600",
        tone === "success" && "bg-success-100 text-success-600",
        tone === "error" && "bg-error-100 text-error-600",
        tone === "emphasis" && "bg-purple-100 text-purple-700",
        className,
      )}
    >
      {children}
    </span>
  );
}
