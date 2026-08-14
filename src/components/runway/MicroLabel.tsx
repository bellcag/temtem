import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Uppercase field / section label — typography helper (no Runway component doc). */
export function MicroLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-grey-500",
        className,
      )}
    >
      {children}
    </div>
  );
}
