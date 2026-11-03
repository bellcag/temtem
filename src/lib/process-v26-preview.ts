import { useEffect, useState } from "react";

/** Standalone GitHub Pages folder `/v26/` — does not change local or root live. */
export const V26_STANDALONE =
  import.meta.env.VITE_PROCESS_LIVE === "process-v26";

export const V26_PROCESS_HREF = V26_STANDALONE ? "/process" : "/process-v26";
export const V26_WORKS_HREF = V26_STANDALONE ? "/works" : "/works-v26";
export const V26_PREVIEW_KEY = "tempo:v26:preview";

export function isV26Path(pathname: string) {
  if (V26_STANDALONE) return true;
  return (
    pathname === V26_PROCESS_HREF ||
    pathname.startsWith(`${V26_PROCESS_HREF}/`) ||
    pathname === V26_WORKS_HREF ||
    pathname.startsWith(`${V26_WORKS_HREF}/`) ||
    (pathname.startsWith("/screener") && readV26Preview())
  );
}

export function markV26Preview() {
  try {
    window.localStorage.setItem(V26_PREVIEW_KEY, "1");
    window.localStorage.removeItem("tempo:v27:preview");
    window.localStorage.removeItem("tempo:v28:preview");
    window.dispatchEvent(new Event("tempo:v26-preview"));
    window.dispatchEvent(new Event("tempo:v27-preview"));
    window.dispatchEvent(new Event("tempo:v28-preview"));
  } catch {
    /* ignore */
  }
}

export function readV26Preview() {
  if (V26_STANDALONE) return true;
  try {
    return window.localStorage.getItem(V26_PREVIEW_KEY) === "1";
  } catch {
    return false;
  }
}

export function useV26Preview() {
  const [on, setOn] = useState(readV26Preview);
  useEffect(() => {
    const sync = () => setOn(readV26Preview());
    window.addEventListener("tempo:v26-preview", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("tempo:v26-preview", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return on;
}

export function worksV26Href(params?: { work?: string }) {
  const search = new URLSearchParams();
  if (params?.work) search.set("work", params.work);
  const q = search.toString();
  return q ? `${V26_WORKS_HREF}?${q}` : V26_WORKS_HREF;
}

export function processV26Href(params?: {
  phase?: string;
  view?: "works";
  who?: string;
  chapter?: string;
}) {
  const search = new URLSearchParams();
  if (params?.phase) search.set("phase", params.phase);
  if (params?.view) search.set("view", params.view);
  if (params?.who) search.set("who", params.who);
  if (params?.chapter) search.set("chapter", params.chapter);
  const q = search.toString();
  return q ? `${V26_PROCESS_HREF}?${q}` : V26_PROCESS_HREF;
}

export function screenerV26Href(workId: string) {
  return `/screener/drafts?from=v26&work=${encodeURIComponent(workId)}`;
}
