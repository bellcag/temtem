import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { SideNav } from "@/components/SideNav";
import { AssistantPanel } from "@/components/AssistantPanel";
import { cn } from "@/lib/utils";

export function AppShell() {
  const [navOpen, setNavOpen] = useState(false);
  const [navCollapsed, setNavCollapsed] = useState(false);
  const location = useLocation();
  const isProcessGuide =
    location.pathname === "/process-v3" ||
    location.pathname === "/process-v2" ||
    location.pathname === "/process";

  // Close mobile drawer on route change
  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  // Process side-by-side layout needs the app nav as an icon rail
  useEffect(() => {
    setNavCollapsed(isProcessGuide);
  }, [isProcessGuide]);

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
    <div className="flex h-full min-h-0 bg-grey-50">
      {/* iPhone top bar — Tablet+ uses persistent SideNav */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-3 border-b border-grey-100 bg-white px-4 tablet:hidden">
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
        <div className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-[var(--radius-sm)] bg-purple-600 text-xs font-black text-white">
            T
          </div>
          <span className="text-base font-black tracking-tight text-black">
            TeMPo
          </span>
        </div>
      </header>

      {navOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-[rgba(18,18,18,0.4)] tablet:hidden"
          onClick={() => setNavOpen(false)}
        />
      )}

      <div
        id="tempo-sidenav"
        className={cn(
          "fixed inset-y-0 left-0 z-50 h-full transition-transform duration-200",
          "tablet:static tablet:z-0 tablet:translate-x-0",
          navOpen ? "translate-x-0" : "-translate-x-full tablet:translate-x-0",
        )}
      >
        <SideNav
          onNavigate={() => setNavOpen(false)}
          collapsed={navCollapsed}
          onToggleCollapse={() => setNavCollapsed((v) => !v)}
        />
      </div>

      <main className="min-w-0 flex-1 overflow-y-auto pt-14 tablet:pt-0">
        <Outlet />
      </main>
      <AssistantPanel />
    </div>
  );
}
