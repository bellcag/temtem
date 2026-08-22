import { ChevronDown, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import {
  contractorPathTotal,
  type ContractorPathStep,
} from "@/lib/contractor-path";
import { PHASE_FACE, faceRule, ruleBadge } from "@/lib/journey-voice";
import { cn } from "@/lib/utils";

export function ContractorStepCard({
  step,
  showDetails,
  onToggleDetails,
  onPrev,
  onNext,
  nextTitle,
}: {
  step: ContractorPathStep;
  showDetails: boolean;
  onToggleDetails: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  nextTitle?: string;
}) {
  const total = contractorPathTotal();
  const shownRules = step.rules.filter((r) =>
    showDetails ? true : r.rank !== "only-if" || step.rules.length <= 3,
  );
  const hiddenOnlyIf =
    !showDetails && step.rules.length > 3
      ? step.rules.filter((r) => r.rank === "only-if")
      : [];

  return (
    <article
      id={`card-${step.id}`}
      className={cn(
        "scroll-mt-20 rounded-[var(--radius-md)] border border-l-4 bg-white p-4 tablet:p-6 desktop:scroll-mt-8 desktop:p-8",
        step.wait
          ? "border-grey-100 border-l-grey-400 shadow-[var(--shadow-light-bg)]"
          : "border-purple-300 border-l-purple-600 bg-purple-100/40 shadow-[var(--shadow-light-bg)]",
      )}
    >
      <header className="border-b border-grey-75 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-[var(--radius-sm)] bg-purple-600 px-2 py-0.5 text-[11px] font-bold text-white">
            You&apos;re on {step.id} of {total}
          </span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-grey-500">
            {PHASE_FACE[step.phase]?.name ?? step.phase}
          </span>
          <span className="rounded-[var(--radius-sm)] bg-grey-75 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-grey-700">
            {step.stage}
          </span>
        </div>
        <h3 className="mt-2 text-base font-bold text-black desktop:text-lg desktop:leading-6">
          {step.title}
        </h3>
      </header>

      <section className="space-y-3 border-b border-grey-75 py-4">
        <Field label="When">{step.when}</Field>
        <Field label="What you do">{step.what}</Field>
        <Field label="How">{step.how}</Field>
      </section>

      {step.onlyIf.length > 0 && (
        <section className="border-b border-grey-75 py-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-grey-500">
            Only if
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-black">
            {step.onlyIf.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-3 border-b border-grey-75 py-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-grey-500">
          What you&apos;ll need
        </p>
        {step.needs.length === 0 ? (
          <p className="text-sm text-grey-600">
            {step.wait
              ? "Nothing for you to submit on this step."
              : "Nothing is listed for this step."}
          </p>
        ) : (
          <>
            <p className="text-sm text-black">
              To complete this step, you&apos;ll need:
            </p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-black">
              {step.needs.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </>
        )}
        {step.links.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {step.links.map((link) => (
              <button
                key={link.label}
                type="button"
                className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] bg-purple-600 px-3 py-2 text-sm font-bold text-white hover:bg-purple-700"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {link.label}
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3 border-b border-grey-75 py-4">
        <Field label="Done">{step.done}</Field>
        <Field label="What happens next">
          {nextTitle ?? "You've reached the last step in this guide."}
        </Field>
      </section>

      <section className="py-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-grey-500">
          For this step
        </p>
        {step.rules.length === 0 ? (
          <p className="mt-3 text-sm text-grey-600">
            {step.wait
              ? "You wait here. No extra rule is added for you."
              : "The attached guidelines don't add a rule for this step."}
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {shownRules.map((rule) => (
              <li
                key={`${rule.rank}-${rule.source}`}
                className="rounded-[var(--radius-sm)] border border-grey-100 bg-white p-3"
              >
                <span
                  className={cn(
                    "inline-flex rounded-[var(--radius-sm)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                    rule.rank === "must-do"
                      ? "bg-success-100 text-success-600"
                      : rule.rank === "must-not"
                        ? "bg-error-100 text-error-600"
                        : "bg-warning-100 text-warning-600",
                  )}
                >
                  {ruleBadge(rule.rank)}
                </span>
                <p className="mt-2 text-sm leading-relaxed text-black">
                  {faceRule(rule.line)}
                </p>
                {showDetails && (
                  <p className="mt-2 text-xs leading-relaxed text-grey-500">
                    {rule.source} — “{rule.quote}”
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
        {hiddenOnlyIf.length > 0 && (
          <p className="mt-3 text-xs font-semibold text-grey-500">
            {hiddenOnlyIf.length} Only if{" "}
            {hiddenOnlyIf.length === 1 ? "condition" : "conditions"} sit under
            More about this step
          </p>
        )}
      </section>

      <button
        type="button"
        onClick={onToggleDetails}
        className="inline-flex items-center gap-1 text-sm font-bold text-purple-700 hover:text-purple-800"
      >
        <ChevronDown className={cn("h-4 w-4", showDetails && "rotate-180")} />
        {showDetails ? "Hide extra detail" : "More about this step"}
      </button>

      <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-grey-75 pt-4">
        <button
          type="button"
          disabled={!onPrev}
          onClick={onPrev}
          className="inline-flex items-center gap-1 text-sm font-bold text-purple-700 disabled:text-grey-300"
        >
          <ChevronLeft className="h-4 w-4" />
          Go back
        </button>
        <button
          type="button"
          disabled={!onNext}
          onClick={onNext}
          className="inline-flex items-center gap-1 text-sm font-bold text-purple-700 disabled:text-grey-300"
        >
          Continue
          <ChevronRight className="h-4 w-4" />
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
      <div className="text-[10px] font-bold uppercase tracking-wider text-grey-500">
        {label}
      </div>
      <div className="mt-1 text-sm leading-relaxed text-black">{children}</div>
    </div>
  );
}
