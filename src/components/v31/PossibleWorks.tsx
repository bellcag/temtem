import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import { isV33Path, usesV37Cut, usesV35Flow, usesV36Chrome } from "@/lib/process-v31-preview";
import { cn } from "@/lib/utils";
import { V33_BEFORE_APPLY } from "@/lib/process-v33-feed";
import closeIcon from "@/assets/figma/close.svg";
import infoIcon from "@/assets/figma/info.svg";
import type { Unit } from "@/lib/tenancy-data";
import {
  extraPermitsForSlug,
  PLANNED_WORKS_QUESTIONS,
} from "@/lib/process-planned-works-quiz";

const EXIT_STAGES = [
  "Scope of Works",
  "Pre-application",
  "Permit Application",
];

const RENOVATION_STAGES = [
  "Scope of Works",
  "Pre-application",
  "Permit Application",
  "Pre-opening",
];

const STAGE_COPY: Record<string, { line: string }> = {
  "Scope of Works": {
    line: "Describe what this renovation includes, so we know which permits and checks apply.",
  },
  "Pre-application": {
    line: "Steps that apply to this unit or work, such as a Joint Site Inspection when alarms can be set off or isolated.",
  },
  "Permit Application": {
    line: "Upload and check the documents, submit in OneCalendar, then wait for review.",
  },
  "Pre-opening": {
    line: "The briefing, the work on site, and the closing checks that apply to this work.",
  },
};

function permitNeed(permits: string[]) {
  if (permits.length === 1) return `Needs ${permits[0]}.`;
  const earlier = permits.slice(0, -1).join(", ");
  return `Needs ${earlier} and ${permits[permits.length - 1]}.`;
}

function possiblePermits(unit: Unit) {
  const rows: { work: string; permits: string[] }[] = [];
  const seen = new Set<string>();
  for (const question of PLANNED_WORKS_QUESTIONS) {
    for (const option of question.options) {
      if (option.terminals && !option.terminals.includes(unit.terminal)) continue;
      if (option.tenancyTypes && !option.tenancyTypes.includes(unit.tenancyType)) {
        continue;
      }
      for (const name of extraPermitsForSlug(option.id, unit)) {
        if (seen.has(name)) continue;
        seen.add(name);
        rows.push({
          work:
            name === "BIM model"
              ? "Structural changes, or changes to wiring, air-con, plumbing, sprinklers, or PA"
              : option.label,
          permits: [name],
        });
      }
    }
  }
  return rows;
}

function AheadRow({
  index,
  title,
  detail,
  heading,
  tertiary,
}: {
  index: number;
  title: string;
  detail: string;
  heading?: boolean;
  tertiary?: boolean;
}) {
  const Title = heading ? "h3" : "p";
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-purple-200 text-xs leading-4 font-bold text-purple-700">
        {index + 1}
      </span>
      <div className="min-w-0">
        <Title className="text-sm leading-[18px] font-bold text-black">{title}</Title>
        <p className={cn("mt-1 text-xs leading-4", tertiary ? "text-grey-500" : "text-grey-400")}>
          {detail}
        </p>
      </div>
    </li>
  );
}

