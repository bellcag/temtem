import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Workflow,
  FolderOpen,
  Phone,
  Sparkles,
  ClipboardCheck,
  AppWindow,
  FileEdit,
  History,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import {
  useApp,
  TERMINALS,
  TENANCY_TYPES,
  type Selection,
  type Role,
} from "@/lib/app-state";
import { TENANT, OFFICER, CONTRACTOR } from "@/lib/tenancy-data";
import { cn } from "@/lib/utils";
import {
  Button,
  DropdownField,
  SegmentedControl,
} from "@/components/runway";

type NavChild = { to: string; label: string; icon: LucideIcon };
type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  children?: NavChild[];
};

const navItems: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/process-v3", label: "Process", icon: Workflow },
  { to: "/documents", label: "Document Library", icon: FolderOpen },
  {
    to: "/screener",
    label: "Application Screener",
    icon: ClipboardCheck,
    children: [
      { to: "/screener/drafts", label: "Drafts", icon: FileEdit },
      { to: "/screener/history", label: "History", icon: History },
    ],
  },
  { to: "/apps", label: "Apps Directory", icon: AppWindow },
  { to: "/contacts", label: "Contacts", icon: Phone },
];

const DEFAULT_SELECTION: Selection = {
  terminal: "T3",
  tenancyType: "F&B",
  zone: "Airside",
};

const ROLES: { id: Role; label: string }[] = [
  { id: "tenant", label: "Tenant" },
  { id: "contractor", label: "Contractor" },
  { id: "officer", label: "Project Officer" },
];

