import { normalizeQuery, textMatches } from "@/lib/process-v15-search";

export type DashboardSearchHit = {
  id: string;
  title: string;
  hint: string;
  chip: string;
  to: string;
};

const DASHBOARD_HITS: {
  id: string;
  title: string;
  hint: string;
  chip: string;
  needles: string[];
  to: string;
}[] = [
  {
    id: "process-permits",
    title: "Permits to start work",
    hint: "Process · Setup",
    chip: "Permits to start",
    needles: [
      "permit",
      "permits",
      "renovation",
      "start work",
      "start renovation",
    ],
    to: "/process?phase=setup",
  },
  {
    id: "process-jsi",
    title: "Joint Site Inspection",
    hint: "Process · Build",
    chip: "Joint Site Inspection",
    needles: ["jsi", "joint site", "site inspection"],
    to: "/process?phase=build",
  },
  {
    id: "process-handover",
    title: "Collecting the keys",
    hint: "Process · Build",
    chip: "Collecting the keys",
    needles: ["handover", "keys", "unit keys"],
    to: "/process?phase=build",
  },
  {
    id: "process-reports",
    title: "Regular service reports",
    hint: "Process · Operate · lodge in TOPAZ",
    chip: "Service reports",
    needles: ["service report", "topaz", "regular service"],
    to: "/process?phase=operate",
  },
  {
    id: "doc-ifm",
    title: "Renovation Requirements",
    hint: "Document · what changed",
    chip: "What changed",
    needles: ["ifm", "renovation requirements", "what changed", "requirements"],
    to: "/documents/doc-renovation",
  },
  {
    id: "works-teaser",
    title: "Upcoming works",
    hint: "Works list — not the Process guide",
    chip: "Upcoming works",
    needles: ["upcoming works", "planned works", "works quiz"],
    to: "/works",
  },
];

function toHit({
  id,
  title,
  hint,
  chip,
  to,
}: (typeof DASHBOARD_HITS)[number]): DashboardSearchHit {
  return { id, title, hint, chip, to };
}

export function dashboardShortcuts(): DashboardSearchHit[] {
  return DASHBOARD_HITS.map(toHit);
}

export function dashboardSearchHits(query: string): DashboardSearchHit[] {
  const q = normalizeQuery(query);
  if (!q) return dashboardShortcuts();
  return DASHBOARD_HITS.filter((hit) =>
    hit.needles.some(
      (needle) =>
        textMatches(needle, query) || normalizeQuery(needle).includes(q),
    ),
  ).map(toHit);
}
