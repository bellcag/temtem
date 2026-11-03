import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import infoIcon from "@/assets/figma/info.svg";

type TooltipSide = "top" | "bottom";
type TooltipMode = "dark" | "light";

/** ➗ Components · Tooltip & Coachmark · Type=Tooltip */
export function DlsTooltip({
  id,
  open,
  side = "top",
  mode = "dark",
  anchorRef,
  children,
}: {
  id: string;
  open: boolean;
  side?: TooltipSide;
  mode?: TooltipMode;
  anchorRef?: RefObject<HTMLElement | null>;
  children: ReactNode;
}) {
  const tipRef = useRef<HTMLSpanElement>(null);
  const [box, setBox] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    above: boolean;
    arrowOffset: number;
  } | null>(null);

  useLayoutEffect(() => {
    if (!open || !anchorRef?.current) {
      setBox(null);
      return;
    }
    const place = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const ar = anchor.getBoundingClientRect();
      const pad = 8;
      const gap = 8;
      const measured = tipRef.current?.getBoundingClientRect().width;
      const tipW = Math.min(measured || 240, window.innerWidth - pad * 2);
      const guessH = 52;
      const spaceAbove = ar.top - pad;
      const spaceBelow = window.innerHeight - ar.bottom - pad;
      const above =
        side === "top"
          ? spaceAbove >= guessH || spaceAbove >= spaceBelow
          : spaceBelow >= guessH || spaceBelow > spaceAbove;
      let left = ar.left + ar.width / 2 - tipW / 2;
      left = Math.min(Math.max(left, pad), window.innerWidth - tipW - pad);
      const iconMid = ar.left + ar.width / 2;
      const arrowOffset = Math.min(Math.max(iconMid - left, 12), tipW - 12);
      setBox(
        above
          ? {
              bottom: window.innerHeight - ar.top + gap,
              left,
              above,
              arrowOffset,
            }
          : { top: ar.bottom + gap, left, above, arrowOffset },
      );
    };
    place();
    const retry = window.requestAnimationFrame(place);
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.cancelAnimationFrame(retry);
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open, side, anchorRef, children]);

  const above = box?.above ?? side === "top";
  const portaled = Boolean(open && box && anchorRef);
  const dark = mode === "dark";

  const node = (
    <span
      ref={tipRef}
      id={id}
      role="tooltip"
      style={
        portaled
          ? {
              position: "fixed",
              top: box.top,
              bottom: box.bottom,
              left: box.left,
            }
          : undefined
      }
      className={cn(
        "pointer-events-none z-50 w-max max-w-[min(320px,calc(100vw-2rem))]",
        !portaled && "absolute left-1/2 -translate-x-1/2",
        !portaled && (above ? "bottom-[calc(100%+8px)]" : "top-[calc(100%+8px)]"),
        "rounded-[var(--radius-md)] px-3 py-2",
        "text-sm leading-[18px] font-bold",
        dark
          ? "bg-grey-900 text-white shadow-[0px_10px_24px_rgba(18,18,18,0.24)]"
          : "bg-white text-grey-900 shadow-[var(--shadow-light-bg)]",
        open ? "block" : "hidden",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute h-1.5 w-4",
          dark ? "bg-grey-900" : "bg-white",
          above ? "-bottom-1.5" : "-top-1.5",
          !portaled && "left-1/2 -translate-x-1/2",
        )}
        style={{
          ...(portaled
            ? { left: box.arrowOffset, transform: "translateX(-50%)" }
            : {}),
          clipPath: above
            ? "polygon(0 0, 100% 0, 50% 100%)"
            : "polygon(50% 0, 0 100%, 100% 100%)",
        }}
      />
      {children}
    </span>
  );

  if (portaled) return createPortal(node, document.body);
  return node;
}

/** Info trigger + dark tooltip. Hover/focus on desktop, tap on mobile. */
export function DlsTooltipTip({
  text,
  label,
  mode = "dark",
}: {
  text: string;
  label: string;
  mode?: TooltipMode;
}) {
  const tipId = useId();
  const [mobile, setMobile] = useState(false);
  const [tipOn, setTipOn] = useState(false);
  const tipAnchorRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!tipOn || !mobile) return;
    const onDoc = (event: PointerEvent) => {
      if (tipAnchorRef.current?.contains(event.target as Node)) return;
      setTipOn(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setTipOn(false);
    };
    window.addEventListener("pointerdown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [tipOn, mobile]);

  return (
    <span className="relative inline-flex shrink-0">
      <button
        ref={tipAnchorRef}
        type="button"
        aria-label={`${label}. ${text}`}
        aria-expanded={tipOn}
        aria-describedby={tipOn ? tipId : undefined}
        onClick={(event) => {
          event.stopPropagation();
          if (mobile) setTipOn((on) => !on);
        }}
        onMouseEnter={() => {
          if (!mobile) setTipOn(true);
        }}
        onMouseLeave={() => {
          if (!mobile) setTipOn(false);
        }}
        onFocus={() => {
          if (!mobile) setTipOn(true);
        }}
        onBlur={() => {
          if (!mobile) setTipOn(false);
        }}
        className="inline-flex size-5 shrink-0 appearance-none items-center justify-center bg-transparent p-0 text-grey-400 hover:text-grey-600 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
      >
        <span
          aria-hidden
          className="block size-4 bg-current"
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
      </button>
      <DlsTooltip
        id={tipId}
        open={tipOn}
        side="top"
        mode={mode}
        anchorRef={tipAnchorRef}
      >
        {text}
      </DlsTooltip>
    </span>
  );
}
