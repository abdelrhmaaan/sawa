import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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
import { formatDate } from "@/lib/format";
import {
  type EmployeeRequest,
  type Paginated,
  type RequestStatus,
  type RequestType,
} from "@/lib/types";

export { formatDate };

const PAGE_SIZE = 20;

const statusValues: RequestStatus[] = [
  "draft",
  "submitted",
  "approved",
  "rejected",
  "returned",
];

const typeValues: RequestType[] = [
  "leave",
  "equipment",
  "wfh",
  "hr_service",
  "general",
];

const sortValues = [
  "-created_at",
  "created_at",
  "-updated_at",
  "updated_at",
  "status",
  "-status",
] as const;

type RequestsKey = `requests.${keyof (typeof import("@/i18n/locales/en.json"))["requests"]}`;

const sortKeys: Record<(typeof sortValues)[number], RequestsKey> = {
  "-created_at": "requests.sortNewest",
  created_at: "requests.sortOldest",
  "-updated_at": "requests.sortUpdated",
  updated_at: "requests.sortStale",
  status: "requests.sortStatusAsc",
  "-status": "requests.sortStatusDesc",
};

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

export default function RequestsPage() {
  const { t } = useTranslation();
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
        title={t("requests.title")}
        description={t("requests.description")}
        action={
          <Button
            size="sm"
            iconLeft={<Plus size={14} />}
            onClick={() => navigate("/requests/new")}
          >
            {t("common.newRequest")}
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
              { key: "team", label: t("requests.team") },
              { key: "mine", label: t("requests.mine") },
            ]}
          />
        )}
        <div className="w-40">
          <Select
            aria-label={t("requests.filterStatus")}
            value={filters.status}
            onChange={(e) =>
              patchFilters({ status: e.target.value as RequestStatus | "" })
            }
          >
            <option value="">{t("requests.allStatuses")}</option>
            {statusValues.map((v) => (
              <option key={v} value={v}>
                {t(`status.${v}`)}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-44">
          <Select
            aria-label={t("requests.filterType")}
            value={filters.type}
            onChange={(e) =>
              patchFilters({ type: e.target.value as RequestType | "" })
            }
          >
            <option value="">{t("requests.allTypes")}</option>
            {typeValues.map((v) => (
              <option key={v} value={v}>
                {t(`requestType.${v}`)}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-40">
          <DateInput
            aria-label={t("requests.createdAfter")}
            value={filters.created_after}
            onChange={(e) => patchFilters({ created_after: e.target.value })}
          />
        </div>
        <div className="w-40">
          <DateInput
            aria-label={t("requests.createdBefore")}
            value={filters.created_before}
            onChange={(e) => patchFilters({ created_before: e.target.value })}
          />
        </div>
        <div className="w-48 ms-auto">
          <Select
            aria-label={t("requests.sort")}
            value={filters.ordering}
            onChange={(e) => patchFilters({ ordering: e.target.value })}
          >
            {sortValues.map((v) => (
              <option key={v} value={v}>
                {t(sortKeys[v])}
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
          title={t("requests.emptyTitle")}
          description={
            filters.status || filters.type || filters.created_after || filters.created_before
              ? t("requests.emptyFiltered")
              : t("requests.emptyMine")
          }
          action={
            <Button
              size="sm"
              iconLeft={<Plus size={14} />}
              onClick={() => navigate("/requests/new")}
            >
              {t("common.newRequest")}
            </Button>
          }
        />
      ) : (
        <>
          <Table<EmployeeRequest>
            columns={[
              {
                key: "type",
                header: t("requests.colType"),
                render: (r) => (
                  <span className="text-text-secondary">
                    {t(`requestType.${r.type}`)}
                  </span>
                ),
              },
              {
                key: "title",
                header: t("requests.colTitle"),
                render: (r) => (
                  <span className="font-medium" dir="auto">{r.title}</span>
                ),
              },
              {
                key: "owner",
                header: t("requests.colOwner"),
                render: (r) => (
                  <span className="text-text-muted" dir="auto">
                    {r.owner?.name ?? "—"}
                  </span>
                ),
              },
              {
                key: "status",
                header: t("requests.colStatus"),
                align: "center",
                render: (r) => <StatusBadge status={r.status} />,
              },
              {
                key: "created_at",
                header: t("requests.colCreated"),
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
              {t("pagination.pageOf", { page, pages: totalPages })} ·{" "}
              {t("pagination.requests", { count: data.count })}
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
