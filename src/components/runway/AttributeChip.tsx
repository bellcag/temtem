import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Runway: Attribute Chips — Enterprise (1:1)
 * Display-only metadata near titles / cards. Not for selection or actions.
 */
export function AttributeChip({
  children,
  className,
  size = "sm",
}: {
  children: ReactNode;
  className?: string;
  /** sm ≈ mobile; md ≈ desktop per Runway guidance */
  size?: "sm" | "md";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[var(--radius-sm)] border border-grey-100 bg-white font-bold text-grey-700",
        size === "sm" && "px-2 py-1 text-[11px]",
        size === "md" && "px-2.5 py-1.5 text-xs",
        className,
      )}
    >
      {children}
    </span>
  );
}
