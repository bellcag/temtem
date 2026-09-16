import { lazy, Suspense } from "react";
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { AppStateProvider, useApp } from "@/lib/app-state";
import { AppShell } from "@/components/AppShell";
import { DashboardPage } from "@/pages/Dashboard";
import { LoginPage } from "@/pages/Login";
import { HandoffKitPage } from "@/pages/HandoffKit";
import { ProcessSetupPage } from "@/pages/ProcessSetup";
import {
  AppsPage,
  ContactsPage,
  DocumentDetailPage,
  DocumentsPage,
} from "@/pages/Secondary";
import {
  ScreenerDraftsPage,
  ScreenerHistoryPage,
} from "@/pages/Screener";

const ProcessV20Page = lazy(() =>
  import("@/pages/ProcessV20").then((m) => ({ default: m.ProcessV20Page })),
);

function PageFallback() {
  return (
    <div className="flex flex-1 items-center justify-center p-8 text-sm text-grey-600">
      Loading…
    </div>
  );
}

function IndexRedirect() {
  const { signedIn } = useApp();
  return <Navigate to={signedIn ? "/home" : "/login"} replace />;
}

function RequireAuth() {
  const { signedIn } = useApp();
  const location = useLocation();
  if (!signedIn) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }
  return <Outlet />;
}

/** Other process URLs stay inside this v20 freeze. */
function StayOnV20() {
  const { search } = useLocation();
  return <Navigate to={`/process${search}`} replace />;
}

export default function App() {
  return (
    <AppStateProvider>
      <BrowserRouter
        basename={import.meta.env.BASE_URL.replace(/\/$/, "") || undefined}
      >
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route index element={<IndexRedirect />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="handoff-kit" element={<HandoffKitPage />} />
            <Route path="setup" element={<ProcessSetupPage />} />
            <Route element={<RequireAuth />}>
              <Route element={<AppShell />}>
                <Route path="home" element={<DashboardPage />} />
                <Route path="process" element={<ProcessV20Page />} />
                <Route path="process-v20" element={<ProcessV20Page />} />
                <Route path="process-v16" element={<StayOnV20 />} />
                <Route path="process-v17" element={<StayOnV20 />} />
                <Route path="process-v18" element={<StayOnV20 />} />
                <Route path="process-v19" element={<StayOnV20 />} />
                <Route path="process-v21" element={<StayOnV20 />} />
                <Route path="process-v22" element={<StayOnV20 />} />
                <Route path="process-v23" element={<StayOnV20 />} />
                <Route path="process-v24" element={<StayOnV20 />} />
                <Route path="process-v25" element={<StayOnV20 />} />
                <Route path="works" element={<StayOnV20 />} />
                <Route path="idea" element={<StayOnV20 />} />
                <Route path="process-v1" element={<StayOnV20 />} />
                <Route path="process-v2" element={<StayOnV20 />} />
                <Route path="process-v3" element={<StayOnV20 />} />
                <Route path="process-v4" element={<StayOnV20 />} />
                <Route path="process-v5" element={<StayOnV20 />} />
                <Route path="process-v6" element={<StayOnV20 />} />
                <Route path="process-v7" element={<StayOnV20 />} />
                <Route path="process-v8" element={<StayOnV20 />} />
                <Route path="process-v9" element={<StayOnV20 />} />
                <Route path="process-v10" element={<StayOnV20 />} />
                <Route path="process-v11" element={<StayOnV20 />} />
                <Route path="process-v12" element={<StayOnV20 />} />
                <Route path="process-v13" element={<StayOnV20 />} />
                <Route path="process-v14" element={<StayOnV20 />} />
                <Route path="process-v15" element={<StayOnV20 />} />
                <Route path="documents" element={<DocumentsPage />} />
                <Route path="documents/:id" element={<DocumentDetailPage />} />
                <Route path="apps" element={<AppsPage />} />
                <Route path="contacts" element={<ContactsPage />} />
                <Route
                  path="screener"
                  element={<Navigate to="/screener/drafts" replace />}
                />
                <Route path="screener/drafts" element={<ScreenerDraftsPage />} />
                <Route
                  path="screener/history"
                  element={<ScreenerHistoryPage />}
                />
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AppStateProvider>
  );
}
