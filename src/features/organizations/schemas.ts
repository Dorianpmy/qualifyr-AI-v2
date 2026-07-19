import { z } from "zod";

const countryCode = z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/);
const locale = z.string().trim().regex(/^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/).max(35);
const currency = z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/);
const language = z.string().trim().regex(/^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/).max(35);
const timezone = z.string().trim().min(3).max(64).refine((value) => {
  try { new Intl.DateTimeFormat("en", { timeZone: value }).format(); return true; } catch { return false; }
});

export const reservedOrganizationSlugs = ["app", "auth", "api", "connexion", "inscription", "invitation", "onboarding", "design-system", "admin", "support"] as const;

export function normalizeSlug(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}

export const organizationSchema = z.strictObject({
  name: z.string().trim().min(1).max(120).transform((value) => value.replace(/\s+/g, " ")),
  slug: z.string().trim().transform(normalizeSlug).pipe(z.string().min(2).max(60).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).refine((value) => !reservedOrganizationSlugs.includes(value as never))),
  countryCode,
  locale,
  timezone,
  currency,
  primaryLanguage: language,
  businessCategory: z.enum(["construction_renovation", "installation", "maintenance", "technical_services", "professional_cleaning", "moving_services", "professional_services", "other"]),
  teamSizeRange: z.enum(["solo", "2_5", "6_20", "21_50", "51_plus"]),
  requestId: z.uuid(),
});

export const invitationSchema = z.strictObject({
  email: z.email().max(254).transform((value) => value.trim().toLowerCase()),
  role: z.enum(["admin", "member"]),
});

export const invitationTokenSchema = z.string().min(32).max(256).regex(/^[A-Za-z0-9_-]+$/);
export const memberRoleSchema = z.enum(["owner", "admin", "member"]);
export { countryCode, currency, language, locale, timezone };
