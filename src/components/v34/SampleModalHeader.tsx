import closeIcon from "@/assets/figma/x-close.svg";
import { cn } from "@/lib/utils";

export type SampleKind = "good" | "bad";

/** Title and Good / Bad toggle on the left, close always at the far right. */
export function SampleModalHeader({
  titleId,
  title,
  kind,
  onKind,
  onClose,
}: {
  titleId: string;
  title: string;
  kind: SampleKind;
  onKind: (kind: SampleKind) => void;
  onClose: () => void;
}) {
  return (
    <header className="flex items-start justify-between gap-3 border-b border-grey-75 px-4 py-3 tablet:px-5">
      <div className="flex min-w-0 flex-1 flex-col gap-3 tablet:flex-row tablet:items-center tablet:justify-between">
        <h2
          id={titleId}
          className="min-w-0 truncate pt-2.5 text-base leading-5 font-bold text-black tablet:pt-0"
        >
          {title}
        </h2>
        <div className="flex shrink-0 self-start rounded-full bg-grey-50 p-1 tablet:self-auto">
          {(["good", "bad"] as const).map((row) => (
            <button
              key={row}
              type="button"
              aria-pressed={kind === row}
              onClick={() => onKind(row)}
              className={cn(
                "h-8 rounded-full px-3 text-sm leading-[18px]",
                kind === row
                  ? "bg-white font-bold text-purple-600 shadow-[var(--shadow-light-bg)]"
                  : "text-grey-500",
              )}
            >
              {row === "good" ? "Good" : "Bad"}
            </button>
          ))}
        </div>
      </div>
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-sm)] text-black hover:bg-grey-50 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
      >
        <img src={closeIcon} alt="" width={20} height={20} />
      </button>
    </header>
  );
}
