import { useCallback, useEffect, useState } from "react";
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

const PAGE_SIZE = 20;

function fmtTime(t: string) {
  return t.slice(0, 5);
}

function fmtDay(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function TimesheetReviewPage() {
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
      toast({ variant: "success", title: "Entry approved." });
      await load();
    } catch (err) {
      toast({
        variant: "error",
        title: "Couldn't approve the entry.",
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
      toast({ variant: "success", title: "Entry returned to the owner." });
      await load();
    } finally {
      setDeciding(false);
    }
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.count / PAGE_SIZE)) : 1;

  return (
    <div>
      <PageHeader
        title="Timesheet review"
        description="Submitted time entries waiting for your decision."
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
          title="All caught up"
          description="There are no timesheets waiting for your review."
        />
      ) : (
        <>
          <Table<TimesheetEntry>
            columns={[
              {
                key: "owner",
                header: "Owner",
                render: (e) => (
                  <span className="font-medium">{e.owner?.name ?? "—"}</span>
                ),
              },
              {
                key: "date",
                header: "Date",
                render: (e) => (
                  <span className="text-text-secondary">{fmtDay(e.date)}</span>
                ),
              },
              {
                key: "start_time",
                header: "Time",
                render: (e) => (
                  <span className="text-text-secondary tabular-nums">
                    {fmtTime(e.start_time)}–{fmtTime(e.end_time)}
                  </span>
                ),
              },
              {
                key: "hours",
                header: "Hours",
                align: "right",
                render: (e) => (
                  <span className="tabular-nums">
                    {Number(e.hours).toFixed(2)} h
                  </span>
                ),
              },
              {
                key: "note",
                header: "Note",
                render: (e) => (
                  <span className="text-text-muted">{e.note || "—"}</span>
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
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="tertiary"
                      iconLeft={<RotateCcw size={13} />}
                      onClick={() => setReturning(e)}
                    >
                      Return
                    </Button>
                  </span>
                ),
              },
            ]}
            data={data.results}
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

      {/* Return — comment required */}
      <DecisionDialog
        open={returning !== null}
        onClose={() => setReturning(null)}
        action="Return"
        subject={
          returning
            ? `${returning.owner?.name ?? ""} · ${fmtDay(returning.date)}`
            : undefined
        }
        commentRequired
        loading={deciding}
        onSubmit={onReturn}
      />
    </div>
  );
}
