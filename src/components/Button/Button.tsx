import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Runway Buttons/Icon Full-Rounded. ToTop uses Secondary (Mono) / lg. */
export function Button({
  type = "Secondary (Mono)",
  size = "lg",
  "aria-label": ariaLabel,
  onClick,
  children,
  className,
}: {
  type?: "Secondary (Mono)";
  size?: "lg";
  "aria-label": string;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      data-type={type}
      data-size={size}
      className={cn(
        "inline-flex aspect-square size-11 shrink-0 items-center justify-center rounded-full",
        "border border-grey-300 bg-grey-25 text-grey-700",
        "shadow-[var(--shadow-light-bg)]",
        "hover:bg-grey-75",
        "focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]",
        className,
      )}
    >
      {children}
    </button>
  );
}
