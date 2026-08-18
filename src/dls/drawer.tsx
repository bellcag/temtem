import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/dls/button";
import { Text } from "@/dls/text";

const WIDTH = {
  sm: "max-w-[320px]",
  md: "max-w-[480px]",
  lg: "max-w-[640px]",
} as const;

/** Actions & Interactions/Drawer — From Right + overlay. */
export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  size = "md",
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  size?: keyof typeof WIDTH;
  children: ReactNode;
  footer?: ReactNode;
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
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="dls-drawer-title"
        className={cn(
          "relative flex h-full w-full flex-col border-l border-grey-100 bg-white shadow-light",
          WIDTH[size],
        )}
      >
        <header className="flex items-start justify-between gap-3 border-b border-grey-75 px-5 py-4">
          <div className="min-w-0">
            <Text as="h2" size="h6" id="dls-drawer-title">
              {title}
            </Text>
            {subtitle && (
              <Text as="p" size="small" className="mt-1 text-grey-500">
                {subtitle}
              </Text>
            )}
          </div>
          <Button
            variant="tertiary"
            size="sm"
            iconOnly
            aria-label="Close"
            onClick={onClose}
            leadingIcon={<X className="h-4 w-4" />}
          />
        </header>
        <div className="min-h-0 flex-1 overflow-auto">{children}</div>
        {footer && (
          <footer className="border-t border-grey-75 bg-white p-4">{footer}</footer>
        )}
      </aside>
    </div>
  );
}
