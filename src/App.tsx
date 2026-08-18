import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppStateProvider } from "@/lib/app-state";
import { AppShell } from "@/components/AppShell";
import { DashboardPage } from "@/pages/Dashboard";
import { ProcessPage } from "@/pages/Process";
import { ProcessV2Page } from "@/pages/ProcessV2";
import { ProcessV3Page } from "@/pages/ProcessV3";
import { ProcessV4Page } from "@/pages/ProcessV4";
import {
  AppsPage,
  ContactsPage,
  DocumentDetailPage,
  DocumentsPage,
  ScreenerDraftsPage,
  ScreenerHistoryPage,
} from "@/pages/Secondary";

export default function App() {
  return (
    <AppStateProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<DashboardPage />} />
            <Route path="process" element={<ProcessPage />} />
            <Route path="process-v2" element={<ProcessV2Page />} />
            <Route path="process-v3" element={<ProcessV3Page />} />
            <Route path="process-v4" element={<ProcessV4Page />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="documents/:id" element={<DocumentDetailPage />} />
            <Route path="apps" element={<AppsPage />} />
            <Route path="contacts" element={<ContactsPage />} />
            <Route path="screener" element={<Navigate to="/screener/drafts" replace />} />
            <Route path="screener/drafts" element={<ScreenerDraftsPage />} />
            <Route path="screener/history" element={<ScreenerHistoryPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppStateProvider>
  );
}
