import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useSearchParams } from "react-router-dom";
import {
  Archive,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ClipboardList,
  MessageCircleQuestion,
  MessageSquare,
  RotateCcw,
  X,
  Info,
} from "lucide-react";
import type { Role } from "@/lib/app-state";
import type { Unit } from "@/lib/tenancy-data";
import type { V26Work } from "@/lib/process-v26-works";
import type { V28WorkReadiness } from "@/lib/process-v28-readiness";
import {
  dropV31Work,
  readV31Archived,
  setV31Archived,
  V31_ARCHIVED_CHANGED,
} from "@/lib/process-v31-works";
import {
  readV31WorksStory,
  V31_WORKS_STORY_CHANGED,
} from "@/lib/process-v31-seed";
import { deleteV26Work } from "@/lib/process-v26-works";
import { V31_CHIP_TONE } from "@/lib/process-v31-cue";
import {
  v35CanArchive,
  v35CanDelete,
  v35CanStart,
  v35ContractorOf,
  v35FormatDate,
  v35IsPast,
  v35ShouldAutoArchive,
  v35StatusOf,
  v35WorkVisible,
} from "@/lib/process-v35";
import { usesV37Cut } from "@/lib/process-v31-preview";
import {
  V37_CHIP_TONE,
  v37ListStatus,
  v37Meta,
  v37UnitById,
  v37WorkVisible,
} from "@/lib/process-v37";
import { cn } from "@/lib/utils";
import {
  DlsTable,
  DlsTableBody,
  DlsTableHead,
  DlsTableIconButton,
  DlsTd,
  DlsTh,
  DlsTr,
} from "@/components/dls/Table";
import { DLS_PAGE_SIZE, DlsPagination, dlsPageCount } from "@/components/dls/Pagination";
import { RowMenu } from "@/components/dls/RowMenu";
import { Toast } from "@/components/dls/Toast";
import { PackHowItWorks } from "@/components/v31/PackHowItWorks";
import editIcon from "@/assets/figma/edit.svg";
import deleteBinIcon from "@/assets/figma/delete-bin.svg";
import caretDown from "@/assets/figma/caret-down.svg";
import { JourneyDialog, SheetFrame } from "@/components/dls/SheetFrame";
import projectsIcon from "@/assets/figma-setup/projects.svg";
import fileSearchIcon from "@/assets/figma/file-search.svg";
import alertIcon from "@/assets/figma/exclamation-alert.svg";

const HOW_IT_WORKS = [
  {
    title: "Answer questionnaire",
    body: "Tell us about your permit and planned works so we can tailor the screening to your application.",
    icon: MessageSquare,
  },
  {
    title: "View document checklist",
    body: "See which documents you’ll need, along with helpful samples to guide you.",
    icon: ClipboardList,
  },
  {
    title: "Upload documents & Screen",
    body: "Upload your completed documents and let the system check them against the requirements.",
    icon: ArrowUp,
  },
  {
    title: "Fix errors & Re-screen",
    body: "If any issues are identified, make the suggested changes and upload your documents again for another check.",
    icon: RotateCcw,
  },
  {
    title: "Download & Submit",
    body: "Download your results summary and screened documents, then submit them through OneCalendar.",
    icon: ArrowDown,
  },
];

