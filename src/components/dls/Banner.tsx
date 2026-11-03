import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import infoIcon from "@/assets/figma/info.svg";

/** `_Atoms/Banner` · Type=Default | Warning | Success. `info` is the Information fill. */
export type BannerTone = "default" | "info" | "warning" | "success";

const TONE: Record<BannerTone, { wrap: string; icon: string }> = {
  default: { wrap: "border-purple-200 bg-purple-100", icon: "bg-purple-600" },
  info: { wrap: "border-blue-200 bg-info-bg", icon: "bg-blue-600" },
  warning: { wrap: "border-warning-200 bg-warning-100", icon: "bg-warning-600" },
  success: { wrap: "border-success-200 bg-success-100", icon: "bg-success-600" },
};

export function Banner({
  children,
  title,
  tone = "default",
  icon = true,
  action,
  className,
}: {
  children: ReactNode;
  title?: string;
  tone?: BannerTone;
  icon?: boolean;
  action?: ReactNode;
  className?: string;
}) {
  const paint = TONE[tone];
  return (
    <div
      role="note"
      className={cn(
        "flex w-full items-start gap-2 rounded-[var(--radius-md)] border px-3 py-3",
        paint.wrap,
        className,
      )}
    >
      {icon ? (
        <span
          aria-hidden
          className={cn("mt-0.5 block size-4 shrink-0", paint.icon)}
          style={{
            WebkitMaskImage: `url("${infoIcon}")`,
            maskImage: `url("${infoIcon}")`,
            WebkitMaskSize: "contain",
            maskSize: "contain",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
          }}
        />
      ) : null}
      <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          {title ? (
            <p className="text-base leading-5 font-bold text-grey-700">{title}</p>
          ) : null}
          <p className="min-w-0 text-sm leading-[18px] text-grey-700">{children}</p>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  );
}
