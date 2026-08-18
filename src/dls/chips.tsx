import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ChipSize = "sm" | "md";

const CHIP_SIZE: Record<ChipSize, string> = {
  sm: "h-[24px] px-2 text-xxsmall",
  md: "h-[28px] px-2.5 text-xsmall",
};

/** Actions & Interactions/AttributeChip — Functional (admin metadata). */
export function AttributeChip({
  className,
  size = "md",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { size?: ChipSize }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[8px] border border-grey-100 bg-white font-bold text-grey-700",
        CHIP_SIZE[size],
        className,
      )}
      {...props}
    />
  );
}

const STATUS_COLOR = {
  grey: "bg-grey-75 text-grey-700 border-transparent",
  primary: "bg-primary-100 text-primary-700 border-transparent",
  success: "bg-success-100 text-success-600 border-transparent",
  warning: "bg-warning-100 text-warning-700 border-transparent",
  error: "bg-error-100 text-error-600 border-transparent",
  outline: "bg-white text-grey-700 border-grey-200",
} as const;

const DOT: Record<keyof typeof STATUS_COLOR, string> = {
  grey: "bg-grey-500",
  primary: "bg-primary-600",
  success: "bg-success-600",
  warning: "bg-warning-600",
  error: "bg-error-600",
  outline: "bg-grey-400",
};

/** Actions & Interactions/StatusChip */
export function StatusChip({
  color = "grey",
  dot,
  size = "md",
  className,
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  color?: keyof typeof STATUS_COLOR;
  dot?: boolean;
  size?: ChipSize;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-bold",
        CHIP_SIZE[size],
        STATUS_COLOR[color],
        className,
      )}
      {...props}
    >
      {dot && (
        <span
          aria-hidden
          className={cn("h-1.5 w-1.5 shrink-0 rounded-full", DOT[color])}
        />
      )}
      {children}
    </span>
  );
}

/** Actions & Interactions/FilterChip */
export function FilterChip({
  selected,
  leadingIcon,
  size = "md",
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean;
  leadingIcon?: ReactNode;
  size?: ChipSize;
}) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-bold transition-colors",
        "focus-visible:outline-none focus-visible:shadow-ring-light",
        "disabled:cursor-not-allowed disabled:opacity-40",
        CHIP_SIZE[size],
        selected
          ? "border-primary-600 bg-primary-600 text-white"
          : "border-grey-200 bg-white text-grey-700 hover:border-grey-900",
        className,
      )}
      aria-pressed={selected}
      {...props}
    >
      {leadingIcon}
      {children}
    </button>
  );
}
