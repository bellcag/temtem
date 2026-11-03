import { useId, type ReactNode } from "react";
import caretDown from "@/assets/figma/caret-down.svg";
import { cn } from "@/lib/utils";

/** Chapter well: Grey/50, no stroke — child cards keep the outline. */
export const STEP_SECTION_CLASS = cn(
  "flex shrink-0 scroll-mt-16 flex-col gap-4 rounded-[var(--radius-xl)] bg-grey-50 px-4 py-4",
  "[&_article]:gap-4 [&_article]:rounded-none [&_article]:bg-transparent [&_article]:p-0 [&_article]:shadow-none [&_article]:tablet:gap-4 [&_article]:tablet:p-0 [&_article>div>div]:gap-4 [&_article>div>div]:tablet:gap-4 [&_article_a.font-bold.text-purple-600]:font-normal",
);

export const STEP_INSET_CLASS =
  "rounded-[var(--radius-xl)] border border-grey-200 bg-white px-4 py-4 shadow-[var(--shadow-light-bg)] tablet:px-6 tablet:py-6";

/** Buttons/Icon Semi-Rounded Tertiary. The stage row is the button, so this is the visual only. */
function SectionCaret({ open }: { open: boolean }) {
  return (
    <span
      aria-hidden
      className="grid size-5 shrink-0 place-items-center text-grey-600"
    >
      <span
        className="block size-4 bg-current"
        style={{
          WebkitMaskImage: `url("${caretDown}")`,
          maskImage: `url("${caretDown}")`,
          WebkitMaskSize: "contain",
          maskSize: "contain",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          transform: open ? "rotate(0deg)" : "rotate(-90deg)",
        }}
      />
    </span>
  );
}

export function StepSection({
  id,
  title,
  mark,
  lead,
  extra,
  children,
  className,
  heading = "h2",
  open,
  onToggle,
  bare = false,
  well = false,
  linked = false,
}: {
  id?: string;
  title: string;
  /** Sequence label, set beside the title rather than inside it. */
  mark?: string;
  lead?: string;
  extra?: ReactNode;
  children?: ReactNode;
  className?: string;
  heading?: "h2" | "h3";
  open?: boolean;
  onToggle?: () => void;
  /** Title on the page, cards carry the surface. */
  bare?: boolean;
  /** Grey step well inside a white stage, as on the v36 key screens. */
  well?: boolean;
  /** Continues the index line from the step list above. */
  linked?: boolean;
}) {
  const bodyId = useId();
  const Heading = heading;
  const collapsible = Boolean(onToggle);
  const shown = !collapsible || open !== false;
  const headingBlock = (
    <>
      <Heading
        className={cn(
          bare
            ? well
              ? "text-base leading-5 font-bold text-black desktop:text-lg desktop:leading-[22px]"
              : "text-base leading-5 font-bold text-black desktop:text-lg desktop:leading-6"
            : "text-sm leading-[18px] font-bold text-black desktop:text-base desktop:leading-5",
          mark && "flex min-w-0 items-baseline gap-2",
        )}
      >
        {mark ? (
          <span className="shrink-0 text-xs leading-4 font-bold uppercase tracking-[0.06em] text-purple-700">
            {mark}
          </span>
        ) : null}
        <span className="min-w-0">{title}</span>
      </Heading>
      {lead ? (
        <p
          className={
            bare
              ? "mt-2 text-sm leading-[18px] text-grey-600"
              : "mt-2 text-xs leading-4 text-grey-600 desktop:mt-3 desktop:text-sm desktop:leading-[18px]"
          }
        >
          {lead}
        </p>
      ) : null}
      {extra}
    </>
  );
  return (
    <section
      id={id}
      className={cn(
        STEP_SECTION_CLASS,
        bare &&
          (well
            ? "!gap-0 overflow-hidden border border-grey-200 bg-white p-0"
            : "!gap-2 border border-grey-75 bg-white px-4 py-4 tablet:px-6 tablet:py-5"),
        linked &&
          "relative !pl-10 before:pointer-events-none before:absolute before:top-0 before:bottom-0 before:left-3 before:z-[1] before:w-0.5 before:bg-purple-600",
        className,
      )}
    >
      {collapsible ? (
        <button
          type="button"
          aria-expanded={shown}
          aria-controls={bodyId}
          onClick={onToggle}
          className={cn(
            "group flex w-full items-center gap-3 rounded-[var(--radius-sm)] text-left focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]",
            well && "px-4 py-4 desktop:px-6",
          )}
        >
          <span className="min-w-0 flex-1">{headingBlock}</span>
          <SectionCaret open={shown} />
        </button>
      ) : (
        <div>{headingBlock}</div>
      )}
      {shown ? (
        <>
          {bare && !well ? (
            <div
              aria-hidden
              className="-mx-4 mt-2 h-px w-[calc(100%+32px)] shrink-0 bg-black/10 tablet:-mx-6 tablet:w-[calc(100%+48px)]"
            />
          ) : null}
          <div
            id={collapsible ? bodyId : undefined}
            className={well ? "bg-grey-50 px-4 py-5 desktop:px-6" : bare ? "mt-2" : undefined}
          >
            {children}
          </div>
        </>
      ) : null}
    </section>
  );
}

export function StepInsetList({
  inset,
  children,
}: {
  inset: boolean;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex flex-col", inset && "gap-4")}>{children}</div>
  );
}

export function StepInset({
  id,
  inset = true,
  focus,
  linked = false,
  className,
  children,
}: {
  id?: string;
  inset?: boolean;
  focus?: boolean;
  linked?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      id={id}
      className={cn(
        "scroll-mt-8",
        inset && STEP_INSET_CLASS,
        focus &&
          "rounded-[var(--radius-xl)] outline outline-2 -outline-offset-2 outline-purple-600",
        linked &&
          "relative before:absolute before:top-6 before:-left-7 before:z-[2] before:w-7",
        linked &&
          (focus
            ? "before:h-1 before:bg-purple-600 !border-l-purple-600"
            : "before:h-0.5 before:bg-purple-300"),
        className,
      )}
    >
      {children}
    </div>
  );
}
