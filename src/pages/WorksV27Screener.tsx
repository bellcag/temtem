import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Role } from "@/lib/app-state";
import type { Unit } from "@/lib/tenancy-data";
import { publicUrl } from "@/lib/public-url";
import { cn } from "@/lib/utils";
import type { V26ChecklistDoc, V26Work } from "@/lib/process-v26-works";
import { v26WorkListTitle } from "@/lib/process-v26-works";
import {
  attachV27Doc,
  docAttachKey,
  readV27Attachments,
  readV27Screen,
  removeV27Doc,
  v27DecideResult,
  writeV27Screen,
  V27_APPLY_STEPS,
  V27_SCREEN_EVENT,
  type V27ApplyStep,
  type V27Attachment,
  type V27ScreenState,
} from "@/lib/process-v27-screener";
import closeIcon from "@/assets/figma/x-close.svg";
import helpIcon from "@/assets/figma/help-questions.svg";
import pdfIcon from "@/assets/figma/pdf.svg";

const HOW_STEPS = [
  {
    title: "View document checklist",
    body: "See which documents this pack needs, with samples to guide you.",
  },
  {
    title: "Upload documents and screen",
    body: "Upload the completed files and let the system check them against the requirements.",
  },
  {
    title: "Fix errors and re-screen",
    body: "If issues are found, make the suggested changes and upload again for another check.",
  },
  {
    title: "Download and submit",
    body: "Download the results summary and screened documents, then submit them in OneCalendar.",
  },
];

const PRIMARY =
  "inline-flex h-10 w-fit items-center justify-center rounded-[var(--radius-sm)] bg-purple-600 px-[var(--spacing-16)] text-sm leading-[18px] font-bold text-white hover:bg-purple-700 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]";
const GHOST =
  "inline-flex h-10 w-fit items-center justify-center rounded-[var(--radius-sm)] border border-purple-600 bg-white px-[var(--spacing-16)] text-sm leading-[18px] font-bold text-purple-600 hover:bg-purple-100 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]";
const TEXT_BTN =
  "text-sm leading-[18px] font-bold text-purple-600 hover:text-purple-700 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]";

function samplePdf(docName: string) {
  const lower = docName.toLowerCase();
  if (lower.includes("hot") || lower.includes("fire")) return publicUrl("/docs/doc-fire.pdf");
  if (lower.includes("method")) return publicUrl("/docs/doc-method.pdf");
  if (lower.includes("design")) return publicUrl("/docs/doc-design.pdf");
  return publicUrl("/docs/sample.pdf");
}

