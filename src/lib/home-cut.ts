export type HomeCut = "v29" | "v30";

const KEY = "tempo:home-cut";

export function markHomeCut(cut: HomeCut) {
  try {
    window.localStorage.setItem(KEY, cut);
    window.dispatchEvent(new Event("tempo:home-cut"));
  } catch {
    /* ignore */
  }
}

export function readHomeCut(): HomeCut {
  try {
    return window.localStorage.getItem(KEY) === "v30" ? "v30" : "v29";
  } catch {
    return "v29";
  }
}

export function homeCutHref(cut?: HomeCut) {
  return (cut ?? readHomeCut()) === "v30" ? "/home-v30" : "/home-v29";
}
