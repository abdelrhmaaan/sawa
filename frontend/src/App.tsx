import { useState } from "react";
import { Shell, type Role } from "@/shell/Shell";
import { ToastProvider } from "@/components/overlays";
import DesignSystem from "@/pages/DesignSystem";

const users = {
  employee: { name: "Layla Hassan",   role: "employee" as Role, department: "Engineering" },
  manager:  { name: "Omar Khalid",    role: "manager"  as Role, department: "Engineering" },
  hr:       { name: "Nour Saleh",     role: "hr"       as Role, department: "Human Resources" },
};

const pageTitles: Record<string, string> = {
  dashboard:  "Dashboard",
  requests:   "Requests",
  timesheets: "Timesheets",
  employees:  "Employees",
  reports:    "Reports",
  settings:   "Settings",
  profile:    "My Profile",
  design:     "Design System",
};

export default function App() {
  const [role, setRole]       = useState<Role>("employee");
  const [activeKey, setActive] = useState("design");

  const user = { ...users[role], role };

  const handleRoleChange = (r: Role) => {
    setRole(r);
    setActive("design");
  };

  return (
    <ToastProvider>
      <Shell
        role={role}
        user={user}
        onRoleChange={handleRoleChange}
        activeKey={activeKey}
        onNavigate={setActive}
        pageTitle={pageTitles[activeKey] ?? "SAWA"}
      >
        {activeKey === "design" ? (
          <DesignSystem />
        ) : (
          // Placeholder for future product screens
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-12 h-12 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center mb-4">
              <span className="text-xl">🚧</span>
            </div>
            <h2 className="text-h2 text-text-primary mb-2">{pageTitles[activeKey] ?? activeKey}</h2>
            <p className="text-body-sm text-text-secondary max-w-sm">
              This screen will be built in the next phase. The shell, navigation, and design system are ready.
            </p>
          </div>
        )}
      </Shell>
    </ToastProvider>
  );
}
