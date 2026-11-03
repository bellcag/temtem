import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  FileText,
  Flame,
  FolderOpen,
  GraduationCap,
  IdCard,
  KeyRound,
  MessageCircle,
  Search,
} from "lucide-react";
import { useApp, unitFromSelection, type Role } from "@/lib/app-state";
import {
  DOCUMENTS,
  TENANT,
  OFFICER,
  CONTRACTOR,
  PHASES,
  UNITS,
  type Unit,
} from "@/lib/tenancy-data";
import {
  dashboardSearchHits,
  dashboardShortcuts,
  type DashboardSearchHit,
} from "@/lib/dashboard-search";
import {
  jobStatusLabel,
  readWorksJobs,
  WORKS_CHANGED_EVENT,
  WORKS_HREF,
  type WorksJob,
} from "@/lib/process-works-jobs";
import { faqForRole, TENANCY_FAQ, TENANCY_FAQ_HREF } from "@/lib/home-v29-faq";
import { readV26Preview } from "@/lib/process-v26-preview";
import { readV27Preview } from "@/lib/process-v27-preview";
import {
  markV28Preview,
  processV28Href,
  readV28Preview,
  V28_WORKS_HREF,
} from "@/lib/process-v28-preview";
import { markHomeCut } from "@/lib/home-cut";
import { V28_PHASE_NAME } from "@/lib/process-v28-voice";
import {
  readV26Works,
  seedV26Works,
  v26PackStatus,
  v26WorkListTitle,
  v26WorkStatusLabel,
  v26WorkToActOn,
  isV26EmptyStockSlot,
  V26_WORKS_CHANGED,
  type V26Work,
} from "@/lib/process-v26-works";
import { matchV26Library } from "@/lib/process-v26-documents";
import {
  v28WorkHref,
  v28WorkRailFromReady,
  v28WorkReadiness,
  type V28ChipTone,
  type V28WorkRail,
} from "@/lib/process-v28-readiness";
import { WorkStepRail } from "@/components/WorkStepRail";
import { readV28Submitted } from "@/lib/process-v28-screener";
import {
  readV28WorksStory,
  V28_WORKS_STORY_CHANGED,
} from "@/lib/process-v28-seed";
import {
  CONTRACTOR_JOBS,
  jobById,
  LS_OUTLET,
  readSavedJobId,
  writeSavedJobId,
} from "@/lib/process-job-context";
import { DocRow } from "@/components/dls/DocRow";
import { SearchField } from "@/components/dls/SearchField";
import { SearchHitRow } from "@/components/dls/SearchHitRow";
import permitIcon from "@/assets/figma-setup/permit.svg";

const ASK: Record<Role, { title: string; body: string }> = {
  tenant: {
    title: "Ask about this tenancy",
    body: "Look up a phase, a system, or a document for this unit.",
  },
  contractor: {
    title: "Ask about this renovation",
    body: "Look up a permit, a site step, or what to tell the tenant.",
  },
  officer: {
    title: "Ask about a permit or a phase",
    body: "Find the step before you brief the tenant or contractor.",
  },
};

const CHIP_ORDER: Record<Role, string[]> = {
  tenant: [
    "process-permits",
    "doc-ifm",
    "process-handover",
    "process-reports",
  ],
  contractor: ["process-jsi", "process-permits", "works-teaser", "doc-ifm"],
  officer: ["works-teaser", "process-permits", "doc-ifm", "process-jsi"],
};

function shortCompany(company: string) {
  return company.replace(/\s+Pte Ltd$/i, "");
}

function UnitScope({
  company,
  unitNo,
  value,
  options,
  onChange,
  className,
}: {
  company: string;
  unitNo: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  className?: string;
}) {
  const canPick = options.length > 1;
  const face = (
    <>
      <span className="min-w-0 truncate" title={company}>
        {company}
      </span>
      <span className="shrink-0">·</span>
      <span className={canPick ? "shrink-0 pr-5" : "shrink-0"}>{unitNo}</span>
    </>
  );
  return (
    <p className={`flex min-w-0 flex-nowrap items-center gap-2 ${className ?? ""}`}>
      {canPick ? (
        <label className="relative inline-flex h-8 min-w-0 cursor-pointer items-center gap-1.5 rounded-full border border-grey-200 bg-white pl-3 pr-2 text-sm leading-[18px] font-bold text-black hover:border-purple-600 hover:bg-purple-100 focus-within:border-purple-600 focus-within:shadow-[0_0_0_2px_var(--color-purple-600)]">
          <span className="sr-only">Unit</span>
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {face}
          <ChevronDown
            className="pointer-events-none absolute top-1/2 right-2 h-4 w-4 -translate-y-1/2 text-grey-700"
            aria-hidden
          />
        </label>
      ) : (
        <span className="inline-flex h-8 min-w-0 items-center gap-1.5 rounded-full border border-grey-200 bg-white px-3 text-sm leading-[18px] font-bold text-black">
          {face}
        </span>
      )}
    </p>
  );
}

function portalDoc(role: Role, changelog: string) {
  if (role === "officer") return true;
  return !changelog.startsWith("Not shared");
}

/** Officer scope is terminal + tenancy type. Skip units that would collapse onto another. */
function officerCanScope(unit: Unit) {
  if (
    unit.terminal === "Jewel" ||
    (unit.tenancyType !== "F&B" && unit.tenancyType !== "Retail")
  ) {
    return false;
  }
  return (
    unitFromSelection(
      {
        terminal: unit.terminal,
        tenancyType: unit.tenancyType,
        zone: "Airside",
      },
      unit.company,
    ).id === unit.id
  );
}

