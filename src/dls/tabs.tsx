import { cn } from "@/lib/utils";

export type TabItem = { id: string; label: string; disabled?: boolean };

/** Content navigations/Tabs — Horizontal Full (B2B segmented). */
export function Tabs({
  items,
  value,
  onChange,
  className,
}: {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex w-full rounded-[8px] border border-grey-200 bg-grey-25 p-1 desktop:w-auto",
        className,
      )}
    >
      {items.map((item) => {
        const selected = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={selected}
            disabled={item.disabled}
            onClick={() => !item.disabled && onChange(item.id)}
            className={cn(
              "flex-1 rounded-[8px] px-3 py-2 text-xsmall font-bold transition desktop:flex-none desktop:px-4",
              "focus-visible:outline-none focus-visible:shadow-ring-light",
              selected
                ? "bg-primary-600 text-white"
                : "text-grey-500 hover:text-black",
              item.disabled && "cursor-not-allowed opacity-40",
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

/** Content navigations/Tabs — Horizontal Minimal (underline). */
export function TabsMinimal({
  items,
  value,
  onChange,
  className,
}: {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn("flex gap-4 border-b border-grey-100", className)}
    >
      {items.map((item) => {
        const selected = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={selected}
            disabled={item.disabled}
            onClick={() => !item.disabled && onChange(item.id)}
            className={cn(
              "border-b-2 px-1 pb-2 text-body-s transition",
              selected
                ? "border-primary-600 font-bold text-grey-900"
                : "border-transparent font-bold text-grey-400 hover:text-grey-900",
              item.disabled && "cursor-not-allowed opacity-40",
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
