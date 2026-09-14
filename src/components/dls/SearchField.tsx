import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export const SearchField = forwardRef<
  HTMLInputElement,
  {
    id: string;
    label: string;
    leading?: ReactNode;
    trailing?: ReactNode;
    onClear?: () => void;
  } & Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "className" | "type">
>(function SearchField(
  { id, label, leading, trailing, onClear, className, value, ...rest },
  ref,
) {
  const typed = String(value ?? "").length > 0;

  return (
    <div className="group relative min-w-0 flex-1">
      <label className="sr-only" htmlFor={id}>
        {label}
      </label>
      {leading ? (
        <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-grey-400 group-focus-within:text-purple-600 group-has-[[aria-expanded=true]]:text-purple-600">
          {leading}
        </span>
      ) : null}
      <input
        ref={ref}
        id={id}
        type="search"
        autoComplete="off"
        value={value}
        className={cn(
          "h-12 w-full min-w-0 appearance-none rounded-[var(--radius-sm)] border border-grey-200 bg-white py-3 text-base leading-5 text-black text-ellipsis placeholder:text-grey-300 placeholder:text-ellipsis",
          leading ? "pl-12" : "pl-3",
          typed || trailing ? "pr-12" : "pr-3",
          "outline-none",
          "focus:border-purple-600 focus:shadow-[0_0_0_2px_var(--color-purple-600)]",
          "aria-expanded:border-purple-600 aria-expanded:shadow-[0_0_0_2px_var(--color-purple-600)]",
          "disabled:opacity-40",
          "[&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden",
          className,
        )}
        {...rest}
      />
      {typed && onClear ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={onClear}
          className="absolute top-1/2 right-3 grid size-8 -translate-y-1/2 place-items-center rounded-[var(--radius-sm)] text-grey-500 hover:bg-grey-50 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
        >
          {trailing ?? (
            <span aria-hidden className="text-lg leading-none">
              ×
            </span>
          )}
        </button>
      ) : trailing ? (
        <span className="absolute top-1/2 right-3 -translate-y-1/2">
          {trailing}
        </span>
      ) : null}
    </div>
  );
});
