/** Standalone GitHub Pages folder `/v35/` (or older `/v34/`…`/v32/`). Does not change older folders. */
export const TEMPO_CUT = import.meta.env.VITE_TEMPO_CUT || "";
export const CUT_STANDALONE = Boolean(TEMPO_CUT);
/** @deprecated use CUT_STANDALONE */
export const V32_STANDALONE = CUT_STANDALONE;

export const V40_HOME_HREF = "/home-v40";
export const V40_PROCESS_HREF = "/process-v40";
export const V40_WORKS_HREF = "/works-v40";
export const V40_SETTINGS_HREF = "/settings-v40";

export const V39_HOME_HREF = "/home-v39";
export const V39_PROCESS_HREF = "/process-v39";
export const V39_WORKS_HREF = "/works-v39";
export const V39_SETTINGS_HREF = "/settings-v39";

export const V38_HOME_HREF = "/home-v38";
export const V38_PROCESS_HREF = "/process-v38";
export const V38_WORKS_HREF = "/works-v38";

export const V37_HOME_HREF = "/home-v37";
export const V37_PROCESS_HREF = "/process-v37";
export const V37_WORKS_HREF = "/works-v37";

export const V36_HOME_HREF = "/home-v36";
export const V36_PROCESS_HREF = "/process-v36";
export const V36_WORKS_HREF = "/works-v36";

export const V35_HOME_HREF = "/home-v35";
export const V35_PROCESS_HREF = "/process-v35";
export const V35_WORKS_HREF = "/works-v35";

export const V34_HOME_HREF = "/home-v34";
export const V34_PROCESS_HREF = "/process-v34";
export const V34_WORKS_HREF = "/works-v34";

const V33_HOME_HREF = "/home-v33";
const V33_PROCESS_HREF = "/process-v33";
const V33_WORKS_HREF = "/works-v33";

/** Live cut in local (and when VITE_TEMPO_CUT is unset). Standalone Pages builds use TEMPO_CUT. */
export const V31_HOME_HREF = CUT_STANDALONE
  ? `/home-${TEMPO_CUT}`
  : V34_HOME_HREF;
export const V31_PROCESS_HREF = CUT_STANDALONE
  ? `/process-${TEMPO_CUT}`
  : V34_PROCESS_HREF;
export const V31_WORKS_HREF = CUT_STANDALONE
  ? `/works-${TEMPO_CUT}`
  : V34_WORKS_HREF;

/** Drop the Pages base (`/temtem/v35`) so cut checks see `/works-v35`, not the hosted path. */
function stripBase(pathname: string) {
  const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  if (!base || base === "/") return pathname || "/";
  if (pathname === base) return "/";
  if (pathname.startsWith(`${base}/`)) return pathname.slice(base.length) || "/";
  return pathname || "/";
}

function pathIsCut(pathname: string, href: string) {
  const path = stripBase(pathname);
  return path === href || path.startsWith(`${href}/`);
}

type CutId = "v31" | "v32" | "v33" | "v34" | "v35" | "v36" | "v37" | "v38" | "v39" | "v40";

const CUT_MEMORY = "tempo:last-cut";
const CUT_IDS: CutId[] = ["v31", "v32", "v33", "v34", "v35", "v36", "v37", "v38", "v39", "v40"];

function isCutId(value: string | null | undefined): value is CutId {
  return Boolean(value && CUT_IDS.includes(value as CutId));
}

function readRememberedCut(): CutId | "" {
  if (typeof window === "undefined") return "";
  try {
    const stored = window.sessionStorage.getItem(CUT_MEMORY);
    return isCutId(stored) ? stored : "";
  } catch {
    return "";
  }
}

function writeRememberedCut(id: CutId) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(CUT_MEMORY, id);
  } catch {
    /* ignore */
  }
}

function olderPreviewPath(pathname: string) {
  const path = stripBase(pathname);
  return (
    path.startsWith("/home-v29") ||
    path.startsWith("/chat-v29") ||
    path.startsWith("/home-v30") ||
    path.startsWith("/process-v26") ||
    path.startsWith("/works-v26") ||
    path.startsWith("/process-v27") ||
    path.startsWith("/works-v27") ||
    path.startsWith("/process-v28") ||
    path.startsWith("/works-v28")
  );
}

