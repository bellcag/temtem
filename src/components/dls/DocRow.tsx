import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export function DocRow({
  to,
  title,
  meta,
  icon,
}: {
  to: string;
  title: string;
  meta: string;
  icon: ReactNode;
}) {
  return (
    <Link
      to={to}
      className="flex items-start gap-3 px-5 py-3.5 hover:bg-grey-50"
    >
      <span className="mt-0.5 shrink-0 text-purple-600">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-black">
          {title}
        </span>
        <span className="mt-0.5 block text-xs text-grey-500">{meta}</span>
      </span>
    </Link>
  );
}
