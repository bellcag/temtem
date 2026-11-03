import { v35EffectiveDate } from "@/lib/process-v35-updates";
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
import { ExternalLink, File, FolderOpen } from "lucide-react";
import type { Role } from "@/lib/app-state";
import { DOCUMENTS, type Unit } from "@/lib/tenancy-data";
import {
  StepCardShell,
  StepCardTitle,
  YourStepsItem,
  YourStepsList,
} from "@/components/dls/StepCardShell";
import {
  v26CardView,
  v26PersonLabel,
  type V26Card,
  type V26TellLine,
} from "@/lib/process-v26-guide";
import { copyForRole, type GuideTiming } from "@/lib/process-rules-v6";
import {
  v27IfTheyAsk,
  v27SharedFact,
  v27WorksDoorHint,
} from "@/lib/process-v27-voice";
import { v27LinkedFact, v27SystemsNotInFact } from "@/lib/process-v27-systems";
import type { V26ShownDoc } from "@/lib/process-v26-documents";
import caretDown from "@/assets/figma/caret-down.svg";
import exclamationAlert from "@/assets/figma/exclamation-alert.svg";
import infoIcon from "@/assets/figma/info.svg";
import chevronRightIcon from "@/assets/figma/chevron-right.svg";
import externalLinkIcon from "@/assets/figma/external-link.svg";
import documentsIcon from "@/assets/figma/documents-outline.svg";
import mapIcon from "@/assets/figma/map.svg";
import singleProfileIcon from "@/assets/figma/single-profile.svg";
import widgetIcon from "@/assets/figma/widget.svg";
import { AttributeChip } from "@/components/dls/Chip";
import { DlsTooltipTip } from "@/components/dls/Tooltip";
import { StepIndexMark, type StepIndexTone } from "@/components/v31/StepIndexMark";
import { BMC_NAME, BmcContactChip, bmcServicesFor } from "@/components/v31/ContactChip";
import type { BmcService } from "@/lib/tenancy-data";
import { cn } from "@/lib/utils";
import {
  CUT_STANDALONE,
  isV31Path,
  isV34Path,
  isV40Path,
  usesV37Cut,
  usesV36Chrome,
  usesV35Flow,
  remapV31Href,
} from "@/lib/process-v31-preview";
const FACT_LABEL =
  "text-xs leading-4 font-bold uppercase tracking-[0.08em] text-grey-400";

const WORKS_DOOR_BTN =
  "inline-flex h-6 w-fit shrink-0 items-center gap-1 rounded-full bg-purple-600 px-2 text-xs leading-4 font-bold text-white hover:bg-purple-700 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]";

const V35_DOOR_BTN =
  "inline-flex h-8 w-fit shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-purple-600 px-3 text-sm leading-[18px] font-bold text-white hover:bg-purple-700 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]";

const WORKS_DOOR_HINT: Record<Role, string> = {
  tenant: "Open Works to read the renovation your contractor declared.",
  contractor:
    "Open Works to start or continue this renovation and see what to apply for.",
  officer: "Open Works to see the renovation Contractor declared.",
};

const WHO_SHORT: Record<string, string> = {
  "Integrated Facilities Management": "IFM",
  "Airport Emergency & Safety": "AES",
  "Project Officer": "PO",
  "Building Maintenance Contractor": "BMC",
  "Qualified Person": "QP",
};

export function whoTag(name: string, role: Role) {
  const label = v26PersonLabel(name, role);
  return label === "You" ? "You" : (WHO_SHORT[name] ?? label);
}

function WhoTag({ name, role }: { name: string; role: Role }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const short = whoTag(name, role);
  const showTip = short !== name;
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => showTip && setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <span
        tabIndex={showTip ? 0 : undefined}
        aria-label={showTip ? name : undefined}
        aria-describedby={open && showTip ? id : undefined}
        onFocus={() => showTip && setOpen(true)}
        onBlur={() => setOpen(false)}
        className={
          short === "You"
            ? "inline-flex cursor-help items-center rounded-full bg-grey-100 px-2 py-0.5 text-xs leading-4 font-bold text-grey-700"
            : showTip
              ? "inline-flex cursor-help items-center rounded-full bg-grey-50 px-2 py-0.5 text-xs leading-4 text-grey-500"
              : "inline-flex items-center rounded-full bg-grey-50 px-2 py-0.5 text-xs leading-4 text-grey-500"
        }
      >
        {short}
      </span>
      {open && showTip ? (
        <span
          id={id}
          role="tooltip"
          className="absolute right-0 bottom-full z-20 mb-1 whitespace-nowrap rounded-[var(--radius-sm)] bg-black px-2 py-1 text-xs leading-4 text-white"
        >
          {name}
        </span>
      ) : null}
    </span>
  );
}

export type V26ExtraResource = {
  id: string;
  name: string;
  type: string;
};

/** Booking/ops tools the reader does not open. Officer still sees the full list. */
const HIDE_SYSTEM_FOR_READER = new Set([
  "building management system",
  "building maintenance contractor joint site inspection booking",
]);

/** One shared list. A repeated tenant and contractor line is the same move. */
function bulletLines(rows: { who: string; text: string }[]) {
  const seen = new Set<string>();
  const lines: { key: string; text: string }[] = [];
  for (const row of rows) {
    for (const part of row.text.split("\n")) {
      const text = part.trim();
      if (!text || seen.has(text)) continue;
      seen.add(text);
      lines.push({ key: text, text });
    }
  }
  return lines;
}

function resourceCount(systems: number, files: number) {
  const parts: string[] = [];
  if (systems === 1) parts.push("1 system");
  else if (systems > 1) parts.push(`${systems} systems`);
  if (files === 1) parts.push("1 file");
  else if (files > 1) parts.push(`${files} files`);
  return parts.join(" · ");
}

function ActorList({
  label,
  rows,
}: {
  label: string;
  rows: { who: string; do: string }[];
}) {
  if (rows.length === 0) return null;
  return (
    <ul className="flex flex-col" aria-label={label}>
      {rows.map((row, index) => (
        <li
          key={`${row.who}-${row.do}`}
          className={cn(
            "flex min-w-0 flex-col gap-1 py-3 first:pt-0 last:pb-0",
            index > 0 && "border-t border-grey-100",
          )}
        >
          {row.who ? (
            <p className="text-sm leading-[18px] font-bold text-black">
              {row.who}
            </p>
          ) : null}
          <p className="min-w-0 text-sm leading-[18px] break-words text-grey-700">
            {row.do}
          </p>
        </li>
      ))}
    </ul>
  );
}

