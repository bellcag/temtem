import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Sparkles,
  ArrowRight,
  Clock,
  BadgeCheck,
  Workflow,
  FileText,
  Search,
} from "lucide-react";
import { useApp } from "@/lib/app-state";
import {
  DOCUMENTS,
  TENANT,
  OFFICER,
  CONTRACTOR,
  PHASES,
} from "@/lib/tenancy-data";
import { dashboardSearchHits } from "@/lib/dashboard-search";
import { PHASE_INTRO } from "@/lib/process-v24-doors";
import { WORKS_HREF } from "@/lib/process-works-jobs";
import {
  ContextStrip,
  MetaPair,
  MetaSep,
} from "@/components/dls/ContextStrip";
import { DocRow } from "@/components/dls/DocRow";
import { PhaseCard } from "@/components/dls/PhaseCard";
import { SearchField } from "@/components/dls/SearchField";
import { SearchHitRow } from "@/components/dls/SearchHitRow";
import reviewsIcon from "@/assets/figma/reviews.svg";

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
      ? CONTRACTOR.role
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
        <div className="mt-6">
          <ContextStrip kicker="Unit profile">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
              <MetaPair label="Unit" value={ctxUnit.unitNo} />
              <MetaSep />
              <MetaPair label="Terminal" value={ctxUnit.terminal} />
              <MetaSep />
              <MetaPair label="Tenancy" value={ctxUnit.tenancyType} />
              <MetaSep />
              <MetaPair label="Zone" value="Airside" />
            </div>
          </ContextStrip>
        </div>
      )}

      {isOfficer && (
        <div className="mt-6">
          <ContextStrip kicker="Portfolio context">
            {isUnscoped
              ? "No unit scoped. Process shows the full map until you pick a unit on Process."
              : `Scoped to ${ctxUnit.unitNo} · ${ctxUnit.terminal} · ${ctxUnit.tenancyType} · Airside`}
          </ContextStrip>
        </div>
      )}

      <section className="mt-8">
        <div className="mb-3 flex items-center gap-2">
          <Workflow className="h-4 w-4 text-purple-600" />
          <h2>Process overview</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {PHASES.map((p, i) => (
            <PhaseCard
              key={p.id}
              to={`/process?phase=${p.id}`}
              title={p.name}
              lead={PHASE_INTRO[p.id]}
              index={i}
            />
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <Link
            to="/process"
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[var(--radius-sm)] bg-purple-600 px-4 text-sm leading-[18px] font-bold text-white hover:bg-purple-700"
          >
            Open Process <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <DashboardSearch
        suggested={suggested}
        onAsk={(seed) => openAssistant(seed)}
      />

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

      <section className="mt-8 rounded-[var(--radius-2xl)] border border-grey-100 bg-grey-25 p-5">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-purple-100">
            <img src={reviewsIcon} alt="" className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-black text-black">Works</h2>
            <p className="mt-1 text-sm leading-[18px] text-grey-700">
              {isOfficer
                ? "Start or open jobs for this unit. Separate from the Process guide."
                : isContractor
                  ? "Tick the agreed list for this unit. Separate from the Process guide."
                  : "Read the agreed list for this unit. Separate from the Process guide."}
            </p>
            <Link
              to={WORKS_HREF}
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-purple-600 hover:text-purple-700"
            >
              See works <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function DashboardSearch({
  suggested,
  onAsk,
}: {
  suggested: string;
  onAsk: (seed: string) => void;
}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const hits = useMemo(() => dashboardSearchHits(query), [query]);
  const typed = query.trim();
  const askSeed = typed || suggested;

  const ask = () => {
    onAsk(askSeed);
    setOpen(false);
  };

  return (
    <div className="relative mt-6">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          ask();
        }}
      >
        <SearchField
          id="dashboard-search"
          label="Ask the assistant or find a step"
          placeholder={suggested}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onClear={() => {
            setQuery("");
            setOpen(true);
          }}
          leading={<Sparkles className="h-5 w-5" aria-hidden />}
        />
      </form>
      {open && (
        <div className="absolute inset-x-0 top-full z-40 mt-2 overflow-hidden rounded-[var(--radius-xl)] border border-grey-100 bg-white shadow-[var(--shadow-light-bg)]">
          <ul>
            <li>
              <SearchHitRow
                title={askSeed}
                hint="Ask the assistant"
                icon={<Sparkles className="h-4 w-4 text-purple-600" />}
                onClick={ask}
              />
            </li>
            {typed
              ? hits.map((hit) => (
                  <li key={hit.id} className="border-t border-grey-100">
                    <SearchHitRow
                      title={hit.title}
                      hint={hit.hint}
                      icon={<Search className="h-4 w-4 text-grey-400" />}
                      onClick={() => navigate(hit.to)}
                    />
                  </li>
                ))
              : null}
          </ul>
        </div>
      )}
    </div>
  );
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
              <DocRow
                to={`/documents/${d.id}`}
                title={d.name}
                meta={`${d.type} · ${d.updatedAt}${d.status ? ` · ${d.status}` : ""}`}
                icon={<FileText className="h-4 w-4" />}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
