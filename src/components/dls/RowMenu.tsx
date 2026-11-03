import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export type RowMenuItem = {
  id: string;
  label: string;
  onSelect: () => void;
  danger?: boolean;
};

/** "More actions" button for a table row. The menu is portalled so the table's overflow can't clip it. */
export function RowMenu({ label, items }: { label: string; items: RowMenuItem[] }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [box, setBox] = useState<{ top: number; right: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    const place = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      setBox({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    };
    place();
    const close = () => setOpen(false);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("resize", place);
    window.addEventListener("scroll", close, true);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", close, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (items.length === 0) return null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-[var(--radius-md)] text-grey-700 hover:bg-grey-50 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]",
          open && "bg-grey-50",
        )}
      >
        <MoreHorizontal aria-hidden size={16} />
      </button>
      {open && box
        ? createPortal(
            <>
              <button
                type="button"
                aria-label="Close actions"
                className="fixed inset-0 z-40 cursor-default"
                onClick={() => setOpen(false)}
              />
              <div
                role="menu"
                aria-label={label}
                style={{ top: box.top, right: box.right }}
                className="fixed z-50 min-w-40 overflow-hidden rounded-[var(--radius-md)] border border-grey-100 bg-white py-1 shadow-[var(--shadow-light-bg)]"
              >
                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setOpen(false);
                      item.onSelect();
                    }}
                    className={cn(
                      "flex w-full px-3 py-2 text-left text-sm leading-[18px] font-bold hover:bg-grey-50 focus-visible:outline-none focus-visible:bg-grey-50",
                      item.danger ? "text-error-600" : "text-black",
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </>,
            document.body,
          )
        : null}
    </>
  );
}
