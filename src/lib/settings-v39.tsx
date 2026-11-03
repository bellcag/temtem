import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  ACCOUNT_REQUESTS,
  CONTRACTOR_ACCOUNTS,
  SETTINGS_UNITS,
  TENANT_ACCOUNTS,
  TENANT_STAFF_ACCOUNTS,
  UNIT_CONTRACTOR_POOL,
  type AccountKind,
  type AccountRequest,
  type SettingsUnit,
  type TenantAccount,
} from "@/lib/settings-v39-data";

export interface SettingsToast {
  id: number;
  message: string;
}

interface SettingsAccountsContextValue {
  tenants: TenantAccount[];
  contractors: TenantAccount[];
  staff: TenantAccount[];
  unitContractors: TenantAccount[];
  units: SettingsUnit[];
  requests: AccountRequest[];
  toast: SettingsToast | null;
  showToast: (message: string) => void;
  clearToast: () => void;
  addAccount: (account: TenantAccount) => void;
  updateAccount: (account: TenantAccount) => void;
  deleteAccount: (id: string, kind: AccountKind) => void;
  getAccount: (id: string) => TenantAccount | undefined;
  getUnit: (id: string) => SettingsUnit | undefined;
  updateUnit: (unit: SettingsUnit) => void;
  moveRequestToPending: (id: string) => void;
  removeRequest: (id: string) => void;
  getRequest: (id: string) => AccountRequest | undefined;
  newRequestCount: number;
}

const SettingsAccountsContext = createContext<SettingsAccountsContextValue | null>(null);

let toastSeq = 0;

function setByKind(
  kind: AccountKind,
  setters: {
    tenant: (fn: (prev: TenantAccount[]) => TenantAccount[]) => void;
    contractor: (fn: (prev: TenantAccount[]) => TenantAccount[]) => void;
    staff: (fn: (prev: TenantAccount[]) => TenantAccount[]) => void;
  },
  fn: (prev: TenantAccount[]) => TenantAccount[],
) {
  if (kind === 'tenant') setters.tenant(fn);
  else if (kind === 'contractor') setters.contractor(fn);
  else setters.staff(fn);
}

export function SettingsAccountsProvider({ children }: { children: ReactNode }) {
  const [tenants, setTenants] = useState<TenantAccount[]>(TENANT_ACCOUNTS);
  const [contractors, setContractors] = useState<TenantAccount[]>(CONTRACTOR_ACCOUNTS);
  const [staff, setStaff] = useState<TenantAccount[]>(TENANT_STAFF_ACCOUNTS);
  const [unitContractors, setUnitContractors] =
    useState<TenantAccount[]>(UNIT_CONTRACTOR_POOL);
  const [units, setUnits] = useState<SettingsUnit[]>(SETTINGS_UNITS);
  const [requests, setRequests] = useState<AccountRequest[]>(ACCOUNT_REQUESTS);
  const [toast, setToast] = useState<SettingsToast | null>(null);

  const clearToast = useCallback(() => setToast(null), []);

  const showToast = useCallback((message: string) => {
    const id = ++toastSeq;
    setToast({ id, message });
    window.setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, 3200);
  }, []);

  const setters = useMemo(
    () => ({
      tenant: setTenants,
      contractor: setContractors,
      staff: setStaff,
    }),
    [],
  );

  const addAccount = useCallback(
    (account: TenantAccount) => {
      if (account.kind === 'contractor') {
        setContractors((prev) =>
          prev.some((c) => c.id === account.id)
            ? prev.map((c) => (c.id === account.id ? account : c))
            : [account, ...prev],
        );
        setUnitContractors((prev) => {
          if (prev.some((c) => c.email === account.email || c.id === account.id)) {
            return prev.map((c) =>
              c.email === account.email || c.id === account.id ? account : c,
            );
          }
          return [account, ...prev];
        });
        return;
      }
      setByKind(account.kind, setters, (prev) => [account, ...prev]);
    },
    [setters],
  );

  const updateAccount = useCallback(
    (account: TenantAccount) => {
      if (account.kind === 'contractor') {
        setUnitContractors((prev) => {
          if (prev.some((c) => c.id === account.id)) {
            return prev.map((c) => (c.id === account.id ? account : c));
          }
          return prev;
        });
        setContractors((prev) => {
          if (prev.some((c) => c.id === account.id)) {
            return prev.map((c) => (c.id === account.id ? account : c));
          }
          return prev;
        });
        return;
      }
      setByKind(account.kind, setters, (prev) =>
        prev.map((a) => (a.id === account.id ? account : a)),
      );
    },
    [setters],
  );

  const deleteAccount = useCallback(
    (id: string, kind: AccountKind) => {
      if (kind === 'contractor') {
        setUnitContractors((prev) => prev.filter((a) => a.id !== id));
        setContractors((prev) => prev.filter((a) => a.id !== id));
        setUnits((prev) =>
          prev.map((u) => ({
            ...u,
            contractorIds: u.contractorIds.filter((cid) => cid !== id),
          })),
        );
        return;
      }
      setByKind(kind, setters, (prev) => prev.filter((a) => a.id !== id));
      if (kind === 'staff') {
        setUnits((prev) =>
          prev.map((u) => ({
            ...u,
            staffIds: u.staffIds.filter((sid) => sid !== id),
          })),
        );
      }
    },
    [setters],
  );

  const getAccount = useCallback(
    (id: string) =>
      tenants.find((a) => a.id === id) ??
      contractors.find((a) => a.id === id) ??
      unitContractors.find((a) => a.id === id) ??
      staff.find((a) => a.id === id),
    [tenants, contractors, unitContractors, staff],
  );

  const getUnit = useCallback(
    (id: string) => units.find((u) => u.id === id),
    [units],
  );

  const updateUnit = useCallback((unit: SettingsUnit) => {
    setUnits((prev) => prev.map((u) => (u.id === unit.id ? unit : u)));
  }, []);

  const moveRequestToPending = useCallback((id: string) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, bucket: 'pending' as const } : r)),
    );
  }, []);

  const removeRequest = useCallback((id: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const getRequest = useCallback(
    (id: string) => requests.find((r) => r.id === id),
    [requests],
  );

  const newRequestCount = useMemo(
    () => requests.filter((r) => r.bucket === 'new').length,
    [requests],
  );

  const value = useMemo(
    () => ({
      tenants,
      contractors,
      staff,
      unitContractors,
      units,
      requests,
      toast,
      showToast,
      clearToast,
      addAccount,
      updateAccount,
      deleteAccount,
      getAccount,
      getUnit,
      updateUnit,
      moveRequestToPending,
      removeRequest,
      getRequest,
      newRequestCount,
    }),
    [
      tenants,
      contractors,
      staff,
      unitContractors,
      units,
      requests,
      toast,
      showToast,
      clearToast,
      addAccount,
      updateAccount,
      deleteAccount,
      getAccount,
      getUnit,
      updateUnit,
      moveRequestToPending,
      removeRequest,
      getRequest,
      newRequestCount,
    ],
  );

  return (
    <SettingsAccountsContext.Provider value={value}>
      {children}
    </SettingsAccountsContext.Provider>
  );
}

export function useSettingsAccounts() {
  const ctx = useContext(SettingsAccountsContext);
  if (!ctx) {
    throw new Error('useSettingsAccounts must be used within SettingsAccountsProvider');
  }
  return ctx;
}
