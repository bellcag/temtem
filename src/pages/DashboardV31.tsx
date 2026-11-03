import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import caretDown from "@/assets/figma/caret-down.svg";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  ArrowUp,
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
  Mic,
  Plus,
  Search,
  Sparkles,
  Square,
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
import { TENANCY_FAQ, TENANCY_FAQ_HREF } from "@/lib/home-v29-faq";
import { V31ProcessSection } from "@/components/v31/PhaseGuide";
import { HomeSectionHeader } from "@/components/v31/HomeSectionHeader";
import {
  cutProcessHref,
  cutWorksHref,
  isV33Path,
  isV34Path,
  isV35Path,
  isV36Path,
  usesV37Cut,
  processV31Href,
  remapV31Href,
  usesV36Chrome,
  worksV31Href,
  worksV34Href,
  worksV35Href,
} from "@/lib/process-v31-preview";
import { V31_PHASE_NAME } from "@/components/v31/PhaseGuide";
import { V31ProjectCardLink } from "@/components/v31/ProjectCard";
import { v37SignedInLabel, v37VisibleWorks } from "@/lib/process-v37";
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
  v28WorkReadiness,
} from "@/lib/process-v28-readiness";
import {
  v31IsPast,
  v31UrgencyRank,
  v31ProjectCue,
  v34OpensPermit,
  v31WaitingChipTone,
} from "@/lib/process-v31-cue";
import { v35IsPast, v35StatusOf, v35WorkHref, v35WorkVisible } from "@/lib/process-v35";
import { readV28Submitted } from "@/lib/process-v28-screener";
import {
  readV28WorksStory,
  V28_WORKS_STORY_CHANGED,
} from "@/lib/process-v28-seed";
import { ensureV31WorksStory } from "@/lib/process-v31-seed";
import {
  CONTRACTOR_JOBS,
  jobById,
  LS_OUTLET,
  readSavedJobId,
  writeSavedJobId,
} from "@/lib/process-job-context";
import fileIcon from "@/assets/figma/file.svg";
import { SearchField } from "@/components/dls/SearchField";
import { AskChatSheet, type AskChatMessage } from "@/components/v34/AskChatSheet";
import { V37Conversation, V37HomeComposer } from "@/components/v37/V37Chat";
import { V31UnitField } from "@/components/v31/UnitField";
import { v35FreshDocIds, v35FreshDocRows } from "@/lib/process-v35-updates";
import { SearchHitRow } from "@/components/dls/SearchHitRow";
import permitIcon from "@/assets/figma-setup/permit.svg";
import projectsIcon from "@/assets/figma-setup/projects.svg";
import announcementIcon from "@/assets/figma-setup/announcement.svg";

