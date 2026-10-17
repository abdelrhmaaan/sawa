import { useEffect, useState, type ReactNode } from "react";
import { NavLink, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  ClipboardList,
  Clock,
  CheckSquare,
  ListChecks,
  User,
  ChevronDown,
  Menu,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, Badge } from "@/components/ui";
import { Dropdown } from "@/components/overlays";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import type { I18nKey } from "@/i18n";
import { NotificationsBell } from "./NotificationsBell";
import type { Role } from "@/lib/types";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type NavKey = `nav.${keyof (typeof import("@/i18n/locales/en.json"))["nav"]}`;

interface NavItem {
  to: string;
  label: NavKey;
  icon: ReactNode;
  end?: boolean;
}

export interface ShellUser {
  name: string;
  role: Role;
  department?: string;
  avatarSrc?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// NAV CONFIG — role-aware: everyone gets the base items; manager + hr get the
// two review queues. Profile lives in the user menu, not the nav.
// ─────────────────────────────────────────────────────────────────────────────

const baseNav: NavItem[] = [
  { to: "/", label: "nav.dashboard", icon: <LayoutDashboard size={17} />, end: true },
  { to: "/requests", label: "nav.myRequests", icon: <ClipboardList size={17} /> },
  { to: "/timesheets", label: "nav.myTimesheets", icon: <Clock size={17} /> },
];

const approverNav: NavItem[] = [
  { to: "/approvals", label: "nav.approvals", icon: <CheckSquare size={17} /> },
  { to: "/timesheets/review", label: "nav.timesheetReview", icon: <ListChecks size={17} /> },
];

const navConfig: Record<Role, NavItem[]> = {
  employee: baseNav,
  manager: [...baseNav, ...approverNav],
  hr: [...baseNav, ...approverNav],
};



// ─────────────────────────────────────────────────────────────────────────────
// LOGO
// ─────────────────────────────────────────────────────────────────────────────

export function SawaLogo({ collapsed }: { collapsed?: boolean }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center shrink-0 shadow-sm">
        <span className="text-sm font-extrabold text-white tracking-tight">S</span>
      </div>
      {!collapsed && (
        <div>
          <span className="text-base font-extrabold text-text-primary tracking-tight leading-none">SAWA</span>
          <p className="text-[10px] text-text-muted leading-none mt-0.5">{t("common.tagline")}</p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────────────────────────────────────

interface SidebarProps {
  user: ShellUser;
  onLogout: () => void;
  collapsed?: boolean;
  onNavigate?: () => void;
}

function SidebarNav({ user, onLogout, collapsed, onNavigate }: SidebarProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const items = navConfig[user.role];

  return (
    <nav className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn("h-14 flex items-center border-b border-border shrink-0", collapsed ? "px-3 justify-center" : "px-4")}>
        <SawaLogo collapsed={collapsed} />
      </div>

      {/* Nav items */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {!collapsed && (
          <p className="text-overline text-text-muted px-2 mb-2 mt-1">{t("nav.navigation")}</p>
        )}
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            title={collapsed ? t(item.label) : undefined}
            className={({ isActive }) =>
              cn(
                "w-full flex items-center gap-2.5 rounded-lg transition-all duration-150 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 group",
                collapsed ? "h-9 justify-center px-0" : "h-9 px-2.5",
                isActive
                  ? "bg-brand-50 text-brand-700"
                  : "text-text-secondary hover:bg-surface-alt hover:text-text-primary"
              )
            }
          >
            {({ isActive }) => (
              <>
                <span className={cn(
                  "shrink-0 transition-colors",
                  isActive ? "text-brand-600" : "text-text-muted group-hover:text-text-secondary"
                )}>
                  {item.icon}
                </span>
                {!collapsed && <span className="flex-1 text-start">{t(item.label)}</span>}
              </>
            )}
          </NavLink>
        ))}
      </div>

      {/* Bottom: user menu */}
      <div className={cn("border-t border-border py-3 shrink-0", collapsed ? "px-2" : "px-3")}>
        {!collapsed && (
          <Dropdown
            align="right"
            trigger={
              <button className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-surface-alt transition-colors duration-150 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600">
                <Avatar name={user.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-body-sm font-semibold text-text-primary truncate leading-tight" dir="auto">{user.name}</p>
                  <p className="text-caption truncate">{t(`role.${user.role}`)}</p>
                </div>
                <ChevronDown size={13} className="text-text-muted shrink-0" />
              </button>
            }
            items={[
              { key: "profile", label: t("nav.myProfile"), icon: <User size={14} /> },
              { key: "divider-1", label: "", divider: true },
              { key: "logout", label: t("nav.signOut"), icon: <LogOut size={14} />, destructive: true },
            ]}
            onSelect={(key) => {
              if (key === "profile") navigate("/profile");
              if (key === "logout") onLogout();
            }}
          />
        )}
        {collapsed && (
          <div className="flex justify-center">
            <Avatar name={user.name} size="sm" />
          </div>
        )}
      </div>
    </nav>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOPBAR
// ─────────────────────────────────────────────────────────────────────────────

interface TopbarProps {
  title: string;
  user: ShellUser;
  onMenuToggle?: () => void;
  showMenuButton?: boolean;
  actions?: ReactNode;
}

function Topbar({ title, user, onMenuToggle, showMenuButton, actions }: TopbarProps) {
  const { t } = useTranslation();
  return (
    <header className="h-14 border-b border-border bg-white flex items-center px-5 gap-4 shrink-0">
      {showMenuButton && (
        <button
          onClick={onMenuToggle}
          className="text-text-muted hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 rounded-md p-1 -ms-1 lg:hidden"
          aria-label={t("nav.toggleSidebar")}
        >
          <Menu size={20} />
        </button>
      )}

      {/* Page title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-h3 text-text-primary truncate">{title}</h1>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2 shrink-0">
        {actions}
        <LanguageSwitch />
        <NotificationsBell />
        <span className="hidden sm:inline-flex">
          <Badge variant="brand" size="sm">{t(`role.${user.role}`)}</Badge>
        </span>
        <Avatar name={user.name} size="sm" />
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE HEADER (reusable heading inside content area)
// ─────────────────────────────────────────────────────────────────────────────

export function PageHeader({
  title,
  description,
  action,
  breadcrumb,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  breadcrumb?: { label: string; key?: string }[];
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        {breadcrumb && breadcrumb.length > 0 && (
          <div className="flex items-center gap-1 mb-1.5">
            {breadcrumb.map((b, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight size={12} className="text-text-muted rtl:-scale-x-100" />}
                <span className={cn(
                  "text-small",
                  i < breadcrumb.length - 1 ? "text-text-muted" : "text-text-secondary font-medium"
                )}>
                  {b.label}
                </span>
              </span>
            ))}
          </div>
        )}
        <h1 className="text-h1 text-text-primary" dir="auto">{title}</h1>
        {description && <p className="text-body text-text-secondary mt-1">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SHELL
// ─────────────────────────────────────────────────────────────────────────────

interface ShellProps {
  user: ShellUser;
  onLogout: () => void;
  /** Translation key resolved by App from the current route. */
  pageTitle: I18nKey;
  topbarActions?: ReactNode;
  children: ReactNode;
}

export function Shell({ user, onLogout, pageTitle, topbarActions, children }: ShellProps) {
  const { t } = useTranslation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const resolvedTitle = t(pageTitle);

  useEffect(() => {
    document.title = `${resolvedTitle} · SAWA`;
  }, [resolvedTitle]);

  const items = navConfig[user.role];

  return (
    <div className="flex h-screen overflow-hidden bg-page font-sans">
      {/* ── Desktop sidebar ── */}
      <aside
        className={cn(
          "hidden lg:flex flex-col border-e border-border bg-white shrink-0 transition-all duration-200 relative",
          sidebarCollapsed ? "w-14" : "w-56"
        )}
      >
        <SidebarNav
          user={user}
          onLogout={onLogout}
          collapsed={sidebarCollapsed}
        />
        {/* Collapse toggle */}
        <button
          onClick={() => setSidebarCollapsed((v) => !v)}
          className="absolute bottom-16 -end-2.5 border border-border bg-white rounded-full w-5 h-5 flex items-center justify-center shadow-sm text-text-muted hover:text-text-primary transition-colors duration-150 z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
          aria-label={t(sidebarCollapsed ? "nav.expandSidebar" : "nav.collapseSidebar")}
        >
          <ChevronRight size={12} className={cn("transition-transform duration-200 rtl:-scale-x-100", sidebarCollapsed ? "" : "rotate-180")} />
        </button>
      </aside>

      {/* ── Mobile sidebar overlay ── */}
      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <aside className="relative z-10 w-64 bg-white border-e border-border flex flex-col">
            <SidebarNav
              user={user}
              onLogout={onLogout}
              onNavigate={() => setMobileSidebarOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* ── Main area ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar
          title={resolvedTitle}
          user={user}
          onMenuToggle={() => setMobileSidebarOpen((v) => !v)}
          showMenuButton
          actions={topbarActions}
        />

        {/* ── Content ── */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1200px] mx-auto px-5 py-6 md:px-8">
            {children}
          </div>
        </main>

        {/* ── Mobile bottom nav ── */}
        <nav className="lg:hidden border-t border-border bg-white flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom,0px)] shrink-0">
          {items.slice(0, 4).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-0.5 py-2 px-3 min-w-[52px] rounded-lg transition-colors duration-150 focus-visible:outline-none",
                  isActive ? "text-brand-600" : "text-text-muted"
                )
              }
            >
              <span className="relative">{item.icon}</span>
              <span className="text-[10px] font-semibold">{t(item.label)}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
