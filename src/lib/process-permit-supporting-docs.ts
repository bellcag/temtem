import type { Role } from "@/lib/app-state";
import { permitIdFor } from "@/lib/process-permit-explain";

/**
 * Supporting documents a contractor attaches per OneCalendar sub-permit.
 * Blueprint: Current_Blueprint(Inventory) (2).csv + Permits handled in SetUp Phase.
 * RR: CAG Renovation Requirements Jun 2026 Version 2.0.
 * Do not invent forms. Empty lists are shown as-is in the accordion.
 */

export type DocNeed =
  | "required"
  | "optional"
  | "ifm-required"
  | "rr-required"
  | "rr-if-applies";

export type DocSupplier =
  | "contractor"
  | "qp"
  | "bmc"
  | "po"
  | "tenant"
  | "telco"
  | "fse";

export type SupportingDoc = {
  name: string;
  need: DocNeed;
  supplier: DocSupplier;
  sources: string[];
  /** Only in one source — still list, mark the gap. */
  gap?: "blueprint-only" | "rr-only";
};

export type PermitSupportingDocs = {
  docs: SupportingDoc[];
  /** Optional in OneCalendar, required in IFM review. One short line. */
  ifmNote?: string;
  /** UI permit is not a OneCalendar Tenancy Work Permit type. */
  unmatched?: string;
};

const EMPTY: PermitSupportingDocs = { docs: [] };

const NEED_LABEL: Record<DocNeed, string> = {
  required: "Required",
  optional: "Optional",
  "ifm-required": "Optional in OneCalendar, required in IFM review",
  "rr-required": "Required",
  "rr-if-applies": "If this applies",
};

const SUPPLIER_COPY: Record<DocSupplier, Record<Role, string>> = {
  contractor: {
    tenant: "Your contractor attaches this.",
    contractor: "You attach this.",
    officer: "Contractor attaches this.",
  },
  qp: {
    tenant: "Your Qualified Person supplies this.",
    contractor: "Your Qualified Person supplies this.",
    officer: "Qualified Person supplies this.",
  },
  bmc: {
    tenant: "Building Maintenance endorses this.",
    contractor: "Building Maintenance endorses this.",
    officer: "Building Maintenance endorses this.",
  },
  po: {
    tenant: "Your Project Officer supplies this.",
    contractor: "Your Project Officer supplies this.",
    officer: "You supply this.",
  },
  tenant: {
    tenant: "You supply this.",
    contractor: "The tenant supplies this.",
    officer: "Tenant supplies this.",
  },
  telco: {
    tenant: "The telco supplies this.",
    contractor: "The telco supplies this.",
    officer: "The telco supplies this.",
  },
  fse: {
    tenant: "Your Fire Safety Engineer supplies this.",
    contractor: "Your Fire Safety Engineer supplies this.",
    officer: "Fire Safety Engineer supplies this.",
  },
};

function d(
  name: string,
  need: DocNeed,
  supplier: DocSupplier,
  sources: string[],
  gap?: SupportingDoc["gap"],
): SupportingDoc {
  return { name, need, supplier, sources, gap };
}

