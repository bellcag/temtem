import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function FilterChip({
  selected,
  className,
  children,
  ...rest
}: {
  selected?: boolean;
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "inline-flex h-8 items-center rounded-full px-3 text-sm leading-[18px]",
        "focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]",
        "disabled:opacity-40",
        selected
          ? "border border-purple-600 bg-purple-100 font-bold text-purple-700"
          : "border border-grey-200 bg-white text-grey-700 hover:border-purple-600 hover:bg-purple-100 hover:text-purple-700",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function OutlineChip({
  children,
  tone = "neutral",
}: {
  children: string;
  tone?: "neutral" | "warn" | "brand";
}) {
  if (tone === "warn") {
    return (
      <span className="inline-flex h-6 w-fit shrink-0 items-center rounded-[var(--radius-sm)] bg-warning-200 px-2 text-xs leading-4 font-bold text-warning-800">
        {children}
      </span>
    );
  }
  if (tone === "brand") {
    return (
      <span className="inline-flex h-6 w-fit shrink-0 items-center rounded-[var(--radius-sm)] border border-purple-600 bg-purple-100 px-2 text-xs leading-4 font-bold text-purple-700">
        {children}
      </span>
    );
  }
  return (
    <span className="inline-flex h-6 w-fit shrink-0 items-center rounded-[var(--radius-sm)] border border-grey-200 bg-white px-2 text-xs leading-4 font-bold text-grey-700">
      {children}
    </span>
  );
}
