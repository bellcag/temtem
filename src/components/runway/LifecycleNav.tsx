import { cn } from "@/lib/utils";
import type { Phase } from "@/lib/tenancy-data";
import { MicroLabel } from "./MicroLabel";

export type LifecycleNavStep = {
  kind: "you" | "context";
  stageName: string;
  stepName: string;
};

function stepFocusKey(stageName: string, stepName: string) {
  return `${stageName}::${stepName}`;
}

/**
 * Runway: gap — Lifecycle overview + steps-in-phase.
 * Closest: Progress Steps / Tabs (_excluded stubs). Chapter chrome for Process guide.
 */
export function LifecycleNav({
  phases,
  activeId,
  onSelectPhase,
  active,
  visibleStageCount,
  navSteps,
  focusedStep,
  onSelectStep,
}: {
  phases: Phase[];
  activeId: Phase["id"];
  onSelectPhase: (id: Phase["id"]) => void;
  active: Phase;
  visibleStageCount: number;
  navSteps: LifecycleNavStep[];
  focusedStep: string | null;
  onSelectStep: (stageName: string, stepName: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-[var(--radius-md)] border border-grey-100 bg-white shadow-[var(--shadow-light-bg)]">
      <div className="border-b border-grey-75 px-3 py-3 tablet:px-4">
        <MicroLabel>Lifecycle overview</MicroLabel>
      </div>

      <nav aria-label="Lifecycle phases">
        {/* Mobile: compact horizontal phases + steps below */}
        <div className="tablet:hidden">
          <ol className="flex gap-2 overflow-x-auto px-3 py-3">
            {phases.map((p, i) => {
              const isActive = p.id === activeId;
              return (
                <li key={p.id} className="min-w-0 shrink-0">
                  <button
                    type="button"
                    onClick={() => onSelectPhase(p.id)}
                    aria-current={isActive ? "true" : undefined}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-left transition",
                      isActive
                        ? "bg-purple-100 text-purple-700"
                        : "bg-grey-25 text-grey-700 hover:bg-grey-75 hover:text-grey-800",
                    )}
                  >
                    <span
                      className={cn(
                        "grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-black",
                        isActive
                          ? "bg-purple-600 text-white"
                          : "border border-grey-200 bg-white text-grey-600",
                      )}
                      title={`Phase ${i + 1}`}
                    >
                      <span className="sr-only">Phase </span>
                      {i + 1}
                    </span>
                    <span className="text-sm font-bold leading-[18px]">
                      {p.name}
                    </span>
                    <span
                      className={cn(
                        "text-xs font-bold",
                        isActive ? "text-purple-700" : "text-grey-500",
                      )}
                    >
                      · {p.stages.length}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
          <div className="border-t border-purple-100 bg-purple-100/40 px-3 py-3">
            <PhaseStepsPanel
              active={active}
              visibleStageCount={visibleStageCount}
              navSteps={navSteps}
              focusedStep={focusedStep}
              onSelectStep={onSelectStep}
            />
          </div>
        </div>

        {/* Tablet+: phases with steps anchored under the selected phase */}
        <ol className="hidden tablet:block">
          {phases.map((p, i) => {
            const isActive = p.id === activeId;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => onSelectPhase(p.id)}
                  aria-current={isActive ? "true" : undefined}
                  aria-expanded={isActive}
                  className={cn(
                    "group flex w-full items-center gap-3 border-l-2 px-4 py-3 text-left transition",
                    isActive
                      ? "border-l-purple-600 bg-purple-100 text-purple-800"
                      : "border-l-transparent text-grey-400 hover:border-l-purple-300 hover:bg-purple-100 hover:text-purple-800",
                  )}
                >
                  <span
                    className={cn(
                      "grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-black transition",
                      isActive
                        ? "bg-purple-600 text-white"
                        : "border border-grey-200 bg-white text-grey-400 group-hover:border-transparent group-hover:bg-purple-600 group-hover:text-white",
                    )}
                    title={`Phase ${i + 1}`}
                  >
                    <span className="sr-only">Phase </span>
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block text-sm font-bold leading-[18px] transition",
                        isActive
                          ? "text-purple-800"
                          : "text-grey-400 group-hover:text-purple-800",
                      )}
                    >
                      {p.name}
                    </span>
                    <span
                      className={cn(
                        "block text-xs font-semibold transition",
                        isActive
                          ? "text-purple-600"
                          : "text-grey-400 group-hover:text-purple-600",
                      )}
                    >
                      {p.stages.length} stage
                      {p.stages.length === 1 ? "" : "s"}
                    </span>
                  </span>
                  <span
                    aria-hidden
                    className={cn(
                      "text-sm font-bold transition",
                      isActive
                        ? "text-purple-600"
                        : "text-transparent group-hover:text-purple-600",
                    )}
                  >
                    →
                  </span>
                </button>

                {isActive && (
                  <div className="border-l-2 border-l-purple-600 bg-purple-100/40 px-3 py-3 pl-4">
                    <PhaseStepsPanel
                      active={active}
                      visibleStageCount={visibleStageCount}
                      navSteps={navSteps}
                      focusedStep={focusedStep}
                      onSelectStep={onSelectStep}
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}

function PhaseStepsPanel({
  active,
  visibleStageCount,
  navSteps,
  focusedStep,
  onSelectStep,
}: {
  active: Phase;
  visibleStageCount: number;
  navSteps: LifecycleNavStep[];
  focusedStep: string | null;
  onSelectStep: (stageName: string, stepName: string) => void;
}) {
  return (
    <>
      <p className="text-sm leading-[18px] text-grey-600 desktop:leading-5">
        {active.description}
      </p>
      {visibleStageCount < active.stages.length && (
        <p className="mt-2 text-xs font-semibold text-purple-700">
          {visibleStageCount} of {active.stages.length} stages in this guide
        </p>
      )}

      <MicroLabel className="mt-3">Steps in {active.name}</MicroLabel>
      {navSteps.length === 0 ? (
        <p className="mt-2 text-sm text-grey-500">
          No guide steps in this phase for your unit.
        </p>
      ) : (
        <ol
          aria-label={`${active.name} guide steps`}
          className="mt-2 space-y-0.5"
        >
          {navSteps.map((item, idx) => {
            const key = stepFocusKey(item.stageName, item.stepName);
            const isFocused = key === focusedStep;
            const isNote = item.kind === "context";
            return (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => onSelectStep(item.stageName, item.stepName)}
                  title={`Jump to ${item.stepName}`}
                  className={cn(
                    "group flex w-full items-start gap-2 rounded-[var(--radius-sm)] border-l-2 px-2.5 py-2 text-left transition",
                    isFocused
                      ? isNote
                        ? "border-l-grey-400 bg-white/90 text-grey-800"
                        : "border-l-purple-600 bg-white/90 text-purple-800 shadow-[var(--shadow-light-bg)]"
                      : "border-l-transparent text-grey-700 hover:bg-white/60 hover:text-purple-800",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 grid h-5 w-5 shrink-0 place-items-center text-[10px] font-black",
                      isNote ? "rounded-[var(--radius-sm)]" : "rounded-full",
                      isFocused
                        ? isNote
                          ? "border border-grey-400 bg-white text-grey-700"
                          : "bg-purple-600 text-white"
                        : "border border-grey-200 bg-white text-grey-500 group-hover:border-purple-300 group-hover:text-purple-700",
                    )}
                  >
                    {idx + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block text-sm leading-[18px]",
                        isFocused ? "font-bold" : "font-semibold",
                      )}
                    >
                      {item.stepName}
                    </span>
                    <span
                      className={cn(
                        "mt-0.5 block text-[11px] font-semibold uppercase tracking-wider",
                        isFocused
                          ? isNote
                            ? "text-grey-500"
                            : "text-purple-600"
                          : "text-grey-500 group-hover:text-purple-600",
                      )}
                    >
                      {item.stageName}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </>
  );
}
