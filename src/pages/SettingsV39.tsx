import { useMemo, useState, type ReactNode } from "react";
import { Link, Outlet, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
import { ActionButton } from "@/components/dls/ActionButton";
import { useApp } from "@/lib/app-state";
import { V39_SETTINGS_HREF, V40_SETTINGS_HREF } from "@/lib/process-v31-preview";
import {
  ACCOUNTS_PAGE_SIZE,
  AVAILABLE_UNITS,
  CONTRACTOR_COMPANIES,
  DEMO_CONTRACTOR_COMPANY,
  DEMO_TENANT_COMPANY,
  TENANT_COMPANIES,
  requestTypeLabel,
  statusLabel,
  type AccountKind,
  type AccountRequest,
  type AccountRole,
  type AccountUnit,
  type SettingsUnit,
  type TenantAccount,
} from "@/lib/settings-v39-data";
import {
  SettingsAccountsProvider,
  useSettingsAccounts,
} from "@/lib/settings-v39";

function settingsRoot() {
  if (typeof window !== "undefined" && window.location.pathname.startsWith(V40_SETTINGS_HREF)) {
    return V40_SETTINGS_HREF;
  }
  return V39_SETTINGS_HREF;
}

type MainTab = "accounts" | "units";
type AccountSub = "tenants" | "contractors" | "requests";

function homeHref(tab?: MainTab, sub?: AccountSub) {
  const search = new URLSearchParams();
  if (tab) search.set("tab", tab);
  if (sub) search.set("sub", sub);
  const q = search.toString();
  return q ? `${settingsRoot()}?${q}` : settingsRoot();
}

export function SettingsV39Layout() {
  return (
    <SettingsAccountsProvider>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 py-6 tablet:px-8">
        <Outlet />
        <SettingsToast />
      </div>
    </SettingsAccountsProvider>
  );
}

function SettingsToast() {
  const { toast } = useSettingsAccounts();
  if (!toast) return null;
  return (
    <p
      role="status"
      className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-[var(--radius-sm)] bg-grey-900 px-4 py-2 text-sm leading-[18px] text-white"
    >
      {toast.message}
    </p>
  );
}

export function SettingsV39Home() {
  const { role } = useApp();
  if (role === "officer") return <OfficerSettings />;
  if (role === "contractor") return <CompanySettings variant="contractor" />;
  return <CompanySettings variant="tenant" />;
}

function OfficerSettings() {
  const [params, setParams] = useSearchParams();
  const tab: MainTab = params.get("tab") === "units" ? "units" : "accounts";
  const subRaw = params.get("sub");
  const sub: AccountSub =
    subRaw === "contractors" || subRaw === "requests" ? subRaw : "tenants";
  const setTab = (next: MainTab) => {
    const search = new URLSearchParams();
    search.set("tab", next);
    if (next === "accounts") search.set("sub", sub);
    setParams(search);
  };
  const setSub = (next: AccountSub) => {
    const search = new URLSearchParams();
    search.set("tab", "accounts");
    search.set("sub", next);
    setParams(search);
  };

  return (
    <>
      <h1 className="text-lg leading-[22px] font-bold text-black">Settings</h1>
      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { id: "accounts", label: "Accounts" },
          { id: "units", label: "Units" },
        ]}
      />
      {tab === "units" ? (
        <UnitsTable variant="officer" />
      ) : (
        <OfficerAccounts sub={sub} onSub={setSub} />
      )}
    </>
  );
}

function OfficerAccounts({
  sub,
  onSub,
}: {
  sub: AccountSub;
  onSub: (sub: AccountSub) => void;
}) {
  const navigate = useNavigate();
  const { tenants, contractors, newRequestCount, deleteAccount, showToast } =
    useSettingsAccounts();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<TenantAccount | null>(null);
  const [unitsTarget, setUnitsTarget] = useState<TenantAccount | null>(null);
  const source = sub === "contractors" ? contractors : tenants;
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return source;
    return source.filter(
      (account) =>
        account.name.toLowerCase().includes(q) ||
        account.company.toLowerCase().includes(q) ||
        account.email.toLowerCase().includes(q),
    );
  }, [source, search]);

  return (
    <>
      <div className="flex flex-col gap-3 tablet:flex-row tablet:items-center tablet:justify-between">
        <SubTabs
          value={sub}
          badge={newRequestCount}
          onChange={(next) => {
            setSearch("");
            setPage(1);
            onSub(next);
          }}
        />
        {sub !== "requests" ? (
          <div className="flex flex-col gap-3 tablet:flex-row">
            <SearchField
              value={search}
              placeholder="Search by company or name"
              onChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
            />
            <ActionButton
              size="sm"
              iconStart={<Plus className="size-4" aria-hidden />}
              onClick={() =>
                navigate(
                  `${settingsRoot()}/accounts/${sub === "contractors" ? "contractors" : "tenants"}/new`,
                )
              }
            >
              New Account
            </ActionButton>
          </div>
        ) : null}
      </div>
      {sub === "requests" ? (
        <RequestsList />
      ) : (
        <AccountTable
          accounts={pageOf(filtered, page)}
          page={Math.min(page, pageCount(filtered))}
          pages={pageCount(filtered)}
          onPage={setPage}
          onEdit={(account) =>
            navigate(
              `${settingsRoot()}/accounts/${account.kind === "contractor" ? "contractors" : "tenants"}/${account.id}/edit`,
            )
          }
          onDelete={setDeleteTarget}
          onUnits={setUnitsTarget}
        />
      )}
      {deleteTarget ? (
        <ConfirmModal
          title={
            deleteTarget.kind === "contractor"
              ? "Delete contractor account?"
              : "Delete tenant account?"
          }
          body={`${deleteTarget.name} · ${deleteTarget.email}`}
          confirm="Delete"
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => {
            deleteAccount(deleteTarget.id, deleteTarget.kind);
            showToast(
              deleteTarget.kind === "contractor"
                ? "Contractor deleted"
                : "Tenant deleted",
            );
            setDeleteTarget(null);
          }}
        />
      ) : null}
      {unitsTarget ? (
        <UnitsModal account={unitsTarget} onClose={() => setUnitsTarget(null)} />
      ) : null}
    </>
  );
}

