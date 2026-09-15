import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function StepCardShell({
  id,
  embedded,
  children,
}: {
  id?: string;
  embedded?: boolean;
  children: ReactNode;
}) {
  return (
    <article
      id={id}
      className={cn(
        embedded
          ? "flex flex-col gap-3 bg-transparent"
          : "flex flex-col gap-4 tablet:gap-6 rounded-[var(--radius-2xl)] bg-white p-4 shadow-[var(--shadow-light-bg)] tablet:p-6",
        "scroll-mt-[8rem] tablet:scroll-mt-[6rem] desktop:scroll-mt-8",
      )}
    >
      {children}
    </article>
  );
}

export function StepCardTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-lg leading-[22px] font-bold text-black">{children}</h3>
  );
}

export function YourStepsList({ children }: { children: ReactNode }) {
  return <ol className="flex flex-col gap-2">{children}</ol>;
}

export function YourStepsItem({ children }: { children: ReactNode }) {
  return (
    <li className="text-sm leading-[18px] text-grey-700 desktop:text-base desktop:leading-5">
      {children}
    </li>
  );
}
