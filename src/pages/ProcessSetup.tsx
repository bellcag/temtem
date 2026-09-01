import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  FILTER_GROUPS,
  NAV_FOOTER,
  NAV_PRIMARY,
  PHASE_TABS,
  STEPS,
  UNIT_CHIPS,
  type StepCard,
} from "@/lib/setup-phase-data";

import logo from "@/assets/figma-setup/logo.svg";
import logoMobile from "@/assets/figma-setup/logo-mobile.svg";
import collapseIcon from "@/assets/figma-setup/collapse.svg";
import homeIcon from "@/assets/figma-setup/home.svg";
import processIcon from "@/assets/figma-setup/process.svg";
import documentsIcon from "@/assets/figma-setup/documents.svg";
import permitIcon from "@/assets/figma-setup/permit.svg";
import usefulLinksIcon from "@/assets/figma-setup/useful-links.svg";
import contactsIcon from "@/assets/figma-setup/contacts.svg";
import settingsIcon from "@/assets/figma-setup/settings.svg";
import logoutIcon from "@/assets/figma-setup/logout.svg";
import caretDown from "@/assets/figma-setup/caret-down.svg";
import closeIcon from "@/assets/figma-setup/close.svg";
import hamburgerIcon from "@/assets/figma-setup/hamburger.svg";
import chevronDown from "@/assets/figma-setup/chevron-down.svg";
import displayList from "@/assets/figma-setup/display-list.svg";
import dotIcon from "@/assets/figma-setup/dot.svg";
import linkIcon from "@/assets/figma-setup/link.svg";
import externalLink from "@/assets/figma-setup/external-link.svg";
import pdfIcon from "@/assets/figma-setup/pdf.svg";
import infoIcon from "@/assets/figma-setup/info.svg";

const ICONS: Record<string, string> = {
  home: homeIcon,
  process: processIcon,
  documents: documentsIcon,
  permit: permitIcon,
  "useful-links": usefulLinksIcon,
  contacts: contactsIcon,
  settings: settingsIcon,
  logout: logoutIcon,
};

const ICON_LEAF: Record<string, { w: number; h: number }> = {
  home: { w: 15.19, h: 16.67 },
  process: { w: 16.67, h: 16.67 },
  documents: { w: 15, h: 16.67 },
  permit: { w: 15, h: 16.67 },
  "useful-links": { w: 16.67, h: 16.67 },
  contacts: { w: 18.33, h: 13.33 },
  settings: { w: 15.8, h: 16.67 },
  logout: { w: 13.76, h: 16.32 },
};

function Glyph({
  src,
  box,
  leaf,
  alt = "",
}: {
  src: string;
  box: number;
  leaf: { w: number; h: number };
  alt?: string;
}) {
  return (
    <span className="relative shrink-0" style={{ width: box, height: box }}>
      <img
        src={src}
        alt={alt}
        className="absolute block max-w-none"
        style={{
          width: leaf.w,
          height: leaf.h,
          left: (box - leaf.w) / 2,
          top: (box - leaf.h) / 2,
        }}
      />
    </span>
  );
}

