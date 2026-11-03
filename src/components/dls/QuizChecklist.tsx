import {
  QUIZ_SECTION_LABEL,
  isOptionOn,
  NONE_ID,
  NOT_SURE_ID,
  quizUnitLine,
  type QuestionAnswer,
  type QuestionId,
  type QuizQuestion,
  type QuizState,
} from "@/lib/process-planned-works-quiz";
import type { Unit } from "@/lib/tenancy-data";
import { cn } from "@/lib/utils";

export function QuizCheckRow({
  label,
  hint,
  on,
  exclusive,
  disabled,
  onToggle,
}: {
  label: string;
  hint?: string;
  on: boolean;
  exclusive?: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={on}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={cn(
        "flex w-full items-center gap-3 px-3 py-4 text-left",
        "border-t border-grey-100 first:border-t-0",
        "focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--color-purple-600)]",
        disabled ? "cursor-default" : "cursor-pointer",
        on && "bg-purple-100",
        exclusive && "bg-grey-25",
        exclusive && on && "bg-purple-100",
      )}
    >
      <span
        className={cn(
          "grid size-4 shrink-0 aspect-square place-items-center rounded-[var(--radius-sm)] border",
          on ? "border-purple-600 bg-purple-600" : "border-grey-300 bg-white",
        )}
        aria-hidden
      >
        {on && (
          <span className="block h-1.5 w-2.5 -translate-y-px rotate-[-45deg] border-b-2 border-l-2 border-white" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block text-sm leading-[18px] font-bold",
            exclusive ? "text-grey-700" : "text-black",
            disabled && "text-grey-500",
          )}
        >
          {label}
        </span>
        {hint && (
          <span className="mt-1 block text-xs leading-4 text-warning-800">
            {hint}
          </span>
        )}
      </span>
    </button>
  );
}

export function QuizQuestionBlock({
  question,
  answer,
  unit,
  onToggle,
  allowUnsure = true,
  disabled,
  locked,
}: {
  question: QuizQuestion;
  answer: QuestionAnswer | undefined;
  unit?: Unit;
  onToggle: (questionId: QuestionId, optionId: string) => void;
  allowUnsure?: boolean;
  disabled?: boolean;
  locked?: boolean;
}) {
  const agreed = question.options
    .filter((opt) => isOptionOn(answer, opt.id))
    .map((opt) => opt.label);
  if (isOptionOn(answer, NONE_ID)) agreed.push("None of these");
  if (isOptionOn(answer, NOT_SURE_ID)) agreed.push("Not sure yet");

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <p className="text-xs leading-4 font-bold uppercase tracking-[0.08em] text-grey-400">
          {QUIZ_SECTION_LABEL[question.section]}
        </p>
        {question.section === "unit" && unit && (
          <p className="text-sm leading-[18px] text-grey-700">
            Already on this unit: {quizUnitLine(unit)}. Tick only what still needs
            confirming.
          </p>
        )}
        <p className="text-base leading-5 font-bold text-black">
          {question.prompt}
        </p>
      </div>
      {locked ? (
        <ul className="flex flex-col overflow-hidden rounded-[var(--radius-md)] border border-grey-100 bg-grey-25">
          {agreed.length > 0 ? (
            agreed.map((label) => (
              <li
                key={label}
                className="border-t border-grey-100 px-3 py-4 text-sm leading-[18px] font-bold text-black first:border-t-0"
              >
                {label}
              </li>
            ))
          ) : (
            <li className="px-3 py-4 text-sm leading-[18px] text-grey-600">
              Nothing agreed on this question.
            </li>
          )}
        </ul>
      ) : (
        <div className="flex flex-col overflow-hidden rounded-[var(--radius-md)] border border-grey-200 bg-white">
          {question.options.map((opt) => (
            <QuizCheckRow
              key={opt.id}
              label={opt.label}
              hint={opt.hint}
              on={isOptionOn(answer, opt.id)}
              disabled={disabled}
              onToggle={() => onToggle(question.id, opt.id)}
            />
          ))}
          <QuizCheckRow
            label="None of these"
            exclusive
            on={isOptionOn(answer, NONE_ID)}
            disabled={disabled}
            onToggle={() => onToggle(question.id, NONE_ID)}
          />
          {allowUnsure && (
            <QuizCheckRow
              label="Not sure yet"
              exclusive
              on={isOptionOn(answer, NOT_SURE_ID)}
              disabled={disabled}
              onToggle={() => onToggle(question.id, NOT_SURE_ID)}
            />
          )}
        </div>
      )}
    </div>
  );
}

export function QuizChecklistForm({
  questions,
  state,
  unit,
  onToggle,
  allowUnsure = true,
  disabled,
  locked,
}: {
  questions: QuizQuestion[];
  state: QuizState;
  unit?: Unit;
  onToggle: (questionId: QuestionId, optionId: string) => void;
  allowUnsure?: boolean;
  disabled?: boolean;
  locked?: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      {questions.map((question) => (
        <QuizQuestionBlock
          key={question.id}
          question={question}
          answer={state.answers?.[question.id]}
          unit={unit}
          onToggle={onToggle}
          allowUnsure={allowUnsure}
          disabled={disabled}
          locked={locked}
        />
      ))}
    </div>
  );
}
