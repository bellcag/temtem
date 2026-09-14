import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SearchHitRow({
  title,
  hint,
  preview,
  icon,
  onClick,
}: {
  title: string;
  hint?: string;
  preview?: string;
  icon?: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-3 px-4 py-2.5 text-left hover:bg-grey-50",
        "focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]",
      )}
    >
      {icon ? <span className="mt-0.5 shrink-0">{icon}</span> : null}
      <span className="min-w-0 flex-1">
        <span className="block text-sm leading-[18px] font-bold text-black">
          {title}
        </span>
        {preview ? (
          <span className="mt-0.5 block text-sm leading-[18px] text-grey-500">
            {preview}
          </span>
        ) : null}
        {hint ? (
          <span className="mt-0.5 block text-xs leading-4 text-grey-500">
            {hint}
          </span>
        ) : null}
      </span>
    </button>
  );
}
