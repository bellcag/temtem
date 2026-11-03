import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, CircleCheck, CircleX, ExternalLink, RotateCw, Upload } from "lucide-react";
import checkSolidIcon from "@/assets/figma/check-solid.svg";
import checkCompleteIcon from "@/assets/figma/check-complete.svg";
import checkDuotoneIcon from "@/assets/figma/check-duotone.svg";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import type { Role } from "@/lib/app-state";
import { isV34Path, usesV37Cut, usesV35Flow } from "@/lib/process-v31-preview";
import { SheetFrame } from "@/components/dls/SheetFrame";
import { SampleModalHeader } from "@/components/v34/SampleModalHeader";
import { SamplePdfViewer } from "@/components/v35/SamplePdfViewer";
import { ErrorCloud } from "@/components/v35/ErrorCloud";
import type { Unit } from "@/lib/tenancy-data";
import { publicUrl } from "@/lib/public-url";
import { cn } from "@/lib/utils";
import type { V26ChecklistDoc, V26Work } from "@/lib/process-v26-works";
import { v26WorkListTitle } from "@/lib/process-v26-works";
import { downloadV31PermitZip } from "@/lib/process-v31-works";
import { v28DocumentRowMeta, v37DocumentScreen } from "@/lib/process-v28-document-row";
import {
  attachV28Doc,
  docAttachKey,
  readV28Attachments,
  v35DocumentSlots,
  v35SharedDescription,
  v35ShareChip,
  v35ShareLead,
  v35ShareLine,
  v35ShareTag,
  readV28Screen,
  removeV28Doc,
  v28DecideResult,
  v28FlaggedCount,
  V28_APPLY_PARTS,
  V28_APPLY_STEPS,
  writeV28Screen,
  readV28Submitted,
  writeV28Submitted,
  V28_SCREEN_EVENT,
  type V28ApplyStep,
  type V28Attachment,
  type V28ScreenState,
} from "@/lib/process-v28-screener";
import closeIcon from "@/assets/figma/x-close.svg";
import helpIcon from "@/assets/figma/help-questions.svg";
import pdfIcon from "@/assets/figma/pdf.svg";
import fileIcon from "@/assets/figma/file.svg";
import deleteBinIcon from "@/assets/figma/delete-bin.svg";
import sampleIcon from "@/assets/figma/documents-sample.svg";
import planeIllustration from "@/assets/figma/illustration-plane.svg";
import { PackHowItWorks } from "@/components/v31/PackHowItWorks";

const PRIMARY =
  "inline-flex h-10 w-fit items-center justify-center gap-1.5 rounded-[var(--radius-sm)] bg-purple-600 px-[var(--spacing-16)] text-sm leading-[18px] font-bold text-white hover:bg-purple-700 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]";
const GHOST =
  "inline-flex h-10 w-fit items-center justify-center gap-1.5 rounded-[var(--radius-sm)] border border-purple-600 bg-white px-[var(--spacing-16)] text-sm leading-[18px] font-bold text-purple-600 hover:bg-purple-100 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]";
const QUIET =
  "inline-flex h-10 w-fit items-center justify-center gap-1.5 rounded-[var(--radius-sm)] border border-grey-200 bg-white px-[var(--spacing-16)] text-sm leading-[18px] font-bold text-black hover:bg-grey-50 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]";
function formatSavedAt(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const time = date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const day = date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  return `${time} ${day}`;
}

const TEXT_BTN =
  "text-sm leading-[18px] font-bold text-purple-600 hover:text-purple-700 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]";

function samplePdf(docName: string) {
  const lower = docName.toLowerCase();
  if (lower.includes("hot") || lower.includes("fire")) return publicUrl("/docs/doc-fire.pdf");
  if (lower.includes("method")) return publicUrl("/docs/doc-method.pdf");
  if (lower.includes("design")) return publicUrl("/docs/doc-design.pdf");
  return publicUrl("/docs/sample.pdf");
}

