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

export function resolveIntlContext(locale?: string | null, timezone?: string | null) {
  let safeLocale: string = i18nConfig.defaultLocale;
  try {
    if (locale && Intl.DateTimeFormat.supportedLocalesOf([locale]).length) safeLocale = locale;
  } catch {
    safeLocale = i18nConfig.defaultLocale;
  }
  let safeTimezone = timezone || i18nConfig.defaultTimezone;
  try {
    new Intl.DateTimeFormat(safeLocale, { timeZone: safeTimezone }).format();
  } catch {
    safeTimezone = i18nConfig.defaultTimezone;
  }
  return { locale: safeLocale, timezone: safeTimezone };
}

export function formatOrganizationDate(value: Date | string, locale?: string | null, timezone?: string | null) {
  const context = resolveIntlContext(locale, timezone);
  return formatDate(value, context.locale, context.timezone);
}

export function getOrganizationGreeting(value: Date, locale?: string | null, timezone?: string | null) {
  const context = resolveIntlContext(locale, timezone);
  const hour = Number(new Intl.DateTimeFormat("en", { hour: "2-digit", hourCycle: "h23", timeZone: context.timezone }).format(value));
  if (hour < 12) return "Bonjour";
  if (hour < 18) return "Bon après-midi";
  return "Bonsoir";
}
