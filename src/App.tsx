import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppStateProvider } from "@/lib/app-state";
import { archivedProcessPreviews } from "@/lib/archived-process-preview";
import { AppShell } from "@/components/AppShell";
import { DashboardPage } from "@/pages/Dashboard";
import { ProcessSetupPage } from "@/pages/ProcessSetup";
import {
  AppsPage,
  ContactsPage,
  DocumentDetailPage,
  DocumentsPage,
  ScreenerDraftsPage,
  ScreenerHistoryPage,
} from "@/pages/Secondary";

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

function PageFallback() {
  return (
    <div className="flex flex-1 items-center justify-center p-8 text-sm text-grey-600">
      Loading…
    </div>
  );
}

export default function App() {
  return (
    <AppStateProvider>
      <BrowserRouter>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route index element={<ProcessSetupPage />} />
            <Route element={<AppShell />}>
              <Route path="home" element={<DashboardPage />} />
              <Route
                path="process"
                element={<Navigate to="/process-v19" replace />}
              />
              <Route path="process-v16" element={<ProcessV16Page />} />
              <Route path="process-v17" element={<ProcessV17Page />} />
              <Route path="process-v18" element={<ProcessV18Page />} />
              <Route path="process-v19" element={<ProcessV19Page />} />
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
              <Route path="screener/history" element={<ScreenerHistoryPage />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AppStateProvider>
  );
}
