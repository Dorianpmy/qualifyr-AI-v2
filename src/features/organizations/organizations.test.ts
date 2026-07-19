import { describe, expect, it } from "vitest";

import { canChangeRole, canInvite, canManageMembers, canRemoveMember } from "./permissions";
import { countryCode, currency, invitationTokenSchema, locale, normalizeSlug, organizationSchema, reservedOrganizationSlugs, timezone } from "./schemas";

describe("organization validation", () => {
  it("normalizes an international organization name into a readable slug", () => {
    expect(normalizeSlug("  Rénovation Łódź & Fils  ")).toBe("renovation-odz-fils");
  });

  it.each(reservedOrganizationSlugs)("rejects reserved slug %s", (slug) => {
    expect(organizationSchema.safeParse({ name: "Test", slug, countryCode: "PL", locale: "pl-PL", timezone: "Europe/Warsaw", currency: "PLN", primaryLanguage: "pl", businessCategory: "maintenance", teamSizeRange: "2_5", requestId: "10000000-0000-4000-8000-000000000001" }).success).toBe(false);
  });

  it("validates international standards and rejects malformed values", () => {
    expect(countryCode.safeParse("ro").data).toBe("RO");
    expect(locale.safeParse("ro-RO").success).toBe(true);
    expect(currency.safeParse("ron").data).toBe("RON");
    expect(timezone.safeParse("Europe/Bucharest").success).toBe(true);
    expect(timezone.safeParse("France/Paris").success).toBe(false);
  });

  it("rejects unknown properties", () => {
    expect(organizationSchema.safeParse({ name: "Test", role: "owner" }).success).toBe(false);
  });
});

describe("organization permissions", () => {
  it("enforces owner, admin and member invitation rules", () => {
    expect(canInvite("owner", "admin")).toBe(true);
    expect(canInvite("owner", "owner")).toBe(false);
    expect(canInvite("admin", "member")).toBe(true);
    expect(canInvite("admin", "admin")).toBe(false);
    expect(canInvite("member", "member")).toBe(false);
  });

  it("centralizes member-management rules", () => {
    expect(canManageMembers("owner")).toBe(true);
    expect(canChangeRole("admin", "member")).toBe(false);
    expect(canRemoveMember("admin", "member")).toBe(true);
    expect(canRemoveMember("admin", "owner")).toBe(false);
  });

  it("validates opaque invitation tokens", () => {
    expect(invitationTokenSchema.safeParse("a".repeat(43)).success).toBe(true);
    expect(invitationTokenSchema.safeParse("short").success).toBe(false);
    expect(invitationTokenSchema.safeParse("a".repeat(32) + "/").success).toBe(false);
  });
});
