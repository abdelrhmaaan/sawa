import type { StatusHistoryItem } from "@/lib/types";

export function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function statusLabel(status: string | null) {
  if (!status) return "Created";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

/** Ordered status timeline shared by request detail and timesheet detail. */
export function Timeline({ history }: { history: StatusHistoryItem[] }) {
  if (history.length === 0) {
    return <p className="text-body-sm text-text-muted">No activity yet.</p>;
  }
  return (
    <ol>
      {history.map((h, i) => (
        <li key={h.id} className="relative pl-7 pb-5 last:pb-0">
          {i < history.length - 1 && (
            <span className="absolute left-[5px] top-4 bottom-0 w-px bg-border" />
          )}
          <span className="absolute left-0 top-1 w-[11px] h-[11px] rounded-full border-2 border-brand-500 bg-white" />
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-body-sm font-semibold text-text-primary">
              {h.actor?.name ?? "System"}
            </span>
            <span className="text-body-sm text-text-secondary">
              {h.from_status
                ? `${statusLabel(h.from_status)} → ${statusLabel(h.to_status)}`
                : "Created"}
            </span>
          </div>
          <p className="text-caption mt-0.5">{formatDateTime(h.created_at)}</p>
          {h.comment && (
            <p className="text-body-sm text-text-secondary mt-1.5 bg-surface-alt border border-border rounded-lg px-3 py-2">
              {h.comment}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}
