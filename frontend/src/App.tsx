import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router";
import { useTranslation } from "react-i18next";
import { Compass } from "lucide-react";

import { ToastProvider } from "@/components/overlays";
import { Button, EmptyState, LoadingState } from "@/components/ui";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Shell } from "@/shell/Shell";
import type { I18nKey } from "@/i18n";
import ApprovalsPage from "@/pages/ApprovalsPage";
import DashboardPage from "@/pages/DashboardPage";
import DesignSystem from "@/pages/DesignSystem";
import LoginPage from "@/pages/LoginPage";
import ProfilePage from "@/pages/ProfilePage";
import RequestDetailPage from "@/pages/RequestDetailPage";
import RequestFormPage from "@/pages/RequestFormPage";
import RequestsPage from "@/pages/RequestsPage";
import TimesheetReviewPage from "@/pages/TimesheetReviewPage";
import TimesheetsPage from "@/pages/TimesheetsPage";

const pageTitleKeys: Record<string, I18nKey> = {
  "/": "nav.dashboard",
  "/profile": "nav.myProfile",
  "/requests": "nav.myRequests",
  "/requests/new": "requests.newTitle",
  "/approvals": "nav.approvals",
  "/timesheets": "nav.myTimesheets",
  "/timesheets/review": "nav.timesheetReview",
  "/design-system": "nav.designSystem",
};

// Title keys for dynamic paths (e.g. /requests/12, /requests/12/edit).
function resolvePageTitleKey(pathname: string): I18nKey {
  if (pageTitleKeys[pathname]) return pageTitleKeys[pathname];
  if (/^\/requests\/\d+\/edit$/.test(pathname)) return "requests.editTitle";
  if (/^\/requests\/\d+$/.test(pathname)) return "requests.detailTitle";
  return "common.appName";
}

function RequireAuth() {
  const { t } = useTranslation();
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    // Full-page loading — never flash the login screen while restoring a session.
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <LoadingState message={t("auth.signingIn")} />
      </div>
    );
  }
  if (status === "anonymous") {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <Outlet />;
}

function ShellLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  if (!user) return null;

  return (
    <Shell
      user={{
        name: `${user.first_name} ${user.last_name}`.trim() || user.email,
        role: user.role,
        department: user.department,
      }}
      onLogout={logout}
      pageTitle={resolvePageTitleKey(location.pathname)}
    >
      <Outlet />
    </Shell>
  );
}

function NotFound() {
  const { t } = useTranslation();
  const location = useLocation();
  return (
    <EmptyState
      icon={<Compass size={22} />}
      title={t("errors.notFoundTitle")}
      description={t("errors.notFoundDescription", { path: location.pathname })}
      action={<Button size="sm" onClick={() => window.history.back()}>{t("common.goBack")}</Button>}
    />
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<RequireAuth />}>
              <Route element={<ShellLayout />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/design-system" element={<DesignSystem />} />
                <Route path="/requests" element={<RequestsPage />} />
                <Route path="/requests/new" element={<RequestFormPage />} />
                <Route path="/requests/:id" element={<RequestDetailPage />} />
                <Route
                  path="/requests/:id/edit"
                  element={<RequestFormPage />}
                />
                <Route path="/approvals" element={<ApprovalsPage />} />
                <Route path="/timesheets" element={<TimesheetsPage />} />
                <Route
                  path="/timesheets/review"
                  element={<TimesheetReviewPage />}
                />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Route>
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
