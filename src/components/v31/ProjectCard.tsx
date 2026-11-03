import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import helpIcon from "@/assets/figma/help-questions.svg";
import dotIcon from "@/assets/figma/dot.svg";
import { V31_CHIP_TONE, V31_DOT_TONE, type V31ChipTone } from "@/lib/process-v31-cue";
import { usesV35Flow } from "@/lib/process-v31-preview";

const FINE_HOVER = "(hover: hover) and (pointer: fine)";

function useFineHover() {
  const [hover, setHover] = useState(
    () =>
      typeof window !== "undefined" && window.matchMedia(FINE_HOVER).matches,
  );
  useEffect(() => {
    const mq = window.matchMedia(FINE_HOVER);
    const sync = () => setHover(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return hover;
}

function ChipNoteTip({
  label,
  note,
  className,
  children,
}: {
  label: string;
  note: string;
  className?: string;
  children: ReactNode;
}) {
  const tipId = useId();
  const hover = useFineHover();
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [box, setBox] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    width: number;
  } | null>(null);

  useEffect(() => {
    if (!open || hover) return;
    const onDoc = (event: PointerEvent) => {
      if (anchorRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, hover]);

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) {
      setBox(null);
      return;
    }
    const place = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      const pad = 8;
      const gap = 8;
      const width = Math.min(240, window.innerWidth - pad * 2);
      const left = Math.min(
        Math.max(rect.left + rect.width / 2 - width / 2, pad),
        window.innerWidth - width - pad,
      );
      const spaceAbove = rect.top - pad;
      const spaceBelow = window.innerHeight - rect.bottom - pad;
      const above = spaceBelow < 72 && spaceAbove > spaceBelow;
      setBox(
        above
          ? { bottom: window.innerHeight - rect.top + gap, left, width }
          : { top: rect.bottom + gap, left, width },
      );
    };
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open, note]);

  return (
    <>
      <span
        ref={anchorRef}
        className={className}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onPointerDown={(event) => event.stopPropagation()}
      >
        {children}
        <button
          type="button"
          aria-label={`${label}. ${note}`}
          aria-expanded={open}
          aria-describedby={open ? tipId : undefined}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            if (!hover) setOpen((on) => !on);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          className="inline-flex size-4 shrink-0 appearance-none items-center justify-center bg-transparent p-0 text-current hover:opacity-80 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
        >
          <span
            aria-hidden
            className="block size-3.5 bg-current"
            style={{
              WebkitMaskImage: `url("${helpIcon}")`,
              maskImage: `url("${helpIcon}")`,
              WebkitMaskSize: "contain",
              maskSize: "contain",
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
            }}
          />
        </button>
      </span>
      {open && box
        ? createPortal(
            <span
              id={tipId}
              role="tooltip"
              style={{
                position: "fixed",
                top: box.top,
                bottom: box.bottom,
                left: box.left,
                width: box.width,
              }}
              className="pointer-events-none z-50 rounded-[var(--radius-sm)] bg-black px-3 py-2 text-xs leading-4 font-normal text-white shadow-[var(--shadow-light-bg)]"
            >
              {note}
            </span>,
            document.body,
          )
        : null}
    </>
  );
}

export function StatusDot({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("block size-2 shrink-0 bg-current", className)}
      style={{
        WebkitMaskImage: `url("${dotIcon}")`,
        maskImage: `url("${dotIcon}")`,
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
      }}
    />
  );
}

export function CueStatusChip({
  label,
  note,
  toneClass,
  className,
}: {
  label: string;
  note?: string;
  toneClass: string;
  className?: string;
}) {
  const pill = cn(
    "relative z-[2] inline-flex h-6 max-w-full items-center gap-1 rounded-full px-2 text-xs leading-4 font-bold",
    toneClass,
    className,
  );
  if (!note) {
    return (
      <span className={pill}>
        <span className="min-w-0 truncate">{label}</span>
      </span>
    );
  }
  return (
    <ChipNoteTip label={label} note={note} className={pill}>
      <span className="min-w-0 truncate">{label}</span>
    </ChipNoteTip>
  );
}

export function V31ProjectCardLink({
  title,
  action,
  tone,
  href,
  flush = false,
  note,
}: {
  title: string;
  action: string;
  tone: V31ChipTone;
  href: string;
  flush?: boolean;
  note?: string;
}) {
  const quietHover = usesV35Flow(useLocation().pathname);
  return (
    <div
      className={cn(
        "group flex items-center gap-2",
        flush
          ? quietHover
            ? "min-h-16 px-5 py-3 hover:bg-grey-50"
            : "min-h-16 px-5 py-3 hover:bg-purple-100"
          : "overflow-hidden rounded-[var(--radius-2xl)] border border-grey-100 bg-white px-4 py-3 transition-colors hover:border-purple-400 hover:bg-purple-200 tablet:px-5",
      )}
    >
      <Link
        to={href}
        className={cn(
          "flex min-w-0 flex-1 items-center gap-2 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]",
        )}
      >
        <StatusDot className={V31_DOT_TONE[tone]} />
        <span
          className={cn(
            "min-w-0 truncate font-bold text-black",
            flush
              ? "text-sm leading-[18px]"
              : "text-base leading-5 group-hover:text-purple-700",
          )}
        >
          {title}
        </span>
      </Link>
      <CueStatusChip
        label={action}
        note={note}
        toneClass={cn(
          V31_CHIP_TONE[tone],
          !flush && "group-hover:bg-white",
        )}
        className="shrink-0"
      />
    </div>
  );
}
