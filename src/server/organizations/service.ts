import "server-only";

import { notFound, redirect } from "next/navigation";

import type { OrganizationRole } from "@/features/organizations/permissions";
import { createClient } from "@/lib/supabase/server";
import { requireAuthContext } from "@/server/auth/get-auth-context";

export type OrganizationSummary = {
  id: string;
  name: string;
  slug: string;
  countryCode: string | null;
  locale: string | null;
  timezone: string | null;
  currency: string | null;
  primaryLanguage: string | null;
  role: OrganizationRole;
};

export async function listOrganizationsForUser(): Promise<OrganizationSummary[]> {
  const { userId } = await requireAuthContext();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organization_memberships")
    .select("role,organizations!inner(id,name,slug,country_code,locale,timezone,currency,primary_language,archived_at)")
    .eq("user_id", userId)
    .eq("status", "active")
    .is("organizations.archived_at", null);
  if (error) throw new Error("organizations_unavailable");
  return (data ?? []).map(({ role, organizations }) => ({
    id: organizations.id, name: organizations.name, slug: organizations.slug,
    countryCode: organizations.country_code, locale: organizations.locale,
    timezone: organizations.timezone, currency: organizations.currency,
    primaryLanguage: organizations.primary_language, role,
  }));
}

export async function requireOrganizationMembership(slug: string) {
  const organizations = await listOrganizationsForUser();
  const organization = organizations.find((candidate) => candidate.slug === slug);
  if (!organization) notFound();
  return organization;
}

export async function requireOrganizationRole(slug: string, allowed: readonly OrganizationRole[]) {
  const organization = await requireOrganizationMembership(slug);
  if (!allowed.includes(organization.role)) notFound();
  return organization;
}

export async function redirectToOrganizationEntry() {
  const organizations = await listOrganizationsForUser();
  if (organizations.length === 0) redirect("/app/onboarding");
  redirect(`/app/${organizations[0]!.slug}`);
}

export async function listOrganizationMembers(organizationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("list_organization_members", { target_organization_id: organizationId });
  if (error) throw new Error("members_unavailable");
  return data;
}

export async function listOrganizationInvitations(organizationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("organization_invitations")
    .select("id,email_normalized,role,status,expires_at,created_at")
    .eq("organization_id", organizationId).order("created_at", { ascending: false });
  if (error) throw new Error("invitations_unavailable");
  return data;
}