function ProjectsIntroModal({
  starter = false,
  v37 = false,
  officer = false,
  onClose,
}: {
  /** The person who creates projects sees how a project runs, not what they can view. */
  starter?: boolean;
  v37?: boolean;
  officer?: boolean;
  onClose: () => void;
}) {
  const titleId = useId();
  const title = starter ? "How does this work?" : "What Projects is for";
  const about = officer
    ? "Every renovation on these units. When one tenancy is ending and another is starting, both can have a project at the same time."
    : "Renovations your contractor is running for your tenancy. Projects for the other tenant on the same unit stay hidden.";

  if (v37) {
    return createPortal(
      <JourneyDialog
        onClose={onClose}
        closeLabel={starter ? "Close how this works" : "Close what Projects is for"}
        titleId={titleId}
        title={title}
        subtitle={
          starter
            ? "Name the renovation, then check the documents before you submit in OneCalendar."
            : about
        }
      >
        {starter ? (
          <ol>
            {HOW_IT_WORKS.map((step, i) => {
              const Icon = step.icon;
              const last = i === HOW_IT_WORKS.length - 1;
              return (
                <li key={step.title} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span className="grid size-12 shrink-0 place-items-center rounded-full bg-grey-100 text-black">
                      <Icon className="size-6" strokeWidth={1.75} aria-hidden />
                    </span>
                    {last ? null : <span className="my-2.5 w-px flex-1 bg-grey-200" />}
                  </div>
                  <div className={cn("min-w-0 flex-1 pt-1.5", !last && "pb-4")}>
                    <p className="text-base leading-5 font-bold text-black">{step.title}</p>
                    <p className="mt-1 text-sm leading-[18px] text-grey-700">{step.body}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-sm leading-5 text-grey-700">
              Open any project, archive it for later, or review the answers and checks.
            </p>
            {officer ? null : (
              <p className="text-sm leading-5 text-grey-600">
                You do not start or delete a project.
              </p>
            )}
          </div>
        )}
      </JourneyDialog>,
      document.body,
    );
  }

  return createPortal(
    <SheetFrame
      onClose={onClose}
      closeLabel={starter ? "Close how this works" : "Close what Projects is for"}
      titleId={titleId}
    >
      <div className="flex flex-col gap-6 overflow-y-auto px-6 py-6 tablet:px-8">
        <div className="flex items-center gap-4">
          {starter ? (
            <MessageCircleQuestion className="size-6 shrink-0 text-black" aria-hidden />
          ) : (
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-purple-100 text-purple-600">
              <Info className="size-5" aria-hidden />
            </span>
          )}
          <h2 id={titleId} className={cn("min-w-0 flex-1 text-black", starter ? "text-2xl leading-8 font-black" : "text-lg leading-[22px] font-bold")}>
            {title}
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="grid size-6 shrink-0 place-items-center rounded-[var(--radius-sm)] text-black hover:bg-grey-50 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
          >
            <X size={16} />
          </button>
        </div>
        {starter ? (
          <ol>
            {HOW_IT_WORKS.map((step, i) => {
              const Icon = step.icon;
              const last = i === HOW_IT_WORKS.length - 1;
              return (
                <li key={step.title} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span className="grid size-12 shrink-0 place-items-center rounded-full bg-grey-100 text-black">
                      <Icon className="size-6" strokeWidth={1.75} aria-hidden />
                    </span>
                    {last ? null : <span className="my-2.5 w-px flex-1 bg-grey-200" />}
                  </div>
                  <div className={cn("min-w-0 flex-1 pt-1.5", !last && "pb-4")}>
                    <p className="text-base leading-5 font-bold text-black">{step.title}</p>
                    <p className="mt-1 text-sm leading-[18px] text-grey-700">{step.body}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        ) : (
          <>
        <p className="text-sm leading-5 text-grey-700">
          Your contractor creates a project to work out renovation requirements, permits, and documents.
        </p>
        <p className="text-sm leading-5 text-grey-700">
          Open any project, archive it for later, or review the answers and checks.
        </p>
        <p className="text-xs leading-4 text-grey-600">
          You do not start or delete a project.
        </p>
          </>
        )}
      </div>
    </SheetFrame>,
    document.body,
  );
}

type Row = { work: V26Work; ready: V28WorkReadiness };
type Tab = "ongoing" | "past" | "archived";

export function V35ProjectsList({
  role,
  unit,
  rows,
  onStart,
  onOpen,
}: {
  role: Role;
  unit: Unit;
  rows: Row[];
  onStart: () => void;
  onOpen: (work: V26Work) => void;
}) {
  const location = useLocation();
  const v37 = usesV37Cut(location.pathname);
  const unitId = unit.id;
  const [params] = useSearchParams();
  const listParam = params.get("list");
  const tabFromUrl: Tab =
    listParam === "archived" || listParam === "past" ? listParam : "ongoing";
  const archiveScope = v37 ? "v37" : unitId;
  const [archivedIds, setArchivedIds] = useState<string[]>(() =>
    readV31Archived(archiveScope),
  );
  const [tab, setTab] = useState<Tab>(tabFromUrl);
  const [introOpen, setIntroOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [pending, setPending] = useState<{
    id: string;
    kind: "archive" | "delete" | "both";
  } | null>(null);

  useEffect(() => {
    setTab(tabFromUrl);
  }, [tabFromUrl]);

  useEffect(() => {
    const sync = () => {
      const story = readV31WorksStory();
      if (story === "archive") setTab("archived");
      if (v37 && story === "past") setTab("past");
      if (v37 && (story === "intro" || story === "first" || story === "busy" || story === "lifespan")) {
        setTab("ongoing");
      }
    };
    window.addEventListener(V31_WORKS_STORY_CHANGED, sync);
    return () => window.removeEventListener(V31_WORKS_STORY_CHANGED, sync);
  }, [v37]);

  useEffect(() => {
    const refresh = () => setArchivedIds(readV31Archived(archiveScope));
    refresh();
    window.addEventListener(V31_ARCHIVED_CHANGED, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(V31_ARCHIVED_CHANGED, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [archiveScope]);

  const visible = rows.filter((row) =>
    v37 ? v37WorkVisible(row.work, role) : v35WorkVisible(row.work, role),
  );
  const autoIds = visible
    .filter((row) => v35ShouldAutoArchive(row.ready, row.work.createdAt))
    .map((row) => row.work.id);
  useEffect(() => {
    if (autoIds.length === 0) return;
    const next = [...new Set([...archivedIds, ...autoIds])];
    if (next.length === archivedIds.length) return;
    setV31Archived(archiveScope, next);
  }, [autoIds.join(","), archivedIds, archiveScope]);

  const archived = new Set(archivedIds);
  const live = visible.filter((row) => !archived.has(row.work.id));
  const rowPast = (ready: (typeof rows)[number]["ready"], work: (typeof rows)[number]["work"]) =>
    v37
      ? v37ListStatus(work, ready, role, v37UnitById(work.unitId) ?? unit).past
      : v35IsPast(ready, role);
  const ongoing = live.filter((row) => !rowPast(row.ready, row.work));
  const past = live.filter((row) => rowPast(row.ready, row.work));
  const stored = visible.filter((row) => archived.has(row.work.id));
  const [tenantFilter, setTenantFilter] = useState("all");
  const [outletFilter, setOutletFilter] = useState("all");
  const [unitFilter, setUnitFilter] = useState("all");
  const [contractorFilter, setContractorFilter] = useState("all");
  const shown = tab === "past" ? past : tab === "archived" ? stored : ongoing;
  const matches = (
    row: (typeof visible)[number],
    skip?: "tenant" | "outlet" | "unit" | "contractor",
  ) => {
    const meta = v37Meta(row.work);
    const contractor = v35ContractorOf(row.work).name;
    if (skip !== "tenant" && tenantFilter !== "all" && meta.tenantName !== tenantFilter) return false;
    if (skip !== "outlet" && outletFilter !== "all" && meta.outlet !== outletFilter) return false;
    if (skip !== "unit" && unitFilter !== "all" && meta.unitNo !== unitFilter) return false;
    if (skip !== "contractor" && contractorFilter !== "all" && contractor !== contractorFilter) return false;
    return true;
  };
  const facets = useMemo(() => {
    const collect = (skip?: "tenant" | "outlet" | "unit" | "contractor") => {
      const tenants = new Set<string>();
      const outlets = new Set<string>();
      const units = new Set<string>();
      const contractors = new Set<string>();
      for (const row of visible) {
        if (!matches(row, skip)) continue;
        const meta = v37Meta(row.work);
        if (meta.tenantName) tenants.add(meta.tenantName);
        if (meta.outlet) outlets.add(meta.outlet);
        if (meta.unitNo) units.add(meta.unitNo);
        contractors.add(v35ContractorOf(row.work).name);
      }
      return { tenants, outlets, units, contractors };
    };
    const tenants = collect("tenant").tenants;
    const outlets = collect("outlet").outlets;
    const units = collect("unit").units;
    const contractors = collect("contractor").contractors;
    return {
      tenants: [...tenants].sort(),
      outlets: [...outlets].sort(),
      units: [...units].sort(),
      contractors: [...contractors].sort(),
    };
  }, [visible, tenantFilter, outletFilter, unitFilter, contractorFilter]);
  const tableRows = v37 ? shown.filter((row) => matches(row)) : shown;
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [tab, tenantFilter, outletFilter, unitFilter, contractorFilter]);
  const pageCount = dlsPageCount(tableRows.length);
  const currentPage = Math.min(page, pageCount);
  const pageRows = v37
    ? tableRows.slice((currentPage - 1) * DLS_PAGE_SIZE, currentPage * DLS_PAGE_SIZE)
    : tableRows;
  const filteredOngoing = v37 ? ongoing.filter((row) => matches(row)).length : ongoing.length;
  const filteredPast = v37 ? past.filter((row) => matches(row)).length : past.length;
  const filteredStored = v37 ? stored.filter((row) => matches(row)).length : stored.length;
  const filtersOn =
    tenantFilter !== "all" ||
    outletFilter !== "all" ||
    unitFilter !== "all" ||
    contractorFilter !== "all";
  const filterSummary = [tenantFilter, outletFilter, unitFilter, contractorFilter]
    .filter((value) => value !== "all")
    .join(", ");
  const clearFilters = () => {
    setTenantFilter("all");
    setOutletFilter("all");
    setUnitFilter("all");
    setContractorFilter("all");
  };
  const showTenantFilter = v37 && role !== "tenant";
  const showOutletFilter = v37;
  const showUnitFilter = v37;
  const showContractorFilter = v37 && role !== "contractor";

  const [archivedToast, setArchivedToast] = useState<{ id: string; title: string } | null>(null);
  const closeArchivedToast = useCallback(() => setArchivedToast(null), []);
  const archive = (id: string) => {
    setV31Archived(archiveScope, [...new Set([...archivedIds, id])]);
    setPending(null);
    if (v37) {
      const title = visible.find((row) => row.work.id === id)?.ready.title ?? "Project";
      setArchivedToast({ id, title });
    }
  };
  const restore = (id: string) => {
    setV31Archived(
      archiveScope,
      archivedIds.filter((row) => row !== id),
    );
  };
  const remove = (id: string) => {
    dropV31Work(unitId, id);
    deleteV26Work(unitId, id);
    setPending(null);
  };

  return (
    <div className="col-span-full flex w-full min-w-0 flex-col gap-4">
      <Toast
        open={archivedToast != null}
        status="success"
        title="Project archived"
        description={archivedToast ? `${archivedToast.title} is now in Archived` : null}
        onClose={closeArchivedToast}
        actions={[
          { label: "Dismiss", onClick: closeArchivedToast },
          {
            label: "Undo",
            tone: "brand",
            onClick: () => {
              if (archivedToast) restore(archivedToast.id);
              closeArchivedToast();
            },
          },
        ]}
      />
      {v35CanStart(role) ? (
        v37 ? (
        <section className="flex w-full flex-col items-start gap-5 rounded-[var(--radius-2xl)] bg-[linear-gradient(186deg,#680BE1_44%,var(--color-purple-400)_101%)] p-6">
          <div className="flex w-full items-start gap-4">
            <img src={fileSearchIcon} alt="" width={32} height={32} className="shrink-0" />
            <div className="flex min-w-0 flex-1 flex-col gap-2 text-white">
              <h2 className="text-xl leading-7 font-black text-white">
                Create a New Project
              </h2>
              <p className="text-base leading-5">
                Tell us about the unit, tenancy and planned works so we can list the permits you need and screen your documents before you submit through OneCalendar.
              </p>
            </div>
          </div>
          <div className="flex w-full items-start gap-3 rounded-[var(--radius-md)] bg-white/20 px-5 py-4">
            <img src={alertIcon} alt="" width={24} height={24} className="shrink-0" />
            <p className="text-base leading-5 text-white">
              This is a preliminary screening only and <span className="font-bold">not submission</span>. Your application is still subject to approval in OneCalendar.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <button
              type="button"
              onClick={onStart}
              className="inline-flex h-11 items-center gap-1.5 rounded-[var(--radius-md)] bg-white px-4 text-base leading-5 font-bold text-purple-600 hover:bg-grey-25 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-white)]"
            >
              Start Now
              <ArrowRight size={16} aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              className="text-base leading-5 font-bold text-white hover:text-grey-25 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-white)]"
            >
              Learn More
            </button>
          </div>
        </section>
        ) : (
        <section className="flex w-full flex-col gap-5 rounded-[var(--radius-2xl)] border border-purple-200 bg-[linear-gradient(186deg,var(--color-purple-100)_30%,var(--color-purple-200)_100%)] px-5 py-5 tablet:px-6 tablet:py-6">
          <div className="flex items-start gap-4">
          <span
            aria-hidden
            className="mt-1 block shrink-0 bg-purple-600"
            style={{
              width: 22,
              height: 26,
              WebkitMaskImage: `url("${projectsIcon}")`,
              maskImage: `url("${projectsIcon}")`,
              WebkitMaskSize: "contain",
              maskSize: "contain",
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
              maskPosition: "center",
            }}
          />
          <div className="min-w-0 flex-1">
            <h2 className="text-xl leading-7 font-black text-black">
              Create a New Project
            </h2>
            <p className="mt-2 text-base leading-5 text-grey-700">
              Answer a few questions about the renovation. We work out the permits and documents it needs, then check your files before you submit in OneCalendar.
            </p>
          </div>
          </div>
          <div className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-purple-200 bg-purple-100 px-4 py-3.5">
            <Info className="mt-0.5 size-5 shrink-0 text-purple-600" aria-hidden />
            <p className="text-base leading-5 text-grey-700">
              This is a check before you submit, <span className="font-bold">not a submission</span>.
              Approval still happens in OneCalendar.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <button
              type="button"
              onClick={onStart}
              className="inline-flex h-11 items-center gap-1.5 rounded-[var(--radius-md)] bg-purple-600 px-4 text-base leading-5 font-bold text-white hover:bg-purple-700 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
            >
              Start a Project
              <ArrowRight size={16} aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => setIntroOpen(true)}
              className="text-base leading-5 font-bold text-purple-700 hover:text-purple-600 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
            >
              How It Works
            </button>
          </div>
        </section>
        )
      ) : (
        <section className="flex w-full flex-col items-start gap-5 rounded-[var(--radius-2xl)] bg-[linear-gradient(186deg,#680BE1_44%,var(--color-purple-400)_101%)] p-6">
          <div className="flex w-full items-start gap-4">
            <img src={fileSearchIcon} alt="" width={32} height={32} className="shrink-0" />
            <div className="flex min-w-0 flex-1 flex-col gap-2 text-white">
              <h2 className="text-xl leading-7 font-black text-white">
                What Projects is for
              </h2>
              <p className="text-base leading-5">
                {v37
                  ? role === "officer"
                    ? "See every renovation on these units, including when an outgoing and an incoming tenancy overlap"
                    : "See the renovations your contractor is running for your tenancy. Projects for the other tenant on the same unit stay hidden."
                  : "Your contractor creates a project to work out the renovation requirements, permits, and documents."}
              </p>
            </div>
          </div>
          <div className="flex w-full items-start gap-3 rounded-[var(--radius-md)] bg-white/20 px-5 py-4">
            <img src={alertIcon} alt="" width={24} height={24} className="shrink-0" />
            <p className="text-base leading-5 text-white">
              {v37 && role === "officer" ? (
                <>
                  <span className="font-bold">Open a project</span> to view its description, permits and screening results.
                </>
              ) : v37 ? (
                <>
                  Your contractor creates and manages projects.{" "}
                  <span className="font-bold">Open a project</span> to view its permits and screening results.
                </>
              ) : (
                <>
                  You do not start or delete a project.{" "}
                  <span className="font-bold">Open a project</span> to review the answers and checks.
                </>
              )}
            </p>
          </div>
          {v37 ? null : (
          <button
            type="button"
            onClick={() => setIntroOpen(true)}
            className="inline-flex h-11 items-center gap-1.5 rounded-[var(--radius-md)] bg-white px-4 text-base leading-5 font-bold text-purple-600 hover:bg-grey-25 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-white)]"
          >
            How It Works
            <ArrowRight size={16} aria-hidden />
          </button>
          )}
        </section>
      )}
      {introOpen && !v37 ? (
        <ProjectsIntroModal
          starter={v35CanStart(role)}
          v37={v37}
          officer={role === "officer"}
          onClose={() => setIntroOpen(false)}
        />
      ) : null}
      {helpOpen ? <PackHowItWorks onClose={() => setHelpOpen(false)} /> : null}

      {v37 ? (
        <div role="tablist" aria-label="Project lists" className="flex gap-6 border-b border-grey-100">
          {(
            [
              ["ongoing", "Ongoing", filteredOngoing],
              ["past", "Past", filteredPast],
              ...(stored.length > 0
                ? ([["archived", "Archived", filteredStored]] as const)
                : []),
            ] as [Tab, string, number][]
          ).map(([id, label, count]) => {
            const on = tab === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setTab(id)}
                className={cn(
                  "inline-flex items-center gap-1.5 pb-2.5 text-sm leading-[18px] font-bold",
                  on
                    ? "-mb-px border-b-2 border-purple-600 text-black"
                    : "text-grey-400 hover:text-grey-700",
                )}
              >
                {label}
                <span className={cn("tabular-nums", filtersOn && on ? "text-purple-700" : "text-grey-400")}>{count}</span>
              </button>
            );
          })}
        </div>
      ) : null}

      {v37 && (showTenantFilter || showOutletFilter || showUnitFilter || showContractorFilter) ? (
        <div
          className={cn(
            "flex flex-wrap items-center gap-3",
            filtersOn ? "rounded-[var(--radius-md)] bg-purple-50 px-4 py-3" : null,
          )}
        >
          {showTenantFilter ? (
            <FilterSelect
              label="Tenant"
              value={tenantFilter}
              options={facets.tenants}
              onChange={setTenantFilter}
              v37={v37}
            />
          ) : null}
          {showOutletFilter ? (
            <FilterSelect
              label="Outlet"
              value={outletFilter}
              options={facets.outlets}
              onChange={setOutletFilter}
              v37={v37}
            />
          ) : null}
          {showUnitFilter ? (
            <FilterSelect
              label="Unit"
              value={unitFilter}
              options={facets.units}
              onChange={setUnitFilter}
              v37={v37}
            />
          ) : null}
          {showContractorFilter ? (
            <FilterSelect
              label="Contractor"
              value={contractorFilter}
              options={facets.contractors}
              onChange={setContractorFilter}
              v37={v37}
            />
          ) : null}
          {filtersOn ? (
            <p className="ml-auto flex items-center gap-3 text-sm leading-[18px] font-bold text-purple-700">
              {tableRows.length} {tableRows.length === 1 ? "project" : "projects"}
              <button
                type="button"
                onClick={clearFilters}
                className="font-bold text-purple-600 underline decoration-purple-200 underline-offset-2 hover:text-purple-700"
              >
                Clear
              </button>
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-[var(--radius-2xl)] border border-grey-100 bg-white">
        {v37 ? null : showTenantFilter || showOutletFilter || showUnitFilter || showContractorFilter ? (
          <div
            className={cn(
              "flex flex-wrap items-center gap-3 border-b px-4 py-3",
              filtersOn ? "border-purple-200 bg-purple-50" : "border-grey-100",
            )}
          >
            {showTenantFilter ? (
              <FilterSelect
                label="Tenant"
                value={tenantFilter}
                options={facets.tenants}
                onChange={setTenantFilter}
                v37={v37}
              />
            ) : null}
            {showOutletFilter ? (
              <FilterSelect
                label="Outlet"
                value={outletFilter}
                options={facets.outlets}
                onChange={setOutletFilter}
                v37={v37}
              />
            ) : null}
            {showUnitFilter ? (
              <FilterSelect
                label="Unit"
                value={unitFilter}
                options={facets.units}
                onChange={setUnitFilter}
                v37={v37}
              />
            ) : null}
            {showContractorFilter ? (
              <FilterSelect
                label="Contractor"
                value={contractorFilter}
                options={facets.contractors}
                onChange={setContractorFilter}
                v37={v37}
              />
            ) : null}
            {filtersOn ? (
              <p className="ml-auto flex items-center gap-3 text-sm leading-[18px] font-bold text-purple-700">
                {tableRows.length} {tableRows.length === 1 ? "project" : "projects"}
                <button
                  type="button"
                  onClick={clearFilters}
                  className="font-bold text-purple-600 underline decoration-purple-200 underline-offset-2 hover:text-purple-700"
                >
                  Clear
                </button>
              </p>
            ) : null}
          </div>
        ) : null}
        {v37 ? null : (
        <div role="tablist" aria-label="Project lists" className="flex">
          {(
            [
              ["ongoing", "Ongoing", ongoing.length],
              ["past", "Past", past.length],
              ...(stored.length > 0
                ? ([["archived", "Archived", stored.length]] as const)
                : []),
            ] as [Tab, string, number][]
          ).map(([id, label, count]) => {
            const on = tab === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setTab(id)}
                className={cn(
                  "relative inline-flex items-center gap-1.5 px-4 pt-3 pb-2.5 text-base leading-5",
                  on
                    ? "font-bold text-purple-600 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-purple-600"
                    : "text-grey-500 hover:text-grey-700",
                )}
              >
                {label}
                <span className={cn("tabular-nums", on ? "text-purple-400" : "text-grey-400")}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        )}

        {shown.length === 0 ? (
          <p className={cn("px-5 py-6 text-sm text-grey-400", !v37 && "border-t border-grey-100")}>
            {v37
              ? tab === "past"
                ? "Your completed projects will show here"
                : tab === "archived"
                  ? "Projects you archive will show here"
                  : "Your ongoing projects will show here"
              : tab === "past"
              ? "No finished project on this unit yet."
              : tab === "archived"
                ? "Nothing archived on this unit."
                : "Nothing in progress on this unit."}
          </p>
        ) : tableRows.length === 0 ? (
          <p className={cn("px-5 py-6 text-sm text-grey-700", !v37 && "border-t border-grey-100")}>
            {filtersOn
              ? v37
                ? `There are no ${tab === "past" ? "past" : tab === "archived" ? "archived" : "ongoing"} projects for ${filterSummary}. Try clearing a filter.`
                : `No ${tab === "past" ? "past" : tab === "archived" ? "archived" : "ongoing"} project for ${filterSummary}.`
              : "Nothing matches these filters."}
          </p>
        ) : (
          <div className={v37 ? "overflow-x-auto" : undefined}>
          <DlsTable>
            <DlsTableHead className={v37 ? "bg-grey-700" : undefined}>
              <DlsTh className={v37 ? "bg-grey-700 text-sm leading-[18px] tracking-normal" : undefined}>Project</DlsTh>
              {v37 ? (
                <DlsTh className="bg-grey-700 text-sm leading-[18px] tracking-normal">Outlet</DlsTh>
              ) : null}
              {v37 ? (
                <DlsTh className="bg-grey-700 text-sm leading-[18px] tracking-normal">Unit</DlsTh>
              ) : null}
              <DlsTh className={v37 ? "bg-grey-700 text-sm leading-[18px] tracking-normal" : undefined}>Status</DlsTh>
              <DlsTh className={v37 ? "bg-grey-700 text-sm leading-[18px] tracking-normal" : undefined}>Contractor</DlsTh>
              <DlsTh className={v37 ? "bg-grey-700 text-sm leading-[18px] tracking-normal" : undefined}>Created</DlsTh>
              <DlsTh className={cn("text-right", v37 && "bg-grey-700 text-sm leading-[18px] tracking-normal")}>
                {v37 ? "Actions" : <span className="sr-only">Actions</span>}
              </DlsTh>
            </DlsTableHead>
            <DlsTableBody>
              {pageRows.map((row) => {
                const listStatus = v37
                  ? v37ListStatus(row.work, row.ready, role, v37UnitById(row.work.unitId) ?? unit)
                  : null;
                const v35Status = listStatus ? null : v35StatusOf(row.ready, role);
                const status = listStatus
                  ? { label: listStatus.label, toneClass: V37_CHIP_TONE[listStatus.tone] }
                  : { label: v35Status!.label, toneClass: V31_CHIP_TONE[v35Status!.tone] };
                const contractor = v35ContractorOf(row.work);
                const ask = pending?.id === row.work.id ? pending.kind : null;
                return (
                  <DlsTr key={row.work.id}>
                    <DlsTd className={v37 ? "text-sm leading-[18px] tablet:text-base tablet:leading-5" : undefined}>
                      <button
                        type="button"
                        onClick={() => onOpen(row.work)}
                        className={cn(
                          "rounded-[var(--radius-sm)] text-left font-bold text-purple-600 hover:text-purple-700 hover:underline focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]",
                          v37 && "text-sm leading-[18px] tablet:text-base tablet:leading-5",
                        )}
                      >
                        {row.ready.title}
                      </button>
                    </DlsTd>
                    {v37 ? (
                      <DlsTd
                        className={cn(
                          "text-sm leading-[18px] whitespace-nowrap tablet:text-base tablet:leading-5",
                          outletFilter !== "all" && "font-bold text-purple-700",
                        )}
                      >
                        {v37Meta(row.work).outlet}
                      </DlsTd>
                    ) : null}
                    {v37 ? (
                      <DlsTd
                        className={cn(
                          "text-sm leading-[18px] whitespace-nowrap tablet:text-base tablet:leading-5",
                          unitFilter !== "all" && "font-bold text-purple-700",
                        )}
                      >
                        {v37Meta(row.work).unitNo}
                      </DlsTd>
                    ) : null}
                    <DlsTd className={v37 ? "text-sm leading-[18px] tablet:text-base tablet:leading-5" : undefined}>
                      <span
                        className={cn(
                          "inline-flex items-center font-bold whitespace-nowrap",
                          v37
                            ? "h-[30px] rounded-[6px] px-3 text-sm leading-[18px]"
                            : "h-6 rounded-full px-2 text-xs leading-4",
                          status.toneClass,
                        )}
                      >
                        {status.label}
                      </span>
                    </DlsTd>
                    <DlsTd className={v37 ? "text-sm leading-[18px] tablet:text-base tablet:leading-5" : undefined}>{contractor.name}</DlsTd>
                    <DlsTd className={v37 ? "whitespace-nowrap text-sm leading-[18px] tablet:text-base tablet:leading-5" : "whitespace-nowrap"}>
                      {v35FormatDate(row.work.createdAt)}
                    </DlsTd>
                    <DlsTd>
                      {ask ? (
                        <span className="flex items-center justify-end gap-3">
                          <button
                            type="button"
                            className="text-sm leading-5 font-bold text-grey-600 hover:text-black"
                            onClick={() => setPending(null)}
                          >
                            Cancel
                          </button>
                          {ask === "delete" ? null : (
                            <button
                              type="button"
                              className="text-sm leading-5 font-bold text-error-600"
                              onClick={() => archive(row.work.id)}
                            >
                              Archive
                            </button>
                          )}
                          {ask === "archive" ? null : (
                            <button
                              type="button"
                              className="text-sm leading-5 font-bold text-error-600"
                              onClick={() => remove(row.work.id)}
                            >
                              Delete
                            </button>
                          )}
                        </span>
                      ) : v37 ? (
                        <span className="flex items-center justify-end gap-2">
                          <DlsTableIconButton
                            label={`Open ${row.ready.title}`}
                            src={editIcon}
                            onClick={() => onOpen(row.work)}
                          />
                          {tab === "archived" ? (
                            <button
                              type="button"
                              className="text-sm leading-[18px] font-bold text-purple-600 hover:underline"
                              onClick={() => restore(row.work.id)}
                            >
                              Restore
                            </button>
                          ) : (
                            <>
                              {v35CanArchive(role) ? (
                                <button
                                  type="button"
                                  aria-label={`Archive ${row.ready.title}`}
                                  title="Archive"
                                  onClick={() =>
                                    setPending({ id: row.work.id, kind: "archive" })
                                  }
                                  className="grid size-6 shrink-0 place-items-center rounded-[var(--radius-sm)] text-purple-600 hover:bg-purple-100 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
                                >
                                  <Archive className="size-4" aria-hidden />
                                </button>
                              ) : null}
                              {v35CanDelete(role) ? (
                                <DlsTableIconButton
                                  label={`Delete ${row.ready.title}`}
                                  title="Delete"
                                  src={deleteBinIcon}
                                  onClick={() =>
                                    setPending({ id: row.work.id, kind: "delete" })
                                  }
                                />
                              ) : null}
                            </>
                          )}
                        </span>
                      ) : (
                        <span className="flex items-center justify-end">
                          <RowMenu
                            label={`More actions for ${row.ready.title}`}
                            items={[
                              ...(tab === "archived"
                                ? [
                                    {
                                      id: "restore",
                                      label: "Restore",
                                      onSelect: () => restore(row.work.id),
                                    },
                                  ]
                                : v35CanArchive(role)
                                  ? [
                                      {
                                        id: "archive",
                                        label: "Archive",
                                        onSelect: () =>
                                          setPending({ id: row.work.id, kind: "archive" }),
                                      },
                                    ]
                                  : []),
                              ...(v35CanDelete(role) && tab !== "archived"
                                ? [
                                    {
                                      id: "delete",
                                      label: "Delete",
                                      danger: true,
                                      onSelect: () =>
                                        setPending({ id: row.work.id, kind: "delete" }),
                                    },
                                  ]
                                : []),
                            ]}
                          />
                        </span>
                      )}
                    </DlsTd>
                  </DlsTr>
                );
              })}
            </DlsTableBody>
          </DlsTable>
          </div>
        )}
      </div>
      {v37 && tableRows.length > 0 ? (
        <DlsPagination page={currentPage} pageCount={pageCount} onPage={setPage} />
      ) : null}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
  v37 = false,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (next: string) => void;
  v37?: boolean;
}) {
  const active = value !== "all" && options.includes(value);
  return (
    <label className={cn("flex items-center gap-2 text-sm leading-[18px]", active ? "font-bold text-purple-700" : "text-grey-700")}>
      {label}
      <select
        value={options.includes(value) ? value : "all"}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "h-10 rounded-[var(--radius-md)] border bg-white px-3 text-sm leading-5 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]",
          v37 &&
            "appearance-none bg-no-repeat py-0 pr-8 pl-3 [&::-ms-expand]:hidden [background-position:right_12px_center] [background-size:10px_6px]",
          active ? "border-purple-600 font-bold text-purple-700" : "border-grey-200 text-black",
        )}
        style={v37 ? { backgroundImage: `url("${caretDown}")` } : undefined}
      >
        <option value="all">All</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
