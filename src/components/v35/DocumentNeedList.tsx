import { Files } from "lucide-react";
import { cn } from "@/lib/utils";
import type { V35DocNeed, V35DocSummary } from "@/lib/process-v28-screener";

type NeedKind = "all" | "each" | "one";

const LEAD: Record<Exclude<NeedKind, "one">, string> = {
  all: "Upload each of these once. Every permit that asks for it uses that same file.",
  each: "Upload a new file for each of these. Do not reuse a file from another permit.",
};

const WASH: Record<NeedKind, string> = {
  all: "bg-purple-100",
  each: "bg-warning-100",
  one: "bg-white",
};

const LEAD_COLOR: Record<NeedKind, string> = {
  all: "text-purple-700",
  each: "text-warning-800",
  one: "text-grey-600",
};

function NeedRow({ need, kind }: { need: V35DocNeed; kind: NeedKind }) {
  const shared = kind !== "one" || need.permits.length > 1;
  const lead =
    kind === "one"
      ? "Asked for by these permits."
      : LEAD[kind];
  return (
    <li className={cn("border-t border-grey-100 px-3.5 py-3 first:border-t-0", WASH[kind])}>
      <p className="text-sm leading-[18px] font-bold text-black">{need.name}</p>
      {shared ? (
        <>
          <p className={cn("mt-1 text-xs leading-4", LEAD_COLOR[kind])}>{lead}</p>
          <ul className="mt-2 flex flex-col gap-1">
            {need.permits.map((permit) => (
              <li key={permit} className="flex gap-2 text-xs leading-4 text-grey-700">
                <span aria-hidden className="text-grey-400">
                  ·
                </span>
                <span>{permit}</span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="mt-1 text-xs leading-4 text-grey-600">{need.permits[0]}</p>
      )}
    </li>
  );
}

export function DocumentNeedList({ summary }: { summary: V35DocSummary }) {
  const { fileCount, once, each, other } = summary;
  const rows: { need: V35DocNeed; kind: NeedKind }[] = [
    ...once.map((need) => ({ need, kind: "all" as const })),
    ...each.map((need) => ({ need, kind: "each" as const })),
    ...other.map((need) => ({ need, kind: "one" as const })),
  ];
  return (
    <div className="min-w-0 overflow-hidden rounded-[var(--radius-lg)] border border-grey-100 bg-white">
      <div className="flex items-center gap-3 border-b border-grey-100 bg-grey-25 px-3.5 py-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white text-grey-600 shadow-[inset_0_0_0_1px_var(--color-grey-100)]">
          <Files className="size-3.5" aria-hidden />
        </span>
        <p className="text-sm leading-[18px] font-bold text-black">
          {fileCount === 1 ? "1 file to upload" : `${fileCount} files to upload`}
        </p>
      </div>
      <ul>
        {rows.map((row) => (
          <NeedRow key={`${row.kind}-${row.need.name}`} need={row.need} kind={row.kind} />
        ))}
      </ul>
    </div>
  );
}
