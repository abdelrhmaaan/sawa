import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";

import { Button } from "@/components/ui";

/**
 * Ghost button toggling English ↔ العربية. Shows the *target* language name
 * (in that language); the choice persists via the localStorage detector.
 * The label is hidden below `sm` unless `fullLabel` is set (login page),
 * keeping room for the topbar title on narrow screens.
 */
export function LanguageSwitch({ fullLabel, className }: { fullLabel?: boolean; className?: string }) {
  const { i18n, t } = useTranslation();
  const toAr = i18n.resolvedLanguage !== "ar";
  const target = toAr ? "العربية" : "English";
  return (
    <Button
      variant="tertiary"
      size="sm"
      iconLeft={<Languages size={14} />}
      aria-label={t("common.switchLanguage")}
      title={target}
      className={className}
      onClick={() => i18n.changeLanguage(toAr ? "ar" : "en")}
    >
      <span lang={toAr ? "ar" : "en"} className={fullLabel ? undefined : "hidden sm:inline"}>
        {target}
      </span>
    </Button>
  );
}
