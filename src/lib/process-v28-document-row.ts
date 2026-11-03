import { SCREENER_SPECS, type RequiredDoc } from "@/lib/tenancy-data";
import type { V26ChecklistDoc } from "@/lib/process-v26-works";

export type V28DocumentRowMeta = {
  description: string;
  requirements: string[];
  formats: string;
};

const DEFAULT_FORMATS = "PDF, DOCX, XLSX, PNG, JPEG";

const FORMAT_HINTS: { test: RegExp; formats: string }[] = [
  { test: /bim|\.ifc\b/, formats: "IFC, RVT" },
  { test: /drawing|floor plan|diagram|sld|\.dwg|\.rvt|\.pdf/, formats: "PDF, DWG" },
  { test: /xlsx|spreadsheet|timeline/, formats: "PDF, XLSX" },
  { test: /letter|form|statement|assessment/, formats: "PDF, DOCX" },
];

function formatsFromName(name: string) {
  const listed = name.match(/\(([^)]+)\)/);
  if (!listed) return undefined;
  const types = [...listed[1].matchAll(/\.([a-z0-9]+)/gi)].map((match) =>
    match[1].toUpperCase(),
  );
  return types.length > 0 ? types.join(", ") : undefined;
}

function keyOf(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

const SPEC_BY_NAME = new Map<string, RequiredDoc>();
for (const spec of Object.values(SCREENER_SPECS)) {
  for (const doc of [...spec.mandatory, ...spec.conditional]) {
    const key = keyOf(doc.name);
    if (!SPEC_BY_NAME.has(key)) SPEC_BY_NAME.set(key, doc);
  }
}

function findSpec(name: string) {
  const key = keyOf(name);
  const exact = SPEC_BY_NAME.get(key);
  if (exact) return exact;
  for (const [other, doc] of SPEC_BY_NAME) {
    if (key.includes(other) || other.includes(key)) return doc;
  }
  return undefined;
}

function unique(lines: Array<string | undefined | null>) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of lines) {
    const text = line?.trim();
    if (!text) continue;
    const fold = text.toLowerCase();
    if (seen.has(fold)) continue;
    seen.add(fold);
    out.push(text);
  }
  return out;
}

/**
 * What screening checks on each document (v37), first match wins. Most lines
 * follow Renovation Requirements v2.0 (1.16, 1.17, 3.1, 3.2.5, 3.5.4, 3.7,
 * 5.4.2, 5.9.10, 5.10, 5.15, 6.1.9). Not in the RR, confirm with IFM: Letter of
 * Indemnity, assigned ports, Telco authorisation, work at height (fall
 * prevention, permit, appointments), and the fallback lines.
 */
