/**
 * Mock tenant / contractor accounts for the Project Officer Settings page
 * (Figma 2207:21121 — Settings/AccountsTenants/Desktop).
 */

export type AccountRole = 'Admin' | 'Staff';
export type AccountStatus = 'Active' | 'Inactive' | 'Pending';
export type AccountKind = 'tenant' | 'contractor' | 'staff';
export type AccountRequestType = 'new_tenant' | 'assign_tenant_rep';
export type AccountRequestBucket = 'new' | 'pending';

export interface AccountUnit {
  /** Display label e.g. "T3 AS B1-23" */
  label: string;
}

export interface TenantAccount {
  id: string;
  name: string;
  email: string;
  company: string;
  role: AccountRole;
  status: AccountStatus;
  units: AccountUnit[];
  kind: AccountKind;
  /** Optional lease type shown on request / edit read-only details */
  leaseType?: string;
}

export interface AccountRequest {
  id: string;
  type: AccountRequestType;
  company: string;
  unitLabel: string;
  leaseType: string;
  bucket: AccountRequestBucket;
  /** Prefill email when reviewing assign-rep style requests */
  suggestedEmail?: string;
}

/** Zone abbreviation used in unit labels in the design. */
function zoneAbbrev(zone: 'Airside' | 'Landside'): string {
  return zone === 'Airside' ? 'AS' : 'LS';
}

export function formatUnitLabel(
  terminal: string,
  zone: 'Airside' | 'Landside',
  number: string,
): string {
  return `${terminal} ${zoneAbbrev(zone)} ${number}`;
}

export function statusLabel(status: AccountStatus): string {
  if (status === 'Pending') return 'Pending Signup';
  return status;
}

export function requestTypeLabel(type: AccountRequestType): string {
  switch (type) {
    case 'new_tenant':
      return 'New Tenant';
    case 'assign_tenant_rep':
      return 'Assign Tenant Rep';
  }
}

export const AVAILABLE_UNITS: AccountUnit[] = [
  { label: 'T3-AS-114' },
  { label: 'T3-AS-208' },
  { label: 'T2-AS-045' },
  { label: 'T2-AS-112' },
  { label: 'T3 AS B1-23' },
  { label: 'T2 LS 01-45' },
  { label: 'T1 AS 02-56' },
  { label: 'T3 AS B1-24' },
  { label: 'T1 AS 22-01' },
  { label: 'T3 AS B2-10' },
  { label: formatUnitLabel('T3', 'Airside', 'B2-14') },
  { label: formatUnitLabel('T2', 'Landside', 'L2-08') },
  { label: formatUnitLabel('T1', 'Airside', 'T1-22') },
  { label: formatUnitLabel('T4', 'Airside', 'T4-12') },
  { label: formatUnitLabel('Jewel', 'Landside', 'J1-08') },
  { label: formatUnitLabel('T2', 'Airside', '02-34') },
  { label: formatUnitLabel('T3', 'Airside', '02-56') },
];

export const TENANT_COMPANIES = [
  'Kopi & Co. Pte Ltd',
  'Dunder Mifflin',
  'Shilla',
  'Skyline F&B',
  'Changi Retail',
  'Jewel Retail',
  'T4 Dining',
  'T2 Services',
  'Parks & Rec',
] as const;

export const CONTRACTOR_COMPANIES = [
  'BuildRight Contractors Pte Ltd',
  'BuildPro Contractors',
  'FitOut SG',
  'Scrantonicity',
  'Dunder Mifflin',
] as const;

