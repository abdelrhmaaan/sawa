import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router";
import { Compass } from "lucide-react";

import { ToastProvider } from "@/components/overlays";
import { Button, EmptyState, LoadingState } from "@/components/ui";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Shell } from "@/shell/Shell";
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

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/profile": "My profile",
  "/requests": "My requests",
  "/requests/new": "New request",
  "/approvals": "Approvals",
  "/timesheets": "My timesheets",
  "/timesheets/review": "Timesheet review",
  "/design-system": "Design system",
};

// Titles for dynamic paths (e.g. /requests/12, /requests/12/edit).
function resolvePageTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname];
  if (/^\/requests\/\d+\/edit$/.test(pathname)) return "Edit request";
  if (/^\/requests\/\d+$/.test(pathname)) return "Request";
  return "SAWA";
}

function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    // Full-page loading — never flash the login screen while restoring a session.
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <LoadingState message="Signing you in…" />
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
      pageTitle={resolvePageTitle(location.pathname)}
    >
      <Outlet />
    </Shell>
  );
}

function NotFound() {
  const location = useLocation();
  return (
    <EmptyState
      icon={<Compass size={22} />}
      title="Page not found"
      description={`Nothing lives at ${location.pathname}.`}
      action={<Button size="sm" onClick={() => window.history.back()}>Go back</Button>}
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
