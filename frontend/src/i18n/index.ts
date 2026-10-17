import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import ar from "./locales/ar.json";
import en from "./locales/en.json";

function applyDir(lng: string | undefined) {
  const lang = lng === "ar" ? "ar" : "en";
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
    },
    detection: {
      order: ["localStorage"],
      lookupLocalStorage: "sawa.lang",
      caches: ["localStorage"],
    },
    fallbackLng: "en",
    supportedLngs: ["en", "ar"],
    load: "languageOnly",
    interpolation: { escapeValue: false },
    returnEmptyString: false,
  });

applyDir(i18n.resolvedLanguage);
i18n.on("languageChanged", applyDir);

export type EnResources = typeof en;
// Only leaf (string) entries are valid keys — some groups nest deeper.
export type I18nKey = {
  [S in keyof EnResources]: `${S & string}.${{
    [K in keyof EnResources[S]]: EnResources[S][K] extends string
      ? K & string
      : never;
  }[keyof EnResources[S]] &
    string}`;
}[keyof EnResources];

export default i18n;
