import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ClipboardList, Plus } from "lucide-react";

import {
  Button,
  DateInput,
  EmptyState,
  ErrorState,
  Select,
  Skeleton,
  StatusBadge,
  Table,
  Tabs,
} from "@/components/ui";
import { PageHeader } from "@/shell/Shell";
import { listRequests } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  requestTypeLabels,
  type EmployeeRequest,
  type Paginated,
  type RequestStatus,
  type RequestType,
} from "@/lib/types";

const PAGE_SIZE = 20;

const statusOptions: [RequestStatus, string][] = [
  ["draft", "Draft"],
  ["submitted", "Submitted"],
  ["approved", "Approved"],
  ["rejected", "Rejected"],
  ["returned", "Returned"],
];

const sortOptions: [string, string][] = [
  ["-created_at", "Newest first"],
  ["created_at", "Oldest first"],
  ["-updated_at", "Recently updated"],
  ["updated_at", "Least recently updated"],
  ["status", "Status A→Z"],
  ["-status", "Status Z→A"],
];

interface Filters {
  status: RequestStatus | "";
  type: RequestType | "";
  created_after: string;
  created_before: string;
  ordering: string;
  mine: boolean;
}

const defaultFilters: Filters = {
  status: "",
  type: "",
  created_after: "",
  created_before: "",
  ordering: "-created_at",
  mine: false,
};

export function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function RequestsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isApprover = user?.role === "manager" || user?.role === "hr";

  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paginated<EmployeeRequest> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const patchFilters = (patch: Partial<Filters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setData(
        await listRequests({
          status: filters.status || undefined,
          type: filters.type || undefined,
          // `created_before` is a created_at<=… datetime filter — include the
          // whole selected day by anchoring to its end.
          created_after: filters.created_after || undefined,
          created_before: filters.created_before
            ? `${filters.created_before}T23:59:59`
            : undefined,
          ordering: filters.ordering || undefined,
          owner: filters.mine ? user?.id : undefined,
          page,
          page_size: PAGE_SIZE,
        })
      );
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [filters, page, user?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = data ? Math.max(1, Math.ceil(data.count / PAGE_SIZE)) : 1;

  return (
    <div>
      <PageHeader
        title="My requests"
        description="Everything you've asked for — and what your team has asked of you."
        action={
          <Button
            size="sm"
            iconLeft={<Plus size={14} />}
            onClick={() => navigate("/requests/new")}
          >
            New request
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 mb-4">
        {isApprover && (
          <Tabs
            variant="pills"
            active={filters.mine ? "mine" : "team"}
            onChange={(key) => patchFilters({ mine: key === "mine" })}
            tabs={[
              { key: "team", label: "Team" },
              { key: "mine", label: "Mine" },
            ]}
          />
        )}
        <div className="w-40">
          <Select
            aria-label="Filter by status"
            value={filters.status}
            onChange={(e) =>
              patchFilters({ status: e.target.value as RequestStatus | "" })
            }
          >
            <option value="">All statuses</option>
            {statusOptions.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-44">
          <Select
            aria-label="Filter by type"
            value={filters.type}
            onChange={(e) =>
              patchFilters({ type: e.target.value as RequestType | "" })
            }
          >
            <option value="">All types</option>
            {Object.entries(requestTypeLabels).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-40">
          <DateInput
            aria-label="Created after"
            value={filters.created_after}
            onChange={(e) => patchFilters({ created_after: e.target.value })}
          />
        </div>
        <div className="w-40">
          <DateInput
            aria-label="Created before"
            value={filters.created_before}
            onChange={(e) => patchFilters({ created_before: e.target.value })}
          />
        </div>
        <div className="w-48 ml-auto">
          <Select
            aria-label="Sort"
            value={filters.ordering}
            onChange={(e) => patchFilters({ ordering: e.target.value })}
          >
            {sortOptions.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <ErrorState onRetry={load} />
      ) : !data || data.results.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={22} />}
          title="No requests found"
          description={
            filters.status || filters.type || filters.created_after || filters.created_before
              ? "Nothing matches these filters. Try widening them."
              : "You haven't made any requests yet."
          }
          action={
            <Button
              size="sm"
              iconLeft={<Plus size={14} />}
              onClick={() => navigate("/requests/new")}
            >
              New request
            </Button>
          }
        />
      ) : (
        <>
          <Table<EmployeeRequest>
            columns={[
              {
                key: "type",
                header: "Type",
                render: (r) => (
                  <span className="text-text-secondary">
                    {requestTypeLabels[r.type]}
                  </span>
                ),
              },
              {
                key: "title",
                header: "Title",
                render: (r) => (
                  <span className="font-medium">{r.title}</span>
                ),
              },
              {
                key: "owner",
                header: "Owner",
                render: (r) => (
                  <span className="text-text-muted">
                    {r.owner?.name ?? "—"}
                  </span>
                ),
              },
              {
                key: "status",
                header: "Status",
                align: "center",
                render: (r) => <StatusBadge status={r.status} />,
              },
              {
                key: "created_at",
                header: "Created",
                align: "right",
                render: (r) => (
                  <span className="text-text-muted">
                    {formatDate(r.created_at)}
                  </span>
                ),
              },
            ]}
            data={data.results}
            onRowClick={(r) => navigate(`/requests/${r.id}`)}
          />

          {/* Pagination */}
          <div className="flex items-center justify-between gap-3 mt-4">
            <p className="text-caption">
              Page {page} of {totalPages} · {data.count}{" "}
              {data.count === 1 ? "request" : "requests"}
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={!data.previous}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={!data.next}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
