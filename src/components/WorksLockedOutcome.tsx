import { useEffect, useId, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import caretDown from "@/assets/figma/caret-down.svg";
import closeIcon from "@/assets/figma/x-close.svg";
import type { Role } from "@/lib/app-state";
import { permitExplainFor } from "@/lib/process-permit-explain";
import {
  needLabelCompact,
  supplierLine,
  supportingDocsFor,
} from "@/lib/process-permit-supporting-docs";
import { PTW_PACK_TITLE, PTW_PACK_TYPES_LABEL } from "@/lib/process-ptw-pack";
import type { WorksOutcomeStep } from "@/lib/process-works-jobs";
import {
  governingSlaForPermits,
  slaForWorksItem,
  type WorksSla,
} from "@/lib/process-works-sla";
import { worksStepGuideFor } from "@/lib/process-works-step-guide";
import type { Unit } from "@/lib/tenancy-data";
import { cn } from "@/lib/utils";

function NumberMark({ n }: { n: number }) {
  return (
    <p
      className="relative z-[1] grid size-6 shrink-0 place-items-center rounded-full bg-purple-100 text-xs leading-4 font-bold text-purple-600 ring-2 ring-white"
      aria-hidden
    >
      {n}
    </p>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs leading-4 font-bold uppercase tracking-[0.08em] text-grey-400">
        {label}
      </p>
      {children}
    </div>
  );
}

function StatusChip({
  children,
  tone = "neutral",
}: {
  children: string;
  tone?: "neutral" | "sla";
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 w-fit shrink-0 items-center rounded-full px-2 text-xs leading-4 font-bold whitespace-nowrap",
        tone === "sla"
          ? "border border-blue-600 bg-blue-100 text-blue-600"
          : "border border-grey-200 bg-grey-25 text-grey-700",
      )}
    >
      {children}
    </span>
  );
}

function Caret() {
  return (
    <img
      src={caretDown}
      alt=""
      width={10}
      height={6}
      className="mt-2 shrink-0 -rotate-90"
    />
  );
}

function StepDetailSheet({
  open,
  title,
  titleId,
  onClose,
  onBack,
  children,
}: {
  open: boolean;
  title: string;
  titleId: string;
  onClose: () => void;
  onBack?: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (onBack) onBack();
      else onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose, onBack]);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end tablet:items-center tablet:justify-center tablet:p-8">
      <button
        type="button"
        aria-label={`Close ${title}`}
        className="absolute inset-0 bg-[rgba(18,18,18,0.4)]"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "relative flex w-full flex-col bg-white shadow-[var(--shadow-light-bg)]",
          "max-h-[90vh] rounded-t-[var(--radius-2xl)] border-t border-grey-100",
          "tablet:max-h-[80vh] tablet:max-w-xl tablet:rounded-[var(--radius-2xl)] tablet:border-0",
        )}
      >
        <header className="flex items-start justify-between gap-2 border-b border-grey-75 px-4 py-4 tablet:px-5">
          <div className="flex min-w-0 flex-1 items-start gap-2">
            {onBack && (
              <button
                type="button"
                aria-label="Back"
                onClick={onBack}
                className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-sm)] text-black hover:bg-grey-50 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
              >
                <img
                  src={caretDown}
                  alt=""
                  width={10}
                  height={6}
                  className="rotate-90"
                />
              </button>
            )}
            <h2
              id={titleId}
              className="min-w-0 flex-1 pt-2 text-lg leading-[22px] font-bold text-black"
            >
              {title}
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-sm)] text-black hover:bg-grey-50 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
          >
            <img src={closeIcon} alt="" width={20} height={20} />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 tablet:px-5">
          {children}
        </div>
      </aside>
    </div>,
    document.body,
  );
}

function PermitPack({
  name,
  role,
  unit,
  sla,
}: {
  name: string;
  role: Role;
  unit: Unit;
  sla: WorksSla[];
}) {
  const explain = permitExplainFor(name);
  const supporting = supportingDocsFor(name);
  return (
    <div className="flex flex-col gap-4">
      {sla.length > 0 && (
        <Field label="Apply by">
          {sla.map((item) => (
            <p key={item.label} className="text-sm leading-[18px] text-grey-700">
              {item.title}
            </p>
          ))}
        </Field>
      )}
      {explain && (
        <div className="flex flex-col gap-3">
          <Field label="What this is">
            <p className="text-sm leading-[18px] text-grey-700">{explain.what}</p>
          </Field>
          {explain.why(unit) ? (
            <Field label="For this unit">
              <p className="text-sm leading-[18px] text-grey-700">
                {explain.why(unit)}
              </p>
            </Field>
          ) : null}
          <Field label="Who applies">
            <p className="text-sm leading-[18px] text-grey-700">
              {explain.who[role]}
            </p>
          </Field>
        </div>
      )}
      {supporting.docs.length > 0 ? (
      <div className="flex flex-col gap-2">
        <p className="text-xs leading-4 font-bold uppercase tracking-[0.08em] text-grey-400">
          Documents to attach · {supporting.docs.length}
        </p>
        {supporting.ifmNote ? (
          <p className="text-sm leading-[18px] text-grey-700">
            {supporting.ifmNote}
          </p>
        ) : null}
        <ul className="flex flex-col gap-3">
            {supporting.docs.map((doc) => (
              <li key={doc.name} className="flex flex-col gap-0.5">
                <p className="text-sm leading-[18px] font-bold text-black">
                  {doc.name}
                  <span className="ml-1.5 font-bold text-grey-500">
                    · {needLabelCompact(doc.need)}
                  </span>
                </p>
                <p className="text-sm leading-[18px] text-grey-600">
                  {supplierLine(doc.supplier, role)}
                </p>
              </li>
            ))}
        </ul>
      </div>
      ) : null}
    </div>
  );
}

