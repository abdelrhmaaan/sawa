import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { Clock, Pencil, Plus, Send, Trash2 } from "lucide-react";

import {
  Button,
  Card,
  Checkbox,
  DateInput,
  EmptyState,
  ErrorState,
  Select,
  Skeleton,
  StatusBadge,
} from "@/components/ui";
import { ConfirmDialog, Drawer, useToast } from "@/components/overlays";
import { Timeline, formatDateTime } from "@/components/Timeline";
import { PageHeader } from "@/shell/Shell";
import {
  ApiError,
  bulkSubmitTimesheetEntries,
  deleteTimesheetEntry,
  getTimesheetEntry,
  listTimesheets,
  listUsers,
  submitTimesheetEntry,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  userDisplayName,
  type EntryStatus,
  type TimesheetEntry,
  type TimesheetEntryDetail,
  type TimesheetList,
  type UserListItem,
} from "@/lib/types";
import TimesheetEntryForm from "./TimesheetEntryForm";

const PAGE_SIZE = 20;
const SUBMITTABLE: EntryStatus[] = ["draft", "returned"];

const statusOptions: [EntryStatus, string][] = [
  ["draft", "Draft"],
  ["submitted", "Submitted"],
  ["approved", "Approved"],
  ["returned", "Returned"],
];

interface Filters {
  status: EntryStatus | "";
  date_from: string;
  date_to: string;
  owner: string; // "" | user id
}

const defaultFilters: Filters = {
  status: "",
  date_from: "",
  date_to: "",
  owner: "",
};

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

