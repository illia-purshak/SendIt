import i18n, {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  normalizeLanguage,
  type SupportedLanguage,
} from "./index";

type DateInput = Date | number | string;

const LOCALE_BY_LANGUAGE: Record<SupportedLanguage, string> = {
  en: "en-US",
  uk: "uk-UA",
};

export function getCurrentLanguage(): SupportedLanguage {
  return normalizeLanguage(i18n.resolvedLanguage);
}

export function persistLanguage(language: string) {
  const normalized = normalizeLanguage(language);

  if (typeof window !== "undefined") {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, normalized);
  }

  if (i18n.resolvedLanguage !== normalized) {
    void i18n.changeLanguage(normalized);
  }
}

export function syncLanguage(language?: string | null) {
  if (!language) return;
  persistLanguage(language);
}

export function clearPersistedLanguage() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(LANGUAGE_STORAGE_KEY);
  }

  if (i18n.resolvedLanguage !== DEFAULT_LANGUAGE) {
    void i18n.changeLanguage(DEFAULT_LANGUAGE);
  }
}

export function getCurrentLocale() {
  return LOCALE_BY_LANGUAGE[getCurrentLanguage()];
}

export function t(key: string, options?: Record<string, unknown>) {
  return i18n.t(key, options);
}

export function formatDate(value: DateInput, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(getCurrentLocale(), options).format(new Date(value));
}

export function formatDateTime(
  value: DateInput,
  options?: Intl.DateTimeFormatOptions,
) {
  return new Intl.DateTimeFormat(getCurrentLocale(), {
    dateStyle: "medium",
    timeStyle: "short",
    ...options,
  }).format(new Date(value));
}

export function formatNumber(
  value: number,
  options?: Intl.NumberFormatOptions,
) {
  return new Intl.NumberFormat(getCurrentLocale(), options).format(value);
}
