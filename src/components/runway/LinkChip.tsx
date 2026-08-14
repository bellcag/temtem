import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

/**
 * Runway: gap — interactive chip/link.
 * Attribute Chips are display-only; use LinkChip for navigational people/systems.
 */
export function LinkChip({
  to,
  children,
  onClick,
  className,
  outlined,
  endAdornment,
}: {
  to: string;
  children: ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  outlined?: boolean;
  endAdornment?: ReactNode;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-[var(--radius-sm)] px-2 py-1 text-xs font-bold text-black",
        outlined
          ? "border border-grey-200 bg-white hover:border-purple-300 hover:text-purple-700"
          : "bg-grey-75 hover:bg-purple-100 hover:text-purple-700",
        className,
      )}
    >
      {children}
      {endAdornment}
    </Link>
  );
}