export const TENANT_ACCOUNTS: TenantAccount[] = [
  {
    id: 'ta-kopi',
    name: 'Sarah Tan',
    email: 'sarah.tan@kopico.sg',
    company: 'Kopi & Co. Pte Ltd',
    role: 'Admin',
    status: 'Active',
    units: [
      { label: 'T3-AS-114' },
      { label: 'T3-AS-208' },
      { label: 'T2-AS-045' },
      { label: 'T2-AS-112' },
    ],
    kind: 'tenant',
    leaseType: 'F&B',
  },
  {
    id: 'ta0',
    name: '—',
    email: 'michael@dundermifflin.com',
    company: 'Dunder Mifflin',
    role: 'Admin',
    status: 'Pending',
    units: [{ label: 'T3 AS B1-23' }],
    kind: 'tenant',
    leaseType: 'Retail',
  },
  {
    id: 'ta1',
    name: 'Teresa Wong',
    email: 'teresa@shilla.com',
    company: 'Shilla',
    role: 'Staff',
    status: 'Active',
    units: [
      { label: 'T3 AS B1-23' },
      { label: 'T2 LS 01-45' },
      { label: 'T3 AS B1-24' },
      { label: 'T1 AS 22-01' },
    ],
    kind: 'tenant',
  },
  {
    id: 'ta2',
    name: 'Teresa Wong',
    email: 'teresa@shilla.com',
    company: 'Shilla',
    role: 'Admin',
    status: 'Active',
    units: [
      { label: 'T3 AS B1-23' },
      { label: 'T2 LS 01-45' },
      { label: 'T3 AS B2-10' },
    ],
    kind: 'tenant',
  },
  {
    id: 'ta3',
    name: 'Sarah Tan',
    email: 'sarah.tan@skylinefb.com',
    company: 'Skyline F&B',
    role: 'Admin',
    status: 'Active',
    units: [
      { label: formatUnitLabel('T3', 'Airside', 'B2-14') },
      { label: formatUnitLabel('T2', 'Landside', 'L2-08') },
    ],
    kind: 'tenant',
  },
  {
    id: 'ta4',
    name: 'James Koh',
    email: 'james.koh@skylinefb.com',
    company: 'Skyline F&B',
    role: 'Staff',
    status: 'Active',
    units: [{ label: formatUnitLabel('T3', 'Airside', 'B2-14') }],
    kind: 'tenant',
  },
  {
    id: 'ta5',
    name: 'Mei Ling',
    email: 'meiling@changiretail.com',
    company: 'Changi Retail',
    role: 'Admin',
    status: 'Active',
    units: [
      { label: formatUnitLabel('T1', 'Airside', 'T1-22') },
      { label: formatUnitLabel('T1', 'Landside', 'T1-05') },
      { label: formatUnitLabel('T4', 'Airside', 'T4-12') },
    ],
    kind: 'tenant',
  },
  {
    id: 'ta6',
    name: 'Aisha Rahman',
    email: 'aisha@changiretail.com',
    company: 'Changi Retail',
    role: 'Staff',
    status: 'Pending',
    units: [{ label: formatUnitLabel('T1', 'Airside', 'T1-22') }],
    kind: 'tenant',
  },
  {
    id: 'ta7',
    name: 'Daniel Ng',
    email: 'daniel@jewelretail.sg',
    company: 'Jewel Retail',
    role: 'Admin',
    status: 'Active',
    units: [
      { label: formatUnitLabel('Jewel', 'Landside', 'J1-08') },
      { label: formatUnitLabel('Jewel', 'Landside', 'J2-14') },
    ],
    kind: 'tenant',
  },
  {
    id: 'ta8',
    name: 'Priya Das',
    email: 'priya@jewelretail.sg',
    company: 'Jewel Retail',
    role: 'Staff',
    status: 'Inactive',
    units: [{ label: formatUnitLabel('Jewel', 'Landside', 'J1-08') }],
    kind: 'tenant',
  },
  {
    id: 'ta9',
    name: 'Marcus Teo',
    email: 'marcus@t4dining.sg',
    company: 'T4 Dining',
    role: 'Admin',
    status: 'Active',
    units: [
      { label: formatUnitLabel('T4', 'Airside', 'T4-03') },
      { label: formatUnitLabel('T4', 'Landside', 'T4-18') },
    ],
    kind: 'tenant',
  },
  {
    id: 'ta10',
    name: 'Hannah Lim',
    email: 'hannah@t4dining.sg',
    company: 'T4 Dining',
    role: 'Staff',
    status: 'Active',
    units: [{ label: formatUnitLabel('T4', 'Airside', 'T4-03') }],
    kind: 'tenant',
  },
  {
    id: 'ta11',
    name: 'Kevin Ong',
    email: 'kevin@t2services.sg',
    company: 'T2 Services',
    role: 'Admin',
    status: 'Active',
    units: [
      { label: formatUnitLabel('T2', 'Landside', 'T2-30') },
      { label: formatUnitLabel('T2', 'Airside', 'T2-11') },
      { label: formatUnitLabel('T2', 'Landside', 'T2-31') },
    ],
    kind: 'tenant',
  },
  {
    id: 'ta12',
    name: 'Grace Yap',
    email: 'grace@t2services.sg',
    company: 'T2 Services',
    role: 'Staff',
    status: 'Pending',
    units: [{ label: formatUnitLabel('T2', 'Landside', 'T2-30') }],
    kind: 'tenant',
  },
  {
    id: 'ta13',
    name: 'Benito Cruz',
    email: 'benito@shilla.com',
    company: 'Shilla',
    role: 'Staff',
    status: 'Active',
    units: [
      { label: 'T3 AS B1-23' },
      { label: 'T2 LS 01-45' },
    ],
    kind: 'tenant',
  },
  {
    id: 'ta14',
    name: 'Olivia Chan',
    email: 'olivia@skylinefb.com',
    company: 'Skyline F&B',
    role: 'Staff',
    status: 'Inactive',
    units: [{ label: formatUnitLabel('T2', 'Landside', 'L2-08') }],
    kind: 'tenant',
  },
  {
    id: 'ta15',
    name: 'Ryan Foo',
    email: 'ryan@changiretail.com',
    company: 'Changi Retail',
    role: 'Staff',
    status: 'Active',
    units: [
      { label: formatUnitLabel('T1', 'Airside', 'T1-22') },
      { label: formatUnitLabel('T4', 'Airside', 'T4-12') },
    ],
    kind: 'tenant',
  },
  {
    id: 'ta16',
    name: 'Siti Nurhaliza',
    email: 'siti@jewelretail.sg',
    company: 'Jewel Retail',
    role: 'Admin',
    status: 'Active',
    units: [
      { label: formatUnitLabel('Jewel', 'Landside', 'J1-08') },
      { label: formatUnitLabel('Jewel', 'Landside', 'J2-14') },
      { label: formatUnitLabel('Jewel', 'Landside', 'J3-02') },
    ],
    kind: 'tenant',
  },
];

