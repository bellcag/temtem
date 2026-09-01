import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import {
  UNITS,
  MANAGED_TENANTS,
  TENANT,
  type Unit,
  type ManagedTenant,
} from "@/lib/tenancy-data";

export type Role = "tenant" | "contractor" | "officer";

export type AssistantContext = { docId: string; docName: string } | null;

export const TERMINALS = ["T1", "T2", "T3", "T4"] as const;
export const TENANCY_TYPES = ["Retail", "F&B"] as const;
/** MVP: Airside locked */
export const ZONES = ["Airside"] as const;

export type TerminalOpt = (typeof TERMINALS)[number];
export type TenancyTypeOpt = (typeof TENANCY_TYPES)[number];
export type ZoneOpt = (typeof ZONES)[number];

export type Selection = {
  terminal: TerminalOpt;
  tenancyType: TenancyTypeOpt;
  zone: ZoneOpt;
};

const ALL_UNITS: Unit[] = [
  ...UNITS,
  ...MANAGED_TENANTS.flatMap((t) => t.units),
].filter((u) => u.zone === "Airside" && (u.tenancyType === "F&B" || u.tenancyType === "Retail"));

export function unitFromSelection(sel: Selection, company: string): Unit {
  const match = ALL_UNITS.find(
    (u) =>
      u.terminal === sel.terminal &&
      u.tenancyType === sel.tenancyType &&
      u.zone === "Airside",
  );
  if (match) {
    return { ...match, company: match.company ?? company };
  }
  return {
    id: `sel-${sel.terminal}-${sel.tenancyType}-Airside`,
    unitNo: `${sel.terminal}-AS`,
    terminal: sel.terminal,
    tenancyType: sel.tenancyType,
    zone: "Airside",
    company,
  };
}

export type OfficerScope = { tenant: ManagedTenant | null; unit: Unit } | null;

type AppState = {
  role: Role;
  setRole: (r: Role) => void;
  unit: Unit;
  setUnit: (u: Unit) => void;
  units: Unit[];
  selection: Selection;
  setSelection: (patch: Partial<Selection>) => void;
  officerSelection: Selection | null;
  setOfficerSelection: (s: Selection | null) => void;
  managedTenants: ManagedTenant[];
  officerScope: OfficerScope;
  setOfficerScope: (s: OfficerScope) => void;
  effectiveUnit: Unit | null;
  isUnscoped: boolean;
  assistantOpen: boolean;
  assistantSeed: string | null;
  assistantContext: AssistantContext;
  openAssistant: (seed?: string, context?: AssistantContext) => void;
  closeAssistant: () => void;
  recentDocs: string[];
  trackDoc: (id: string) => void;
  processView: "my-unit" | "full";
  setProcessView: (v: "my-unit" | "full") => void;
  /** Demo-only step progress for Process P2 */
  stepStatus: Record<string, "not-started" | "in-progress" | "done">;
  setStepStatus: (
    key: string,
    status: "not-started" | "in-progress" | "done",
  ) => void;
};

