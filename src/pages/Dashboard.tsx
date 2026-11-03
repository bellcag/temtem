import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Clock, BadgeCheck, FileText, Search } from "lucide-react";
import { useApp } from "@/lib/app-state";
import {
  DOCUMENTS,
  TENANT,
  OFFICER,
  CONTRACTOR,
  PHASES,
} from "@/lib/tenancy-data";
import {
  dashboardSearchHits,
  dashboardShortcuts,
} from "@/lib/dashboard-search";
import { PHASE_INTRO } from "@/lib/process-v24-doors";
import {
  jobStatusLabel,
  readWorksJobs,
  WORKS_CHANGED_EVENT,
  WORKS_HREF,
  type WorksJob,
} from "@/lib/process-works-jobs";
import {
  processV26Href,
  readV26Preview,
  V26_WORKS_HREF,
} from "@/lib/process-v26-preview";
import {
  processV27Href,
  readV27Preview,
  V27_WORKS_HREF,
} from "@/lib/process-v27-preview";
import {
  processV28Href,
  readV28Preview,
  V28_WORKS_HREF,
} from "@/lib/process-v28-preview";
import {
  readV26Works,
  seedV26Works,
  v26WorkListTitle,
  v26WorkNextAction,
  v26WorkStatusLabel,
  v26WorkToActOn,
  V26_WORKS_CHANGED,
  type V26Work,
} from "@/lib/process-v26-works";
import {
  readV26OutletStory,
  v26UnitsForStory,
  V26_OUTLET_CHANGED,
} from "@/lib/process-v26-outlets";
import { LS_OUTLET } from "@/lib/process-job-context";
import { ContextStrip } from "@/components/dls/ContextStrip";
import { UnitSelection } from "@/components/dls/UnitSelection";
import { DocRow } from "@/components/dls/DocRow";
import { FilterChip } from "@/components/dls/Chip";
import { SearchField } from "@/components/dls/SearchField";
import { SearchHitRow } from "@/components/dls/SearchHitRow";
import permitIcon from "@/assets/figma-setup/permit.svg";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function DashboardPage() {
  const { role, unit, setUnit, units, recentDocs, effectiveUnit, isUnscoped } =
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

  const openJob = useOpenWorksJob(ctxUnit.id);
  const [v26Preview, setV26Preview] = useState(() =>
    typeof window === "undefined" ? false : readV26Preview(),
  );
  const [v27Preview, setV27Preview] = useState(() =>
    typeof window === "undefined" ? false : readV27Preview(),
  );
  const [v28Preview, setV28Preview] = useState(() =>
    typeof window === "undefined" ? false : readV28Preview(),
  );
  const [outletStory, setOutletStory] = useState(() =>
    typeof window === "undefined" ? "airport" : readV26OutletStory(),
  );
  useEffect(() => {
    const refresh = () => {
      setV26Preview(readV26Preview());
      setV27Preview(readV27Preview());
      setV28Preview(readV28Preview());
      setOutletStory(readV26OutletStory());
    };
    refresh();
    window.addEventListener("tempo:v26-preview", refresh);
    window.addEventListener("tempo:v27-preview", refresh);
    window.addEventListener("tempo:v28-preview", refresh);
    window.addEventListener(V26_OUTLET_CHANGED, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("tempo:v26-preview", refresh);
      window.removeEventListener("tempo:v27-preview", refresh);
      window.removeEventListener("tempo:v28-preview", refresh);
      window.removeEventListener(V26_OUTLET_CHANGED, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  const guidePreview = v28Preview || v27Preview || v26Preview;
  const tenantUnits = useMemo(
    () => (guidePreview ? v26UnitsForStory(outletStory) : units),
    [guidePreview, outletStory, units],
  );
  const showTenantOutletPicker =
    role === "tenant" && tenantUnits.length > 1;

  useEffect(() => {
    if (role !== "tenant") return;
    if (tenantUnits.some((row) => row.id === unit.id)) return;
    const next = tenantUnits[0];
    if (!next) return;
    setUnit(next);
    window.localStorage.setItem(LS_OUTLET, next.id);
  }, [role, unit.id, tenantUnits, setUnit]);
  const processHref = (phase?: string) =>
    v28Preview
      ? processV28Href(phase ? { phase } : undefined)
      : v27Preview
        ? processV27Href(phase ? { phase } : undefined)
        : v26Preview
          ? processV26Href(phase ? { phase } : undefined)
          : phase
            ? `/process?phase=${phase}`
            : "/process";
  const v26Work = useLatestV26Work(ctxUnit.id, guidePreview);
  const worksHref = v28Preview
    ? V28_WORKS_HREF
    : v27Preview
      ? V27_WORKS_HREF
      : V26_WORKS_HREF;
  const worksCard = guidePreview
    ? {
        title: v26Work ? v26WorkListTitle(v26Work) : "Works",
        status: v26Work ? v26WorkStatusLabel(v26Work) : "None open",
        href: v26Work
          ? `${worksHref}?work=${encodeURIComponent(v26Work.id)}`
          : worksHref,
        lead: v26Work
          ? v26WorkNextAction(v26Work, role)
          : "Start a work when the next renovation begins.",
        cta: v26Work
          ? isContractor
            ? "Continue this pack"
            : isOfficer
              ? "Open this pack"
              : "Read this pack"
          : isContractor
            ? "Start a work"
            : "See works",
      }
    : openJob
      ? {
          title: openJob.title,
          status: jobStatusLabel(openJob),
          href: `${WORKS_HREF}?job=${openJob.id}`,
          lead: isContractor
            ? "Declare this renovation, then follow the draft steps."
            : isOfficer
              ? "Check the declared works for this unit."
              : "Read the works your contractor declared.",
          cta: isContractor
            ? "Continue works"
            : isOfficer
              ? "Open works"
              : "Read this work",
        }
      : null;

  return (
    <div className="dls-page flex flex-col !pt-5 tablet:!pt-8">
      <header>
        <h1>
          {greet}, {firstName}
        </h1>
        <p className="mt-1 text-grey-500">{subtitle}</p>
      </header>

      {!isOfficer && (
        <div className="mt-4 tablet:flex tablet:justify-end">
          <UnitSelection
            value={isContractor ? ctxUnit.unitNo : unit.id}
            options={
              showTenantOutletPicker
                ? tenantUnits.map((row) => ({
                    value: row.id,
                    label: row.unitNo,
                  }))
                : [{ value: ctxUnit.id, label: ctxUnit.unitNo }]
            }
            chips={[ctxUnit.terminal, ctxUnit.zone, ctxUnit.tenancyType]}
            showSelect={showTenantOutletPicker}
            onChange={(next) => {
              const hit = tenantUnits.find((row) => row.id === next);
              if (!hit) return;
              setUnit(hit);
              window.localStorage.setItem(LS_OUTLET, hit.id);
            }}
          />
        </div>
      )}

      {isOfficer && (
        <div className="mt-4">
          <ContextStrip kicker="Portfolio context">
            {isUnscoped
              ? "No unit scoped. Process shows the full map until you pick a unit on Process."
              : `Scoped to ${ctxUnit.unitNo} · ${ctxUnit.terminal} · ${ctxUnit.tenancyType} · Airside`}
          </ContextStrip>
        </div>
      )}

      {isContractor && worksCard ? (
        <FeaturedWorksCard {...worksCard} />
      ) : null}

      <DashboardSearch
        suggested={suggested}
        showWorksChip={Boolean(openJob || v26Work)}
      />

      {!isContractor && worksCard ? (
        <FeaturedWorksCard {...worksCard} />
      ) : null}

      <section className="mt-6">
        <div className="mb-2 flex items-end justify-between gap-3">
          <div>
            <h2>Walk the phase you are in</h2>
            <p className="mt-1 text-sm leading-[18px] text-grey-500">
              Open it and follow the steps from there.
            </p>
          </div>
          <Link
            to={processHref()}
            className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-purple-600 hover:text-purple-700"
          >
            Open Process <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {PHASES.map((p) => (
            <Link
              key={p.id}
              to={processHref(p.id)}
              className="flex min-w-0 items-baseline justify-between gap-2 rounded-[var(--radius-xl)] border border-grey-100 bg-white px-3 py-2.5 hover:border-purple-300 hover:bg-purple-100"
            >
              <span className="text-sm font-bold text-black">{p.name}</span>
              <span className="text-xs leading-4 text-grey-500">
                {PHASE_INTRO[p.id]}
              </span>
            </Link>
          ))}
        </div>
      </section>

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
    </div>
  );
}

function useOpenWorksJob(unitId: string): WorksJob | null {
  const [jobs, setJobs] = useState<WorksJob[]>(() =>
    typeof window === "undefined" ? [] : readWorksJobs(unitId),
  );
  useEffect(() => {
    const refresh = () => setJobs(readWorksJobs(unitId));
    refresh();
    window.addEventListener(WORKS_CHANGED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(WORKS_CHANGED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [unitId]);
  return useMemo(() => {
    if (jobs.length === 0) return null;
    return [...jobs].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  }, [jobs]);
}

function useLatestV26Work(unitId: string, enabled: boolean): V26Work | null {
  const [work, setWork] = useState<V26Work | null>(null);
  useEffect(() => {
    if (!enabled) {
      setWork(null);
      return;
    }
    const refresh = () => {
      seedV26Works(unitId);
      setWork(v26WorkToActOn(readV26Works(unitId)));
    };
    refresh();
    window.addEventListener(V26_WORKS_CHANGED, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(V26_WORKS_CHANGED, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [unitId, enabled]);
  return work;
}

function FeaturedWorksCard({
  title,
  status,
  lead,
  href,
  cta,
}: {
  title: string;
  status: string;
  lead: string;
  href: string;
  cta: string;
}) {
  return (
    <section className="mt-6">
      <p className="text-xs leading-4 font-bold uppercase tracking-[0.08em] text-grey-400">
        Your work
      </p>
      <div className="mt-2 rounded-[var(--radius-2xl)] bg-white p-5 shadow-[var(--shadow-light-bg)] tablet:p-6">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-md)] bg-purple-100">
            <img src={permitIcon} alt="" className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs leading-4 font-bold uppercase tracking-[0.08em] text-grey-400">
              Works · {status}
            </p>
            <h2 className="mt-1 text-lg leading-[22px] font-bold text-black">
              {title}
            </h2>
            <p className="mt-1 text-sm leading-[18px] text-grey-500">{lead}</p>
          </div>
        </div>
        <Link
          to={href}
          className="mt-4 inline-flex h-10 items-center justify-center gap-1 rounded-[var(--radius-sm)] bg-purple-600 px-4 text-sm leading-[18px] font-bold text-white hover:bg-purple-700 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
        >
          {cta}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}

function DashboardSearch({
  suggested,
  showWorksChip,
}: {
  suggested: string;
  showWorksChip: boolean;
}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const typed = query.trim();
  const shortcuts = useMemo(
    () =>
      dashboardShortcuts().filter(
        (hit) => showWorksChip || hit.id !== "works-teaser",
      ),
    [showWorksChip],
  );
  const hits = useMemo(() => dashboardSearchHits(query), [query]);

  return (
    <section className="mt-6 rounded-[var(--radius-2xl)] bg-white p-5 shadow-[var(--shadow-light-bg)] tablet:p-6">
      <h2 className="text-lg leading-[22px] font-bold text-black">
        Ask anything
      </h2>
      <p className="mt-1 text-sm leading-[18px] text-grey-500">
        Pick a question, or type what you need. We’ll take you there.
      </p>
      <form
        className="mt-4"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          navigate(hits[0]?.to ?? "/process");
        }}
      >
        <SearchField
          id="dashboard-search"
          label="Ask anything"
          placeholder={suggested}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onClear={() => setQuery("")}
          leading={<Search className="h-5 w-5" aria-hidden />}
          className="rounded-full"
        />
      </form>
      {!typed ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {shortcuts.map((hit) => (
            <FilterChip key={hit.id} onClick={() => navigate(hit.to)}>
              {hit.chip}
            </FilterChip>
          ))}
        </div>
      ) : (
        <ul className="mt-4 overflow-hidden rounded-[var(--radius-xl)] border border-grey-100 bg-white">
          {hits.length === 0 ? (
            <li>
              <SearchHitRow
                title="Browse the guide"
                hint="No named step matched"
                icon={<Search className="h-4 w-4 text-grey-400" />}
                to="/process"
              />
            </li>
          ) : (
            hits.map((hit, i) => (
              <li
                key={hit.id}
                className={i === 0 ? undefined : "border-t border-grey-100"}
              >
                <SearchHitRow
                  title={hit.title}
                  hint={hit.hint}
                  icon={<Search className="h-4 w-4 text-grey-400" />}
                  to={hit.to}
                />
              </li>
            ))
          )}
        </ul>
      )}
    </section>
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
