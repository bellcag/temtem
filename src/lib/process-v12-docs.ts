import type { DocItem, DocType } from "@/lib/tenancy-data";

export type DocVerb = "Read" | "Download" | "Use as sample";
export type DocGroupKind = "guide" | "sample";
export type FileKind = "guide" | "template" | "sample";

/** Product types already on the library: policies/guides vs templates/references. */
const SAMPLE_TYPES: ReadonlySet<DocType> = new Set([
  "Template & Form",
  "Reference Document",
]);

export function docGroupKind(doc: DocItem): DocGroupKind {
  return SAMPLE_TYPES.has(doc.type) ? "sample" : "guide";
}

export function fileKind(doc: DocItem): FileKind {
  if (doc.type === "Template & Form") return "template";
  if (doc.type === "Reference Document") return "sample";
  return "guide";
}

export function verbForDoc(doc: DocItem): DocVerb {
  if (doc.type === "Template & Form") return "Use as sample";
  if (doc.type === "Reference Document") return "Download";
  return "Read";
}

/** Keep the step’s existing file order inside each group. */
export function splitStepDocs(docs: DocItem[]) {
  return {
    guides: docs.filter((d) => docGroupKind(d) === "guide"),
    samples: docs.filter((d) => docGroupKind(d) === "sample"),
  };
}