function StepRow({
  n,
  title,
  chips,
  children,
}: {
  n: number;
  title: string;
  chips: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  return (
    <li>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-grey-25 focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--color-purple-600)] tablet:px-6"
      >
        <NumberMark n={n} />
        <span className="min-w-0 flex-1">
          <span className="block text-base leading-5 font-bold text-black">
            {title}
          </span>
          {chips}
        </span>
        <Caret />
      </button>
      <StepDetailSheet
        open={open}
        title={title}
        titleId={titleId}
        onClose={() => setOpen(false)}
      >
        {children}
      </StepDetailSheet>
    </li>
  );
}

const PACK_WHO: Record<Role, string> = {
  tenant:
    "Your contractor submits these types as one Permit to Work. You stay the Applicant.",
  contractor:
    "You submit every type below as one Permit to Work in OneCalendar.",
  officer:
    "The contractor submits these types as one Permit to Work. You check the pack.",
};

const PACK_HOW: Record<Role, string> = {
  tenant:
    "Your contractor prepares the files in Application Screener, then submits once in OneCalendar. You do not file each type separately.",
  contractor:
    "Upload documents in Application Screener first, then submit all remaining types together in OneCalendar. Do not file them as separate applications.",
  officer:
    "Check they bundled the types into one OneCalendar application. You do not fill OneCalendar for them.",
};

