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
import { DashboardV29Page } from "@/pages/DashboardV29";
import { DashboardV30Page } from "@/pages/DashboardV30";
import { DashboardV31Page } from "@/pages/DashboardV31";
import { ChatV29Page } from "@/pages/ChatV29";
import { homeCutHref } from "@/lib/home-cut";
import {
  CUT_STANDALONE,
  cutHomeHref,
  cutProcessHref,
  cutWorksHref,
  V31_HOME_HREF,
  V31_PROCESS_HREF,
  V31_WORKS_HREF,
} from "@/lib/process-v31-preview";
import {
  SettingsV39AccountForm,
  SettingsV39EditUnit,
  SettingsV39Home,
  SettingsV39Layout,
  SettingsV39ReviewRequest,
  SettingsV39StaffForm,
} from "@/pages/SettingsV39";
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
import { useV26Preview } from "@/lib/process-v26-preview";
import { useV27Preview } from "@/lib/process-v27-preview";
import { useV28Preview } from "@/lib/process-v28-preview";

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
const ProcessV25Page = lazy(() =>
  import("@/pages/ProcessV25").then((m) => ({ default: m.ProcessV25Page })),
);
const WorksPage = lazy(() =>
  import("@/pages/Works").then((m) => ({ default: m.WorksPage })),
);
const ProcessV26Page = lazy(() =>
  import("@/pages/ProcessV26").then((m) => ({ default: m.ProcessV26Page })),
);
const WorksV26Page = lazy(() =>
  import("@/pages/WorksV26").then((m) => ({ default: m.WorksV26Page })),
);
const ProcessV27Page = lazy(() =>
  import("@/pages/ProcessV27").then((m) => ({ default: m.ProcessV27Page })),
);
const WorksV27Page = lazy(() =>
  import("@/pages/WorksV27").then((m) => ({ default: m.WorksV27Page })),
);
const ProcessV28Page = lazy(() =>
  import("@/pages/ProcessV28").then((m) => ({ default: m.ProcessV28Page })),
);
const WorksV28Page = lazy(() =>
  import("@/pages/WorksV28").then((m) => ({ default: m.WorksV28Page })),
);
const ProcessV31Page = lazy(() =>
  import("@/pages/ProcessV31").then((m) => ({ default: m.ProcessV31Page })),
);
const DocumentsV26Page = lazy(() =>
  import("@/pages/DocumentsV26").then((m) => ({ default: m.DocumentsV26Page })),
);
const DocumentsV26DetailPage = lazy(() =>
  import("@/pages/DocumentsV26").then((m) => ({
    default: m.DocumentsV26DetailPage,
  })),
);

function PageFallback() {
  return (
    <div className="flex flex-1 items-center justify-center p-8 text-sm text-grey-600">
      Loading…
    </div>
  );
}

/** Standalone Pages build. Unset in local dev, so the two homes stay separate. */
const HOME_LIVE = import.meta.env.VITE_HOME_LIVE;

function CutHomeRedirect() {
  const { pathname, search } = useLocation();
  return <Navigate to={`${cutHomeHref(pathname)}${search}`} replace />;
}

function CutProcessRedirect() {
  const { pathname, search } = useLocation();
  return <Navigate to={`${cutProcessHref(pathname)}${search}`} replace />;
}

function CutWorksRedirect() {
  const { pathname, search } = useLocation();
  return <Navigate to={`${cutWorksHref(pathname)}${search}`} replace />;
}

function HomePreviewSwitch() {
  if (HOME_LIVE === "v30") return <Navigate to="/home-v30" replace />;
  if (HOME_LIVE === "v29") return <Navigate to="/home-v29" replace />;
  if (HOME_LIVE === "v33") return <Navigate to="/home-v33" replace />;
  if (HOME_LIVE === "v32") return <Navigate to="/home-v32" replace />;
  if (HOME_LIVE === "v31") return <Navigate to="/home-v31" replace />;
  if (CUT_STANDALONE || HOME_LIVE === "v34" || !HOME_LIVE) {
    return <CutHomeRedirect />;
  }
  const v28 = useV28Preview();
  if (v28) return <Navigate to={homeCutHref()} replace />;
  return <DashboardPage />;
}