const V37_SCREEN_RULES: { test: RegExp; lines: string[] }[] = [
  {
    test: /method statement template/,
    lines: [
      "Use the latest CAG template",
      "Fill in every section for your works",
      "Submit it as your Method of Statement",
    ],
  },
  {
    test: /letter of indemnity/,
    lines: [
      "Signed by the tenant’s authorised signatory",
      "Bears the company stamp",
      "Dated, and names the unit and the works",
    ],
  },
  {
    test: /method (of )?statement/,
    lines: [
      "Sets out the sequence of works and the safety controls for each step",
      "Names the equipment used and the supervisor on site",
      "Follows the safe work procedures in the risk assessment",
    ],
  },
  {
    test: /risk assessment/,
    lines: [
      "Covers every work activity that poses a safety or health risk",
      "Includes both routine and non-routine tasks",
      "Approved by at least the contractor’s Operations Manager",
    ],
  },
  {
    test: /joint site inspection/,
    lines: [
      "Records the zone checked on site with CAG’s M&E contractor",
      "Completed after a physical check, not from drawings",
      "Signed by both parties",
    ],
  },
  {
    test: /sprinkler drawing|floor plan/,
    lines: [
      "Shows the sprinkler points in the affected zone",
      "Matches the current layout of the unit",
      "Marks the zone to isolate or drain",
    ],
  },
  {
    test: /fire patroller/,
    lines: [
      "Shows the Fire Patroller Course was completed at a qualified local institute",
      "Names the patroller on standby during hot works",
      "Legible and current",
    ],
  },
  {
    test: /hot work/,
    lines: [
      "Uses the prescribed Hot Work Approval form",
      "Names the qualified fire patroller on standby",
      "Lists the fire extinguishers within 15 m of each hot work area",
    ],
  },
  {
    test: /isolation of fire alarm|draining sprinkler/,
    lines: [
      "Applied for at least 14 working days before works start",
      "Names the zone agreed at the joint site inspection",
      "Comes with the fire sprinkler drawing or floor plan",
    ],
  },
  {
    test: /telephone layout/,
    lines: [
      "Shows the voice cabling from the CAG STC TE/CP to each service outlet",
      "Reflects the cabling as installed",
      "Ready before the telephone lines are patched",
    ],
  },
  {
    test: /as.built/,
    lines: [
      "Reflects the works as completed",
      "Marks any change to walls, floor areas and boundaries",
      "In CAD and PDF, plus Revit where it applies",
    ],
  },
  {
    test: /statutory approval/,
    lines: [
      "Covers every authority approval the works need",
      "Names the unit and the works",
      "If an approval is still pending, add a Qualified Person’s letter of undertaking",
    ],
  },
  {
    test: /letter of undertaking/,
    lines: [
      "Signed by a Qualified Person: an architect for building works, or a professional engineer for M&E or civil and structural works",
      "Covers works that start before statutory approval",
      "Names the unit and the works",
    ],
  },
  {
    test: /\bmep\b|m&e/,
    lines: [
      "Shows every M&E change inside and outside the unit",
      "Electrical drawings have a title block and the company stamp",
      "Endorsed by a Licensed Electrical Worker of the right grade",
    ],
  },
  {
    test: /bim guidelines/,
    lines: [
      "Use the latest version from CAG",
      "Read it before you build the BIM model",
    ],
  },
  {
    test: /\bbim\b/,
    lines: [
      "Built in the latest Autodesk Revit",
      "Follows the CAG Fundamental BIM Standard and BCA BIM guidelines",
      "Covers the architectural, M&E and structural changes",
    ],
  },
  {
    test: /work request form/,
    lines: [
      "Submitted at least 5 working days before work starts",
      "Comes with the approved Works Permit and drawings as one set",
      "Lists the lines to connect or disconnect",
    ],
  },
  {
    test: /approved works permit/,
    lines: [
      "The approved permit, not a draft",
      "Matches the unit and the works",
      "Displayed at the worksite while works are in progress",
    ],
  },
  {
    test: /shop drawing/,
    lines: [
      "Two copies in A3",
      "Shows the voice cabling from the CAG STC TE/CP to the final service outlets",
      "Includes the installation method statement",
    ],
  },
  {
    test: /assigned ports/,
    lines: [
      "The email confirming the assigned ports",
      "Lists each port number for the unit",
    ],
  },
  {
    test: /permit to work in mcer|mcer, crr|crr or lr/,
    lines: [
      "Approved by CAG for the room you will work in",
      "Covers the dates of the works",
    ],
  },
  {
    test: /topology/,
    lines: [
      "Shows the single-line diagram, network diagram or cable routing",
      "Labels each connection point",
    ],
  },
  {
    test: /letter of authori[sz]ation/,
    lines: [
      "Issued by the telco service provider",
      "Authorises your contractor to work on the lines",
      "Signed and dated",
    ],
  },
  {
    test: /cable routing|containment/,
    lines: [
      "Shows the full cable route",
      "Labels the cable containment along the route",
      "Keeps clear of CAG services and maintenance access",
    ],
  },
  {
    test: /additional drawings/,
    lines: [
      "Only what CAG has asked for",
      "Labelled with the unit and the permit it supports",
    ],
  },
  {
    test: /fall prevention/,
    lines: [
      "Covers every task at height",
      "Names the controls and equipment used",
      "Approved by the contractor’s Authorised Manager",
    ],
  },
  {
    test: /work at height/,
    lines: [
      "One form for each work-at-height task",
      "Signed by the Safety Assessor and the Authorised Manager",
      "Valid for the dates of the works",
    ],
  },
  {
    test: /authori[sz]ed manager|safety assessor/,
    lines: [
      "Names the Authorised Manager and the Safety Assessor",
      "Signed by the contractor’s management",
      "Shows the assessor’s training record",
    ],
  },
  {
    test: /schedule|timeline/,
    lines: [
      "Shows the start and end dates of each stage",
      "Matches the dates in your permit applications",
    ],
  },
  {
    test: /architectural drawing/,
    lines: [
      "Shows the layout, partitions and finishes",
      "Marks the area and boundaries clearly",
      "Endorsed by the Qualified Person where statutory approval is needed",
    ],
  },
  {
    test: /collapse.zone/,
    lines: [
      "Covers every crane, scaffold or heavy item within 6 m of the Skytrain guideway",
      "Shows where each item could fall",
      "Submitted with the Risk Assessment and Method of Statement",
    ],
  },
  {
    test: /renovation requirements/,
    lines: [
      "Use Version 2.0 (Jun 2026)",
      "Read the sections that apply to your works",
    ],
  },
  {
    test: /fire safety manual/,
    lines: [
      "Use the latest version from CAG",
      "Follow the fire safety sections for your works",
    ],
  },
];

const V37_SCREEN_FALLBACK = [
  "Complete and legible",
  "Names the unit and the works",
];

function documentFormats(name: string, spec?: RequiredDoc) {
  return (
    spec?.formats ??
    formatsFromName(name) ??
    FORMAT_HINTS.find((hint) => hint.test.test(name.toLowerCase()))?.formats ??
    DEFAULT_FORMATS
  );
}

/** Screening requirements and formats for one document, by name (v37 only). */
export function v37DocumentScreen(name: string): {
  requirements: string[];
  formats: string;
} {
  const spec = findSpec(name);
  const rules = V37_SCREEN_RULES.find((rule) => rule.test.test(name.toLowerCase()));
  const requirements = unique([
    ...(rules?.lines ?? [spec?.must]),
    spec?.endorsement,
    (spec as { condition?: string } | undefined)?.condition,
  ]);
  return {
    requirements: requirements.length > 0 ? requirements : V37_SCREEN_FALLBACK,
    formats: documentFormats(name, spec),
  };
}

export function v28DocumentRowMeta(row: V26ChecklistDoc): V28DocumentRowMeta {
  const spec = findSpec(row.doc.name);
  const description = spec?.must ?? `${row.need} for ${row.permitName}.`;
  const formats = documentFormats(row.doc.name, spec);
  return {
    description,
    requirements: unique([
      spec?.condition,
      spec?.endorsement,
      row.who,
      row.need !== "Required" ? row.need : null,
    ]),
    formats,
  };
}
