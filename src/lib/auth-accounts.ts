import type { Role } from "@/lib/app-state";
import { CONTRACTOR, OFFICER, TENANT } from "@/lib/tenancy-data";

export const DEMO_EMAILS: Record<Role, string> = {
  tenant: TENANT.email,
  contractor: CONTRACTOR.email,
  officer: OFFICER.email,
};

const EMAIL_TO_ROLE: Record<string, Role> = {
  [TENANT.email]: "tenant",
  [CONTRACTOR.email]: "contractor",
  [OFFICER.email]: "officer",
};

export function roleForEmail(email: string): Role | null {
  return EMAIL_TO_ROLE[email.trim().toLowerCase()] ?? null;
}