export const CONTRACTOR_ACCOUNTS: TenantAccount[] = [
  {
    id: 'ca-br',
    name: 'Raj Kumar',
    email: 'raj.kumar@buildright.sg',
    company: 'BuildRight Contractors Pte Ltd',
    role: 'Admin',
    status: 'Active',
    units: [{ label: 'T3-AS-114' }, { label: 'T3-AS-208' }],
    kind: 'contractor',
  },
  {
    id: 'ca1',
    name: 'Wei Ming',
    email: 'weiming@buildpro.sg',
    company: 'BuildPro Contractors',
    role: 'Admin',
    status: 'Active',
    units: [
      { label: formatUnitLabel('T3', 'Airside', 'B2-14') },
      { label: formatUnitLabel('T2', 'Landside', 'L2-08') },
    ],
    kind: 'contractor',
  },
  {
    id: 'ca2',
    name: 'Jason Lee',
    email: 'jason@buildpro.sg',
    company: 'BuildPro Contractors',
    role: 'Staff',
    status: 'Active',
    units: [{ label: formatUnitLabel('T3', 'Airside', 'B2-14') }],
    kind: 'contractor',
  },
  {
    id: 'ca3',
    name: 'Amelia Toh',
    email: 'amelia@fitoutsg.com',
    company: 'FitOut SG',
    role: 'Admin',
    status: 'Pending',
    units: [{ label: formatUnitLabel('T1', 'Airside', 'T1-22') }],
    kind: 'contractor',
  },
];

/**
 * Staff accounts managed by Tenant Admin (Sarah Tan / Skyline F&B).
 * Figma 2270:125663 — Settings/TenantAccounts/Desktop.
 */
