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
import DashboardPage from "@/pages/DashboardPage";
import DesignSystem from "@/pages/DesignSystem";
import LoginPage from "@/pages/LoginPage";
import PlaceholderPage from "@/pages/PlaceholderPage";
import ProfilePage from "@/pages/ProfilePage";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/profile": "My profile",
  "/requests": "My requests",
  "/requests/new": "New request",
  "/approvals": "Approvals",
  "/timesheets": "My timesheets",
  "/timesheets/new": "Log time",
  "/timesheets/review": "Timesheet review",
  "/design-system": "Design system",
};

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
      pageTitle={pageTitles[location.pathname] ?? "SAWA"}
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
                <Route
                  path="/requests"
                  element={<PlaceholderPage title="My requests" />}
                />
                <Route
                  path="/requests/new"
                  element={<PlaceholderPage title="New request" />}
                />
                <Route
                  path="/approvals"
                  element={<PlaceholderPage title="Approvals" />}
                />
                <Route
                  path="/timesheets"
                  element={<PlaceholderPage title="My timesheets" />}
                />
                <Route
                  path="/timesheets/new"
                  element={<PlaceholderPage title="Log time" />}
                />
                <Route
                  path="/timesheets/review"
                  element={<PlaceholderPage title="Timesheet review" />}
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
