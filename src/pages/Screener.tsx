import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Link,
  Navigate,
  NavLink,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { useApp, type Role } from "@/lib/app-state";
import { UNITS, type Unit } from "@/lib/tenancy-data";
import { cn } from "@/lib/utils";
import {
  CONTRACTOR_JOBS,
  LS_OUTLET,
  jobById,
  readSavedJobId,
  resolveProcessUnit,
  unitJobLabel,
  writeSavedJobId,
} from "@/lib/process-job-context";
import {
  EMPTY_SUPPORTING_DOCS,
  needLabelCompact,
  supplierLine,
  type SupportingDoc,
} from "@/lib/process-permit-supporting-docs";
import {
  attachScreenerDoc,
  canAttachDoc,
  docAttachKey,
  removeScreenerDoc,
  screenerCopy,
  screenerIntro,
  screenerPackFor,
  screenerPackFromNames,
  screenerWaiting,
  useLiveLockedQuiz,
  useScreenerAttachments,
  type ScreenerAttachment,
  type ScreenerPermit,
} from "@/lib/process-screener";
import { EMPTY_QUIZ } from "@/lib/process-planned-works-quiz";
import {
  markV26Preview,
  readV26Preview,
  V26_WORKS_HREF,
  worksV26Href,
} from "@/lib/process-v26-preview";
import {
  readV26Works,
  seedV26Works,
  v26DraftOutcome,
  v26ScreenerFallbackHref,
  v26WorkListTitle,
} from "@/lib/process-v26-works";
import caretDown from "@/assets/figma/caret-down.svg";

const WORK_BACK =
  "inline-flex w-fit items-center gap-1 text-sm leading-[18px] font-bold text-purple-600 hover:text-purple-700 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]";
const PROCESS_SETUP_HREF = "/process?phase=setup";

function progressLabel(attached: number, required: number) {
  if (required === 0) return "No required documents";
  return `${attached} of ${required} required`;
}

function WorkBackLink({ to, children }: { to: string; children: string }) {
  return (
    <Link to={to} className={WORK_BACK}>
      <span
        aria-hidden
        className="block size-4 bg-current"
        style={{
          WebkitMaskImage: `url("${caretDown}")`,
          maskImage: `url("${caretDown}")`,
          WebkitMaskSize: "10px 6px",
          maskSize: "10px 6px",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          transform: "rotate(90deg)",
        }}
      />
      {children}
    </Link>
  );
}

function ScreenerTabs({ current }: { current: "drafts" | "history" }) {
  const tab = (to: string, label: string, active: boolean) => (
    <NavLink
      to={to}
      className={cn(
        "inline-flex h-8 items-center rounded-[var(--radius-sm)] px-3 text-sm leading-[18px]",
        active
          ? "bg-purple-100 font-bold text-purple-700"
          : "text-grey-700 hover:bg-grey-50",
      )}
    >
      {label}
    </NavLink>
  );
  return (
    <nav aria-label="Application Screener" className="flex flex-wrap gap-1">
      {tab("/screener/drafts", screenerCopy.tabCurrent, current === "drafts")}
      {tab("/screener/history", screenerCopy.tabHistory, current === "history")}
    </nav>
  );
}