const ASK: Record<Role, { title: string; body: string }> = {
  tenant: {
    title: "Ask or search",
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

/** In-field control: the 32px trailing button the DLS search field uses. */
const ASK_ACTION =
  "grid size-8 shrink-0 place-items-center rounded-[var(--radius-sm)] border";

const ASK_STARTERS = [
  "When is the kick-off?",
  "Where are the renovation rules?",
  "How do I book the joint site inspection?",
];

function useJourneyEdition(): "v31" | "v33" | "v34" | "v35" {
  const path = useLocation().pathname;
  if (isV35Path(path) || isV36Path(path) || usesV37Cut(path)) return "v35";
  if (isV34Path(path)) return "v34";
  if (isV33Path(path)) return "v33";
  return "v31";
}

export function DashboardV31Page() {
  const journeyEdition = useJourneyEdition();
  const location = useLocation();
  const navigate = useNavigate();
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
  const [askOpen, setAskOpen] = useState(false);
  const [askSeed, setAskSeed] = useState("");
  const askRef = useRef<HTMLDivElement>(null);
  const [chat, setChat] = useState<{ seed: string } | null>(null);
  const [chatMessages, setChatMessages] = useState<AskChatMessage[]>([]);
  const [v37Seed, setV37Seed] = useState("");
  useEffect(() => {
    const refresh = () => setJobId(readSavedJobId());
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, []);

  useEffect(() => {
    if (!askOpen) return;
    const close = (event: PointerEvent) => {
      if (!askRef.current?.contains(event.target as Node)) setAskOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAskOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [askOpen]);

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

  const firstName = usesV37Cut(location.pathname)
    ? (v37SignedInLabel(role) ??
      (isOfficer
        ? OFFICER.firstName
        : isContractor
          ? CONTRACTOR.firstName
          : TENANT.firstName))
    : isOfficer
      ? OFFICER.firstName
      : isContractor
        ? CONTRACTOR.firstName
        : TENANT.firstName;

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
    processV31Href(phase ? { phase } : undefined);
  const worksHref = cutWorksHref(location.pathname);
  const recentDocs =
    isV35Path(location.pathname) || usesV37Cut(location.pathname);

  const openWorks = useOpenV26Works(scopedUnit, role, Boolean(scopedUnit));
  const v26Work = openWorks[0] ?? null;

  const workReady =
    v26Work && scopedUnit
      ? v28WorkReadiness(v26Work, scopedUnit, role, journeyEdition)
      : null;
  const worksCard = !scopedUnit
    ? null
    : workReady && v26Work
      ? {
          title: workReady.title,
          chip: workReady.chip,
          tone: workReady.tone,
          meta: workReady.nextMove,
          href: worksHref,
          cta: "Open This Project",
        }
      : {
          title: "Projects",
          chip: "None open",
          tone: "quiet" as const,
          meta: "When the next renovation begins, open it in Projects.",
          href: worksHref,
          cta: isContractor ? "Open a New Project" : "See Projects",
        };

  const scopeUnit = scopedUnit ?? unit;

  const onScopeChange = (next: string) => {
    setAsked("");
    setAskOpen(false);
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
  };

  const openV37Chat = (seed?: string) => {
    setV37Seed(seed?.trim() ?? "");
    const next = new URLSearchParams(location.search);
    next.set("chat", "1");
    navigate({ pathname: location.pathname, search: `?${next.toString()}` });
  };

  if (usesV37Cut(location.pathname) && new URLSearchParams(location.search).get("chat") === "1") {
    return <V37Conversation seed={v37Seed} name={firstName} />;
  }

  return (
    <div className="dls-page relative flex flex-col !pt-5 tablet:!pt-8">
      {journeyEdition === "v35" ? (
        <div
          aria-hidden
          className="pointer-events-none absolute top-0 left-1/2 h-[40rem] w-screen -translate-x-1/2 bg-[linear-gradient(186deg,var(--color-purple-100)_30%,var(--color-purple-200)_100%)]"
          style={{
            WebkitMaskImage: "linear-gradient(to bottom, #000 0%, #000 68%, transparent 100%)",
            maskImage: "linear-gradient(to bottom, #000 0%, #000 68%, transparent 100%)",
          }}
        />
      ) : (
        <div
          aria-hidden
          className="pointer-events-none absolute top-0 left-1/2 h-[48rem] w-screen -translate-x-1/2"
        >
          <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,transparent_18%,rgba(236,224,245,0.72)_23%,rgba(236,224,245,0.82)_30%,rgba(213,187,234,0.5)_40%,rgba(236,224,245,0.55)_50%,transparent_58%)] tablet:bg-[linear-gradient(180deg,transparent_0%,transparent_14%,rgba(236,224,245,0.7)_18%,rgba(213,187,234,0.5)_28%,rgba(236,224,245,0.48)_34%,transparent_40%)]" />
        </div>
      )}
      <div className="relative z-[1] flex flex-col">
      <header className="flex flex-col gap-3 tablet:flex-row tablet:items-start tablet:justify-between">
        <div className="shrink-0">
          <h1 className="text-[28px] leading-9 font-bold">
            <span className="tablet:hidden">Hello, {firstName}</span>
            <span className="hidden tablet:inline">Hello {firstName}</span>
          </h1>
          <p className="mt-1 hidden text-sm leading-[18px] text-grey-500 tablet:block">
            Showing documents relevant to all units.
          </p>
        </div>
        {journeyEdition === "v35" ? null : (
        <V31UnitField
          value={unitValue}
          options={unitOptions}
          chips={[scopeUnit.terminal, scopeUnit.zone, scopeUnit.tenancyType]}
          showSelect={unitOptions.length > 1}
          onChange={onScopeChange}
        />
        )}
      </header>

      <HelpBand className={journeyEdition === "v35" ? "mt-5" : undefined}>
          <div ref={askRef}>
          <DashboardSearch
            embedded
            title={ASK[role].title}
            body={ASK[role].body}
            suggested="Ask or search"
            shortcuts={[]}
            askSeed={askSeed}
            onOpenChat={
              usesV37Cut(location.pathname)
                ? (seed) => openV37Chat(seed)
                : journeyEdition === "v34" || journeyEdition === "v35"
                  ? (seed) => setChat({ seed: seed ?? "" })
                  : undefined
            }
            onFocusAsk={() => {
              if (!asked) setAskOpen(true);
            }}
            onAsk={(query) => {
              setAsked(query);
              setAskSeed(query);
              setAskOpen(false);
            }}
          />
          {askOpen && !asked ? (
            <div className={cn(
              "overflow-hidden rounded-[var(--radius-xl)] border border-grey-100 bg-white",
              journeyEdition === "v35" ? "mt-2" : "mt-3",
            )}>
              <p className="px-4 pt-3 text-xs leading-4 text-grey-500">Ask</p>
              <ul>
                {ASK_STARTERS.map((question) => (
                  <li key={question}>
                    <button
                      type="button"
                      onClick={() => {
                        setAskSeed(question);
                        setAsked(question);
                        setAskOpen(false);
                      }}
                      className={cn(
                        "block w-full px-4 text-left text-sm font-bold text-black hover:bg-grey-50",
                        journeyEdition === "v35" ? "py-2" : "py-3",
                      )}
                    >
                      {question}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {chat && !usesV37Cut(location.pathname) ? (
            <AskChatSheet
              unitLine={
                role === "tenant" && scopeUnit.company
                  ? `${scopeUnit.company} · ${scopeUnit.unitNo}`
                  : scopeUnit.unitNo
              }
              starters={ASK_STARTERS}
              messages={chatMessages}
              onMessages={setChatMessages}
              seed={chat.seed}
              onClose={() => setChat(null)}
            />
          ) : null}
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
          ) : null}
          {asked || journeyEdition === "v35" ? null : (
            <V31ProcessSection />
          )}
        </HelpBand>

      {asked ? null : journeyEdition === "v35" ? (
        <div className="mt-8 grid items-stretch gap-6 tablet:grid-cols-2">
          <V31ProcessSection boxed className="tablet:col-span-2" />
          <HomeProjects
            works={scopedUnit ? openWorks : []}
            unit={scopedUnit ?? unit}
            role={role}
            className={recentDocs ? undefined : "tablet:col-span-2"}
          />
          {recentDocs ? (
          <DocBlock
            title="Recently Updated"
            countLabel="New"
            icon={<UpdatesGlyph />}
            action={{ to: "/documents", label: "See All" }}
            items={v35FreshDocIds().flatMap((id) => updated.filter((doc) => doc.id === id))}
            empty="No guidelines have changed recently."
            change
            stepTag={(id) => {
              const steps = v35FreshDocRows().find((row) => row.doc === id)?.steps ?? [];
              if (steps.length === 0) return undefined;
              const rest = steps.length - 1;
              return rest > 0
                ? `Changes ${steps[0]} and ${rest} more`
                : `Changes ${steps[0]}`;
            }}
            limit={HOME_GLANCE}
          />
          ) : null}
        </div>
      ) : (
        <div className="mt-8 grid items-stretch gap-6 md:grid-cols-2">
          <HomeProjects
            works={scopedUnit ? openWorks : []}
            unit={scopedUnit ?? unit}
            role={role}
          />
          <DocBlock
            title="Recently Updated"
            countLabel="New"
            icon={<UpdatesGlyph />}
            action={{ to: "/documents", label: "See All" }}
            items={updated}
            empty="No guidelines have changed recently."
            change
            limit={HOME_GLANCE}
          />
        </div>
      )}

      </div>
      {kitId ? <KitPortion id={kitId} onClose={() => setKitId(null)} /> : null}
    </div>
  );
}

function shortcutsFor(role: Role, showWorksChip: boolean): DashboardSearchHit[] {
  const byId = new Map(dashboardShortcuts().map((hit) => [hit.id, hit]));
  return CHIP_ORDER[role]
    .map((id) => byId.get(id))
    .filter((hit): hit is DashboardSearchHit => Boolean(hit))
    .filter((hit) => showWorksChip || hit.id !== "works-teaser")
    .map((hit) => ({ ...hit, to: remapV31Href(hit.to) }));
}

function useOpenV26Works(unit: Unit | null, role: Role, enabled: boolean): V26Work[] {
  const unitId = unit?.id ?? "";
  const [works, setWorks] = useState<V26Work[]>([]);
  useEffect(() => {
    if (!enabled || !unit) {
      setWorks([]);
      return;
    }
    const refresh = () => {
      if (usesV37Cut(window.location.pathname)) {
        const mine = v37VisibleWorks(role).filter(
          (row) => !unit || row.unitId === unit.id,
        );
        const list = mine.length > 0 ? mine : v37VisibleWorks(role);
        setWorks(list.slice(0, 1));
        return;
      }
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
    if (!usesV37Cut(window.location.pathname)) ensureV31WorksStory(unit, role);
    refresh();
    window.addEventListener(V26_WORKS_CHANGED, refresh);
    window.addEventListener(V28_WORKS_STORY_CHANGED, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(V26_WORKS_CHANGED, refresh);
      window.removeEventListener(V28_WORKS_STORY_CHANGED, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [unit, role, enabled, unitId]);
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
  const journeyEdition = useJourneyEdition();
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
      const readiness = v28WorkReadiness(ready, row, "officer", journeyEdition);
      rows.push({
        id: `${row.id}:${ready.id}`,
        unitId: row.id,
        unitNo: row.unitNo,
        company: shortCompany(row.company),
        title: readiness.title,
        status: readiness.chip,
        href: worksHref,
      });
    }
    return rows;
  }, [enabled, units, version, worksHref, deepLink, journeyEdition]);
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
  setup: "From tenancy award to permits approved.",
  build: "From site handover to opening day.",
  operate: "Day-to-day running of the tenancy.",
  exit: "From notice of exit to full handback.",
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

const SEARCH_ALIAS: Record<string, string> = {
  ptw: "permit work",
};

function matchScore(query: string, text: string) {
  const qWords = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .flatMap((word) => (SEARCH_ALIAS[word] ?? word).split(" "))
    .filter((word) => word.length > 3 && !SEARCH_SKIP.has(word));
  const hay = text.toLowerCase();
  if (!qWords.length) return 0;
  let score = 0;
  for (const word of qWords) {
    if (hay.includes(word)) score += word.length > 3 ? 2 : 1;
  }
  if (hay.includes(query.trim().toLowerCase())) score += 5;
  if (
    qWords.includes("permit") &&
    qWords.includes("work") &&
    hay.includes("permit to work")
  ) {
    score += 6;
  }
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
  const phaseHits: TenancyHit[] = PHASES.map((phase, index) => ({
    id: `phase-${phase.id}`,
    kicker: "Process",
    title: `${index + 1}  ${V31_PHASE_NAME[phase.id]}`,
    snippet: PHASE_GLANCE[phase.id],
    to: processHref(phase.id),
    score: matchScore(query, `${V31_PHASE_NAME[phase.id]} ${PHASE_GLANCE[phase.id]}`),
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
  const ranked = [...faqHits, ...phaseHits, ...docHits, ...workHits].sort(
    (a, b) => b.score - a.score,
  );
  const overview = ranked.find((hit) => hit.score > 0) ?? null;
  const overviewAnswer =
    TENANCY_FAQ.flatMap((section) => section.items).find((item) => item.q === overview?.title)
      ?.a ?? overview?.snippet;
  const results = ranked.filter((hit) => hit.score > 0).slice(0, 6);

  return (
    <div className="mt-5">
      {overview ? (
        <section className="rounded-[var(--radius-2xl)] border border-grey-100 bg-white px-5 py-4">
          <p className="text-xs font-bold text-purple-600">Overview</p>
          <p className="mt-2 text-sm leading-5 text-black">
            {overviewAnswer}
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

function HelpBand({
  children,
  className = "mt-12 tablet:mt-16",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
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
};

function KitQuickLinks({ onOpen }: { onOpen: (id: string) => void }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);

  const syncPage = () => {
    const el = scroller.current;
    const card = el?.querySelector("button");
    if (!el || !card) return;
    const step = card.getBoundingClientRect().width + 12;
    const next = Math.round(el.scrollLeft / step);
    setPage(Math.max(0, Math.min(TENANCY_FAQ.length - 1, next)));
  };

  return (
    <div className="mt-8">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="min-w-0">Quick links</h2>
        <Link
          to={TENANCY_FAQ_HREF}
          className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-purple-600 hover:text-purple-700"
        >
          See all
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div
        ref={scroller}
        onScroll={syncPage}
        className="-mx-4 flex scroll-pl-4 gap-3 overflow-x-auto px-4 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden tablet:mx-0 tablet:grid tablet:scroll-pl-0 tablet:grid-cols-4 tablet:overflow-visible tablet:px-0"
      >
        {TENANCY_FAQ.map((link) => (
          <button
            key={link.id}
            type="button"
            onClick={() => onOpen(link.id)}
            className="flex h-16 w-[44%] shrink-0 snap-start items-center gap-3 rounded-[var(--radius-2xl)] border border-grey-200 bg-white px-4 text-left hover:border-purple-300 tablet:h-14 tablet:w-auto"
          >
            <span className="shrink-0 text-purple-600 [&_svg]:h-5 [&_svg]:w-5">
              {FAQ_ICONS[link.id]}
            </span>
            <span className="line-clamp-2 min-w-0 text-sm font-bold leading-[18px] text-black">
              {link.title}
            </span>
          </button>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-center gap-1.5 tablet:hidden">
        {TENANCY_FAQ.map((link, index) => (
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

function KitPortion({ id, onClose }: { id: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const section = TENANCY_FAQ.find((item) => item.id === id) ?? null;
  const sections = section ? [section] : TENANCY_FAQ;
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
          {sections.map((part, index) => (
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
          <Link
            to={TENANCY_FAQ_HREF}
            className="mt-6 inline-flex items-center gap-1 text-sm font-bold text-purple-600 hover:text-purple-700"
          >
            Open Tenancy FAQ
            <ArrowRight className="h-4 w-4" />
          </Link>
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
                {V31_PHASE_NAME[phase.id]}
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

/** Figma-set glyphs, masked so they take the header's purple. */
function SetupGlyph({
  src,
  w,
  h,
}: {
  src: string;
  w: number;
  h: number;
}) {
  return (
    <span
      aria-hidden
      className="block bg-current"
      style={{
        width: w,
        height: h,
        WebkitMaskImage: `url("${src}")`,
        maskImage: `url("${src}")`,
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
      }}
    />
  );
}

const ProjectsGlyph = () => (
  <SetupGlyph src={projectsIcon} w={14} h={16.666} />
);

const UpdatesGlyph = () => (
  <SetupGlyph src={announcementIcon} w={16.666} h={12.5} />
);

const HOME_GLANCE = 3;

/** Supporting lines from Home SectionCard, Content=Updates. Each line is 48 characters. */
const V31_UPDATE_LINE: Record<string, string> = {
  "doc-renovation": "Updated Section 3 airside hoarding dust-control.",
  "doc-cof": "Annual submission window now fits calendar year.",
  "doc-design": "Section 4 Shopfront, revised for new wayfinding.",
};

function HomeProjects({
  works,
  unit,
  role,
  className,
}: {
  works: V26Work[];
  unit: Unit;
  role: Role;
  className?: string;
}) {
  const journeyEdition = useJourneyEdition();
  const location = useLocation();
  const worksHref = cutWorksHref(location.pathname);
  const workLink =
    journeyEdition === "v35"
      ? (id: string) =>
          usesV36Chrome(location.pathname)
            ? worksV31Href({ work: id })
            : worksV35Href({ work: id })
      : journeyEdition === "v34"
      ? (id: string, cue: { action: string; detail?: string }) =>
          worksV34Href({ work: id, permit: v34OpensPermit(cue) })
      : (id: string) => worksV31Href({ work: id });
  const rows = works
    .map((work) => {
      const ready = v28WorkReadiness(work, unit, role, journeyEdition);
      const cue = v31ProjectCue(work, ready, role, unit);
      const v35 = v35StatusOf(ready, role);
      return { work, ready, cue, v35 };
    })
    .filter((row) =>
      journeyEdition === "v35"
        ? v35WorkVisible(row.work, role) && !v35IsPast(row.ready, role)
        : !v31IsPast(row.ready),
    )
    .sort((a, b) => {
      const rank = v31UrgencyRank(a.ready, a.cue) - v31UrgencyRank(b.ready, b.cue);
      if (rank !== 0) return rank;
      return a.ready.title.localeCompare(b.ready.title);
    });
  const glance = rows.slice(0, HOME_GLANCE);

  return (
    <section className={cn("flex h-full min-w-0 flex-col overflow-hidden rounded-[8px] border border-grey-100 bg-white", className)}>
      <HomeSectionHeader
        icon={<ProjectsGlyph />}
        title="Projects"
        count={rows.length > 0 ? rows.length : undefined}
        countLabel="Ongoing"
        action={{ to: worksHref, label: "See All" }}
      />
      {rows.length === 0 ? (
        <p className="px-5 py-6 text-sm text-grey-400">
          No project is open on this unit.
        </p>
      ) : (
        <ul
          className={cn(
            "divide-y divide-grey-75",
            glance.length < HOME_GLANCE && "border-b border-grey-75",
          )}
        >
            {glance.map((row) => (
              <li key={row.work.id}>
                <V31ProjectCardLink
                  title={row.ready.title}
                  action={
                    journeyEdition === "v35"
                      ? row.v35.label
                      : row.cue.action.startsWith("Waiting") &&
                          row.cue.detail &&
                          row.cue.detail !== row.cue.action
                        ? row.cue.detail
                        : row.cue.action
                  }
                  tone={
                    journeyEdition === "v35"
                      ? row.v35.tone
                      : row.cue.action.startsWith("Waiting")
                        ? v31WaitingChipTone(row.cue.detail, row.cue.tone)
                        : row.cue.tone
                  }
                  note={
                    journeyEdition === "v35"
                      ? undefined
                      : row.cue.action.startsWith("Waiting") &&
                          row.cue.detail &&
                          row.cue.detail !== row.cue.action
                        ? row.cue.action
                        : undefined
                  }
                  href={
                    journeyEdition === "v35"
                      ? v35WorkHref(location.pathname, row.work, unit, role)
                      : workLink(row.work.id, row.cue)
                  }
                  flush
                />
              </li>
            ))}
          </ul>
      )}
    </section>
  );
}

function DashboardSearch({
  title,
  body,
  suggested,
  shortcuts,
  embedded = false,
  unit,
  onAsk,
  onFocusAsk,
  onOpenChat,
  askSeed = "",
}: {
  title: string;
  body: string;
  suggested: string;
  shortcuts: DashboardSearchHit[];
  embedded?: boolean;
  onAsk?: (query: string) => void;
  onFocusAsk?: () => void;
  /** v34: the bar opens the chat instead of asking in place. */
  onOpenChat?: (seed?: string) => void;
  askSeed?: string;
  unit?: {
    value: string;
    options: { value: string; label: string }[];
    onChange: (value: string) => void;
  };
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const v35 = useJourneyEdition() === "v35";
  const [query, setQuery] = useState("");
  const [sending, setSending] = useState(false);
  const keepSending = useRef(false);
  const typed = query.trim();
  useEffect(() => {
    setQuery(askSeed);
    if (!keepSending.current) setSending(false);
    keepSending.current = false;
  }, [askSeed]);
  const hits = useMemo(
    () =>
      dashboardSearchHits(query).map((hit) => ({
        ...hit,
        to: remapV31Href(hit.to),
      })),
    [query],
  );

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
          if (onOpenChat) {
            if (v35 && !typed) return;
            onOpenChat(typed);
            setQuery("");
            return;
          }
          if (onAsk) {
            if (!typed || sending) return;
            keepSending.current = true;
            setSending(true);
            onAsk(typed);
            return;
          }
          navigate(hits[0]?.to ?? processV31Href());
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
        ) : embedded && v35 ? (
          usesV37Cut(location.pathname) ? (
            <V37HomeComposer
              value={query}
              onChange={(next) => {
                setQuery(next);
                setSending(false);
              }}
              starters={ASK_STARTERS}
              onPick={(question) => onOpenChat?.(question)}
            />
          ) : (
          <div>
            {!typed && onAsk ? (
              <div
                role="group"
                aria-label="Suggested questions"
                className="mb-3 flex flex-nowrap items-center gap-2 overflow-x-auto"
              >
                {ASK_STARTERS.map((question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() => (onOpenChat ? onOpenChat(question) : onAsk(question))}
                    className="inline-flex h-[30px] w-max shrink-0 items-center gap-1.5 rounded-[var(--radius-md)] border border-grey-100 bg-grey-25 px-2.5 text-sm leading-[18px] font-normal text-grey-600 hover:bg-purple-100"
                  >
                    <Sparkles className="size-4 shrink-0" aria-hidden />
                    <span className="whitespace-nowrap">{question}</span>
                  </button>
                ))}
              </div>
            ) : null}
            <div className="flex h-[52px] items-center gap-2 rounded-[var(--radius-md)] border border-grey-100 bg-white px-3">
              <label className="sr-only" htmlFor="dashboard-search">
                {title}
              </label>
              <span className="grid size-7 shrink-0 place-items-center text-grey-800" aria-hidden>
                <Plus className="size-4" strokeWidth={1.75} />
              </span>
              <input
                id="dashboard-search"
                type="search"
                role="searchbox"
                aria-label={title}
                placeholder="How can I help you today?"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSending(false);
                }}
                autoComplete="off"
                className="h-5 min-w-0 flex-1 bg-transparent text-sm leading-[18px] text-black outline-none placeholder:text-grey-400 [&::-webkit-search-cancel-button]:hidden"
              />
              <span className="grid size-7 shrink-0 place-items-center" aria-hidden>
                <span
                  className="block h-1.5 w-2.5 bg-grey-800"
                  style={{
                    WebkitMaskImage: `url("${caretDown}")`,
                    maskImage: `url("${caretDown}")`,
                    WebkitMaskSize: "contain",
                    maskSize: "contain",
                    WebkitMaskRepeat: "no-repeat",
                    maskRepeat: "no-repeat",
                    WebkitMaskPosition: "center",
                  }}
                />
              </span>
              <span className="grid size-7 shrink-0 place-items-center text-grey-800" aria-hidden>
                <Mic className="size-4" strokeWidth={1.75} />
              </span>
              {typed ? (
                <button
                  type="submit"
                  aria-label={sending ? "Stop" : "Send"}
                  onClick={
                    sending
                      ? (e) => {
                          e.preventDefault();
                          setSending(false);
                        }
                      : undefined
                  }
                  className={`${ASK_ACTION} border-purple-600 bg-purple-600 text-white`}
                >
                  {sending ? (
                    <Square className="size-4 fill-current" aria-hidden />
                  ) : (
                    <ArrowUp className="size-4" aria-hidden />
                  )}
                </button>
              ) : null}
            </div>
            <p className="mt-2 text-left text-xs leading-4 text-grey-500">
              <span className="block desktop:inline">
                This is an AI-powered platform and can make mistakes.
              </span>{" "}
              <span className="block desktop:inline">Please double-check responses.</span>
            </p>
          </div>
          )
        ) : embedded ? (
          <div>
          <div className="overflow-hidden rounded-[var(--radius-lg)] border border-grey-100 bg-white">
            <label className="sr-only" htmlFor="dashboard-search">
              {title}
            </label>
            <div
              className={cn("flex h-12 items-center gap-2 pr-3 pl-4", onOpenChat && "cursor-text")}
              onClick={
                onOpenChat
                  ? (e) => {
                      if ((e.target as HTMLElement).closest("button")) return;
                      onOpenChat();
                    }
                  : undefined
              }
            >
              {typed ? null : (
                <Sparkles className="size-5 shrink-0 text-grey-200" aria-hidden />
              )}
              <input
                id="dashboard-search"
                type="search"
                role="searchbox"
                placeholder="Ask about this unit"
                value={query}
                readOnly={Boolean(onOpenChat)}
                aria-haspopup={onOpenChat ? "dialog" : undefined}
                onKeyDown={
                  onOpenChat
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onOpenChat();
                        }
                      }
                    : undefined
                }
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSending(false);
                }}
                autoComplete="off"
                className="h-5 min-w-0 flex-1 bg-transparent text-base leading-5 text-black outline-none placeholder:text-grey-400 [&::-webkit-search-cancel-button]:hidden"
              />
              {sending ? (
                <button
                  type="button"
                  aria-label="Stop"
                  onClick={() => setSending(false)}
                  className={`${ASK_ACTION} border-grey-300 bg-white text-grey-700`}
                >
                  <Square className="size-4 fill-current" aria-hidden />
                </button>
              ) : null}
              <button
                type="submit"
                aria-label="Send"
                disabled={sending}
                className={`${ASK_ACTION} ${
                  sending
                    ? "border-grey-200 bg-grey-100 text-grey-400"
                    : "border-purple-600 bg-purple-600 text-white"
                }`}
              >
                <ArrowUp className="size-4" aria-hidden />
              </button>
            </div>
          </div>
            <p className="mt-3 text-xs leading-4 text-grey-600 tablet:hidden">
              This is an AI-powered platform and can make mistakes. Please double-check responses.
            </p>
            {!typed && onAsk ? (
              <div
                role="group"
                aria-label="Suggested questions"
                className="mt-6 flex flex-col items-start gap-3 tablet:mt-8 tablet:flex-row tablet:flex-wrap"
              >
                {ASK_STARTERS.map((question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() => (onOpenChat ? onOpenChat(question) : onAsk(question))}
                    className="inline-flex h-8 w-fit items-center rounded-full border border-grey-100 bg-grey-25 px-3 text-sm leading-[18px] font-normal text-purple-600 hover:border-purple-300 hover:bg-purple-100"
                  >
                    {question}
                  </button>
                ))}
              </div>
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
            onFocus={() => {
              if (!query.trim()) onFocusAsk?.();
            }}
            leading={<Search className="h-5 w-5" aria-hidden />}
            className="rounded-full"
          />
        )}
      </form>
      {onAsk ? null : !typed && shortcuts.length > 0 ? (
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
                to={cutProcessHref(location.pathname)}
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
  countLabel,
  icon,
  items,
  empty,
  change = false,
  pin,
  action,
  limit,
  stepTag,
}: {
  title: string;
  countLabel?: string;
  icon: React.ReactNode;
  items: typeof DOCUMENTS;
  empty: string;
  change?: boolean;
  /** Tag naming how many journey steps this document change revises. */
  stepTag?: (docId: string) => string | undefined;
  pin?: { title: string; meta: string; onOpen: () => void };
  action?: { to: string; label: string };
  limit?: number;
}) {
  const shown = limit ? items.slice(0, limit) : items;
  return (
    <section className="flex h-full flex-col overflow-hidden rounded-[8px] border border-grey-100 bg-white">
      <HomeSectionHeader
        icon={icon}
        title={title}
        count={items.length > 0 && countLabel ? items.length : undefined}
        countLabel={countLabel}
        action={
          action ??
          (limit && items.length > shown.length
            ? { to: "/documents", label: "See All" }
            : undefined)
        }
      />
      {items.length === 0 && !pin ? (
        <p className="px-5 py-6 text-sm text-grey-400">{empty}</p>
      ) : (
        <ul
          className={cn(
            "divide-y divide-grey-75",
            limit && shown.length + (pin ? 1 : 0) < limit && "border-b border-grey-75",
          )}
        >
          {pin ? (
            <li>
              <button
                type="button"
                onClick={pin.onOpen}
                className="flex min-h-16 w-full items-center gap-2 px-5 py-3 text-left hover:bg-grey-50"
              >
                <img src={fileIcon} alt="" className="size-4 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm leading-[18px] font-bold text-black">{pin.title}</span>
                  <span className="mt-0.5 block text-sm leading-[18px] text-grey-600">{pin.meta}</span>
                </span>
              </button>
            </li>
          ) : null}
          {shown.map((doc) => {
            const lib = change ? undefined : matchV26Library(doc);
            if (!change && !lib) return null;
            return (
            <li key={lib?.id ?? doc.id}>
              <Link
                to={`/documents/${lib?.id ?? doc.id}`}
                className="flex min-h-16 items-center gap-2 px-5 py-3 hover:bg-grey-50"
              >
                <img src={fileIcon} alt="" className="size-4 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm leading-[18px] font-bold text-black">
                    {lib?.name ?? doc.name}
                  </span>
                  <span className="mt-0.5 block overflow-hidden text-sm leading-[18px] text-ellipsis whitespace-nowrap text-grey-600">
                    {change
                      ? (stepTag?.(doc.id) ?? V31_UPDATE_LINE[doc.id] ?? doc.changelog)
                      : `${plainDocType(lib?.type ?? doc.type)} · ${plainTeam(lib?.owner ?? doc.owner)}`}
                  </span>
                </span>
              </Link>
            </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
