import { cn } from "@/lib/utils";
import type { PlannedWorkSlug, Unit } from "@/lib/tenancy-data";
import type { QuestionId, QuizState } from "@/lib/process-planned-works-quiz";
import {
  V25_QUIZ_SECTIONS,
  choiceValue,
  type V25Section,
  type V25YesNoField,
  yesNoValue,
} from "@/lib/process-v25-quiz";
import exclamationAlert from "@/assets/figma/exclamation-alert.svg";

const LABEL_CAPS =
  "text-xs leading-4 font-bold uppercase tracking-[0.08em] text-grey-400";

function Hint({ text, inline }: { text?: string; inline?: boolean }) {
  if (!text) return null;
  return (
    <span
      className={cn(
        "inline-flex items-start gap-1 text-xs leading-4 text-warning-800",
        inline ? "shrink-0 text-right" : "mt-1",
      )}
    >
      <span
        aria-hidden
        className="mt-0.5 block size-3 shrink-0 bg-warning-800"
        style={{
          WebkitMaskImage: `url("${exclamationAlert}")`,
          maskImage: `url("${exclamationAlert}")`,
          WebkitMaskSize: "12px 12px",
          maskSize: "12px 12px",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskPosition: "center",
        }}
      />
      <span>{text}</span>
    </span>
  );
}

function CheckRow({
  label,
  hint,
  on,
  disabled,
  onToggle,
}: {
  label: string;
  hint?: string;
  on: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <label
      className={cn(
        "flex items-start gap-2 py-1.5",
        disabled ? "cursor-default" : "cursor-pointer",
      )}
    >
      <input
        type="checkbox"
        checked={on}
        disabled={disabled}
        onChange={onToggle}
        className="mt-0.5 size-4 shrink-0 rounded-[var(--radius-sm)] border-grey-300 text-purple-600 accent-purple-600 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
      />
      <span className="flex min-w-0 flex-1 items-start justify-between gap-3">
        <span className="text-sm leading-[18px] text-black">{label}</span>
        <Hint text={hint} inline />
      </span>
    </label>
  );
}

function YesNoRow({
  value,
  disabled,
  onChange,
}: {
  value: boolean | null;
  disabled?: boolean;
  onChange: (yes: boolean) => void;
}) {
  return (
    <div className="mt-2 flex items-center gap-5">
      {[
        { label: "Yes", yes: true },
        { label: "No", yes: false },
      ].map((row) => (
        <label
          key={row.label}
          className={cn(
            "inline-flex items-center gap-2 text-sm leading-[18px] text-black",
            disabled ? "cursor-default" : "cursor-pointer",
          )}
        >
          <input
            type="radio"
            checked={value === row.yes}
            disabled={disabled}
            onChange={() => onChange(row.yes)}
            className="size-4 accent-purple-600 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
          />
          {row.label}
        </label>
      ))}
    </div>
  );
}

export function QuizChecklistV25({
  state,
  unit,
  disabled,
  locked,
  sections = V25_QUIZ_SECTIONS,
  onChoice,
  onCheck,
  onYesNo,
}: {
  state: QuizState;
  unit: Unit;
  disabled?: boolean;
  locked?: boolean;
  sections?: V25Section[];
  onChoice: (id: QuestionId, value: string) => void;
  onCheck: (id: QuestionId, slug: PlannedWorkSlug) => void;
  onYesNo: (field: V25YesNoField, yes: boolean) => void;
}) {
  return (
    <div className="flex flex-col gap-8">
      {sections.map((section) => (
        <section key={section.id} className="flex flex-col gap-5">
          <h3 className={LABEL_CAPS}>{section.title}</h3>
          {section.fields.map((field) => {
            if (field.kind === "choice") {
              const value = choiceValue(
                state.answers[field.id],
                field.fallback?.(unit) ?? "",
              );
              return (
                <div key={field.id} className="flex flex-col gap-2">
                  <p className="text-sm leading-[18px] font-bold text-black">
                    {field.prompt}
                  </p>
                  {locked ? (
                    <p className="text-sm leading-[18px] text-grey-700">
                      {value || "—"}
                    </p>
                  ) : (
                    <select
                      value={value}
                      disabled={disabled}
                      onChange={(event) => onChoice(field.id, event.target.value)}
                      className="h-10 w-full rounded-[var(--radius-2xl)] border border-grey-200 bg-white px-3 text-sm leading-[18px] text-black focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
                    >
                      <option value="">—</option>
                      {field.options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              );
            }
            if (field.kind === "yesno") {
              const value = yesNoValue(
                state.answers[field.questionId],
                field.slug,
                field.invert,
              );
              return (
                <div key={field.id} className="flex flex-col">
                  <p className="text-sm leading-[18px] font-bold text-black">
                    {field.prompt}{" "}
                    <Hint text={field.hint} inline />
                  </p>
                  {locked ? (
                    <p className="mt-2 text-sm leading-[18px] text-grey-700">
                      {value === null ? "—" : value ? "Yes" : "No"}
                    </p>
                  ) : (
                    <YesNoRow
                      value={value}
                      disabled={disabled}
                      onChange={(yes) => onYesNo(field, yes)}
                    />
                  )}
                </div>
              );
            }
            return (
              <div key={field.id} className="flex flex-col">
                <p className="text-sm leading-[18px] font-bold text-black">
                  {field.prompt}
                </p>
                <div className="mt-2 flex flex-col">
                  {field.options.map((option) => (
                    <CheckRow
                      key={option.id}
                      label={option.label}
                      hint={option.hint}
                      on={Boolean(yesNoValue(state.answers[field.id], option.id))}
                      disabled={disabled || locked}
                      onToggle={() => onCheck(field.id, option.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      ))}
    </div>
  );
}