function scrollToStep(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function NavItems({ onPick }: { onPick?: () => void }) {
  return (
    <div className="flex w-full flex-col gap-1">
      {NAV_PRIMARY.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={onPick}
          className="flex w-full items-center rounded-sm px-3 py-1 text-left"
        >
          <span className="flex h-9 items-center gap-3">
            <Glyph src={ICONS[item.icon]} box={20} leaf={ICON_LEAF[item.icon]} />
            <span className="text-base leading-5 text-grey-900">{item.label}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

function NavFooter({ onPick }: { onPick?: () => void }) {
  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex flex-col gap-1">
        {NAV_FOOTER.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={onPick}
            className="flex w-full items-center rounded-sm px-3 py-1 text-left"
          >
            <span className="flex h-9 items-center gap-3">
              <Glyph src={ICONS[item.icon]} box={20} leaf={ICON_LEAF[item.icon]} />
              <span className="text-base leading-5 text-grey-900">{item.label}</span>
            </span>
          </button>
        ))}
      </div>
      <div className="h-px w-full bg-grey-100" />
      <div className="flex items-center gap-4 rounded-md px-1 py-2">
        <div className="relative grid size-10 shrink-0 place-items-center rounded-full bg-grey-100 text-base font-bold leading-6 text-grey-700">
          BL
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold leading-[18px] text-grey-700">Buzz Lightyear</p>
          <p className="text-xs leading-4 text-grey-700">buzz@toystory.com</p>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ className }: { className?: string }) {
  return (
    <aside
      className={cn(
        "flex h-full w-[288px] flex-col justify-between border-r border-grey-100 bg-white py-5 pl-3 pr-[13px]",
        className,
      )}
    >
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between px-3">
          <img src={logo} alt="CHANGI airport group" className="block h-[35px] w-[130px]" />
          <span className="relative size-6 shrink-0">
            <img
              src={collapseIcon}
              alt=""
              className="absolute block h-5 w-5"
              style={{ left: 2, top: 2 }}
            />
          </span>
        </div>
        <NavItems />
      </div>
      <NavFooter />
    </aside>
  );
}

function UnitChips() {
  return (
    <div className="flex gap-1">
      {UNIT_CHIPS.map((chip) => (
        <span
          key={chip}
          className="rounded-sm border border-grey-200 px-1.5 py-0.5 text-[11px] font-bold leading-[14px] text-grey-700"
        >
          {chip}
        </span>
      ))}
    </div>
  );
}

function UnitField() {
  return (
    <div className="flex h-9 w-full items-center overflow-hidden rounded-md border border-grey-200 bg-white">
      <span className="min-w-0 flex-1 truncate px-3 py-[9px] text-sm leading-[18px] text-black">
        T1 B1-23
      </span>
      <span className="flex items-center px-3 py-2">
        <Glyph src={caretDown} box={20} leaf={{ w: 10, h: 5.83 }} />
      </span>
    </div>
  );
}

function PhaseTabs({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-0.5 rounded-xl border border-grey-200 bg-grey-50 p-1",
        className,
      )}
    >
      {PHASE_TABS.map((tab) => {
        const active = tab === "SetUp";
        return (
          <button
            key={tab}
            type="button"
            className={cn(
              "flex h-9 flex-1 items-center justify-center rounded-md px-3 py-2 text-sm font-bold leading-[18px] text-grey-700",
              active && "bg-white shadow-[0px_1px_3px_rgba(18,18,18,0.1),0px_1px_2px_rgba(18,18,18,0.06)]",
            )}
          >
            {tab}
          </button>
        );
      })}
    </div>
  );
}