export function DashboardV29Page() {
  const {
    role,
    unit,
    setUnit,
    units,
    managedTenants,
    setOfficerScope,
  } = useApp();
  const isOfficer = role === "officer";
  const isContractor = role === "contractor";

  const [jobId, setJobId] = useState(readSavedJobId);
  const [officerFocus, setOfficerFocus] = useState("");
  const [kitId, setKitId] = useState<string | null>(null);
  const [asked, setAsked] = useState("");
  const [v26Preview, setV26Preview] = useState(() =>
    typeof window === "undefined" ? false : readV26Preview(),
  );
  const [v27Preview, setV27Preview] = useState(() =>
    typeof window === "undefined" ? false : readV27Preview(),
  );
  const [v28Preview, setV28Preview] = useState(() =>
    typeof window === "undefined" ? false : readV28Preview(),
  );
  useEffect(() => {
    const refresh = () => {
      setV26Preview(readV26Preview());
      setV27Preview(readV27Preview());
      setV28Preview(readV28Preview());
      setJobId(readSavedJobId());
    };
    markV28Preview();
    markHomeCut("v29");
    refresh();
    window.addEventListener("tempo:v26-preview", refresh);
    window.addEventListener("tempo:v27-preview", refresh);
    window.addEventListener("tempo:v28-preview", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("tempo:v26-preview", refresh);
      window.removeEventListener("tempo:v27-preview", refresh);
      window.removeEventListener("tempo:v28-preview", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const guidePreview = v28Preview || v27Preview || v26Preview;
  const tenantUnits = units;
  const appointedJobs = useMemo(
    () => CONTRACTOR_JOBS.filter((job) => job.appointed),
    [],
  );
  const officerUnits = useMemo(() => {
    const seen = new Set<string>();
    const list: Unit[] = [];
    for (const row of [
      ...UNITS,
      ...managedTenants.flatMap((tenant) => tenant.units),
    ]) {
      if (row.terminal !== OFFICER.terminal || row.zone !== "Airside") continue;
      if (!officerCanScope(row) || seen.has(row.id)) continue;
      seen.add(row.id);
      list.push(row);
    }
    return list;
  }, [managedTenants]);

  const contractorJob =
    appointedJobs.find((job) => job.id === jobId) ?? appointedJobs[0];
  const focusedOfficer =
    officerUnits.find((row) => row.id === officerFocus) ?? officerUnits[0] ?? null;

  useEffect(() => {
    if (role !== "officer") return;
    setOfficerScope(focusedOfficer ? { tenant: null, unit: focusedOfficer } : null);
  }, [role, focusedOfficer, setOfficerScope]);

  useEffect(() => {
    if (role !== "tenant") return;
    if (tenantUnits.some((row) => row.id === unit.id)) return;
    const next = tenantUnits[0];
    if (!next) return;
    setUnit(next);
    window.localStorage.setItem(LS_OUTLET, next.id);
  }, [role, unit.id, tenantUnits, setUnit]);

  const scopedUnit: Unit | null = isOfficer
    ? focusedOfficer
    : isContractor
      ? (contractorJob?.unit ?? unit)
      : unit;

  const firstName = isOfficer
    ? OFFICER.firstName
    : isContractor
      ? CONTRACTOR.firstName
      : TENANT.firstName;

  const showTenantPicker = role === "tenant" && tenantUnits.length > 1;
  const showContractorPicker =
    role === "contractor" && appointedJobs.length > 1;
  const showOfficerPicker = role === "officer" && officerUnits.length > 1;

  const unitValue = isOfficer
    ? (focusedOfficer?.id ?? "")
    : isContractor
      ? (contractorJob?.id ?? "")
      : unit.id;
  const unitOptions = isOfficer
    ? officerUnits.map((row) => ({
        value: row.id,
        label: `${shortCompany(row.company)} · ${row.unitNo}`,
      }))
    : isContractor
      ? appointedJobs.map((job) => ({
          value: job.id,
          label: job.label,
        }))
      : tenantUnits.map((row) => ({
          value: row.id,
          label: `${shortCompany(row.company)} · ${row.unitNo}`,
        }));
  const showScopePicker = isOfficer
    ? showOfficerPicker
    : isContractor
      ? showContractorPicker
      : showTenantPicker;
  const scopeUnit = scopedUnit ?? unit;

  function onScopeChange(next: string) {
    if (isOfficer) {
      setOfficerFocus(next);
      const hit = officerUnits.find((row) => row.id === next);
      if (hit) setOfficerScope({ tenant: null, unit: hit });
      return;
    }
    if (isContractor) {
      writeSavedJobId(next);
      setJobId(next);
      const job = jobById(next);
      setUnit(job.unit);
      window.localStorage.setItem(LS_OUTLET, job.unit.id);
      return;
    }
    const hit = tenantUnits.find((row) => row.id === next);
    if (!hit) return;
    setUnit(hit);
    window.localStorage.setItem(LS_OUTLET, hit.id);
  }

  const suggested = isOfficer
    ? "Which renovations need a Permit to Work?"
    : isContractor
      ? `What do I need for Joint Site Inspection at ${scopedUnit?.unitNo ?? "this unit"}?`
      : `What Permit to Work do I need before renovation at ${scopedUnit?.unitNo ?? "this unit"}?`;

  const updated = useMemo(() => {
    let list = DOCUMENTS.filter(
      (doc) =>
        (doc.status === "Updated" || doc.status === "New") &&
        doc.zone.includes("Airside") &&
        doc.tenancyType.some((type) => type === "F&B" || type === "Retail") &&
        portalDoc(role, doc.changelog),
    );
    if (scopedUnit) {
      list = list.filter(
        (doc) =>
          doc.terminal.includes(scopedUnit.terminal) &&
          doc.tenancyType.includes(scopedUnit.tenancyType),
      );
    } else if (isOfficer) {
      list = list.filter((doc) => doc.terminal.includes(OFFICER.terminal));
    }
    return list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [scopedUnit, isOfficer, role]);

  const processHref = (phase?: string) =>
    processV28Href(phase ? { phase } : undefined);
  const worksHref = V28_WORKS_HREF;

  const queueUnits = useMemo(() => {
    if (!isOfficer) return [];
    return focusedOfficer ? [focusedOfficer] : officerUnits;
  }, [isOfficer, focusedOfficer, officerUnits]);
  const permitRows = usePermitQueue(queueUnits, isOfficer, worksHref, guidePreview);
  const openJob = useOpenWorksJob(scopedUnit?.id ?? unit.id);
  const openWorks = useOpenV26Works(
    scopedUnit?.id ?? "",
    Boolean(scopedUnit) && guidePreview,
  );
  const v26Work = openWorks[0] ?? null;

  const workReady =
    v26Work && scopedUnit ? v28WorkReadiness(v26Work, scopedUnit, role) : null;
  const worksNow =
    !scopedUnit || openWorks.length > 1
      ? undefined
      : !workReady || !v26Work
        ? { empty: true as const }
        : {
            title: workReady.title,
            meta: "The step this renovation is on.",
            href: v28WorkHref(worksHref, v26Work.id, workReady),
            rail: v28WorkRailFromReady(workReady),
          };
  const worksCard = !scopedUnit
    ? null
    : guidePreview
      ? workReady && v26Work
        ? {
            title: workReady.title,
            chip: workReady.chip,
            tone: workReady.tone,
            meta: workReady.nextMove,
            href: `${worksHref}?work=${encodeURIComponent(v26Work.id)}`,
            cta: isContractor ? "Continue this work" : "Open this work",
          }
        : {
            title: "Works",
            chip: "None open",
            tone: "quiet" as const,
            meta: "When the next renovation begins, start it in Works.",
            href: worksHref,
            cta: isContractor ? "Start a work" : "See works",
          }
      : openJob
        ? {
            title: openJob.title,
            chip: jobStatusLabel(openJob),
            tone: "progress" as const,
            meta: isContractor
              ? "Declare this renovation in Works, then follow the steps."
              : "See the works your contractor has declared.",
            href: `${WORKS_HREF}?job=${openJob.id}`,
            cta: isContractor ? "Continue this work" : "Open this work",
          }
        : null;

  const updatesSubtitle = isOfficer
    ? focusedOfficer
      ? `Guidelines that have changed for ${focusedOfficer.unitNo}.`
      : `Guidelines that have changed across ${OFFICER.terminal} Airside.`
    : isContractor
      ? "Rules that have changed for this renovation."
      : "Guidelines that have changed for this unit.";

  return (
    <div className="dls-page relative flex flex-col !pt-5 tablet:!pt-8">
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-1/2 h-[68rem] w-screen -translate-x-1/2 bg-[linear-gradient(180deg,var(--color-purple-200)_0%,var(--color-purple-100)_34%,transparent_68%)]"
      />
      <div className="relative z-[1] flex flex-col">
      <header>
        <h1>Hello, {firstName}</h1>
        <UnitScope
          className="mt-1"
          company={shortCompany(scopeUnit.company)}
          unitNo={scopeUnit.unitNo}
          value={unitValue}
          options={showScopePicker ? unitOptions : []}
          onChange={onScopeChange}
        />
      </header>

      <HelpBand>
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <DashboardSearch
              embedded
              title={ASK[role].title}
              body={ASK[role].body}
              suggested={role === "tenant" ? "Ask about this tenancy" : suggested}
              shortcuts={[]}
              onAsk={setAsked}
            />
          </div>
          <Link
            to="/chat-v29"
            className="inline-flex h-12 shrink-0 items-center gap-1.5 rounded-full bg-purple-600 px-4 text-sm font-bold text-white hover:bg-purple-700"
          >
            <MessageCircle className="h-4 w-4" aria-hidden />
            Chat
          </Link>
        </div>
        {asked ? (
          <TenancySearchResults
            query={asked}
            unit={unit}
            processHref={processHref}
            works={
              worksCard
                ? { title: worksCard.title, status: worksCard.chip, href: worksCard.href }
                : null
            }
            onOpenFaq={setKitId}
          />
        ) : (
          <PhaseGuide title="Process" processHref={processHref} />
        )}
      </HelpBand>

      {!asked && scopedUnit && openWorks.length > 1 ? (
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <WorksList
            works={openWorks}
            unit={scopedUnit}
            role={role}
            worksHref={worksHref}
            className="h-full"
          />
          <DocBlock
            title="What changed"
            subtitle={updatesSubtitle}
            countNoun="update"
            icon={<BadgeCheck className="h-4 w-4" />}
            items={updated}
            empty="No guidelines have changed recently."
            change
            limit={HOME_GLANCE}
          />
        </div>
      ) : asked ? null : worksNow ? (
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <CurrentWork now={worksNow} />
          <DocBlock
            title="What changed"
            subtitle={updatesSubtitle}
            countNoun="update"
            icon={<BadgeCheck className="h-4 w-4" />}
            items={updated}
            empty="No guidelines have changed recently."
            change
            limit={HOME_GLANCE}
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <CurrentWork now={worksNow ?? { empty: true }} />
          <DocBlock
            title="What changed"
            subtitle={updatesSubtitle}
            countNoun="update"
            icon={<BadgeCheck className="h-4 w-4" />}
            items={updated}
            empty="No guidelines have changed recently."
            change
            limit={HOME_GLANCE}
          />
        </div>
      )}

      </div>
      {kitId ? (
        <KitPortion
          id={kitId}
          sections={faqForRole(role)}
          onClose={() => setKitId(null)}
        />
      ) : null}
    </div>
  );
}

function shortcutsFor(role: Role, showWorksChip: boolean): DashboardSearchHit[] {
  const byId = new Map(dashboardShortcuts().map((hit) => [hit.id, hit]));
  return CHIP_ORDER[role]
    .map((id) => byId.get(id))
    .filter((hit): hit is DashboardSearchHit => Boolean(hit))
    .filter((hit) => showWorksChip || hit.id !== "works-teaser");
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

function useOpenV26Works(unitId: string, enabled: boolean): V26Work[] {
  const [works, setWorks] = useState<V26Work[]>([]);
  useEffect(() => {
    if (!enabled || !unitId) {
      setWorks([]);
      return;
    }
    const refresh = () => {
      const story = readV28WorksStory();
      if (!story) seedV26Works(unitId);
      const rows = readV26Works(unitId).filter(
        (row) => !isV26EmptyStockSlot(row),
      );
      const byDate = (list: V26Work[]) =>
        [...list].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      if (story) {
        const open = rows.filter(
          (row) =>
            row.id.startsWith(`v28-${story}-`) &&
            !readV28Submitted(unitId, row.id),
        );
        setWorks(byDate(open.length > 0 ? open : rows));
        return;
      }
      const acting = v26WorkToActOn(rows);
      const latest = [...rows].sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      )[0];
      setWorks(acting ?? latest ? [acting ?? latest!] : []);
    };
    refresh();
    window.addEventListener(V26_WORKS_CHANGED, refresh);
    window.addEventListener(V28_WORKS_STORY_CHANGED, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(V26_WORKS_CHANGED, refresh);
      window.removeEventListener(V28_WORKS_STORY_CHANGED, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [unitId, enabled]);
  return works;
}

type PermitRow = {
  id: string;
  unitId: string;
  unitNo: string;
  company: string;
  title: string;
  status: string;
  href: string;
};

function usePermitQueue(
  units: Unit[],
  enabled: boolean,
  worksHref: string,
  deepLink: boolean,
): PermitRow[] {
  const key = units.map((row) => row.id).join("|");
  const [version, setVersion] = useState(0);
  useEffect(() => {
    if (!enabled || units.length === 0) return;
    for (const row of units) seedV26Works(row.id);
    setVersion((n) => n + 1);
    const refresh = () => setVersion((n) => n + 1);
    window.addEventListener(V26_WORKS_CHANGED, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(V26_WORKS_CHANGED, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [enabled, key, units]);

  return useMemo(() => {
    if (!enabled) return [];
    void version;
    const rows: PermitRow[] = [];
    for (const row of units) {
      const ready = readV26Works(row.id)
        .filter((work) => v26PackStatus(work) === "ready")
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
      if (!ready) continue;
      rows.push({
        id: `${row.id}:${ready.id}`,
        unitId: row.id,
        unitNo: row.unitNo,
        company: shortCompany(row.company),
        title: v26WorkListTitle(ready),
        status: v26WorkStatusLabel(ready),
        href: deepLink
          ? `${worksHref}?work=${encodeURIComponent(ready.id)}`
          : worksHref,
      });
    }
    return rows;
  }, [enabled, units, version, worksHref, deepLink]);
}

function permitCountLine(count: number, scopedLabel: string | null) {
  if (count === 0) {
    return scopedLabel
      ? `No Permit to Work is waiting for ${scopedLabel}.`
      : "No Permit to Work is waiting.";
  }
  const noun = count === 1 ? "renovation is" : "renovations are";
  return scopedLabel
    ? `${count} ${noun} ready for a Permit to Work at ${scopedLabel}.`
    : `${count} ${noun} ready for a Permit to Work.`;
}

function PermitQueue({
  rows,
  worksHref,
  scopedLabel,
  onOpen,
}: {
  rows: PermitRow[];
  worksHref: string;
  scopedLabel: string | null;
  onOpen: (unitId: string) => void;
}) {
  return (
    <section className="mt-8">
      <div className="mb-2 flex items-end justify-between gap-3">
        <div>
          <h2>Permit to Work</h2>
          <p className="mt-1 text-sm leading-[18px] text-grey-500">
            {permitCountLine(rows.length, scopedLabel)}
          </p>
        </div>
        <Link
          to={worksHref}
          className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-purple-600 hover:text-purple-700"
        >
          Open Works <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="rounded-[var(--radius-2xl)] border border-grey-100 bg-white px-5 py-6 text-sm text-grey-400">
          A renovation shows here when its Permit to Work pack is ready.
        </p>
      ) : (
        <ul className="overflow-hidden rounded-[var(--radius-2xl)] border border-grey-100 bg-white">
          {rows.map((row, index) => (
            <li
              key={row.id}
              className={index === 0 ? undefined : "border-t border-grey-75"}
            >
              <Link
                to={row.href}
                onClick={() => onOpen(row.unitId)}
                className="flex items-start gap-3 px-5 py-3.5 hover:bg-grey-50"
              >
                <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-[var(--radius-md)] bg-purple-100">
                  <img src={permitIcon} alt="" className="size-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <span className="text-sm font-bold text-black">
                      {row.unitNo} · {row.company}
                    </span>
                    <span className="text-xs font-bold text-warning-800">
                      {row.status}
                    </span>
                  </span>
                  <span className="mt-0.5 block text-xs leading-4 text-grey-500">
                    {row.title}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Tenancy guide cards. Copy rules: reviews/sharing/v30-phase-card-copywriting-spec.md */
const PHASE_GLANCE: Record<(typeof PHASES)[number]["id"], string> = {
  setup:
    "From tenancy award to permits approved. Your design needs approval before the fit-out starts.",
  build:
    "From site handover to opening day. You'll need a Permit to Work before work on site begins.",
  operate:
    "Day-to-day running of the tenancy. Fire safety checks are yearly, sales declarations are monthly.",
  exit: "From notice of exit to full handback. A Permit to Work is required before reinstatement starts.",
};

function plainTeam(owner: string) {
  if (owner === "AES") return "Airport safety";
  if (owner === "IFM" || owner === "iFM") return "Facilities";
  if (owner === "Comm") return "Concessions";
  return owner;
}

function plainDocType(type: string) {
  if (type === "Policy & Requirements") return "Policy";
  if (type === "Forms & Templates" || type === "Template & Form") return "Form";
  if (type === "Design Guideline") return "Design guide";
  return type;
}

const SHORTCUT_ICON: Record<string, React.ReactNode> = {
  "process-permits": <ClipboardCheck className="h-4 w-4" />,
  "doc-ifm": <BadgeCheck className="h-4 w-4" />,
  "process-handover": <KeyRound className="h-4 w-4" />,
  "process-reports": <FileText className="h-4 w-4" />,
  "process-jsi": <ClipboardCheck className="h-4 w-4" />,
  "works-teaser": <FolderOpen className="h-4 w-4" />,
};

const SEARCH_SKIP = new Set([
  "what",
  "when",
  "where",
  "which",
  "this",
  "that",
  "with",
  "from",
  "have",
  "does",
  "need",
  "your",
  "about",
]);

function matchScore(query: string, text: string) {
  const qWords = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 3 && !SEARCH_SKIP.has(word));
  const hay = text.toLowerCase();
  if (!qWords.length) return 0;
  let score = 0;
  for (const word of qWords) {
    if (hay.includes(word)) score += word.length > 3 ? 2 : 1;
  }
  if (hay.includes(query.trim().toLowerCase())) score += 5;
  return score;
}

function firstSentence(text: string) {
  const sentence = text.split(/(?<=\.)\s/)[0];
  return sentence || text;
}

type TenancyHit = {
  id: string;
  kicker: string;
  title: string;
  snippet: string;
  to?: string;
  faqId?: string;
  score: number;
};

function TenancySearchResults({
  query,
  unit,
  processHref,
  works,
  onOpenFaq,
}: {
  query: string;
  unit: Unit;
  processHref: (phase?: string) => string;
  works: { title: string; status: string; href: string } | null;
  onOpenFaq: (id: string) => void;
}) {
  const faqHits: TenancyHit[] = TENANCY_FAQ.flatMap((section) =>
    section.items.map((item) => ({
      id: `faq-${section.id}-${item.q}`,
      kicker: `Tenancy FAQ · ${section.title}`,
      title: item.q,
      snippet: firstSentence(item.a),
      faqId: section.id,
      score: matchScore(query, `${item.q} ${item.a} ${section.title}`),
    })),
  );
  const best = faqHits.reduce<TenancyHit | null>(
    (top, hit) => (hit.score > (top?.score ?? 0) ? hit : top),
    null,
  );
  const overview = best && best.score > 0 ? best : null;
  const phaseHits: TenancyHit[] = PHASES.map((phase, index) => ({
    id: `phase-${phase.id}`,
    kicker: "Process",
    title: `${index + 1}  ${V28_PHASE_NAME[phase.id]}`,
    snippet: PHASE_GLANCE[phase.id],
    to: processHref(phase.id),
    score: matchScore(query, `${V28_PHASE_NAME[phase.id]} ${PHASE_GLANCE[phase.id]}`),
  }));
  const docHits: TenancyHit[] = DOCUMENTS.filter(
    (doc) =>
      portalDoc("tenant", doc.changelog) &&
      doc.terminal.includes(unit.terminal) &&
      doc.tenancyType.includes(unit.tenancyType) &&
      doc.zone.includes(unit.zone),
  ).map((doc) => ({
    id: doc.id,
    kicker: doc.type,
    title: doc.name,
    snippet: doc.changelog,
    to: `/documents/${doc.id}`,
    score: matchScore(query, `${doc.name} ${doc.type} ${doc.changelog}`),
  }));
  const workHits: TenancyHit[] = works
    ? [
        {
          id: "works-pack",
          kicker: "Renovation",
          title: works.title,
          snippet: works.status,
          to: works.href,
          score: matchScore(query, `renovation works pack ${works.title} ${works.status}`),
        },
      ]
    : [];
  const results = [...faqHits, ...phaseHits, ...docHits, ...workHits]
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  return (
    <div className="mt-5">
      {overview ? (
        <section className="rounded-[var(--radius-2xl)] border border-grey-100 bg-white px-5 py-4">
          <p className="text-xs font-bold text-purple-600">Overview</p>
          <p className="mt-2 text-sm leading-5 text-black">
            {TENANCY_FAQ.flatMap((section) => section.items).find((item) => item.q === overview.title)?.a}
          </p>
          <p className="mt-3 text-xs text-grey-500">{overview.kicker}</p>
        </section>
      ) : (
        <p className="text-sm leading-5 text-grey-600">
          Nothing in this tenancy matched that. Try the kick-off, the till, or airport passes.
        </p>
      )}
      {results.length > 0 ? (
        <ul className="mt-4 divide-y divide-grey-100 overflow-hidden rounded-[var(--radius-2xl)] border border-grey-100 bg-white">
          {results.map((hit) => {
            const body = (
              <>
                <span className="block text-xs leading-4 text-grey-500">{hit.kicker}</span>
                <span className="mt-1 block text-sm leading-[18px] font-bold text-purple-600">
                  {hit.title}
                </span>
                <span className="mt-1 block text-sm leading-5 text-grey-600">{hit.snippet}</span>
              </>
            );
            return (
              <li key={hit.id}>
                {hit.to ? (
                  <Link to={hit.to} className="block px-5 py-3.5 hover:bg-grey-50">
                    {body}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => hit.faqId && onOpenFaq(hit.faqId)}
                    className="block w-full px-5 py-3.5 text-left hover:bg-grey-50"
                  >
                    {body}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function HelpBand({ children }: { children: React.ReactNode }) {
  return <div className="mt-6">{children}</div>;
}

/** New-tenant groups from the Tenant-Contractor Kit (Oct 2025), section A. */
const FAQ_ICONS: Record<string, React.ReactNode> = {
  renovation: <ClipboardCheck className="h-4 w-4" />,
  handover: <KeyRound className="h-4 w-4" />,
  outlet: <BadgeCheck className="h-4 w-4" />,
  sales: <FileText className="h-4 w-4" />,
  service: <GraduationCap className="h-4 w-4" />,
  pass: <IdCard className="h-4 w-4" />,
  fire: <Flame className="h-4 w-4" />,
  access: <IdCard className="h-4 w-4" />,
  kickoff: <KeyRound className="h-4 w-4" />,
  design: <FileText className="h-4 w-4" />,
  screen: <ClipboardCheck className="h-4 w-4" />,
  briefing: <GraduationCap className="h-4 w-4" />,
  reinstatement: <FolderOpen className="h-4 w-4" />,
  records: <FileText className="h-4 w-4" />,
  invite: <KeyRound className="h-4 w-4" />,
  pack: <BadgeCheck className="h-4 w-4" />,
};

function KitQuickLinks({
  sections,
  onOpen,
}: {
  sections: typeof TENANCY_FAQ;
  onOpen: (id: string) => void;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);

  const syncPage = () => {
    const el = scroller.current;
    const card = el?.querySelector("button");
    if (!el || !card) return;
    const step = card.getBoundingClientRect().width + 12;
    const next = Math.round(el.scrollLeft / step);
    setPage(Math.max(0, Math.min(sections.length - 1, next)));
  };

  return (
    <div className="mt-5">
      <h2>Quick links</h2>
      <div
        ref={scroller}
        onScroll={syncPage}
        className="-mx-4 mt-4 flex scroll-pl-4 gap-3 overflow-x-auto px-4 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden tablet:mx-0 tablet:grid tablet:scroll-pl-0 tablet:grid-cols-4 tablet:overflow-visible tablet:px-0"
      >
        {sections.map((link) => (
          <button
            key={link.id}
            type="button"
            onClick={() => onOpen(link.id)}
            className="flex min-h-16 w-[44%] shrink-0 snap-start items-center gap-3 rounded-[var(--radius-2xl)] border border-grey-200 bg-white px-4 py-3 text-left hover:border-purple-300 tablet:w-auto"
          >
            <span className="shrink-0 text-purple-600 [&_svg]:h-5 [&_svg]:w-5">
              {FAQ_ICONS[link.id]}
            </span>
            <span className="line-clamp-2 min-w-0 text-sm font-bold leading-[18px] text-black">
              {link.title}
            </span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => onOpen("all")}
          className="hidden items-center justify-start gap-1 text-sm font-bold text-purple-600 hover:text-purple-700 tablet:flex"
        >
          See all
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 flex items-center justify-center gap-1.5 tablet:hidden">
        {sections.map((link, index) => (
          <button
            key={link.id}
            type="button"
            aria-label={link.title}
            onClick={() => {
              const el = scroller.current;
              const card = el?.querySelector("button");
              if (!el || !card) return;
              const step = card.getBoundingClientRect().width + 12;
              el.scrollTo({ left: index * step, behavior: "smooth" });
            }}
            className={
              index === page
                ? "h-1.5 w-4 rounded-full bg-grey-600"
                : "h-1.5 w-1.5 rounded-full bg-grey-200"
            }
          />
        ))}
      </div>
    </div>
  );
}

function KitPortion({
  id,
  sections,
  onClose,
}: {
  id: string;
  sections: typeof TENANCY_FAQ;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const section = id === "all" ? null : (sections.find((item) => item.id === id) ?? null);
  const shown = section ? [section] : sections;
  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-[rgba(18,18,18,0.4)] tablet:items-center tablet:p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="faq-title"
        className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[var(--radius-2xl)] bg-white tablet:rounded-[var(--radius-2xl)]"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-3 border-b border-grey-100 px-5 py-4">
          <div className="min-w-0">
            <p className="text-sm leading-[18px] text-grey-500">Quick links</p>
            <h2 id="faq-title" className="mt-1">
              {section?.title ?? "Quick links"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-8 shrink-0 place-items-center rounded-full text-lg leading-none text-grey-500 hover:bg-grey-50"
          >
            ×
          </button>
        </header>
        <div className="overflow-y-auto px-5 py-5">
          {shown.map((part, index) => (
            <section key={part.id} className={index === 0 ? undefined : "mt-8"}>
              {section ? null : <h3>{part.title}</h3>}
              <dl className={section ? "space-y-4" : "mt-3 space-y-4"}>
                {part.items.map((item) => (
                  <div key={item.q}>
                    <dt className="text-sm font-bold leading-[18px] text-black">{item.q}</dt>
                    <dd className="mt-1 text-sm leading-5 text-grey-600">{item.a}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
          {sections === TENANCY_FAQ ? (
            <Link
              to={TENANCY_FAQ_HREF}
              className="mt-6 inline-flex items-center gap-1 text-sm font-bold text-purple-600 hover:text-purple-700"
            >
              Open Tenancy FAQ
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function QuickLinkCard({
  to,
  title,
  detail,
  icon,
}: {
  to: string;
  title: string;
  detail?: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className="flex min-w-0 items-center justify-between gap-3 rounded-[var(--radius-xl)] border border-grey-100 bg-white px-3 py-3 shadow-[0_1px_2px_rgba(18,18,18,0.04)] hover:border-purple-300"
    >
      <span className="min-w-0">
        <span className="block text-sm leading-[18px] font-bold text-black">{title}</span>
        {detail ? (
          <span className="mt-0.5 block text-xs leading-4 text-grey-600">{detail}</span>
        ) : null}
      </span>
      <span className="shrink-0 text-grey-600">{icon}</span>
    </Link>
  );
}

function PhaseGuide({
  title,
  subtitle,
  processHref,
  className,
}: {
  title: string;
  subtitle?: string;
  processHref: (phase?: string) => string;
  className?: string;
}) {
  return (
    <section className={className ? `mt-8 ${className}` : "mt-8"}>
      <div className="mb-2">
        <div className="flex items-center justify-between gap-3">
          <h2 className="min-w-0">{title}</h2>
          <Link
            to={processHref()}
            className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-purple-600 hover:text-purple-700"
          >
            See all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {subtitle ? (
          <p className="mt-1 text-sm leading-[18px] text-grey-500">{subtitle}</p>
        ) : null}
      </div>
      <div className="grid grid-cols-2 overflow-hidden rounded-[var(--radius-2xl)] border border-grey-100 bg-white tablet:grid-cols-4">
        {PHASES.map((phase, index) => (
          <Link
            key={phase.id}
            to={processHref(phase.id)}
            className={`min-w-0 px-4 py-4 hover:bg-purple-100 ${
              index % 2 === 0 ? "border-r border-grey-100" : ""
            } ${index < 2 ? "border-b border-grey-100 tablet:border-b-0" : ""} ${
              index < PHASES.length - 1 ? "tablet:border-r tablet:border-grey-100" : ""
            }`}
          >
            <span className="flex items-center gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-purple-200 text-base leading-none font-bold text-purple-700">
                {index + 1}
              </span>
              <span className="min-w-0 text-lg leading-6 font-bold text-black">
                {V28_PHASE_NAME[phase.id]}
              </span>
            </span>
            <span className="mt-3 block text-base leading-6 text-grey-600">
              {PHASE_GLANCE[phase.id]}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function SectionHeader({
  icon,
  title,
  subtitle,
  count,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  count?: string;
  action?: { to: string; label: string };
}) {
  return (
    <header className="flex items-center gap-3 border-b border-grey-100 px-5 py-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-600">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex min-h-6 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <h3 className="inline truncate">{title}</h3>
            {count ? (
              <span className="inline-flex h-5 shrink-0 items-center whitespace-nowrap rounded-full bg-purple-100 px-2 text-xs font-bold leading-none text-purple-700">
                {count}
              </span>
            ) : null}
          </div>
          {action ? (
            <Link
              to={action.to}
              className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-purple-600 hover:text-purple-700"
            >
              {action.label}
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : null}
        </div>
        <p className="mt-1 text-sm leading-[18px] text-grey-600">{subtitle}</p>
      </div>
    </header>
  );
}

const HOME_GLANCE = 3;

function workRows(works: V26Work[], unit: Unit, role: Role) {
  return works.map((work) => ({ work, ready: v28WorkReadiness(work, unit, role) }));
}

function CurrentWork({
  now,
}: {
  now:
    | { empty: true }
    | {
        title: string;
        meta: string;
        href: string;
        rail: V28WorkRail;
      };
}) {
  return (
    <section className="flex h-full flex-col overflow-hidden rounded-[var(--radius-2xl)] border border-grey-100 bg-white">
      <SectionHeader
        icon={<ClipboardCheck className="h-4 w-4" />}
        title="Current work"
        subtitle={"empty" in now ? "Nothing is waiting on this unit." : now.meta}
      />
      {"empty" in now ? (
        <p className="px-5 py-6 text-sm leading-5 text-grey-600">No works pending action.</p>
      ) : (
        <ul className="divide-y divide-grey-75 md:border-b md:border-grey-75">
          <li>
            <Link
              to={now.href}
              className="flex flex-col gap-3 px-5 py-3 hover:bg-grey-50"
            >
              <span className="truncate text-sm font-bold text-black">
                {now.title}
              </span>
              <WorkStepRail rail={now.rail} />
            </Link>
          </li>
        </ul>
      )}
    </section>
  );
}

function WorksList({
  works,
  unit,
  role,
  worksHref,
  className,
}: {
  works: V26Work[];
  unit: Unit;
  role: Role;
  worksHref: string;
  className?: string;
}) {
  const count = `${works.length} ${works.length === 1 ? "work" : "works"}`;
  const shown = works.slice(0, HOME_GLANCE);
  return (
    <section className={`flex h-full flex-col overflow-hidden rounded-[var(--radius-2xl)] border border-grey-100 bg-white ${className ?? "mt-8"}`}>
      <SectionHeader
        icon={<ClipboardCheck className="h-4 w-4" />}
        title="Current work"
        subtitle={
          works.length === 0
            ? "Nothing is waiting on this unit."
            : "The step each renovation is on."
        }
        count={count}
        action={
          works.length > shown.length
            ? { to: worksHref, label: "See all" }
            : undefined
        }
      />
      {works.length === 0 ? (
        <div className="flex flex-col items-center px-5 py-8 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-purple-400">
            <ClipboardCheck className="h-6 w-6" aria-hidden />
          </span>
          <p className="mt-3 max-w-xs text-sm leading-5 text-grey-600">
            There are currently no works pending action.
          </p>
        </div>
      ) : (
      <ul className="divide-y divide-grey-75">
        {workRows(shown, unit, role).map((row) => (
          <li key={row.work.id}>
            <Link
              to={v28WorkHref(worksHref, row.work.id, row.ready)}
              className="flex flex-col gap-3 px-5 py-3 hover:bg-grey-50"
            >
              <span className="truncate text-sm font-bold text-black">
                {row.ready.title}
              </span>
              <WorkStepRail rail={v28WorkRailFromReady(row.ready)} />
            </Link>
          </li>
        ))}
      </ul>
      )}
    </section>
  );
}

const WORK_CHIP: Record<V28ChipTone, string> = {
  draft: "bg-grey-75 text-grey-700",
  progress: "bg-purple-100 text-purple-700",
  action: "bg-warning-100 text-warning-800",
  issue: "bg-warning-200 text-warning-800",
  ready: "bg-success-100 text-success-600",
  quiet: "bg-grey-50 text-grey-600",
};

function DashboardSearch({
  title,
  body,
  suggested,
  shortcuts,
  embedded = false,
  unit,
  onAsk,
}: {
  title: string;
  body: string;
  suggested: string;
  shortcuts: DashboardSearchHit[];
  embedded?: boolean;
  onAsk?: (query: string) => void;
  unit?: {
    value: string;
    options: { value: string; label: string }[];
    onChange: (value: string) => void;
  };
}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const typed = query.trim();
  const hits = useMemo(() => dashboardSearchHits(query), [query]);

  return (
    <section className={embedded ? "min-w-0" : "mt-8 min-w-0"}>
      {embedded ? null : (
        <>
          <h2 className="text-lg leading-[22px] font-bold text-black">{title}</h2>
          <p className="mt-1 text-sm leading-[18px] text-grey-500">{body}</p>
        </>
      )}
      <form
        className={embedded ? undefined : "mt-4"}
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          if (onAsk) {
            if (typed) onAsk(typed);
            return;
          }
          navigate(hits[0]?.to ?? "/process");
        }}
      >
        {unit ? (
          <div className="flex h-12 min-w-0 items-center rounded-full border border-grey-200 bg-white focus-within:border-purple-600 focus-within:shadow-[0_0_0_2px_var(--color-purple-600)]">
            <label className="relative flex h-full shrink-0 items-center">
              <span className="sr-only">Unit</span>
              <select
                value={unit.value}
                onChange={(e) => unit.onChange(e.target.value)}
                className="h-full max-w-[9.5rem] appearance-none bg-transparent pr-7 pl-3 text-sm leading-[18px] font-bold text-black outline-none"
              >
                {unit.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute top-1/2 right-2 h-4 w-4 -translate-y-1/2 text-grey-500"
                aria-hidden
              />
            </label>
            <span className="h-5 w-px shrink-0 bg-grey-200" aria-hidden />
            <Search className="ml-3 h-5 w-5 shrink-0 text-grey-400" aria-hidden />
            <input
              id="dashboard-search"
              type="search"
              role="searchbox"
              aria-label={title}
              placeholder={suggested}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
              className="h-full min-w-0 flex-1 bg-transparent pr-4 pl-2 text-base leading-5 text-black outline-none placeholder:text-grey-300 [&::-webkit-search-cancel-button]:hidden"
            />
            {typed ? (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setQuery("")}
                className="mr-2 grid size-8 shrink-0 place-items-center rounded-full text-lg leading-none text-grey-500 hover:bg-grey-50"
              >
                ×
              </button>
            ) : null}
          </div>
        ) : (
          <SearchField
            id="dashboard-search"
            label={title}
            placeholder={suggested}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onClear={() => {
              setQuery("");
              onAsk?.("");
            }}
            leading={<Search className="h-5 w-5" aria-hidden />}
            className="rounded-full"
          />
        )}
      </form>
      {!onAsk && !typed && shortcuts.length > 0 ? (
        <div className="mt-5">
          <p className="text-sm leading-[18px] text-grey-500">Quick links</p>
          <div className="mt-3 grid grid-cols-2 gap-2 tablet:grid-cols-4">
            {shortcuts.map((hit) => (
              <QuickLinkCard
                key={hit.id}
                to={hit.to}
                title={hit.chip}
                icon={SHORTCUT_ICON[hit.id] ?? <ArrowUpRight className="h-4 w-4" />}
              />
            ))}
          </div>
        </div>
      ) : typed ? (
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
      ) : null}
    </section>
  );
}


function DocBlock({
  title,
  subtitle,
  countNoun,
  icon,
  items,
  empty,
  change = false,
  pin,
  action,
  limit,
}: {
  title: string;
  subtitle: string;
  countNoun?: string;
  icon: React.ReactNode;
  items: typeof DOCUMENTS;
  empty: string;
  change?: boolean;
  pin?: { title: string; meta: string; onOpen: () => void };
  action?: { to: string; label: string };
  limit?: number;
}) {
  const shown = limit ? items.slice(0, limit) : items;
  const countLabel = countNoun
    ? `${items.length} ${items.length === 1 ? countNoun : `${countNoun}s`}`
    : undefined;
  return (
    <section className="flex h-full flex-col overflow-hidden rounded-[var(--radius-2xl)] border border-grey-100 bg-white">
      <SectionHeader
        icon={icon}
        title={title}
        subtitle={subtitle}
        count={items.length > 0 ? countLabel : undefined}
        action={
          action ??
          (limit && items.length > shown.length
            ? { to: "/documents", label: "See all" }
            : undefined)
        }
      />
      {items.length === 0 && !pin ? (
        <p className="px-5 py-6 text-sm text-grey-400">{empty}</p>
      ) : (
        <ul className="divide-y divide-grey-75">
          {pin ? (
            <li>
              <button
                type="button"
                onClick={pin.onOpen}
                className="flex w-full items-start gap-3 px-5 py-3.5 text-left hover:bg-grey-50"
              >
                <span className="mt-0.5 shrink-0 text-purple-600">
                  <FileText className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-black">{pin.title}</span>
                  <span className="mt-0.5 block text-xs text-grey-500">{pin.meta}</span>
                </span>
              </button>
            </li>
          ) : null}
          {shown.map((doc) => {
            const lib = change ? undefined : matchV26Library(doc);
            if (!change && !lib) return null;
            return (
            <li key={lib?.id ?? doc.id}>
              <DocRow
                to={`/documents/${lib?.id ?? doc.id}`}
                title={lib?.name ?? doc.name}
                meta={
                  change
                    ? doc.changelog
                    : `${plainDocType(lib?.type ?? doc.type)} · ${plainTeam(lib?.owner ?? doc.owner)}`
                }
                icon={<FileText className="h-4 w-4" />}
              />
            </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