export default function TimesheetsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const isApprover = user?.role === "manager" || user?.role === "hr";

  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<TimesheetList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [users, setUsers] = useState<UserListItem[]>([]);

  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TimesheetEntry | null>(null);
  const [deleting, setDeleting] = useState<TimesheetEntry | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [busyIds, setBusyIds] = useState<Set<number>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const [detailId, setDetailId] = useState<number | null>(null);
  const [detail, setDetail] = useState<TimesheetEntryDetail | null>(null);
  const [detailError, setDetailError] = useState(false);

  const patchFilters = (patch: Partial<Filters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setData(
        await listTimesheets({
          status: filters.status || undefined,
          date_from: filters.date_from || undefined,
          date_to: filters.date_to || undefined,
          owner: filters.owner ? Number(filters.owner) : undefined,
          page,
          page_size: PAGE_SIZE,
        })
      );
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    void load();
  }, [load]);

  // Owner dropdown — manager/HR only (employees get 403 on /api/users/).
  useEffect(() => {
    if (!isApprover) return;
    listUsers({ page_size: 100 })
      .then((res) => setUsers(res.results))
      .catch(() => setUsers([]));
  }, [isApprover]);

  // Dashboard "Log time" deep link: /timesheets?new=1 opens the form.
  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setEditing(null);
      setFormOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete("new");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Clear selection whenever the page data changes.
  useEffect(() => {
    setSelected(new Set());
  }, [data]);

  // Group the current page's entries by date (API returns -date, -start_time).
  const groups = useMemo(() => {
    const map = new Map<string, TimesheetEntry[]>();
    for (const e of data?.results ?? []) {
      const list = map.get(e.date);
      if (list) list.push(e);
      else map.set(e.date, [e]);
    }
    return [...map.entries()].map(([date, entries]) => ({
      date,
      entries,
      total: entries.reduce((sum, e) => sum + Number(e.hours), 0),
    }));
  }, [data]);

  const isOwn = (e: TimesheetEntry) => e.owner?.id === user?.id;
  const isSubmittable = (e: TimesheetEntry) =>
    isOwn(e) && SUBMITTABLE.includes(e.status);
  const submittableOnPage = (data?.results ?? []).filter(isSubmittable);
  const allSelected =
    submittableOnPage.length > 0 &&
    submittableOnPage.every((e) => selected.has(e.id));

  const toggleSelectAll = (checked: boolean) => {
    setSelected(checked ? new Set(submittableOnPage.map((e) => e.id)) : new Set());
  };

  const toggleOne = (id: number, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const withBusy = async (id: number, fn: () => Promise<unknown>) => {
    setBusyIds((prev) => new Set(prev).add(id));
    try {
      await fn();
    } finally {
      setBusyIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const onSubmitOne = (e: TimesheetEntry) =>
    withBusy(e.id, async () => {
      try {
        await submitTimesheetEntry(e.id);
        toast({ variant: "success", title: "Entry submitted for review." });
        await load();
      } catch (err) {
        toast({
          variant: "error",
          title: "Couldn't submit the entry.",
          description:
            err instanceof ApiError
              ? err.detail ?? err.fieldErrors?.detail?.[0]
              : undefined,
        });
      }
    });

  const onDelete = async () => {
    if (!deleting || deleteBusy) return;
    setDeleteBusy(true);
    try {
      await deleteTimesheetEntry(deleting.id);
      toast({ variant: "success", title: "Entry deleted." });
      setDeleting(null);
      await load();
    } catch (err) {
      setDeleting(null);
      toast({
        variant: "error",
        title: "Couldn't delete the entry.",
        description:
          err instanceof ApiError
            ? err.detail ?? err.fieldErrors?.detail?.[0]
            : undefined,
      });
    } finally {
      setDeleteBusy(false);
    }
  };

  const onBulkSubmit = async () => {
    if (bulkBusy || selected.size === 0) return;
    setBulkBusy(true);
    try {
      const res = await bulkSubmitTimesheetEntries([...selected]);
      toast({
        variant: "success",
        title: `${res.submitted} ${res.submitted === 1 ? "entry" : "entries"} submitted.`,
      });
      setSelected(new Set());
      await load();
    } catch (err) {
      toast({
        variant: "error",
        title: "Bulk submit failed.",
        description:
          err instanceof ApiError
            ? err.detail ?? err.fieldErrors?.ids?.[0] ?? err.fieldErrors?.detail?.[0]
            : undefined,
      });
    } finally {
      setBulkBusy(false);
    }
  };

  const openDetail = (id: number) => {
    setDetailId(id);
    setDetail(null);
    setDetailError(false);
    getTimesheetEntry(id)
      .then(setDetail)
      .catch(() => setDetailError(true));
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.count / PAGE_SIZE)) : 1;
  const hasFilters =
    filters.status || filters.date_from || filters.date_to || filters.owner;

  return (
    <div>
      <PageHeader
        title="My timesheets"
        description={
          data && !loading && !error
            ? `${data.total_hours} hours in this view.`
            : "Your daily time entries."
        }
        action={
          <Button
            size="sm"
            iconLeft={<Plus size={14} />}
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            Log time
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div className="w-40">
          <Select
            aria-label="Filter by status"
            value={filters.status}
            onChange={(e) =>
              patchFilters({ status: e.target.value as EntryStatus | "" })
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
        <div className="w-40">
          <DateInput
            aria-label="From date"
            value={filters.date_from}
            onChange={(e) => patchFilters({ date_from: e.target.value })}
          />
        </div>
        <div className="w-40">
          <DateInput
            aria-label="To date"
            value={filters.date_to}
            onChange={(e) => patchFilters({ date_to: e.target.value })}
          />
        </div>
        {isApprover && (
          <div className="w-56">
            <Select
              aria-label="Filter by owner"
              value={filters.owner}
              onChange={(e) => patchFilters({ owner: e.target.value })}
            >
              <option value="">Everyone visible</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {userDisplayName(u)}
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>

      {/* Bulk actions */}
      {!loading && !error && submittableOnPage.length > 0 && (
        <div className="flex items-center justify-between gap-3 mb-4">
          <Checkbox
            label="Select drafts"
            hint={`${submittableOnPage.length} submittable on this page`}
            checked={allSelected}
            onChange={toggleSelectAll}
          />
          <Button
            size="sm"
            variant="secondary"
            iconLeft={<Send size={14} />}
            disabled={selected.size === 0}
            loading={bulkBusy}
            onClick={onBulkSubmit}
          >
            Submit selected{selected.size > 0 ? ` (${selected.size})` : ""}
          </Button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <ErrorState onRetry={load} />
      ) : !data || groups.length === 0 ? (
        <EmptyState
          icon={<Clock size={22} />}
          title="No time entries"
          description={
            hasFilters
              ? "Nothing matches these filters. Try widening them."
              : "Log your first hours to see them here."
          }
          action={
            <Button
              size="sm"
              iconLeft={<Plus size={14} />}
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              Log time
            </Button>
          }
        />
      ) : (
        <>
          <div className="space-y-4">
            {groups.map((g) => (
              <Card key={g.date} padding="none">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-surface-alt rounded-t-xl">
                  <p className="text-body-sm font-semibold text-text-primary">
                    {fmtDay(g.date)}
                  </p>
                  <p className="text-body-sm text-text-secondary tabular-nums">
                    {g.total.toFixed(2)} h
                  </p>
                </div>
                {g.entries.map((e) => (
                  <div
                    key={e.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => openDetail(e.id)}
                    onKeyDown={(ev) => ev.key === "Enter" && openDetail(e.id)}
                    className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 border-b border-divider last:border-0 cursor-pointer hover:bg-surface-alt transition-colors duration-100"
                  >
                    {isSubmittable(e) && (
                      <span onClick={(ev) => ev.stopPropagation()}>
                        <Checkbox
                          checked={selected.has(e.id)}
                          onChange={(c) => toggleOne(e.id, c)}
                        />
                      </span>
                    )}
                    <span className="text-body-sm text-text-primary tabular-nums w-24">
                      {fmtTime(e.start_time)}–{fmtTime(e.end_time)}
                    </span>
                    <span className="text-body-sm font-semibold text-text-primary tabular-nums w-14">
                      {Number(e.hours).toFixed(2)} h
                    </span>
                    {!isOwn(e) && (
                      <span className="text-body-sm text-text-secondary">
                        {e.owner?.name ?? "—"}
                      </span>
                    )}
                    <span className="flex-1 min-w-[120px] text-body-sm text-text-muted truncate">
                      {e.note || "—"}
                    </span>
                    <StatusBadge status={e.status} />
                    {isOwn(e) && SUBMITTABLE.includes(e.status) && (
                      <span
                        className="flex items-center gap-1"
                        onClick={(ev) => ev.stopPropagation()}
                      >
                        <Button
                          size="sm"
                          variant="tertiary"
                          iconLeft={<Pencil size={13} />}
                          onClick={() => {
                            setEditing(e);
                            setFormOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="tertiary"
                          iconLeft={<Send size={13} />}
                          loading={busyIds.has(e.id)}
                          onClick={() => onSubmitOne(e)}
                        >
                          Submit
                        </Button>
                        {e.status === "draft" && (
                          <Button
                            size="sm"
                            variant="tertiary"
                            iconLeft={<Trash2 size={13} />}
                            onClick={() => setDeleting(e)}
                          >
                            Delete
                          </Button>
                        )}
                      </span>
                    )}
                  </div>
                ))}
              </Card>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between gap-3 mt-4">
            <p className="text-caption">
              Page {page} of {totalPages} · {data.count}{" "}
              {data.count === 1 ? "entry" : "entries"}
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

      {/* Entry detail drawer (status timeline) */}
      <Drawer
        open={detailId !== null}
        onClose={() => setDetailId(null)}
        title={detail ? fmtDay(detail.date) : "Entry"}
        description={
          detail
            ? `${fmtTime(detail.start_time)}–${fmtTime(detail.end_time)} · ${
                Number(detail.hours).toFixed(2)
              } h`
            : undefined
        }
        size="sm"
      >
        {detailError ? (
          <ErrorState
            description="Couldn't load this entry."
            onRetry={() => detailId !== null && openDetail(detailId)}
          />
        ) : !detail ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-32" />
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <StatusBadge status={detail.status} />
              <span className="text-body-sm text-text-secondary">
                {detail.owner?.name ?? "—"}
              </span>
            </div>
            {detail.note && (
              <div>
                <p className="text-overline text-text-muted mb-1">Note</p>
                <p className="text-body-sm text-text-primary whitespace-pre-wrap">
                  {detail.note}
                </p>
              </div>
            )}
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
              <div>
                <dt className="text-overline text-text-muted">Submitted</dt>
                <dd className="text-body-sm text-text-primary mt-0.5">
                  {detail.submitted_at ? formatDateTime(detail.submitted_at) : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-overline text-text-muted">Reviewed</dt>
                <dd className="text-body-sm text-text-primary mt-0.5">
                  {detail.reviewed_at ? formatDateTime(detail.reviewed_at) : "—"}
                </dd>
              </div>
            </dl>
            <div>
              <p className="text-overline text-text-muted mb-2">Timeline</p>
              <Timeline history={detail.history} />
            </div>
          </div>
        )}
      </Drawer>

      {/* Create / edit modal */}
      <TimesheetEntryForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        entry={editing}
        onSaved={load}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={onDelete}
        title="Delete this entry?"
        description={
          deleting
            ? `${fmtDay(deleting.date)} · ${fmtTime(deleting.start_time)}–${fmtTime(deleting.end_time)} will be permanently removed.`
            : undefined
        }
        confirmLabel="Delete"
        destructive
        loading={deleteBusy}
      />
    </div>
  );
}