function Caret({ open }: { open: boolean }) {
  return (
    <span
      aria-hidden
      className="block size-4 shrink-0 bg-grey-400"
      style={{
        WebkitMaskImage: `url("${caretDown}")`,
        maskImage: `url("${caretDown}")`,
        WebkitMaskSize: "10px 6px",
        maskSize: "10px 6px",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        transform: open ? "rotate(0deg)" : "rotate(-90deg)",
      }}
    />
  );
}

export function BecauseBanner({
  tags,
  className,
}: {
  tags: string[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex w-full min-w-0 flex-wrap items-center gap-1.5 bg-purple-100 px-3 py-2",
        className,
      )}
    >
      <span className="text-xs leading-4 font-bold text-purple-700">
        Required for:
      </span>
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex max-w-full items-center rounded-full bg-purple-200 px-2 py-0.5 text-xs leading-4 font-bold text-purple-700"
        >
          <span className="min-w-0 truncate">{tag}</span>
        </span>
      ))}
    </div>
  );
}

/** Info tip inline after the last title character — Required for on hover / tap. */
export function BecauseTitleHint({ tags }: { tags: string[] }) {
  const pathname = useLocation().pathname;
  const flushOnWrap = isV34Path(pathname);
  const v35 = usesV35Flow(pathname);
  if (tags.length === 0) return null;
  if (flushOnWrap) {
    /* A real space (not margin) collapses at a line break, so a wrapped tip starts flush with the title.
       -ml-0.5 cancels the 2px inset of the 16px glyph inside its 20px hit area. */
    return (
      <>
        <span className="[word-spacing:3px]"> </span>
        <span className="-ml-0.5 inline-flex align-middle">
          <DlsTooltipTip
            label="Required for"
            text={`Required for: ${tags.join(", ")}`}
            mode="dark"
          />
        </span>
      </>
    );
  }
  return (
    <span className={cn("ml-1 inline-flex align-middle", v35 && "relative -top-0.5")}>
      <DlsTooltipTip
        label="Required for"
        text={`Required for: ${tags.join(", ")}`}
        mode="dark"
      />
    </span>
  );
}

/**
 * Step index + title + optional inline tip.
 * Single-line keeps leading-5 so the tip sits on the text line with the mark.
 * Only when the title wraps do we bump to leading-6 for air above the tip.
 */
function GuideStepHeading({
  title,
  tip,
  stepNo,
  stepTone,
}: {
  title: string;
  tip?: ReactNode;
  stepNo?: number;
  stepTone: StepIndexTone;
}) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [wrapped, setWrapped] = useState(false);
  /** Title line matches the 24px mark, so 1-line and wrapped titles share one centre line. */
  const pathname = useLocation().pathname;
  const v35 = usesV35Flow(pathname);
  const v36 = usesV36Chrome(pathname);
  const matchMark = isV34Path(pathname) || v35;

  useLayoutEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    const sync = () => {
      const lh = parseFloat(getComputedStyle(el).lineHeight) || 20;
      setWrapped(el.getBoundingClientRect().height > lh + 2);
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, [title, tip]);

  return (
    <div
      className={cn(
        "flex min-w-0 gap-2",
        v35 && !wrapped ? "items-center" : "items-start",
      )}
    >
      {stepNo != null ? (
        <span className={cn("flex shrink-0", !wrapped && !matchMark && "mt-0.5")}>
          {v35 ? (
            <span
              aria-hidden
              className="grid size-6 shrink-0 place-items-center rounded-full bg-purple-500 text-xs leading-4 font-bold text-white"
            >
              {stepNo}
            </span>
          ) : (
            <StepIndexMark n={stepNo} tone={stepTone} />
          )}
        </span>
      ) : null}
      <StepCardTitle
        ref={titleRef}
        className={
          v36
            ? "text-lg leading-[22px]"
            : v35
              ? "text-lg leading-[22px] desktop:text-xl desktop:leading-7"
              : wrapped || matchMark
                ? "leading-6"
                : "leading-5"
        }
      >
        {title}
        {tip}
      </StepCardTitle>
    </div>
  );
}

function ResourceLink({
  name,
  type,
  href,
  external,
  quiet,
}: {
  name: string;
  type: string;
  href?: string;
  external?: boolean;
  quiet?: boolean;
}) {
  const label = (
    <span
      className={
        quiet
          ? "min-w-0 truncate text-sm leading-[18px] text-grey-700"
          : "min-w-0 truncate text-sm leading-[18px] font-bold text-black"
      }
    >
      {name}
    </span>
  );
  return (
    <li
      className={
        quiet
          ? "flex items-center justify-between gap-3 py-1.5"
          : "flex items-center justify-between gap-[var(--spacing-12)] py-[var(--spacing-8)]"
      }
    >
      {href ? (
        external ? (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="min-w-0 truncate text-sm leading-[18px] font-bold text-grey-700 underline decoration-grey-300 underline-offset-2 hover:text-black hover:decoration-grey-600 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
          >
            {name}
          </a>
        ) : (
          <Link
            to={href}
            className="min-w-0 truncate text-sm leading-[18px] font-bold text-grey-700 underline decoration-grey-300 underline-offset-2 hover:text-black hover:decoration-grey-600 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
          >
            {name}
          </Link>
        )
      ) : (
        label
      )}
      <span className="shrink-0 text-xs leading-4 text-grey-400">{type}</span>
    </li>
  );
}

function ResourceList({
  systems,
  docs,
  extras,
  quiet,
}: {
  systems: { label: string }[];
  docs: V26ShownDoc[];
  extras: V26ExtraResource[];
  quiet?: boolean;
}) {
  return (
    <ul className="flex flex-col" aria-label="Resources">
      {systems.map((system) => (
        <ResourceLink
          key={system.label}
          name={system.label}
          type="System"
          href="/apps"
          quiet={quiet}
        />
      ))}
      {docs.map((doc) => (
        <ResourceLink
          key={doc.id}
          name={doc.name}
          type={doc.type}
          href={doc.href}
          external={doc.external}
          quiet={quiet}
        />
      ))}
      {extras.map((row) => (
        <ResourceLink
          key={row.id}
          name={row.name}
          type={row.type}
          quiet={quiet}
        />
      ))}
    </ul>
  );
}

