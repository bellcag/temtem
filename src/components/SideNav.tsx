import { NavLink, useLocation } from "react-router-dom";
import { useState } from "react";
import { useApp, type Role } from "@/lib/app-state";
import { TENANT, OFFICER, CONTRACTOR } from "@/lib/tenancy-data";
import { cn } from "@/lib/utils";

import logo from "@/assets/figma-setup/logo.svg";
import collapseIcon from "@/assets/figma-setup/collapse.svg";
import homeIcon from "@/assets/figma-setup/home.svg";
import processIcon from "@/assets/figma-setup/process.svg";
import documentsIcon from "@/assets/figma-setup/documents.svg";
import permitIcon from "@/assets/figma-setup/permit.svg";
import usefulLinksIcon from "@/assets/figma-setup/useful-links.svg";
import contactsIcon from "@/assets/figma-setup/contacts.svg";
import settingsIcon from "@/assets/figma-setup/settings.svg";
import logoutIcon from "@/assets/figma-setup/logout.svg";

type NavItem = {
  to: string;
  label: string;
  icon: string;
  match?: (path: string) => boolean;
};

const NAV_PRIMARY: NavItem[] = [
  { to: "/home", label: "Home", icon: "home" },
  {
    to: "/process-v19",
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

const ROLES: { id: Role; label: string }[] = [
  { id: "tenant", label: "Tenant" },
  { id: "contractor", label: "Contractor" },
  { id: "officer", label: "Project Officer" },
];

const PROFILE: Record<Role, { initials: string; email: string }> = {
  tenant: { initials: "ST", email: "sarah.tan@kopico.sg" },
  contractor: { initials: "RK", email: "raj.kumar@buildright.sg" },
  officer: { initials: "DW", email: "daniel.wong@changiairport.com" },
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
  onClick,
}: {
  to?: string;
  label: string;
  icon: string;
  active?: boolean;
  collapsed?: boolean;
  onClick?: () => void;
}) {
  const className = cn(
    "flex w-full items-center rounded-[var(--radius-sm)] px-3 py-1 text-left",
    active && "bg-purple-100",
    collapsed && "tablet:justify-center tablet:px-0",
  );
  const inner = (
    <span className="flex h-9 flex-1 items-center gap-3">
      <Glyph src={ICONS[icon]} box={20} leaf={ICON_LEAF[icon]} />
      <span
        className={cn(
          "text-base leading-5",
          active ? "font-bold text-purple-600" : "text-grey-900",
          collapsed && "tablet:hidden",
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
    <button type="button" title={label} onClick={onClick} className={className}>
      {inner}
    </button>
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
  const { role, setRole } = useApp();
  const location = useLocation();
  const [roleOpen, setRoleOpen] = useState(false);

  const userLabel =
    role === "officer"
      ? OFFICER.fullName
      : role === "contractor"
        ? CONTRACTOR.fullName
        : TENANT.fullName;
  const profile = PROFILE[role];

  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col justify-between border-r border-grey-100 bg-white py-5 pl-3 pr-[13px] transition-[width] duration-200",
        collapsed ? "w-72 tablet:w-[72px] tablet:px-2" : "w-[288px]",
      )}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-8">
        <div
          className={cn(
            "flex items-center justify-between px-3",
            collapsed && "tablet:justify-center tablet:px-0",
          )}
        >
          <img
            src={logo}
            alt="CHANGI airport group"
            className={cn(
              "block h-[35px] w-[130px]",
              collapsed && "tablet:hidden",
            )}
          />
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="relative hidden size-6 shrink-0 tablet:block"
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

        <nav className="flex min-h-0 flex-col gap-1 overflow-y-auto">
          {NAV_PRIMARY.map((item) => {
            const active = item.match
              ? item.match(location.pathname)
              : location.pathname === item.to;
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
          collapsed && "tablet:items-center",
        )}
      >
        <div className={cn("flex flex-col gap-1", collapsed && "tablet:hidden")}>
          <MenuRow label="Settings" icon="settings" />
          <MenuRow
            label="Log Out"
            icon="logout"
            onClick={() => setRole("tenant")}
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
              collapsed && "tablet:justify-center tablet:px-0",
            )}
          >
            <span className="relative grid size-10 shrink-0 place-items-center rounded-full bg-grey-100 text-base leading-6 font-bold text-grey-700">
              {profile.initials}
            </span>
            <span className={cn("min-w-0", collapsed && "tablet:hidden")}>
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
              aria-label="Demo: sign in as"
              className="absolute inset-x-0 bottom-full z-40 mb-1 overflow-hidden rounded-[var(--radius-sm)] border border-grey-200 bg-white py-1 shadow-[var(--shadow-light-bg)]"
            >
              {ROLES.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={role === r.id}
                    onClick={() => {
                      setRole(r.id);
                      setRoleOpen(false);
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
            </ul>
          )}
        </div>
      </div>
    </aside>
  );
}
