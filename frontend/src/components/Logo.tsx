import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

interface LogoProps {
  /** color = brand-blue square + dark wordmark; mono = all dark (footer). */
  variant?: "color" | "mono";
  /** false renders the icon only (rounded square + two circles). */
  wordmark?: boolean;
  className?: string;
  /** true removes the accessible name (decorative use). */
  decorative?: boolean;
}

/**
 * Inline brand SVG from docs/brand/logo.svg (wordmark) / icon.svg (icon only).
 * The SVG is pinned to LTR: <text> inherits `direction` from <html dir="rtl">,
 * which would make x="78" the wordmark's end and draw it over the icon.
 * Height is controlled via className, e.g. `h-8 w-auto`.
 */
export function Logo({
  variant = "color",
  wordmark = true,
  className,
  decorative = false,
}: LogoProps) {
  const { t } = useTranslation();
  const squareFill = variant === "mono" ? "#0F172A" : "#2563EB";
  const a11y = decorative
    ? { "aria-hidden": true as const }
    : { role: "img" as const, "aria-label": t("common.appName") };
  return (
    <svg
      viewBox={wordmark ? "0 0 180 64" : "0 0 64 64"}
      direction="ltr"
      className={cn("w-auto", className)}
      {...a11y}
    >
      <rect width="64" height="64" rx="14" fill={squareFill} />
      <circle cx="26" cy="32" r="12" fill="#FFFFFF" fillOpacity="0.95" />
      <circle cx="38" cy="32" r="12" fill="#FFFFFF" fillOpacity="0.55" />
      {wordmark && (
        <text
          x="78"
          y="42"
          fontFamily="Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
          fontSize="30"
          fontWeight="800"
          letterSpacing="-1"
          fill="#0F172A"
        >
          SAWA
        </text>
      )}
    </svg>
  );
}
