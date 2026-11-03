import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/** Home Default unit scope: 259px block, 36px dropdown, 22px outline chips. */
export function V31UnitField({
  value,
  options,
  chips,
  showSelect = true,
  onChange,
  className,
}: {
  value: string;
  options: { value: string; label: string }[];
  chips: string[];
  showSelect?: boolean;
  onChange?: (value: string) => void;
  className?: string;
}) {
  const selected = options.find((row) => row.value === value)?.label ?? value;

  return (
    <div
      className={cn(
        "flex w-[259px] max-w-full shrink-0 flex-col gap-2",
        className,
      )}
    >
      <label className="flex h-9 w-full items-center gap-2">
        <span className="w-[22px] shrink-0 text-sm leading-[18px] font-normal text-grey-500">
          For
        </span>
        {showSelect ? (
          <span className="relative h-9 min-w-0 flex-1">
            <select
              value={value}
              onChange={(e) => onChange?.(e.target.value)}
              className="h-9 w-full appearance-none rounded-[var(--radius-md)] border border-grey-200 bg-white pr-11 pl-3 text-sm leading-[18px] font-normal text-black focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
            >
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-grey-700"
              aria-hidden
            />
          </span>
        ) : (
          <span className="flex h-9 min-w-0 flex-1 items-center rounded-[var(--radius-md)] border border-grey-200 bg-white px-3 text-sm leading-[18px] text-black">
            {selected}
          </span>
        )}
      </label>
      {chips.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {chips.map((chip) => (
            <span
              key={chip}
              className="inline-flex h-[22px] w-fit shrink-0 items-center rounded-[6px] border border-grey-300 px-2 text-[11px] leading-[14px] font-bold text-grey-700"
            >
              {chip}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
