import type { ReactNode } from "react";

export function ContextStrip({
  kicker,
  children,
}: {
  kicker: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius-2xl)] border border-grey-100 bg-white px-5 py-4">
      <div className="text-[10px] font-bold uppercase tracking-wider text-grey-500">
        {kicker}
      </div>
      <div className="mt-1.5 text-sm text-grey-700">{children}</div>
    </div>
  );
}

export function MetaPair({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="mr-1.5 text-[11px] uppercase tracking-wider text-grey-400">
        {label}
      </span>
      <span className="font-bold text-black">{value}</span>
    </div>
  );
}

export function MetaSep() {
  return <span className="h-3 w-px bg-grey-100" />;
}
