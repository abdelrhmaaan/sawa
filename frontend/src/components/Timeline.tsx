import { useTranslation } from "react-i18next";

import { formatDateTime } from "@/lib/format";
import type { StatusHistoryItem } from "@/lib/types";

export { formatDateTime };

/** Ordered status timeline shared by request detail and timesheet detail. */
export function Timeline({ history }: { history: StatusHistoryItem[] }) {
  const { t } = useTranslation();
  const statusLabel = (status: string | null) =>
    status
      ? t(`status.${status}`, {
          defaultValue: status.charAt(0).toUpperCase() + status.slice(1),
        })
      : t("status.created");
  if (history.length === 0) {
    return <p className="text-body-sm text-text-muted">{t("common.noActivity")}</p>;
  }
  return (
    <ol>
      {history.map((h, i) => (
        <li key={h.id} className="relative ps-7 pb-5 last:pb-0">
          {i < history.length - 1 && (
            <span className="absolute start-[5px] top-4 bottom-0 w-px bg-border" />
          )}
          <span className="absolute start-0 top-1 w-[11px] h-[11px] rounded-full border-2 border-brand-500 bg-white" />
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-body-sm text-text-primary" dir="auto">
              {h.actor?.name ?? t("status.system")}
            </span>
            <span className="text-body-sm text-text-secondary">
              {h.from_status
                ? `${statusLabel(h.from_status)} → ${statusLabel(h.to_status)}`
                : t("status.created")}
            </span>
          </div>
          <p className="text-caption mt-0.5">{formatDateTime(h.created_at)}</p>
          {h.comment && (
            <p className="text-body-sm text-text-secondary mt-1.5 bg-surface-alt border border-border rounded-lg px-3 py-2" dir="auto">
              {h.comment}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}
