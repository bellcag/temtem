import caretDown from "@/assets/figma/caret-down.svg";
import { cn } from "@/lib/utils";

export function UnitSelection({
  value,
  options,
  chips,
  showSelect = true,
  onChange,
  className,
  chipsClassName,
  alignChips = "end",
}: {
  value: string;
  options: { value: string; label: string }[];
  chips: string[];
  showSelect?: boolean;
  onChange?: (value: string) => void;
  className?: string;
  chipsClassName?: string;
  /** `field` lines the chips up with the dropdown. `end` keeps them on the right of the block. */
  alignChips?: "end" | "field";
}) {
  const selected =
    options.find((row) => row.value === value)?.label ?? value;

  return (
    <div
      className={cn(
        "flex w-full min-w-0 flex-col gap-2 tablet:w-[259px] tablet:shrink-0",
        className,
      )}
    >
      <label className="flex w-full items-center gap-2">
        <span className="shrink-0 text-sm leading-[18px] font-bold text-grey-500">
          For
        </span>
        {showSelect ? (
          <span className="relative min-w-0 flex-1">
            <select
              value={value}
              onChange={(e) => onChange?.(e.target.value)}
              className="h-9 w-full appearance-none rounded-[var(--radius-md)] border border-grey-200 bg-white bg-none pr-10 pl-3 text-sm leading-[18px] text-black text-ellipsis focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)] [&::-ms-expand]:hidden"
            >
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <img
              src={caretDown}
              alt=""
              aria-hidden
              width={10}
              height={6}
              className="pointer-events-none absolute top-1/2 right-3 h-[6px] w-2.5 -translate-y-1/2 object-contain"
            />
          </span>
        ) : (
          <span className="flex h-9 min-w-0 flex-1 items-center rounded-[var(--radius-md)] border border-grey-200 bg-white px-3 text-sm leading-[18px] text-black">
            {selected}
          </span>
        )}
      </label>
      {chips.length > 0 ? (
        <div
          className={cn(
            "flex gap-2",
            alignChips === "end" && "flex-wrap tablet:justify-end",
            chipsClassName,
          )}
        >
          {alignChips === "field" ? (
            <span
              className="invisible shrink-0 text-sm leading-[18px] font-bold"
              aria-hidden
            >
              For
            </span>
          ) : null}
          <div className="flex min-w-0 flex-wrap gap-1">
            {chips.map((chip) => (
              <span
                key={chip}
                className="inline-flex h-[22px] w-fit shrink-0 items-center rounded-[6px] border border-grey-300 px-2 text-[11px] leading-[14px] font-bold text-grey-700"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
