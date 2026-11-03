import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import closeIcon from "@/assets/figma/close.svg";

const PHONE = 768;
/** Room above a phone sheet so the rounded top and title stay on screen. */
const TOP_GAP = 56;

/** Visible phone area. Null from tablet up, where the panel is a centered modal. */
export function usePhoneSheetFrame() {
  const [frame, setFrame] = useState<{ top: number; height: number } | null>(null);
  useEffect(() => {
    const vv = window.visualViewport;
    const sync = () => {
      if (window.innerWidth >= PHONE || !vv) {
        setFrame(null);
        return;
      }
      setFrame({ top: vv.offsetTop, height: vv.height });
    };
    sync();
    vv?.addEventListener("resize", sync);
    vv?.addEventListener("scroll", sync);
    window.addEventListener("resize", sync);
    return () => {
      vv?.removeEventListener("resize", sync);
      vv?.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, []);
  return frame;
}

export function phoneOverlayStyle(
  frame: { top: number; height: number } | null,
): CSSProperties | undefined {
  if (!frame) return undefined;
  return { top: frame.top, height: frame.height, bottom: "auto" };
}

export function phonePanelStyle(
  frame: { top: number; height: number } | null,
  fill = false,
): CSSProperties | undefined {
  if (!frame) return undefined;
  const max = Math.max(160, frame.height - TOP_GAP);
  return { maxHeight: max, ...(fill ? { height: max } : {}) };
}

/**
 * Phone: a bottom sheet with a gap at the top.
 * Tablet and up: a centered modal with space on every side.
 */
export function SheetFrame({
  onClose,
  closeLabel,
  titleId,
  fill = false,
  wide = false,
  zClass = "z-50",
  children,
}: {
  onClose: () => void;
  closeLabel: string;
  titleId: string;
  /** Tall viewers take the sheet height. Short notes stay as tall as their content. */
  fill?: boolean;
  wide?: boolean;
  zClass?: string;
  children: ReactNode;
}) {
  const frame = usePhoneSheetFrame();
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);
  return (
    <div
      className={cn(
        "fixed inset-0 flex items-end tablet:items-center tablet:justify-center tablet:p-8",
        zClass,
      )}
      style={phoneOverlayStyle(frame)}
    >
      <button
        type="button"
        aria-label={closeLabel}
        className="absolute inset-0 bg-[rgba(18,18,18,0.4)]"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={phonePanelStyle(frame, fill)}
        className={cn(
          "relative flex w-full min-h-0 flex-col overflow-hidden bg-white shadow-[var(--shadow-light-bg)]",
          "max-h-[calc(100svh-3.5rem)] rounded-t-[var(--radius-2xl)]",
          "pb-[env(safe-area-inset-bottom)]",
          fill && "h-[calc(100svh-3.5rem)]",
          "tablet:max-h-[80vh] tablet:rounded-[var(--radius-2xl)] tablet:pb-0",
          fill && "tablet:h-[80vh]",
          wide ? "tablet:max-w-5xl" : "tablet:max-w-md",
        )}
      >
        {children}
      </aside>
    </div>
  );
}

/**
 * The Tenancy Journey key-screen dialog: title, supporting line, 40px close.
 * Phone is a bottom sheet. Tablet and up is a 640px centered modal.
 */
export function JourneyDialog({
  onClose,
  closeLabel,
  titleId,
  title,
  subtitle,
  children,
}: {
  onClose: () => void;
  closeLabel: string;
  titleId: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const frame = usePhoneSheetFrame();
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);
  return (
    <div
      className="fixed inset-0 z-50 flex items-end tablet:items-center tablet:justify-center tablet:p-8"
      style={phoneOverlayStyle(frame)}
    >
      <button
        type="button"
        aria-label={closeLabel}
        className="absolute inset-0 bg-[rgba(18,18,18,0.4)]"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={phonePanelStyle(frame)}
        className="relative flex max-h-[80vh] w-full min-h-0 flex-col overflow-hidden rounded-t-[var(--radius-md)] bg-white shadow-[var(--shadow-light-bg)] tablet:max-w-[640px] tablet:rounded-[var(--radius-md)]"
      >
        <header className="flex items-start justify-between gap-4 px-6 pt-6 pb-2">
          <div className="min-w-0">
            <h2 id={titleId} className="text-[20px] leading-7 font-bold text-black">
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-1 text-sm leading-5 text-grey-600">{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-md)] text-black hover:bg-grey-50 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
          >
            <img src={closeIcon} alt="" width={16} height={16} />
          </button>
        </header>
        <div className="min-h-0 overflow-y-auto px-6 pt-4 pb-6">{children}</div>
      </aside>
    </div>
  );
}
