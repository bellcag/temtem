import { cn } from "@/lib/utils";
import { MicroLabel } from "./MicroLabel";

/**
 * Runway: gap — closest Selectors / Filter Chips, but exclusive single-select
 * without Applied × dismiss. Compact segment group for view / context switches.
 */
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onSelect,
  locked,
  className,
  size = "md",
}: {
  label?: string;
  options: readonly T[] | { id: T; label: string; disabled?: boolean }[];
  value: T | null;
  onSelect: (v: T) => void;
  locked?: boolean;
  className?: string;
  size?: "sm" | "md";
}) {
  const normalized = options.map((o) =>
    typeof o === "string" ? { id: o, label: o } : o,
  );

  return (
    <div className={className}>
      {label != null && (
        <MicroLabel className="mb-1 px-0">
          {label}
          {locked ? " · locked" : ""}
        </MicroLabel>
      )}
      <div
        role="group"
        aria-label={typeof label === "string" ? label : undefined}
        className={cn(
          "inline-flex w-full gap-1 rounded-[var(--radius-sm)] border border-grey-200 bg-grey-25 p-1",
          size === "sm" && "border-grey-100 bg-white",
        )}
      >
        {normalized.map((o) => {
          const selected = value === o.id;
          const disabled = locked || o.disabled;
          return (
            <button
              key={o.id}
              type="button"
              disabled={disabled}
              aria-pressed={selected}
              onClick={() => !disabled && onSelect(o.id)}
              className={cn(
                "flex-1 rounded-[var(--radius-sm)] font-bold transition",
                size === "sm" && "px-2 py-1.5 text-xs",
                size === "md" && "px-3 py-2 text-xs",
                selected
                  ? "bg-purple-600 text-white"
                  : "text-grey-500 hover:text-black",
                disabled && "cursor-not-allowed opacity-50",
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