export function WorksV28Screener({
  work,
  unit,
  role,
  docs,
  step,
  onStep,
  onSubmitted,
  edition = "v28",
  afterResults = null,
  onPrevFromChecklist,
  hideHelp = false,
  homeHref,
}: {
  work: V26Work;
  unit: Unit;
  role: Role;
  docs: V26ChecklistDoc[];
  step: V28ApplyStep | typeof V28_APPLY_PARTS;
  onStep: (step: V28ApplyStep | typeof V28_APPLY_PARTS) => void;
  onSubmitted: () => void;
  /** v31: only the contractor uploads, and the zip opens the checks. */
  edition?: "v28" | "v31" | "v35";
  /** v31 results: the step that follows the handoff, above the actions. */
  afterResults?: ReactNode;
  onPrevFromChecklist?: () => void;
  hideHelp?: boolean;
  homeHref?: string;
}) {
  const [help, setHelp] = useState(false);
  const [checklistSeen, setChecklistSeen] = useState(false);
  const [sample, setSample] = useState<V26ChecklistDoc | null>(null);
  const [screenRetry, setScreenRetry] = useState(0);
  const screenRetryHandled = useRef(0);
  const [attachments, setAttachments] = useState<Record<string, V28Attachment>>(
    {},
  );
  const [screen, setScreen] = useState<V28ScreenState>({
    result: "idle",
    runs: 0,
  });
  const [handedOff, setHandedOff] = useState(false);
  const v37 = usesV37Cut(useLocation().pathname);
  const [savedAt, setSavedAt] = useState(work.createdAt);

  useEffect(() => {
    const refresh = () => {
      setAttachments(readV28Attachments(unit.id, work.id));
      setScreen(readV28Screen(unit.id, work.id));
      setHandedOff(readV28Submitted(unit.id, work.id));
      setChecklistSeen(
        window.localStorage.getItem(`tempo:v28:checklist:${unit.id}:${work.id}`) === "1",
      );
    };
    refresh();
    window.addEventListener(V28_SCREEN_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(V28_SCREEN_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [unit.id, work.id]);

  const slots = edition === "v35" ? v35DocumentSlots(docs) : null;
  const requiredRows = docs.filter((row) => row.need === "Required");
  const requiredSlots = slots
    ? slots.filter((slot) => slot.rows.some((row) => row.need === "Required"))
    : [];
  const requiredCount = slots ? requiredSlots.length : requiredRows.length;
  const attachedRequired = slots
    ? requiredSlots.filter((slot) =>
        slot.rows
          .filter((row) => row.need === "Required")
          .every(
            (row) => attachments[docAttachKey(row.permitName, row.doc.name)],
          ),
      ).length
    : requiredRows.filter(
        (row) => attachments[docAttachKey(row.permitName, row.doc.name)],
      ).length;

  useEffect(() => {
    if (step !== "screen") return;
    if (screen.result === "pass" || screen.result === "issues") {
      onStep("results");
      return;
    }
    const retrying = screenRetry > screenRetryHandled.current;
    if (edition === "v35" && screen.result === "error" && !retrying) return;
    if (retrying) screenRetryHandled.current = screenRetry;
    writeV28Screen(unit.id, work.id, { ...screen, result: "running" });
    const wait = window.setTimeout(() => {
      const nextRuns = screen.runs;
      const atts = readV28Attachments(unit.id, work.id);
      const result = v28DecideResult({
        workId: work.id,
        attached: Object.keys(atts).length,
        runs: nextRuns,
        flagged: v28FlaggedCount(atts),
      });
      writeV28Screen(unit.id, work.id, {
        result,
        runs: nextRuns + 1,
      });
      if (edition === "v35" && result === "error") return;
      onStep("results");
    }, 2200);
    return () => window.clearTimeout(wait);
    // screen.result/runs intentionally from first paint of this step
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, unit.id, work.id, screenRetry]);

  const canAttach =
    edition === "v31" || edition === "v35"
      ? role === "contractor"
      : role === "contractor" || role === "officer";
  const takeZip = () => {
    const files = docs
      .map((row) => {
        const attached = attachments[docAttachKey(row.permitName, row.doc.name)];
        return attached
          ? { permit: row.permitName, fileName: attached.fileName }
          : null;
      })
      .filter((row): row is { permit: string; fileName: string } => Boolean(row));
    downloadV31PermitZip({
      unitNo: unit.unitNo,
      workTitle: v26WorkListTitle(work),
      files,
    });
  };
  const confirmHandoff = () => {
    writeV28Submitted(unit.id, work.id, true);
    onSubmitted();
  };
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
    if (step === "checklist") {
      window.localStorage.setItem(`tempo:v28:checklist:${unit.id}:${work.id}`, "1");
      setChecklistSeen(true);
      onStep("upload");
    }
    else if (step === "upload") onStep("screen");
    else if (step === "screen") onStep("results");
  };

  const goPrev = () => {
    if (step === "checklist") onPrevFromChecklist?.();
    else if (step === "upload") {
      if (v37) onPrevFromChecklist?.();
      else onStep("checklist");
    }
    else if (step === "screen" || step === "results") onStep("upload");
  };

  const nextAction =
    step === "checklist" ? (
      <button type="button" onClick={goNext} className={cn(PRIMARY, "min-w-0 flex-1 desktop:flex-none")}>
        {v37 ? (
          <>
            Next
            <ArrowRight className="size-4" aria-hidden />
          </>
        ) : (
          "Next: Upload"
        )}
      </button>
    ) : step === "upload" ? (
      <button
        type="button"
        onClick={goNext}
        disabled={requiredCount > 0 && attachedRequired < requiredCount}
        className={cn(
          PRIMARY,
          "min-w-0 flex-1 desktop:flex-none disabled:cursor-default disabled:bg-grey-200 disabled:text-grey-500",
        )}
      >
        {v37 ? (
          <>
            Screen Documents
            <ArrowRight className="size-4" aria-hidden />
          </>
        ) : (
          "Next: Screen"
        )}
      </button>
    ) : step === "results" && screen.result === "issues" ? (
      <button
        type="button"
        onClick={() => {
          writeV28Screen(unit.id, work.id, {
            result: "idle",
            runs: screen.runs,
          });
          onStep("screen");
        }}
        className={cn(PRIMARY, "min-w-0 flex-1 desktop:flex-none")}
      >
        {v37 ? "Re-screen All Documents" : "Re-screen all documents"}
      </button>
    ) : step === "results" && screen.result === "pass" && edition === "v35" ? (
      <a
        href="https://onecalendar.changiairport.com"
        target="_blank"
        rel="noreferrer"
        onClick={() => {
          writeV28Submitted(unit.id, work.id, true);
        }}
        className={cn(PRIMARY, "w-full desktop:w-auto")}
      >
        {v37 ? (
          <>
            Submit in OneCalendar
            <ExternalLink className="size-4" aria-hidden />
          </>
        ) : (
          "Open OneCalendar"
        )}
      </a>
    ) : step === "results" && screen.result === "pass" && edition === "v31" ? (
      handedOff || canAttach ? (
        <button
          type="button"
          onClick={handedOff ? onSubmitted : confirmHandoff}
          className={cn(PRIMARY, "w-full desktop:w-auto")}
        >
          {handedOff ? "Checks before opening" : "Submitted in OneCalendar"}
        </button>
      ) : null
    ) : step === "results" && screen.result === "pass" ? (
      <a
        href="https://onecalendar.changiairport.com"
        target="_blank"
        rel="noreferrer"
        onClick={() => {
          writeV28Submitted(unit.id, work.id, true);
          onSubmitted();
        }}
        className={cn(PRIMARY, "min-w-0 flex-1 desktop:flex-none")}
      >
        Submit in OneCalendar
      </a>
    ) : step === "results" && screen.result === "error" && edition !== "v35" ? (
      <button
        type="button"
        onClick={() => onStep("upload")}
        className={cn(PRIMARY, "min-w-0 flex-1 desktop:flex-none")}
      >
        Back to upload
      </button>
    ) : null;

  const partCopy: Record<V28ApplyStep, { title: string; body: string; done: boolean }> = {
    checklist: {
      title: "Checklist",
      body: "See which documents this pack needs, with samples.",
      done:
        checklistSeen ||
        attachedRequired > 0 ||
        screen.result === "pass" ||
        screen.result === "issues",
    },
    upload: {
      title: "Upload",
      body:
        requiredCount === 0
          ? "Attach the completed files for this permit."
          : `${attachedRequired} of ${requiredCount} required files attached.`,
      done: requiredCount > 0 && attachedRequired === requiredCount,
    },
    screen: {
      title: "Screen",
      body:
        screen.result === "issues"
          ? "Issues found. Fix them, then screen again."
          : screen.result === "pass"
            ? "The files passed the check."
            : "Check the files against the requirements.",
      done: screen.result === "pass" || screen.result === "issues",
    },
    results: {
      title: "Results",
      body:
        screen.result === "pass"
          ? "Download the zip for OneCalendar."
          : "Read the result after screening.",
      done: screen.result === "pass",
    },
  };
  const nowIndex = V28_APPLY_STEPS.findIndex((row) => !partCopy[row.id].done);
  useEffect(() => {
    if (step !== V28_APPLY_PARTS) return;
    const next = V28_APPLY_STEPS[nowIndex === -1 ? V28_APPLY_STEPS.length - 1 : nowIndex];
    onStep(next.id);
  }, [step, nowIndex, onStep]);

  if (step === V28_APPLY_PARTS) return null;

  return (
    <div
      className={cn(
        "flex min-w-0 w-full flex-col gap-6",
        edition === "v35" ? null : "pb-28 desktop:pb-0",
      )}
    >
      {hideHelp ? null : (
      <div className="flex min-w-0">
        <button
          type="button"
          onClick={() => setHelp(true)}
          className="inline-flex items-center gap-2 text-sm leading-[18px] font-bold text-purple-600 hover:text-purple-700"
        >
          <img src={helpIcon} alt="" width={20} height={20} />
          How this works
        </button>
      </div>
      )}

      {step === "checklist" ? (
        <ChecklistPane docs={docs} onSample={setSample} v37={v37} />
      ) : null}
      {step === "upload" ? (
        <UploadPane
          groups={groups}
          attachments={attachments}
          canAttach={canAttach}
          onSample={setSample}
          onAttach={(permit, name, file) =>
            attachV28Doc(unit.id, work.id, permit, name, file)
          }
          onRemove={(permit, name) =>
            removeV28Doc(unit.id, work.id, permit, name)
          }
        />
      ) : null}
      {step === "screen" ? (
        edition === "v35" && screen.result === "error" ? (
          <ScreenError onRetry={() => setScreenRetry((n) => n + 1)} />
        ) : (
          <ScreeningPane homeHref={homeHref} v37={v37} />
        )
      ) : null}
      {step === "results" ? (
        <ResultsPane
          work={work}
          unit={unit}
          groups={groups}
          attachments={attachments}
          screen={screen}
          edition={edition}
          onSample={setSample}
          v37={v37}
          onDownloadZip={takeZip}
          onAttach={
            canAttach
              ? (permit, name, file) => attachV28Doc(unit.id, work.id, permit, name, file)
              : undefined
          }
          onRemove={
            canAttach
              ? (permit, name) => removeV28Doc(unit.id, work.id, permit, name)
              : undefined
          }
          onRescreen={() => {
            writeV28Screen(unit.id, work.id, {
              result: "idle",
              runs: screen.runs,
            });
            onStep("screen");
          }}
        />
      ) : null}

      {edition === "v31" && step === "results" && screen.result === "pass"
        ? afterResults
        : null}

      {step !== "screen" ? (
        <ScreenFooter bleed={edition === "v35"}>
          <p className="text-xs leading-4 text-grey-400 desktop:hidden">
            {v37
              ? `Last saved: ${formatSavedAt(savedAt)}`
              : `${attachedRequired} of ${requiredCount} required · ${
                  screen.result === "pass"
                    ? edition === "v31"
                      ? "Ready to download"
                      : "Ready to submit"
                    : "Draft on this work"
                }`}
          </p>
          {edition === "v35" && !v37 && step === "results" && screen.result === "pass" ? (
            <div className="flex flex-col gap-2 desktop:flex-row desktop:items-center desktop:justify-end">
              <div className="order-1 w-full desktop:order-2 desktop:w-auto">{nextAction}</div>
              <div className="order-2 flex gap-2 desktop:order-1">
                <button
                  type="button"
                  onClick={goPrev}
                  className={cn(GHOST, "min-w-0 flex-1 desktop:w-auto desktop:flex-none")}
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={takeZip}
                  className={cn(GHOST, "min-w-0 flex-1 desktop:w-auto desktop:flex-none")}
                >
                  Download ZIP
                </button>
              </div>
            </div>
          ) : (
          <div
            className={cn(
              "flex gap-2 desktop:w-full desktop:items-center desktop:justify-between",
              edition === "v31" && step === "results" && screen.result === "pass"
                ? "flex-col desktop:flex-row desktop:items-center"
                : v37
                  ? "flex-wrap items-center desktop:flex-nowrap"
                  : "items-center",
            )}
          >
            {step === "checklist" && !onPrevFromChecklist ? (
              <span className="hidden desktop:block" />
            ) : edition === "v31" && step === "results" && screen.result === "pass" && canAttach ? (
              <div className="flex w-full gap-2 desktop:w-auto">
                <button
                  type="button"
                  onClick={goPrev}
                  className={cn(GHOST, "min-w-0 flex-1 desktop:flex-none")}
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={takeZip}
                  className={cn(GHOST, "min-w-0 flex-1 desktop:flex-none")}
                >
                  Download ZIP
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={goPrev}
                className={cn(v37 ? QUIET : GHOST, "min-w-0 flex-1 desktop:flex-none")}
              >
                {v37 ? <ArrowLeft className="size-4" aria-hidden /> : null}
                Previous
              </button>
            )}
            <div
              className={cn(
                "flex min-w-0 gap-2 desktop:flex-none",
                edition === "v31" && step === "results" && screen.result === "pass"
                  ? "w-full flex-col desktop:w-auto desktop:flex-row desktop:items-center"
                  : v37
                    ? "contents items-center justify-end desktop:flex desktop:flex-1"
                    : "flex-1 items-center justify-end",
                v37 && "[&>*:last-child]:order-first [&>*:last-child]:basis-full desktop:[&>*:last-child]:order-none desktop:[&>*:last-child]:basis-auto",
              )}
            >
              {v37 ? (
                <>
                  <p className="hidden text-xs leading-4 text-grey-500 desktop:block">
                    Last saved: {formatSavedAt(savedAt)}
                  </p>
                  <button
                    type="button"
                    onClick={() => setSavedAt(new Date().toISOString())}
                    className={cn(QUIET, "min-w-0 flex-1 desktop:flex-none")}
                  >
                    Save Draft
                  </button>
                </>
              ) : (
              <p className="hidden text-xs leading-4 text-grey-400 desktop:block">
                {attachedRequired} of {requiredCount} required ·{" "}
                {screen.result === "pass"
                  ? edition === "v31"
                    ? "Ready to download"
                    : "Ready to submit"
                  : "Draft on this work"}
              </p>
              )}
              {nextAction}
            </div>
          </div>
          )}
        </ScreenFooter>
      ) : null}

      {help ? <PackHowItWorks onClose={() => setHelp(false)} /> : null}
      {sample ? (
        <SamplesModal doc={sample} onClose={() => setSample(null)} />
      ) : null}
    </div>
  );
}

/** v35: the action bar fills the content column, stopping at the nav. Other editions keep their own bar. */
function ScreenFooter({
  bleed,
  children,
}: {
  bleed: boolean;
  children: ReactNode;
}) {
  const slotRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLElement>(null);
  const [box, setBox] = useState<{ left: number; width: number } | null>(null);
  const [barH, setBarH] = useState(72);

  useLayoutEffect(() => {
    if (!bleed) return;
    const slot = slotRef.current;
    const bar = barRef.current;
    const main = slot?.closest("main");
    if (!main || !bar) return;
    const sync = () => {
      const r = main.getBoundingClientRect();
      if (r.width === 0) return;
      setBox({ left: r.left, width: r.width });
      setBarH(bar.getBoundingClientRect().height);
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(main);
    ro.observe(bar);
    window.addEventListener("resize", sync);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", sync);
    };
  }, [bleed]);

  if (!bleed) {
    return (
      <footer className="fixed inset-x-0 bottom-0 z-30 flex flex-col gap-2 border-t border-grey-100 bg-white px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] desktop:static desktop:flex-row desktop:flex-wrap desktop:items-center desktop:justify-between desktop:bg-transparent desktop:px-0 desktop:pb-0 desktop:pt-4">
        {children}
      </footer>
    );
  }

  return (
    <>
      <div ref={slotRef} style={{ height: barH }} aria-hidden />
      {createPortal(
        <footer
          ref={barRef}
          className="fixed bottom-0 z-40 flex flex-col gap-2 border-t border-grey-100 bg-white px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] tablet:px-8 desktop:flex-row desktop:flex-wrap desktop:items-center desktop:justify-between desktop:px-10"
          style={
            box
              ? { left: box.left, width: box.width }
              : { left: 0, width: 0, visibility: "hidden" }
          }
        >
          {children}
        </footer>,
        document.body,
      )}
    </>
  );
}

function ChecklistPane({
  docs,
  onSample,
  v37 = false,
}: {
  docs: V26ChecklistDoc[];
  onSample: (doc: V26ChecklistDoc) => void;
  v37?: boolean;
}) {
  const nested = usesV35Flow(useLocation().pathname);
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg leading-[22px] font-bold text-black">
          {v37 ? "Documents Checklist" : "Document checklist"}
        </h2>
        <p className="mt-1 text-sm leading-[18px] text-grey-500">
          {v37
            ? "Based on your tenancy and the works you’re conducting, prepare the following required documents for permit application."
            : "Based on this work’s answers. Open a sample before you prepare the file."}
        </p>
        {v37 && nested ? (
          <p className="mt-2 text-sm leading-[18px] text-grey-700">
            <span className="font-bold">One for All Permits</span> is shared
            across the permits listed under it.{" "}
            <span className="font-bold">One per Permit</span> needs a new copy
            for each permit named on the card.
          </p>
        ) : null}
      </div>
      <ol
        className={cn(
          v37
            ? "flex flex-col gap-3"
            : "overflow-hidden rounded-[var(--radius-2xl)] bg-white",
          !v37 && nested
            ? "border border-grey-200"
            : !v37
              ? "shadow-[var(--shadow-light-bg)]"
              : null,
        )}
      >
        {(nested ? v35DocumentSlots(docs) : docs.map((row) => ({
          id: `${row.permitName}::${row.doc.name}`,
          rows: [row],
          share: null as null,
        }))).map((slot, index) => (
          <ChecklistDocumentRow
            key={slot.id}
            index={index + 1}
            row={slot.rows[0]}
            share={nested ? slot.share : null}
            shareLine={
              nested
                ? v37
                  ? v35ShareChip(slot)
                  : v35ShareTag(slot)
                : null
            }
            description={nested ? v35SharedDescription(slot) : null}
            lead={nested && v37 ? v35ShareLead(slot) : null}
            onSample={() => onSample(slot.rows[0])}
            defaultOpen={index === 0}
            card={v37}
          />
        ))}
      </ol>
    </section>
  );
}

function ChecklistDocumentRow({
  index,
  row,
  share = null,
  shareLine,
  description,
  lead = null,
  onSample,
  defaultOpen,
  card = false,
}: {
  index: number;
  row: V26ChecklistDoc;
  share?: "all" | "each" | null;
  shareLine?: string | null;
  description?: string | null;
  lead?: string | null;
  onSample: () => void;
  defaultOpen: boolean;
  card?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const meta = v28DocumentRowMeta(row);
  const requirements = card
    ? v37DocumentScreen(row.doc.name).requirements
    : meta.requirements;
  return (
    <li
      className={cn(
        card
          ? "rounded-[var(--radius-xl)] border border-grey-100 bg-white px-4 py-4 tablet:px-5"
          : "border-t border-grey-100 px-4 py-4 first:border-t-0 tablet:px-5",
      )}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-purple-100 text-xs leading-4 font-bold text-purple-700"
        >
          {index}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-base leading-5 font-bold text-black">
                {row.doc.name}
              </p>
              {lead ? (
                <p className="mt-1 text-sm leading-[18px] text-grey-600">{lead}</p>
              ) : null}
              <p className="mt-1 text-sm leading-[18px] text-grey-600">
                {description ?? meta.description}
              </p>
              {shareLine ? (
                <p
                  className={cn(
                    "mt-2 inline-flex rounded-full px-2 py-0.5 text-xs leading-4 font-bold",
                    share === "each" && !card
                      ? "bg-warning-100 text-warning-800"
                      : "bg-purple-100 text-purple-700",
                  )}
                >
                  {shareLine}
                </p>
              ) : null}
            </div>
            <button type="button" onClick={onSample} className={cn(TEXT_BTN, "inline-flex shrink-0 items-center gap-1.5")}>
              <img src={sampleIcon} alt="" width={20} height={20} />
              Samples
            </button>
          </div>
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="mt-3 inline-flex items-center gap-1.5 text-sm leading-[18px] font-bold text-purple-600 hover:text-purple-700"
          >
            {card
              ? open
                ? "Hide Requirements"
                : "Show Requirements"
              : open
                ? "Hide requirements"
                : "Show requirements"}
            <RowChevron open={open} />
          </button>
          {open ? (
            <ul className="mt-2 flex flex-col gap-1 text-sm leading-[18px] text-grey-700">
              {requirements.map((line) => (
                <li key={line} className="flex gap-2">
                  <span aria-hidden className="text-grey-400">·</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          ) : null}
          <p className="mt-3 text-xs leading-4 text-grey-500">
            Formats: {meta.formats}
          </p>
        </div>
      </div>
    </li>
  );
}

function RowChevron({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="7"
      viewBox="0 0 12 7"
      aria-hidden
      className={cn("shrink-0", open && "rotate-180")}
    >
      <path
        d="M6.707 6.707a1 1 0 0 1-1.414 0L.293 1.707A1 1 0 0 1 1.707.293L6 4.586 10.293.293a1 1 0 1 1 1.414 1.414L6.707 6.707Z"
        fill="currentColor"
      />
    </svg>
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
  attachments: Record<string, V28Attachment>;
  canAttach: boolean;
  onSample: (doc: V26ChecklistDoc) => void;
  onAttach: (permit: string, name: string, fileName: string) => void;
  onRemove: (permit: string, name: string) => void;
}) {
  const firstOpenKey = useMemo(() => {
    for (const [, rows] of groups) {
      for (const row of rows) {
        const key = docAttachKey(row.permitName, row.doc.name);
        if (row.need === "Required" && !attachments[key]) return key;
      }
    }
    return "";
    // First missing file only — do not hop open state as you attach.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups]);

  const v35 = usesV35Flow(useLocation().pathname);
  const v37 = usesV37Cut(useLocation().pathname);
  const slots = v35
    ? v35DocumentSlots(groups.flatMap(([, rows]) => rows))
    : groups.flatMap(([, rows]) =>
        rows.map((row) => ({
          id: docAttachKey(row.permitName, row.doc.name),
          rows: [row],
          share: null as null,
        })),
      );

  return (
    <section className="flex min-w-0 flex-col gap-4">
      <div className="min-w-0">
        <h2 className="text-lg leading-[22px] font-bold text-black">
          {v37 ? "Upload Documents" : "Upload documents"}
        </h2>
        {v37 ? (
          slots.some((slot) => slot.share) ? (
            <p className="mt-1 text-sm leading-[18px] text-grey-700">
              Same labels as the document list.{" "}
              <span className="font-bold">One for All Permits</span> is a
              single file those permits share.{" "}
              <span className="font-bold">One per Permit</span> needs a
              separate file for each permit named on the card.
            </p>
          ) : null
        ) : (
        <p className="mt-1 text-sm leading-[18px] text-grey-500">
          Attach files for this work. Screening stays on this pack — it is not
          a separate module.
        </p>
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-3">
        {slots.map((slot) => {
          const row = slot.rows[0];
          const file = slot.rows
            .map((item) => attachments[docAttachKey(item.permitName, item.doc.name)])
            .find((item) => item);
          return (
            <UploadCard
              key={slot.id}
              row={row}
              share={v35 ? slot.share : null}
              chip={v37 ? v35ShareChip(slot) : null}
              note={
                v37
                  ? v35ShareLead(slot)
                  : v35 && slot.share !== "each"
                    ? v35ShareLine(slot)
                    : null
              }
              description={
                v35 && slot.share === "each"
                  ? "Upload a new file for this permit. Do not reuse a file from another permit."
                  : v35
                    ? v35SharedDescription(slot)
                    : null
              }
              file={file}
              canAttach={canAttach}
              v37={v37}
              defaultOpen={slot.rows.some(
                (item) =>
                  docAttachKey(item.permitName, item.doc.name) === firstOpenKey,
              )}
              onSample={() => onSample(row)}
              onAttach={(name) => {
                for (const item of slot.rows) {
                  onAttach(item.permitName, item.doc.name, name);
                }
              }}
              onRemove={() => {
                for (const item of slot.rows) {
                  onRemove(item.permitName, item.doc.name);
                }
              }}
            />
          );
        })}
      </div>
    </section>
  );
}

const UPLOAD_LIMIT = 25 * 1024 * 1024;

function formatUploadSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  const mb = bytes / (1024 * 1024);
  return `${mb >= 10 ? Math.round(mb) : mb.toFixed(1)} MB`;
}

type UploadQueue =
  | { status: "progress"; name: string; bytes: number; pct: number }
  | { status: "cancelled"; name: string; bytes: number }
  | { status: "failed"; name: string; bytes: number; reason: string };

function UploadSpinner() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden className="animate-spin">
      <circle cx="10" cy="10" r="7.25" fill="none" stroke="#e5e5e5" strokeWidth="2" />
      <circle
        cx="10"
        cy="10"
        r="7.25"
        fill="none"
        stroke="#7a35b0"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="14 32"
      />
    </svg>
  );
}

function V37FileUpload({
  docName,
  formats,
  file,
  canAttach,
  showDropzone,
  onAttach,
  onRemove,
}: {
  docName: string;
  formats: string;
  file?: V28Attachment;
  canAttach: boolean;
  showDropzone: boolean;
  onAttach: (fileName: string) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef<number | null>(null);
  const pending = useRef<File | null>(null);
  const [queue, setQueue] = useState<UploadQueue | null>(null);
  const [knownBytes, setKnownBytes] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(
    () => () => {
      if (timer.current != null) window.clearInterval(timer.current);
    },
    [],
  );

  const finish = (next: File) => {
    if (next.size > UPLOAD_LIMIT || /fail/i.test(next.name)) {
      setQueue({
        status: "failed",
        name: next.name,
        bytes: next.size,
        reason: next.size > UPLOAD_LIMIT ? "the file is over 25 MB" : "the file could not be saved",
      });
      return;
    }
    setKnownBytes(next.size);
    setQueue(null);
    onAttach(next.name);
  };

  const begin = (next: File) => {
    if (timer.current != null) window.clearInterval(timer.current);
    pending.current = next;
    const started = Date.now();
    setQueue({ status: "progress", name: next.name, bytes: next.size, pct: 0 });
    timer.current = window.setInterval(() => {
      const pct = Math.min(100, Math.round(((Date.now() - started) / 2400) * 100));
      if (pct >= 100) {
        if (timer.current != null) window.clearInterval(timer.current);
        timer.current = null;
        finish(next);
        return;
      }
      setQueue({ status: "progress", name: next.name, bytes: next.size, pct });
    }, 80);
  };

  const take = (list: FileList | null) => {
    const next = list?.[0];
    if (next) begin(next);
  };

  const shown = queue
    ? queue
    : file
      ? {
          status: "complete" as const,
          name: file.fileName,
          bytes: knownBytes,
        }
      : null;

  return (
    <div className="flex flex-col gap-2">
      {canAttach && showDropzone ? (
        <label
          className={cn(
            "flex cursor-pointer flex-col items-center gap-3 rounded-[var(--radius-xl)] border bg-white px-6 py-6 text-center",
            dragOver ? "border-purple-600" : "border-grey-200",
          )}
          onDragEnter={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragOver(false);
            take(event.dataTransfer.files);
          }}
        >
          <input
            ref={inputRef}
            type="file"
            className="sr-only"
            aria-label={`Upload ${docName}`}
            onChange={(event) => {
              take(event.target.files);
              event.target.value = "";
            }}
          />
          <span className="grid size-10 place-items-center">
            <Upload className="size-5 text-black" aria-hidden />
          </span>
          <span className="flex flex-col items-center gap-1">
            <span className="text-sm leading-[18px] text-grey-700">
              <span className="font-bold text-purple-600">Click to Upload</span> or drag and drop
            </span>
            <span className="text-xs leading-4 text-grey-700">Size limit 25MB;</span>
            <span className="text-xs leading-4 text-grey-700">File format: {formats}</span>
          </span>
        </label>
      ) : null}
      {shown ? (
        <div className="flex items-start gap-3 rounded-[12px] border border-grey-100 bg-white p-4">
          {shown.status === "progress" ? (
            <UploadSpinner />
          ) : (
            <img src={fileIcon} alt="" width={20} height={20} className="shrink-0" />
          )}
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex min-w-0 flex-col gap-0.5">
              <div className="flex items-start gap-6">
                <p className="min-w-0 flex-1 truncate text-sm leading-[18px] text-grey-700">
                  {shown.name}
                </p>
                {shown.status === "progress" ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (timer.current != null) window.clearInterval(timer.current);
                      timer.current = null;
                      setQueue({
                        status: "cancelled",
                        name: shown.name,
                        bytes: shown.bytes,
                      });
                    }}
                    className="shrink-0 text-sm leading-[18px] font-bold text-purple-600 hover:text-purple-700 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
                  >
                    Cancel
                  </button>
                ) : canAttach ? (
                  <button
                    type="button"
                    aria-label={`Delete ${shown.name}`}
                    onClick={() => {
                      setQueue(null);
                      setKnownBytes(null);
                      pending.current = null;
                      if (file) onRemove();
                    }}
                    className="grid size-5 shrink-0 place-items-center focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
                  >
                    <img src={deleteBinIcon} alt="" width={20} height={20} />
                  </button>
                ) : null}
              </div>
              {shown.status === "complete" || shown.bytes != null ? (
                <p className="text-sm leading-[18px] text-grey-400">
                  {shown.status === "progress" ? `${shown.pct}%` : shown.status === "complete" ? "100%" : "0%"}
                  {shown.bytes != null ? ` of ${formatUploadSize(shown.bytes)}` : ""}
                </p>
              ) : null}
            </div>
            {shown.status === "complete" ? (
              <p className="inline-flex items-center gap-1 text-sm leading-[18px] text-success-600">
                <img src={checkCompleteIcon} alt="" width={16} height={16} className="size-4 shrink-0" />
                Upload Complete
              </p>
            ) : null}
            {shown.status === "cancelled" ? (
              <div className="flex items-center gap-6">
                <p className="inline-flex min-w-0 flex-1 items-center gap-1 text-sm leading-[18px] text-grey-400">
                  <CircleX aria-hidden size={16} strokeWidth={1.75} />
                  Upload Cancelled
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const again = pending.current;
                    if (again) begin(again);
                  }}
                  className="shrink-0 text-sm leading-[18px] font-bold text-purple-600 hover:text-purple-700 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
                >
                  Try again
                </button>
              </div>
            ) : null}
            {shown.status === "failed" ? (
              <div className="flex items-end gap-6">
                <p className="inline-flex min-w-0 flex-1 items-start gap-1 text-sm leading-[18px] text-error-600">
                  <CircleX aria-hidden size={16} strokeWidth={1.75} className="mt-0.5 shrink-0" />
                  Upload Failed due to {shown.reason}.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const again = pending.current;
                    if (again) begin(again);
                  }}
                  className="shrink-0 text-sm leading-[18px] font-bold text-error-600 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
                >
                  Try again
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function UploadCard({
  row,
  share = null,
  chip = null,
  note,
  description,
  file,
  canAttach,
  defaultOpen,
  onSample,
  onAttach,
  onRemove,
  v37 = false,
}: {
  row: V26ChecklistDoc;
  share?: "all" | "each" | null;
  chip?: string | null;
  note?: string | null;
  description?: string | null;
  file?: V28Attachment;
  canAttach: boolean;
  defaultOpen?: boolean;
  onSample: () => void;
  onAttach: (fileName: string) => void;
  onRemove: () => void;
  v37?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(Boolean(defaultOpen));
  const [skipped, setSkipped] = useState(false);
  const meta = v28DocumentRowMeta(row);
  const separate = share === "each";
  return (
    <article
      className={cn(
        "min-w-0 overflow-hidden rounded-[var(--radius-2xl)] border bg-white",
        separate ? "border-warning-200" : "border-grey-100",
      )}
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full min-w-0 items-center gap-3 px-4 py-4 text-left tablet:px-5",
          separate && "bg-warning-100",
        )}
      >
        <span className="min-w-0 flex-1">
          {chip ? (
            <span
              className={cn(
                "mb-1 inline-flex h-[22px] max-w-full items-center rounded-full px-2 text-[11px] leading-[14px] font-bold",
                separate
                  ? "bg-white text-purple-700"
                  : "bg-purple-100 text-purple-700",
              )}
            >
              {chip}
            </span>
          ) : separate ? (
            <span className="mb-1 inline-flex h-[22px] items-center rounded-full bg-white px-2 text-[11px] leading-[14px] font-bold text-warning-800">
              Separate file
            </span>
          ) : null}
          <span className="block truncate text-base leading-5 font-bold text-black">
            {row.doc.name}
          </span>
          {note ? (
            <span
              className={cn(
                "mt-0.5 block text-sm leading-[18px]",
                separate ? "font-bold text-warning-800" : "text-grey-600",
              )}
            >
              {note}
            </span>
          ) : separate ? (
            <span className="mt-0.5 block text-sm leading-[18px] font-bold text-warning-800">
              {row.permitName}
            </span>
          ) : null}
        </span>
        <span
          className={cn(
            "inline-flex h-[22px] shrink-0 items-center rounded-full px-2 text-[11px] leading-[14px] font-bold",
            file ? "bg-success-200 text-success-600" : "bg-error-200 text-error-600",
          )}
        >
          {file ? "Uploaded" : v37 ? "Not Uploaded Yet" : "Not uploaded yet"}
        </span>
        <RowChevron open={open} />
      </button>
      {open ? (
        <div className="flex min-w-0 flex-col gap-4 border-t border-grey-100 px-4 py-4 tablet:px-5">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <p className="min-w-0 text-sm leading-[18px] text-grey-700">
              {description ?? meta.description}
            </p>
            <button type="button" onClick={onSample} className={cn(TEXT_BTN, "inline-flex shrink-0 items-center gap-1.5")}>
              <img src={sampleIcon} alt="" width={20} height={20} />
              Samples
            </button>
          </div>
          {v37 ? (
            <V37FileUpload
              docName={row.doc.name}
              formats={meta.formats}
              file={file}
              canAttach={canAttach}
              showDropzone={!skipped}
              onAttach={onAttach}
              onRemove={onRemove}
            />
          ) : null}
          {!v37 && canAttach && !skipped ? (
            <label className="flex cursor-pointer flex-col items-center gap-1 rounded-[var(--radius-md)] border border-dashed border-grey-200 bg-white px-4 py-6 text-center">
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
              <span className="text-sm leading-[18px] text-grey-700">
                <span className="font-bold text-purple-600">Click to Upload</span> or drag and drop
              </span>
              <span className="text-xs leading-4 text-grey-700">Size limit 25 MB</span>
              <span className="text-xs leading-4 text-grey-700">{meta.formats}</span>
            </label>
          ) : null}
          {!canAttach && !file ? (
            <p className="text-sm leading-[18px] text-grey-600">
              Your contractor uploads these files.
            </p>
          ) : null}
          {!v37 && file ? (
            <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-grey-100 px-3 py-3">
              <img src={pdfIcon} alt="" width={20} height={20} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm leading-[18px] text-grey-700">
                  {file.fileName}
                </p>
                <p className="inline-flex items-center gap-1 text-sm leading-[18px] text-success-600">
                  <CircleCheck aria-hidden size={16} strokeWidth={1.5} />
                  Upload Complete
                </p>
              </div>
              {canAttach ? (
                <button type="button" onClick={onRemove} className={TEXT_BTN}>
                  Remove
                </button>
              ) : null}
            </div>
          ) : null}
          {canAttach ? (
            <label className="flex cursor-pointer items-center gap-2 text-base leading-5 text-black">
              <input
                type="checkbox"
                checked={skipped}
                onChange={(event) => setSkipped(event.target.checked)}
                className="size-4 shrink-0 rounded-[var(--radius-sm)] border-grey-300 accent-purple-600"
              />
              Skip for now
            </label>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function ScreenError({ onRetry }: { onRetry: () => void }) {
  return (
    <section className="flex flex-col items-center gap-4 rounded-[var(--radius-2xl)] border border-grey-200 bg-white px-6 py-16 text-center">
      <ErrorCloud />
      <div className="max-w-[29rem]">
        <h2 className="text-lg leading-7 font-bold text-black">
          Hmm, something went wrong.
        </h2>
        <p className="mt-2 text-sm leading-5 text-grey-600">
          It looks like we weren’t able to extract your documents thoroughly.
          Try re-screening all documents again.
        </p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex h-11 items-center gap-1.5 rounded-[var(--radius-sm)] border border-grey-300 bg-white px-4 text-sm leading-[18px] font-bold text-black hover:bg-grey-50 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
      >
        Try Again
        <RotateCw className="size-4" aria-hidden />
      </button>
    </section>
  );
}

function ScreeningPlane() {
  return <img src={planeIllustration} alt="" width={144} height={144} className="size-36" />;
}

function ScreeningPane({ homeHref, v37 = false }: { homeHref?: string; v37?: boolean }) {
  return (
    <section
      className={cn(
        "flex flex-col items-center gap-4 bg-white px-6 py-16 text-center",
        v37
          ? "rounded-[var(--radius-2xl)] border border-grey-100"
          : "rounded-[var(--radius-2xl)] shadow-[var(--shadow-light-bg)]",
      )}
    >
      {v37 ? <ScreeningPlane /> : null}
      <p className="text-lg leading-[22px] font-bold text-black">
        Screening Your Documents
      </p>
      {v37 ? (
        <div className="flex max-w-sm flex-col gap-1 text-sm leading-[18px] text-grey-700">
          <p>This usually takes 1-3 minutes.</p>
          <p>You can leave and come back - progress will be saved as a draft.</p>
        </div>
      ) : (
        <p className="max-w-sm text-sm leading-[18px] text-grey-500">
          This usually takes 1–3 minutes. You can leave and come back — progress stays on this work as a draft.
        </p>
      )}
      {homeHref ? (
        <Link
          to={homeHref}
          className={cn(v37 ? QUIET : GHOST, "mt-2")}
        >
          Back to Home
        </Link>
      ) : null}
    </section>
  );
}

function ResultsPane({
  work,
  unit,
  groups,
  attachments,
  screen,
  edition = "v28",
  onSample,
  onRescreen,
  v37 = false,
  onDownloadZip,
  onAttach,
  onRemove,
}: {
  work: V26Work;
  unit: Unit;
  groups: [string, V26ChecklistDoc[]][];
  attachments: Record<string, V28Attachment>;
  screen: V28ScreenState;
  edition?: "v28" | "v31" | "v35";
  onSample: (doc: V26ChecklistDoc) => void;
  onRescreen: () => void;
  v37?: boolean;
  onDownloadZip?: () => void;
  onAttach?: (permit: string, name: string, fileName: string) => void;
  onRemove?: (permit: string, name: string) => void;
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
        <p className="flex items-center gap-2 text-sm leading-[18px] font-bold text-black">
          {v37 ? (
            <CircleCheck
              aria-hidden
              size={18}
              strokeWidth={1.75}
              className={passed ? "text-success-600" : "text-warning-600"}
            />
          ) : null}
          {passed
            ? "Ready for submission in OneCalendar"
            : "Some issues found"}
        </p>
        <p className="mt-1 text-sm leading-[18px] text-grey-700">
          {passed
            ? v37
              ? "The files passed this check. Download them for OneCalendar — this is not the application, and OneCalendar still has to approve."
              : edition === "v31"
                ? "The files passed the check. Download the zip, submit it in OneCalendar, then mark it here."
                : "Your documents have passed all checks. Save the summary and documents for submission in OneCalendar."
            : "Review all issues and upload your revised documents. All documents will be re-screened."}
        </p>
      </div>
      {passed && v37 ? (
        <V37PassSummary work={work} unit={unit} groups={groups} attachments={attachments} />
      ) : passed ? (
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
      {v37 ? (
        <V37DetailedResults
          groups={groups}
          attachments={attachments}
          passed={passed}
          onSample={onSample}
          canAttach={Boolean(onAttach)}
          onAttach={onAttach}
          onRemove={onRemove}
        />
      ) : (
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
      )}
      {passed && v37 ? (
        <V37NextSteps onDownloadZip={onDownloadZip} />
      ) : passed ? (
        <div className="rounded-[var(--radius-2xl)] border border-grey-100 bg-white p-4 tablet:p-6">
          <h3 className="text-sm leading-[18px] font-bold text-black">
            {edition === "v31" ? "Take the zip to OneCalendar" : "Next steps"}
          </h3>
          <p className="mt-2 rounded-[var(--radius-md)] bg-amber-50 px-3 py-3 text-sm leading-[18px] text-grey-700">
            {edition === "v31"
              ? "Download the zip and submit it in OneCalendar. Mark it here once that is done."
              : "This is only a preliminary screening. You still need to submit your permit application in OneCalendar."}
          </p>
          {edition === "v31" ? (
            <ol className="mt-4 flex flex-col gap-3 text-sm leading-[18px] text-grey-700">
              <li>1. Download the zip of screened documents.</li>
              <li>2. Submit that zip in OneCalendar.</li>
              <li>3. Mark it submitted here.</li>
            </ol>
          ) : (
            <ol className="mt-4 flex flex-col gap-3 text-sm leading-[18px] text-grey-700">
              <li>1. Download results summary for approvers in OneCalendar.</li>
              <li>2. Download a ZIP of all checked documents.</li>
              <li>3. Submit the documents and summary in OneCalendar.</li>
            </ol>
          )}
          {edition === "v31" ? (
            <a
              href="https://onecalendar.changiairport.com"
              target="_blank"
              rel="noreferrer"
              className={cn(TEXT_BTN, "mt-4 inline-flex")}
            >
              Open OneCalendar
            </a>
          ) : null}
        </div>
      ) : (
        <button type="button" onClick={onRescreen} className={GHOST}>
          {v37 ? "Re-screen After You Upload Fixes" : "Re-screen after you upload fixes"}
        </button>
      )}
    </section>
  );
}

function V37PassSummary({
  work,
  unit,
  groups,
  attachments,
}: {
  work: V26Work;
  unit: Unit;
  groups: [string, V26ChecklistDoc[]][];
  attachments: Record<string, V28Attachment>;
}) {
  const files = groups.flatMap(([, rows]) =>
    rows.filter((row) => attachments[docAttachKey(row.permitName, row.doc.name)]),
  );
  return (
    <div className="rounded-[var(--radius-xl)] border border-grey-100 bg-white p-4 tablet:p-6">
      <h3 className="text-base leading-5 font-bold text-black">Summary</h3>
      <div className="mt-4 grid gap-6 tablet:grid-cols-2">
        <div>
          <p className="text-xs leading-4 font-bold tracking-[0.04em] text-grey-500 uppercase">
            Application details
          </p>
          <dl className="mt-3 flex flex-col gap-3 text-sm leading-[18px]">
            <div>
              <dt className="text-grey-500">Permit to work</dt>
              <dd className="font-bold text-black">{v26WorkListTitle(work)}</dd>
            </div>
            <div>
              <dt className="text-grey-500">Unit</dt>
              <dd className="font-bold text-black">{unit.unitNo}</dd>
            </div>
          </dl>
        </div>
        <div>
          <p className="text-xs leading-4 font-bold tracking-[0.04em] text-grey-500 uppercase">
            Documents screened {files.length}
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {files.map((row) => (
              <li key={`${row.permitName}-${row.doc.name}`} className="flex items-center gap-2 text-sm leading-[18px] text-black">
                <CircleCheck aria-hidden size={16} strokeWidth={1.75} className="text-success-600" />
                {row.doc.name}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function V37NextSteps({ onDownloadZip }: { onDownloadZip?: () => void }) {
  const downloadSummary = () => {
    const blob = new Blob(
      ["Permit screening summary\n\nYour documents passed the check. Submit the pack in OneCalendar.\n"],
      { type: "text/plain" },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "screening-summary.txt";
    link.click();
    URL.revokeObjectURL(url);
  };
  const rows = [
    {
      n: "1",
      title: "Download results summary",
      body: "Save a summary of documents and their checks for approvers to review in OneCalendar.",
      action: "Download",
      onClick: downloadSummary,
    },
    {
      n: "2",
      title: "Download ZIP of all checked documents",
      body: "All uploaded files that have been screened here will be compressed in a ZIP file for easier submission.",
      action: "Download ZIP",
      onClick: onDownloadZip,
    },
    {
      n: "3",
      title: "Submit all documents and results summary in OneCalendar",
      body: "You must submit your permit application in OneCalendar for approval.",
      action: "Submit in OneCalendar",
      href: "https://onecalendar.changiairport.com",
    },
  ];
  return (
    <div className="rounded-[var(--radius-xl)] border border-grey-100 bg-white p-4 tablet:p-6">
      <h3 className="text-base leading-5 font-bold text-black">Next Steps</h3>
      <p className="mt-3 rounded-[var(--radius-md)] bg-warning-100 px-3 py-3 text-sm leading-[18px] text-grey-700">
        This is only a preliminary screening. You still need to submit your permit application in OneCalendar.
      </p>
      <ol className="mt-4 flex flex-col gap-4">
        {rows.map((row) => (
          <li key={row.n} className="flex flex-col gap-3 tablet:flex-row tablet:items-start tablet:justify-between tablet:gap-4">
            <div className="flex min-w-0 gap-3">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-purple-100 text-xs leading-4 font-bold text-purple-700">
                {row.n}
              </span>
              <span className="min-w-0">
                <span className="block text-sm leading-[18px] font-bold text-black">{row.title}</span>
                <span className="mt-0.5 block text-sm leading-[18px] text-grey-600">{row.body}</span>
              </span>
            </div>
            {row.href ? (
              <a href={row.href} target="_blank" rel="noreferrer" className={cn(PRIMARY, "ml-9 shrink-0 tablet:ml-0")}>
                {row.action}
              </a>
            ) : (
              <button type="button" onClick={row.onClick} className={cn(QUIET, "ml-9 shrink-0 tablet:ml-0")}>
                {row.action}
              </button>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

function V37DetailedResults({
  groups,
  attachments,
  onSample,
  canAttach,
  onAttach,
  onRemove,
}: {
  groups: [string, V26ChecklistDoc[]][];
  attachments: Record<string, V28Attachment>;
  passed: boolean;
  onSample: (doc: V26ChecklistDoc) => void;
  canAttach: boolean;
  onAttach?: (permit: string, name: string, fileName: string) => void;
  onRemove?: (permit: string, name: string) => void;
}) {
  const documents = useMemo(() => {
    const map = new Map<string, V26ChecklistDoc[]>();
    for (const [, rows] of groups) {
      for (const row of rows) {
        const list = map.get(row.doc.name) ?? [];
        list.push(row);
        map.set(row.doc.name, list);
      }
    }
    return [...map.entries()];
  }, [groups]);
  const hasIssue = (rows: V26ChecklistDoc[]) =>
    rows.some((row) => {
      const file = attachments[docAttachKey(row.permitName, row.doc.name)];
      return !file || Boolean(file.issue);
    });
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({});
  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current) return;
    if (Object.keys(attachments).length === 0) {
      const id = window.setTimeout(() => {
        if (seeded.current) return;
        seeded.current = true;
        setOpenIds(
          Object.fromEntries(documents.map(([name, rows]) => [name, hasIssue(rows)])),
        );
      }, 0);
      return () => window.clearTimeout(id);
    }
    seeded.current = true;
    setOpenIds(
      Object.fromEntries(documents.map(([name, rows]) => [name, hasIssue(rows)])),
    );
  }, [attachments, documents]);
  const ids = documents.map(([name]) => name);
  const allOpen = ids.length > 0 && ids.every((id) => openIds[id]);
  const allClosed = ids.every((id) => !openIds[id]);
  const setAll = (open: boolean) =>
    setOpenIds(Object.fromEntries(ids.map((id) => [id, open])));
  return (
    <section className="flex flex-col gap-6 rounded-[var(--radius-md)] border border-grey-100 bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg leading-[22px] font-bold text-black">Detailed Results</h3>
        <div className="flex items-center gap-4">
        <button
          type="button"
          disabled={allOpen}
          onClick={() => setAll(true)}
          className="text-base leading-5 font-bold text-purple-600 hover:text-purple-700 disabled:text-grey-700/40"
        >
          Expand All
        </button>
        <button
          type="button"
          disabled={allClosed}
          onClick={() => setAll(false)}
          className="text-base leading-5 font-bold text-purple-600 hover:text-purple-700 disabled:text-grey-700/40"
        >
          Collapse All
        </button>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {documents.map(([name, rows]) => (
          <ResultCard
            key={name}
            permit={rows[0]?.permitName ?? name}
            heading={name}
            rows={rows}
            attachments={attachments}
            passed={!hasIssue(rows)}
            onSample={onSample}
            v37
            canAttach={canAttach}
            onAttach={onAttach}
            onRemove={onRemove}
            open={Boolean(openIds[name])}
            onOpenChange={(next) => setOpenIds((prev) => ({ ...prev, [name]: next }))}
          />
        ))}
      </div>
    </section>
  );
}

function ResultCard({
  permit,
  heading,
  rows,
  attachments,
  passed,
  onSample,
  v37 = false,
  canAttach = false,
  onAttach,
  onRemove,
  open: openProp,
  onOpenChange,
}: {
  permit: string;
  /** v37 detailed results: the document name. Permit grouping stays the default. */
  heading?: string;
  rows: V26ChecklistDoc[];
  attachments: Record<string, V28Attachment>;
  passed: boolean;
  onSample: (doc: V26ChecklistDoc) => void;
  v37?: boolean;
  canAttach?: boolean;
  onAttach?: (permit: string, name: string, fileName: string) => void;
  onRemove?: (permit: string, name: string) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [localOpen, setLocalOpen] = useState(!passed);
  const open = openProp ?? localOpen;
  const setOpen = (next: boolean) => {
    onOpenChange?.(next);
    if (openProp === undefined) setLocalOpen(next);
  };
  const missing = rows.filter(
    (row) => !attachments[docAttachKey(row.permitName, row.doc.name)],
  );
  const flagged = rows.filter((row) =>
    attachments[docAttachKey(row.permitName, row.doc.name)]?.issue,
  );
  const passChip = passed || (missing.length === 0 && flagged.length === 0);
  const issueCount = missing.length + flagged.length;
  const passedRows = rows.filter((row) => {
    const file = attachments[docAttachKey(row.permitName, row.doc.name)];
    return Boolean(file) && !file?.issue;
  });
  const checkLines = v37
    ? v37DocumentScreen(heading ?? rows[0]?.doc.name ?? permit).requirements
    : [];
  if (v37) {
    return (
      <article className="overflow-hidden rounded-[var(--radius-xl)] border border-grey-100 bg-white">
        <div className={cn("flex items-center gap-4 px-5 py-4", open && "border-b border-grey-100")}>
          {passChip ? (
            <img src={checkDuotoneIcon} alt="" width={24} height={24} className="mt-2 size-6 shrink-0 self-start" />
          ) : (
            <CircleX aria-hidden size={24} strokeWidth={1.75} className="mt-2 shrink-0 self-start text-error-600" />
          )}
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-2">
            <button
              type="button"
              aria-expanded={open}
              onClick={() => setOpen(!open)}
              className="min-w-[10rem] flex-1 text-left"
            >
              <span className="block truncate text-base leading-5 font-bold text-black">
                {heading ?? permit}
              </span>
              <span className="mt-0.5 block truncate text-sm leading-[18px] text-grey-400">
                {passChip
                  ? "All checks passed"
                  : `${issueCount} ${issueCount === 1 ? "issue" : "issues"} found`}
              </span>
            </button>
            <div className="flex shrink-0 items-center gap-4">
              <button
                type="button"
                onClick={() => onSample(rows[0])}
                className={cn(TEXT_BTN, "inline-flex shrink-0 items-center gap-1.5")}
              >
                <img src={sampleIcon} alt="" width={20} height={20} />
                Samples
              </button>
              <span
                className={cn(
                  "inline-flex h-[30px] shrink-0 items-center rounded-full px-3 text-sm leading-[18px] font-bold",
                  passChip ? "bg-success-200 text-success-600" : "bg-error-200 text-error-600",
                )}
              >
                {passChip ? "Pass" : "Issues Found"}
              </span>
            </div>
          </div>
          <button
            type="button"
            aria-expanded={open}
            aria-label={open ? "Collapse" : "Expand"}
            onClick={() => setOpen(!open)}
            className="mt-2 grid size-6 shrink-0 place-items-center self-start text-grey-700"
          >
            <RowChevron open={open} />
          </button>
        </div>
        {open ? (
          <div className="flex flex-col gap-8 p-6">
            {passChip ? null : (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <p className="text-xs leading-4 font-black text-grey-400">ISSUES TO RESOLVE</p>
                  <span className="inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-grey-100 px-1.5 text-[11px] leading-[14px] font-bold text-grey-700">
                    {issueCount}
                  </span>
                </div>
                {missing.map((row) => (
                  <div
                    key={row.doc.name}
                    className="flex items-start gap-2 rounded-[var(--radius-xl)] border border-grey-200 bg-grey-50 p-4"
                  >
                    <CircleX aria-hidden size={20} strokeWidth={1.75} className="mt-0.5 shrink-0 text-error-600" />
                    <div className="min-w-0 flex-1">
                      <p className="text-base leading-5 font-bold text-black">{row.doc.name} is missing</p>
                      <p className="mt-1 text-base leading-5 text-grey-700">This file is not in the pack.</p>
                      <p className="mt-4 text-base leading-5 text-grey-700">
                        <span className="font-bold">What to do: </span>
                        Upload this file, then screen the pack again.
                      </p>
                    </div>
                  </div>
                ))}
                {flagged.map((row) => {
                  const issue = attachments[docAttachKey(row.permitName, row.doc.name)]?.issue;
                  return (
                    <div
                      key={`${row.doc.name}-flag`}
                      className="flex items-start gap-2 rounded-[var(--radius-xl)] border border-grey-200 bg-grey-50 p-4"
                    >
                      <CircleX aria-hidden size={20} strokeWidth={1.75} className="mt-0.5 shrink-0 text-error-600" />
                      <div className="min-w-0 flex-1">
                        <p className="text-base leading-5 font-bold text-black">{row.doc.name} is flagged</p>
                        <p className="mt-1 text-base leading-5 text-grey-700">{issue}</p>
                        <p className="mt-4 text-base leading-5 text-grey-700">
                          <span className="font-bold">What to do: </span>
                          Replace this file, then screen the pack again.
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {passedRows.length > 0 ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <p className="text-xs leading-4 font-bold text-grey-400">CHECKS PASSED</p>
                  <span className="inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-grey-100 px-1.5 text-[11px] leading-[14px] font-bold text-grey-700">
                    {checkLines.length}
                  </span>
                </div>
                {checkLines.map((line) => (
                  <div key={line} className="flex items-start gap-2">
                    <img src={checkSolidIcon} alt="" width={20} height={20} className="size-5 shrink-0" />
                    <span className="block text-base leading-5 font-bold text-black">{line}</span>
                  </div>
                ))}
              </div>
            ) : null}
            <div className="flex flex-col gap-3">
              <p className="text-xs leading-4 font-black text-grey-400">DOCUMENT(S)</p>
              {rows
                .filter((row, index, all) => {
                  const name =
                    attachments[docAttachKey(row.permitName, row.doc.name)]?.fileName ??
                    row.doc.name;
                  return (
                    all.findIndex((other) => {
                      const otherName =
                        attachments[docAttachKey(other.permitName, other.doc.name)]?.fileName ??
                        other.doc.name;
                      return otherName === name;
                    }) === index
                  );
                })
                .map((row) => {
                const file = attachments[docAttachKey(row.permitName, row.doc.name)];
                return (
                  <V37FileUpload
                    key={`${row.permitName}-${row.doc.name}`}
                    docName={row.doc.name}
                    formats={v28DocumentRowMeta(row).formats}
                    file={file}
                    canAttach={canAttach}
                    showDropzone={canAttach && (!file || Boolean(file.issue))}
                    onAttach={(fileName) => onAttach?.(row.permitName, row.doc.name, fileName)}
                    onRemove={() => onRemove?.(row.permitName, row.doc.name)}
                  />
                );
              })}
            </div>
          </div>
        ) : null}
      </article>
    );
  }
  return (
    <article className="overflow-hidden rounded-[var(--radius-2xl)] border border-grey-100 bg-white">
      <div className="flex w-full items-center gap-3 px-4 py-4 tablet:px-5">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate text-base leading-5 font-bold text-black">
              {permit}
            </span>
            <span className="mt-0.5 block text-sm leading-[18px] text-grey-600">
              {passChip
                ? "All checks passed"
                : `${missing.length + flagged.length} ${missing.length + flagged.length === 1 ? "issue" : "issues"} found`}
            </span>
          </span>
          <span
            className={cn(
              "inline-flex h-[22px] shrink-0 items-center rounded-full px-2 text-[11px] leading-[14px] font-bold",
              passChip
                ? "bg-success-200 text-success-600"
                : "bg-warning-200 text-warning-900",
            )}
          >
            {passChip ? "Pass" : "Issues found"}
          </span>
          <RowChevron open={open} />
        </button>
        <button
          type="button"
          onClick={() => onSample(rows[0])}
          className={cn(TEXT_BTN, "shrink-0")}
        >
          Samples
        </button>
      </div>
      {open ? (
        <div className="flex flex-col gap-4 border-t border-grey-100 px-4 py-4 tablet:px-5">
          {passChip ? (
            <div className="flex flex-col gap-3">
              <p className="text-xs leading-4 font-bold tracking-[0.08em] text-grey-500">
                CHECKS PASSED
              </p>
              {rows.map((row) => (
                <div key={row.doc.name} className="flex items-start gap-2">
                  <span aria-hidden className="mt-1 size-2 shrink-0 rounded-full bg-success-600" />
                  <span>
                    <span className="block text-sm leading-[18px] font-bold text-black">
                      {row.doc.name}
                    </span>
                    <span className="block text-sm leading-[18px] text-grey-600">
                      File is in the pack
                    </span>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-xs leading-4 font-bold tracking-[0.08em] text-grey-500">
                ISSUES TO RESOLVE
              </p>
              {missing.map((row) => (
                <div key={row.doc.name} className="flex items-start gap-2">
                  <span aria-hidden className="mt-1.5 size-2 shrink-0 rounded-full bg-error-600" />
                  <span className="min-w-0">
                    <span className="block text-sm leading-[18px] font-bold text-black">
                      {row.doc.name} is missing
                    </span>
                    <span className="mt-0.5 block text-sm leading-[18px] text-grey-600">
                      This file is not in the pack.
                    </span>
                    <span className="mt-1 block text-sm leading-[18px] text-grey-700">
                      <span className="font-bold">What to do: </span>
                      Upload this file, then screen the pack again.
                    </span>
                  </span>
                </div>
              ))}
              {flagged.map((row) => {
                const issue =
                  attachments[docAttachKey(row.permitName, row.doc.name)]?.issue;
                return (
                  <div key={`${row.doc.name}-flag`} className="flex items-start gap-2">
                    <span aria-hidden className="mt-1.5 size-2 shrink-0 rounded-full bg-error-600" />
                    <span className="min-w-0">
                      <span className="block text-sm leading-[18px] font-bold text-black">
                        {row.doc.name} is flagged
                      </span>
                      <span className="mt-0.5 block text-sm leading-[18px] text-grey-600">
                        {issue}
                      </span>
                      <span className="mt-1 block text-sm leading-[18px] text-grey-700">
                        <span className="font-bold">What to do: </span>
                        Replace this file, then screen the pack again.
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </article>
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
  const pathname = useLocation().pathname;
  const v34 = isV34Path(pathname);
  const v35 = usesV35Flow(pathname);
  const farClose = v34 || v35;
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
  const body = (
    <>
        {farClose ? (
          <SampleModalHeader
            titleId={titleId}
            title={`${doc.doc.name} — Samples`}
            kind={kind}
            onKind={setKind}
            onClose={onClose}
          />
        ) : (
        <header className="flex flex-col gap-3 border-b border-grey-75 px-4 py-3 tablet:flex-row tablet:items-center tablet:justify-between tablet:px-5">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <h2 id={titleId} className="min-w-0 truncate text-base leading-5 font-bold text-black">
              {doc.doc.name} — Samples
            </h2>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-sm)] text-black hover:bg-grey-50 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
            >
              <img src={closeIcon} alt="" width={20} height={20} />
            </button>
          </div>
          <div className="flex rounded-full bg-grey-50 p-1 self-start tablet:self-auto">
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
        </header>
        )}
        {v35 ? (
          <SamplePdfViewer src={samplePdf(doc.doc.name)} title={doc.doc.name} />
        ) : (
          <>
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
          </>
        )}
    </>
  );
  if (v35) {
    return createPortal(
      <SheetFrame
        onClose={onClose}
        closeLabel="Close samples"
        titleId={titleId}
        fill
        wide
      >
        {body}
      </SheetFrame>,
      document.body,
    );
  }
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
        {body}
      </aside>
    </div>,
    document.body,
  );
}

