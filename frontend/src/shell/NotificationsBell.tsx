import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/api";
import type { AppNotification } from "@/lib/types";
import { cn } from "@/lib/utils";

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Topbar bell: unread-count badge + dropdown of recent notifications.
 * Clicking an item marks it read and navigates to its `link` route.
 */
export function NotificationsBell() {
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  // Initial badge count — one cheap request on mount.
  useEffect(() => {
    let cancelled = false;
    listNotifications({ page_size: 1 })
      .then((res) => {
        if (!cancelled) setUnread(res.unread_count);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Close on click-outside / Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const toggle = useCallback(async () => {
    const next = !open;
    setOpen(next);
    if (!next) return;
    setLoading(true);
    setFailed(false);
    try {
      const res = await listNotifications({ page_size: 10 });
      setItems(res.results);
      setUnread(res.unread_count);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [open]);

  const onItem = async (n: AppNotification) => {
    setOpen(false);
    if (!n.is_read) {
      try {
        await markNotificationRead(n.id);
        setUnread((u) => Math.max(0, u - 1));
      } catch {
        // Badge may be stale until next open — acceptable.
      }
    }
    if (n.link) navigate(n.link);
  };

  const onReadAll = async () => {
    try {
      await markAllNotificationsRead();
      setUnread(0);
      setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      // keep state unchanged
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={toggle}
        aria-label="Notifications"
        className="relative w-8 h-8 flex items-center justify-center rounded-md text-text-secondary hover:bg-surface-alt transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
      >
        <Bell size={17} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-error text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 max-w-[90vw] bg-white border border-border rounded-xl shadow-lg overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
            <p className="text-body-sm font-semibold text-text-primary">
              Notifications
            </p>
            {unread > 0 && (
              <button
                onClick={onReadAll}
                className="flex items-center gap-1 text-caption text-brand-600 hover:text-brand-700 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 rounded"
              >
                <CheckCheck size={13} />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 size={18} className="animate-spin text-text-muted" />
              </div>
            ) : failed ? (
              <p className="px-4 py-8 text-center text-body-sm text-text-muted">
                Couldn't load notifications. Try again.
              </p>
            ) : items.length === 0 ? (
              <p className="px-4 py-8 text-center text-body-sm text-text-muted">
                Nothing yet — decisions on your requests and timesheets show up here.
              </p>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => onItem(n)}
                  className={cn(
                    "w-full text-left px-4 py-3 border-b border-divider last:border-0 transition-colors duration-100 hover:bg-surface-alt focus-visible:outline-none focus-visible:bg-surface-alt",
                    !n.is_read && "bg-brand-50"
                  )}
                >
                  <span className="flex items-start gap-2">
                    {!n.is_read && (
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 shrink-0" />
                    )}
                    <span className={cn("min-w-0", n.is_read && "pl-3.5")}>
                      <span className="block text-body-sm text-text-primary leading-snug">
                        {n.message}
                      </span>
                      <span className="block text-caption mt-0.5">
                        {formatWhen(n.created_at)}
                      </span>
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
