import { useLocation } from "react-router-dom";
import lockIcon from "@/assets/figma/lock.svg";
import { DlsTooltipTip } from "@/components/dls/Tooltip";
import { LmsJourneyNote } from "@/components/v31/LmsJourneyNote";
import { cn } from "@/lib/utils";
import { isV33Path, usesV35Flow } from "@/lib/process-v31-preview";
import type { QuizState } from "@/lib/process-planned-works-quiz";
import { isOptionOn } from "@/lib/process-planned-works-quiz";
import {
  NONE_ID,
  NOT_SURE_ID,
  V28_QUIZ_INTRO,
  setV28Check,
  setV28Choice,
  setV28Notes,
  setV28Text,
  setV28YesNo,
  v28Answer,
  v28ChoiceValue,
  v28FieldVisible,
  v28NotesValue,
  v28TextValue,
  v28VisibleSections,
  v28YesNoValue,
  type V28FieldId,
} from "@/lib/process-v28-quiz";

/** Unit facts LMS may already hold, so they could move to Tenancy Journey. */
const LMS_FIELDS = new Set<V28FieldId>(["q1", "q4"]);

const LABEL_CAPS =
  "text-xs leading-4 font-bold uppercase tracking-[0.08em] text-grey-400";

function CheckRow({
  label,
  on,
  disabled,
  exclusive,
  quiet,
  onToggle,
}: {
  label: string;
  on: boolean;
  disabled?: boolean;
  exclusive?: boolean;
  quiet?: boolean;
  onToggle: () => void;
}) {
  return (
    <label
      className={cn(
        "flex items-start gap-2 py-1.5",
        disabled ? "pointer-events-none cursor-default" : "cursor-pointer",
      )}
    >
      <input
        type="checkbox"
        checked={on}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : undefined}
        onChange={() => {
          if (disabled) return;
          onToggle();
        }}
        className={cn(
          "mt-0.5 size-4 shrink-0 rounded-[var(--radius-sm)] border-grey-300 text-purple-600 accent-purple-600 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]",
          disabled && "pointer-events-none",
        )}
      />
      <span
        className={cn(
          "text-sm leading-[18px]",
          on
            ? "font-bold text-black"
            : exclusive || disabled || quiet
              ? "text-grey-700"
              : "text-black",
        )}
      >
        {label}
      </span>
    </label>
  );
}

