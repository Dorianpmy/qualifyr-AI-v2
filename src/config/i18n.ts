export const i18nConfig = {
  defaultLocale: "fr-FR",
  defaultTimezone: "UTC",
  defaultPrimaryLanguage: "fr",
  supportedLocales: ["fr"] as const,
} as const;

export const marketConfig = {
  FR: { label: "France", locale: "fr-FR", timezone: "Europe/Paris", currency: "EUR", primaryLanguage: "fr" },
  BE: { label: "Belgique", locale: "fr-BE", timezone: "Europe/Brussels", currency: "EUR", primaryLanguage: "fr" },
  LU: { label: "Luxembourg", locale: "fr-LU", timezone: "Europe/Luxembourg", currency: "EUR", primaryLanguage: "fr" },
  CH: { label: "Suisse", locale: "fr-CH", timezone: "Europe/Zurich", currency: "CHF", primaryLanguage: "fr" },
  PL: { label: "Pologne", locale: "pl-PL", timezone: "Europe/Warsaw", currency: "PLN", primaryLanguage: "pl" },
  RO: { label: "Roumanie", locale: "ro-RO", timezone: "Europe/Bucharest", currency: "RON", primaryLanguage: "ro" },
} as const;

export type MarketCode = keyof typeof marketConfig;

export const expandableEuropeanMarketCodes = [
  "CZ", "SK", "HU", "BG", "HR", "SI", "EE", "LV", "LT",
] as const;

export type SupportedLocale = (typeof i18nConfig.supportedLocales)[number];

export function formatDate(value: Date | string, locale: string = i18nConfig.defaultLocale, timezone: string = i18nConfig.defaultTimezone) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: timezone }).format(date);
}

export function formatNumber(value: number, locale: string = i18nConfig.defaultLocale) {
  return new Intl.NumberFormat(locale).format(value);
}

export function formatCurrency(value: number, currency: string, locale: string = i18nConfig.defaultLocale) {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(value);
}
