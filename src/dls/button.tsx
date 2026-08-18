import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Actions & Interactions/Button — B2B defaults (semiRounded). */
export type ButtonVariant =
  | "primary"
  | "secondary_colored"
  | "secondary_mono"
  | "tertiary"
  | "destructive_primary"
  | "destructive_secondary";

export type ButtonSize = "lg" | "md" | "sm";
export type ButtonShape = "semiRounded" | "rounded";

const VARIANT: Record<ButtonVariant, string> = {
  primary:
    "border border-transparent bg-primary-600 text-white hover:bg-primary-500 active:bg-primary-700 disabled:bg-grey-100 disabled:text-grey-300",
  secondary_colored:
    "border border-primary-600 bg-white text-primary-600 hover:bg-primary-100 active:bg-primary-200 disabled:border-grey-100 disabled:text-grey-300",
  secondary_mono:
    "border border-grey-200 bg-white text-grey-700 hover:border-grey-900 hover:text-black disabled:border-grey-100 disabled:text-grey-300",
  tertiary:
    "border border-transparent bg-transparent text-primary-600 hover:bg-primary-100 active:bg-primary-200 disabled:text-grey-300",
  destructive_primary:
    "border border-transparent bg-error-600 text-white hover:bg-error-500 disabled:bg-grey-100 disabled:text-grey-300",
  destructive_secondary:
    "border border-error-600 bg-white text-error-600 hover:bg-error-100 disabled:border-grey-100 disabled:text-grey-300",
};

const SIZE: Record<ButtonSize, string> = {
  lg: "h-[44px] min-h-[44px] px-6 text-body-s font-bold",
  md: "h-[36px] min-h-[36px] px-4 text-small font-bold",
  sm: "h-[28px] min-h-[28px] px-3 text-xsmall font-bold",
};

const ICON_ONLY: Record<ButtonSize, string> = {
  lg: "h-[44px] w-[44px] min-h-[44px] px-0",
  md: "h-[36px] w-[36px] min-h-[36px] px-0",
  sm: "h-[28px] w-[28px] min-h-[28px] px-0",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  shape?: ButtonShape;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  iconOnly?: boolean;
};

export function Button({
  variant = "primary",
  size = "lg",
  shape = "semiRounded",
  leadingIcon,
  trailingIcon,
  iconOnly,
  className,
  children,
  type = "button",
  ...props
}: Props) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors",
        "focus-visible:outline-none focus-visible:shadow-ring-light",
        "disabled:pointer-events-none disabled:cursor-not-allowed",
        VARIANT[variant],
        iconOnly ? ICON_ONLY[size] : SIZE[size],
        shape === "rounded" ? "rounded-full" : "rounded-[8px]",
        className,
      )}
      {...props}
    >
      {!iconOnly && leadingIcon}
      {iconOnly ? (leadingIcon ?? children) : children}
      {!iconOnly && trailingIcon}
    </button>
  );
}