export function WorksV27Screener({
  work,
  unit,
  role,
  docs,
  step,
  onStep,
  onBackToPack,
}: {
  work: V26Work;
  unit: Unit;
  role: Role;
  docs: V26ChecklistDoc[];
  step: V27ApplyStep;
  onStep: (step: V27ApplyStep) => void;
  onBackToPack: () => void;
}) {
  const [help, setHelp] = useState(false);
  const [sample, setSample] = useState<V26ChecklistDoc | null>(null);
  const [attachments, setAttachments] = useState<Record<string, V27Attachment>>(
    {},
  );
  const [screen, setScreen] = useState<V27ScreenState>({
    result: "idle",
    runs: 0,
  });

  useEffect(() => {
    const refresh = () => {
      setAttachments(readV27Attachments(unit.id, work.id));
      setScreen(readV27Screen(unit.id, work.id));
    };
    refresh();
    window.addEventListener(V27_SCREEN_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(V27_SCREEN_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [unit.id, work.id]);

  const required = docs.filter((row) => row.need === "Required");
  const attachedRequired = required.filter(
    (row) => attachments[docAttachKey(row.permitName, row.doc.name)],
  ).length;

  useEffect(() => {
    if (step !== "screen") return;
    if (screen.result === "pass" || screen.result === "issues") {
      onStep("results");
      return;
    }
    writeV27Screen(unit.id, work.id, { ...screen, result: "running" });
    const wait = window.setTimeout(() => {
      const nextRuns = screen.runs;
      const result = v27DecideResult({
        workId: work.id,
        attached: Object.keys(readV27Attachments(unit.id, work.id)).length,
        runs: nextRuns,
      });
      writeV27Screen(unit.id, work.id, {
        result,
        runs: nextRuns + 1,
      });
      onStep("results");
    }, 2200);
    return () => window.clearTimeout(wait);
    // screen.result/runs intentionally from first paint of this step
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, unit.id, work.id]);

  const canAttach = role === "contractor" || role === "officer";
  const groups = useMemo(() => {
    const map = new Map<string, V26ChecklistDoc[]>();
    for (const row of docs) {
      const list = map.get(row.permitName) ?? [];
      list.push(row);
      map.set(row.permitName, list);
    }
    return [...map.entries()];
  }, [docs]);

  const goNext = () => {
    if (step === "checklist") onStep("upload");
    else if (step === "upload") onStep("screen");
    else if (step === "screen") onStep("results");
  };

  const goPrev = () => {
    if (step === "upload") onStep("checklist");
    else if (step === "screen" || step === "results") onStep("upload");
  };

  const nextAction =
    step === "checklist" ? (
      <button type="button" onClick={goNext} className={PRIMARY}>
        Next
      </button>
    ) : step === "upload" ? (
      <button type="button" onClick={goNext} className={PRIMARY}>
        Screen documents
      </button>
    ) : step === "results" && screen.result === "issues" ? (
      <button
        type="button"
        onClick={() => {
          writeV27Screen(unit.id, work.id, {
            result: "idle",
            runs: screen.runs,
          });
          onStep("screen");
        }}
        className={PRIMARY}
      >
        Re-screen all documents
      </button>
    ) : step === "results" && screen.result === "pass" ? (
      <a
        href="https://onecalendar.changiairport.com"
        target="_blank"
        rel="noreferrer"
        className={PRIMARY}
      >
        Submit in OneCalendar
      </a>
    ) : step === "results" && screen.result === "error" ? (
      <button
        type="button"
        onClick={() => onStep("upload")}
        className={PRIMARY}
      >
        Back to upload
      </button>
    ) : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={onBackToPack} className={TEXT_BTN}>
          Back to pack
        </button>
        <button
          type="button"
          onClick={() => setHelp(true)}
          className="inline-flex items-center gap-2 text-sm leading-[18px] font-bold text-purple-600 hover:text-purple-700"
        >
          <img src={helpIcon} alt="" width={20} height={20} />
          How this works
        </button>
      </div>

      <ApplyStepper step={step} />

      {step === "checklist" ? (
        <ChecklistPane
          groups={groups}
          onSample={setSample}
        />
      ) : null}
      {step === "upload" ? (
        <UploadPane
          groups={groups}
          attachments={attachments}
          canAttach={canAttach}
          onSample={setSample}
          onAttach={(permit, name, file) =>
            attachV27Doc(unit.id, work.id, permit, name, file)
          }
          onRemove={(permit, name) =>
            removeV27Doc(unit.id, work.id, permit, name)
          }
        />
      ) : null}
      {step === "screen" ? <ScreeningPane /> : null}
      {step === "results" ? (
        <ResultsPane
          work={work}
          unit={unit}
          groups={groups}
          attachments={attachments}
          screen={screen}
          onSample={setSample}
          onRescreen={() => {
            writeV27Screen(unit.id, work.id, {
              result: "idle",
              runs: screen.runs,
            });
            onStep("screen");
          }}
        />
      ) : null}

      {step !== "screen" ? (
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-grey-100 pt-4">
          {step === "checklist" ? (
            <span />
          ) : (
            <button type="button" onClick={goPrev} className={GHOST}>
              Previous
            </button>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs leading-4 text-grey-400">
              {attachedRequired} of {required.length} required · Draft on this
              work
            </p>
            {nextAction}
          </div>
        </footer>
      ) : null}

      {help ? <HowItWorks onClose={() => setHelp(false)} /> : null}
      {sample ? (
        <SamplesModal doc={sample} onClose={() => setSample(null)} />
      ) : null}
    </div>
  );
}

function ApplyStepper({ step }: { step: V27ApplyStep }) {
  const index = V27_APPLY_STEPS.findIndex((row) => row.id === step);
  return (
    <ol className="flex flex-wrap gap-x-4 gap-y-2 border-b border-grey-100 pb-3">
      {V27_APPLY_STEPS.map((row, i) => {
        const done = i < index;
        const on = row.id === step;
        return (
          <li
            key={row.id}
            className={cn(
              "flex items-center gap-2 text-sm leading-[18px]",
              on
                ? "font-bold text-purple-600"
                : done
                  ? "text-grey-700"
                  : "text-grey-400",
            )}
          >
            <span
              className={cn(
                "grid size-5 place-items-center rounded-full text-xs leading-4 font-bold",
                on
                  ? "bg-purple-600 text-white"
                  : done
                    ? "bg-purple-100 text-purple-700"
                    : "bg-grey-75 text-grey-400",
              )}
            >
              {i + 1}
            </span>
            {row.label}
          </li>
        );
      })}
    </ol>
  );
}

function ChecklistPane({
  groups,
  onSample,
}: {
  groups: [string, V26ChecklistDoc[]][];
  onSample: (doc: V26ChecklistDoc) => void;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg leading-[22px] font-bold text-black">
          Document checklist
        </h2>
        <p className="mt-1 text-sm leading-[18px] text-grey-500">
          Based on this work’s answers. Open a sample before you prepare the
          file.
        </p>
      </div>
      <ol className="overflow-hidden rounded-[var(--radius-2xl)] bg-white shadow-[var(--shadow-light-bg)]">
        {groups.map(([permit, rows], index) => (
          <ChecklistPermit
            key={permit}
            index={index + 1}
            permit={permit}
            rows={rows}
            onSample={onSample}
            defaultOpen={index === 0}
          />
        ))}
      </ol>
    </section>
  );
}

function ChecklistPermit({
  index,
  permit,
  rows,
  onSample,
  defaultOpen,
}: {
  index: number;
  permit: string;
  rows: V26ChecklistDoc[];
  onSample: (doc: V26ChecklistDoc) => void;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <li className="border-t border-grey-100 first:border-t-0">
      <div className="flex items-start justify-between gap-3 px-4 py-4 tablet:px-6">
        <div className="min-w-0">
          <p className="text-sm leading-[18px] font-bold text-black">
            {index}. {permit}
          </p>
          <p className="mt-1 text-xs leading-4 text-grey-500">
            {rows.length} {rows.length === 1 ? "file" : "files"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onSample(rows[0])}
          className={TEXT_BTN}
        >
          Samples
        </button>
      </div>
      <div className="px-4 pb-4 tablet:px-6">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="text-sm leading-[18px] font-bold text-purple-600"
        >
          {open ? "Hide requirements" : "Show requirements"}
        </button>
        {open ? (
          <ul className="mt-3 flex flex-col gap-3">
            {rows.map((row) => (
              <li key={`${row.permitName}-${row.doc.name}`}>
                <p className="text-sm leading-[18px] font-bold text-black">
                  {row.doc.name}
                </p>
                <p className="mt-1 text-xs leading-4 text-grey-500">
                  {row.need} · {row.who}
                </p>
                {row.doc.sources[0] ? (
                  <p className="mt-1 text-xs leading-4 text-grey-400">
                    {row.doc.sources[0]}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </li>
  );
}

function UploadPane({
  groups,
  attachments,
  canAttach,
  onSample,
  onAttach,
  onRemove,
}: {
  groups: [string, V26ChecklistDoc[]][];
  attachments: Record<string, V27Attachment>;
  canAttach: boolean;
  onSample: (doc: V26ChecklistDoc) => void;
  onAttach: (permit: string, name: string, fileName: string) => void;
  onRemove: (permit: string, name: string) => void;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg leading-[22px] font-bold text-black">
          Upload documents
        </h2>
        <p className="mt-1 text-sm leading-[18px] text-grey-500">
          Attach files for this work. Screening stays on this pack — it is not
          a separate module.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        {groups.flatMap(([, rows]) =>
          rows.map((row) => {
            const key = docAttachKey(row.permitName, row.doc.name);
            const file = attachments[key];
            return (
              <UploadCard
                key={key}
                row={row}
                file={file}
                canAttach={canAttach}
                onSample={() => onSample(row)}
                onAttach={(name) =>
                  onAttach(row.permitName, row.doc.name, name)
                }
                onRemove={() => onRemove(row.permitName, row.doc.name)}
              />
            );
          }),
        )}
      </div>
    </section>
  );
}

function UploadCard({
  row,
  file,
  canAttach,
  onSample,
  onAttach,
  onRemove,
}: {
  row: V26ChecklistDoc;
  file?: V27Attachment;
  canAttach: boolean;
  onSample: () => void;
  onAttach: (fileName: string) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(!file);
  return (
    <article className="rounded-[var(--radius-2xl)] bg-white shadow-[var(--shadow-light-bg)]">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-4 text-left tablet:px-6"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-sm leading-[18px] font-bold text-black">
            {row.doc.name}
          </span>
          <span className="mt-1 block text-xs leading-4 text-grey-500">
            {row.permitName}
          </span>
        </span>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-xs leading-4 font-bold",
            file
              ? "bg-green-100 text-green-700"
              : "bg-red-50 text-red-700",
          )}
        >
          {file ? "Uploaded" : "Not uploaded yet"}
        </span>
      </button>
      {open ? (
        <div className="flex flex-col gap-3 border-t border-grey-100 px-4 py-4 tablet:px-6">
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs leading-4 text-grey-500">
              {row.need} · {row.who}
            </p>
            <button type="button" onClick={onSample} className={TEXT_BTN}>
              Samples
            </button>
          </div>
          {canAttach ? (
            <label className="flex cursor-pointer flex-col items-center gap-1 rounded-[var(--radius-md)] border border-dashed border-grey-200 bg-grey-25 px-4 py-6 text-center">
              <input
                ref={inputRef}
                type="file"
                className="sr-only"
                aria-label={`Upload ${row.doc.name}`}
                onChange={(e) => {
                  const next = e.target.files?.[0];
                  if (next) onAttach(next.name);
                  e.target.value = "";
                }}
              />
              <span className="text-sm leading-[18px] font-bold text-purple-600">
                Click to upload or drag and drop
              </span>
              <span className="text-xs leading-4 text-grey-400">
                Size limit 25 MB · PDF, DOCX, XLSX, PNG, JPG
              </span>
            </label>
          ) : (
            <p className="text-sm leading-[18px] text-grey-600">
              Your contractor uploads these files.
            </p>
          )}
          {file ? (
            <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-grey-100 px-3 py-3">
              <img src={pdfIcon} alt="" width={20} height={20} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm leading-[18px] text-black">
                  {file.fileName}
                </p>
                <p className="text-xs leading-4 text-green-700">
                  Upload complete
                </p>
              </div>
              {canAttach ? (
                <button
                  type="button"
                  onClick={onRemove}
                  className={TEXT_BTN}
                >
                  Remove
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function ScreeningPane() {
  return (
    <section className="flex flex-col items-center gap-4 rounded-[var(--radius-2xl)] bg-white px-6 py-16 text-center shadow-[var(--shadow-light-bg)]">
      <p className="text-lg leading-[22px] font-bold text-black">
        Screening your documents
      </p>
      <p className="max-w-sm text-sm leading-[18px] text-grey-500">
        This usually takes 1–3 minutes. You can leave and come back — progress
        stays on this work as a draft.
      </p>
    </section>
  );
}

function ResultsPane({
  work,
  unit,
  groups,
  attachments,
  screen,
  onSample,
  onRescreen,
}: {
  work: V26Work;
  unit: Unit;
  groups: [string, V26ChecklistDoc[]][];
  attachments: Record<string, V27Attachment>;
  screen: V27ScreenState;
  onSample: (doc: V26ChecklistDoc) => void;
  onRescreen: () => void;
}) {
  if (screen.result === "error") {
    return (
      <section className="flex flex-col items-center gap-3 rounded-[var(--radius-2xl)] bg-white px-6 py-16 text-center shadow-[var(--shadow-light-bg)]">
        <h2 className="text-lg leading-[22px] font-bold text-black">
          Hmm, something went wrong.
        </h2>
        <p className="max-w-sm text-sm leading-[18px] text-grey-500">
          We could not extract the documents thoroughly. Upload at least one
          file, then try again.
        </p>
      </section>
    );
  }

  const passed = screen.result === "pass";
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg leading-[22px] font-bold text-black">
          Results summary
        </h2>
        <p className="mt-1 text-sm leading-[18px] text-grey-500">
          These outputs are AI-generated and may contain errors. Please
          double-check them.
        </p>
      </div>
      <div
        className={cn(
          "rounded-[var(--radius-2xl)] px-4 py-4 tablet:px-6",
          passed ? "bg-green-50" : "bg-amber-50",
        )}
      >
        <p className="text-sm leading-[18px] font-bold text-black">
          {passed
            ? "Ready for submission in OneCalendar"
            : "Some issues found"}
        </p>
        <p className="mt-1 text-sm leading-[18px] text-grey-700">
          {passed
            ? "Your documents have passed all checks. Save the summary and documents for submission in OneCalendar."
            : "Review all issues and upload your revised documents. All documents will be re-screened."}
        </p>
      </div>
      {passed ? (
        <div className="rounded-[var(--radius-2xl)] bg-white p-4 shadow-[var(--shadow-light-bg)] tablet:p-6">
          <p className="text-xs leading-4 font-bold uppercase tracking-[0.08em] text-grey-400">
            Application details
          </p>
          <dl className="mt-3 grid gap-3 text-sm leading-[18px]">
            <div>
              <dt className="text-grey-500">Work</dt>
              <dd className="font-bold text-black">{v26WorkListTitle(work)}</dd>
            </div>
            <div>
              <dt className="text-grey-500">Unit</dt>
              <dd className="font-bold text-black">{unit.unitNo}</dd>
            </div>
            <div>
              <dt className="text-grey-500">Documents screened</dt>
              <dd className="font-bold text-black">
                {Object.keys(attachments).length === 1
                  ? "1 file"
                  : `${Object.keys(attachments).length} files`}
              </dd>
            </div>
          </dl>
        </div>
      ) : null}
      <div className="flex flex-col gap-3">
        {groups.map(([permit, rows]) => (
          <ResultCard
            key={permit}
            permit={permit}
            rows={rows}
            attachments={attachments}
            passed={passed}
            onSample={onSample}
          />
        ))}
      </div>
      {passed ? (
        <div className="rounded-[var(--radius-2xl)] bg-white p-4 shadow-[var(--shadow-light-bg)] tablet:p-6">
          <h3 className="text-sm leading-[18px] font-bold text-black">
            Next steps
          </h3>
          <p className="mt-2 rounded-[var(--radius-md)] bg-amber-50 px-3 py-3 text-sm leading-[18px] text-grey-700">
            This is only a preliminary screening. You still need to submit your
            permit application in OneCalendar.
          </p>
          <ol className="mt-4 flex flex-col gap-3 text-sm leading-[18px] text-grey-700">
            <li>1. Download results summary for approvers in OneCalendar.</li>
            <li>2. Download a ZIP of all checked documents.</li>
            <li>3. Submit the documents and summary in OneCalendar.</li>
          </ol>
        </div>
      ) : (
        <button type="button" onClick={onRescreen} className={GHOST}>
          Re-screen after you upload fixes
        </button>
      )}
    </section>
  );
}

function ResultCard({
  permit,
  rows,
  attachments,
  passed,
  onSample,
}: {
  permit: string;
  rows: V26ChecklistDoc[];
  attachments: Record<string, V27Attachment>;
  passed: boolean;
  onSample: (doc: V26ChecklistDoc) => void;
}) {
  const [open, setOpen] = useState(!passed);
  const missing = rows.filter(
    (row) => !attachments[docAttachKey(row.permitName, row.doc.name)],
  );
  const status = passed
    ? "Passed"
    : missing.length > 0
      ? "Issues found"
      : "Passed";
  return (
    <article className="rounded-[var(--radius-2xl)] bg-white shadow-[var(--shadow-light-bg)]">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-4 text-left tablet:px-6"
      >
        <span className="min-w-0 flex-1 text-sm leading-[18px] font-bold text-black">
          {permit}
        </span>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-xs leading-4 font-bold",
            status === "Passed"
              ? "bg-green-100 text-green-700"
              : "bg-red-50 text-red-700",
          )}
        >
          {status}
        </span>
      </button>
      {open ? (
        <div className="flex flex-col gap-3 border-t border-grey-100 px-4 py-4 tablet:px-6">
          {passed || missing.length === 0 ? (
            <p className="text-sm leading-[18px] text-grey-700">
              All checks passed.
            </p>
          ) : (
            missing.map((row) => (
              <div key={row.doc.name} className="flex flex-col gap-1">
                <p className="text-sm leading-[18px] font-bold text-black">
                  {row.doc.name} missing
                </p>
                <p className="text-xs leading-4 text-grey-500">
                  What to do: upload this file, then re-screen the whole pack.
                </p>
              </div>
            ))
          )}
          <button type="button" onClick={() => onSample(rows[0])} className={TEXT_BTN}>
            Samples
          </button>
        </div>
      ) : null}
    </article>
  );
}

function HowItWorks({ onClose }: { onClose: () => void }) {
  const titleId = useId();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end tablet:items-center tablet:justify-center tablet:p-8">
      <button
        type="button"
        aria-label="Close how this works"
        className="absolute inset-0 bg-[rgba(18,18,18,0.4)]"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-md rounded-t-[var(--radius-2xl)] bg-white p-5 shadow-[var(--shadow-light-bg)] tablet:rounded-[var(--radius-2xl)]"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id={titleId} className="text-lg leading-[22px] font-bold text-black">
            How does this work?
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="grid size-10 place-items-center"
          >
            <img src={closeIcon} alt="" width={20} height={20} />
          </button>
        </div>
        <p className="mt-2 text-sm leading-[18px] text-grey-500">
          Answers on this work already tailored the pack. Screening starts from
          the checklist.
        </p>
        <ol className="mt-5 flex flex-col gap-4">
          {HOW_STEPS.map((row, i) => (
            <li key={row.title} className="flex gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-grey-50 text-sm font-bold text-grey-700">
                {i + 1}
              </span>
              <span>
                <span className="block text-sm leading-[18px] font-bold text-black">
                  {row.title}
                </span>
                <span className="mt-1 block text-sm leading-[18px] text-grey-500">
                  {row.body}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </aside>
    </div>,
    document.body,
  );
}

function SamplesModal({
  doc,
  onClose,
}: {
  doc: V26ChecklistDoc;
  onClose: () => void;
}) {
  const titleId = useId();
  const [kind, setKind] = useState<"good" | "bad">("good");
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end tablet:items-center tablet:justify-center tablet:p-8">
      <button
        type="button"
        aria-label="Close samples"
        className="absolute inset-0 bg-[rgba(18,18,18,0.4)]"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex h-[90vh] w-full max-w-3xl flex-col rounded-t-[var(--radius-2xl)] bg-white shadow-[var(--shadow-light-bg)] tablet:h-[80vh] tablet:rounded-[var(--radius-2xl)]"
      >
        <header className="flex items-center justify-between gap-3 border-b border-grey-75 px-4 py-3 tablet:px-5">
          <h2 id={titleId} className="min-w-0 truncate text-base leading-5 font-bold text-black">
            {doc.doc.name} — Samples
          </h2>
          <div className="flex items-center gap-2">
            <div className="flex rounded-full bg-grey-50 p-1">
              {(["good", "bad"] as const).map((row) => (
                <button
                  key={row}
                  type="button"
                  onClick={() => setKind(row)}
                  className={cn(
                    "h-8 rounded-full px-3 text-sm leading-[18px]",
                    kind === row
                      ? "bg-white font-bold text-purple-600 shadow-[var(--shadow-light-bg)]"
                      : "text-grey-500",
                  )}
                >
                  {row === "good" ? "Good" : "Bad"}
                </button>
              ))}
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="grid size-10 place-items-center"
            >
              <img src={closeIcon} alt="" width={20} height={20} />
            </button>
          </div>
        </header>
        <p className="border-b border-grey-75 px-4 py-2 text-xs leading-4 text-grey-500 tablet:px-5">
          {kind === "good"
            ? "Complete example for this document type."
            : "Common gaps reviewers send back — missing stamps, dates, or pages."}
        </p>
        <iframe
          title={`${doc.doc.name} sample`}
          src={`${samplePdf(doc.doc.name)}#view=FitH`}
          className="min-h-0 flex-1 bg-grey-50"
        />
      </aside>
    </div>,
    document.body,
  );
}

