import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";

/** Runway `Toast/Snackbar (B2B)` · `B2B Toast/SnackBar` Status options. */
export type ToastStatus = "success" | "error" | "warning" | "brand" | "neutral";

const TONE: Record<ToastStatus, { ring: string; Icon: typeof CircleCheck }> = {
  success: { ring: "text-success-600", Icon: CircleCheck },
  error: { ring: "text-error-600", Icon: CircleAlert },
  warning: { ring: "text-warning-600", Icon: TriangleAlert },
  brand: { ring: "text-purple-600", Icon: Info },
  neutral: { ring: "text-grey-600", Icon: Info },
};

export type ToastAction = { label: string; onClick: () => void; tone?: "brand" | "mono" };

export function Toast({
  open,
  status = "success",
  title,
  description,
  actions = [],
  onClose,
  duration = 6000,
}: {
  open: boolean;
  status?: ToastStatus;
  title: ReactNode;
  description?: ReactNode;
  actions?: ToastAction[];
  onClose: () => void;
  /** Auto-dismiss after this many ms. `0` keeps it open. */
  duration?: number;
}) {
  useEffect(() => {
    if (!open || duration <= 0) return;
    const t = window.setTimeout(onClose, duration);
    return () => window.clearTimeout(t);
  }, [open, duration, onClose]);

  if (!open || typeof document === "undefined") return null;
  const { ring, Icon } = TONE[status];

  return createPortal(
    <div className="pointer-events-none fixed inset-x-2 top-20 z-[80] flex justify-center tablet:inset-x-6 tablet:top-6 print:hidden">
      <div
        role={status === "error" ? "alert" : "status"}
        aria-live={status === "error" ? "assertive" : "polite"}
        className="pointer-events-auto flex w-full items-start gap-6 rounded-[var(--radius-md)] border border-grey-200 bg-white p-4 shadow-[0_10px_24px_rgba(18,18,18,0.24)] tablet:w-[407px]"
      >
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <span aria-hidden className={cn("relative grid size-[38px] shrink-0 place-items-center", ring)}>
            <span className="absolute inset-0 rounded-full border-2 border-current opacity-10" />
            <span className="absolute inset-[5px] rounded-full border-2 border-current opacity-30" />
            <Icon className="size-5" strokeWidth={2} />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-3 py-1.5">
            <div className="flex flex-col gap-1">
              <p className="text-base leading-5 font-bold text-black">{title}</p>
              {description ? (
                <p className="text-base leading-5 text-grey-400">{description}</p>
              ) : null}
            </div>
            {actions.length > 0 ? (
              <div className="flex items-center gap-3">
                {actions.map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    onClick={action.onClick}
                    className={cn(
                      "text-base leading-[18px] font-bold hover:underline focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]",
                      action.tone === "brand" ? "text-purple-600" : "text-grey-700",
                    )}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="grid size-6 shrink-0 place-items-center rounded-full text-grey-400 hover:text-grey-700 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
        >
          <X className="size-4" strokeWidth={2.5} aria-hidden />
        </button>
      </div>
    </div>,
    document.body,
  );
}