function CompanySettings({ variant }: { variant: "tenant" | "contractor" }) {
  const { role } = useApp();
  const company =
    variant === "contractor" ? DEMO_CONTRACTOR_COMPANY : DEMO_TENANT_COMPANY;
  const [params, setParams] = useSearchParams();
  const tab: MainTab = params.get("tab") === "units" ? "units" : "accounts";
  const navigate = useNavigate();
  const { staff, unitContractors, deleteAccount, showToast } = useSettingsAccounts();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<TenantAccount | null>(null);
  const [unitsTarget, setUnitsTarget] = useState<TenantAccount | null>(null);
  const people = useMemo(() => {
    const source = variant === "contractor" ? unitContractors : staff;
    return source.filter((account) => account.company === company);
  }, [variant, unitContractors, staff, company]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return people;
    return people.filter(
      (account) =>
        account.name.toLowerCase().includes(q) ||
        account.email.toLowerCase().includes(q),
    );
  }, [people, search]);

  return (
    <>
      <h1 className="text-lg leading-[22px] font-bold text-black">Settings</h1>
      <p className="text-sm leading-[18px] text-grey-600">{company}</p>
      <Tabs
        value={tab}
        onChange={(next) => {
          const searchParams = new URLSearchParams();
          searchParams.set("tab", next);
          setParams(searchParams);
        }}
        items={[
          { id: "accounts", label: "Accounts" },
          { id: "units", label: "Units" },
        ]}
      />
      {tab === "units" ? (
        <UnitsTable variant={variant} company={company} />
      ) : (
        <>
          <div className="flex flex-col gap-3 tablet:flex-row tablet:items-center tablet:justify-between">
            <SearchField
              value={search}
              placeholder="Search by name"
              onChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
            />
            <ActionButton
              size="sm"
              iconStart={<Plus className="size-4" aria-hidden />}
              onClick={() => navigate(`${settingsRoot()}/staff/new`)}
            >
              Add New Staff
            </ActionButton>
          </div>
          <AccountTable
            accounts={pageOf(filtered, page)}
            page={Math.min(page, pageCount(filtered))}
            pages={pageCount(filtered)}
            onPage={setPage}
            hideCompany
            onEdit={(account) =>
              navigate(`${settingsRoot()}/staff/${account.id}/edit`)
            }
            onDelete={setDeleteTarget}
            onUnits={setUnitsTarget}
          />
        </>
      )}
      {deleteTarget ? (
        <ConfirmModal
          title="Delete staff account?"
          body={`${deleteTarget.name} · ${deleteTarget.email}`}
          confirm="Delete"
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => {
            deleteAccount(
              deleteTarget.id,
              role === "contractor" ? "contractor" : "staff",
            );
            showToast("Staff deleted");
            setDeleteTarget(null);
          }}
        />
      ) : null}
      {unitsTarget ? (
        <UnitsModal account={unitsTarget} onClose={() => setUnitsTarget(null)} />
      ) : null}
    </>
  );
}

function RequestsList() {
  const { requests } = useSettingsAccounts();
  const navigate = useNavigate();
  const fresh = requests.filter((request) => request.bucket === "new");
  const pending = requests.filter((request) => request.bucket === "pending");
  return (
    <div className="flex flex-col gap-8">
      <RequestGroup
        title="New Requests"
        empty="No new requests"
        requests={fresh}
        onReview={(request) =>
          navigate(`${settingsRoot()}/accounts/requests/${request.id}`)
        }
      />
      <RequestGroup title="Pending" empty="No requests pending signup" requests={pending} />
    </div>
  );
}

