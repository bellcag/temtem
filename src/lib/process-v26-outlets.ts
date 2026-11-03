import { UNITS, type Unit } from "@/lib/tenancy-data";

export type V26OutletStory = "one" | "one-terminal" | "airport";

export const V26_OUTLET_KEY = "tempo:v26:outlet-story";
export const V26_OUTLET_CHANGED = "tempo:v26:outlets";

export const V26_OUTLET_STORIES: {
  id: V26OutletStory;
  label: string;
}[] = [
  { id: "one", label: "1 outlet" },
  { id: "one-terminal", label: "Many outlets · 1 terminal" },
  { id: "airport", label: "Many outlets · airport" },
];

export function readV26OutletStory(): V26OutletStory {
  try {
    const raw = window.localStorage.getItem(V26_OUTLET_KEY);
    if (raw === "one" || raw === "one-terminal" || raw === "airport") {
      return raw;
    }
  } catch {
    /* ignore */
  }
  return "airport";
}

export function writeV26OutletStory(story: V26OutletStory) {
  window.localStorage.setItem(V26_OUTLET_KEY, story);
  window.dispatchEvent(new CustomEvent(V26_OUTLET_CHANGED, { detail: { story } }));
}

export function v26UnitsForStory(story: V26OutletStory): Unit[] {
  if (story === "one") {
    return UNITS.filter((row) => row.id === "u-301");
  }
  if (story === "one-terminal") {
    return UNITS.filter((row) => row.terminal === "T3");
  }
  return UNITS.filter((row) => row.zone === "Airside");
}

export function v26TenantShowsOutletPicker(story: V26OutletStory) {
  return v26UnitsForStory(story).length > 1;
}