const BY_ID: Record<string, PermitSupportingDocs> = {
  renovation: {
    ifmNote:
      "OneCalendar marks method of statement, risk assessment and timeline optional on the Tenancy Project form. IFM still checks them at review.",
    docs: [
      d(
        "Letter of Indemnity",
        "required",
        "contractor",
        ["blueprint 6.1.4", "blueprint 6.1.3 (mandatory)"],
      ),
      d(
        "Method of Statement",
        "ifm-required",
        "contractor",
        [
          "blueprint 6.1.4 (supporting document)",
          "blueprint 6.1.3 (optional)",
          "RR App D item 7",
          "RR 1.28(viii)",
        ],
      ),
      d(
        "Risk Assessment",
        "ifm-required",
        "contractor",
        [
          "blueprint 6.1.4 (supporting document)",
          "blueprint 6.1.3 (optional)",
          "RR 1.17",
          "RR App D item 7",
        ],
      ),
    ],
  },
  extra: {
    docs: [
      d(
        "Risk Assessment",
        "required",
        "contractor",
        ["blueprint 6.3.9 (mandatory)"],
      ),
      d(
        "Method of Statement",
        "required",
        "contractor",
        ["blueprint 6.3.9 (mandatory)"],
      ),
      d(
        "Letter of Indemnity",
        "required",
        "contractor",
        ["blueprint 6.3.9 (mandatory)"],
      ),
      d(
        "Additional drawings or information",
        "optional",
        "contractor",
        ["blueprint 6.3.9 (optional)"],
      ),
      d(
        "Fall Prevention Plan",
        "optional",
        "contractor",
        ["blueprint 6.3.9 (optional)"],
      ),
      d(
        "Permit-to-Work (Work at Height) form",
        "optional",
        "contractor",
        ["blueprint 6.3.9 (optional)"],
      ),
      d(
        "Appointment of Authorised Manager and Safety Assessor",
        "optional",
        "contractor",
        ["blueprint 6.3.9 (optional)"],
      ),
      d(
        "Schedule timeline",
        "optional",
        "contractor",
        ["blueprint 6.3.9 (optional)"],
      ),
      d(
        "Architectural drawings",
        "optional",
        "contractor",
        ["blueprint 6.3.9 (optional)"],
      ),
    ],
  },
  ceiling: {
    docs: [
      d(
        "Letter of Indemnity",
        "required",
        "contractor",
        ["blueprint 6.1.5"],
      ),
      d(
        "Method of Statement",
        "required",
        "contractor",
        ["blueprint 6.1.5"],
      ),
      d(
        "Risk Assessment",
        "required",
        "contractor",
        ["blueprint 6.1.5"],
      ),
    ],
  },
  fai: {
    docs: [
      d(
        "Joint Site Inspection form",
        "required",
        "bmc",
        [
          "blueprint 6.3.1 (Joint Site Inspection Checklist)",
          "blueprint 6.2.3",
          "RR 5.4.2(ii)",
        ],
      ),
      d(
        "Fire sprinkler drawing / floor plan",
        "rr-required",
        "contractor",
        ["RR 5.4.2(iii)"],
        "rr-only",
      ),
    ],
  },
  "hot-work": {
    docs: [
      d(
        "Fire Patroller Certificate",
        "required",
        "contractor",
        ["blueprint 6.3.2"],
        "blueprint-only",
      ),
    ],
  },
  authority: {
    docs: [
      d(
        "As-built drawing (.rvt, .dwg or .pdf)",
        "required",
        "contractor",
        ["blueprint 6.3.3"],
      ),
      d(
        "Copies of statutory approvals",
        "rr-required",
        "qp",
        ["RR 3.1(v)"],
        "rr-only",
      ),
      d(
        "Qualified Person letter of undertaking",
        "rr-if-applies",
        "qp",
        ["RR 3.1(v)"],
        "rr-only",
      ),
    ],
  },
  mep: {
    docs: [
      d("MEP details", "required", "contractor", ["blueprint 6.3.4"]),
    ],
  },
  bim: {
    unmatched:
      "Not a Tenancy Work Permit type in OneCalendar. BIM is an optional supporting document on the Tenancy Project form. RR 3.7 still requires the model for some scopes.",
    docs: [
      d(
        "BIM model (proposed works)",
        "ifm-required",
        "contractor",
        [
          "blueprint 6.1.3 (optional supporting document)",
          "RR 3.7",
        ],
      ),
    ],
  },
  "t3-phone": {
    docs: [
      d(
        "Work request form to connect or disconnect T3 structured cabling",
        "required",
        "contractor",
        ["blueprint 6.3.5", "RR 5.10(xi)"],
      ),
      d(
        "As-built drawing — telephone layout plan",
        "required",
        "contractor",
        ["blueprint 6.3.5", "RR 5.10(xv)"],
      ),
      d(
        "Approved Works Permit",
        "rr-required",
        "contractor",
        ["RR 5.10(xi)"],
        "rr-only",
      ),
      d(
        "Shop drawings (two A3 copies)",
        "rr-required",
        "contractor",
        ["RR 5.10(x)"],
        "rr-only",
      ),
      d(
        "Method of Statement",
        "rr-required",
        "contractor",
        ["RR 5.10(x)"],
        "rr-only",
      ),
    ],
  },
  "indoor-cabling": {
    docs: [
      d(
        "OSTC/STC assigned ports (email)",
        "required",
        "contractor",
        ["blueprint 6.3.6"],
        "blueprint-only",
      ),
      d(
        "CAG-approved Permit to Work in MCER, CRR or LR",
        "required",
        "contractor",
        ["blueprint 6.3.6"],
        "blueprint-only",
      ),
      d(
        "Physical topology (single-line diagram, network diagram or cable routing)",
        "required",
        "contractor",
        ["blueprint 6.3.6"],
        "blueprint-only",
      ),
      d(
        "OSTC work request form",
        "optional",
        "contractor",
        ["blueprint 6.3.6"],
        "blueprint-only",
      ),
      d(
        "STC work request form",
        "optional",
        "contractor",
        ["blueprint 6.3.6"],
        "blueprint-only",
      ),
    ],
  },
  telco: {
    docs: [
      d(
        "Telco Letter of Authorisation",
        "required",
        "telco",
        ["blueprint 6.3.7"],
        "blueprint-only",
      ),
      d(
        "Method of Statement",
        "required",
        "contractor",
        ["blueprint 6.3.7"],
        "blueprint-only",
      ),
      d(
        "Cable routing with cable-containment label",
        "required",
        "contractor",
        ["blueprint 6.3.7"],
        "blueprint-only",
      ),
      d(
        "Letter of Indemnity",
        "required",
        "contractor",
        ["blueprint 6.3.7"],
        "blueprint-only",
      ),
      d(
        "Risk Assessment",
        "required",
        "contractor",
        ["blueprint 6.3.7"],
        "blueprint-only",
      ),
    ],
  },
  catwalk: {
    docs: [
      d(
        "Worker name list",
        "required",
        "contractor",
        ["blueprint 6.3.8"],
        "blueprint-only",
      ),
      d(
        "Certificate for bizSAFE Level 3 or above",
        "required",
        "contractor",
        ["blueprint 6.3.8"],
        "blueprint-only",
      ),
    ],
  },
  skytrain: {
    unmatched:
      "Not a Tenancy Work Permit type in OneCalendar. Apply this under Renovation Requirements 5.15.",
    docs: [
      d(
        "Risk Assessment",
        "rr-required",
        "contractor",
        ["RR 5.15(v)"],
        "rr-only",
      ),
      d(
        "Method of Statement",
        "rr-required",
        "contractor",
        ["RR 5.15(v)"],
        "rr-only",
      ),
      d(
        "Collapse-zone analysis",
        "rr-if-applies",
        "contractor",
        ["RR 5.15(iii)(c) / 5.15(v)"],
        "rr-only",
      ),
    ],
  },
  airside: {
    unmatched:
      "Not a Tenancy Work Permit type in OneCalendar. RR 1.27 requires an Airside Work Permit (Airfield or Baggage). Neither source lists files to attach.",
    docs: [],
  },
  "t4-transit": {
    unmatched:
      "Not a permit submission in OneCalendar. These are T4 transit security rules (RR 2.5–2.6 and Appendix A).",
    docs: [],
  },
};

export function supportingDocsFor(name: string): PermitSupportingDocs {
  const id = permitIdFor(name);
  if (!id) return EMPTY;
  return BY_ID[id] ?? EMPTY;
}

export function needLabel(need: DocNeed): string {
  return NEED_LABEL[need];
}

export function supplierLine(supplier: DocSupplier, role: Role): string {
  return SUPPLIER_COPY[supplier][role];
}

export const EMPTY_SUPPORTING_DOCS =
  "No supporting documents listed in the blueprint or Renovation Requirements.";
