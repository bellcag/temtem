import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ChevronFirst,
  ChevronLast,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const DLS_PAGE_SIZE = 20;

export function dlsPageCount(total: number, size = DLS_PAGE_SIZE) {
  return Math.max(1, Math.ceil(total / size));
}

function StepButton({
  label,
  icon: Icon,
  disabled,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-9 shrink-0 place-items-center rounded-[var(--radius-md)] text-black hover:bg-grey-50 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)] disabled:cursor-default disabled:bg-transparent disabled:text-grey-300"
    >
      <Icon className="size-5" aria-hidden />
    </button>
  );
}

/** Runway Pagination, Pages mode with items per page off. Left on tablet and up, centred on phone. */
export function DlsPagination({
  page,
  pageCount,
  onPage,
  className,
}: {
  page: number;
  pageCount: number;
  onPage: (page: number) => void;
  className?: string;
}) {
  const [draft, setDraft] = useState(String(page));
  useEffect(() => setDraft(String(page)), [page]);
  const go = (next: number) => onPage(Math.min(pageCount, Math.max(1, next)));
  const commit = () => {
    const next = Number(draft);
    if (Number.isFinite(next) && draft.trim() !== "") go(Math.round(next));
    else setDraft(String(page));
  };
  return (
    <nav
      aria-label="Pagination"
      className={cn("flex flex-col border-t border-grey-100 pt-5", className)}
    >
      <div className="flex items-center justify-center tablet:justify-start">
        <StepButton label="First page" icon={ChevronFirst} disabled={page <= 1} onClick={() => go(1)} />
        <StepButton label="Previous page" icon={ArrowLeft} disabled={page <= 1} onClick={() => go(page - 1)} />
        <label className="flex items-center gap-2 text-sm leading-[18px] font-bold text-black">
          Page
          <input
            aria-label="Page number"
            inputMode="numeric"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={commit}
            onKeyDown={(event) => {
              if (event.key === "Enter") commit();
            }}
            className="size-9 rounded-[var(--radius-md)] border border-grey-200 bg-white text-center text-sm leading-[18px] font-normal text-black focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
          />
          of {pageCount}
        </label>
        <StepButton label="Next page" icon={ArrowRight} disabled={page >= pageCount} onClick={() => go(page + 1)} />
        <StepButton label="Last page" icon={ChevronLast} disabled={page >= pageCount} onClick={() => go(pageCount)} />
      </div>
    </nav>
  );
}