function RequestGroup({
  title,
  empty,
  requests,
  onReview,
}: {
  title: string;
  empty: string;
  requests: AccountRequest[];
  onReview?: (request: AccountRequest) => void;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-base leading-5 font-bold text-black">{title}</h2>
      {requests.length === 0 ? (
        <p className="rounded-[var(--radius-lg)] border border-grey-200 bg-white px-4 py-6 text-sm leading-[18px] text-grey-500">
          {empty}
        </p>
      ) : (
        <ul className="overflow-hidden rounded-[var(--radius-lg)] border border-grey-200 bg-white">
          {requests.map((request) => (
            <li
              key={request.id}
              className="flex items-center gap-3 border-b border-grey-100 px-4 py-3 last:border-b-0"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs leading-4 font-bold text-grey-500">
                  {request.bucket === "pending"
                    ? "Awaiting signup"
                    : requestTypeLabel(request.type)}
                </p>
                <p className="mt-1 text-sm leading-[18px] font-bold text-black">
                  {request.company} · {request.unitLabel}
                </p>
              </div>
              {onReview ? (
                <ActionButton size="sm" variant="secondary" onClick={() => onReview(request)}>
                  Review
                </ActionButton>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function UnitsTable({
  variant,
  company = DEMO_CONTRACTOR_COMPANY,
}: {
  variant: "tenant" | "contractor" | "officer";
  company?: string;
}) {
  const navigate = useNavigate();
  const { units, staff, tenants, unitContractors } = useSettingsAccounts();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const people = useMemo(() => {
    const map = new Map<string, TenantAccount>();
    for (const account of [...staff, ...tenants, ...unitContractors]) {
      map.set(account.id, account);
    }
    return map;
  }, [staff, tenants, unitContractors]);
  const scoped = useMemo(() => {
    if (variant === "officer") return units;
    if (variant === "tenant") {
      const ids = new Set(
        staff.filter((account) => account.company === DEMO_TENANT_COMPANY).map((account) => account.id),
      );
      return units.filter((unit) => unit.staffIds.some((id) => ids.has(id)));
    }
    return units.filter((unit) =>
      unit.contractorIds.some((id) => people.get(id)?.company === company),
    );
  }, [units, variant, staff, people, company]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return scoped;
    return scoped.filter((unit) => unit.label.toLowerCase().includes(q));
  }, [scoped, search]);
  const rows = pageOf(filtered, page);

  return (
    <>
      <SearchField
        value={search}
        placeholder="Search by unit"
        onChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
      />
      <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-grey-200 bg-white">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <thead>
            <tr className="bg-grey-900 text-xs leading-4 font-bold text-white">
              <th className="px-4 py-3">Unit</th>
              <th className="px-4 py-3">People</th>
              <th className="px-4 py-3"> </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((unit) => {
              const names = namesOnUnit(unit, people, variant, company);
              return (
                <tr key={unit.id} className="border-t border-grey-100">
                  <td className="px-4 py-3 text-sm leading-[18px] font-bold text-black">
                    {unit.label}
                  </td>
                  <td className="px-4 py-3 text-sm leading-[18px] text-grey-700">
                    {names.length === 0 ? "No one assigned" : names.join(", ")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ActionButton
                      size="sm"
                      variant="tertiary"
                      onClick={() => navigate(`${settingsRoot()}/units/${unit.id}/edit`)}
                    >
                      Edit
                    </ActionButton>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pager page={Math.min(page, pageCount(filtered))} pages={pageCount(filtered)} onPage={setPage} />
    </>
  );
}

function namesOnUnit(
  unit: SettingsUnit,
  people: Map<string, TenantAccount>,
  variant: "tenant" | "contractor" | "officer",
  company: string,
) {
  const ids =
    variant === "contractor"
      ? unit.contractorIds.filter((id) => people.get(id)?.company === company)
      : variant === "tenant"
        ? unit.staffIds
        : [...unit.staffIds, ...unit.contractorIds];
  return ids
    .map((id) => people.get(id)?.name)
    .filter((name): name is string => Boolean(name && name !== "—"));
}

function AccountTable({
  accounts,
  page,
  pages,
  onPage,
  onEdit,
  onDelete,
  onUnits,
  hideCompany = false,
}: {
  accounts: TenantAccount[];
  page: number;
  pages: number;
  onPage: (page: number) => void;
  onEdit: (account: TenantAccount) => void;
  onDelete: (account: TenantAccount) => void;
  onUnits: (account: TenantAccount) => void;
  hideCompany?: boolean;
}) {
  if (accounts.length === 0) {
    return (
      <p className="rounded-[var(--radius-lg)] border border-grey-200 bg-white px-4 py-6 text-sm leading-[18px] text-grey-500">
        No accounts to display.
      </p>
    );
  }
  return (
    <>
      <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-grey-200 bg-white">
        <table className="w-full min-w-[880px] border-collapse text-left">
          <thead>
            <tr className="bg-grey-900 text-xs leading-4 font-bold text-white">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              {hideCompany ? null : <th className="px-4 py-3">Company</th>}
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Units</th>
              <th className="px-4 py-3"> </th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((account) => (
              <tr key={account.id} className="border-t border-grey-100 align-top">
                <td className="px-4 py-3 text-sm leading-[18px] font-bold text-black">
                  {account.name}
                </td>
                <td className="px-4 py-3 text-sm leading-[18px] text-grey-700">
                  {account.email}
                </td>
                {hideCompany ? null : (
                  <td className="px-4 py-3 text-sm leading-[18px] text-grey-700">
                    {account.company}
                  </td>
                )}
                <td className="px-4 py-3 text-sm leading-[18px] text-grey-700">
                  {account.role}
                </td>
                <td className="px-4 py-3">
                  <StatusChip status={account.status} />
                </td>
                <td className="px-4 py-3 text-sm leading-[18px] text-grey-700">
                  {account.units.slice(0, 2).map((unit) => unit.label).join(", ")}
                  {account.units.length > 2 ? (
                    <button
                      type="button"
                      className="ml-2 font-bold text-purple-600"
                      onClick={() => onUnits(account)}
                    >
                      +{account.units.length - 2}
                    </button>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-3">
                    <ActionButton size="sm" variant="tertiary" onClick={() => onEdit(account)}>
                      Edit
                    </ActionButton>
                    <ActionButton size="sm" variant="tertiary" onClick={() => onDelete(account)}>
                      Delete
                    </ActionButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pager page={page} pages={pages} onPage={onPage} />
    </>
  );
}

function StatusChip({ status }: { status: TenantAccount["status"] }) {
  const tone =
    status === "Active"
      ? "bg-success-200 text-success-800"
      : status === "Pending"
        ? "bg-warning-100 text-warning-800"
        : "bg-grey-100 text-grey-600";
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs leading-4 font-bold ${tone}`}>
      {statusLabel(status)}
    </span>
  );
}

export function SettingsV39AccountForm({ mode }: { mode: "create" | "edit" }) {
  const { kind: kindParam, id } = useParams();
  const kind: AccountKind | null =
    kindParam === "contractors" ? "contractor" : kindParam === "tenants" ? "tenant" : null;
  const navigate = useNavigate();
  const { getAccount, addAccount, updateAccount, deleteAccount, showToast } =
    useSettingsAccounts();
  const existing = mode === "edit" && id ? getAccount(id) : undefined;
  const [company, setCompany] = useState(existing?.company ?? "");
  const [email, setEmail] = useState(existing?.email ?? "");
  const [role, setRole] = useState<AccountRole>(existing?.role ?? "Staff");
  const [units, setUnits] = useState<AccountUnit[]>(existing?.units ?? []);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!kind || (mode === "edit" && !existing)) {
    return <Missing label="Account not found." />;
  }

  const companies = kind === "tenant" ? TENANT_COMPANIES : CONTRACTOR_COMPANIES;
  const title =
    mode === "edit"
      ? kind === "tenant"
        ? "Edit Tenant Account"
        : "Edit Contractor Account"
      : kind === "tenant"
        ? "Add Tenant Account"
        : "Add Contractor Account";
  const ready = company.trim().length > 0 && email.includes("@") && units.length > 0;

  const save = () => {
    if (!ready) return;
    if (mode === "edit" && existing) {
      updateAccount({ ...existing, company: company.trim(), email: email.trim(), role, units });
      showToast("Account edited");
    } else {
      addAccount({
        id: `${kind === "tenant" ? "ta" : "ca"}-${Date.now()}`,
        name: "—",
        email: email.trim(),
        company: company.trim(),
        role,
        status: "Pending",
        units,
        kind,
      });
      showToast("Invite sent");
    }
    navigate(homeHref("accounts", kind === "contractor" ? "contractors" : "tenants"));
  };

  return (
    <FormShell
      title={title}
      back={homeHref("accounts", kind === "contractor" ? "contractors" : "tenants")}
    >
      <Card title={kind === "tenant" ? "Tenant Details" : "Contractor Details"}>
        <label className="flex max-w-md flex-col gap-1.5">
          <span className="text-sm leading-[18px] font-bold text-black">Company</span>
          <input
            list="settings-companies"
            value={company}
            disabled={mode === "edit"}
            onChange={(event) => setCompany(event.target.value)}
            className={fieldClass}
          />
          <datalist id="settings-companies">
            {companies.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
        </label>
      </Card>
      <Card title="Account Details">
        <div className="grid gap-4 tablet:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm leading-[18px] font-bold text-black">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@company.com"
              className={fieldClass}
            />
          </label>
          <RoleField role={role} onChange={setRole} />
        </div>
        <UnitPicker units={units} onChange={setUnits} />
      </Card>
      <div className="flex items-center justify-between gap-3">
        {mode === "edit" && existing ? (
          <ActionButton size="sm" variant="tertiary" onClick={() => setConfirmDelete(true)}>
            Delete
          </ActionButton>
        ) : (
          <span />
        )}
        <div className="flex gap-3">
          <ActionButton
            size="sm"
            variant="secondary"
            onClick={() =>
              navigate(homeHref("accounts", kind === "contractor" ? "contractors" : "tenants"))
            }
          >
            Cancel
          </ActionButton>
          <ActionButton size="sm" disabled={!ready} onClick={save}>
            {mode === "edit" ? "Save" : "Send Invite"}
          </ActionButton>
        </div>
      </div>
      {confirmDelete && existing ? (
        <ConfirmModal
          title="Delete this account?"
          body={existing.email}
          confirm="Delete"
          onClose={() => setConfirmDelete(false)}
          onConfirm={() => {
            deleteAccount(existing.id, existing.kind);
            showToast(kind === "contractor" ? "Contractor deleted" : "Tenant deleted");
            navigate(homeHref("accounts", kind === "contractor" ? "contractors" : "tenants"));
          }}
        />
      ) : null}
    </FormShell>
  );
}

export function SettingsV39StaffForm({ mode }: { mode: "create" | "edit" }) {
  const { role } = useApp();
  const { id } = useParams();
  const navigate = useNavigate();
  const { getAccount, addAccount, updateAccount, deleteAccount, showToast } =
    useSettingsAccounts();
  const isContractor = role === "contractor";
  const company = isContractor ? DEMO_CONTRACTOR_COMPANY : DEMO_TENANT_COMPANY;
  const kind: AccountKind = isContractor ? "contractor" : "staff";
  const existing = mode === "edit" && id ? getAccount(id) : undefined;
  const [email, setEmail] = useState(existing?.email ?? "");
  const [accountRole, setAccountRole] = useState<AccountRole>(existing?.role ?? "Staff");
  const [units, setUnits] = useState<AccountUnit[]>(
    existing?.units ?? [{ label: "T3-AS-114" }],
  );
  const [confirmDelete, setConfirmDelete] = useState(false);
  const blocked =
    mode === "edit" &&
    (!existing || existing.company !== company || (isContractor ? existing.kind !== "contractor" : existing.kind !== "staff"));

  if (blocked) return <Missing label="Staff account not found." />;

  const ready = (mode === "edit" || email.includes("@")) && units.length > 0;
  const back = homeHref("accounts");

  const save = () => {
    if (!ready) return;
    if (mode === "edit" && existing) {
      updateAccount({ ...existing, role: accountRole, units });
      showToast("Staff edited");
    } else {
      addAccount({
        id: `${isContractor ? "uc" : "ts"}-${Date.now()}`,
        name: "—",
        email: email.trim(),
        company,
        role: accountRole,
        status: "Pending",
        units,
        kind,
      });
      showToast("Invite sent");
    }
    navigate(back);
  };

  return (
    <FormShell title={mode === "edit" ? "Edit Staff" : "Add New Staff"} back={back}>
      <Card title="Staff Details">
        <p className="text-sm leading-[18px] text-grey-600">{company}</p>
        <div className="grid gap-4 tablet:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm leading-[18px] font-bold text-black">Email</span>
            <input
              type="email"
              value={email}
              disabled={mode === "edit"}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@company.com"
              className={fieldClass}
            />
          </label>
          <RoleField role={accountRole} onChange={setAccountRole} />
        </div>
        <UnitPicker units={units} onChange={setUnits} />
      </Card>
      <div className="flex items-center justify-between gap-3">
        {mode === "edit" && existing ? (
          <ActionButton size="sm" variant="tertiary" onClick={() => setConfirmDelete(true)}>
            Delete
          </ActionButton>
        ) : (
          <span />
        )}
        <div className="flex gap-3">
          <ActionButton size="sm" variant="secondary" onClick={() => navigate(back)}>
            Cancel
          </ActionButton>
          <ActionButton size="sm" disabled={!ready} onClick={save}>
            {mode === "edit" ? "Save" : "Send Invite"}
          </ActionButton>
        </div>
      </div>
      {confirmDelete && existing ? (
        <ConfirmModal
          title="Delete this staff account?"
          body={existing.email}
          confirm="Delete"
          onClose={() => setConfirmDelete(false)}
          onConfirm={() => {
            deleteAccount(existing.id, kind);
            showToast("Staff deleted");
            navigate(back);
          }}
        />
      ) : null}
    </FormShell>
  );
}

export function SettingsV39ReviewRequest() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getRequest, addAccount, moveRequestToPending, showToast } = useSettingsAccounts();
  const request = id ? getRequest(id) : undefined;
  const [email, setEmail] = useState(request?.suggestedEmail ?? "");
  const [role, setRole] = useState<AccountRole>("Admin");
  const [confirm, setConfirm] = useState(false);
  if (!request) return <Missing label="Request not found." />;
  const ready = email.includes("@");
  const back = homeHref("accounts", "requests");

  return (
    <FormShell title="New Tenant Create Account" back={back}>
      <Card title="Tenant Details">
        <dl className="grid gap-4 tablet:grid-cols-3">
          <Readout label="Shop Name" value={request.company} />
          <Readout label="Lease Type" value={request.leaseType} />
          <Readout label="Unit Number" value={request.unitLabel} />
        </dl>
      </Card>
      <Card title="Account Details">
        <div className="grid gap-4 tablet:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm leading-[18px] font-bold text-black">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@company.com"
              className={fieldClass}
            />
          </label>
          <RoleField role={role} onChange={setRole} />
        </div>
      </Card>
      <div className="flex justify-end gap-3">
        <ActionButton size="sm" variant="secondary" onClick={() => navigate(back)}>
          Cancel
        </ActionButton>
        <ActionButton size="sm" disabled={!ready} onClick={() => setConfirm(true)}>
          Create Account
        </ActionButton>
      </div>
      {confirm ? (
        <ConfirmModal
          title="Create this account?"
          body={`${request.company} · ${request.unitLabel} · ${email.trim()}`}
          confirm="Create Account"
          onClose={() => setConfirm(false)}
          onConfirm={() => {
            addAccount({
              id: `ta-req-${Date.now()}`,
              name: "—",
              email: email.trim(),
              company: request.company,
              role,
              status: "Pending",
              units: [{ label: request.unitLabel }],
              kind: "tenant",
              leaseType: request.leaseType,
            });
            moveRequestToPending(request.id);
            showToast("Account created — invite sent");
            navigate(homeHref("accounts", "tenants"));
          }}
        />
      ) : null}
    </FormShell>
  );
}

export function SettingsV39EditUnit() {
  const { id } = useParams();
  const { role } = useApp();
  const navigate = useNavigate();
  const {
    getUnit,
    updateUnit,
    staff,
    tenants,
    unitContractors,
    addAccount,
    showToast,
  } = useSettingsAccounts();
  const source = id ? getUnit(id) : undefined;
  const [draft, setDraft] = useState<SettingsUnit | null>(
    source ? { ...source, staffIds: [...source.staffIds], contractorIds: [...source.contractorIds] } : null,
  );
  const [adding, setAdding] = useState<"staff" | "contractor" | null>(null);
  const [askContractor, setAskContractor] = useState(false);
  const company = role === "contractor" ? DEMO_CONTRACTOR_COMPANY : DEMO_TENANT_COMPANY;
  const back = homeHref("units");

  if (!source || !draft) return <Missing label="Unit not found." />;

  const directory = new Map<string, TenantAccount>();
  for (const account of [...staff, ...tenants, ...unitContractors]) directory.set(account.id, account);
  const staffPeople = draft.staffIds
    .map((staffId) => directory.get(staffId))
    .filter((account): account is TenantAccount => Boolean(account));
  const contractorPeople = draft.contractorIds
    .map((contractorId) => directory.get(contractorId))
    .filter((account): account is TenantAccount => Boolean(account));
  const ownContractors = contractorPeople.filter((account) => account.company === company);

  const save = () => {
    updateUnit(draft);
    showToast("Unit saved");
    navigate(back);
  };

  return (
    <FormShell title={`Edit Unit: ${draft.label}`} back={back}>
      <Card title="Unit Details">
        <Readout label="Unit Number" value={draft.label} />
      </Card>
      {role === "contractor" ? (
        <PeopleCard
          title="Staff"
          people={ownContractors}
          onAdd={() => setAdding("contractor")}
          onRemove={(personId) =>
            setDraft({
              ...draft,
              contractorIds: draft.contractorIds.filter((contractorId) => contractorId !== personId),
            })
          }
        />
      ) : (
        <>
          <PeopleCard
            title="Staff"
            people={staffPeople}
            onAdd={() => setAdding("staff")}
            onRemove={(personId) =>
              setDraft({ ...draft, staffIds: draft.staffIds.filter((staffId) => staffId !== personId) })
            }
          />
          <PeopleCard
            title="Contractor"
            people={contractorPeople}
            onAdd={() => setAdding("contractor")}
            onRemove={(personId) =>
              setDraft({
                ...draft,
                contractorIds: draft.contractorIds.filter((contractorId) => contractorId !== personId),
              })
            }
          />
        </>
      )}
      <div className="flex justify-end gap-3">
        <ActionButton size="sm" variant="secondary" onClick={() => navigate(back)}>
          Cancel
        </ActionButton>
        <ActionButton
          size="sm"
          onClick={() => {
            if (role === "tenant" && draft.contractorIds.length === 0) {
              setAskContractor(true);
              return;
            }
            save();
          }}
        >
          Save
        </ActionButton>
      </div>
      {adding ? (
        <AddPeopleModal
          title={adding === "staff" ? "Add Staff" : "Add Contractor"}
          options={(adding === "staff"
            ? role === "officer"
              ? [...staff, ...tenants]
              : staff
            : unitContractors
          ).filter((account) =>
            adding === "contractor" && role === "contractor" ? account.company === company : true,
          )}
          taken={adding === "staff" ? draft.staffIds : draft.contractorIds}
          onClose={() => setAdding(null)}
          onConfirm={(selected, email) => {
            const ids = [...selected];
            if (email.includes("@")) {
              const created = `${adding === "staff" ? "ts" : "uc"}-${Date.now()}`;
              addAccount({
                id: created,
                name: "—",
                email,
                company: adding === "staff" ? DEMO_TENANT_COMPANY : company,
                role: "Staff",
                status: "Pending",
                units: [{ label: draft.label }],
                kind: adding === "staff" ? "staff" : "contractor",
              });
              ids.push(created);
            }
            setDraft(
              adding === "staff"
                ? { ...draft, staffIds: unique([...draft.staffIds, ...ids]) }
                : { ...draft, contractorIds: unique([...draft.contractorIds, ...ids]) },
            );
            setAdding(null);
          }}
        />
      ) : null}
      {askContractor ? (
        <ConfirmModal
          title="No contractor on this unit"
          body="Assign a contractor before you leave, or save without one."
          confirm="Assign Contractor"
          cancel="Save Anyway"
          onClose={() => setAskContractor(false)}
          onConfirm={() => {
            updateUnit(draft);
            setAskContractor(false);
            setAdding("contractor");
          }}
          onCancel={() => {
            setAskContractor(false);
            save();
          }}
        />
      ) : null}
    </FormShell>
  );
}

function PeopleCard({
  title,
  people,
  onAdd,
  onRemove,
}: {
  title: string;
  people: TenantAccount[];
  onAdd: () => void;
  onRemove: (id: string) => void;
}) {
  return (
    <Card
      title={title}
      action={
        <ActionButton size="sm" variant="secondary" iconStart={<Plus className="size-4" aria-hidden />} onClick={onAdd}>
          Add
        </ActionButton>
      }
    >
      {people.length === 0 ? (
        <p className="text-sm leading-[18px] text-grey-500">Nothing added yet</p>
      ) : (
        <ul className="flex flex-col">
          {people.map((person) => (
            <li key={person.id} className="flex items-center justify-between gap-3 border-t border-grey-100 py-2 first:border-t-0">
              <span className="min-w-0">
                <span className="block text-sm leading-[18px] font-bold text-black">{person.name}</span>
                <span className="block text-xs leading-4 text-grey-600">{person.email}</span>
              </span>
              <ActionButton size="sm" variant="tertiary" onClick={() => onRemove(person.id)}>
                Remove
              </ActionButton>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function AddPeopleModal({
  title,
  options,
  taken,
  onClose,
  onConfirm,
}: {
  title: string;
  options: TenantAccount[];
  taken: string[];
  onClose: () => void;
  onConfirm: (ids: string[], email: string) => void;
}) {
  const available = options.filter((account) => !taken.includes(account.id));
  const [picked, setPicked] = useState<string[]>([]);
  const [email, setEmail] = useState("");
  return (
    <Modal title={title} onClose={onClose}>
      <ul className="flex max-h-56 flex-col overflow-y-auto">
        {available.length === 0 ? (
          <li className="text-sm leading-[18px] text-grey-500">No one else to add.</li>
        ) : (
          available.map((account) => (
            <li key={account.id}>
              <label className="flex items-center gap-2 py-1 text-sm leading-[18px] text-grey-900">
                <input
                  type="checkbox"
                  checked={picked.includes(account.id)}
                  onChange={() =>
                    setPicked((current) =>
                      current.includes(account.id)
                        ? current.filter((id) => id !== account.id)
                        : [...current, account.id],
                    )
                  }
                />
                {account.name} · {account.email}
              </label>
            </li>
          ))
        )}
      </ul>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm leading-[18px] font-bold text-black">Or invite by email</span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="name@company.com"
          className={fieldClass}
        />
      </label>
      <div className="flex justify-end gap-3">
        <ActionButton size="sm" variant="secondary" onClick={onClose}>
          Cancel
        </ActionButton>
        <ActionButton
          size="sm"
          disabled={picked.length === 0 && !email.includes("@")}
          onClick={() => onConfirm(picked, email.trim())}
        >
          Add
        </ActionButton>
      </div>
    </Modal>
  );
}

function UnitPicker({
  units,
  onChange,
}: {
  units: AccountUnit[];
  onChange: (units: AccountUnit[]) => void;
}) {
  const selected = new Set(units.map((unit) => unit.label));
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm leading-[18px] font-bold text-black">Units</legend>
      <div className="grid gap-2 tablet:grid-cols-2">
        {AVAILABLE_UNITS.map((unit) => (
          <label key={unit.label} className="flex items-center gap-2 text-sm leading-[18px] text-grey-900">
            <input
              type="checkbox"
              checked={selected.has(unit.label)}
              onChange={() => {
                const next = selected.has(unit.label)
                  ? units.filter((row) => row.label !== unit.label)
                  : [...units, unit];
                onChange(next);
              }}
            />
            {unit.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function RoleField({
  role,
  onChange,
}: {
  role: AccountRole;
  onChange: (role: AccountRole) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm leading-[18px] font-bold text-black">Role</span>
      <select
        value={role}
        onChange={(event) => onChange(event.target.value as AccountRole)}
        className={fieldClass}
      >
        <option value="Admin">Admin</option>
        <option value="Staff">Staff</option>
      </select>
    </label>
  );
}

function Tabs<T extends string>({
  value,
  onChange,
  items,
}: {
  value: T;
  onChange: (value: T) => void;
  items: { id: T; label: string }[];
}) {
  return (
    <div className="flex gap-6 border-b border-grey-100">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          className={
            value === item.id
              ? "-mb-px border-b-2 border-purple-600 px-1 py-3 text-sm leading-[18px] font-bold text-black"
              : "-mb-px border-b-2 border-transparent px-1 py-3 text-sm leading-[18px] font-bold text-grey-400"
          }
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function SubTabs({
  value,
  badge,
  onChange,
}: {
  value: AccountSub;
  badge: number;
  onChange: (value: AccountSub) => void;
}) {
  const items: { id: AccountSub; label: string }[] = [
    { id: "tenants", label: "Tenants" },
    { id: "contractors", label: "Contractors" },
    { id: "requests", label: "Requests" },
  ];
  return (
    <div role="tablist" className="inline-flex gap-1 rounded-[10px] border border-grey-200 bg-grey-50 p-1">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={value === item.id}
          onClick={() => onChange(item.id)}
          className={
            value === item.id
              ? "inline-flex h-9 items-center gap-2 rounded-[var(--radius-sm)] bg-white px-3 text-sm leading-[18px] font-bold text-grey-900 shadow-[var(--shadow-light-bg)]"
              : "inline-flex h-9 items-center gap-2 rounded-[var(--radius-sm)] px-3 text-sm leading-[18px] font-bold text-grey-600"
          }
        >
          {item.label}
          {item.id === "requests" && badge > 0 ? (
            <span className="rounded-full bg-grey-100 px-2 text-xs leading-4 text-grey-700">{badge}</span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

function SearchField({
  value,
  placeholder,
  onChange,
}: {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="relative block w-full tablet:max-w-sm">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-grey-400" aria-hidden />
      <input
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-[var(--radius-sm)] border border-grey-200 bg-white pr-3 pl-10 text-sm leading-[18px] text-black placeholder:text-grey-400"
      />
    </label>
  );
}

function Pager({
  page,
  pages,
  onPage,
}: {
  page: number;
  pages: number;
  onPage: (page: number) => void;
}) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-end gap-2 text-sm leading-[18px] text-grey-700">
      <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page">
        <ChevronLeft className="size-4" />
      </button>
      <span>
        {page} of {pages}
      </span>
      <button type="button" disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Next page">
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}

function FormShell({
  title,
  back,
  children,
}: {
  title: string;
  back: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4">
      <Link to={back} className="w-fit text-sm leading-[18px] font-bold text-purple-600">
        Back
      </Link>
      <h1 className="text-lg leading-[22px] font-bold text-black">{title}</h1>
      {children}
    </div>
  );
}

function Card({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-[var(--radius-lg)] border border-grey-200 bg-white px-5 py-5 tablet:px-8">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base leading-5 font-bold text-black">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Readout({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs leading-4 font-bold text-grey-500">{label}</dt>
      <dd className="mt-1 text-sm leading-[18px] font-bold text-black">{value}</dd>
    </div>
  );
}

function Missing({ label }: { label: string }) {
  return (
    <div className="flex flex-col gap-3">
      <Link to={settingsRoot()} className="w-fit text-sm leading-[18px] font-bold text-purple-600">
        Back
      </Link>
      <p className="text-sm leading-[18px] text-grey-600">{label}</p>
    </div>
  );
}

function UnitsModal({ account, onClose }: { account: TenantAccount; onClose: () => void }) {
  return (
    <Modal title={account.name} onClose={onClose}>
      <ul className="flex flex-col gap-1">
        {account.units.map((unit) => (
          <li key={unit.label} className="text-sm leading-[18px] text-grey-900">
            {unit.label}
          </li>
        ))}
      </ul>
      <div className="flex justify-end">
        <ActionButton size="sm" onClick={onClose}>
          Close
        </ActionButton>
      </div>
    </Modal>
  );
}

function ConfirmModal({
  title,
  body,
  confirm,
  cancel = "Cancel",
  onClose,
  onConfirm,
  onCancel,
}: {
  title: string;
  body: string;
  confirm: string;
  cancel?: string;
  onClose: () => void;
  onConfirm: () => void;
  onCancel?: () => void;
}) {
  return (
    <Modal title={title} onClose={onClose}>
      <p className="text-sm leading-[18px] text-grey-700">{body}</p>
      <div className="flex justify-end gap-3">
        <ActionButton size="sm" variant="secondary" onClick={onCancel ?? onClose}>
          {cancel}
        </ActionButton>
        <ActionButton size="sm" onClick={onConfirm}>
          {confirm}
        </ActionButton>
      </div>
    </Modal>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4" role="presentation" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="flex w-full max-w-md flex-col gap-4 rounded-[var(--radius-lg)] bg-white p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-base leading-5 font-bold text-black">{title}</h2>
        {children}
      </div>
    </div>
  );
}

const fieldClass =
  "h-11 rounded-[var(--radius-sm)] border border-grey-200 bg-white px-3 text-sm leading-[18px] text-black disabled:bg-grey-50 disabled:text-grey-500";

function pageCount(rows: unknown[]) {
  return Math.max(1, Math.ceil(rows.length / ACCOUNTS_PAGE_SIZE));
}

function pageOf<T>(rows: T[], page: number) {
  const current = Math.min(page, pageCount(rows));
  const start = (current - 1) * ACCOUNTS_PAGE_SIZE;
  return rows.slice(start, start + ACCOUNTS_PAGE_SIZE);
}

function unique(ids: string[]) {
  return [...new Set(ids)];
}