function strictCutId(pathname: string): CutId | "" {
  if (
    pathIsCut(pathname, V40_HOME_HREF) ||
    pathIsCut(pathname, V40_PROCESS_HREF) ||
    pathIsCut(pathname, V40_WORKS_HREF) ||
    pathIsCut(pathname, V40_SETTINGS_HREF)
  ) {
    return "v40";
  }
  if (
    pathIsCut(pathname, V39_HOME_HREF) ||
    pathIsCut(pathname, V39_PROCESS_HREF) ||
    pathIsCut(pathname, V39_WORKS_HREF) ||
    pathIsCut(pathname, V39_SETTINGS_HREF)
  ) {
    return "v39";
  }
  if (
    pathIsCut(pathname, V38_HOME_HREF) ||
    pathIsCut(pathname, V38_PROCESS_HREF) ||
    pathIsCut(pathname, V38_WORKS_HREF)
  ) {
    return "v38";
  }
  if (
    pathIsCut(pathname, V37_HOME_HREF) ||
    pathIsCut(pathname, V37_PROCESS_HREF) ||
    pathIsCut(pathname, V37_WORKS_HREF)
  ) {
    return "v37";
  }
  if (
    pathIsCut(pathname, V36_HOME_HREF) ||
    pathIsCut(pathname, V36_PROCESS_HREF) ||
    pathIsCut(pathname, V36_WORKS_HREF)
  ) {
    return "v36";
  }
  if (
    pathIsCut(pathname, V35_HOME_HREF) ||
    pathIsCut(pathname, V35_PROCESS_HREF) ||
    pathIsCut(pathname, V35_WORKS_HREF)
  ) {
    return "v35";
  }
  if (
    pathIsCut(pathname, V34_HOME_HREF) ||
    pathIsCut(pathname, V34_PROCESS_HREF) ||
    pathIsCut(pathname, V34_WORKS_HREF)
  ) {
    return "v34";
  }
  if (
    pathIsCut(pathname, V33_HOME_HREF) ||
    pathIsCut(pathname, V33_PROCESS_HREF) ||
    pathIsCut(pathname, V33_WORKS_HREF)
  ) {
    return "v33";
  }
  if (
    pathIsCut(pathname, "/home-v32") ||
    pathIsCut(pathname, "/process-v32") ||
    pathIsCut(pathname, "/works-v32")
  ) {
    return "v32";
  }
  if (
    pathIsCut(pathname, "/home-v31") ||
    pathIsCut(pathname, "/process-v31") ||
    pathIsCut(pathname, "/works-v31")
  ) {
    return "v31";
  }
  return "";
}

/** Keep Home / Process / Projects on the cut the user was just in. */
export function rememberCutFromPath(pathname: string) {
  const id = strictCutId(pathname);
  if (id) writeRememberedCut(id);
}

function cutIdFromPath(pathname: string): CutId {
  if (CUT_STANDALONE && isCutId(TEMPO_CUT)) return TEMPO_CUT;
  const fromPath = strictCutId(pathname);
  if (fromPath) {
    writeRememberedCut(fromPath);
    return fromPath;
  }
  if (olderPreviewPath(pathname)) return "v34";
  const remembered = readRememberedCut();
  if (remembered) return remembered;
  return "v34";
}

/** Side nav stays on v31–v37 when Documents / Apps / Contacts would otherwise drop to the live v34 routes. */
export function usesV31Nav(pathname: string) {
  if (CUT_STANDALONE) return true;
  if (olderPreviewPath(pathname)) return false;
  return isV31Path(pathname) || Boolean(readRememberedCut());
}

export function isV40Path(pathname: string) {
  if (TEMPO_CUT === "v40") return true;
  return (
    pathIsCut(pathname, V40_HOME_HREF) ||
    pathIsCut(pathname, V40_PROCESS_HREF) ||
    pathIsCut(pathname, V40_WORKS_HREF) ||
    pathIsCut(pathname, V40_SETTINGS_HREF)
  );
}

