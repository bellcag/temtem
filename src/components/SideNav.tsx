import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useApp, type Role } from "@/lib/app-state";
import { DEMO_EMAILS } from "@/lib/auth-accounts";
import { jobById, readSavedJobId } from "@/lib/process-job-context";
import {
  applyWorksDemoStory,
  readWorksDemoStory,
  WORKS_CHANGED_EVENT,
  WORKS_DEMO_STORIES,
  WORKS_HREF,
  type WorksDemoStory,
} from "@/lib/process-works-jobs";
import {
  isV26Path,
  readV26Preview,
  V26_PROCESS_HREF,
  V26_WORKS_HREF,
} from "@/lib/process-v26-preview";
import {
  isV27Path,
  readV27Preview,
  V27_PROCESS_HREF,
  V27_WORKS_HREF,
} from "@/lib/process-v27-preview";
import {
  isV28Path,
  processV28Href,
  readV28Preview,
  V28_PROCESS_HREF,
  V28_WORKS_HREF,
} from "@/lib/process-v28-preview";
import {
  applyV28WorksStory,
  readV28WorksStory,
  V28_WORKS_STORIES,
  V28_WORKS_STORY_CHANGED,
  type V28WorksStory,
} from "@/lib/process-v28-seed";
import {
  applyV31WorksStory,
  readV31WorksStory,
  V31_WORKS_STORIES,
  V34_WORKS_STORIES,
  V35_WORKS_STORIES,
  V37_WORKS_STORIES,
  V31_WORKS_STORY_CHANGED,
  type V31WorksStory,
} from "@/lib/process-v31-seed";
import {
  readV26OutletStory,
  v26UnitsForStory,
  writeV26OutletStory,
  V26_OUTLET_CHANGED,
  V26_OUTLET_STORIES,
  type V26OutletStory,
} from "@/lib/process-v26-outlets";
import { resetV26Works, seedV26Works } from "@/lib/process-v26-works";
import { TENANT, OFFICER, CONTRACTOR } from "@/lib/tenancy-data";
import { homeCutHref } from "@/lib/home-cut";
import {
  CUT_STANDALONE,
  cutHomeHref,
  cutProcessHref,
  cutWorksHref,
  isV31Path,
  isV34Path,
  isV35Path,
  isV36Path,
  isV37Path,
  isV38Path,
  isV39Path,
  isV40Path,
  usesV31Nav,
  usesV35Flow,
  usesV36Chrome,
  usesV37Cut,
  V34_HOME_HREF,
  V35_HOME_HREF,
  V36_HOME_HREF,
  V37_HOME_HREF,
  V38_HOME_HREF,
  V39_HOME_HREF,
  V39_SETTINGS_HREF,
  V40_SETTINGS_HREF,
  worksV34Href,
} from "@/lib/process-v31-preview";
import { v37SignedInLabel } from "@/lib/process-v37";
import { cn } from "@/lib/utils";
import { V35SidebarUnit } from "@/components/v35/SidebarUnit";

import logo from "@/assets/figma-setup/logo.svg";
import collapseIcon from "@/assets/figma-setup/collapse.svg";
import caretDown from "@/assets/figma/caret-down.svg";
import caretUp from "@/assets/figma/caret-up.svg";
import homeIcon from "@/assets/figma-setup/home.svg";
import processIcon from "@/assets/figma-setup/process.svg";
import documentsIcon from "@/assets/figma-setup/documents.svg";
import permitIcon from "@/assets/figma-setup/permit.svg";
import projectsIcon from "@/assets/figma-setup/projects.svg";
import usefulLinksIcon from "@/assets/figma-setup/useful-links.svg";
import contactsIcon from "@/assets/figma-setup/contacts.svg";
import chatIcon from "@/assets/figma-setup/chat.svg";
import settingsIcon from "@/assets/figma-setup/settings.svg";
import logoutIcon from "@/assets/figma-setup/logout.svg";

type NavItem = {
  to: string;
  label: string;
  icon: string;
  match?: (path: string) => boolean;
  children?: NavItem[];
};

const NAV_PRIMARY: NavItem[] = [
  { to: "/home", label: "Home", icon: "home" },
  {
    to: "/process",
    label: "Process",
    icon: "process",
    match: (path) => path === "/process" || path.startsWith("/process-"),
  },
  { to: "/documents", label: "Documents", icon: "documents" },
  {
    to: "/screener/drafts",
    label: "Permit Screener",
    icon: "permit",
    match: (path) => path.startsWith("/screener"),
  },
  { to: "/apps", label: "Useful Links", icon: "useful-links" },
  { to: "/contacts", label: "Contacts", icon: "contacts" },
];

const NAV_V26: NavItem[] = [
  { to: "/home", label: "Home", icon: "home" },
  {
    to: V26_PROCESS_HREF,
    label: "Process",
    icon: "process",
    match: (path) => path === V26_PROCESS_HREF || path.startsWith(`${V26_PROCESS_HREF}/`),
  },
  {
    to: V26_WORKS_HREF,
    label: "Works",
    icon: "permit",
    match: (path) =>
      path === V26_WORKS_HREF ||
      path.startsWith(`${V26_WORKS_HREF}/`) ||
      (path.startsWith("/screener") && readV26Preview()),
  },
  { to: "/documents", label: "Documents", icon: "documents" },
  { to: "/apps", label: "Useful Links", icon: "useful-links" },
  { to: "/contacts", label: "Contacts", icon: "contacts" },
];

