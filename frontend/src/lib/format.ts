import i18n from "@/i18n";

// Western digits in Arabic too ("ar-u-nu-latn"); English output unchanged.
function locale() {
  return i18n.language === "ar" ? "ar-u-nu-latn" : "en";
}

export function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = iso.includes("T") ? new Date(iso) : new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(locale(), {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatWeekday(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(locale(), {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(locale(), {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(locale(), {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatTime(hhmm: string) {
  return hhmm.slice(0, 5);
}

export function formatHours(n: string | number) {
  return i18n.t("common.hoursShort", { value: Number(n).toFixed(2) });
}