export function isV39Path(pathname: string) {
  if (TEMPO_CUT === "v39") return true;
  return (
    pathIsCut(pathname, V39_HOME_HREF) ||
    pathIsCut(pathname, V39_PROCESS_HREF) ||
    pathIsCut(pathname, V39_WORKS_HREF) ||
    pathIsCut(pathname, V39_SETTINGS_HREF)
  );
}

/** v38 Projects, also on v39 and v40. v40 Tenancy Journey is the 29 Oct sheet. */
export function usesV38Modules(pathname: string) {
  return isV38Path(pathname) || isV39Path(pathname) || isV40Path(pathname);
}

export function isV38Path(pathname: string) {
  if (TEMPO_CUT === "v38") return true;
  return (
    pathIsCut(pathname, V38_HOME_HREF) ||
    pathIsCut(pathname, V38_PROCESS_HREF) ||
    pathIsCut(pathname, V38_WORKS_HREF)
  );
}

export function isV37Path(pathname: string) {
  if (TEMPO_CUT === "v37") return true;
  return (
    pathIsCut(pathname, V37_HOME_HREF) ||
    pathIsCut(pathname, V37_PROCESS_HREF) ||
    pathIsCut(pathname, V37_WORKS_HREF)
  );
}

/** v37 behaviour, also on v38, v39, and v40. v37 routes themselves stay on isV37Path. */
export function usesV37Cut(pathname: string) {
  return isV37Path(pathname) || isV38Path(pathname) || isV39Path(pathname) || isV40Path(pathname);
}

/** v36 layout. v37 and v38 use the same chrome. */
export function usesV36Chrome(pathname: string) {
  return isV36Path(pathname) || usesV37Cut(pathname);
}

export function isV36Path(pathname: string) {
  if (TEMPO_CUT === "v36") return true;
  return (
    pathIsCut(pathname, V36_HOME_HREF) ||
    pathIsCut(pathname, V36_PROCESS_HREF) ||
    pathIsCut(pathname, V36_WORKS_HREF)
  );
}

export function isV35Path(pathname: string) {
  if (TEMPO_CUT === "v35") return true;
  return (
    pathIsCut(pathname, V35_HOME_HREF) ||
    pathIsCut(pathname, V35_PROCESS_HREF) ||
    pathIsCut(pathname, V35_WORKS_HREF)
  );
}

/** v35 screens, also on v36, v37, and v38. Requirement-update notices stay on v35 only. */
export function usesV35Flow(pathname: string) {
  return isV35Path(pathname) || isV36Path(pathname) || usesV37Cut(pathname);
}

export function isV34Path(pathname: string) {
  if (isV35Path(pathname)) return false;
  if (TEMPO_CUT === "v34") return true;
  return (
    pathIsCut(pathname, V34_HOME_HREF) ||
    pathIsCut(pathname, V34_PROCESS_HREF) ||
    pathIsCut(pathname, V34_WORKS_HREF)
  );
}

export function isV33Path(pathname: string) {
  if (isV35Path(pathname) || isV34Path(pathname)) return false;
  if (TEMPO_CUT === "v33") return true;
  return (
    pathIsCut(pathname, V33_HOME_HREF) ||
    pathIsCut(pathname, V33_PROCESS_HREF) ||
    pathIsCut(pathname, V33_WORKS_HREF)
  );
}