export const TENANT_STAFF_ACCOUNTS: TenantAccount[] = [
  {
    id: 'ts1',
    name: 'Sarah Tan',
    email: 'sarah.tan@skylinefb.com',
    company: 'Skyline F&B',
    role: 'Admin',
    status: 'Active',
    units: [
      { label: formatUnitLabel('T3', 'Airside', 'B2-14') },
      { label: formatUnitLabel('T2', 'Landside', 'L2-08') },
    ],
    kind: 'staff',
  },
  {
    id: 'ts2',
    name: 'James Koh',
    email: 'james.koh@skylinefb.com',
    company: 'Skyline F&B',
    role: 'Staff',
    status: 'Active',
    units: [{ label: formatUnitLabel('T3', 'Airside', 'B2-14') }],
    kind: 'staff',
  },
  {
    id: 'ts3',
    name: 'Olivia Chan',
    email: 'olivia@skylinefb.com',
    company: 'Skyline F&B',
    role: 'Staff',
    status: 'Active',
    units: [
      { label: formatUnitLabel('T3', 'Airside', 'B2-14') },
      { label: formatUnitLabel('T2', 'Landside', 'L2-08') },
    ],
    kind: 'staff',
  },
  {
    id: 'ts4',
    name: 'Wei Jie Tan',
    email: 'weijie@skylinefb.com',
    company: 'Skyline F&B',
    role: 'Staff',
    status: 'Pending',
    units: [{ label: formatUnitLabel('T2', 'Landside', 'L2-08') }],
    kind: 'staff',
  },
  {
    id: 'ts5',
    name: 'Nadia Rahman',
    email: 'nadia@skylinefb.com',
    company: 'Skyline F&B',
    role: 'Staff',
    status: 'Active',
    units: [
      { label: formatUnitLabel('T3', 'Airside', 'B2-14') },
      { label: formatUnitLabel('T2', 'Landside', 'L2-08') },
      { label: 'T1 AS 02-56' },
    ],
    kind: 'staff',
  },
  {
    id: 'ts6',
    name: 'Marcus Ong',
    email: 'marcus.ong@skylinefb.com',
    company: 'Skyline F&B',
    role: 'Staff',
    status: 'Inactive',
    units: [{ label: formatUnitLabel('T3', 'Airside', 'B2-14') }],
    kind: 'staff',
  },
  {
    id: 'ts7',
    name: 'Priya Das',
    email: 'priya.das@skylinefb.com',
    company: 'Skyline F&B',
    role: 'Staff',
    status: 'Active',
    units: [
      { label: formatUnitLabel('T3', 'Airside', 'B2-14') },
      { label: formatUnitLabel('T2', 'Landside', 'L2-08') },
    ],
    kind: 'staff',
  },
  {
    id: 'ts8',
    name: 'Daniel Lim',
    email: 'daniel.lim@skylinefb.com',
    company: 'Skyline F&B',
    role: 'Staff',
    status: 'Active',
    units: [{ label: formatUnitLabel('T3', 'Airside', 'B2-14') }],
    kind: 'staff',
  },
  {
    id: 'ts9',
    name: 'Hannah Teo',
    email: 'hannah.teo@skylinefb.com',
    company: 'Skyline F&B',
    role: 'Staff',
    status: 'Pending',
    units: [{ label: formatUnitLabel('T2', 'Landside', 'L2-08') }],
    kind: 'staff',
  },
  {
    id: 'ts-kopi-1',
    name: 'Sarah Tan',
    email: 'sarah.tan@kopico.sg',
    company: 'Kopi & Co. Pte Ltd',
    role: 'Admin',
    status: 'Active',
    units: [
      { label: 'T3-AS-114' },
      { label: 'T3-AS-208' },
      { label: 'T2-AS-045' },
      { label: 'T2-AS-112' },
    ],
    kind: 'staff',
  },
  {
    id: 'ts-kopi-2',
    name: 'James Koh',
    email: 'james.koh@kopico.sg',
    company: 'Kopi & Co. Pte Ltd',
    role: 'Staff',
    status: 'Active',
    units: [{ label: 'T3-AS-114' }],
    kind: 'staff',
  },
  {
    id: 'ts-kopi-3',
    name: 'Olivia Chan',
    email: 'olivia.chan@kopico.sg',
    company: 'Kopi & Co. Pte Ltd',
    role: 'Staff',
    status: 'Pending',
    units: [{ label: 'T2-AS-045' }],
    kind: 'staff',
  },
];

