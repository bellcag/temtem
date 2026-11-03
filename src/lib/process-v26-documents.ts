import type { Role } from "@/lib/app-state";
import type { DocItem } from "@/lib/tenancy-data";
import libraryCsv from "@/lib/process-v26-document-library.csv?raw";

export const V26_DOC_TYPES = [
  "Policy & Requirements",
  "Guides",
  "Forms & Templates",
  "Email Templates",
] as const;

export type V26DocType = (typeof V26_DOC_TYPES)[number];

export type V26PhaseName = "Setup" | "Build" | "Operate" | "Exit";

export type V26LibraryDoc = {
  id: string;
  name: string;
  type: V26DocType;
  owner: string;
  phases: V26PhaseName[];
  url?: string;
  officerOnly: boolean;
};

export type V26ShownDoc = {
  id: string;
  name: string;
  type: V26DocType;
  href: string;
  external: boolean;
};

const PHASES: V26PhaseName[] = ["Setup", "Build", "Operate", "Exit"];

const EXISTING_ID_TO_NAME: Record<string, string> = {
  "doc-renovation": "Renovation Requirements",
  "doc-method": "Method Statement Template",
  "doc-hoarding": "Hoarding Plan Template",
  "doc-jsi": "Joint Site Inspection (JSI) Form",
  "doc-fire": "Fire Safety Requirements",
  "doc-handover": "Physical Handover Form",
  "doc-poi": "Pre-Opening Inspection Form",
};

const FALLBACK_TYPE: Record<string, V26DocType> = {
  "Policy & Requirements": "Policy & Requirements",
  "Template & Form": "Forms & Templates",
  "Process Guide": "Guides",
  "Design Guideline": "Guides",
  "Reference Document": "Guides",
};

function slug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function splitCsvRow(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (ch === "," && !quoted) {
      out.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur.trim());
  return out;
}

function parsePhases(value: string): V26PhaseName[] {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter((part): part is V26PhaseName =>
      PHASES.includes(part as V26PhaseName),
    );
}

function parseLibrary(raw: string): V26LibraryDoc[] {
  const lines = raw
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim());
  return lines.slice(1).flatMap((line) => {
    const cols = splitCsvRow(line);
    const name = cols[0];
    const type = cols[1] as V26DocType;
    if (!name || !V26_DOC_TYPES.includes(type)) return [];
    const url = cols[5];
    return [
      {
        id: slug(name),
        name,
        type,
        owner: cols[2] === "iFM" ? "IFM" : cols[2],
        phases: parsePhases(cols[4] ?? ""),
        url: url || undefined,
        officerOnly: /^yes$/i.test(cols[6] ?? ""),
      },
    ];
  });
}

export const V26_LIBRARY = parseLibrary(libraryCsv);

export function v26LibraryById(id: string | undefined) {
  if (!id) return undefined;
  return V26_LIBRARY.find((row) => row.id === id);
}

export function matchV26Library(doc: Pick<DocItem, "id" | "name">) {
  const alias = EXISTING_ID_TO_NAME[doc.id];
  return V26_LIBRARY.find(
    (row) =>
      row.id === doc.id ||
      row.name === doc.name ||
      row.name === alias ||
      row.id === slug(doc.name) ||
      (alias && row.id === slug(alias)),
  );
}

export function v26DocTypeOf(doc: Pick<DocItem, "id" | "name" | "type">): V26DocType {
  return matchV26Library(doc)?.type ?? FALLBACK_TYPE[doc.type] ?? "Guides";
}

export function v26DocVisibleToRole(
  doc: Pick<DocItem, "id" | "name">,
  role: Role,
) {
  const lib = matchV26Library(doc);
  return !lib?.officerOnly || role === "officer";
}

export function v26PresentDoc(doc: DocItem, role: Role): V26ShownDoc | null {
  if (!v26DocVisibleToRole(doc, role)) return null;
  const lib = matchV26Library(doc);
  const raw = lib?.url || doc.externalUrl || `/documents/${lib?.id ?? doc.id}`;
  const fake = raw.includes("example.com");
  const href = fake ? `/documents/${lib?.id ?? doc.id}` : raw;
  return {
    id: lib?.id ?? doc.id,
    name: lib?.name ?? doc.name,
    type: lib?.type ?? v26DocTypeOf(doc),
    href,
    external: /^https?:\/\//.test(href) && !fake,
  };
}

export function v26LibraryForRole(role: Role) {
  return V26_LIBRARY.filter((row) => !row.officerOnly || role === "officer");
}
