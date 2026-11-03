import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ActionButtonVariant = "primary" | "secondary" | "tertiary";
export type ActionButtonSize = "sm" | "md" | "lg";

const SIZE: Record<ActionButtonSize, string> = {
  sm: "h-10 min-w-0 px-4 text-sm leading-[18px]",
  md: "h-11 min-w-0 px-5 text-sm leading-[18px]",
  lg: "h-12 min-w-[240px] px-6 text-base leading-5",
};

/** Buttons/Text Semi-Rounded — no fill, no padding; icon gap is spacing-4. */
const TEXT_SIZE: Record<ActionButtonSize, string> = {
  sm: "min-w-0 px-0 py-0 text-sm leading-[18px]",
  md: "min-w-0 px-0 py-0 text-sm leading-[18px]",
  lg: "min-w-0 px-0 py-0 text-base leading-5",
};

const VARIANT: Record<ActionButtonVariant, string> = {
  primary:
    "bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800 disabled:bg-grey-100 disabled:text-grey-300",
  secondary:
    "border border-grey-200 bg-white text-black hover:bg-grey-50 disabled:border-grey-100 disabled:text-grey-300",
  tertiary:
    "bg-transparent text-purple-600 hover:text-purple-700 disabled:text-grey-300",
};

/** 👻 Iconography glyph on a DLS button — inherits the label colour. */
export function ActionButtonIcon({
  src,
  className,
}: {
  src: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn("inline-block size-4 shrink-0 bg-current", className)}
      style={{
        WebkitMaskImage: `url("${src}")`,
        maskImage: `url("${src}")`,
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
      }}
    />
  );
}

export function ActionButton({
  variant = "primary",
  size = "md",
  iconStart,
  iconEnd,
  className,
  children,
  type = "button",
  ...rest
}: {
  variant?: ActionButtonVariant;
  size?: ActionButtonSize;
  iconStart?: ReactNode;
  iconEnd?: ReactNode;
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const text = variant === "tertiary";
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center font-bold",
        text ? "gap-1" : "gap-3 rounded-[var(--radius-sm)]",
        "focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]",
        text ? TEXT_SIZE[size] : SIZE[size],
        VARIANT[variant],
        className,
      )}
      {...rest}
    >
      {iconStart}
      {children}
      {iconEnd}
    </button>
  );
}
