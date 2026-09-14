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
import { archivedProcessPreviews } from "@/lib/archived-process-preview";
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

const ProcessV16Page = lazy(() =>
  import("@/pages/ProcessV16").then((m) => ({ default: m.ProcessV16Page })),
);
const ProcessV17Page = lazy(() =>
  import("@/pages/ProcessV17").then((m) => ({ default: m.ProcessV17Page })),
);
const ProcessV18Page = lazy(() =>
  import("@/pages/ProcessV18").then((m) => ({ default: m.ProcessV18Page })),
);
const ProcessV19Page = lazy(() =>
  import("@/pages/ProcessV19").then((m) => ({ default: m.ProcessV19Page })),
);
const ProcessV20Page = lazy(() =>
  import("@/pages/ProcessV20").then((m) => ({ default: m.ProcessV20Page })),
);
const ProcessV21Page = lazy(() =>
  import("@/pages/ProcessV21").then((m) => ({ default: m.ProcessV21Page })),
);
const ProcessV22Page = lazy(() =>
  import("@/pages/ProcessV22").then((m) => ({ default: m.ProcessV22Page })),
);
const ProcessV23Page = lazy(() =>
  import("@/pages/ProcessV23").then((m) => ({ default: m.ProcessV23Page })),
);
const ProcessV24Page = lazy(() =>
  import("@/pages/ProcessV24").then((m) => ({ default: m.ProcessV24Page })),
);
const WorksPage = lazy(() =>
  import("@/pages/Works").then((m) => ({ default: m.WorksPage })),
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

/** Keep ?phase= / ?chapter= so Home doors are not overwritten by lastPhase. */
function ProcessCanonicalRedirect() {
  const { search } = useLocation();
  return <Navigate to={`/process-v24${search}`} replace />;
}

export default function App() {
  return (
    <AppStateProvider>
      <BrowserRouter>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route index element={<IndexRedirect />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="handoff-kit" element={<HandoffKitPage />} />
            <Route path="setup" element={<ProcessSetupPage />} />
            <Route element={<RequireAuth />}>
              <Route element={<AppShell />}>
                <Route path="home" element={<DashboardPage />} />
                <Route path="process" element={<ProcessCanonicalRedirect />} />
                <Route path="process-v16" element={<ProcessV16Page />} />
                <Route path="process-v17" element={<ProcessV17Page />} />
                <Route path="process-v18" element={<ProcessV18Page />} />
                <Route path="process-v19" element={<ProcessV19Page />} />
                <Route path="process-v20" element={<ProcessV20Page />} />
                <Route path="process-v21" element={<ProcessV21Page />} />
                <Route path="process-v22" element={<ProcessV22Page />} />
                <Route path="process-v23" element={<ProcessV23Page />} />
                <Route path="process-v24" element={<ProcessV24Page />} />
                <Route path="works" element={<WorksPage />} />
                <Route
                  path="idea"
                  element={<Navigate to="/works" replace />}
                />
                {archivedProcessPreviews.map(({ path, Page }) => (
                  <Route key={path} path={path} element={<Page />} />
                ))}
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