function ContextSelect({
  role,
  jobId,
  unit,
  units,
  needsContext,
  onPickJob,
  onPickOutlet,
  onPickOfficer,
}: {
  role: Role;
  jobId: string;
  unit: Unit;
  units: Unit[];
  needsContext: boolean;
  onPickJob: (id: string) => void;
  onPickOutlet: (u: Unit) => void;
  onPickOfficer: (u: Unit) => void;
}) {
  const value =
    role === "contractor"
      ? jobId
      : role === "tenant"
        ? unit.id
        : unit.unitNo;
  const options =
    role === "contractor"
      ? CONTRACTOR_JOBS.map((j) => ({ value: j.id, label: j.label }))
      : role === "tenant"
        ? units.map((u) => ({ value: u.id, label: u.unitNo }))
        : UNITS.map((u) => ({ value: u.unitNo, label: u.unitNo }));

  return (
    <label className="flex w-full items-center gap-2 tablet:w-[259px] tablet:shrink-0">
      <span className="shrink-0 text-sm leading-[18px] font-bold text-grey-500">
        For
      </span>
      <select
        value={needsContext && role === "officer" ? "" : value}
        onChange={(e) => {
          const next = e.target.value;
          if (role === "contractor") {
            onPickJob(next);
            return;
          }
          if (role === "tenant") {
            const hit = units.find((u) => u.id === next);
            if (hit) onPickOutlet(hit);
            return;
          }
          const hit = UNITS.find((u) => u.unitNo === next);
          if (hit) onPickOfficer(hit);
        }}
        className="h-10 min-w-0 flex-1 rounded-[var(--radius-sm)] border border-grey-200 bg-white px-3 text-sm leading-[18px] text-black focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
      >
        {needsContext && role === "officer" && (
          <option value="">All units</option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function GhostLink({
  to,
  children,
}: {
  to: string;
  children: string;
}) {
  return (
    <Link
      to={to}
      className="inline-flex h-8 w-fit items-center justify-center rounded-[var(--radius-sm)] border border-purple-600 bg-white px-3 text-sm leading-[18px] font-bold text-purple-600 hover:bg-purple-100 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
    >
      {children}
    </Link>
  );
}

function DocRow({
  role,
  unitId,
  permitName,
  doc,
  attachment,
}: {
  role: Role;
  unitId: string;
  permitName: string;
  doc: SupportingDoc;
  attachment?: ScreenerAttachment;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const canAttach = canAttachDoc(role, doc);

  return (
    <li className="flex flex-col gap-2 border-t border-grey-100 py-3 first:border-t-0 first:pt-0 last:pb-0">
      <div className="flex flex-col gap-1">
        <p className="text-sm leading-[18px] font-bold text-black">{doc.name}</p>
        <p className="text-xs leading-4 text-grey-600">
          {needLabelCompact(doc.need)} · {supplierLine(doc.supplier, role)}
        </p>
        {attachment ? (
          <p className="text-xs leading-4 text-green-700">
            {screenerCopy.attached} · {attachment.fileName}
          </p>
        ) : (
          <p className="text-xs leading-4 text-grey-500">
            {screenerCopy.notAttached}
          </p>
        )}
      </div>
      {canAttach && (
        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            className="sr-only"
            aria-label={`Attach ${doc.name}`}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) attachScreenerDoc(unitId, permitName, doc.name, file.name);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex h-8 items-center rounded-[var(--radius-sm)] bg-purple-600 px-3 text-sm leading-[18px] font-bold text-white hover:bg-purple-700 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
          >
            {attachment ? "Replace" : screenerCopy.attachCta}
          </button>
          {attachment && (
            <button
              type="button"
              onClick={() => removeScreenerDoc(unitId, permitName, doc.name)}
              className="inline-flex h-8 items-center rounded-[var(--radius-sm)] border border-purple-600 bg-white px-3 text-sm leading-[18px] font-bold text-purple-600 hover:bg-purple-100 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
            >
              {screenerCopy.removeCta}
            </button>
          )}
        </div>
      )}
    </li>
  );
}

function PermitCard({
  role,
  unitId,
  permit,
  attachments,
  defaultOpen,
}: {
  role: Role;
  unitId: string;
  permit: ScreenerPermit;
  attachments: Record<string, ScreenerAttachment>;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const { supporting } = permit;
  const showNotes = role === "officer";

  return (
    <section className="overflow-hidden rounded-[var(--radius-2xl)] border border-grey-100 bg-white shadow-[var(--shadow-light-bg)]">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-grey-50 focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--color-purple-600)]"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-base leading-5 font-bold text-black">
            {permit.name}
          </span>
          <span className="mt-1 block text-xs leading-4 text-grey-500">
            {supporting.docs.length === 0
              ? "No listed documents"
              : progressLabel(permit.attachedRequired, permit.requiredCount)}
          </span>
        </span>
        <span className="text-sm leading-[18px] font-bold text-purple-600">
          {open ? "Hide" : "Show"}
        </span>
      </button>
      {open && (
        <div className="border-t border-grey-100 px-5 py-4">
          {showNotes && supporting.ifmNote && (
            <p className="mb-3 text-sm leading-[18px] text-grey-700">
              {supporting.ifmNote}
            </p>
          )}
          {showNotes && supporting.unmatched && (
            <p className="mb-3 text-sm leading-[18px] text-grey-700">
              {supporting.unmatched}
            </p>
          )}
          {supporting.docs.length === 0 ? (
            <p className="text-sm leading-[18px] text-grey-600">
              {EMPTY_SUPPORTING_DOCS}
            </p>
          ) : (
            <ul>
              {supporting.docs.map((doc) => (
                <DocRow
                  key={doc.name}
                  role={role}
                  unitId={unitId}
                  permitName={permit.name}
                  doc={doc}
                  attachment={attachments[docAttachKey(permit.name, doc.name)]}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

function useScreenerContext() {
  const {
    role,
    unit,
    setUnit,
    units,
    effectiveUnit,
    isUnscoped,
    setOfficerSelection,
  } = useApp();
  const [jobId, setJobId] = useState(readSavedJobId);
  const ctxUnit = useMemo(
    () => resolveProcessUnit(role, { unit, effectiveUnit, jobId }),
    [role, unit, effectiveUnit, jobId],
  );
  const needsContext = role === "officer" && isUnscoped;

  const pickJob = (id: string) => {
    setJobId(id);
    writeSavedJobId(id);
  };
  const pickOutlet = (next: Unit) => {
    setUnit(next);
    window.localStorage.setItem(LS_OUTLET, next.id);
  };
  const pickOfficer = (next: Unit) => {
    setOfficerSelection({
      terminal: next.terminal as "T1" | "T2" | "T3" | "T4",
      tenancyType: next.tenancyType as "Retail" | "F&B",
      zone: "Airside",
    });
  };

  return {
    role,
    jobId,
    ctxUnit,
    units,
    needsContext,
    appointed: role !== "contractor" || jobById(jobId).appointed,
    pickJob,
    pickOutlet,
    pickOfficer,
  };
}

function ScreenerShell({
  current,
  ctx,
  children,
}: {
  current: "drafts" | "history";
  ctx: ReturnType<typeof useScreenerContext>;
  children: ReactNode;
}) {
  return (
    <div className="dls-page flex flex-col gap-6 !pt-5 tablet:!pt-8">
      <header className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 tablet:flex-row tablet:items-start tablet:justify-between tablet:gap-2">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <h1 className="text-[28px] leading-9 font-bold text-black">
              {screenerCopy.title}
            </h1>
            <p className="text-sm leading-[18px] text-grey-500">
              {screenerIntro(ctx.role)}
            </p>
          </div>
          <ContextSelect
            role={ctx.role}
            jobId={ctx.jobId}
            unit={ctx.ctxUnit}
            units={ctx.units}
            needsContext={ctx.needsContext}
            onPickJob={ctx.pickJob}
            onPickOutlet={ctx.pickOutlet}
            onPickOfficer={ctx.pickOfficer}
          />
        </div>
        <ScreenerTabs current={current} />
      </header>
      {children}
    </div>
  );
}

function V26ScreenerShell({
  workTitle,
  unitNo,
  workBack,
  children,
}: {
  workTitle: string;
  unitNo: string;
  workBack: string;
  children: ReactNode;
}) {
  return (
    <div className="dls-page flex max-w-xl flex-col gap-6 !pt-5 tablet:!pt-8">
      <header className="flex flex-col gap-3">
        <WorkBackLink to={workBack}>Back to this work</WorkBackLink>
        <div className="flex flex-col gap-2">
          <p className="text-xs leading-4 font-bold uppercase tracking-[0.08em] text-grey-400">
            Works
          </p>
          <h1 className="text-[28px] leading-9 font-bold text-black">
            Permit application
          </h1>
          <p className="text-sm leading-[18px] text-grey-500">
            {workTitle} · {unitNo} · Attach files, then apply in OneCalendar
          </p>
        </div>
      </header>
      {children}
    </div>
  );
}

export function ScreenerDraftsPage() {
  const ctx = useScreenerContext();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const v26WorkId = params.get("work");
  const v26Preview =
    params.get("from") === "v26" || readV26Preview();

  useEffect(() => {
    if (params.get("from") === "v26") markV26Preview();
    if (!v26Preview || v26WorkId) return;
    navigate(v26ScreenerFallbackHref(ctx.ctxUnit.id), { replace: true });
  }, [v26Preview, v26WorkId, ctx.ctxUnit.id, navigate, params]);

  const quiz = useLiveLockedQuiz(ctx.ctxUnit.id);
  const attachments = useScreenerAttachments(ctx.ctxUnit.id);
  const v26Pack = useMemo(() => {
    if (!v26Preview || !v26WorkId) return null;
    seedV26Works(ctx.ctxUnit.id);
    const work = readV26Works(ctx.ctxUnit.id).find((row) => row.id === v26WorkId);
    if (!work) return null;
    const outcome = v26DraftOutcome(work, ctx.role, ctx.ctxUnit);
    return {
      work,
      pack: screenerPackFromNames(outcome.permits, attachments),
    };
  }, [v26Preview, v26WorkId, ctx.ctxUnit, ctx.role, attachments]);
  const pack = useMemo(
    () =>
      v26Pack?.pack ??
      screenerPackFor(quiz ?? EMPTY_QUIZ, ctx.ctxUnit, attachments),
    [v26Pack, quiz, ctx.ctxUnit, attachments],
  );
  const locked = v26Pack
    ? pack.permits.length > 0 && !ctx.needsContext
    : pack.locked && ctx.appointed && !ctx.needsContext;
  const workBack = v26WorkId ? worksV26Href({ work: v26WorkId }) : null;

  if (v26Preview && !v26WorkId) return null;

  const packBody = ctx.needsContext ? (
    <section className="rounded-[var(--radius-2xl)] border border-grey-100 bg-white p-5 shadow-[var(--shadow-light-bg)]">
      <p className="text-sm leading-[18px] text-grey-700">
        {screenerCopy.unscoped}
      </p>
      <div className="mt-4">
        <GhostLink to={PROCESS_SETUP_HREF}>{screenerCopy.waitingCta}</GhostLink>
      </div>
    </section>
  ) : !locked ? (
    <section className="rounded-[var(--radius-2xl)] border border-grey-100 bg-white p-5 shadow-[var(--shadow-light-bg)]">
      <p className="text-sm leading-[18px] font-bold text-black">
        {v26Pack ? v26WorkListTitle(v26Pack.work) : unitJobLabel(ctx.ctxUnit)}
      </p>
      <p className="mt-2 text-sm leading-[18px] text-grey-700">
        {workBack
          ? "Tick what this work involves first, then come back to attach files."
          : !ctx.appointed
            ? "This job is not appointed yet."
            : screenerWaiting(ctx.role)}
      </p>
      {!v26Pack ? (
        <div className="mt-4">
          <GhostLink to={PROCESS_SETUP_HREF}>{screenerCopy.waitingCta}</GhostLink>
        </div>
      ) : null}
    </section>
  ) : (
    <div className="flex flex-col gap-4">
      <section className="rounded-[var(--radius-2xl)] border border-grey-100 bg-white p-5 shadow-[var(--shadow-light-bg)]">
        <p className="text-sm leading-[18px] font-bold text-black">
          {v26Pack
            ? `Documents for ${v26WorkListTitle(v26Pack.work)}`
            : `Locked pack · ${unitJobLabel(ctx.ctxUnit)}`}
        </p>
        <p className="mt-1 text-xs leading-4 text-grey-500">
          {progressLabel(pack.attachedRequired, pack.requiredCount)}
        </p>
        <p className="mt-3 text-sm leading-[18px] text-grey-700">
          {v26Pack
            ? "Upload supporting files for this work, then submit through OneCalendar."
            : screenerCopy.lockedNote}
        </p>
      </section>
      {pack.permits.map((permit, index) => (
        <PermitCard
          key={permit.name}
          role={ctx.role}
          unitId={ctx.ctxUnit.id}
          permit={permit}
          attachments={attachments}
          defaultOpen={index === 0}
        />
      ))}
    </div>
  );

  if (v26Pack && workBack) {
    return (
      <V26ScreenerShell
        workTitle={v26WorkListTitle(v26Pack.work)}
        unitNo={ctx.ctxUnit.unitNo}
        workBack={workBack}
      >
        {packBody}
      </V26ScreenerShell>
    );
  }

  return (
    <ScreenerShell current="drafts" ctx={ctx}>
      {workBack ? (
        <div className="mb-2">
          <GhostLink to={workBack}>Back to this work</GhostLink>
        </div>
      ) : null}
      {packBody}
    </ScreenerShell>
  );
}

export function ScreenerHistoryPage() {
  const ctx = useScreenerContext();
  const quiz = useLiveLockedQuiz(ctx.ctxUnit.id);
  const attachments = useScreenerAttachments(ctx.ctxUnit.id);
  const pack = useMemo(
    () => screenerPackFor(quiz ?? EMPTY_QUIZ, ctx.ctxUnit, attachments),
    [quiz, ctx.ctxUnit, attachments],
  );
  if (readV26Preview()) {
    return <Navigate to={V26_WORKS_HREF} replace />;
  }
  const showRow = pack.locked && ctx.appointed && !ctx.needsContext;

  return (
    <ScreenerShell current="history" ctx={ctx}>
      {showRow ? (
        <Link
          to="/screener/drafts"
          className="flex flex-col gap-1 rounded-[var(--radius-2xl)] border border-grey-100 bg-white px-5 py-4 shadow-[var(--shadow-light-bg)] hover:bg-grey-50 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
        >
          <span className="text-sm leading-[18px] font-bold text-black">
            {unitJobLabel(ctx.ctxUnit)}
          </span>
          <span className="text-xs leading-4 text-grey-500">
            {screenerCopy.historyRow} ·{" "}
            {progressLabel(pack.attachedRequired, pack.requiredCount)}
          </span>
        </Link>
      ) : (
        <section className="rounded-[var(--radius-2xl)] border border-grey-100 bg-white p-5 shadow-[var(--shadow-light-bg)]">
          <p className="text-sm leading-[18px] text-grey-700">
            {screenerCopy.historyEmpty}
          </p>
        </section>
      )}
    </ScreenerShell>
  );
}
