import { useCallback, useEffect, useState } from "react";
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
import type { DashboardData } from "@/lib/types";

const requestStatusLabels: [string, string][] = [
  ["draft", "Draft"],
  ["submitted", "Submitted"],
  ["approved", "Approved"],
  ["rejected", "Rejected"],
  ["returned", "Returned"],
];

const entryStatusLabels: [string, string][] = [
  ["draft", "Draft"],
  ["submitted", "Submitted"],
  ["approved", "Approved"],
  ["returned", "Returned"],
];

function StatusBreakdown({ title, counts, labels }: {
  title: string;
  counts: Record<string, number>;
  labels: [string, string][];
}) {
  return (
    <Card padding="sm">
      <p className="text-overline text-text-muted mb-3 px-1 pt-1">{title}</p>
      <dl className="space-y-2 px-1 pb-1">
        {labels.map(([key, label]) => (
          <div key={key} className="flex items-center justify-between">
            <dt className="text-body-sm text-text-secondary">{label}</dt>
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
        <PageHeader title="Dashboard" />
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
        <PageHeader title="Dashboard" />
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
        title={`Welcome back, ${user?.first_name ?? ""}`}
        description="Your requests and time at a glance."
      />

      {allZero && (
        <div className="mb-6">
          <EmptyState
            icon={<ClipboardList size={22} />}
            title="Nothing here yet"
            description="Create your first request or log your first hours to see them here."
          />
        </div>
      )}

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2 mb-8">
        <Button size="sm" iconLeft={<Plus size={14} />} onClick={() => navigate("/requests/new")}>
          New request
        </Button>
        <Button size="sm" variant="secondary" iconLeft={<Clock size={14} />} onClick={() => navigate("/timesheets?new=1")}>
          Log time
        </Button>
        {isApprover && (
          <Button size="sm" variant="tertiary" iconLeft={<CheckSquare size={14} />} onClick={() => navigate("/approvals")}>
            Approvals
          </Button>
        )}
      </div>

      {/* Me */}
      <SectionTitle>Me</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatCard
          label="Hours this week"
          value={data.my_hours_this_week}
          icon={<Clock size={17} />}
        />
        <StatCard
          label="My requests"
          value={myRequestTotal}
          delta={`${data.my_requests.submitted} awaiting decision`}
          icon={<ClipboardList size={17} />}
        />
        <StatCard
          label="My time entries"
          value={myEntryTotal}
          delta={`${data.my_entries.submitted} awaiting review`}
          icon={<Clock size={17} />}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <StatusBreakdown title="Requests by status" counts={data.my_requests} labels={requestStatusLabels} />
        <StatusBreakdown title="Time entries by status" counts={data.my_entries} labels={entryStatusLabels} />
      </div>

      {/* Team (manager) */}
      {data.team && (
        <>
          <SectionTitle>My team</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <StatCard
              label="Requests to review"
              value={data.team.pending_requests}
              icon={<CheckSquare size={17} />}
            />
            <StatCard
              label="Timesheets to review"
              value={data.team.pending_timesheets}
              icon={<ListChecks size={17} />}
            />
            <StatCard
              label="Team hours this week"
              value={data.team.team_hours_this_week}
              icon={<Clock size={17} />}
            />
          </div>
        </>
      )}

      {/* Organization (HR) */}
      {data.org && (
        <>
          <SectionTitle>Organization</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              label="Requests to review"
              value={data.org.pending_requests}
              icon={<CheckSquare size={17} />}
            />
            <StatCard
              label="Timesheets to review"
              value={data.org.pending_timesheets}
              icon={<ListChecks size={17} />}
            />
            <StatCard
              label="Org hours this week"
              value={data.org.hours_this_week}
              icon={<Clock size={17} />}
            />
            <StatCard
              label="Users"
              value={Object.values(data.org.users_by_role).reduce((a, b) => a + b, 0)}
              delta={`${data.org.users_by_role.employee} employees · ${data.org.users_by_role.manager} managers · ${data.org.users_by_role.hr} HR`}
              icon={<Users size={17} />}
            />
          </div>
        </>
      )}
    </div>
  );
}