const NAV_V27: NavItem[] = [
  { to: "/home", label: "Home", icon: "home" },
  {
    to: V27_PROCESS_HREF,
    label: "Process",
    icon: "process",
    match: (path) =>
      path === V27_PROCESS_HREF || path.startsWith(`${V27_PROCESS_HREF}/`),
  },
  {
    to: V27_WORKS_HREF,
    label: "Works",
    icon: "permit",
    match: (path) =>
      path === V27_WORKS_HREF || path.startsWith(`${V27_WORKS_HREF}/`),
  },
  { to: "/documents", label: "Documents", icon: "documents" },
  { to: "/apps", label: "Useful Links", icon: "useful-links" },
  { to: "/contacts", label: "Contacts", icon: "contacts" },
];

const NAV_V28: NavItem[] = [
  { to: "/home", label: "Home", icon: "home" },
  {
    to: V28_PROCESS_HREF,
    label: "Process",
    icon: "process",
    match: (path) =>
      path === V28_PROCESS_HREF || path.startsWith(`${V28_PROCESS_HREF}/`),
  },
  {
    to: V28_WORKS_HREF,
    label: "Works",
    icon: "permit",
    match: (path) =>
      path === V28_WORKS_HREF || path.startsWith(`${V28_WORKS_HREF}/`),
  },
  { to: "/documents", label: "Documents", icon: "documents" },
  { to: "/apps", label: "Useful Links", icon: "useful-links" },
  { to: "/contacts", label: "Contacts", icon: "contacts" },
];

const ICONS: Record<string, string> = {
  home: homeIcon,
  chat: chatIcon,
  process: processIcon,
  documents: documentsIcon,
  permit: permitIcon,
  projects: projectsIcon,
  "useful-links": usefulLinksIcon,
  contacts: contactsIcon,
  settings: settingsIcon,
  logout: logoutIcon,
};

const ICON_LEAF: Record<string, { w: number; h: number }> = {
  home: { w: 15.19, h: 16.67 },
  chat: { w: 16.67, h: 16.67 },
  process: { w: 16.67, h: 16.67 },
  documents: { w: 15, h: 16.67 },
  permit: { w: 15, h: 16.67 },
  projects: { w: 14, h: 16.67 },
  "useful-links": { w: 16.67, h: 16.67 },
  contacts: { w: 18.33, h: 13.33 },
  settings: { w: 15.8, h: 16.67 },
  logout: { w: 13.76, h: 16.32 },
};

const ROLES: { id: Role; label: string }[] = [
  { id: "tenant", label: "Tenant" },
  { id: "contractor", label: "Contractor" },
  { id: "officer", label: "Project Officer" },
];

const PROFILE: Record<Role, { initials: string; email: string }> = {
  tenant: { initials: "ST", email: DEMO_EMAILS.tenant },
  contractor: { initials: "RK", email: DEMO_EMAILS.contractor },
  officer: { initials: "DW", email: DEMO_EMAILS.officer },
};

