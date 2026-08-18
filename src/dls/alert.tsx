import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Text } from "@/dls/text";

const TONE = {
  info: "border-primary-200 bg-primary-100 text-primary-700",
  success: "border-success-300 bg-success-100 text-success-600",
  warning: "border-warning-300 bg-warning-100 text-warning-700",
  error: "border-error-300 bg-error-100 text-error-600",
  neutral: "border-grey-100 bg-grey-50 text-grey-700",
} as const;

/** Status & Feedback/Alerts */
export function Alert({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: keyof typeof TONE;
  title?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="status"
      className={cn(
        "rounded-[8px] border px-4 py-3",
        TONE[tone],
        className,
      )}
    >
      {title && (
        <Text as="p" size="small" className="font-bold text-current">
          {title}
        </Text>
      )}
      {children && (
        <Text
          as="p"
          size="small"
          className={cn("text-current", title && "mt-1")}
        >
          {children}
        </Text>
      )}
    </div>
  );
}
