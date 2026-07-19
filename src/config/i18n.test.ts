import { describe, expect, it } from "vitest";

import { formatCurrency, formatDate, formatOrganizationDate, getOrganizationGreeting, marketConfig, resolveIntlContext } from "./i18n";

describe("international market configuration", () => {
  it.each([
    ["FR", "fr-FR", "EUR", "Europe/Paris"],
    ["BE", "fr-BE", "EUR", "Europe/Brussels"],
    ["CH", "fr-CH", "CHF", "Europe/Zurich"],
    ["PL", "pl-PL", "PLN", "Europe/Warsaw"],
    ["RO", "ro-RO", "RON", "Europe/Bucharest"],
  ] as const)("configures %s without a French-only fallback", (code, locale, currency, timezone) => {
    expect(marketConfig[code]).toMatchObject({ locale, currency, timezone });
    expect(() => formatDate("2026-07-19T12:00:00Z", locale, timezone)).not.toThrow();
    expect(formatCurrency(1234.5, currency, locale)).toContain("1");
  });

  it("formats organization dates with a safe timezone fallback", () => {
    expect(formatOrganizationDate("2026-07-19T12:00:00Z", "fr-FR", "Invalid/Zone")).toBe(formatDate("2026-07-19T12:00:00Z", "fr-FR", "UTC"));
    expect(resolveIntlContext("invalid_locale", "Invalid/Zone")).toEqual({ locale: "fr-FR", timezone: "UTC" });
  });

  it("calculates the greeting from the organization timezone", () => {
    const value = new Date("2026-07-19T06:00:00Z");
    expect(getOrganizationGreeting(value, "fr-FR", "Europe/Paris")).toBe("Bonjour");
    expect(getOrganizationGreeting(value, "fr-FR", "Invalid/Zone")).toBe("Bonjour");
  });
});
