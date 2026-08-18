import { cn } from "@/lib/utils";

/** Status & Feedback/Badge — numeric count, 99+ cap. */
export function Badge({
  label,
  className,
}: {
  label: number;
  className?: string;
}) {
  const text = label > 99 ? "99+" : String(label);
  return (
    <span
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-error-600 px-1.5 text-xxsmall font-bold text-white",
        className,
      )}
    >
      {text}
    </span>
  );
}
