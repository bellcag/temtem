import type { Role } from "@/lib/app-state";
import { v38ProjectGroups } from "@/lib/process-v38-guide";
import type { QuizState } from "@/lib/process-planned-works-quiz";
import type { Unit } from "@/lib/tenancy-data";

export function V38ProjectSteps({
  unit,
  role,
  quiz,
}: {
  unit: Unit;
  role: Role;
  quiz: QuizState;
}) {
  const groups = v38ProjectGroups(unit, role, quiz);
  return (
    <section className="mt-6 flex flex-col gap-3" aria-label="Project steps">
      <h2 className="text-base leading-5 font-bold text-black">Project steps</h2>
      {groups.length === 0 ? (
        <p className="text-sm leading-[18px] text-grey-700">
          Nothing in the project steps matches this unit and these answers.
        </p>
      ) : (
        <ol className="flex flex-col gap-3">
          {groups.map((group, index) => (
            <li
              key={group.id}
              className="flex flex-col gap-2 rounded-[var(--radius-lg)] border border-grey-200 bg-white px-4 py-3"
            >
              <p className="text-xs leading-4 text-grey-500">{group.stage}</p>
              <h3 className="text-sm leading-[18px] font-bold text-black">
                {index + 1}. {group.step}
              </h3>
              <ul className="flex flex-col gap-1">
                {group.tasks.map((task) => (
                  <li key={task} className="text-sm leading-[18px] text-grey-700">
                    {task}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
