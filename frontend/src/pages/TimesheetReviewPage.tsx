import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, ListChecks, RotateCcw } from "lucide-react";

import {
  Button,
  EmptyState,
  ErrorState,
  Skeleton,
  Table,
} from "@/components/ui";
import { useToast } from "@/components/overlays";
import { DecisionDialog } from "@/components/DecisionDialog";
import { PageHeader } from "@/shell/Shell";
import {
  ApiError,
  decideTimesheetEntry,
  listTimesheets,
} from "@/lib/api";
import type { TimesheetEntry, TimesheetList } from "@/lib/types";
import { formatHours, formatWeekday } from "@/lib/format";

const PAGE_SIZE = 20;

function fmtTime(t: string) {
  return t.slice(0, 5);
}

function fmtDay(iso: string) {
  return formatWeekday(iso);
}

export default function TimesheetReviewPage() {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [page, setPage] = useState(1);
  const [data, setData] = useState<TimesheetList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [returning, setReturning] = useState<TimesheetEntry | null>(null);
  const [deciding, setDeciding] = useState(false);
  const [approvingId, setApprovingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setData(
        await listTimesheets({
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

  const onApprove = async (e: TimesheetEntry) => {
    if (approvingId !== null) return;
    setApprovingId(e.id);
    try {
      await decideTimesheetEntry(e.id, "approve");
      toast({ variant: "success", title: t("review.approvedToast") });
      await load();
    } catch (err) {
      toast({
        variant: "error",
        title: t("review.approveError"),
        description:
          err instanceof ApiError
            ? err.detail ?? err.fieldErrors?.detail?.[0]
            : undefined,
      });
    } finally {
      setApprovingId(null);
    }
  };

  const onReturn = async (comment: string) => {
    if (!returning) return;
    setDeciding(true);
    try {
      await decideTimesheetEntry(returning.id, "return", comment);
      toast({ variant: "success", title: t("review.returnedToast") });
      await load();
    } finally {
      setDeciding(false);
    }
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.count / PAGE_SIZE)) : 1;

  return (
    <div>
      <PageHeader
        title={t("review.title")}
        description={t("review.description")}
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
          icon={<ListChecks size={22} />}
          title={t("review.emptyTitle")}
          description={t("review.emptyDescription")}
        />
      ) : (
        <>
          <Table<TimesheetEntry>
            columns={[
              {
                key: "owner",
                header: t("review.colOwner"),
                render: (e) => (
                  <span className="font-medium" dir="auto">{e.owner?.name ?? "—"}</span>
                ),
              },
              {
                key: "date",
                header: t("review.colDate"),
                render: (e) => (
                  <span className="text-text-secondary">{fmtDay(e.date)}</span>
                ),
              },
              {
                key: "start_time",
                header: t("review.colTime"),
                render: (e) => (
                  <span className="text-text-secondary tabular-nums">
                    {fmtTime(e.start_time)}–{fmtTime(e.end_time)}
                  </span>
                ),
              },
              {
                key: "hours",
                header: t("review.colHours"),
                align: "right",
                render: (e) => (
                  <span className="tabular-nums">
                    {formatHours(e.hours)}
                  </span>
                ),
              },
              {
                key: "note",
                header: t("review.colNote"),
                render: (e) => (
                  <span className="text-text-muted" dir="auto">{e.note || "—"}</span>
                ),
              },
              {
                key: "actions",
                header: "",
                align: "right",
                render: (e) => (
                  <span className="flex items-center justify-end gap-1">
                    <Button
                      size="sm"
                      variant="tertiary"
                      iconLeft={<Check size={13} />}
                      loading={approvingId === e.id}
                      onClick={() => onApprove(e)}
                    >
                      {t("common.approve")}
                    </Button>
                    <Button
                      size="sm"
                      variant="tertiary"
                      iconLeft={<RotateCcw size={13} />}
                      onClick={() => setReturning(e)}
                    >
                      {t("common.return")}
                    </Button>
                  </span>
                ),
              },
            ]}
            data={data.results}
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

      {/* Return — comment required */}
      <DecisionDialog
        open={returning !== null}
        onClose={() => setReturning(null)}
        action={t("common.return")}
        subject={
          returning
            ? t("review.entrySubject", {
                name: returning.owner?.name ?? "",
                day: fmtDay(returning.date),
              })
            : undefined
        }
        commentRequired
        loading={deciding}
        onSubmit={onReturn}
      />
    </div>
  );
}
