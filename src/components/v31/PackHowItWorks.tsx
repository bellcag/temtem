import { useEffect, useId } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import { JourneyDialog } from "@/components/dls/SheetFrame";
import { usesV37Cut } from "@/lib/process-v31-preview";
import {
  Download,
  FileText,
  MessageSquare,
  RotateCw,
  Upload,
  type LucideIcon,
} from "lucide-react";
import closeIcon from "@/assets/figma/x-close.svg";
import helpIcon from "@/assets/figma/help-questions.svg";

const STEPS: { title: string; body: string; icon: LucideIcon }[] = [
  {
    title: "Answer questionnaire",
    body: "Tell us about your permit and planned works so we can tailor the screening to your application.",
    icon: MessageSquare,
  },
  {
    title: "View document checklist",
    body: "See which documents you'll need, along with helpful samples to guide you.",
    icon: FileText,
  },
  {
    title: "Upload documents & Screen",
    body: "Upload your completed documents and let the system check them against the requirements.",
    icon: Upload,
  },
  {
    title: "Fix errors & Re-screen",
    body: "If any issues are identified, make the suggested changes and upload your documents again for another check.",
    icon: RotateCw,
  },
  {
    title: "Download & Submit",
    body: "Download your results summary and screened documents, then submit them through OneCalendar.",
    icon: Download,
  },
];

export function PackHowItWorks({ onClose }: { onClose: () => void }) {
  const titleId = useId();
  const v37 = usesV37Cut(useLocation().pathname);
  useEffect(() => {
    if (v37) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, v37]);
  const shown = v37
    ? STEPS.filter((row) => row.title !== "View document checklist")
    : STEPS;
  const steps = (
    <ol className="flex flex-col">
      {shown.map((row, index) => {
        const Icon = row.icon;
        const last = index === shown.length - 1;
        return (
          <li key={row.title} className="flex gap-4">
            <span className="flex w-12 shrink-0 flex-col items-center">
              <span className="grid size-12 place-items-center rounded-full bg-grey-100 text-grey-700">
                <Icon aria-hidden size={20} />
              </span>
              {last ? null : <span className="my-1 w-px flex-1 bg-grey-200" aria-hidden />}
            </span>
            <span className={last ? "min-w-0 pt-1" : "min-w-0 pt-1 pb-4"}>
              <span className="block text-base leading-5 font-bold text-black">
                {row.title}
              </span>
              <span className="mt-1 block text-sm leading-[18px] text-grey-600">
                {row.body}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
  if (v37) {
    return createPortal(
      <JourneyDialog
        onClose={onClose}
        closeLabel="Close how this works"
        titleId={titleId}
        title="How does this work?"
        subtitle="Check the documents before you submit in OneCalendar."
      >
        {steps}
      </JourneyDialog>,
      document.body,
    );
  }

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
        className="relative flex max-h-[90vh] w-full max-w-[448px] flex-col gap-6 overflow-y-auto rounded-t-[var(--radius-2xl)] bg-white px-8 py-6 shadow-[var(--shadow-light-bg)] tablet:rounded-[var(--radius-2xl)]"
      >
        <div className="flex items-center gap-3">
          <img src={helpIcon} alt="" width={24} height={24} />
          <h2 id={titleId} className="min-w-0 flex-1 text-xl leading-8 font-bold text-black">
            How does this work?
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
        {steps}
      </aside>
    </div>,
    document.body,
  );
}
