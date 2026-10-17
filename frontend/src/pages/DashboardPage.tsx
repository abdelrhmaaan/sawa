import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import {
  CheckSquare,
  Clock,
  ClipboardList,
  ListChecks,
  Plus,
  Users,
} from "lucide-react";

import {
  Button,
  Card,
  CardHeader,
  EmptyState,
  ErrorState,
  Skeleton,
  StatCard,
} from "@/components/ui";
import { PageHeader } from "@/shell/Shell";
import { getDashboard } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { DashboardData, EntryStatus, RequestStatus } from "@/lib/types";

const requestStatusKeys: RequestStatus[] = ["draft", "submitted", "approved", "rejected", "returned"];
const entryStatusKeys: EntryStatus[] = ["draft", "submitted", "approved", "returned"];

function StatusBreakdown({ title, counts, keys }: {
  title: string;
  counts: Record<string, number>;
  keys: (RequestStatus | EntryStatus)[];
}) {
  const { t } = useTranslation();
  return (
    <Card padding="sm">
      <p className="text-overline text-text-muted mb-3 px-1 pt-1">{title}</p>
      <dl className="space-y-2 px-1 pb-1">
        {keys.map((key) => (
          <div key={key} className="flex items-center justify-between">
            <dt className="text-body-sm text-text-secondary">{t(`status.${key}`)}</dt>
            <dd className="text-body-sm font-semibold text-text-primary tabular-nums">
              {counts[key] ?? 0}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <h2 className="text-h3 text-text-primary mb-3">{children}</h2>;
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setData(await getDashboard());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div>
        <PageHeader title={t("dashboard.title")} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div>
        <PageHeader title={t("dashboard.title")} />
        <ErrorState onRetry={load} />
      </div>
    );
  }

  const myRequestTotal = Object.values(data.my_requests).reduce((a, b) => a + b, 0);
  const myEntryTotal = Object.values(data.my_entries).reduce((a, b) => a + b, 0);
  const allZero =
    myRequestTotal === 0 && myEntryTotal === 0 && data.my_hours_this_week === "0.00";
  const isApprover = user?.role === "manager" || user?.role === "hr";

  return (
    <div>
      <PageHeader
        title={t("dashboard.welcome", { name: user?.first_name ?? "" })}
        description={t("dashboard.subtitle")}
      />

      {allZero && (
        <div className="mb-6">
          <EmptyState
            icon={<ClipboardList size={22} />}
            title={t("dashboard.emptyTitle")}
            description={t("dashboard.emptyDescription")}
          />
        </div>
      )}

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2 mb-8">
        <Button size="sm" iconLeft={<Plus size={14} />} onClick={() => navigate("/requests/new")}>
          {t("common.newRequest")}
        </Button>
        <Button size="sm" variant="secondary" iconLeft={<Clock size={14} />} onClick={() => navigate("/timesheets?new=1")}>
          {t("common.logTime")}
        </Button>
        {isApprover && (
          <Button size="sm" variant="tertiary" iconLeft={<CheckSquare size={14} />} onClick={() => navigate("/approvals")}>
            {t("nav.approvals")}
          </Button>
        )}
      </div>

      {/* Me */}
      <SectionTitle>{t("dashboard.me")}</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatCard
          label={t("dashboard.hoursThisWeek")}
          value={data.my_hours_this_week}
          icon={<Clock size={17} />}
        />
        <StatCard
          label={t("dashboard.myRequests")}
          value={myRequestTotal}
          delta={t("dashboard.awaitingDecision", { count: data.my_requests.submitted })}
          icon={<ClipboardList size={17} />}
        />
        <StatCard
          label={t("dashboard.myTimeEntries")}
          value={myEntryTotal}
          delta={t("dashboard.awaitingReview", { count: data.my_entries.submitted })}
          icon={<Clock size={17} />}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <StatusBreakdown title={t("dashboard.requestsByStatus")} counts={data.my_requests} keys={requestStatusKeys} />
        <StatusBreakdown title={t("dashboard.entriesByStatus")} counts={data.my_entries} keys={entryStatusKeys} />
      </div>

      {/* Team (manager) */}
      {data.team && (
        <>
          <SectionTitle>{t("dashboard.myTeam")}</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <StatCard
              label={t("dashboard.requestsToReview")}
              value={data.team.pending_requests}
              icon={<CheckSquare size={17} />}
            />
            <StatCard
              label={t("dashboard.timesheetsToReview")}
              value={data.team.pending_timesheets}
              icon={<ListChecks size={17} />}
            />
            <StatCard
              label={t("dashboard.teamHoursThisWeek")}
              value={data.team.team_hours_this_week}
              icon={<Clock size={17} />}
            />
          </div>
        </>
      )}

      {/* Organization (HR) */}
      {data.org && (
        <>
          <SectionTitle>{t("dashboard.organization")}</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              label={t("dashboard.requestsToReview")}
              value={data.org.pending_requests}
              icon={<CheckSquare size={17} />}
            />
            <StatCard
              label={t("dashboard.timesheetsToReview")}
              value={data.org.pending_timesheets}
              icon={<ListChecks size={17} />}
            />
            <StatCard
              label={t("dashboard.orgHoursThisWeek")}
              value={data.org.hours_this_week}
              icon={<Clock size={17} />}
            />
            <StatCard
              label={t("dashboard.users")}
              value={Object.values(data.org.users_by_role).reduce((a, b) => a + b, 0)}
              delta={t("dashboard.usersDelta", {
                employees: data.org.users_by_role.employee,
                managers: data.org.users_by_role.manager,
                hr: data.org.users_by_role.hr,
              })}
              icon={<Users size={17} />}
            />
          </div>
        </>
      )}
    </div>
  );
}
