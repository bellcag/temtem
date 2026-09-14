import { normalizeQuery, textMatches } from "@/lib/process-v15-search";

export type DashboardSearchHit = {
  id: string;
  title: string;
  hint: string;
  to: string;
};

const DASHBOARD_HITS: {
  id: string;
  title: string;
  hint: string;
  needles: string[];
  to: string;
}[] = [
  {
    id: "process-jsi",
    title: "Joint Site Inspection",
    hint: "Process · Build",
    needles: ["jsi", "joint site", "site inspection"],
    to: "/process?phase=build",
  },
  {
    id: "process-handover",
    title: "Collecting the keys",
    hint: "Process · Build",
    needles: ["handover", "keys", "unit keys"],
    to: "/process?phase=build",
  },
  {
    id: "process-reports",
    title: "Regular service reports",
    hint: "Process · Operate · lodge in TOPAZ",
    needles: ["service report", "topaz", "regular service"],
    to: "/process?phase=operate",
  },
  {
    id: "works-teaser",
    title: "Upcoming works",
    hint: "Works list — not the Process guide",
    needles: ["upcoming works", "planned works", "works quiz"],
    to: "/works",
  },
];

export function dashboardSearchHits(query: string): DashboardSearchHit[] {
  const q = normalizeQuery(query);
  if (!q) return [];
  return DASHBOARD_HITS.filter((hit) =>
    hit.needles.some(
      (needle) =>
        textMatches(needle, query) || normalizeQuery(needle).includes(q),
    ),
  ).map(({ id, title, hint, to }) => ({ id, title, hint, to }));
}
