import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import uk from "./locales/uk.json";

export const LANGUAGE_STORAGE_KEY = "sendit.language";
export const SUPPORTED_LANGUAGES = ["en", "uk"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: SupportedLanguage = "en";

export function normalizeLanguage(language?: string | null): SupportedLanguage {
  if (!language) return DEFAULT_LANGUAGE;

  const baseLanguage = language.toLowerCase().split("-")[0];
  return SUPPORTED_LANGUAGES.includes(baseLanguage as SupportedLanguage)
    ? (baseLanguage as SupportedLanguage)
    : DEFAULT_LANGUAGE;
}

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      uk: { translation: uk },
    },
    fallbackLng: DEFAULT_LANGUAGE,
    lng: DEFAULT_LANGUAGE,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: ["localStorage"],
    },
  });

void i18n.changeLanguage(normalizeLanguage(i18n.resolvedLanguage));

i18n.on("languageChanged", (language) => {
  const normalizedLanguage = normalizeLanguage(language);

  if (typeof document !== "undefined") {
    document.documentElement.lang = normalizedLanguage;
  }

  if (normalizedLanguage !== language) {
    void i18n.changeLanguage(normalizedLanguage);
  }
});

export default i18n;
