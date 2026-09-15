import { Link } from "react-router-dom";

export function PhaseCard({
  to,
  title,
  lead,
  index,
}: {
  to: string;
  title: string;
  lead: string;
  index?: number;
}) {
  return (
    <Link
      to={to}
      className="group flex flex-col gap-2 rounded-[var(--radius-2xl)] border border-grey-100 bg-white p-5 transition hover:border-purple-300 hover:bg-purple-100"
    >
      {index != null ? (
        <span className="text-xs leading-4 font-bold text-purple-600">
          {String(index + 1).padStart(2, "0")}
        </span>
      ) : null}
      <div className="text-lg font-black text-black group-hover:text-purple-700">
        {title}
      </div>
      <p className="text-sm leading-[18px] text-grey-500">{lead}</p>
    </Link>
  );
}