export const ACCOUNT_REQUESTS: AccountRequest[] = [
  {
    id: 'req1',
    type: 'new_tenant',
    company: 'Dunder Mifflin',
    unitLabel: 'T3 AS B1-23',
    leaseType: 'Retail',
    bucket: 'new',
  },
  {
    id: 'req2',
    type: 'assign_tenant_rep',
    company: 'Shilla',
    unitLabel: 'T2 AS 02-34',
    leaseType: 'Retail',
    bucket: 'new',
    suggestedEmail: 'teresa@shilla.com',
  },
  {
    id: 'req3',
    type: 'new_tenant',
    company: 'Parks & Rec',
    unitLabel: 'T3 AS 02-56',
    leaseType: 'F&B',
    bucket: 'new',
  },
];

export const ACCOUNTS_PAGE_SIZE = 8;

/**
 * Contractor people that Tenant Admin can assign to units.
 * Figma Settings/Units + EditUnit contractor tables.
 * Includes BuildPro staff so Contractor role can manage own people on units.
 */
export const UNIT_CONTRACTOR_POOL: TenantAccount[] = [
  {
    id: 'uc1',
    name: 'Jim Halpert',
    email: 'jim@scrantonicity.com',
    company: 'Scrantonicity',
    role: 'Admin',
    status: 'Active',
    units: [{ label: formatUnitLabel('T3', 'Airside', 'B2-14') }],
    kind: 'contractor',
  },
  {
    id: 'uc2',
    name: 'Pam Beesly',
    email: 'pam@scrantonicity.com',
    company: 'Scrantonicity',
    role: 'Staff',
    status: 'Active',
    units: [{ label: formatUnitLabel('T2', 'Landside', 'L2-08') }],
    kind: 'contractor',
  },
  {
    id: 'uc3',
    name: 'Dwight Schrute',
    email: 'dwight@buildpro.sg',
    company: 'BuildPro Contractors',
    role: 'Staff',
    status: 'Active',
    units: [{ label: formatUnitLabel('T3', 'Airside', 'B2-14') }],
    kind: 'contractor',
  },
  {
    id: 'uc4',
    name: 'Wei Ming',
    email: 'weiming@buildpro.sg',
    company: 'BuildPro Contractors',
    role: 'Admin',
    status: 'Active',
    units: [
      { label: formatUnitLabel('T3', 'Airside', 'B2-14') },
      { label: formatUnitLabel('T2', 'Landside', 'L2-08') },
    ],
    kind: 'contractor',
  },
  {
    id: 'uc5',
    name: 'Jason Lee',
    email: 'jason@buildpro.sg',
    company: 'BuildPro Contractors',
    role: 'Staff',
    status: 'Active',
    units: [{ label: formatUnitLabel('T3', 'Airside', 'B2-14') }],
    kind: 'contractor',
  },
  {
    id: 'uc6',
    name: 'Amelia Toh',
    email: 'amelia@fitoutsg.com',
    company: 'FitOut SG',
    role: 'Admin',
    status: 'Pending',
    units: [{ label: formatUnitLabel('T1', 'Airside', 'T1-22') }],
    kind: 'contractor',
  },
  {
    id: 'uc-br-1',
    name: 'Raj Kumar',
    email: 'raj.kumar@buildright.sg',
    company: 'BuildRight Contractors Pte Ltd',
    role: 'Admin',
    status: 'Active',
    units: [{ label: 'T3-AS-114' }, { label: 'T3-AS-208' }],
    kind: 'contractor',
  },
  {
    id: 'uc-br-2',
    name: 'Alicia Tan',
    email: 'alicia.tan@buildright.sg',
    company: 'BuildRight Contractors Pte Ltd',
    role: 'Staff',
    status: 'Active',
    units: [{ label: 'T3-AS-114' }],
    kind: 'contractor',
  },
];

export interface SettingsUnit {
  id: string;
  label: string;
  /** Tenant staff account ids assigned to this unit */
  staffIds: string[];
  /** Contractor account ids from UNIT_CONTRACTOR_POOL / unitContractors */
  contractorIds: string[];
}

