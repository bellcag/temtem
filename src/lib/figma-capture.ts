import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

/** Expand nested scroll so html-to-design can capture the full Process page. */
export function useFigmaFullCapture() {
  const location = useLocation();
  const [fromHash, setFromHash] = useState(
    () =>
      typeof window !== "undefined" &&
      /figmacapture/i.test(window.location.hash),
  );

  useEffect(() => {
    const sync = () =>
      setFromHash(/figmacapture/i.test(window.location.hash));
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [location.hash]);

  const fromQuery = new URLSearchParams(location.search).has("figmaFull");
  const active = fromQuery || fromHash;

  useEffect(() => {
    document.documentElement.classList.toggle("figma-full", active);
    return () => document.documentElement.classList.remove("figma-full");
  }, [active]);

  return active;
}
