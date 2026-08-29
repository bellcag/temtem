import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
} from "lucide-react";
import {
  contractorPathTotal,
  type ContractorPathStep,
} from "@/lib/contractor-path";
import { PHASE_FACE, faceRule, ruleBadge } from "@/lib/journey-voice";
import { cn } from "@/lib/utils";

function isFileNeed(item: string) {
  return /letter|drawing|report|form|template|guide|method of statement|risk assessment|notice|certificate|indemnity|schedule timeline|\bbim\b|hoarding support|as-built|\.pdf/i.test(
    item,
  );
}

function fileActionLabel(item: string) {
  const short = item.split("—")[0].split(",")[0].trim();
  return `Download ${short}`;
}

export function ContractorStepCard({
  step,
  showDetails,
  onToggleDetails,
  onPrev,
  onNext,
  nextTitle,
  phaseStep,
  phaseTotal,
}: {
  step: ContractorPathStep;
  showDetails: boolean;
  onToggleDetails: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  nextTitle?: string;
  phaseStep?: number;
  phaseTotal?: number;
}) {
  const total = contractorPathTotal();
  const shownRules = step.rules.filter((r) =>
    showDetails ? true : r.rank !== "only-if" || step.rules.length <= 3,
  );
  const hiddenOnlyIf =
    !showDetails && step.rules.length > 3
      ? step.rules.filter((r) => r.rank === "only-if")
      : [];
  const fileNeeds = step.needs.filter(isFileNeed);
  const otherNeeds = step.needs.filter((item) => !isFileNeed(item));
  const phaseLabel = PHASE_FACE[step.phase]?.name ?? step.phase;

  return (
    <article
      id={`card-${step.id}`}
      className={cn(
        "scroll-mt-20 rounded-[var(--radius-md)] border border-l-4 bg-white p-4 tablet:p-6 desktop:scroll-mt-8 desktop:p-8",
        step.wait
          ? "border-grey-100 border-l-grey-400 shadow-[var(--shadow-light-bg)]"
          : "border-grey-100 border-l-purple-600 shadow-[var(--shadow-light-bg)]",
      )}
    >
      <header className="border-b border-grey-100 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="dls-status-chip bg-purple-100 text-purple-700">
            {phaseStep && phaseTotal
              ? `${phaseStep} of ${phaseTotal} in ${phaseLabel}`
              : `You're on ${step.id} of ${total}`}
          </span>
          <span className="dls-caption">Path step {step.id} of {total}</span>
          <span className="dls-attr-chip">{step.stage}</span>
          {step.wait && (
            <span className="dls-status-chip bg-grey-75 text-grey-600">
              You wait
            </span>
          )}
        </div>
        <h3 className="mt-3 text-[18px] font-bold leading-[22px] text-grey-800 desktop:text-[20px] desktop:leading-7">
          {step.title}
        </h3>
      </header>

      <section className="space-y-4 border-b border-grey-100 py-4">
        <Field label="When">{step.when}</Field>
        <Field label="What you do">{step.what}</Field>
        <Field label="How">{step.how}</Field>
      </section>

      {step.onlyIf.length > 0 && (
        <section className="border-b border-grey-100 py-4">
          <p className="dls-caption">Only if</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {step.onlyIf.map((line) => (
              <li key={line} className="dls-body">
                {line}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-3 border-b border-grey-100 py-4">
        <p className="dls-caption">What you&apos;ll need</p>
        {step.needs.length === 0 && step.links.length === 0 ? (
          <p className="dls-body text-grey-500">
            {step.wait
              ? "Nothing for you to submit on this step."
              : "Nothing is listed for this step."}
          </p>
        ) : (
          <>
            {otherNeeds.length > 0 && (
              <>
                <p className="dls-body">To complete this step, you&apos;ll need:</p>
                <ul className="list-disc space-y-1 pl-5">
                  {otherNeeds.map((item) => (
                    <li key={item} className="dls-body">
                      {item}
                    </li>
                  ))}
                </ul>
              </>
            )}
            {fileNeeds.length > 0 && (
              <div>
                <p className="dls-caption">Files</p>
                <ul>
                  {fileNeeds.map((item) => (
                    <li key={item}>
                      <button type="button" className="dls-file-row">
                        <FileText className="h-5 w-5 shrink-0 text-purple-600" />
                        <span className="min-w-0 text-sm font-bold leading-[18px] desktop:text-base desktop:leading-5">
                          {item}
                        </span>
                        <span className="dls-file-action inline-flex items-center gap-1 text-sm font-bold text-purple-600">
                          <Download className="h-3.5 w-3.5 shrink-0" />
                          {fileActionLabel(item)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {step.links.length > 0 && (
              <div>
                <p className="dls-caption">Links</p>
                <ul>
                  {step.links.map((link) => (
                    <li key={link.label}>
                      <button type="button" className="dls-link-row">
                        <ExternalLink className="h-4 w-4 shrink-0" />
                        <span className="min-w-0 flex-1 text-sm desktop:text-base desktop:leading-5">
                          {link.label}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </section>

      <section className="space-y-4 border-b border-grey-100 py-4">
        <Field label="Done">{step.done}</Field>
        <Field label="What happens next">
          {nextTitle ?? "You've reached the last step in this guide."}
        </Field>
      </section>

      <section className="py-4">
        <p className="dls-caption">For this step</p>
        {step.rules.length === 0 ? (
          <p className="mt-3 dls-body text-grey-500">
            {step.wait
              ? "You wait here. No extra rule is added for you."
              : "The attached guidelines don't add a rule for this step."}
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {shownRules.map((rule) => (
              <li
                key={`${rule.rank}-${rule.source}`}
                className="rounded-[var(--radius-md)] border border-grey-100 bg-white p-3"
              >
                <span
                  className={cn(
                    "dls-status-chip",
                    rule.rank === "must-do"
                      ? "bg-success-100 text-success-600"
                      : rule.rank === "must-not"
                        ? "bg-error-100 text-error-600"
                        : "bg-warning-100 text-warning-600",
                  )}
                >
                  {ruleBadge(rule.rank)}
                </span>
                <p className="mt-2 dls-body">{faceRule(rule.line)}</p>
                {showDetails && (
                  <p className="mt-2 text-xs leading-4 text-grey-500">
                    {rule.source} — “{rule.quote}”
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
        {hiddenOnlyIf.length > 0 && (
          <p className="mt-3 text-xs font-semibold leading-4 text-grey-500">
            {hiddenOnlyIf.length} Only if{" "}
            {hiddenOnlyIf.length === 1 ? "condition" : "conditions"} sit under
            More about this step
          </p>
        )}
      </section>

      <button
        type="button"
        onClick={onToggleDetails}
        className="dls-btn-tertiary"
      >
        <ChevronDown className={cn("h-4 w-4", showDetails && "rotate-180")} />
        {showDetails ? "Hide extra detail" : "More about this step"}
      </button>

      <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-grey-100 pt-4">
        <button
          type="button"
          disabled={!onPrev}
          onClick={onPrev}
          className="dls-btn-tertiary"
        >
          <ChevronLeft className="h-4 w-4" />
          Go back
        </button>
        <button
          type="button"
          disabled={!onNext}
          onClick={onNext}
          className="dls-btn-primary max-w-[70%]"
        >
          <span className="min-w-0 truncate">
            {onNext && nextTitle
              ? `Continue to ${nextTitle}`
              : "Continue"}
          </span>
          <ChevronRight className="h-4 w-4 shrink-0" />
        </button>
      </footer>
    </article>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="dls-caption">{label}</div>
      <div className="mt-1 dls-body">{children}</div>
    </div>
  );
}
