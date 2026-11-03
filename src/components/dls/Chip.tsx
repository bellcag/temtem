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

/** ➗ Components Attribute Chip · Property=Functional Features · Size=sm */
export function AttributeChip({ children }: { children: ReactNode }) {
  return (
    <span
      className="inline-flex h-6 w-fit max-w-full items-center rounded-[var(--radius-sm)] bg-grey-50 px-2 text-xs leading-4 font-bold text-grey-700"
      title={typeof children === "string" ? children : undefined}
    >
      <span className="min-w-0 truncate">{children}</span>
    </span>
  );
}

/** Size=sm pill. Brand tone matches ➗ Filter Chip Status=Applied / active. */
export function StatusChip({
  children,
  tone = "grey",
}: {
  children: ReactNode;
  tone?: "grey" | "brand";
}) {
  return (
    <span
      className={cn(
        "inline-flex h-[22px] w-fit max-w-full items-center rounded-full px-2 text-[11px] leading-[14px] font-bold",
        tone === "brand"
          ? "border border-transparent bg-purple-200 text-purple-700"
          : "border border-grey-200 bg-white text-grey-700",
      )}
    >
      {children}
    </span>
  );
}

/** Status word + optional count. Dot marks the state; number is not mashed into the label. */
export function StatusTag({
  label,
  count,
  tone = "brand",
}: {
  label: string;
  count?: number;
  tone?: "grey" | "brand" | "success";
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 w-fit max-w-full items-center gap-1.5 rounded-full px-2 text-xs leading-4 font-bold",
        tone === "brand" && "bg-purple-100 text-purple-700",
        tone === "success" && "bg-success-100 text-success-800",
        tone === "grey" && "border border-grey-200 bg-white text-grey-700",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "size-1.5 shrink-0 rounded-full",
          tone === "brand" && "bg-purple-600",
          tone === "success" && "bg-success-600",
          tone === "grey" && "bg-grey-400",
        )}
      />
      <span className="min-w-0 truncate">{label}</span>
      {count != null ? (
        <span
          className={cn(
            "tabular-nums",
            tone === "brand" && "text-purple-600",
            tone === "success" && "text-success-600",
            tone === "grey" && "text-grey-500",
          )}
        >
          {count}
        </span>
      ) : null}
    </span>
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
