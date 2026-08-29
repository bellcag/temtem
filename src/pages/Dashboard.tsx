import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  ArrowRight,
  Clock,
  BadgeCheck,
  Workflow,
  FileText,
} from "lucide-react";
import { useApp } from "@/lib/app-state";
import {
  DOCUMENTS,
  TENANT,
  OFFICER,
  CONTRACTOR,
  PHASES,
} from "@/lib/tenancy-data";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function DashboardPage() {
  const { role, unit, openAssistant, recentDocs, effectiveUnit, isUnscoped } =
    useApp();
  const isOfficer = role === "officer";
  const isContractor = role === "contractor";
  const [greet, setGreet] = useState("Hello");
  useEffect(() => setGreet(greeting()), []);

  const ctxUnit = effectiveUnit ?? unit;
  const firstName = isOfficer
    ? OFFICER.firstName
    : isContractor
      ? CONTRACTOR.firstName
      : TENANT.firstName;
  const subtitle = isOfficer
    ? OFFICER.role
    : isContractor
      ? CONTRACTOR.company
      : TENANT.company;

  const suggested = isOfficer
    ? `What changed in the latest IFM renovation requirements for ${ctxUnit.terminal}?`
    : isContractor
      ? `What do I need for Joint Site Inspection at ${ctxUnit.unitNo}?`
      : `What permits do I need to start renovation works at ${ctxUnit.unitNo}?`;

  const updated = useMemo(() => {
    let list = DOCUMENTS.filter(
      (d) =>
        (d.status === "Updated" || d.status === "New") &&
        d.tenancyType.some((t) => t === "F&B" || t === "Retail") &&
        d.zone.includes("Airside"),
    );
    if (!isOfficer) {
      list = list.filter(
        (d) =>
          d.terminal.includes(ctxUnit.terminal) &&
          d.tenancyType.includes(ctxUnit.tenancyType),
      );
    }
    return list
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 5);
  }, [ctxUnit, isOfficer]);

  const lastViewed = useMemo(
    () =>
      recentDocs
        .map((id) => DOCUMENTS.find((d) => d.id === id))
        .filter(Boolean)
        .slice(0, 5) as typeof DOCUMENTS,
    [recentDocs],
  );

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header>
        <h1>
          {greet}, {firstName}
        </h1>
        <p className="mt-1 text-grey-500">{subtitle}</p>
      </header>

      {!isOfficer && (
        <div className="mt-6 rounded-[var(--radius-2xl)] border border-grey-100 bg-white px-5 py-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-grey-500">
            Unit profile
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
            <Meta label="Unit" value={ctxUnit.unitNo} />
            <Sep />
            <Meta label="Terminal" value={ctxUnit.terminal} />
            <Sep />
            <Meta label="Tenancy" value={ctxUnit.tenancyType} />
            <Sep />
            <Meta label="Zone" value="Airside" />
          </div>
        </div>
      )}

      {isOfficer && (
        <div className="mt-6 rounded-[var(--radius-2xl)] border border-grey-100 bg-white px-5 py-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-grey-500">
            Portfolio context
          </div>
          <p className="mt-1.5 text-sm text-grey-700">
            {isUnscoped
              ? "No unit scoped — Process defaults to Full process. Select terminal and tenancy in the sidebar."
              : `Scoped to ${ctxUnit.unitNo} · ${ctxUnit.terminal} · ${ctxUnit.tenancyType} · Airside`}
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={() => openAssistant(suggested)}
        className="group mt-8 flex w-full items-center gap-4 rounded-[var(--radius-2xl)] border border-grey-100 bg-white p-5 text-left transition hover:border-purple-300"
      >
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-purple-600 text-white">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-purple-600">
            Ask the assistant
          </div>
          <div className="mt-0.5 text-base font-bold text-black">{suggested}</div>
        </div>
        <ArrowRight className="h-5 w-5 text-grey-400 transition group-hover:translate-x-0.5 group-hover:text-purple-600" />
      </button>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <DocBlock
          title="Recently updated"
          subtitle={
            isOfficer
              ? "Across Airside F&B and Retail"
              : "New and revised for your unit"
          }
          icon={<BadgeCheck className="h-4 w-4" />}
          items={updated}
          empty="No documents have been updated recently."
        />
        <DocBlock
          title="Last viewed"
          subtitle="Pick up where you left off"
          icon={<Clock className="h-4 w-4" />}
          items={lastViewed}
          empty="Documents you open will appear here."
        />
      </div>

      <section className="mt-8">
        <div className="mb-3 flex items-center gap-2">
          <Workflow className="h-4 w-4 text-purple-600" />
          <h2>Process overview</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {PHASES.map((p, i) => (
            <Link
              key={p.id}
              to={`/process-v16?phase=${p.id}`}
              className="group rounded-[var(--radius-2xl)] border border-grey-100 bg-white p-5 transition hover:border-purple-300"
            >
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-grey-500">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-purple-100 text-[10px] text-purple-700">
                  {i + 1}
                </span>
                Phase {i + 1}
              </div>
              <div className="mt-2 text-lg font-black text-black group-hover:text-purple-700">
                {p.name}
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-grey-500">
                {p.description}
              </p>
            </Link>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <Link
            to="/process-v16"
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] bg-purple-600 px-4 py-2 text-sm font-bold text-white hover:bg-purple-700"
          >
            View Full Process <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="mr-1.5 text-[11px] uppercase tracking-wider text-grey-400">
        {label}
      </span>
      <span className="font-bold text-black">{value}</span>
    </div>
  );
}

function Sep() {
  return <span className="h-3 w-px bg-grey-100" />;
}

function DocBlock({
  title,
  subtitle,
  icon,
  items,
  empty,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  items: typeof DOCUMENTS;
  empty: string;
}) {
  return (
    <section className="rounded-[var(--radius-2xl)] border border-grey-100 bg-white">
      <header className="border-b border-grey-75 px-5 py-4">
        <div className="flex items-center gap-2 text-black">
          <span className="text-purple-600">{icon}</span>
          <h3>{title}</h3>
        </div>
        <p className="mt-0.5 text-xs text-grey-500">{subtitle}</p>
      </header>
      {items.length === 0 ? (
        <p className="px-5 py-6 text-sm text-grey-400">{empty}</p>
      ) : (
        <ul className="divide-y divide-grey-75">
          {items.map((d) => (
            <li key={d.id}>
              <Link
                to={`/documents/${d.id}`}
                className="flex items-start gap-3 px-5 py-3.5 hover:bg-grey-50"
              >
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-purple-600" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold text-black">
                    {d.name}
                  </div>
                  <div className="mt-0.5 text-xs text-grey-500">
                    {d.type} · {d.updatedAt}
                    {d.status ? ` · ${d.status}` : ""}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