export function isV31Path(pathname: string) {
  if (CUT_STANDALONE) return true;
  return (
    pathIsCut(pathname, "/home-v31") ||
    pathIsCut(pathname, "/process-v31") ||
    pathIsCut(pathname, "/works-v31") ||
    pathIsCut(pathname, "/home-v32") ||
    pathIsCut(pathname, "/process-v32") ||
    pathIsCut(pathname, "/works-v32") ||
    pathIsCut(pathname, V33_HOME_HREF) ||
    pathIsCut(pathname, V33_PROCESS_HREF) ||
    pathIsCut(pathname, V33_WORKS_HREF) ||
    pathIsCut(pathname, V34_HOME_HREF) ||
    pathIsCut(pathname, V34_PROCESS_HREF) ||
    pathIsCut(pathname, V34_WORKS_HREF) ||
    pathIsCut(pathname, V35_HOME_HREF) ||
    pathIsCut(pathname, V35_PROCESS_HREF) ||
    pathIsCut(pathname, V35_WORKS_HREF) ||
    pathIsCut(pathname, V36_HOME_HREF) ||
    pathIsCut(pathname, V36_PROCESS_HREF) ||
    pathIsCut(pathname, V36_WORKS_HREF) ||
    pathIsCut(pathname, V37_HOME_HREF) ||
    pathIsCut(pathname, V37_PROCESS_HREF) ||
    pathIsCut(pathname, V37_WORKS_HREF) ||
    pathIsCut(pathname, V38_HOME_HREF) ||
    pathIsCut(pathname, V38_PROCESS_HREF) ||
    pathIsCut(pathname, V38_WORKS_HREF) ||
    pathIsCut(pathname, V39_HOME_HREF) ||
    pathIsCut(pathname, V39_PROCESS_HREF) ||
    pathIsCut(pathname, V39_WORKS_HREF) ||
    pathIsCut(pathname, V39_SETTINGS_HREF) ||
    pathIsCut(pathname, V40_HOME_HREF) ||
    pathIsCut(pathname, V40_PROCESS_HREF) ||
    pathIsCut(pathname, V40_WORKS_HREF) ||
    pathIsCut(pathname, V40_SETTINGS_HREF)
  );
}

/** Stay on the same cut the user is already in. Live default is v34. */
export function cutHomeHref(pathname: string) {
  return `/home-${cutIdFromPath(pathname)}`;
}

export function cutProcessHref(pathname: string) {
  return `/process-${cutIdFromPath(pathname)}`;
}

export function cutWorksHref(pathname: string) {
  return `/works-${cutIdFromPath(pathname)}`;
}

function browserPathname() {
  return typeof window !== "undefined" ? window.location.pathname : "";
}

function activeHomeHref() {
  return cutHomeHref(browserPathname());
}

function activeProcessHref() {
  return cutProcessHref(browserPathname());
}

function activeWorksHref() {
  return cutWorksHref(browserPathname());
}

export function worksV31Href(params?: { work?: string }) {
  const base = activeWorksHref();
  const search = new URLSearchParams();
  if (params?.work) search.set("work", params.work);
  const q = search.toString();
  return q ? `${base}?${q}` : base;
}

export function worksV34Href(params?: { work?: string; result?: string; permit?: boolean }) {
  const search = new URLSearchParams();
  if (params?.work) search.set("work", params.work);
  if (params?.result) search.set("result", params.result);
  if (params?.permit) {
    search.set("tab", "pack");
    search.set("apply", "upload");
  }
  const q = search.toString();
  return q ? `${V34_WORKS_HREF}?${q}` : V34_WORKS_HREF;
}

export function worksV35Href(params?: { work?: string; result?: string; permit?: boolean }) {
  const search = new URLSearchParams();
  if (params?.work) search.set("work", params.work);
  if (params?.result) search.set("result", params.result);
  if (params?.permit) {
    search.set("tab", "pack");
    search.set("apply", "upload");
  }
  const q = search.toString();
  return q ? `${V35_WORKS_HREF}?${q}` : V35_WORKS_HREF;
}

export function processV31Href(params?: {
  phase?: string;
  who?: string;
  chapter?: string;
}) {
  const base = activeProcessHref();
  const search = new URLSearchParams();
  if (params?.phase) search.set("phase", params.phase);
  if (params?.who) search.set("who", params.who);
  if (params?.chapter) search.set("chapter", params.chapter);
  const q = search.toString();
  return q ? `${base}?${q}` : base;
}

/** Keep dashboard search / fallbacks inside this cut. */
export function remapV31Href(to: string) {
  const qIndex = to.indexOf("?");
  const path = qIndex === -1 ? to : to.slice(0, qIndex);
  const q = new URLSearchParams(qIndex === -1 ? "" : to.slice(qIndex + 1));
  if (path === "/process" || path.startsWith("/process-")) {
    return processV31Href({
      phase: q.get("phase") ?? undefined,
      who: q.get("who") ?? undefined,
      chapter: q.get("chapter") ?? undefined,
    });
  }
  if (path === "/works" || path.startsWith("/works-")) {
    return worksV31Href(q.get("work") ? { work: q.get("work")! } : undefined);
  }
  if (path === "/home" || path.startsWith("/home-")) {
    return activeHomeHref();
  }
  return to;
}
