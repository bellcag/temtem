import type { ReactNode, SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Text } from "@/dls/text";

/** Core/Field — label + optional hint/error wrapping a control. */
export function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label htmlFor={htmlFor} className={cn("flex w-full flex-col gap-1", className)}>
      <Text as="span" size="xx-small" className="px-0.5">
        {label}
      </Text>
      {children}
      {error ? (
        <Text as="span" size="x-small" className="px-0.5 text-error-600">
          {error}
        </Text>
      ) : hint ? (
        <Text as="span" size="x-small" className="px-0.5 text-grey-500">
          {hint}
        </Text>
      ) : null}
    </label>
  );
}

/** Inputs/Dropdown — native select with Field chrome (B2B, size lg). */
export function Dropdown({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-[44px] w-full appearance-none rounded-[8px] border border-grey-200 bg-white",
        "bg-[length:16px_16px] bg-[position:right_12px_center] bg-no-repeat px-3 pr-10",
        "bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 fill=%22none%22 stroke=%22%23454545%22 stroke-width=%222%22><path d=%22m4 6 4 4 4-4%22/></svg>')]",
        "text-body-s font-bold text-black",
        "focus:border-primary-600 focus:shadow-ring-light focus:outline-none",
        "disabled:cursor-not-allowed disabled:bg-grey-50 disabled:text-grey-300",
        className,
      )}
      {...props}
    />
  );
}
