import { useEffect, useState } from "react";

/** Standalone GitHub Pages folder `/v28/` — does not change local, root, `/v26/`, or `/v27/`. */
export const V28_STANDALONE =
  import.meta.env.VITE_PROCESS_LIVE === "process-v28";

export const V28_PROCESS_HREF = V28_STANDALONE ? "/process" : "/process-v28";
export const V28_WORKS_HREF = V28_STANDALONE ? "/works" : "/works-v28";
export const V28_PREVIEW_KEY = "tempo:v28:preview";

export function isV28Path(pathname: string) {
  if (V28_STANDALONE) return true;
  return (
    pathname === V28_PROCESS_HREF ||
    pathname.startsWith(`${V28_PROCESS_HREF}/`) ||
    pathname === V28_WORKS_HREF ||
    pathname.startsWith(`${V28_WORKS_HREF}/`)
  );
}

export function markV28Preview() {
  try {
    window.localStorage.setItem(V28_PREVIEW_KEY, "1");
    window.localStorage.removeItem("tempo:v26:preview");
    window.localStorage.removeItem("tempo:v27:preview");
    window.dispatchEvent(new Event("tempo:v28-preview"));
    window.dispatchEvent(new Event("tempo:v27-preview"));
    window.dispatchEvent(new Event("tempo:v26-preview"));
  } catch {
    /* ignore */
  }
}

export function readV28Preview() {
  if (V28_STANDALONE) return true;
  try {
    return window.localStorage.getItem(V28_PREVIEW_KEY) === "1";
  } catch {
    return false;
  }
}

export function useV28Preview() {
  const [on, setOn] = useState(readV28Preview);
  useEffect(() => {
    const sync = () => setOn(readV28Preview());
    window.addEventListener("tempo:v28-preview", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("tempo:v28-preview", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return on;
}

export function worksV28Href(params?: { work?: string; apply?: string }) {
  const search = new URLSearchParams();
  if (params?.work) search.set("work", params.work);
  if (params?.apply) search.set("apply", params.apply);
  const q = search.toString();
  return q ? `${V28_WORKS_HREF}?${q}` : V28_WORKS_HREF;
}

export function processV28Href(params?: {
  phase?: string;
  view?: "works" | "fire" | "sales" | "servicing";
  who?: string;
  chapter?: string;
}) {
  const search = new URLSearchParams();
  if (params?.phase) search.set("phase", params.phase);
  if (params?.view) search.set("view", params.view);
  if (params?.who) search.set("who", params.who);
  if (params?.chapter) search.set("chapter", params.chapter);
  const q = search.toString();
  return q ? `${V28_PROCESS_HREF}?${q}` : V28_PROCESS_HREF;
}