export function SideNav({
  onNavigate,
  collapsed = false,
  onToggleCollapse,
}: {
  onNavigate?: () => void;
  /** Tablet+ only — mobile drawer always shows the expanded panel. */
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const {
    role,
    setRole,
    openAssistant,
    selection,
    setSelection,
    officerSelection,
    setOfficerSelection,
  } = useApp();
  const location = useLocation();
  const isOfficer = role === "officer";
  const current = isOfficer ? officerSelection : selection;
  const [ctxOpen, setCtxOpen] = useState(true);
  const [screenerOpen, setScreenerOpen] = useState(
    location.pathname.startsWith("/screener"),
  );

  const pick = (patch: Partial<Selection>) => {
    if (isOfficer) {
      setOfficerSelection({
        ...(officerSelection ?? DEFAULT_SELECTION),
        ...patch,
        zone: "Airside",
      });
    } else {
      setSelection(patch);
    }
  };

  const userLabel =
    role === "officer"
      ? OFFICER.fullName
      : role === "contractor"
        ? CONTRACTOR.fullName
        : TENANT.fullName;

  const userMeta =
    role === "officer"
      ? OFFICER.role
      : role === "contractor"
        ? CONTRACTOR.company
        : TENANT.company;

  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col border-r border-grey-100 bg-white transition-[width] duration-200",
        collapsed ? "w-72 tablet:w-[72px]" : "w-72",
      )}
    >
      <div
        className={cn(
          "flex items-start justify-between gap-2 px-6 pt-6 pb-5",
          collapsed && "tablet:flex-col tablet:items-center tablet:px-3 tablet:pt-5 tablet:pb-3",
        )}
      >
        <div
          className={cn(
            "flex items-center gap-2",
            collapsed && "tablet:flex-col",
          )}
        >
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-purple-600 text-sm font-black text-white">
            T
          </div>
          <div className={cn(collapsed && "tablet:hidden")}>
            <span className="text-xl font-black tracking-tight text-black">
              TeMPo
            </span>
            <p className="mt-1.5 text-[11px] font-bold uppercase tracking-wider text-grey-500">
              Changi Airport Group
            </p>
          </div>
        </div>

        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden h-8 w-8 shrink-0 place-items-center rounded-[var(--radius-sm)] text-grey-600 hover:bg-grey-50 hover:text-black tablet:grid"
            title={collapsed ? "Expand navigation" : "Collapse navigation"}
            aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
            aria-pressed={collapsed}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      <div className={cn("px-4 pb-4", collapsed && "tablet:hidden")}>
        <DropdownField
          label="Demo: sign in as"
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
          title="Prototype only — switches demo account"
          className="px-0"
        >
          {ROLES.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </DropdownField>
        <p className="mt-1.5 px-2 text-[10px] leading-snug text-grey-400">
          Prototype only. Production uses the signed-in account.
        </p>
        <div className="mt-2 px-2">
          <div className="text-sm font-bold text-black">{userLabel}</div>
          <div className="text-xs text-grey-500">{userMeta}</div>
        </div>
      </div>

      <div
        className={cn(
          "border-y border-grey-75 px-4 py-3",
          collapsed && "tablet:hidden",
        )}
      >
        <button
          type="button"
          onClick={() => setCtxOpen((v) => !v)}
          className="flex w-full items-center justify-between px-2 text-[10px] font-bold uppercase tracking-wider text-grey-500"
        >
          Context
          <ChevronDown
            className={cn(
              "h-4 w-4 transition",
              ctxOpen ? "rotate-0" : "-rotate-90",
            )}
          />
        </button>
        {ctxOpen && (
          <div className="mt-3 space-y-3">
            <SegmentedControl
              label="Terminal"
              options={TERMINALS}
              value={current?.terminal ?? null}
              onSelect={(terminal) => pick({ terminal })}
              size="sm"
              className="px-2"
            />
            <SegmentedControl
              label="Tenancy"
              options={TENANCY_TYPES}
              value={current?.tenancyType ?? null}
              onSelect={(tenancyType) => pick({ tenancyType })}
              size="sm"
              className="px-2"
            />
            <SegmentedControl
              label="Zone"
              options={["Airside"] as const}
              value="Airside"
              onSelect={() => pick({ zone: "Airside" })}
              locked
              size="sm"
              className="px-2"
            />
            {isOfficer && !officerSelection && (
              <p className="px-2 text-[11px] text-grey-500">
                Select terminal and tenancy to scope Process to a unit.
              </p>
            )}
          </div>
        )}
      </div>

      <nav
        className={cn(
          "flex-1 space-y-1 overflow-y-auto px-3 py-4",
          collapsed && "tablet:px-2",
        )}
      >
        {navItems.map((item) => {
          if (item.children) {
            const screenerActive = location.pathname.startsWith("/screener");
            return (
              <div key={item.to}>
                {/* Collapsed rail: single icon link into screener */}
                <NavLink
                  to={item.children[0].to}
                  title={item.label}
                  onClick={onNavigate}
                  className={cn(
                    "hidden items-center justify-center rounded-[var(--radius-sm)] px-0 py-2.5 tablet:flex",
                    !collapsed && "tablet:hidden",
                    screenerActive
                      ? "bg-purple-100 text-purple-700"
                      : "text-grey-700 hover:bg-grey-50",
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className="sr-only">{item.label}</span>
                </NavLink>

                {/* Expanded: parent + children */}
                <div className={cn(collapsed && "tablet:hidden")}>
                  <button
                    type="button"
                    onClick={() => setScreenerOpen((v) => !v)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm font-bold",
                      screenerActive
                        ? "bg-purple-100 text-purple-700"
                        : "text-grey-700 hover:bg-grey-50",
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                    <ChevronDown
                      className={cn(
                        "ml-auto h-4 w-4",
                        screenerOpen ? "" : "-rotate-90",
                      )}
                    />
                  </button>
                  {screenerOpen && (
                    <div className="ml-4 mt-1 space-y-1 border-l border-grey-100 pl-2">
                      {item.children.map((c) => (
                        <NavLink
                          key={c.to}
                          to={c.to}
                          onClick={onNavigate}
                          className={({ isActive }) =>
                            cn(
                              "flex items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-sm font-bold",
                              isActive
                                ? "bg-purple-100 text-purple-700"
                                : "text-grey-600 hover:bg-grey-50",
                            )
                          }
                        >
                          <c.icon className="h-3.5 w-3.5" />
                          {c.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          }
          const processActive =
            item.to === "/process-v3" &&
            (location.pathname === "/process" ||
              location.pathname === "/process-v2" ||
              location.pathname === "/process-v3");
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              title={item.label}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm font-bold",
                  isActive || processActive
                    ? "bg-purple-100 text-purple-700"
                    : "text-grey-700 hover:bg-grey-50",
                  collapsed && "tablet:justify-center tablet:px-0",
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className={cn(collapsed && "tablet:hidden")}>
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </nav>

      <div className={cn("border-t border-grey-75 p-4", collapsed && "tablet:p-2")}>
        <Button
          title="Ask Assistant"
          onClick={() => openAssistant()}
          className={cn(
            "w-full",
            collapsed && "tablet:justify-center tablet:px-0",
          )}
        >
          <Sparkles className="h-4 w-4 shrink-0" />
          <span className={cn(collapsed && "tablet:hidden")}>Ask Assistant</span>
        </Button>
      </div>
    </aside>
  );
}
