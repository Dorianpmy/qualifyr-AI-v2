import { describe, expect, it } from "vitest";

import { formatCurrency, formatDate, marketConfig } from "./i18n";

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
});