const Ctx = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>(() => {
    try {
      const saved = window.localStorage.getItem("tempo:role");
      if (
        saved === "tenant" ||
        saved === "contractor" ||
        saved === "officer"
      ) {
        return saved;
      }
    } catch {
      /* ignore */
    }
    return "contractor";
  });
  const setRole = useCallback((r: Role) => {
    setRoleState(r);
    try {
      window.localStorage.setItem("tempo:role", r);
    } catch {
      /* ignore */
    }
  }, []);
  const [selection, setSelectionState] = useState<Selection>({
    terminal: "T3",
    tenancyType: "F&B",
    zone: "Airside",
  });
  const [officerSelection, setOfficerSelection] = useState<Selection | null>({
    terminal: "T3",
    tenancyType: "F&B",
    zone: "Airside",
  });
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantSeed, setAssistantSeed] = useState<string | null>(null);
  const [assistantContext, setAssistantContext] =
    useState<AssistantContext>(null);
  const [recentDocs, setRecentDocs] = useState<string[]>([
    "doc-fire",
    "doc-design",
    "doc-method",
  ]);
  const [processView, setProcessView] = useState<"my-unit" | "full">("my-unit");
  const [stepStatus, setStepStatusState] = useState<
    Record<string, "not-started" | "in-progress" | "done">
  >({});

  const setSelection = useCallback((patch: Partial<Selection>) => {
    setSelectionState((prev) => ({
      ...prev,
      ...patch,
      zone: "Airside",
    }));
  }, []);

  const unit = useMemo(
    () => unitFromSelection(selection, TENANT.company),
    [selection],
  );

  const setUnit = useCallback((u: Unit) => {
    setSelectionState((prev) => {
      if (
        prev.terminal === u.terminal &&
        prev.tenancyType === u.tenancyType &&
        prev.zone === "Airside"
      ) {
        return prev;
      }
      return {
        terminal: u.terminal as TerminalOpt,
        tenancyType: u.tenancyType as TenancyTypeOpt,
        zone: "Airside",
      };
    });
  }, []);

  const officerScope: OfficerScope = useMemo(
    () =>
      officerSelection
        ? {
            tenant: null,
            unit: unitFromSelection(officerSelection, "—"),
          }
        : null,
    [officerSelection],
  );

  const setOfficerScope = useCallback((s: OfficerScope) => {
    setOfficerSelection(
      s
        ? {
            terminal: s.unit.terminal as TerminalOpt,
            tenancyType: s.unit.tenancyType as TenancyTypeOpt,
            zone: "Airside",
          }
        : null,
    );
  }, []);

  const openAssistant = useCallback(
    (seed?: string, context?: AssistantContext) => {
      setAssistantSeed(seed ?? null);
      setAssistantContext(context ?? null);
      setAssistantOpen(true);
    },
    [],
  );
  const closeAssistant = useCallback(() => setAssistantOpen(false), []);
  const trackDoc = useCallback((id: string) => {
    setRecentDocs((prev) => {
      if (prev[0] === id) return prev;
      return [id, ...prev.filter((x) => x !== id)].slice(0, 5);
    });
  }, []);

  const setStepStatus = useCallback(
    (key: string, status: "not-started" | "in-progress" | "done") => {
      setStepStatusState((prev) => ({ ...prev, [key]: status }));
    },
    [],
  );

  const { effectiveUnit, isUnscoped } = useMemo(() => {
    if (role === "officer") {
      return {
        effectiveUnit: officerScope?.unit ?? null,
        isUnscoped: !officerScope,
      };
    }
    return { effectiveUnit: unit, isUnscoped: false };
  }, [role, unit, officerScope]);

  const managedTenants = useMemo(
    () =>
      MANAGED_TENANTS.map((t) => ({
        ...t,
        units: t.units.filter(
          (u) =>
            u.zone === "Airside" &&
            (u.tenancyType === "F&B" || u.tenancyType === "Retail"),
        ),
      })).filter((t) => t.units.length > 0),
    [],
  );

  const airsideUnits = useMemo(
    () => UNITS.filter((u) => u.zone === "Airside"),
    [],
  );

  return (
    <Ctx.Provider
      value={{
        role,
        setRole,
        unit,
        setUnit,
        units: airsideUnits,
        selection,
        setSelection,
        officerSelection,
        setOfficerSelection,
        managedTenants,
        officerScope,
        setOfficerScope,
        effectiveUnit,
        isUnscoped,
        assistantOpen,
        assistantSeed,
        assistantContext,
        openAssistant,
        closeAssistant,
        recentDocs,
        trackDoc,
        processView,
        setProcessView,
        stepStatus,
        setStepStatus,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useApp() {
  const c = useContext(Ctx);
  if (!c) throw new Error("AppStateProvider missing");
  return c;
}
