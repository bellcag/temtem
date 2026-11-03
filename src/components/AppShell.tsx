import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { SideNav } from "@/components/SideNav";
import { AssistantPanel } from "@/components/AssistantPanel";
import { useFigmaFullCapture } from "@/lib/figma-capture";
import { usesV37Cut, rememberCutFromPath, usesV36Chrome } from "@/lib/process-v31-preview";
import { captureV37Actor } from "@/lib/process-v37";
import { cn } from "@/lib/utils";
import logoMobile from "@/assets/figma-setup/logo-mobile.svg";

export function AppShell() {
  const [navOpen, setNavOpen] = useState(false);
  const [navCollapsed, setNavCollapsed] = useState(false);
  const location = useLocation();
  if (usesV37Cut(location.pathname)) captureV37Actor(location.search);
  const figmaFull = useFigmaFullCapture();

  useEffect(() => {
    rememberCutFromPath(location.pathname);
  }, [location.pathname]);

  // Close mobile drawer on route change
  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  // Lock body scroll while drawer is open (iPhone)
  useEffect(() => {
    if (!navOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [navOpen]);

  return (
    <div
      className={cn(
        "flex",
        usesV36Chrome(location.pathname) ? "bg-grey-25" : "bg-grey-50",
        figmaFull ? "min-h-full" : "h-full min-h-0",
      )}
    >
      {/* Phone / side-preview chrome — persistent SideNav from 1280 */}
      <header className="app-mobile-bar fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-3 border-b border-grey-100 bg-white px-4 print:hidden desktop:hidden">
        <button
          type="button"
          aria-expanded={navOpen}
          aria-controls="tempo-sidenav"
          onClick={() => setNavOpen((v) => !v)}
          className="grid h-10 w-10 place-items-center rounded-[var(--radius-sm)] text-black hover:bg-grey-50"
        >
          {navOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          <span className="sr-only">{navOpen ? "Close menu" : "Open menu"}</span>
        </button>
        <img
          src={logoMobile}
          alt="CHANGI airport group"
          className="block h-7 w-auto object-contain"
        />
      </header>

      {navOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-[rgba(18,18,18,0.4)] desktop:hidden"
          onClick={() => setNavOpen(false)}
        />
      )}

      <div
        id="tempo-sidenav"
        className={cn(
          "fixed inset-y-0 left-0 z-50 h-full transition-transform duration-200 print:hidden",
          "desktop:static desktop:z-0 desktop:translate-x-0",
          navOpen ? "translate-x-0" : "-translate-x-full desktop:translate-x-0",
        )}
      >
        <SideNav
          onNavigate={() => setNavOpen(false)}
          collapsed={navCollapsed}
          onToggleCollapse={() => setNavCollapsed((v) => !v)}
        />
      </div>

      <main
        className={cn(
          "min-w-0 flex-1 px-4 tablet:px-8",
          usesV36Chrome(location.pathname) ? "desktop:px-8" : "desktop:px-10",
          figmaFull ? "overflow-visible" : "overflow-y-auto overflow-x-hidden",
        )}
      >
        <div className="h-14 shrink-0 print:hidden desktop:hidden" aria-hidden />
        <Outlet />
      </main>
      {!figmaFull && (
        <div className="hidden h-full print:hidden desktop:contents">
          <AssistantPanel />
        </div>
      )}
    </div>
  );
}
