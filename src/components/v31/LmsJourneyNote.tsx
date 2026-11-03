import { useId, useState } from "react";
import caretDown from "@/assets/figma/caret-down.svg";

export function LmsJourneyNote({
  subject = "step",
}: {
  subject?: "step" | "question";
}) {
  const [open, setOpen] = useState(false);
  const bodyId = useId();

  return (
    <div className="rounded-[var(--radius-md)] bg-[#CFFAFE]">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen((shown) => !shown)}
        className="flex w-full items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-left focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_#0E7490]"
      >
        <span className="min-w-0 flex-1 text-sm leading-[18px] font-bold text-pretty text-[#0E7490]">
          Note to Stakeholders & Team
        </span>
        <span
          aria-hidden
          className="block size-3.5 shrink-0 bg-[#0E7490]"
          style={{
            WebkitMaskImage: `url("${caretDown}")`,
            maskImage: `url("${caretDown}")`,
            WebkitMaskSize: "10px 7px",
            maskSize: "10px 7px",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            transform: open ? "rotate(0deg)" : "rotate(-90deg)",
          }}
        />
      </button>
      {open ? (
      <div id={bodyId} className="flex items-start gap-2 px-3 pb-2">
        <span className="mt-px inline-flex shrink-0 items-center rounded-full bg-white px-2 py-0.5 text-xs leading-4 font-bold text-[#0E7490]">
          LMS
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-xs leading-4 text-[#0E7490]">
            {subject === "question"
              ? "If the system can auto-determine airside / landside / category from LMS, the steps these options trigger belong on Tenancy Journey — not in the project."
              : "If the system can auto-determine airside / landside / category from LMS, this step belongs on Tenancy Journey — not in the project."}
          </p>
          {subject === "step" ? (
            <p className="text-xs leading-4 text-[#0E7490]">
              Every step in the blueprint is mandatory by default. A step only
              drops out where the blueprint's right-most columns already name the
              condition — the unit's airside / landside status, or its tenancy
              category.
            </p>
          ) : null}
        </div>
      </div>
      ) : null}
    </div>
  );
}
