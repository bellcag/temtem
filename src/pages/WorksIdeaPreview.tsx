import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useApp } from "@/lib/app-state";
import { cn } from "@/lib/utils";

const LABEL_CAPS =
  "text-xs leading-4 font-bold uppercase tracking-[0.08em] text-grey-400";

function IdeaCard({
  stage,
  title,
  lead,
  bullets,
  children,
}: {
  stage: string;
  title: string;
  lead?: string;
  bullets?: string[];
  children?: ReactNode;
}) {
  return (
    <article className="flex flex-col gap-4 rounded-[var(--radius-2xl)] bg-white p-4 shadow-[var(--shadow-light-bg)] tablet:gap-6 tablet:p-6">
      <div className="flex flex-col gap-4">
        <p className={LABEL_CAPS}>{stage}</p>
        <div className="flex flex-col gap-1">
          <h3 className="text-lg leading-[22px] font-bold text-black">{title}</h3>
          {lead && <p className="text-base leading-5 text-grey-700">{lead}</p>}
        </div>
        {bullets && bullets.length > 0 && (
          <ul className="flex flex-col gap-2">
            {bullets.map((line) => (
              <li
                key={line}
                className="flex gap-2 text-base leading-5 text-grey-700"
              >
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-grey-400" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        )}
        {children}
      </div>
    </article>
  );
}

function ListCard({
  title,
  rows,
  footer,
}: {
  title: string;
  rows: { name: string; badge?: string }[];
  footer: string;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg leading-[22px] font-bold text-black">{title}</h2>
      <ul className="overflow-hidden rounded-[var(--radius-md)] border border-grey-100 bg-white">
        {rows.map((row) => (
          <li
            key={row.name}
            className="flex items-center gap-2 border-t border-grey-100 px-3 py-2.5 first:border-t-0"
          >
            <span className="min-w-0 flex-1 text-sm leading-[18px] font-bold text-black">
              {row.name}
            </span>
            {row.badge && (
              <span className="inline-flex h-6 shrink-0 items-center rounded-[var(--radius-sm)] border border-grey-200 px-1.5 text-xs leading-4 font-bold text-grey-700">
                {row.badge}
              </span>
            )}
          </li>
        ))}
      </ul>
      <p className="text-sm leading-[18px] text-grey-600">{footer}</p>
    </section>
  );
}

export function WorksIdeaPreviewPage() {
  const { role } = useApp();
  const [view, setView] = useState<"process" | "works">("process");

  const permitFooter =
    role === "tenant"
      ? "Get these in OneCalendar."
      : role === "officer"
        ? "Check these in OneCalendar."
        : "Apply these in OneCalendar.";

  return (
    <div className="dls-page flex flex-col gap-4 tablet:gap-6 !pt-5 tablet:!pt-8">
      <header className="flex flex-col gap-3">
        <p className={LABEL_CAPS}>Concept preview</p>
        <h1 className="text-[28px] leading-9 font-bold text-black">
          {view === "process" ? "Process" : "Works"}
        </h1>
        <p className="text-sm leading-[18px] text-grey-500">
          {view === "process"
            ? "Operate keeps a door card. Ceiling, Hot Work, MEP and the rest are not on this rail."
            : "The door opens this job’s confirmed list — permits and extra steps."}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setView("process")}
            className={cn(
              "inline-flex h-8 items-center rounded-full px-3 text-sm leading-[18px] font-bold",
              view === "process"
                ? "bg-purple-600 text-white"
                : "border border-grey-200 bg-white text-grey-700",
            )}
          >
            1. Process door
          </button>
          <button
            type="button"
            onClick={() => setView("works")}
            className={cn(
              "inline-flex h-8 items-center rounded-full px-3 text-sm leading-[18px] font-bold",
              view === "works"
                ? "bg-purple-600 text-white"
                : "border border-grey-200 bg-white text-grey-700",
            )}
          >
            2. Works list
          </button>
        </div>
      </header>

      {view === "process" ? (
        <div className="flex max-w-xl flex-col gap-6">
          <IdeaCard
            stage="Operations"
            title="Regular service reports"
            lead="Lodge service reports"
            bullets={["Lodge service reports in TOPAZ on schedule."]}
          />
          <IdeaCard
            stage="Operations"
            title="Upcoming works"
            lead="Open this job"
            bullets={[
              "Confirm which works apply, then see the permit list.",
            ]}
          >
            <button
              type="button"
              onClick={() => setView("works")}
              className="inline-flex h-8 w-fit items-center justify-center rounded-[var(--radius-sm)] bg-purple-600 px-3 text-sm leading-[18px] font-bold text-white hover:bg-purple-700"
            >
              Open Works
            </button>
          </IdeaCard>
          <IdeaCard
            stage="Operations"
            title="Pest control reports"
            lead="Submit pest report"
            bullets={["Submit your pest control report in TOPAZ."]}
          />
        </div>
      ) : (
        <div className="flex max-w-xl flex-col gap-6">
          <div className="flex flex-col gap-2">
            <p className="text-sm leading-[18px] text-grey-700">
              Counter refresh · Kopitiam T3-AS-114
            </p>
            <span className="inline-flex h-6 w-fit items-center rounded-[var(--radius-sm)] border border-grey-200 px-1.5 text-xs leading-4 font-bold text-grey-700">
              Agreed
            </span>
          </div>
          <ListCard
            title="Permits to apply"
            rows={[
              { name: "Tenancy Project work", badge: "Always needed" },
              { name: "Extra renovation permit" },
              { name: "MEP changes permit" },
            ]}
            footer={permitFooter}
          />
          <ListCard
            title="Steps this job needs"
            rows={[{ name: "BIM model" }]}
            footer="These are not extra OneCalendar permit types."
          />
          <div className="flex flex-col gap-2 tablet:flex-row">
            <Link
              to="/screener/drafts"
              className="inline-flex h-8 w-fit items-center justify-center rounded-[var(--radius-sm)] border border-purple-600 bg-white px-3 text-sm leading-[18px] font-bold text-purple-600 hover:bg-purple-100"
            >
              Open Application Screener
            </Link>
            <button
              type="button"
              onClick={() => setView("process")}
              className="inline-flex h-8 w-fit items-center justify-center px-1 text-sm leading-[18px] font-bold text-purple-600 hover:text-purple-700"
            >
              Back to Process door
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