/** Demo company for the Contractor role persona (Wei Ming). */
export const DEMO_CONTRACTOR_COMPANY = 'BuildRight Contractors Pte Ltd';
export const DEMO_TENANT_COMPANY = 'Kopi & Co. Pte Ltd';

/** Skyline F&B unit ids — Tenant Admin Settings/Units scope. */
export const TENANT_UNIT_IDS = ['su1', 'su2', 'su3'] as const;

/**
 * Full unit catalog for Settings (Project Officer sees all).
 * Tenant Admin is scoped to TENANT_UNIT_IDS; Contractor to units
 * where their company has staff tagged.
 */
export const SETTINGS_UNITS: SettingsUnit[] = [
  {
    id: 'su-kopi-1',
    label: 'T3-AS-114',
    staffIds: ['ts-kopi-1', 'ts-kopi-2'],
    contractorIds: ['uc-br-1', 'uc-br-2'],
  },
  {
    id: 'su-kopi-2',
    label: 'T3-AS-208',
    staffIds: ['ts-kopi-1'],
    contractorIds: ['uc-br-1'],
  },
  {
    id: 'su-kopi-3',
    label: 'T2-AS-045',
    staffIds: ['ts-kopi-1', 'ts-kopi-3'],
    contractorIds: [],
  },
  {
    id: 'su-kopi-4',
    label: 'T2-AS-112',
    staffIds: ['ts-kopi-1'],
    contractorIds: [],
  },
  {
    id: 'su1',
    label: formatUnitLabel('T3', 'Airside', 'B2-14'),
    staffIds: ['ts1', 'ts2', 'ts3', 'ts5'],
    contractorIds: ['uc1', 'uc3', 'uc4', 'uc5'],
  },
  {
    id: 'su2',
    label: formatUnitLabel('T2', 'Landside', 'L2-08'),
    staffIds: ['ts1', 'ts3', 'ts4'],
    contractorIds: ['uc2', 'uc4'],
  },
  {
    id: 'su3',
    label: 'T1 AS 02-56',
    staffIds: ['ts5'],
    contractorIds: [],
  },
  {
    id: 'su4',
    label: 'T3 AS B1-23',
    staffIds: ['ta1', 'ta2', 'ta13'],
    contractorIds: [],
  },
  {
    id: 'su5',
    label: 'T2 LS 01-45',
    staffIds: ['ta1', 'ta13'],
    contractorIds: [],
  },
  {
    id: 'su6',
    label: 'T3 AS B1-24',
    staffIds: ['ta1'],
    contractorIds: [],
  },
  {
    id: 'su7',
    label: 'T1 AS 22-01',
    staffIds: ['ta1'],
    contractorIds: [],
  },
  {
    id: 'su8',
    label: 'T3 AS B2-10',
    staffIds: ['ta2'],
    contractorIds: [],
  },
  {
    id: 'su9',
    label: formatUnitLabel('T1', 'Airside', 'T1-22'),
    staffIds: ['ta5', 'ta6', 'ta15'],
    contractorIds: ['uc6'],
  },
  {
    id: 'su10',
    label: formatUnitLabel('T4', 'Airside', 'T4-12'),
    staffIds: ['ta5', 'ta15'],
    contractorIds: [],
  },
  {
    id: 'su11',
    label: formatUnitLabel('Jewel', 'Landside', 'J1-08'),
    staffIds: ['ta7', 'ta8', 'ta16'],
    contractorIds: [],
  },
  {
    id: 'su12',
    label: formatUnitLabel('T2', 'Airside', '02-34'),
    staffIds: [],
    contractorIds: [],
  },
  {
    id: 'su13',
    label: formatUnitLabel('T3', 'Airside', '02-56'),
    staffIds: [],
    contractorIds: [],
  },
];

/** Tenant-scoped slice of SETTINGS_UNITS (Skyline F&B). */
export const TENANT_SETTINGS_UNITS = SETTINGS_UNITS.filter((u) =>
  (TENANT_UNIT_IDS as readonly string[]).includes(u.id),
);

export function splitName(fullName: string): { firstName: string; lastName: string } {
  const cleaned = fullName.replace(/^—$/, '').trim();
  if (!cleaned) return { firstName: '—', lastName: '—' };
  const parts = cleaned.split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: '—' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}