function RadioRow({
  name,
  value,
  label,
  on,
  disabled,
  quiet,
  onSelect,
}: {
  name: string;
  value: string;
  label: string;
  on: boolean;
  disabled?: boolean;
  quiet?: boolean;
  onSelect: () => void;
}) {
  return (
    <label
      className={cn(
        "inline-flex items-start gap-2 py-1.5",
        disabled ? "pointer-events-none cursor-default" : "cursor-pointer",
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={on}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : undefined}
        onChange={() => {
          if (disabled) return;
          onSelect();
        }}
        className={cn(
          "mt-0.5 size-4 accent-purple-600 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]",
          disabled && "pointer-events-none",
        )}
      />
      <span
        className={cn(
          "text-sm leading-[18px]",
          on
            ? "font-bold text-black"
            : disabled || quiet
              ? "text-grey-700"
              : "text-black",
        )}
      >
        {label}
      </span>
    </label>
  );
}

function SectionHead({ title, friendly }: { title: string; friendly?: boolean }) {
  if (!friendly) {
    return <h3 className={LABEL_CAPS}>{title}</h3>;
  }
  const numbered = title.match(/^(\d+)\.\s*(.*)$/);
  if (!numbered) {
    return (
      <h3 className="text-lg leading-[22px] font-bold text-black">{title}</h3>
    );
  }
  return (
    <h3 className="flex items-center gap-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-purple-100 text-sm leading-[18px] font-bold text-purple-700">
        {numbered[1]}
      </span>
      <span className="min-w-0 text-lg leading-[22px] font-bold text-black">
        {numbered[2]}
      </span>
    </h3>
  );
}

function fieldBox(friendly?: boolean, dense?: boolean) {
  if (dense) return "flex flex-col gap-1";
  return cn("flex flex-col gap-2", friendly && "pt-4");
}

export function QuizChecklistV28({
  state,
  disabled,
  locked,
  note,
  intro,
  friendly,
  plain,
  dense,
  onChange,
}: {
  state: QuizState;
  disabled?: boolean;
  locked?: boolean;
  note?: string | null;
  intro?: string | null;
  friendly?: boolean;
  /** v35: drop Not sure / None of the above, roomier type. */
  plain?: boolean;
  /** v37 read-only review: question as a quiet label, answer as the value. */
  dense?: boolean;
  onChange: (next: QuizState) => void;
}) {
  const readOnly = disabled || locked;
  const v33 = isV33Path(useLocation().pathname);
  const v35 = plain || usesV35Flow(useLocation().pathname);
  const compact = Boolean(dense && locked);
  const promptClass = compact
    ? "text-sm leading-5 text-grey-600"
    : v35
      ? "text-base leading-6 font-bold text-black"
      : "text-sm leading-[18px] font-bold text-black";
  const answerClass = compact
    ? "text-base leading-6 text-black"
    : "text-sm leading-[18px] text-grey-700";
  const sections = v28VisibleSections(state);
  const lockNote =
    note === null
      ? null
      : (note ??
        (disabled && !locked
          ? "Your contractor fills in these answers."
          : null));
  const introText = intro === undefined ? V28_QUIZ_INTRO : intro;
  const lockMark = (
    <span
      aria-hidden
      className={cn("block size-4 shrink-0", v35 ? "mt-0.5 bg-warning-800" : "bg-grey-600")}
      style={{
        WebkitMaskImage: `url("${lockIcon}")`,
        maskImage: `url("${lockIcon}")`,
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
      }}
    />
  );
  const lockBanner = lockNote ? (
    v35 ? (
      <div
        role="note"
        className={cn(
          "flex items-start gap-3 rounded-[var(--radius-xl)] bg-warning-100 px-4 py-3",
          friendly && "mb-6",
        )}
      >
        {lockMark}
        <div className="min-w-0">
          <p className="text-sm leading-[18px] font-bold text-warning-800">View only</p>
          <p className="mt-0.5 text-sm leading-5 text-grey-800">{lockNote}</p>
        </div>
      </div>
    ) : (
      <div className={cn("flex items-center gap-1.5", friendly && "mb-6")}>
        {lockMark}
        <p className="text-sm leading-[18px] font-bold text-grey-700">View only</p>
        <DlsTooltipTip label="View only" text={lockNote} mode="dark" />
      </div>
    )
  ) : null;

  return (
    <div className={cn("flex flex-col", friendly ? "gap-0" : "gap-8")}>
      {introText ? (
        <div className="flex flex-col gap-3">
          <p className="text-base leading-6 text-grey-800">{introText}</p>
          {lockBanner}
        </div>
      ) : (
        lockBanner
      )}
      {sections.map((section) => (
        <section
          key={section.id}
          className={cn(
            "flex flex-col",
            friendly
              ? compact
                ? "gap-4 border-t border-grey-100 py-6 first:border-t-0 first:pt-0 last:pb-0"
                : v35
                ? "gap-3 border-t border-grey-100 py-6 first:border-t-0 first:pt-0 last:pb-0"
                : "gap-1 border-t border-grey-100 py-6 first:border-t-0 first:pt-0 last:pb-0"
              : "gap-5",
          )}
        >
          <SectionHead title={section.title} friendly={friendly} />
          {section.fields.map((field) => {
            if (field.kind === "choice") {
              const value = v28ChoiceValue(state, field.id);
              return (
                <div key={field.id} className={fieldBox(friendly, compact)}>
                  {v33 && LMS_FIELDS.has(field.id) ? (
                    <LmsJourneyNote subject="question" />
                  ) : null}
                  <p className={promptClass}>
                    {field.prompt}
                  </p>
                  {locked ? (
                    <p className={answerClass}>
                      {value === "other"
                        ? v28ChoiceValue(state, "q1-other") || "Other"
                        : field.options.find((option) => option.id === value)
                            ?.label || "—"}
                    </p>
                  ) : (
                    <div className="flex flex-col">
                      {field.options
                        .filter((option) => !v35 || option.id !== NOT_SURE_ID)
                        .map((option) => (
                        <RadioRow
                          key={option.id}
                          name={field.id}
                          value={option.id}
                          label={option.label}
                          on={value === option.id}
                          disabled={readOnly}
                          quiet={friendly}
                          onSelect={() =>
                            onChange(setV28Choice(state, field.id, option.id))
                          }
                        />
                      ))}
                    </div>
                  )}
                  {field.allowOther &&
                  v28FieldVisible(state, "q1-other") &&
                  !locked ? (
                    <input
                      type="text"
                      value={v28ChoiceValue(state, "q1-other")}
                      disabled={readOnly}
                      placeholder="Please specify"
                      onChange={(event) =>
                        onChange(setV28Choice(state, "q1-other", event.target.value))
                      }
                      className="mt-1 h-10 w-full rounded-[var(--radius-2xl)] border border-grey-200 bg-white px-3 text-sm leading-[18px] text-black focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
                    />
                  ) : null}
                </div>
              );
            }

            if (field.kind === "yesno") {
              const value = v28YesNoValue(state, field.id);
              return (
                <div key={field.id} className={fieldBox(friendly, compact)}>
                  <p className={promptClass}>
                    {field.prompt}
                  </p>
                  {locked ? (
                    <p className={answerClass}>
                      {value === "yes"
                        ? "Yes"
                        : value === "no"
                          ? "No"
                          : value === "not-sure"
                            ? "Not sure"
                            : "—"}
                    </p>
                  ) : (
                    <div className="flex flex-wrap items-center gap-x-5">
                      {(
                        (
                          v35
                            ? [
                                ["yes", "Yes"],
                                ["no", "No"],
                              ]
                            : [
                                ["yes", "Yes"],
                                ["no", "No"],
                                ["not-sure", "Not sure"],
                              ]
                        ) as readonly [string, string][]
                      ).map(([id, label]) => (
                        <RadioRow
                          key={id}
                          name={field.id}
                          value={id}
                          label={label}
                          on={value === id}
                          disabled={readOnly}
                          quiet={friendly}
                          onSelect={() =>
                            onChange(
                              setV28YesNo(
                                state,
                                field.id,
                                id as "yes" | "no" | "not-sure",
                              ),
                            )
                          }
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            if (field.kind === "text") {
              const value = v28TextValue(state, field.id);
              const rows = field.rows ?? 1;
              return (
                <div key={field.id} className={fieldBox(friendly, compact)}>
                  <p className={promptClass}>
                    {field.prompt}
                    {field.required ? (
                      <span className="text-error-600" aria-hidden>
                        {" "}
                        *
                      </span>
                    ) : null}
                  </p>
                  {locked ? (
                    <p className={answerClass}>
                      {value || "—"}
                    </p>
                  ) : rows > 1 ? (
                    <textarea
                      value={value}
                      disabled={readOnly}
                      rows={rows}
                      placeholder={field.placeholder}
                      required={field.required}
                      aria-required={field.required || undefined}
                      onChange={(event) =>
                        onChange(setV28Text(state, field.id, event.target.value))
                      }
                      className="w-full rounded-[var(--radius-2xl)] border border-grey-200 bg-white px-3 py-2 text-sm leading-[18px] text-black placeholder:text-grey-400 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
                    />
                  ) : (
                    <input
                      type="text"
                      value={value}
                      disabled={readOnly}
                      placeholder={field.placeholder}
                      required={field.required}
                      aria-required={field.required || undefined}
                      onChange={(event) =>
                        onChange(setV28Text(state, field.id, event.target.value))
                      }
                      className="h-10 w-full rounded-[var(--radius-2xl)] border border-grey-200 bg-white px-3 text-sm leading-[18px] text-black placeholder:text-grey-400 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
                    />
                  )}
                </div>
              );
            }

            if (field.kind === "notes") {
              const value = v28NotesValue(state);
              return (
                <div key={field.id} className={fieldBox(friendly, compact)}>
                  <p className={promptClass}>
                    {field.prompt}
                  </p>
                  {locked ? (
                    <p className={answerClass}>
                      {value || "—"}
                    </p>
                  ) : (
                    <textarea
                      value={value}
                      disabled={readOnly}
                      rows={4}
                      onChange={(event) =>
                        onChange(setV28Notes(state, event.target.value))
                      }
                      className="w-full rounded-[var(--radius-2xl)] border border-grey-200 bg-white px-3 py-2 text-sm leading-[18px] text-black focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
                    />
                  )}
                </div>
              );
            }

            const exclusive = v35
              ? (field.exclusive ?? []).filter(
                  (id) => id !== NONE_ID && id !== NOT_SURE_ID,
                )
              : (field.exclusive ?? [NONE_ID, NOT_SURE_ID]);
            const extraExclusive = v35
              ? []
              : exclusive.filter(
                  (id) => !field.options.some((option) => option.id === id),
                );
            const answer = v28Answer(state, field.id);
            const picked = field.options
              .filter((option) => isOptionOn(answer, option.id))
              .map((option) => option.label);
            return (
              <div key={field.id} className={fieldBox(friendly, compact)}>
                {v33 && LMS_FIELDS.has(field.id) ? (
                  <LmsJourneyNote subject="question" />
                ) : null}
                <p className={promptClass}>
                  {field.prompt}
                </p>
                {locked && compact && picked.length > 1 ? (
                  <ul className="flex flex-col gap-1">
                    {picked.map((label) => (
                      <li key={label} className={answerClass}>
                        {label}
                      </li>
                    ))}
                  </ul>
                ) : locked ? (
                  <p className={answerClass}>
                    {picked.length > 0 ? picked.join(", ") : "—"}
                  </p>
                ) : (
                <div className="flex flex-col">
                  {field.options.map((option) => (
                    <CheckRow
                      key={option.id}
                      label={option.label}
                      exclusive={exclusive.includes(option.id)}
                      on={isOptionOn(answer, option.id)}
                      disabled={readOnly}
                      quiet={friendly}
                      onToggle={() =>
                        onChange(setV28Check(state, field.id, option.id))
                      }
                    />
                  ))}
                  {extraExclusive.map((id) => (
                    <CheckRow
                      key={id}
                      exclusive
                      quiet={friendly}
                      label={id === NONE_ID ? "None of the above" : "Not sure"}
                      on={
                        id === NONE_ID
                          ? answer.kind === "none"
                          : isOptionOn(answer, id) || answer.kind === "not-sure"
                      }
                      disabled={readOnly}
                      onToggle={() =>
                        onChange(setV28Check(state, field.id as V28FieldId, id))
                      }
                    />
                  ))}
                </div>
                )}
              </div>
            );
          })}
        </section>
      ))}
    </div>
  );
}
