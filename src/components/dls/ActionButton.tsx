import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ActionButtonVariant = "primary" | "secondary" | "tertiary";
export type ActionButtonSize = "sm" | "md" | "lg";

const SIZE: Record<ActionButtonSize, string> = {
  sm: "h-10 min-w-0 px-4 text-sm leading-[18px]",
  md: "h-11 min-w-0 px-5 text-sm leading-[18px]",
  lg: "h-12 min-w-[240px] px-6 text-base leading-5",
};

const VARIANT: Record<ActionButtonVariant, string> = {
  primary:
    "bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800 disabled:bg-grey-100 disabled:text-grey-300",
  secondary:
    "border border-grey-200 bg-white text-black hover:bg-grey-50 disabled:border-grey-100 disabled:text-grey-300",
  tertiary:
    "bg-transparent text-purple-600 hover:text-purple-700 hover:bg-purple-100 disabled:text-grey-300",
};

export function ActionButton({
  variant = "primary",
  size = "md",
  className,
  children,
  type = "button",
  ...rest
}: {
  variant?: ActionButtonVariant;
  size?: ActionButtonSize;
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-3 rounded-[var(--radius-sm)] font-bold",
        "focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]",
        SIZE[size],
        VARIANT[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
