import type { ReactNode } from "react";
import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Overlay, OverlayHost } from "./Overlay";
import { Button } from "./Button";

/**
 * Runway: gap — side drawer on Overlay.
 * Closest published: Overlay + Modal stub (_excluded). Used for doc preview / panels.
 */
export function Drawer({
  open,
  onClose,
  title,
  eyebrow,
  meta,
  children,
  footer,
  className,
  labelledBy = "drawer-title",
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  eyebrow?: ReactNode;
  meta?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  labelledBy?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <OverlayHost className="flex justify-end">
      <Overlay onClick={onClose} label="Close drawer" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={cn(
          "relative flex h-full w-full max-w-xl flex-col border-l border-grey-100 bg-white shadow-[var(--shadow-light-bg)] desktop:max-w-2xl",
          className,
        )}
      >
        <header className="flex items-start justify-between gap-3 border-b border-grey-75 px-5 py-4">
          <div className="min-w-0">
            {eyebrow != null && (
              <p className="text-[10px] font-bold uppercase tracking-wider text-grey-500">
                {eyebrow}
              </p>
            )}
            <h2
              id={labelledBy}
              className="mt-1 text-base font-bold text-black"
            >
              {title}
            </h2>
            {meta != null && (
              <p className="mt-1 text-xs text-grey-500">{meta}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 !px-1.5 !py-1.5 text-grey-500"
          >
            <X className="h-4 w-4" />
          </Button>
        </header>
        <div className="flex min-h-0 flex-1 flex-col bg-grey-75">{children}</div>
        {footer != null && (
          <footer className="flex flex-col gap-2 border-t border-grey-75 bg-white p-4">
            {footer}
          </footer>
        )}
      </aside>
    </OverlayHost>
  );
}