function ViewByPanel({
  activeId,
  onSelect,
}: {
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-grey-100 bg-white shadow-light-bg">
      <div className="relative bg-white px-6 pt-6 pb-2">
        <p className="text-xl font-bold leading-7 text-grey-900">View By</p>
        <p className="mt-1 text-sm leading-[18px] text-grey-700">
          Select something, to view a card etc....
        </p>
        <button
          type="button"
          className="absolute top-3 right-4 grid size-10 place-items-center rounded-md"
          aria-label="Close"
        >
          <Glyph src={closeIcon} box={20} leaf={{ w: 11.67, h: 11.67 }} />
        </button>
      </div>
      <div className="flex max-h-[min(1116px,calc(100vh-220px))] flex-col gap-4 overflow-y-auto p-6">
        {FILTER_GROUPS.map((group, gi) => (
          <div key={group.heading}>
            {gi > 0 && <div className="mb-4 h-px bg-grey-100" />}
            <p className="py-1 text-base font-bold leading-5 text-black">{group.heading}</p>
            <div className="mt-1.5 flex flex-col gap-1.5">
              {group.items.map((item, ii) => {
                const isActive = item.stepId === activeId;
                return (
                  <button
                    key={`${group.heading}-${item.label}-${ii}`}
                    type="button"
                    onClick={() => onSelect(item.stepId)}
                    className={cn(
                      "w-full rounded-md px-3 py-3 text-left text-base leading-5",
                      isActive
                        ? "bg-purple-100 font-bold text-purple-600"
                        : "pl-1.5 text-black",
                    )}
                  >
                    <span className="line-clamp-1">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepCardView({ step, selected }: { step: StepCard; selected: boolean }) {
  return (
    <article
      id={step.id}
      className={cn(
        "scroll-mt-6 flex flex-col gap-6 rounded-2xl bg-white p-6 shadow-light-bg",
        selected && "shadow-[0_0_0_4px_rgba(158,119,237,0.24)]",
      )}
    >
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-y-3">
          <span className="rounded-full border border-grey-100 bg-grey-25 px-2 py-1.5 text-[11px] font-bold leading-[14px] text-grey-700">
            {step.chip}
          </span>
          <span className="text-sm leading-[18px] text-grey-500">
            Step {step.n} of 13
          </span>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={cn(
                "relative grid size-8 shrink-0 place-items-center overflow-hidden rounded-full border border-grey-100 text-sm font-bold leading-[18px]",
                selected
                  ? "bg-purple-100 text-purple-700 shadow-[0_0_0_2px_#7a35b0]"
                  : "bg-white text-grey-500",
              )}
            >
              {step.n}
            </span>
            <h2 className="min-w-0 flex-1 text-2xl font-bold leading-[30px] text-grey-900">
              {step.title}
            </h2>
          </div>
          <p className="text-lg leading-[22px] text-grey-600">{step.body}</p>
        </div>
      </header>

      {step.guidelines.length > 0 && (
        <section className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Glyph src={displayList} box={24} leaf={{ w: 18, h: 14 }} />
            <h3 className="text-base font-bold leading-5 text-grey-900">Guidelines To Follow</h3>
          </div>
          <ul className="flex flex-col gap-3">
            {step.guidelines.map((g) => (
              <li key={g.text} className="flex items-start gap-1.5">
                <span className="pt-0.5">
                  <Glyph src={dotIcon} box={16} leaf={{ w: 5.33, h: 5.33 }} />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p className="text-sm leading-[18px] text-grey-900">{g.text}</p>
                  {g.ref && (
                    <p className="text-xs font-bold leading-4 text-grey-500">{g.ref}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {step.alsoFollowIf && step.alsoFollowIf.length > 0 && (
        <section className="flex flex-col gap-3 rounded-xl bg-grey-50 p-4">
          <div className="flex items-center gap-2">
            <Glyph src={infoIcon} box={24} leaf={{ w: 20, h: 20 }} />
            <h3 className="text-base font-bold leading-5 text-purple-700">Also Follow If</h3>
          </div>
          {step.alsoFollowIf.map((block) => (
            <div
              key={block.title}
              className="flex flex-col gap-3 rounded-md bg-white px-4 py-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2.5">
                <p className="text-sm font-bold leading-5 text-black">{block.title}</p>
                {block.timing && (
                  <p className="text-xs font-bold leading-4 text-purple-700">{block.timing}</p>
                )}
              </div>
              <ul className="flex flex-col gap-3">
                {block.items.map((g) => (
                  <li key={g.text} className="flex items-start gap-0.5">
                    <span className="pt-0.5">
                      <Glyph src={dotIcon} box={16} leaf={{ w: 5.33, h: 5.33 }} />
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <p className="text-xs leading-[18px] text-grey-900">{g.text}</p>
                      {g.ref && (
                        <p className="text-xs font-bold leading-4 text-grey-500">{g.ref}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {step.systems && step.systems.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Glyph src={linkIcon} box={24} leaf={{ w: 20, h: 20 }} />
            <h3 className="text-base font-bold leading-5 text-black">System To Access</h3>
          </div>
          <div className="flex flex-col gap-1.5">
            {step.systems.map((sys) => (
              <button
                key={sys.title}
                type="button"
                className="flex min-h-16 items-center gap-2 rounded-xl bg-grey-25 px-4 py-3 text-left"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-bold leading-5 text-black">
                    {sys.title}
                  </span>
                  <span className="mt-0.5 block truncate text-sm leading-[18px] text-grey-500">
                    {sys.subtitle}
                  </span>
                </span>
                <Glyph src={externalLink} box={16} leaf={{ w: 16, h: 16 }} />
              </button>
            ))}
          </div>
        </section>
      )}

      {step.docs && step.docs.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-bold leading-[18px] text-grey-500">Reference documents</h3>
          <div className="flex flex-col gap-1.5">
            {step.docs.map((doc) => (
              <button
                key={doc}
                type="button"
                className="flex items-center gap-3 rounded-xl border border-grey-100 py-2 pr-px pl-3 text-left"
              >
                <Glyph src={pdfIcon} box={24} leaf={{ w: 18, h: 20 }} />
                <span className="min-w-0 flex-1 truncate text-sm leading-5 text-grey-500">
                  {doc}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}

export function ProcessSetupPage() {
  const [activeId, setActiveId] = useState(STEPS[0].id);
  const [menuOpen, setMenuOpen] = useState(false);
  const [jumpOpen, setJumpOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  const selectStep = (id: string) => {
    setActiveId(id);
    setJumpOpen(false);
    scrollToStep(id);
  };

  const activeStep = STEPS.find((s) => s.id === activeId) ?? STEPS[0];

  return (
    <div className="min-h-full bg-grey-50">
      <header className="fixed inset-x-0 top-0 z-40 flex h-[60px] items-center justify-between border-b border-grey-100 bg-white px-5 py-4 tablet:hidden">
        <img src={logoMobile} alt="CHANGI airport group" className="block h-7 w-[104px]" />
        <button
          type="button"
          aria-expanded={menuOpen}
          aria-controls="setup-mobile-nav"
          onClick={() => setMenuOpen((v) => !v)}
          className="relative size-6"
        >
          <img
            src={hamburgerIcon}
            alt=""
            className="absolute block h-[14px] w-4"
            style={{ left: 4, top: 5 }}
          />
          <span className="sr-only">Open menu</span>
        </button>
      </header>

      {menuOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-[rgba(18,18,18,0.4)] tablet:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <div
        id="setup-mobile-nav"
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[288px] transition-transform duration-200 tablet:hidden",
          menuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <Sidebar />
      </div>

      <div className="flex min-h-full">
        <div className="sticky top-0 hidden h-screen tablet:block">
          <Sidebar />
        </div>

        <main className="min-w-0 flex-1 px-5 pt-[80px] pb-10 tablet:px-8 tablet:pt-8 tablet:pb-10">
          <div className="hidden tablet:flex tablet:items-start tablet:justify-between tablet:gap-2">
            <div className="min-w-0 flex-1">
              <h1 className="text-[28px] font-bold leading-9 text-black">Process</h1>
              <p className="mt-2 text-sm leading-[18px] text-grey-500">
                Showing journey guide relevant to T1 B1-23 only
              </p>
            </div>
            <div className="flex w-[259px] shrink-0 flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold leading-[18px] text-grey-500">For</span>
                <UnitField />
              </div>
              <div className="flex justify-end">
                <UnitChips />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 tablet:hidden">
            <h1 className="text-xl font-bold leading-7 text-black">Process</h1>
            <p className="text-sm leading-[18px] text-grey-500">
              Showing journey guide relevant to T3 B1-23 only
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold leading-[18px] text-grey-500">For</span>
              <UnitField />
            </div>
            <UnitChips />
          </div>

          <div className="mt-6 flex flex-col gap-6 tablet:mt-6 tablet:flex-row tablet:items-start tablet:gap-6">
            <div className="w-full shrink-0 tablet:w-[351px]">
              <PhaseTabs className="w-full" />
              <div className="mt-4 hidden tablet:block">
                <ViewByPanel activeId={activeId} onSelect={selectStep} />
              </div>
              <div className="relative mt-4 tablet:hidden">
                <button
                  type="button"
                  onClick={() => setJumpOpen((v) => !v)}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-grey-300 bg-white px-3.5 py-2.5 shadow-[0_1px_2px_rgba(18,18,18,0.05)]"
                >
                  <span className="truncate pr-2 text-sm font-bold leading-[18px] text-grey-700">
                    {activeStep.title}
                  </span>
                  <Glyph src={chevronDown} box={20} leaf={{ w: 10, h: 5.83 }} />
                </button>
                {jumpOpen && (
                  <div className="absolute z-20 mt-1 max-h-80 w-full overflow-y-auto rounded-md border border-grey-200 bg-white shadow-light-bg">
                    {STEPS.map((step) => (
                      <button
                        key={step.id}
                        type="button"
                        onClick={() => selectStep(step.id)}
                        className={cn(
                          "block w-full truncate px-3.5 py-2.5 text-left text-sm leading-[18px]",
                          step.id === activeId
                            ? "bg-purple-100 font-bold text-purple-600"
                            : "text-grey-700",
                        )}
                      >
                        {step.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-6 tablet:max-w-[713px]">
              {STEPS.map((step) => (
                <StepCardView
                  key={step.id}
                  step={step}
                  selected={step.id === activeId}
                />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