function IndexRedirect() {
  const { signedIn } = useApp();
  return (
    <Navigate
      to={signedIn ? (CUT_STANDALONE ? V31_HOME_HREF : "/home") : "/login"}
      replace
    />
  );
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

/** Live process cut. Standalone Pages builds set VITE_PROCESS_LIVE; local default is v34. */
const PROCESS_LIVE = import.meta.env.VITE_PROCESS_LIVE || "process-v34";

/** Keep ?phase= / ?chapter= so Home doors are not overwritten by lastPhase. */
function V26DocumentsSwitch() {
  if (CUT_STANDALONE) return <DocumentsV26Page />;
  const v26 = useV26Preview();
  const v27 = useV27Preview();
  const v28 = useV28Preview();
  return v26 || v27 || v28 ? <DocumentsV26Page /> : <DocumentsPage />;
}

function V26DocumentDetailSwitch() {
  if (CUT_STANDALONE) return <DocumentsV26DetailPage />;
  const v26 = useV26Preview();
  const v27 = useV27Preview();
  const v28 = useV28Preview();
  return v26 || v27 || v28 ? <DocumentsV26DetailPage /> : <DocumentDetailPage />;
}

function LegacyCutRedirect({ to }: { to: string }) {
  const { search } = useLocation();
  return <Navigate to={`${to}${search}`} replace />;
}

function ProcessCanonicalRedirect() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  if (!params.get("role")) params.set("role", "tenant");
  const next = params.toString();
  return <Navigate to={`/${PROCESS_LIVE}${next ? `?${next}` : ""}`} replace />;
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
                <Route path="home" element={<HomePreviewSwitch />} />
                <Route
                  path="home-v32"
                  element={
                    V31_HOME_HREF !== "/home-v32" ? (
                      <LegacyCutRedirect to={V31_HOME_HREF} />
                    ) : (
                      <DashboardV31Page />
                    )
                  }
                />
                <Route
                  path="process-v32"
                  element={
                    V31_PROCESS_HREF !== "/process-v32" ? (
                      <LegacyCutRedirect to={V31_PROCESS_HREF} />
                    ) : (
                      <ProcessV31Page />
                    )
                  }
                />
                <Route
                  path="works-v32"
                  element={
                    V31_WORKS_HREF !== "/works-v32" ? (
                      <LegacyCutRedirect to={V31_WORKS_HREF} />
                    ) : (
                      <WorksV28Page />
                    )
                  }
                />
                <Route
                  path="home-v33"
                  element={
                    CUT_STANDALONE && V31_HOME_HREF !== "/home-v33" ? (
                      <LegacyCutRedirect to={V31_HOME_HREF} />
                    ) : (
                      <DashboardV31Page />
                    )
                  }
                />
                <Route
                  path="process-v33"
                  element={
                    CUT_STANDALONE && V31_PROCESS_HREF !== "/process-v33" ? (
                      <LegacyCutRedirect to={V31_PROCESS_HREF} />
                    ) : (
                      <ProcessV31Page />
                    )
                  }
                />
                <Route
                  path="works-v33"
                  element={
                    CUT_STANDALONE && V31_WORKS_HREF !== "/works-v33" ? (
                      <LegacyCutRedirect to={V31_WORKS_HREF} />
                    ) : (
                      <WorksV28Page />
                    )
                  }
                />
                <Route
                  path="home-v34"
                  element={
                    CUT_STANDALONE && V31_HOME_HREF !== "/home-v34" ? (
                      <LegacyCutRedirect to={V31_HOME_HREF} />
                    ) : (
                      <DashboardV31Page />
                    )
                  }
                />
                <Route
                  path="process-v34"
                  element={
                    CUT_STANDALONE && V31_PROCESS_HREF !== "/process-v34" ? (
                      <LegacyCutRedirect to={V31_PROCESS_HREF} />
                    ) : (
                      <ProcessV31Page />
                    )
                  }
                />
                <Route
                  path="works-v34"
                  element={
                    CUT_STANDALONE && V31_WORKS_HREF !== "/works-v34" ? (
                      <LegacyCutRedirect to={V31_WORKS_HREF} />
                    ) : (
                      <WorksV28Page />
                    )
                  }
                />
                <Route
                  path="home-v35"
                  element={
                    CUT_STANDALONE && V31_HOME_HREF !== "/home-v35" ? (
                      <LegacyCutRedirect to={V31_HOME_HREF} />
                    ) : (
                      <DashboardV31Page />
                    )
                  }
                />
                <Route
                  path="process-v35"
                  element={
                    CUT_STANDALONE && V31_PROCESS_HREF !== "/process-v35" ? (
                      <LegacyCutRedirect to={V31_PROCESS_HREF} />
                    ) : (
                      <ProcessV31Page />
                    )
                  }
                />
                <Route
                  path="works-v35"
                  element={
                    CUT_STANDALONE && V31_WORKS_HREF !== "/works-v35" ? (
                      <LegacyCutRedirect to={V31_WORKS_HREF} />
                    ) : (
                      <WorksV28Page />
                    )
                  }
                />
                <Route
                  path="home-v36"
                  element={
                    CUT_STANDALONE && V31_HOME_HREF !== "/home-v36" ? (
                      <LegacyCutRedirect to={V31_HOME_HREF} />
                    ) : (
                      <DashboardV31Page />
                    )
                  }
                />
                <Route
                  path="process-v36"
                  element={
                    CUT_STANDALONE && V31_PROCESS_HREF !== "/process-v36" ? (
                      <LegacyCutRedirect to={V31_PROCESS_HREF} />
                    ) : (
                      <ProcessV31Page />
                    )
                  }
                />
                <Route
                  path="works-v36"
                  element={
                    CUT_STANDALONE && V31_WORKS_HREF !== "/works-v36" ? (
                      <LegacyCutRedirect to={V31_WORKS_HREF} />
                    ) : (
                      <WorksV28Page />
                    )
                  }
                />
                <Route
                  path="home-v37"
                  element={
                    CUT_STANDALONE && V31_HOME_HREF !== "/home-v37" ? (
                      <LegacyCutRedirect to={V31_HOME_HREF} />
                    ) : (
                      <DashboardV31Page />
                    )
                  }
                />
                <Route
                  path="process-v37"
                  element={
                    CUT_STANDALONE && V31_PROCESS_HREF !== "/process-v37" ? (
                      <LegacyCutRedirect to={V31_PROCESS_HREF} />
                    ) : (
                      <ProcessV31Page />
                    )
                  }
                />
                <Route
                  path="works-v37"
                  element={
                    CUT_STANDALONE && V31_WORKS_HREF !== "/works-v37" ? (
                      <LegacyCutRedirect to={V31_WORKS_HREF} />
                    ) : (
                      <WorksV28Page />
                    )
                  }
                />
                <Route
                  path="home-v38"
                  element={
                    CUT_STANDALONE && V31_HOME_HREF !== "/home-v38" ? (
                      <LegacyCutRedirect to={V31_HOME_HREF} />
                    ) : (
                      <DashboardV31Page />
                    )
                  }
                />
                <Route
                  path="process-v38"
                  element={
                    CUT_STANDALONE && V31_PROCESS_HREF !== "/process-v38" ? (
                      <LegacyCutRedirect to={V31_PROCESS_HREF} />
                    ) : (
                      <ProcessV31Page />
                    )
                  }
                />
                <Route
                  path="works-v38"
                  element={
                    CUT_STANDALONE && V31_WORKS_HREF !== "/works-v38" ? (
                      <LegacyCutRedirect to={V31_WORKS_HREF} />
                    ) : (
                      <WorksV28Page />
                    )
                  }
                />
                <Route
                  path="home-v39"
                  element={
                    CUT_STANDALONE && V31_HOME_HREF !== "/home-v39" ? (
                      <LegacyCutRedirect to={V31_HOME_HREF} />
                    ) : (
                      <DashboardV31Page />
                    )
                  }
                />
                <Route
                  path="process-v39"
                  element={
                    CUT_STANDALONE && V31_PROCESS_HREF !== "/process-v39" ? (
                      <LegacyCutRedirect to={V31_PROCESS_HREF} />
                    ) : (
                      <ProcessV31Page />
                    )
                  }
                />
                <Route
                  path="works-v39"
                  element={
                    CUT_STANDALONE && V31_WORKS_HREF !== "/works-v39" ? (
                      <LegacyCutRedirect to={V31_WORKS_HREF} />
                    ) : (
                      <WorksV28Page />
                    )
                  }
                />
                <Route path="settings-v39" element={<SettingsV39Layout />}>
                  <Route index element={<SettingsV39Home />} />
                  <Route
                    path="accounts/:kind/new"
                    element={<SettingsV39AccountForm mode="create" />}
                  />
                  <Route
                    path="accounts/:kind/:id/edit"
                    element={<SettingsV39AccountForm mode="edit" />}
                  />
                  <Route
                    path="accounts/requests/:id"
                    element={<SettingsV39ReviewRequest />}
                  />
                  <Route path="staff/new" element={<SettingsV39StaffForm mode="create" />} />
                  <Route
                    path="staff/:id/edit"
                    element={<SettingsV39StaffForm mode="edit" />}
                  />
                  <Route path="units/:id/edit" element={<SettingsV39EditUnit />} />
                </Route>
                <Route
                  path="home-v40"
                  element={
                    CUT_STANDALONE && V31_HOME_HREF !== "/home-v40" ? (
                      <LegacyCutRedirect to={V31_HOME_HREF} />
                    ) : (
                      <DashboardV31Page />
                    )
                  }
                />
                <Route
                  path="process-v40"
                  element={
                    CUT_STANDALONE && V31_PROCESS_HREF !== "/process-v40" ? (
                      <LegacyCutRedirect to={V31_PROCESS_HREF} />
                    ) : (
                      <ProcessV31Page />
                    )
                  }
                />
                <Route
                  path="works-v40"
                  element={
                    CUT_STANDALONE && V31_WORKS_HREF !== "/works-v40" ? (
                      <LegacyCutRedirect to={V31_WORKS_HREF} />
                    ) : (
                      <WorksV28Page />
                    )
                  }
                />
                <Route path="settings-v40" element={<SettingsV39Layout />}>
                  <Route index element={<SettingsV39Home />} />
                  <Route
                    path="accounts/:kind/new"
                    element={<SettingsV39AccountForm mode="create" />}
                  />
                  <Route
                    path="accounts/:kind/:id/edit"
                    element={<SettingsV39AccountForm mode="edit" />}
                  />
                  <Route
                    path="accounts/requests/:id"
                    element={<SettingsV39ReviewRequest />}
                  />
                  <Route path="staff/new" element={<SettingsV39StaffForm mode="create" />} />
                  <Route
                    path="staff/:id/edit"
                    element={<SettingsV39StaffForm mode="edit" />}
                  />
                  <Route path="units/:id/edit" element={<SettingsV39EditUnit />} />
                </Route>
                {CUT_STANDALONE ? (
                  <>
                    <Route
                      path="home-v29"
                      element={<LegacyCutRedirect to={V31_HOME_HREF} />}
                    />
                    <Route
                      path="chat-v29"
                      element={<LegacyCutRedirect to={V31_HOME_HREF} />}
                    />
                    <Route
                      path="home-v30"
                      element={<LegacyCutRedirect to={V31_HOME_HREF} />}
                    />
                    <Route
                      path="home-v31"
                      element={<LegacyCutRedirect to={V31_HOME_HREF} />}
                    />
                  </>
                ) : (
                  <>
                    <Route path="home-v29" element={<DashboardV29Page />} />
                    <Route path="chat-v29" element={<ChatV29Page />} />
                    <Route path="home-v30" element={<DashboardV30Page />} />
                    <Route
                      path="home-v31"
                      element={
                        V31_HOME_HREF !== "/home-v31" ? (
                          <LegacyCutRedirect to={V31_HOME_HREF} />
                        ) : (
                          <DashboardV31Page />
                        )
                      }
                    />
                  </>
                )}
                <Route
                  path="process"
                  element={
                    CUT_STANDALONE ||
                    PROCESS_LIVE === "process-v34" ||
                    PROCESS_LIVE === "process-v33" ||
                    PROCESS_LIVE === "process-v32" ? (
                      <CutProcessRedirect />
                    ) : PROCESS_LIVE === "process-v28" ? (
                      <ProcessV28Page />
                    ) : PROCESS_LIVE === "process-v27" ? (
                      <ProcessV27Page />
                    ) : PROCESS_LIVE === "process-v26" ? (
                      <ProcessV26Page />
                    ) : PROCESS_LIVE === "process-v25" ? (
                      <ProcessV25Page />
                    ) : PROCESS_LIVE === "process-v20" ? (
                      <ProcessV20Page />
                    ) : (
                      <ProcessCanonicalRedirect />
                    )
                  }
                />
                {CUT_STANDALONE
                  ? [
                      "process-v16",
                      "process-v17",
                      "process-v18",
                      "process-v19",
                      "process-v20",
                      "process-v21",
                      "process-v22",
                      "process-v23",
                      "process-v24",
                      "process-v25",
                      "process-v26",
                      "process-v27",
                      "process-v28",
                      "process-v31",
                    ].map((path) => (
                      <Route
                        key={path}
                        path={path}
                        element={<LegacyCutRedirect to={V31_PROCESS_HREF} />}
                      />
                    ))
                  : (
                      <>
                        <Route path="process-v16" element={<ProcessV16Page />} />
                        <Route path="process-v17" element={<ProcessV17Page />} />
                        <Route path="process-v18" element={<ProcessV18Page />} />
                        <Route path="process-v19" element={<ProcessV19Page />} />
                        <Route path="process-v20" element={<ProcessV20Page />} />
                        <Route path="process-v21" element={<ProcessV21Page />} />
                        <Route path="process-v22" element={<ProcessV22Page />} />
                        <Route path="process-v23" element={<ProcessV23Page />} />
                        <Route path="process-v24" element={<ProcessV24Page />} />
                        <Route path="process-v25" element={<ProcessV25Page />} />
                        <Route path="process-v26" element={<ProcessV26Page />} />
                        <Route path="works-v26" element={<WorksV26Page />} />
                        <Route path="process-v27" element={<ProcessV27Page />} />
                        <Route path="works-v27" element={<WorksV27Page />} />
                        <Route path="process-v28" element={<ProcessV28Page />} />
                        <Route
                          path="process-v31"
                          element={
                            V31_PROCESS_HREF !== "/process-v31" ? (
                              <LegacyCutRedirect to={V31_PROCESS_HREF} />
                            ) : (
                              <ProcessV31Page />
                            )
                          }
                        />
                        <Route
                          path="works-v31"
                          element={
                            V31_WORKS_HREF !== "/works-v31" ? (
                              <LegacyCutRedirect to={V31_WORKS_HREF} />
                            ) : (
                              <WorksV28Page />
                            )
                          }
                        />
                        <Route path="works-v28" element={<WorksV28Page />} />
                      </>
                    )}
                {CUT_STANDALONE ? (
                  <>
                    <Route
                      path="works-v26"
                      element={<LegacyCutRedirect to={V31_WORKS_HREF} />}
                    />
                    <Route
                      path="works-v27"
                      element={<LegacyCutRedirect to={V31_WORKS_HREF} />}
                    />
                    <Route
                      path="works-v28"
                      element={<LegacyCutRedirect to={V31_WORKS_HREF} />}
                    />
                    <Route
                      path="works-v31"
                      element={<LegacyCutRedirect to={V31_WORKS_HREF} />}
                    />
                  </>
                ) : null}
                <Route
                  path="works"
                  element={
                    CUT_STANDALONE ||
                    PROCESS_LIVE === "process-v34" ||
                    PROCESS_LIVE === "process-v33" ||
                    PROCESS_LIVE === "process-v32" ||
                    PROCESS_LIVE === "process-v28" ? (
                      <CutWorksRedirect />
                    ) : PROCESS_LIVE === "process-v27" ? (
                      <WorksV27Page />
                    ) : PROCESS_LIVE === "process-v26" ? (
                      <WorksV26Page />
                    ) : (
                      <WorksPage />
                    )
                  }
                />
                <Route
                  path="idea"
                  element={<Navigate to={V31_WORKS_HREF} replace />}
                />
                {archivedProcessPreviews.map(({ path, Page }) => (
                  <Route
                    key={path}
                    path={path}
                    element={
                      CUT_STANDALONE ? (
                        <LegacyCutRedirect to={V31_PROCESS_HREF} />
                      ) : (
                        <Page />
                      )
                    }
                  />
                ))}
                <Route path="documents" element={<V26DocumentsSwitch />} />
                <Route
                  path="documents/:id"
                  element={<V26DocumentDetailSwitch />}
                />
                <Route path="apps" element={<AppsPage />} />
                <Route path="contacts" element={<ContactsPage />} />
                {CUT_STANDALONE ? (
                  <>
                    <Route
                      path="screener"
                      element={<LegacyCutRedirect to={V31_WORKS_HREF} />}
                    />
                    <Route
                      path="screener/drafts"
                      element={<LegacyCutRedirect to={V31_WORKS_HREF} />}
                    />
                    <Route
                      path="screener/history"
                      element={<LegacyCutRedirect to={V31_WORKS_HREF} />}
                    />
                    <Route
                      path="*"
                      element={<LegacyCutRedirect to={V31_HOME_HREF} />}
                    />
                  </>
                ) : (
                  <>
                    <Route
                      path="screener"
                      element={<Navigate to="/screener/drafts" replace />}
                    />
                    <Route path="screener/drafts" element={<ScreenerDraftsPage />} />
                    <Route
                      path="screener/history"
                      element={<ScreenerHistoryPage />}
                    />
                  </>
                )}
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AppStateProvider>
  );
}
