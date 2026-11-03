import { useEffect, useState } from "react";

/** Standalone GitHub Pages folder `/v27/` — does not change local, root, or `/v26/`. */
export const V27_STANDALONE =
  import.meta.env.VITE_PROCESS_LIVE === "process-v27";

export const V27_PROCESS_HREF = V27_STANDALONE ? "/process" : "/process-v27";
export const V27_WORKS_HREF = V27_STANDALONE ? "/works" : "/works-v27";
export const V27_PREVIEW_KEY = "tempo:v27:preview";

export function isV27Path(pathname: string) {
  if (V27_STANDALONE) return true;
  return (
    pathname === V27_PROCESS_HREF ||
    pathname.startsWith(`${V27_PROCESS_HREF}/`) ||
    pathname === V27_WORKS_HREF ||
    pathname.startsWith(`${V27_WORKS_HREF}/`)
  );
}

export function markV27Preview() {
  try {
    window.localStorage.setItem(V27_PREVIEW_KEY, "1");
    window.localStorage.removeItem("tempo:v26:preview");
    window.localStorage.removeItem("tempo:v28:preview");
    window.dispatchEvent(new Event("tempo:v27-preview"));
    window.dispatchEvent(new Event("tempo:v28-preview"));
    window.dispatchEvent(new Event("tempo:v26-preview"));
  } catch {
    /* ignore */
  }
}

export function readV27Preview() {
  if (V27_STANDALONE) return true;
  try {
    return window.localStorage.getItem(V27_PREVIEW_KEY) === "1";
  } catch {
    return false;
  }
}

export function useV27Preview() {
  const [on, setOn] = useState(readV27Preview);
  useEffect(() => {
    const sync = () => setOn(readV27Preview());
    window.addEventListener("tempo:v27-preview", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("tempo:v27-preview", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return on;
}

export function worksV27Href(params?: { work?: string; apply?: string }) {
  const search = new URLSearchParams();
  if (params?.work) search.set("work", params.work);
  if (params?.apply) search.set("apply", params.apply);
  const q = search.toString();
  return q ? `${V27_WORKS_HREF}?${q}` : V27_WORKS_HREF;
}

export function processV27Href(params?: {
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
  return q ? `${V27_PROCESS_HREF}?${q}` : V27_PROCESS_HREF;
}
