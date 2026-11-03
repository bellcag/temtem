import type { ReactNode, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** ➗ Components Table — header Grey/800, 36px; body cells 16px inset. */
export function DlsTable({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="min-w-full border-separate border-spacing-0 text-left">
        {children}
      </table>
    </div>
  );
}

export function DlsTableHead({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <thead>
      <tr className={cn("bg-grey-800", className)}>{children}</tr>
    </thead>
  );
}

export function DlsTh({
  children,
  className,
  ...rest
}: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "h-9 bg-grey-800 px-4 text-xs leading-4 font-bold tracking-[0.04em] text-white uppercase",
        className,
      )}
      {...rest}
    >
      {children}
    </th>
  );
}

export function DlsTableBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function DlsTr({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <tr className={cn("bg-white hover:bg-grey-25", className)}>{children}</tr>
  );
}

export function DlsTd({
  children,
  className,
  ...rest
}: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn(
        "border-b border-grey-100 px-4 py-4 align-middle text-base leading-5 text-black",
        className,
      )}
      {...rest}
    >
      {children}
    </td>
  );
}

export function DlsTableIconButton({
  label,
  title,
  src,
  onClick,
  danger = false,
}: {
  label: string;
  title?: string;
  src: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={title ?? label}
      onClick={onClick}
      className={cn(
        "grid size-6 shrink-0 place-items-center rounded-[var(--radius-sm)] focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]",
        danger
          ? "text-purple-600 hover:bg-error-100 hover:text-error-600"
          : "text-purple-600 hover:bg-purple-100",
      )}
    >
      <span
        aria-hidden
        className="block size-6 bg-current"
        style={{
          WebkitMaskImage: `url("${src}")`,
          maskImage: `url("${src}")`,
          WebkitMaskSize: "16px 16px",
          maskSize: "16px 16px",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
        }}
      />
    </button>
  );
}