export function PossibleWorks({
  cardId,
  unit,
}: {
  cardId: string;
  unit: Unit;
}) {
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<"steps" | "permits">("steps");
  const titleId = useId();
  const pathname = useLocation().pathname;
  const v33 = isV33Path(pathname);
  const v35 = usesV35Flow(pathname);
  const v36 = usesV36Chrome(pathname);
  const exit = cardId === "exit-works" && !usesV37Cut(pathname);
  const stages = exit ? EXIT_STAGES : RENOVATION_STAGES;
  const permits = [
    exit
      ? {
          work: "Removing the fit-out",
          permits: ["Reinstatement Permit to Work"],
        }
      : {
          work: "The renovation of this unit",
          permits: ["Renovation (Terminal) permit"],
        },
    ...possiblePermits(unit),
  ];
  const stepIntro = exit
    ? "Removing the fit-out follows these steps, from what the work includes to the permit review."
    : "Every renovation follows these steps, from what the work includes to the checks before opening.";
  const permitIntro = exit
    ? permits.length > 0
      ? "Removing the fit-out is filed under the Reinstatement Permit to Work, with extra permits only if the work includes them."
      : "Removing the fit-out is filed under the Reinstatement Permit to Work."
    : permits.length > 0
      ? "Every renovation is filed under Tenancy Project work, with extra permits only if the work includes them."
      : "Every renovation is filed under Tenancy Project work.";

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          setPanel("steps");
          setOpen(true);
        }}
        className={cn(
          "inline-flex w-fit items-center rounded-[var(--radius-sm)] text-left font-bold text-purple-600 hover:text-purple-700 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]",
          v35 ? "h-8 gap-1.5 text-sm leading-[18px]" : "h-6 gap-1 text-xs leading-4",
        )}
      >
        <span
          aria-hidden
          className={cn("block shrink-0 bg-current", v35 ? "size-4" : "size-3")}
          style={{
            WebkitMaskImage: `url("${infoIcon}")`,
            maskImage: `url("${infoIcon}")`,
            WebkitMaskSize: "contain",
            maskSize: "contain",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
          }}
        />
        {v35 ? "What's Ahead" : "Steps and Permits"}
      </button>
      {open
        ? createPortal(
            <div className="fixed inset-0 z-[60] flex items-end justify-center tablet:items-center tablet:p-8">
              <button
                type="button"
                aria-label="Close steps and permits"
                className="absolute inset-0 bg-[rgba(18,18,18,0.4)]"
                onClick={() => setOpen(false)}
              />
              <aside
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className={cn(
                  "relative flex max-h-[80vh] w-full flex-col rounded-t-[var(--radius-xl)] bg-white shadow-[var(--shadow-light-bg)] tablet:rounded-[var(--radius-xl)]",
                  v36 ? "tablet:max-w-[640px]" : "tablet:max-w-md",
                )}
              >
                <header className={cn("flex items-start justify-between gap-3", v36 ? "px-6 py-4" : "px-4 py-3")}>
                  <div className="min-w-0">
                    <h2 id={titleId} className="text-[20px] leading-7 font-bold text-black">
                      Steps and Permits
                    </h2>
                    <p className="mt-1 text-sm leading-5 text-grey-600">
                      {exit
                        ? "The steps for removing the fit-out, and the permits this unit needs."
                        : "The steps for this renovation, and the permits this unit needs."}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="Close"
                    onClick={() => setOpen(false)}
                    className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-md)] text-black hover:bg-grey-50 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
                  >
                    <img src={closeIcon} alt="" width={16} height={16} />
                  </button>
                </header>
                <div className="flex min-h-0 flex-1 flex-col">
                  <div
                    role="tablist"
                    aria-label="Steps and permits"
                    className={cn("flex gap-1 border-b border-grey-75", v36 ? "px-6" : "px-4")}
                  >
                    {(
                      [
                        ["steps", "Steps"],
                        ["permits", "Permits"],
                      ] as const
                    ).map(([id, label]) => {
                      const selected = panel === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          role="tab"
                          aria-selected={selected}
                          onClick={() => setPanel(id)}
                          className={
                            selected
                              ? "border-b-2 border-purple-600 px-1 py-2 text-sm leading-[18px] font-bold text-purple-600 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
                              : "border-b-2 border-transparent px-1 py-2 text-sm leading-[18px] font-bold text-grey-500 hover:text-black focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
                          }
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                  <div
                    role="tabpanel"
                    className={cn("min-h-0 overflow-y-auto", v36 ? "px-6 pt-8 pb-6" : "px-4 py-4")}
                  >
                    {panel === "steps" ? (
                      <>
                        <p className="text-sm leading-[18px] text-grey-600">{stepIntro}</p>
                        <ul className="mt-6 flex flex-col gap-4">
                          {stages.map((label, index) => {
                            const copy =
                              (exit && label === "Scope of Works"
                                ? {
                                    line: "Describe the work to remove the fit-out, so we know which permits and checks apply.",
                                  }
                                : exit && label === "Permit Application"
                                  ? {
                                      line: "Apply in OneCalendar to remove the fit-out, then wait for review.",
                                    }
                                  : STAGE_COPY[label]) ?? { line: "" };
                            return (
                              <AheadRow
                                key={label}
                                index={index}
                                heading
                                tertiary={v36}
                                title={
                                  v33 && label === "Pre-application" ? V33_BEFORE_APPLY : label
                                }
                                detail={copy.line}
                              />
                            );
                          })}
                        </ul>
                      </>
                    ) : (
                      <>
                        <p className="text-sm leading-[18px] text-grey-600">{permitIntro}</p>
                        {permits.length > 0 ? (
                          v35 ? (
                            <ul className="mt-6 flex flex-col gap-4">
                              {permits.map((row, index) => (
                                <AheadRow
                                  key={`${row.work}-${row.permits[0]}`}
                                  index={index}
                                  tertiary={v36}
                                  title={row.work}
                                  detail={permitNeed(row.permits)}
                                />
                              ))}
                            </ul>
                          ) : (
                            <ul className="mt-6 overflow-hidden rounded-[var(--radius-md)] border border-grey-200">
                              {permits.map((row, index) => (
                                <li
                                  key={`${row.work}-${row.permits[0]}`}
                                  className={
                                    index > 0
                                      ? "flex flex-col gap-0.5 border-t border-grey-200 px-3 py-2"
                                      : "flex flex-col gap-0.5 px-3 py-2"
                                  }
                                >
                                  <p className="text-sm leading-5 font-bold text-black">{row.work}</p>
                                  <p className="text-xs leading-4 text-grey-600">
                                    {permitNeed(row.permits)}
                                  </p>
                                </li>
                              ))}
                            </ul>
                          )
                        ) : null}
                      </>
                    )}
                  </div>
                </div>
              </aside>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
