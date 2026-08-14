import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Runway: Buttons — Enterprise (1:1 / near)
 * One Primary per screen; Title Case labels; actionable verbs.
 */
export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[var(--radius-sm)] font-bold transition disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" && "px-3 py-2 text-xs",
        size === "md" && "px-3 py-2.5 text-sm",
        size === "lg" && "min-w-[240px] px-4 py-3 text-sm",
        variant === "primary" &&
          "bg-purple-600 text-white hover:bg-purple-700",
        variant === "secondary" &&
          "border border-grey-200 bg-white text-black hover:border-purple-300 hover:text-purple-700",
        variant === "ghost" &&
          "bg-transparent text-grey-600 hover:bg-grey-50 hover:text-black",
        variant === "danger" &&
          "bg-error-600 text-white hover:opacity-90",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
