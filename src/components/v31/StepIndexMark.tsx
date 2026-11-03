import { cn } from "@/lib/utils";

export type StepIndexTone = "current" | "waiting" | "done";

/** Same 24px index circle as the project stepper. */
export function StepIndexMark({
  n,
  tone,
}: {
  n: number;
  tone: StepIndexTone;
}) {
  return (
    <span
      className={cn(
        "grid size-6 shrink-0 place-items-center rounded-full text-xs leading-4 font-bold",
        tone === "current" && "bg-purple-600 text-white",
        tone === "done" && "bg-grey-200 text-grey-700",
        tone === "waiting" && "border border-grey-300 bg-white text-grey-600",
      )}
      aria-hidden
    >
      {n}
    </span>
  );
}
