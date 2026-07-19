export const i18nConfig = {
  defaultLocale: "fr",
  defaultTimezone: "UTC",
  defaultPrimaryLanguage: "fr",
  supportedLocales: ["fr"] as const,
} as const;

export type SupportedLocale = (typeof i18nConfig.supportedLocales)[number];

export function formatDate(value: Date | string, locale = i18nConfig.defaultLocale, timezone = i18nConfig.defaultTimezone) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: timezone }).format(date);
}

export function formatNumber(value: number, locale = i18nConfig.defaultLocale) {
  return new Intl.NumberFormat(locale).format(value);
}

export function formatCurrency(value: number, currency: string, locale = i18nConfig.defaultLocale) {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(value);
}