function Glyph({
  src,
  box,
  leaf,
}: {
  src: string;
  box: number;
  leaf: { w: number; h: number };
}) {
  return (
    <span className="relative shrink-0" style={{ width: box, height: box }}>
      <img
        src={src}
        alt=""
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

function MenuRow({
  to,
  label,
  icon,
  active,
  collapsed,
  nested,
  onClick,
  disabled,
}: {
  to?: string;
  label: string;
  icon: string;
  active?: boolean;
  collapsed?: boolean;
  nested?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const path = useLocation().pathname;
  const v36 = usesV36Chrome(path);
  const v37 = usesV37Cut(path);
  const className = cn(
    "flex w-full items-center rounded-[var(--radius-sm)] px-3 py-1 text-left",
    nested && "pl-8",
    active && (v36 ? "bg-grey-50" : "bg-purple-100"),
    collapsed && "desktop:justify-center desktop:px-0",
    disabled && "cursor-not-allowed opacity-40",
  );
  const inner = (
    <span className="flex h-9 flex-1 items-center gap-3">
      <Glyph src={ICONS[icon]} box={20} leaf={ICON_LEAF[icon]} />
      <span
        className={cn(
          "text-base leading-5",
          active
            ? v37
              ? "font-bold text-grey-900"
              : v36
                ? "font-bold text-grey-700"
                : "font-bold text-purple-600"
            : "text-grey-900",
          collapsed && "desktop:hidden",
        )}
      >
        {label}
      </span>
    </span>
  );

  if (to) {
    return (
      <NavLink to={to} title={label} onClick={onClick} className={className}>
        {inner}
      </NavLink>
    );
  }

  return (
    <button
      type="button"
      title={disabled ? "Not in this drop" : label}
      disabled={disabled}
      onClick={onClick}
      className={className}
    >
      {inner}
    </button>
  );
}

/** v36 Tenancy Journey row. Matches `_Menu tabs` Expanded=Yes. */
function V36JourneyGroup({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const location = useLocation();
  const children = item.children ?? [];
  const parentActive = item.match
    ? item.match(location.pathname)
    : location.pathname === item.to;
  const activeChild = children.find((child) =>
    child.match ? child.match(location.pathname) : location.pathname === child.to,
  );
  const sectionActive = parentActive || Boolean(activeChild);
  const [open, setOpen] = useState(sectionActive);

  useEffect(() => {
    if (sectionActive) setOpen(true);
  }, [sectionActive]);

  return (
    <div className="flex flex-col gap-3">
      <div
        className={cn(
          "group flex h-11 items-center rounded-[var(--radius-sm)] pr-3",
          sectionActive ? "bg-grey-50" : "hover:bg-grey-25",
          collapsed && "desktop:justify-center desktop:px-0 desktop:pr-0",
        )}
      >
        <NavLink
          to={item.to}
          title={item.label}
          onClick={onNavigate}
          className={cn(
            "flex h-full min-w-0 flex-1 items-center gap-3 pl-3",
            collapsed && "desktop:flex-none desktop:justify-center desktop:pl-0",
          )}
        >
          <Glyph src={ICONS[item.icon]} box={20} leaf={ICON_LEAF[item.icon]} />
          <span
            className={cn(
              "text-base leading-5 text-grey-700",
              sectionActive ? "font-bold" : "group-hover:text-grey-900",
              collapsed && "desktop:hidden",
            )}
          >
            {item.label}
          </span>
        </NavLink>
        <button
          type="button"
          className={cn(
            "flex size-5 shrink-0 items-center justify-center",
            collapsed && "desktop:hidden",
          )}
          aria-expanded={open}
          aria-label={open ? "Hide projects" : "Show projects"}
          onClick={() => setOpen((value) => !value)}
        >
          <Glyph
            src={open ? caretUp : caretDown}
            box={20}
            leaf={open ? { w: 12, h: 7 } : { w: 10, h: 6 }}
          />
        </button>
      </div>
      {open ? (
        <div className={cn("flex items-stretch gap-3 pl-[18px]", collapsed && "desktop:hidden")}>
          <span className="w-0.5 shrink-0 self-stretch bg-grey-200" aria-hidden />
          <div className="flex min-w-0 flex-1 flex-col gap-1 pl-1.5">
            {children.map((child) => {
              const childActive = activeChild?.to === child.to;
              return (
                <NavLink
                  key={child.to}
                  to={child.to}
                  title={child.label}
                  onClick={onNavigate}
                  className={cn(
                    "rounded-[var(--radius-sm)] px-2 py-2 text-sm leading-[18px] text-grey-700",
                    childActive ? "bg-grey-50 font-bold" : "hover:bg-grey-25",
                  )}
                >
                  {child.label}
                </NavLink>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function SideNav({
  onNavigate,
  collapsed = false,
  onToggleCollapse,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const { role, setRole, signOut, unit, setUnit, effectiveUnit } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [roleOpen, setRoleOpen] = useState(false);
  const [demoStory, setDemoStory] = useState<WorksDemoStory | null>(null);
  const [v28Story, setV28Story] = useState<V28WorksStory | null>(null);
  const [v31Story, setV31Story] = useState<V31WorksStory | null>(null);
  const [outletStory, setOutletStory] = useState<V26OutletStory>(() =>
    typeof window === "undefined" ? "airport" : readV26OutletStory(),
  );
  const [v26Preview, setV26Preview] = useState(() =>
    typeof window === "undefined" ? false : readV26Preview(),
  );
  const [v27Preview, setV27Preview] = useState(() =>
    typeof window === "undefined" ? false : readV27Preview(),
  );
  const [v28Preview, setV28Preview] = useState(() =>
    typeof window === "undefined" ? false : readV28Preview(),
  );

  useEffect(() => {
    const refresh = () => {
      setDemoStory(readWorksDemoStory());
      setV28Story(readV28WorksStory());
      setV31Story(readV31WorksStory());
      setOutletStory(readV26OutletStory());
      setV26Preview(readV26Preview() || isV26Path(location.pathname));
      setV27Preview(readV27Preview() || isV27Path(location.pathname));
      setV28Preview(readV28Preview() || isV28Path(location.pathname));
    };
    refresh();
    window.addEventListener(WORKS_CHANGED_EVENT, refresh);
    window.addEventListener(V26_OUTLET_CHANGED, refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener("tempo:v26-preview", refresh);
    window.addEventListener("tempo:v27-preview", refresh);
    window.addEventListener("tempo:v28-preview", refresh);
    window.addEventListener(V28_WORKS_STORY_CHANGED, refresh);
    window.addEventListener(V31_WORKS_STORY_CHANGED, refresh);
    return () => {
      window.removeEventListener(WORKS_CHANGED_EVENT, refresh);
      window.removeEventListener(V26_OUTLET_CHANGED, refresh);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("tempo:v26-preview", refresh);
      window.removeEventListener("tempo:v27-preview", refresh);
      window.removeEventListener("tempo:v28-preview", refresh);
      window.removeEventListener(V28_WORKS_STORY_CHANGED, refresh);
      window.removeEventListener(V31_WORKS_STORY_CHANGED, refresh);
    };
  }, [location.pathname]);

  const onV28 = v28Preview || isV28Path(location.pathname);
  const onV27 = !onV28 && (v27Preview || isV27Path(location.pathname));
  const onV26 = !onV28 && !onV27 && (v26Preview || isV26Path(location.pathname));
  const onV31 = usesV31Nav(location.pathname);
  const onV34 = isV34Path(location.pathname);
  const onV35 = isV35Path(location.pathname);
  const onV36 = isV36Path(location.pathname);
  const onV37 = isV37Path(location.pathname);
  const onV38 = isV38Path(location.pathname);
  const onV39 = isV39Path(location.pathname);
  const onV40 = isV40Path(location.pathname);
  const onSettings = onV39 || onV40;
  const settingsHref = onV40 ? V40_SETTINGS_HREF : V39_SETTINGS_HREF;
  const v35Chrome = usesV35Flow(location.pathname);
  const cutHome = cutHomeHref(location.pathname);
  const cutProcess = cutProcessHref(location.pathname);
  const cutWorks = cutWorksHref(location.pathname);
  const onHomeV30 = location.pathname.startsWith("/home-v30");
  const onHomeV29 =
    location.pathname.startsWith("/home-v29") ||
    location.pathname.startsWith("/chat-v29");
  const homeLive = import.meta.env.VITE_HOME_LIVE;
  const homeTo = CUT_STANDALONE || onV31
    ? cutHome
    : homeLive === "v34" || !homeLive
      ? V34_HOME_HREF
      : homeLive === "v33"
        ? "/home-v33"
        : homeLive === "v32"
          ? "/home-v32"
          : homeLive === "v31"
            ? "/home-v31"
            : homeLive === "v30"
              ? "/home-v30"
              : homeLive === "v29"
                ? "/home-v29"
                : onHomeV30
                  ? "/home-v30"
                  : onHomeV29
                    ? "/home-v29"
                    : onV28
                      ? homeCutHref()
                      : V34_HOME_HREF;
  const baseNav = (onV31
    ? NAV_PRIMARY.flatMap((item) => {
        if (item.label === "Permit Screener") return [];
        if (item.to === "/process") {
          const journey = {
            ...item,
            to: cutProcess,
            label: "Tenancy Journey",
            match: (path: string) => path.startsWith(cutProcess),
          };
          const projects = {
            to: cutWorks,
            label: "Projects",
            icon: "projects",
            match: (path: string) =>
              path === cutWorks || path.startsWith(`${cutWorks}/`),
          };
          return [{ ...journey, children: [projects] }];
        }
        return [item];
      })
    : onV28
      ? NAV_V28
      : onV27
        ? NAV_V27
        : onV26
          ? NAV_V26
          : NAV_PRIMARY
  ).map((item) => {
    if (item.to === "/home" && homeTo !== "/home") {
      return {
        ...item,
        to: homeTo,
        match: (path: string) => path.startsWith(homeTo),
      };
    }
    if (onV31 && item.to === "/process") {
      return {
        ...item,
        to: cutProcess,
        match: (path: string) => path.startsWith(cutProcess),
      };
    }
    return item;
  });
  const chatItem: NavItem = {
    to: "/chat-v29",
    label: "Chat",
    icon: "chat",
    match: (path) => path.startsWith("/chat-v29"),
  };
  const navItems =
    homeTo === "/home-v29"
      ? [baseNav[0], chatItem, ...baseNav.slice(1)]
      : baseNav;

  const demoUnit = () => {
    if (role === "officer") return effectiveUnit ?? unit;
    if (role === "contractor") return jobById(readSavedJobId()).unit;
    return unit;
  };
  const demoUnitId = () => demoUnit().id;

  const applyOutletStory = (story: V26OutletStory) => {
    writeV26OutletStory(story);
    setOutletStory(story);
    const allowed = v26UnitsForStory(story);
    if (role === "tenant" && !allowed.some((row) => row.id === unit.id)) {
      const next = allowed[0];
      if (next) setUnit(next);
    }
    setRoleOpen(false);
    onNavigate?.();
    navigate(
      onV31
        ? cutProcess
        : onV28
          ? V28_PROCESS_HREF
          : onV27
            ? V27_PROCESS_HREF
            : V26_PROCESS_HREF,
    );
  };

  const applyV31Story = (story: V31WorksStory) => {
    const workId = applyV31WorksStory(demoUnit(), role, story);
    setV31Story(story);
    setRoleOpen(false);
    onNavigate?.();
    if (
      onV34 &&
      workId &&
      (story === "scope-full" ||
        story === "scope-mixed" ||
        story === "scope-none")
    ) {
      navigate(worksV34Href({ work: workId, result: "scope" }));
      return;
    }
    if (
      v35Chrome &&
      workId &&
      (story === "scope-none" ||
        story === "scope-full" ||
        story === "scope-mixed")
    ) {
      navigate(`${cutWorks}?work=${workId}&tab=answers&result=scope`);
      return;
    }
    if (story === "archive") {
      navigate(`${cutWorks}?list=archived`);
      return;
    }
    if (story === "past") {
      navigate(`${cutWorks}?list=past`);
      return;
    }
    navigate(cutWorks);
  };

  const applyV28Story = (story: V28WorksStory) => {
    applyV28WorksStory(demoUnit(), role, story);
    setV28Story(story);
    setRoleOpen(false);
    onNavigate?.();
    if (story === "mixed") {
      navigate(onHomeV30 ? "/home-v30" : "/home-v29");
      return;
    }
    const row = V28_WORKS_STORIES.find((item) => item.id === story);
    navigate(processV28Href({ phase: row?.phase ?? "build" }));
  };

  const applyDemoStory = (story: WorksDemoStory) => {
    if (onV31) {
      setRoleOpen(false);
      onNavigate?.();
      navigate(cutWorks);
      return;
    }
    if (onV28) {
      applyV28Story("opening");
      return;
    }
    if (onV27 || onV26) {
      resetV26Works(demoUnitId());
      seedV26Works(demoUnitId());
      setRoleOpen(false);
      onNavigate?.();
      navigate(onV27 ? V27_WORKS_HREF : V26_WORKS_HREF);
      return;
    }
    applyWorksDemoStory(demoUnitId(), story);
    setDemoStory(story);
    setRoleOpen(false);
    onNavigate?.();
    navigate(WORKS_HREF);
  };

  const signedIn = usesV37Cut(location.pathname) ? v37SignedInLabel(role) : null;
  const userLabel =
    signedIn ??
    (role === "officer"
      ? OFFICER.fullName
      : role === "contractor"
        ? CONTRACTOR.fullName
        : TENANT.fullName);
  const profile = PROFILE[role];

  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col justify-between border-r border-grey-100 bg-white py-5 pl-3 pr-[13px] transition-[width] duration-200",
        collapsed ? "w-72 desktop:w-[72px] desktop:px-2" : "w-[288px]",
      )}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-8">
        <div
          className={cn(
            "flex items-center justify-between px-3",
            collapsed && "desktop:justify-center desktop:px-0",
          )}
        >
          <img
            src={logo}
            alt="CHANGI airport group"
            className={cn(
              "block h-[35px] w-[130px] object-contain",
              collapsed && "desktop:hidden",
            )}
          />
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="relative hidden size-6 shrink-0 desktop:block"
              title={collapsed ? "Expand navigation" : "Collapse navigation"}
              aria-label={
                collapsed ? "Expand navigation" : "Collapse navigation"
              }
              aria-pressed={collapsed}
            >
              <img
                src={collapseIcon}
                alt=""
                className="absolute block h-5 w-5"
                style={{ left: 2, top: 2 }}
              />
            </button>
          )}
        </div>

        {v35Chrome && !onV36 && !onV37 && !onV38 && !onV39 && !onV40 ? (
          <V35SidebarUnit collapsed={collapsed} />
        ) : null}

        <nav className="flex min-h-0 flex-col gap-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = item.match
              ? item.match(location.pathname)
              : location.pathname === item.to;
            if (item.children?.length && (onV36 || onV37 || onV38 || onV39 || onV40)) {
              return (
                <V36JourneyGroup
                  key={item.to}
                  item={item}
                  collapsed={collapsed}
                  onNavigate={onNavigate}
                />
              );
            }
            if (item.children?.length) {
              return (
                <div key={item.to} className="flex flex-col">
                  <MenuRow
                    to={item.to}
                    label={item.label}
                    icon={item.icon}
                    active={active}
                    collapsed={collapsed}
                    onClick={onNavigate}
                  />
                  {item.children.map((child) => {
                    const childActive = child.match
                      ? child.match(location.pathname)
                      : location.pathname === child.to;
                    return (
                      <MenuRow
                        key={child.to}
                        to={child.to}
                        label={child.label}
                        icon={child.icon}
                        active={childActive}
                        collapsed={collapsed}
                        nested
                        onClick={onNavigate}
                      />
                    );
                  })}
                </div>
              );
            }
            return (
              <MenuRow
                key={item.to}
                to={item.to}
                label={item.label}
                icon={item.icon}
                active={active}
                collapsed={collapsed}
                onClick={onNavigate}
              />
            );
          })}
        </nav>
      </div>

        <div
        className={cn(
          "flex flex-col gap-2",
          collapsed && "desktop:items-center",
        )}
      >
        <div className={cn("flex flex-col gap-1", collapsed && "desktop:hidden")}>
          <MenuRow
            label="Settings"
            icon="settings"
            to={onSettings ? settingsHref : undefined}
            active={onSettings && location.pathname.startsWith(settingsHref)}
            disabled={!onSettings}
          />
          <MenuRow
            label="Log Out"
            icon="logout"
            onClick={() => {
              signOut();
              navigate("/login");
            }}
          />
        </div>
        <div className="h-px w-full bg-grey-100" />
        <div className="relative">
          <button
            type="button"
            aria-haspopup="listbox"
            aria-expanded={roleOpen}
            aria-label="Demo: sign in as"
            onClick={() => setRoleOpen((v) => !v)}
            className={cn(
              "flex w-full items-center gap-4 rounded-[var(--radius-md)] px-1 py-2 text-left",
              collapsed && "desktop:justify-center desktop:px-0",
            )}
          >
            <span className="relative grid size-10 shrink-0 place-items-center rounded-full bg-grey-100 text-base leading-6 font-bold text-grey-700">
              {profile.initials}
            </span>
            <span className={cn("min-w-0", collapsed && "desktop:hidden")}>
              <span className="block text-sm leading-[18px] font-bold text-grey-700">
                {userLabel}
              </span>
              <span className="block text-xs leading-4 text-grey-700">
                {profile.email}
              </span>
            </span>
          </button>
          {roleOpen && (
            <ul
              role="listbox"
              aria-label="Prototype demo"
              className="absolute bottom-full left-0 z-40 mb-1 max-h-[calc(100vh-8rem)] w-full min-w-[220px] overflow-y-auto rounded-[var(--radius-sm)] border border-grey-200 bg-white py-1 shadow-[var(--shadow-light-bg)]"
            >
              {onV37 || onV38 || onV39 ? (
                <>
                  <li className="px-3 pb-1 pt-2 text-xs leading-4 font-bold uppercase tracking-[0.08em] text-grey-400">
                    Version
                  </li>
                  <li>
                    <button
                      type="button"
                      role="option"
                      aria-selected={onV37}
                      onClick={() => {
                        setRoleOpen(false);
                        onNavigate?.();
                        navigate(V37_HOME_HREF);
                      }}
                      className={cn(
                        "w-full px-3 py-2 text-left text-sm leading-[18px]",
                        onV37
                          ? "bg-purple-100 font-bold text-purple-700"
                          : "text-grey-900 hover:bg-grey-50",
                      )}
                    >
                      Home v37
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      role="option"
                      aria-selected={onV38}
                      onClick={() => {
                        setRoleOpen(false);
                        onNavigate?.();
                        navigate(V38_HOME_HREF);
                      }}
                      className={cn(
                        "w-full px-3 py-2 text-left text-sm leading-[18px]",
                        onV38
                          ? "bg-purple-100 font-bold text-purple-700"
                          : "text-grey-900 hover:bg-grey-50",
                      )}
                    >
                      Home v38
                    </button>
                  </li>
                  {onV39 ? (
                    <li>
                      <button
                        type="button"
                        role="option"
                        aria-selected={onV39}
                        onClick={() => {
                          setRoleOpen(false);
                          onNavigate?.();
                          navigate(V39_HOME_HREF);
                        }}
                        className="w-full bg-purple-100 px-3 py-2 text-left text-sm leading-[18px] font-bold text-purple-700"
                      >
                        Home v39
                      </button>
                    </li>
                  ) : null}
                </>
              ) : null}
              {!onV31 ? (
              <li className="px-3 pb-1 pt-2 text-xs leading-4 font-bold uppercase tracking-[0.08em] text-grey-400">
                Preview
              </li>
              ) : null}
              {!onV31 ? (
              <>
              <li>
                <button
                  type="button"
                  role="option"
                  aria-selected={location.pathname.startsWith("/home-v29") || location.pathname.startsWith("/chat-v29")}
                  onClick={() => {
                    setRoleOpen(false);
                    onNavigate?.();
                    navigate("/home-v29");
                  }}
                  className={cn(
                    "w-full px-3 py-2 text-left text-sm leading-[18px]",
                    location.pathname.startsWith("/home-v29") || location.pathname.startsWith("/chat-v29")
                      ? "bg-purple-100 font-bold text-purple-700"
                      : "text-grey-900 hover:bg-grey-50",
                  )}
                >
                  Home v29 · search and chat
                </button>
              </li>
              <li>
                <button
                  type="button"
                  role="option"
                  aria-selected={onV34}
                  onClick={() => {
                    setRoleOpen(false);
                    onNavigate?.();
                    navigate(V34_HOME_HREF);
                  }}
                  className={cn(
                    "w-full px-3 py-2 text-left text-sm leading-[18px]",
                    onV34
                      ? "bg-purple-100 font-bold text-purple-700"
                      : "text-grey-900 hover:bg-grey-50",
                  )}
                >
                  Home v34 · project list
                </button>
              </li>
              <li>
                <button
                  type="button"
                  role="option"
                  aria-selected={onV35}
                  onClick={() => {
                    setRoleOpen(false);
                    onNavigate?.();
                    navigate(V35_HOME_HREF);
                  }}
                  className={cn(
                    "w-full px-3 py-2 text-left text-sm leading-[18px]",
                    onV35
                      ? "bg-purple-100 font-bold text-purple-700"
                      : "text-grey-900 hover:bg-grey-50",
                  )}
                >
                  Home v35
                </button>
              </li>
              <li>
                <button
                  type="button"
                  role="option"
                  aria-selected={onV36}
                  onClick={() => {
                    setRoleOpen(false);
                    onNavigate?.();
                    navigate(V36_HOME_HREF);
                  }}
                  className={cn(
                    "w-full px-3 py-2 text-left text-sm leading-[18px]",
                    onV36
                      ? "bg-purple-100 font-bold text-purple-700"
                      : "text-grey-900 hover:bg-grey-50",
                  )}
                >
                  Home v36
                </button>
              </li>
              <li>
                <button
                  type="button"
                  role="option"
                  aria-selected={onV37}
                  onClick={() => {
                    setRoleOpen(false);
                    onNavigate?.();
                    navigate(V37_HOME_HREF);
                  }}
                  className={cn(
                    "w-full px-3 py-2 text-left text-sm leading-[18px]",
                    onV37
                      ? "bg-purple-100 font-bold text-purple-700"
                      : "text-grey-900 hover:bg-grey-50",
                  )}
                >
                  Home v37
                </button>
              </li>
              <li>
                <button
                  type="button"
                  role="option"
                  aria-selected={onV38}
                  onClick={() => {
                    setRoleOpen(false);
                    onNavigate?.();
                    navigate(V38_HOME_HREF);
                  }}
                  className={cn(
                    "w-full px-3 py-2 text-left text-sm leading-[18px]",
                    onV38
                      ? "bg-purple-100 font-bold text-purple-700"
                      : "text-grey-900 hover:bg-grey-50",
                  )}
                >
                  Home v38
                </button>
              </li>
              <li>
                <button
                  type="button"
                  role="option"
                  aria-selected={
                    location.pathname.startsWith("/home-v33") ||
                    location.pathname.startsWith("/process-v33") ||
                    location.pathname.startsWith("/works-v33")
                  }
                  onClick={() => {
                    setRoleOpen(false);
                    onNavigate?.();
                    navigate("/home-v33");
                  }}
                  className={cn(
                    "w-full px-3 py-2 text-left text-sm leading-[18px]",
                    location.pathname.startsWith("/home-v33") ||
                      location.pathname.startsWith("/process-v33") ||
                      location.pathname.startsWith("/works-v33")
                      ? "bg-purple-100 font-bold text-purple-700"
                      : "text-grey-900 hover:bg-grey-50",
                  )}
                >
                  Home v33 · previous cut
                </button>
              </li>
              <li>
                <button
                  type="button"
                  role="option"
                  aria-selected={onHomeV30}
                  onClick={() => {
                    setRoleOpen(false);
                    onNavigate?.();
                    navigate("/home-v30");
                  }}
                  className={cn(
                    "w-full px-3 py-2 text-left text-sm leading-[18px]",
                    onHomeV30
                      ? "bg-purple-100 font-bold text-purple-700"
                      : "text-grey-900 hover:bg-grey-50",
                  )}
                >
                  Home v30 · ask or search
                </button>
              </li>
              <li className="mx-3 my-1 h-px bg-grey-100" aria-hidden />
              </>
              ) : null}
              <li className="px-3 pb-1 pt-1 text-xs leading-4 font-bold uppercase tracking-[0.08em] text-grey-400">
                Sign in as
              </li>
              {ROLES.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={role === r.id}
                    onClick={() => {
                      setRoleOpen(false);
                      if (r.id === role) return;
                      setRole(r.id);
                      onNavigate?.();
                      if (
                        location.pathname.startsWith("/home-v29") ||
                        location.pathname.startsWith("/chat-v29")
                      ) {
                        navigate("/home-v29");
                        return;
                      }
                      if (isV31Path(location.pathname)) {
                        return;
                      }
                      if (location.pathname.startsWith("/home-v30")) {
                        navigate("/home-v30");
                        return;
                      }
                      if (onV28) {
                        if (r.id === "contractor") {
                          navigate(V28_WORKS_HREF);
                          return;
                        }
                        navigate(`${V28_PROCESS_HREF}?phase=setup`);
                        return;
                      }
                      if (onV27) {
                        if (r.id === "contractor") {
                          navigate(V27_WORKS_HREF);
                          return;
                        }
                        navigate(`${V27_PROCESS_HREF}?phase=setup`);
                        return;
                      }
                      if (onV26) {
                        if (r.id === "contractor") {
                          navigate(V26_WORKS_HREF);
                          return;
                        }
                        navigate(`${V26_PROCESS_HREF}?phase=setup`);
                        return;
                      }
                      navigate("/process?phase=setup");
                    }}
                    className={cn(
                      "w-full px-3 py-2 text-left text-sm leading-[18px]",
                      role === r.id
                        ? "bg-purple-100 font-bold text-purple-700"
                        : "text-grey-900 hover:bg-grey-50",
                    )}
                  >
                    {r.label}
                  </button>
                </li>
              ))}
              {(onV28 || onV27 || onV26) && !onV31 && (
                <>
                  <li className="mx-3 my-1 h-px bg-grey-100" aria-hidden />
                  <li className="px-3 pb-1 pt-1 text-xs leading-4 font-bold uppercase tracking-[0.08em] text-grey-400">
                    Tenant outlets
                  </li>
                  {V26_OUTLET_STORIES.map((story) => (
                    <li key={story.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={outletStory === story.id}
                        onClick={() => applyOutletStory(story.id)}
                        className={cn(
                          "w-full px-3 py-2 text-left text-sm leading-[18px]",
                          outletStory === story.id
                            ? "bg-purple-100 font-bold text-purple-700"
                            : "text-grey-900 hover:bg-grey-50",
                        )}
                      >
                        {story.label}
                      </button>
                    </li>
                  ))}
                </>
              )}
              {onV31 ? (
                <>
                  {onV35 || onV37 || onV38 || onV39 || onV40 ? null : (
                  <>
                  <li className="mx-3 my-1 h-px bg-grey-100" aria-hidden />
                  <li className="px-3 pb-1 pt-1 text-xs leading-4 font-bold uppercase tracking-[0.08em] text-grey-400">
                    Preview
                  </li>
                  <li>
                    <button
                      type="button"
                      role="option"
                      aria-selected={onV35}
                      onClick={() => {
                        setRoleOpen(false);
                        onNavigate?.();
                        navigate(V35_HOME_HREF);
                      }}
                      className={cn(
                        "w-full px-3 py-2 text-left text-sm leading-[18px]",
                        onV35
                          ? "bg-purple-100 font-bold text-purple-700"
                          : "text-grey-900 hover:bg-grey-50",
                      )}
                    >
                      Home v35
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      role="option"
                      aria-selected={onV36}
                      onClick={() => {
                        setRoleOpen(false);
                        onNavigate?.();
                        navigate(V36_HOME_HREF);
                      }}
                      className={cn(
                        "w-full px-3 py-2 text-left text-sm leading-[18px]",
                        onV36
                          ? "bg-purple-100 font-bold text-purple-700"
                          : "text-grey-900 hover:bg-grey-50",
                      )}
                    >
                      Home v36
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      role="option"
                      aria-selected={onV37}
                      onClick={() => {
                        setRoleOpen(false);
                        onNavigate?.();
                        navigate(V37_HOME_HREF);
                      }}
                      className={cn(
                        "w-full px-3 py-2 text-left text-sm leading-[18px]",
                        onV37
                          ? "bg-purple-100 font-bold text-purple-700"
                          : "text-grey-900 hover:bg-grey-50",
                      )}
                    >
                      Home v37
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      role="option"
                      aria-selected={onV38}
                      onClick={() => {
                        setRoleOpen(false);
                        onNavigate?.();
                        navigate(V38_HOME_HREF);
                      }}
                      className={cn(
                        "w-full px-3 py-2 text-left text-sm leading-[18px]",
                        onV38
                          ? "bg-purple-100 font-bold text-purple-700"
                          : "text-grey-900 hover:bg-grey-50",
                      )}
                    >
                      Home v38
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      role="option"
                      aria-selected={onV34}
                      onClick={() => {
                        setRoleOpen(false);
                        onNavigate?.();
                        navigate(V34_HOME_HREF);
                      }}
                      className={cn(
                        "w-full px-3 py-2 text-left text-sm leading-[18px]",
                        onV34
                          ? "bg-purple-100 font-bold text-purple-700"
                          : "text-grey-900 hover:bg-grey-50",
                      )}
                    >
                      Home v34 · previous cut
                    </button>
                  </li>
                  </>
                  )}
                  <li className="mx-3 my-1 h-px bg-grey-100" aria-hidden />
                  <li className="px-3 pb-1 pt-1 text-xs leading-4 font-bold uppercase tracking-[0.08em] text-grey-400">
                    Project story
                  </li>
                  {(onV37 || onV38 || onV39 || onV40
                    ? V37_WORKS_STORIES
                    : v35Chrome
                    ? V35_WORKS_STORIES
                    : onV34
                      ? V34_WORKS_STORIES
                      : V31_WORKS_STORIES
                  ).flatMap((story) => {
                    const row =
                      (onV37 || onV38 || onV39 || onV40) && story.id === "exit"
                        ? { ...story, label: "Outgoing handover" }
                        : story;
                    return (onV37 || onV38 || onV39 || onV40) && story.id === "busy"
                      ? [row, { id: "past" as const, label: "Past projects" }]
                      : [row];
                  }).map(
                    (story) => (
                    <li key={story.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={v31Story === story.id}
                        onClick={() => applyV31Story(story.id)}
                        className={cn(
                          "w-full px-3 py-2 text-left text-sm leading-[18px]",
                          v31Story === story.id
                            ? "bg-purple-100 font-bold text-purple-700"
                            : "text-grey-900 hover:bg-grey-50",
                        )}
                      >
                        {story.label}
                      </button>
                    </li>
                  ),
                  )}
                </>
              ) : null}
              {!onV31 ? (
              <>
              <li className="mx-3 my-1 h-px bg-grey-100" aria-hidden />
              <li className="px-3 pb-1 pt-1 text-xs leading-4 font-bold uppercase tracking-[0.08em] text-grey-400">
                {onV28 ? "Works story" : "Reset Works"}
              </li>
              {(onV28 ? V28_WORKS_STORIES : WORKS_DEMO_STORIES).map((story) => (
                <li key={story.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={
                      onV28 ? v28Story === story.id : demoStory === story.id
                    }
                    onClick={() =>
                      onV28
                        ? applyV28Story(story.id as V28WorksStory)
                        : applyDemoStory(story.id as WorksDemoStory)
                    }
                    className={cn(
                      "w-full px-3 py-2 text-left text-sm leading-[18px]",
                      (onV28 ? v28Story === story.id : demoStory === story.id)
                        ? "bg-purple-100 font-bold text-purple-700"
                        : "text-grey-900 hover:bg-grey-50",
                    )}
                  >
                    {story.label}
                  </button>
                </li>
              ))}
              </>
              ) : null}
            </ul>
          )}
        </div>
      </div>
    </aside>
  );
}
