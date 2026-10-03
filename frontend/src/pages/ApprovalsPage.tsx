import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { CheckSquare } from "lucide-react";

import {
  Button,
  EmptyState,
  ErrorState,
  Skeleton,
  Table,
} from "@/components/ui";
import { PageHeader } from "@/shell/Shell";
import { listRequests } from "@/lib/api";
import type { EmployeeRequest, Paginated } from "@/lib/types";
import { requestTypeLabels } from "@/lib/types";
import { formatDate } from "./RequestsPage";

const PAGE_SIZE = 20;

export default function ApprovalsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paginated<EmployeeRequest> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setData(
        await listRequests({
          pending_my_action: true,
          page,
          page_size: PAGE_SIZE,
        })
      );
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = data ? Math.max(1, Math.ceil(data.count / PAGE_SIZE)) : 1;

  return (
    <div>
      <PageHeader
        title="Approvals"
        description="Submitted requests waiting for your decision."
      />

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
          icon={<CheckSquare size={22} />}
          title="All caught up"
          description="There are no requests waiting for your decision."
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
                render: (r) => <span className="font-medium">{r.title}</span>,
              },
              {
                key: "owner",
                header: "Owner",
                render: (r) => (
                  <span className="text-text-muted">{r.owner?.name ?? "—"}</span>
                ),
              },
              {
                key: "submitted_at",
                header: "Submitted",
                align: "right",
                render: (r) => (
                  <span className="text-text-muted">
                    {formatDate(r.submitted_at)}
                  </span>
                ),
              },
            ]}
            data={data.results}
            onRowClick={(r) => navigate(`/requests/${r.id}`)}
          />

          <div className="flex items-center justify-between gap-3 mt-4">
            <p className="text-caption">
              Page {page} of {totalPages} · {data.count} pending
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
