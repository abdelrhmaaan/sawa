import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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
import { formatDate } from "@/lib/format";

const PAGE_SIZE = 20;

export default function ApprovalsPage() {
  const { t } = useTranslation();
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
        title={t("approvals.title")}
        description={t("approvals.description")}
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
          title={t("approvals.emptyTitle")}
          description={t("approvals.emptyDescription")}
        />
      ) : (
        <>
          <Table<EmployeeRequest>
            columns={[
              {
                key: "type",
                header: t("approvals.colType"),
                render: (r) => (
                  <span className="text-text-secondary">
                    {t(`requestType.${r.type}`)}
                  </span>
                ),
              },
              {
                key: "title",
                header: t("approvals.colTitle"),
                render: (r) => <span className="font-medium" dir="auto">{r.title}</span>,
              },
              {
                key: "owner",
                header: t("approvals.colOwner"),
                render: (r) => (
                  <span className="text-text-muted" dir="auto">{r.owner?.name ?? "—"}</span>
                ),
              },
              {
                key: "submitted_at",
                header: t("approvals.colSubmitted"),
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
              {t("pagination.pageOf", { page, pages: totalPages })} ·{" "}
              {t("pagination.pending", { count: data.count })}
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={!data.previous}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                {t("common.previous")}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={!data.next}
                onClick={() => setPage((p) => p + 1)}
              >
                {t("common.next")}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
