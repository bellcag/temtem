import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Runway: Overlay (near — from _excluded/overlay usage notes)
 * Blocks interaction with background while a drawer/modal is open.
 */
export function Overlay({
  onClick,
  className,
  label = "Close",
}: {
  onClick?: () => void;
  className?: string;
  label?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        "absolute inset-0 bg-[rgba(18,18,18,0.4)]",
        className,
      )}
      onClick={onClick}
    />
  );
}

/** Full-viewport host for overlay + foreground panel. */
export function OverlayHost({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("fixed inset-0 z-50", className)}>{children}</div>
  );
}
