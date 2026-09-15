import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function TextField({
  id,
  label,
  error,
  hint,
  trailing,
  hideLabel,
  className,
  ...rest
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  trailing?: ReactNode;
  hideLabel?: boolean;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "className">) {
  const describedBy = error
    ? `${id}-error`
    : hint
      ? `${id}-hint`
      : undefined;

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className={
          hideLabel
            ? "sr-only"
            : "text-sm leading-[18px] font-bold text-black"
        }
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={cn(
            "h-12 w-full rounded-[var(--radius-sm)] border bg-white px-3 text-base leading-5 text-black placeholder:text-grey-300",
            "focus-visible:outline-none focus-visible:border-purple-600 focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]",
            error ? "border-error-600" : "border-grey-200",
            trailing && "pr-12",
            className,
          )}
          {...rest}
        />
        {trailing ? (
          <div className="absolute top-1/2 right-2 -translate-y-1/2">
            {trailing}
          </div>
        ) : null}
      </div>
      {error ? (
        <p id={`${id}-error`} className="text-sm leading-[18px] text-error-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-sm leading-[18px] text-grey-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