function LinkResourceSection({
  systems,
  docs,
  extras,
  className,
}: {
  systems: { label: string; href?: string }[];
  docs: V26ShownDoc[];
  extras: V26ExtraResource[];
  className?: string;
}) {
  const rows: {
    id: string;
    name: string;
    href?: string;
    external?: boolean;
  }[] = [
    ...systems.map((system) => ({
      id: system.label,
      name: system.label,
      href: system.href === "" ? undefined : (system.href ?? "/apps"),
    })),
    ...docs.map((doc) => ({
      id: doc.id,
      name: doc.name,
      href: doc.href,
      external: doc.external,
    })),
    ...extras.map((row) => ({
      id: row.id,
      name: row.name,
    })),
  ];
  if (rows.length === 0) return null;
  return (
    <div className={cn("mt-6 flex flex-col gap-2 desktop:mt-0", className)}>
      <p className="text-xs leading-4 text-grey-400">Resources</p>
      <ul className="overflow-hidden rounded-[var(--radius-md)] border border-grey-200 bg-white">
        {rows.map((row, index) => {
          const body = (
            <>
              <File className="size-4 shrink-0 text-grey-700" aria-hidden />
              <span className="min-w-0 flex-1 truncate text-xs leading-4 text-grey-600">
                {row.name}
              </span>
              {row.href ? (
                <ExternalLink className="size-4 shrink-0 text-grey-700" aria-hidden />
              ) : null}
            </>
          );
          const className =
            "flex h-8 items-center gap-2 px-2 focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--color-purple-600)]";
          return (
            <li key={row.id} className={index > 0 ? "border-t border-grey-200" : undefined}>
              {row.href ? (
                row.external ? (
                  <a href={row.href} target="_blank" rel="noreferrer" className={className}>
                    {body}
                  </a>
                ) : (
                  <Link to={row.href} className={className}>
                    {body}
                  </Link>
                )
              ) : (
                <div className={className}>{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ResourceFold({
  systems,
  docs,
  extras,
  embedded,
  quiet,
}: {
  systems: { label: string }[];
  docs: V26ShownDoc[];
  extras: V26ExtraResource[];
  embedded?: boolean;
  quiet?: boolean;
}) {
  const files = docs.length + extras.length;
  const need = systems.length + files;
  const [open, setOpen] = useState(!quiet && need <= 2);
  if (need === 0) return null;
  const summary = resourceCount(systems.length, files);
  return (
    <div
      className={cn(
        "flex flex-col",
        quiet
          ? "border-t border-grey-100 pt-3"
          : [
              "border-t border-grey-100 bg-grey-50",
              embedded
                ? "mt-[var(--spacing-16)]"
                : [
                    "-mx-[var(--spacing-16)] -mb-[var(--spacing-16)]",
                    "rounded-b-[var(--radius-2xl)] px-[var(--spacing-16)]",
                    "tablet:-mx-[var(--spacing-24)] tablet:-mb-[var(--spacing-24)]",
                    "tablet:px-[var(--spacing-24)]",
                  ].join(" "),
            ].join(" "),
      )}
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((on) => !on)}
        className={cn(
          "flex w-full items-center gap-2 text-left",
          quiet ? "py-1" : "gap-[var(--spacing-8)] py-[var(--spacing-16)]",
          "focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--color-purple-600)]",
        )}
      >
        <span
          className={
            quiet
              ? "text-xs leading-4 text-grey-400"
              : "text-xs leading-4 font-bold uppercase tracking-[0.08em] text-grey-400"
          }
        >
          Resources
        </span>
        <span className="min-w-0 flex-1 truncate text-xs leading-4 text-grey-500">
          {summary}
        </span>
        <Caret open={open} />
      </button>
      {open ? (
        <div className={quiet ? "pb-1" : "pb-[var(--spacing-16)]"}>
          <ResourceList
            systems={systems}
            docs={docs}
            extras={extras}
            quiet={quiet}
          />
        </div>
      ) : null}
    </div>
  );
}

function isAfterDuration(row: GuideTiming) {
  return /\bafter\b/i.test(row.duration);
}

const META_LABEL = "text-xs leading-4 font-bold text-black";
/** Beside a 20px icon. Body L Bold, a step under the card title. */
const ICON_LABEL = "text-base leading-5 font-bold text-black";
/** Reading text: Body S, then Body L from desktop. */
const CARD_COPY = "text-sm leading-[18px] desktop:text-base desktop:leading-5";

/** v35: groups sit on the card; the purple icon and chip outline carry them. */
const V35_GROUP = "min-w-0";
const V35_SLA =
  "flex items-start gap-3 rounded-[var(--radius-xl)] border border-blue-200 bg-blue-100 px-3 py-3";
const V36_SLA =
  "flex items-start gap-3 rounded-[var(--radius-xl)] border border-blue-200 bg-info-bg px-3 py-3";
const V35_DOOR =
  "flex min-w-0 flex-col gap-3 rounded-[var(--radius-xl)] border border-purple-200 bg-purple-100 p-4";

const META_GLYPH = {
  people: singleProfileIcon,
  documents: documentsIcon,
  systems: widgetIcon,
  steps: mapIcon,
} as const;

function MetaSectionIcon({
  kind,
  className,
}: {
  kind: "people" | "documents" | "systems" | "steps";
  className?: string;
}) {
  return <MaskGlyph src={META_GLYPH[kind]} className={cn("size-5", className)} />;
}

function MetaHeading({
  children,
  kind,
}: {
  children: string;
  kind?: "people" | "documents" | "systems";
}) {
  const v35 = usesV35Flow(useLocation().pathname);
  return (
    <h4
      className={cn(
        v35 && kind
          ? "flex items-center gap-1.5 text-sm leading-[18px] font-bold text-grey-700"
          : META_LABEL,
      )}
    >
      {v35 && kind ? <MetaSectionIcon kind={kind} className="size-4" /> : null}
      {children}
    </h4>
  );
}

/** ➗ Filter Chip · Size=sm · rounded pill */
const CHIP_SM =
  "inline-flex h-6 w-fit max-w-full items-center gap-1 rounded-full px-2 text-left text-xs leading-4 font-bold focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]";

const LINK_CHIP =
  "border border-grey-200 bg-white text-grey-700 hover:border-grey-300 hover:bg-grey-50";

const DOC_CHIP = cn(CHIP_SM, LINK_CHIP);

const SYSTEM_CHIP = cn(CHIP_SM, LINK_CHIP);

/** v35 links: quieter than the step text, still clearly tappable. */
const V35_LINK_CHIP =
  "inline-flex h-6 w-fit max-w-full items-center gap-1 rounded-full bg-purple-100 px-2 text-left text-xs leading-4 font-bold text-purple-700 hover:bg-purple-200 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]";

const V35_PERSON_CHIP =
  "inline-flex h-6 w-fit max-w-full items-center rounded-[var(--radius-sm)] bg-grey-100 px-2 text-xs leading-4 font-bold text-grey-700";

function MaskGlyph({
  src,
  className,
}: {
  src: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn("block size-3 shrink-0 bg-current", className)}
      style={{
        WebkitMaskImage: `url("${src}")`,
        maskImage: `url("${src}")`,
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
      }}
    />
  );
}

function ExternalGlyph({ className }: { className?: string }) {
  return <MaskGlyph src={externalLinkIcon} className={className} />;
}

function GoGlyph({ className }: { className?: string }) {
  return <MaskGlyph src={chevronRightIcon} className={className} />;
}

function uniqueNames(names: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const name of names) {
    const trimmed = name.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
  }
  return out;
}

function ChipLink({
  name,
  href,
  external,
  className,
  icon,
}: {
  name: string;
  href?: string;
  external?: boolean;
  className: string;
  icon?: ReactNode;
}) {
  const body = (
    <>
      {icon}
      <span className="min-w-0 truncate">{name}</span>
    </>
  );
  if (!href) {
    return (
      <span className={className} title={name}>
        {body}
      </span>
    );
  }
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className={className}
        title={name}
      >
        {body}
      </a>
    );
  }
  return (
    <Link to={href} className={className} title={name}>
      {body}
    </Link>
  );
}

function AsideMeta({
  people,
  docs,
  systems,
  rows = false,
  band = false,
  beside = false,
  contact,
}: {
  /** When set, the BMC chip opens its contact card. */
  contact?: {
    unit: Unit;
    role: Role;
    step: { id: string; title: string };
    services: BmcService[];
  };
  people: string[];
  docs: { id: string; name: string; href?: string; external?: boolean }[];
  systems: { label: string; href?: string; external?: boolean }[];
  /** Label and values on one line, under the steps. */
  rows?: boolean;
  /** Quiet footer under the steps. */
  band?: boolean;
  /** Quiet column beside the steps, so the card width is used. */
  beside?: boolean;
}) {
  const pathname = useLocation().pathname;
  const v35 = usesV35Flow(pathname);
  const v37 = usesV37Cut(pathname);
  if (people.length + docs.length + systems.length === 0) return null;
  const peopleList = (
    <ul className="flex flex-wrap gap-2" aria-label="People Involved">
      {people.map((name) => (
        <li key={name} className="max-w-full">
          {contact && name === BMC_NAME ? (
            <BmcContactChip
              size={v35 ? "md" : "sm"}
              className={v37 ? V35_LINK_CHIP : undefined}
            />
          ) : v35 ? (
            <span className={V35_PERSON_CHIP} title={name}>
              <span className="min-w-0 truncate">{name}</span>
            </span>
          ) : (
            <AttributeChip>{name}</AttributeChip>
          )}
        </li>
      ))}
    </ul>
  );
  const docList = (
    <ul className="flex flex-wrap gap-2" aria-label="Documents">
      {docs.map((doc) => (
        <li key={doc.id} className="max-w-full">
          <ChipLink
            name={doc.name}
            href={doc.href}
            external={doc.external}
            className={v35 ? V35_LINK_CHIP : DOC_CHIP}
            icon={<File className="size-3 shrink-0" aria-hidden />}
          />
        </li>
      ))}
    </ul>
  );
  const systemList = (
    <ul className="flex flex-wrap gap-2" aria-label="Systems">
      {systems.map((system) => (
        <li key={system.label} className="max-w-full">
          <ChipLink
            name={system.label}
            href={system.href ?? "/apps"}
            external={system.external}
            className={v35 ? V35_LINK_CHIP : SYSTEM_CHIP}
            icon={<ExternalGlyph className="size-3" />}
          />
        </li>
      ))}
    </ul>
  );
  if (rows) {
    const lines = [
      people.length > 0 ? { label: "People Involved", body: peopleList } : null,
      docs.length > 0 ? { label: "Documents", body: docList } : null,
      systems.length > 0 ? { label: "Systems", body: systemList } : null,
    ].filter((line): line is { label: string; body: ReactNode } => line != null);
    return (
      <dl data-aside-meta className="border-t border-grey-100">
        {lines.map((line) => (
          <div
            key={line.label}
            className="grid grid-cols-1 gap-1.5 border-b border-grey-100 py-1.5 last:border-b-0 tablet:grid-cols-[9.5rem_minmax(0,1fr)] tablet:items-center tablet:gap-4"
          >
            <dt className={META_LABEL}>{line.label}</dt>
            <dd className="min-w-0">{line.body}</dd>
          </div>
        ))}
      </dl>
    );
  }
  if (beside) {
    const groups = [
      people.length > 0 ? { label: "People Involved", body: peopleList } : null,
      docs.length > 0 ? { label: "Documents", body: docList } : null,
      systems.length > 0 ? { label: "Systems", body: systemList } : null,
    ].filter((line): line is { label: string; body: ReactNode } => line != null);
    return (
      <div
        data-aside-meta
        className={cn(
          "flex min-w-0 flex-col tablet:self-start",
          v35 ? "gap-6" : "gap-4 tablet:border-l tablet:border-grey-100 tablet:pl-6",
        )}
      >
        {groups.map((group) => (
          <div
            key={group.label}
            className={cn("flex min-w-0 flex-col gap-2", v35 && V35_GROUP)}
          >
            <MetaHeading
              kind={
                group.label.startsWith("People")
                  ? "people"
                  : group.label === "Documents"
                    ? "documents"
                    : "systems"
              }
            >
              {group.label}
            </MetaHeading>
            {group.body}
          </div>
        ))}
      </div>
    );
  }
  if (band) {
    const groups = [
      people.length > 0 ? { label: "People Involved", body: peopleList } : null,
      docs.length > 0 ? { label: "Documents", body: docList } : null,
      systems.length > 0 ? { label: "Systems", body: systemList } : null,
    ].filter((line): line is { label: string; body: ReactNode } => line != null);
    return (
      <div
        data-aside-meta
        className="flex flex-wrap items-center gap-x-8 gap-y-2 border-t border-grey-100 pt-3"
      >
        {groups.map((group) => (
          <div key={group.label} className="flex min-w-0 flex-wrap items-center gap-2">
            <MetaHeading
              kind={
                group.label.startsWith("People")
                  ? "people"
                  : group.label === "Documents"
                    ? "documents"
                    : "systems"
              }
            >
              {group.label}
            </MetaHeading>
            {group.body}
          </div>
        ))}
      </div>
    );
  }
  return (
    <div
      data-aside-meta
      className={cn(
        "flex min-w-0 flex-col",
        v35 ? "gap-4 border-t border-grey-75 pt-4" : "gap-6",
      )}
    >
      {people.length > 0 ? (
        <div className={cn(v35 && V35_GROUP)}>
          <MetaHeading kind="people">People Involved</MetaHeading>
          <div className="mt-2.5">{peopleList}</div>
        </div>
      ) : null}
      {docs.length > 0 ? (
        <div className={cn(v35 && V35_GROUP)}>
          <MetaHeading kind="documents">Documents</MetaHeading>
          <div className="mt-2.5">{docList}</div>
        </div>
      ) : null}
      {systems.length > 0 ? (
        <div className={cn(v35 && V35_GROUP)}>
          <MetaHeading kind="systems">Systems</MetaHeading>
          <div className="mt-2.5">{systemList}</div>
        </div>
      ) : null}
    </div>
  );
}

/** Works: tasks, people, and documents on one surface, as on Process. */
function ProcessAside({
  lines,
  dense = false,
}: {
  lines: { key: string; text: string }[];
  dense?: boolean;
}) {
  const path = useLocation().pathname;
  const important = isV34Path(path);
  const v35 = usesV35Flow(path);
  const v36 = usesV36Chrome(path);
  const v40 = isV40Path(path);
  if (lines.length === 0) return null;
  return (
    <div
      className={cn(
        "min-w-0",
        v35
          ? "mt-2"
          : important
            ? "border-l-2 border-purple-600 pl-3"
            : "border-l-2 border-grey-200 pl-3",
      )}
    >
      {v40 ? null : (
      <h4
        className={cn(
          v35 ? ICON_LABEL : "text-sm leading-5 font-bold text-black",
          v35 && "flex items-center gap-1.5",
        )}
      >
        {v35 ? <MetaSectionIcon kind="steps" /> : null}
        Steps Involved
      </h4>
      )}
      {v35 ? (
        <ul
          className={cn("flex flex-col", v40 ? "mt-0" : dense ? "mt-2" : "mt-3")}
          aria-label={v40 ? undefined : "Steps Involved"}
        >
          {lines.map((line) => (
            <li
              key={line.key}
              className={cn("flex items-start gap-2", dense ? "pb-2 last:pb-0" : "pb-3 last:pb-0")}
            >
              <span
                aria-hidden
                className={cn(
                  "mt-1.5 size-1.5 shrink-0 rounded-full desktop:mt-[7px]",
                  v36 ? "bg-grey-700" : "bg-purple-600",
                )}
              />
              <span className={cn(CARD_COPY, "text-grey-900")}>{line.text}</span>
            </li>
          ))}
        </ul>
      ) : (
        <ul
          className={
            dense
              ? "mt-2 flex list-disc flex-col gap-2 pl-5 marker:text-grey-400"
              : "mt-3 flex list-disc flex-col gap-3 pl-5 marker:text-grey-400"
          }
          aria-label={v40 ? undefined : "Steps Involved"}
        >
          {lines.map((line) => (
            <li key={line.key} className="text-sm leading-5 text-grey-900">
              {line.text}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TimingBlock({
  label,
  rows,
  role,
  sharedVoice,
  asNote,
}: {
  label: string;
  rows: GuideTiming[];
  role: Role;
  sharedVoice?: boolean;
  asNote?: boolean;
}) {
  const path = useLocation().pathname;
  const v35 = usesV35Flow(path);
  const v36 = usesV36Chrome(path);
  if (!asNote) {
    return (
      <div className="flex flex-col gap-2">
        <p className={FACT_LABEL}>{label}</p>
        <ul className="flex flex-col gap-2" aria-label={label}>
          {rows.map((row) => {
            const detail = copyForRole(row.text, role);
            return (
              <li
                key={`${row.cite}-${row.kind}-${row.duration}`}
                className="flex flex-col gap-1.5"
              >
                <span
                  className={
                    sharedVoice
                      ? "inline-flex w-fit items-center rounded-[var(--radius-sm)] bg-grey-50 px-2 py-0.5 text-xs leading-4 text-grey-600"
                      : "inline-flex w-fit items-center rounded-[var(--radius-sm)] border border-blue-600 bg-blue-100 px-2 py-1 text-xs leading-4 font-bold text-blue-600"
                  }
                >
                  {row.duration}
                </span>
                {detail ? (
                  <p className="text-sm leading-[18px] text-grey-700">
                    {detail}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2" aria-label={label}>
      {rows.map((row) => {
        const detail = copyForRole(row.text, role);
        const showDetail = Boolean(detail);
        return (
          <div
            key={`${row.cite}-${row.kind}-${row.duration}`}
            className={
              v36 ? V36_SLA : v35 ? V35_SLA : "flex items-start gap-3 rounded-[var(--radius-xl)] bg-blue-100 px-4 py-3"
            }
          >
            <span
              aria-hidden
              className="mt-0.5 block size-4 shrink-0 bg-blue-600"
              style={{
                WebkitMaskImage: `url("${infoIcon}")`,
                maskImage: `url("${infoIcon}")`,
                WebkitMaskSize: "16px 16px",
                maskSize: "16px 16px",
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
              }}
            />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <p className={cn("text-sm leading-[18px] font-bold", v36 ? "text-black" : "text-grey-900")}>
                {row.duration}
              </p>
              {showDetail ? (
                <p className={cn("text-sm leading-[18px]", v36 ? "text-grey-700" : "text-grey-600")}>{detail}</p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StepUpdateNote({
  notes,
}: {
  notes: { on: string; note: string; doc: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [box, setBox] = useState<{ top: number; left: number; width: number } | null>(null);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | null>(null);
  const panelId = useId();

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const cancelClose = () => {
    if (closeTimer.current != null) window.clearTimeout(closeTimer.current);
  };
  const scheduleClose = () => {
    if (pinned) return;
    cancelClose();
    closeTimer.current = window.setTimeout(() => setOpen(false), 140);
  };

  useEffect(() => {
    if (!open) return;
    const onDoc = (event: PointerEvent) => {
      const target = event.target as Node;
      if (anchorRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setPinned(false);
      setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setPinned(false);
      setOpen(false);
    };
    window.addEventListener("pointerdown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open) {
      setBox(null);
      return;
    }
    const place = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      const width = Math.min(320, window.innerWidth - 16);
      const left = Math.min(Math.max(8, rect.left), window.innerWidth - width - 8);
      setBox({ top: rect.bottom + 8, left, width });
    };
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open]);

  const detail = notes
    .map((row) => {
      const doc = DOCUMENTS.find((item) => item.id === row.doc);
      const sentence = `From ${v35EffectiveDate(row.on)}. ${row.note.charAt(0).toUpperCase()}${row.note.slice(1)}`;
      return doc ? `${sentence} See ${doc.name}.` : sentence;
    })
    .join(" ");

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`Requirements updated. ${detail}`}
        onClick={() => {
          if (mobile) {
            setOpen((value) => !value);
            return;
          }
          setPinned((value) => {
            const next = !value;
            setOpen(next);
            return next;
          });
        }}
        onMouseEnter={() => {
          if (mobile) return;
          cancelClose();
          setOpen(true);
        }}
        onMouseLeave={() => {
          if (mobile) return;
          scheduleClose();
        }}
        onFocus={() => {
          if (!mobile) setOpen(true);
        }}
        onBlur={(event) => {
          if (panelRef.current?.contains(event.relatedTarget as Node)) return;
          if (!pinned) setOpen(false);
        }}
        className="inline-flex h-6 w-fit items-center gap-1 rounded-full bg-yellow-100 px-2 text-xs leading-4 font-bold text-yellow-800 hover:bg-yellow-200 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
      >
        <span
          aria-hidden
          className="block size-3.5 shrink-0 bg-yellow-800"
          style={{
            WebkitMaskImage: `url("${exclamationAlert}")`,
            maskImage: `url("${exclamationAlert}")`,
            WebkitMaskSize: "contain",
            maskSize: "contain",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
          }}
        />
        Requirements updated
      </button>
      {open && box
        ? createPortal(
            <div
              ref={panelRef}
              id={panelId}
              role="dialog"
              aria-label="Requirement update"
              onMouseEnter={cancelClose}
              onMouseLeave={scheduleClose}
              style={{ position: "fixed", top: box.top, left: box.left, width: box.width }}
              className="z-50 flex flex-col gap-2 rounded-[var(--radius-md)] border border-yellow-200 bg-white px-3 py-2 shadow-[var(--shadow-light-bg)]"
            >
              {notes.map((row) => {
                const doc = DOCUMENTS.find((item) => item.id === row.doc);
                return (
                  <div key={`${row.doc}-${row.on}`}>
                    <p className="text-sm leading-5 text-grey-800">
                      From {v35EffectiveDate(row.on)}. {row.note.charAt(0).toUpperCase()}
                      {row.note.slice(1)}
                    </p>
                    {doc ? (
                      <Link
                        to={`/documents/${doc.id}`}
                        className="mt-1 block w-fit text-sm leading-5 font-bold text-purple-600 hover:text-purple-700"
                      >
                        See {doc.name}
                      </Link>
                    ) : null}
                  </div>
                );
              })}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

export function V26GuideCard({
  card,
  role,
  unit,
  extraResources = [],
  embedded,
  hideTitle,
  sharedVoice,
  sharedFact,
  yourMove,
  ifTheyAsk,
  omitAsks,
  doorTitle,
  doorHint,
  doorLabel,
  onDoorClick,
  linkFact,
  filterSystems,
  children,
  timingNote,
  stamp,
  linkResources,
  compact,
  readerActions,
  hideFact,
  footer,
  stepsAside,
  readFlow,
  metaBeside,
  because,
  becausePad,
  stepNo,
  stepTone = "waiting",
  titleEnd,
  titleBelow,
  updateNotes,
}: {
  card: V26Card;
  role: Role;
  unit: Unit;
  extraResources?: V26ExtraResource[];
  embedded?: boolean;
  hideTitle?: boolean;
  /** v27 Process: one fact for every login. Officer still gets If they ask. */
  sharedVoice?: boolean;
  /** v28: civic fact from process-v28-voice. Falls back to v27 when omitted. */
  sharedFact?: string;
  /** Works: this reader's action, ahead of the shared fact. */
  yourMove?: string | null;
  ifTheyAsk?: V26TellLine[] | null;
  /** Skip the shared step list. v37 renovation doors use the door copy only. */
  omitAsks?: boolean;
  doorTitle?: string;
  doorHint?: string;
  doorLabel?: string;
  onDoorClick?: () => void;
  linkFact?: (text: string, role: Role, cardId: string) => ReactNode;
  filterSystems?: (
    systems: { label: string }[],
    fact: string,
    role?: Role,
    cardId?: string,
  ) => { label: string; href?: string; external?: boolean }[];
  children?: ReactNode;
  /** v28: blue info field so RR durations scan. Not a warning banner. */
  timingNote?: boolean;
  /** v28: sitting-level Draft on every pack card until answers are locked. */
  stamp?: string;
  /** v31: Resources uses Process/LinkSection instead of the fold. */
  linkResources?: boolean;
  /** v31 works door: one timing line, no repeated Works hint, actions on one row. */
  compact?: boolean;
  /** v31: show each reader's action. Officer sees every person. */
  readerActions?: boolean;
  /** Skip the repeated fact and Actions block when the parent already has them. */
  hideFact?: boolean;
  /** Sit under the body, full width of the card. */
  footer?: ReactNode;
  /** Works: bullet tasks, with people and documents beside them. */
  stepsAside?: boolean;
  /** One column: the check, then people, documents, and systems as rows, then the action. */
  readFlow?: boolean;
  /** Journey: people and systems sit beside the steps. */
  metaBeside?: boolean;
  /** Why this sitting exists. Stays under the shared fact. */
  because?: string | null;
  /** Leave room for a corner Required for tab. */
  becausePad?: boolean;
  /** 1-based index shown beside the card title. */
  stepNo?: number;
  stepTone?: StepIndexTone;
  /** Compact status or action opposite the title. */
  titleEnd?: ReactNode;
  /** Quiet tip beside the title (e.g. Required for). */
  titleBelow?: ReactNode;
  /** v35: one sentence under the title when this step changed recently. */
  updateNotes?: { on: string; note: string; doc: string; sla?: string }[];
}) {
  const pathname = useLocation().pathname;
  const v35 = usesV35Flow(pathname);
  const stayOnCut = CUT_STANDALONE || isV31Path(pathname);
  const contactable = isV34Path(pathname) || usesV35Flow(pathname)
    ? { unit, role, step: { id: card.id, title: card.title } }
    : undefined;
  const view = v26CardView(card, unit, role);
  const publicView = sharedVoice ? v26CardView(card, unit, "tenant") : view;
  const what = sharedVoice
    ? sharedFact || v27SharedFact(card) || publicView.what
    : view.what;
  const you = sharedVoice ? [] : view.you;
  const tell =
    role !== "officer"
      ? sharedVoice
        ? []
        : view.tell
      : ifTheyAsk && ifTheyAsk.length > 0
        ? ifTheyAsk
        : sharedVoice
          ? (v27IfTheyAsk(card.id) ?? view.tell)
          : view.tell;
  const asked = omitAsks
    ? []
    : ifTheyAsk && ifTheyAsk.length > 0
      ? ifTheyAsk
      : (v27IfTheyAsk(card.id) ?? view.tell);
  const visibleAsks = asked.filter((row) => {
    if (role === "officer") return true;
    return row.who.toLowerCase().startsWith(role);
  });
  const actionRows = readerActions ? visibleAsks : [];
  const timings = sharedVoice ? publicView.timings : view.timings;
  const showChips = !sharedVoice && role === "officer" && view.people.length > 0;
  const systemsVisible =
    role === "officer"
      ? view.systems
      : view.systems.filter(
          (system) => !HIDE_SYSTEM_FOR_READER.has(system.label.toLowerCase()),
        );
  const systems = sharedVoice
    ? (filterSystems ?? v27SystemsNotInFact)(
        systemsVisible,
        what,
        role,
        card.id,
      )
    : systemsVisible;
  const extras = extraResources.filter(
    (row) =>
      !view.docs.some((doc) => doc.name === row.name) &&
      !systems.some((system) => system.label === row.name),
  );
  const need = systems.length + view.docs.length + extras.length;
  const splitResources = Boolean(linkResources && !stepsAside && need > 0);
  const listedPeople = uniqueNames(view.people);
  const bmcServices = contactable
    ? bmcServicesFor(contactable.step, unit, listedPeople.includes(BMC_NAME))
    : [];
  const asidePeople =
    bmcServices.length > 0 && !listedPeople.includes(BMC_NAME)
      ? [...listedPeople, BMC_NAME]
      : listedPeople;
  const contact = contactable && bmcServices.length > 0
    ? { ...contactable, services: bmcServices }
    : undefined;
  const stepLines = bulletLines(visibleAsks);
  const asideDocs = [
    ...view.docs.map((doc) => ({
      id: doc.id,
      name: doc.name,
      href: doc.href,
      external: doc.external,
    })),
    ...extras.map((row) => ({ id: row.id, name: row.name })),
  ];
  const hasAsideMeta =
    Boolean(stepsAside) &&
    asidePeople.length + asideDocs.length + systems.length > 0;
  const beside = Boolean(metaBeside) && hasAsideMeta;
  const resources =
    need > 0 ? (
      linkResources ? (
        <LinkResourceSection
          className={cn("desktop:col-span-5", compact && "mt-3")}
          systems={systems}
          docs={view.docs}
          extras={extras}
        />
      ) : (
        <ResourceFold
          systems={systems}
          docs={view.docs}
          extras={extras}
          embedded={embedded}
          quiet={sharedVoice}
        />
      )
    ) : null;

  return (
    <StepCardShell embedded={embedded}>
      <div
        className={cn(
          splitResources &&
            "desktop:grid desktop:grid-cols-12 desktop:items-start desktop:gap-6",
        )}
      >
      <div
        className={cn(
          "flex min-w-0",
            readFlow
            ? "flex-col gap-3"
            : hasAsideMeta
              ? v35
                ? "flex-col !gap-2"
                : "flex-col gap-4"
              : compact || stepsAside
              ? "flex-col gap-4"
              : "flex-col gap-4 tablet:gap-6",
          splitResources && "desktop:col-span-7",
        )}
      >
      {!hideTitle ? (
        <div
          className={cn(
            "flex items-start justify-between gap-3",
            becausePad && "tablet:pr-56",
          )}
        >
          <GuideStepHeading
            title={card.title}
            tip={titleBelow}
            stepNo={stepNo}
            stepTone={stepTone}
          />
          {titleEnd ?? (stamp ? (
            <span className="shrink-0 rounded-full bg-warning-100 px-2 py-0.5 text-xs leading-4 font-bold text-warning-800">
              {stamp}
            </span>
          ) : null)}
        </div>
      ) : null}
      {updateNotes?.some((row) => row.sla)
        ? updateNotes
            .filter((row) => row.sla)
            .map((row) => {
              const doc = DOCUMENTS.find((item) => item.id === row.doc);
              return (
                <div key={`${row.doc}-${row.on}`} className={V35_SLA}>
                  <span
                    aria-hidden
                    className="mt-0.5 block size-4 shrink-0 bg-blue-600"
                    style={{
                      WebkitMaskImage: `url("${infoIcon}")`,
                      maskImage: `url("${infoIcon}")`,
                      WebkitMaskSize: "16px 16px",
                      maskSize: "16px 16px",
                      WebkitMaskRepeat: "no-repeat",
                      maskRepeat: "no-repeat",
                      WebkitMaskPosition: "center",
                    }}
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <p className="text-sm leading-[18px] font-bold text-grey-900">{row.sla}</p>
                    <p className="text-sm leading-[18px] text-grey-600">
                      With effect from {v35EffectiveDate(row.on)}. {row.note.charAt(0).toUpperCase()}
                      {row.note.slice(1)}
                    </p>
                    {doc ? (
                      <Link
                        to={`/documents/${doc.id}`}
                        className="w-fit text-sm leading-[18px] font-bold text-purple-600 hover:text-purple-700"
                      >
                        See {doc.name}
                      </Link>
                    ) : null}
                  </div>
                </div>
              );
            })
        : null}
      {updateNotes?.some((row) => !row.sla) ? (
        <StepUpdateNote notes={updateNotes.filter((row) => !row.sla)} />
      ) : null}
      <div
        className={cn(
          "flex min-w-0 flex-col",
          readFlow ? "gap-3" : compact || stepsAside ? "gap-4" : "gap-4 tablet:gap-6",
          beside &&
            "tablet:grid tablet:grid-cols-[minmax(0,1fr)_1px_20rem] tablet:items-start tablet:content-start tablet:gap-x-4 tablet:gap-y-4",
        )}
      >
      <div
        className={cn(
          "flex min-w-0 flex-col",
          readFlow ? "gap-3" : "gap-4",
          beside && "tablet:min-w-0",
        )}
      >
      {showChips ||
      (Boolean(yourMove) && !hideFact) ||
      (Boolean(what) && !hideFact) ||
      (Boolean(because) && !hideFact) ? (
      <div className="flex flex-col gap-1">
        {showChips ? (
          <ul className="flex flex-wrap gap-1" aria-label="Who">
            {view.people.map((name) => (
              <li key={name}>
                <WhoTag name={name} role={role} />
              </li>
            ))}
          </ul>
        ) : null}
        {yourMove && !hideFact ? (
          <p
            className={cn(
              "min-w-0 font-bold break-words text-black",
              v35 ? CARD_COPY : "text-sm leading-[18px]",
            )}
          >
            {yourMove}
          </p>
        ) : null}
        {what && !hideFact ? (
          <p
            className={cn(
              "min-w-0 break-words",
              v35 ? cn(CARD_COPY, "text-grey-900") : "text-sm leading-[18px] text-grey-600",
            )}
          >
            {sharedVoice
              ? (linkFact ?? v27LinkedFact)(what, role, card.id)
              : what}
          </p>
        ) : null}
        {because && !hideFact ? (
          <p
            className={cn(
              "min-w-0 break-words text-grey-600",
              v35 ? CARD_COPY : "text-sm leading-[18px]",
            )}
          >
            {because}
          </p>
        ) : null}
      </div>
      ) : null}
      {timings.some(
        (row) =>
          row.kind === "lead" && (!timingNote || !isAfterDuration(row)),
      ) ? (
        <TimingBlock
          label="How early"
          rows={timings.filter(
            (row) =>
              row.kind === "lead" && (!timingNote || !isAfterDuration(row)),
          )}
          role={role}
          sharedVoice={sharedVoice}
          asNote={timingNote}
        />
      ) : null}
      {timingNote &&
      timings.some((row) => row.kind === "lead" && isAfterDuration(row)) ? (
        <TimingBlock
          label="By when"
          rows={timings.filter(
            (row) => row.kind === "lead" && isAfterDuration(row),
          )}
          role={role}
          sharedVoice={sharedVoice}
          asNote={timingNote}
        />
      ) : null}
      {timings.some((row) => row.kind === "window") ? (
        <TimingBlock
          label="Hours allowed"
          rows={timings.filter((row) => row.kind === "window")}
          role={role}
          sharedVoice={sharedVoice}
          asNote={timingNote}
        />
      ) : null}
      {you.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className={FACT_LABEL}>You</p>
          <YourStepsList>
            {you.map((line) => (
              <YourStepsItem key={line}>{line}</YourStepsItem>
            ))}
          </YourStepsList>
        </div>
      ) : null}
      {stepsAside ? (
        <ProcessAside lines={stepLines} dense={readFlow} />
      ) : readerActions && !hideFact && actionRows.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className={FACT_LABEL}>Actions</p>
          <ActorList
            label="Actions"
            rows={actionRows.map((row) => ({
              who: row.who.toLowerCase().startsWith(role) ? "" : row.who,
              do: row.text,
            }))}
          />
        </div>
      ) : role === "officer" && tell.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className={FACT_LABEL}>If they ask</p>
          <ActorList
            label="If they ask"
            rows={tell.map((row) => ({
              who: row.who,
              do: row.text,
            }))}
          />
        </div>
      ) : null}
      {onDoorClick || card.href ? (
        usesV35Flow(pathname) ? (
          <div className={V35_DOOR}>
            <div className="flex min-w-0 items-center gap-1.5">
              <FolderOpen className="size-5 shrink-0 text-black" strokeWidth={1.75} aria-hidden />
              {doorTitle ? (
                <p className="min-w-0 text-base leading-5 font-bold text-black">{doorTitle}</p>
              ) : null}
            </div>
            {(compact
              ? doorHint
              : (doorHint ??
                (sharedVoice
                  ? v27WorksDoorHint(card.id)
                  : WORKS_DOOR_HINT[role]))) ? (
              <p className={cn("min-w-0 text-grey-700", CARD_COPY)}>
                {compact
                  ? doorHint
                  : (doorHint ??
                    (sharedVoice
                      ? v27WorksDoorHint(card.id)
                      : WORKS_DOOR_HINT[role]))}
              </p>
            ) : null}
            <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
              {onDoorClick ? (
                <button type="button" onClick={onDoorClick} className={cn(V35_DOOR_BTN, usesV37Cut(pathname) && "rounded-[var(--radius-sm)]")}>
                  {doorLabel ?? "Open Works"}
                  <GoGlyph className="size-4" />
                </button>
              ) : card.href ? (
                <Link
                  to={stayOnCut ? remapV31Href(card.href) : card.href}
                  className={cn(V35_DOOR_BTN, usesV37Cut(pathname) && "rounded-[var(--radius-sm)]")}
                >
                  {doorLabel ?? "Open Works"}
                  <GoGlyph className="size-4" />
                </Link>
              ) : null}
              {footer}
            </div>
          </div>
        ) : (
        <div className="flex min-w-0 flex-col gap-2 rounded-[var(--radius-lg)] bg-purple-100 px-3.5 py-3">
          <div className="flex min-w-0 flex-col gap-2 tablet:flex-row tablet:items-center tablet:justify-between tablet:gap-3">
            {(compact
              ? doorHint
              : (doorHint ??
                (sharedVoice
                  ? v27WorksDoorHint(card.id)
                  : WORKS_DOOR_HINT[role]))) ? (
              <p className="min-w-0 text-sm leading-5 text-black">
                {compact
                  ? doorHint
                  : (doorHint ??
                    (sharedVoice
                      ? v27WorksDoorHint(card.id)
                      : WORKS_DOOR_HINT[role]))}
              </p>
            ) : null}
            {onDoorClick ? (
              <button type="button" onClick={onDoorClick} className={WORKS_DOOR_BTN}>
                {doorLabel ?? "Open Works"}
                <GoGlyph className="size-3" />
              </button>
            ) : card.href ? (
              <Link
                to={stayOnCut ? remapV31Href(card.href) : card.href}
                className={WORKS_DOOR_BTN}
              >
                {doorLabel ?? "Open Works"}
                <GoGlyph className="size-3" />
              </Link>
            ) : null}
          </div>
          {footer}
        </div>
        )
      ) : null}
      {children}
      {splitResources || stepsAside ? null : resources}
      </div>
      {beside ? (
        <div
          aria-hidden
          className="h-px w-full shrink-0 bg-black/10 tablet:h-auto tablet:w-px tablet:self-stretch"
        />
      ) : null}
      {beside ? (
        <AsideMeta
          people={asidePeople}
          docs={asideDocs}
          systems={systems}
          beside
          contact={contact}
        />
      ) : null}
      </div>
      {hasAsideMeta && !beside ? (
          <AsideMeta
            people={asidePeople}
            docs={asideDocs}
            systems={systems}
            rows={readFlow}
            band={!readFlow}
            contact={contact}
          />
      ) : null}
      </div>
      {splitResources ? resources : null}
      </div>
      {onDoorClick || card.href ? null : readFlow ? (
        <div className="border-t border-grey-100 pt-3">{footer}</div>
      ) : (
        footer
      )}
    </StepCardShell>
  );
}
