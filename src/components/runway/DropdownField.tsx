import type { ReactNode, SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { MicroLabel } from "./MicroLabel";

/**
 * Runway: Dropdown Input — Enterprise (near)
 * Prototype uses a native <select> with Runway field styling.
 * Full Dropdown Option panel can replace this later.
 */
export function DropdownField({
  label,
  className,
  selectClassName,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label?: ReactNode;
  selectClassName?: string;
}) {
  return (
    <label className={cn("flex w-full flex-col gap-1", className)}>
      {label != null && <MicroLabel>{label}</MicroLabel>}
      <select
        className={cn(
          "w-full rounded-[var(--radius-sm)] border border-grey-200 bg-white px-3 py-2 text-sm font-bold text-black",
          "disabled:cursor-not-allowed disabled:opacity-50",
          selectClassName,
        )}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}