function OneCalendarStep({
  n,
  permits,
  role,
  unit,
}: {
  n: number;
  permits: string[];
  role: Role;
  unit: Unit;
}) {
  const [open, setOpen] = useState(false);
  const [drill, setDrill] = useState<string | null>(null);
  const titleId = useId();
  const packSla = governingSlaForPermits(permits, unit, role);
  const typeLabel =
    permits.length === 1 ? "1 permit type" : `${permits.length} permit types`;
  const close = () => {
    setDrill(null);
    setOpen(false);
  };
  const drillSla = drill ? slaForWorksItem(drill, unit, role) : [];

  return (
    <li>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-grey-25 focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--color-purple-600)] tablet:px-6"
      >
        <NumberMark n={n} />
        <span className="min-w-0 flex-1">
          <span className="block text-base leading-5 font-bold text-black">
            {PTW_PACK_TITLE}
          </span>
          <span className="mt-2 flex flex-wrap gap-1.5">
            <StatusChip>{typeLabel}</StatusChip>
            {packSla && <StatusChip tone="sla">{packSla.label}</StatusChip>}
          </span>
        </span>
        <Caret />
      </button>
      <StepDetailSheet
        open={open}
        title={drill ?? PTW_PACK_TITLE}
        titleId={titleId}
        onClose={close}
        onBack={drill ? () => setDrill(null) : undefined}
      >
        {drill ? (
          <PermitPack name={drill} role={role} unit={unit} sla={drillSla} />
        ) : (
          <div className="flex flex-col gap-4">
            <Field label="Who does this">
              <p className="text-sm leading-[18px] text-grey-700">
                {PACK_WHO[role]}
              </p>
            </Field>
            <Field label="How">
              <p className="text-sm leading-[18px] text-grey-700">
                {PACK_HOW[role]}
              </p>
            </Field>
            <div className="flex flex-col gap-2">
              <p className="text-xs leading-4 font-bold uppercase tracking-[0.08em] text-grey-400">
                {PTW_PACK_TYPES_LABEL}
              </p>
              <ol className="overflow-hidden rounded-[var(--radius-md)] border border-grey-100">
                {permits.map((name, i) => {
                  const sla = slaForWorksItem(name, unit, role);
                  return (
                    <li key={name} className="border-t border-grey-100 first:border-t-0">
                      <button
                        type="button"
                        onClick={() => setDrill(name)}
                        className="flex w-full items-start gap-3 px-3 py-3 text-left hover:bg-grey-25 focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--color-purple-600)]"
                      >
                        <NumberMark n={i + 1} />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm leading-[18px] font-bold text-black">
                            {name}
                          </span>
                          {(i === 0 || sla.length > 0) && (
                            <span className="mt-1.5 flex flex-wrap gap-1.5">
                              {sla.map((item) => (
                                <StatusChip key={item.label} tone="sla">
                                  {item.label}
                                </StatusChip>
                              ))}
                              {i === 0 && <StatusChip>Always needed</StatusChip>}
                            </span>
                          )}
                        </span>
                        <Caret />
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>
            <Link
              to="/screener/drafts"
              className="inline-flex h-8 w-fit items-center justify-center rounded-[var(--radius-sm)] border border-purple-600 bg-white px-3 text-sm leading-[18px] font-bold text-purple-600 hover:bg-purple-100 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
            >
              {role === "tenant"
                ? "Read Application Screener"
                : "Open Application Screener"}
            </Link>
          </div>
        )}
      </StepDetailSheet>
    </li>
  );
}

function ExtraStepRow({
  n,
  step,
  role,
  unit,
}: {
  n: number;
  step: WorksOutcomeStep;
  role: Role;
  unit: Unit;
}) {
  const sla = slaForWorksItem(step.name, unit, role);
  const guide = worksStepGuideFor(step.name, role, step.because, unit);
  return (
    <StepRow
      n={n}
      title={step.name}
      chips={
        sla.length > 0 && (
          <span className="mt-2 flex flex-wrap gap-1.5">
            {sla.map((item) => (
              <StatusChip key={item.label} tone="sla">
                {item.label}
              </StatusChip>
            ))}
          </span>
        )
      }
    >
      <div className="flex flex-col gap-4">
        {guide ? (
          <>
            <Field label="Who does this">
              <p className="text-sm leading-[18px] text-grey-700">{guide.who}</p>
            </Field>
            <Field label="How">
              <div className="flex flex-col gap-2">
                {guide.how.map((line) => (
                  <p key={line} className="text-sm leading-[18px] text-grey-700">
                    {line}
                  </p>
                ))}
              </div>
            </Field>
          </>
        ) : (
          <p className="text-sm leading-[18px] text-grey-700">{step.lead}</p>
        )}
        {step.because.length > 0 && (
          <Field label="Because you agreed">
            <div className="flex flex-wrap gap-2">
              {step.because.map((label) => (
                <span
                  key={label}
                  className={cn(
                    "inline-flex min-h-6 items-center rounded-[var(--radius-sm)]",
                    "border border-grey-200 bg-white px-1.5 py-1",
                    "text-xs leading-4 font-bold text-grey-700",
                  )}
                >
                  {label}
                </span>
              ))}
            </div>
          </Field>
        )}
      </div>
    </StepRow>
  );
}

export function WorksLockedOutcome({
  permits,
  steps,
  role,
  unit,
}: {
  permits: string[];
  steps: WorksOutcomeStep[];
  role: Role;
  unit: Unit;
}) {
  const hasPack = permits.length > 0;
  const count = (hasPack ? 1 : 0) + steps.length;
  if (count === 0) return null;
  const countLine =
    count === 1
      ? "1 step follows from the locked list"
      : `${count} steps follow from the locked list`;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <h2 className="text-lg leading-[22px] font-bold text-black">
          Steps from this list
        </h2>
        <p className="text-sm leading-[18px] text-grey-600">
          Permits are one OneCalendar submission. Extra site steps follow.
        </p>
      </div>

      <div className="overflow-hidden rounded-[var(--radius-2xl)] bg-white shadow-[var(--shadow-light-bg)]">
        <div className="flex items-start gap-3 px-4 py-4 tablet:px-6 tablet:py-5">
          <p
            className="grid size-10 shrink-0 place-items-center rounded-full bg-purple-100 text-sm leading-[18px] font-bold text-purple-600"
            aria-hidden
          >
            {count}
          </p>
          <div className="min-w-0 flex flex-col gap-1">
            <p className="text-base leading-5 font-bold text-black">{countLine}</p>
            <p className="text-sm leading-[18px] text-grey-600">
              Open a row for who does it, how, and what to attach.
            </p>
          </div>
        </div>

        <div className="relative border-t border-grey-100">
          <div
            aria-hidden
            className="pointer-events-none absolute top-3 bottom-3 left-7 w-px bg-grey-100 tablet:left-9"
          />
          <ol>
            {hasPack && (
              <OneCalendarStep
                n={1}
                permits={permits}
                role={role}
                unit={unit}
              />
            )}
            {steps.map((step, i) => (
              <ExtraStepRow
                key={step.name}
                n={(hasPack ? 1 : 0) + i + 1}
                step={step}
                role={role}
                unit={unit}
              />
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
