import "server-only";

import { canManageMembers } from "@/features/organizations/permissions";
import { createClient } from "@/lib/supabase/server";
import { requireAuthContext } from "@/server/auth/get-auth-context";
import { listOrganizationInvitations, listOrganizationMembers, requireOrganizationMembership } from "@/server/organizations/service";

export type OrganizationDashboardData = {
  organization: {
    name: string;
    slug: string;
    countryCode: string | null;
    locale: string | null;
    timezone: string | null;
    currency: string | null;
    primaryLanguage: string | null;
    businessCategory: string | null;
    teamSizeRange: string | null;
    createdAt: string;
  };
  currentUser: {
    firstName: string | null;
    role: "owner" | "admin" | "member";
    profileComplete: boolean;
  };
  team: {
    activeMembersCount: number;
    hasActiveOwner: boolean;
    pendingInvitationsCount: number | null;
    previews: Array<{ userId: string; displayName: string; initials: string }>;
  };
};

function memberDisplayName(member: { first_name: string | null; last_name: string | null }) {
  return [member.first_name, member.last_name].filter(Boolean).join(" ") || "Membre Qualifyr";
}

function initials(value: string) {
  return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toLocaleUpperCase()).join("") || "Q";
}

export async function getOrganizationDashboard(organizationSlug: string): Promise<OrganizationDashboardData> {
  const [{ userId }, membership] = await Promise.all([requireAuthContext(), requireOrganizationMembership(organizationSlug)]);
  const supabase = await createClient();
  const organizationPromise = supabase.from("organizations")
    .select("name,slug,country_code,locale,timezone,currency,primary_language,business_category,team_size_range,created_at")
    .eq("id", membership.id).single();
  const profilePromise = supabase.from("profiles").select("first_name,last_name").eq("user_id", userId).single();
  const membersPromise = listOrganizationMembers(membership.id);
  const invitationsPromise = canManageMembers(membership.role)
    ? listOrganizationInvitations(membership.id)
    : Promise.resolve(null);
  const [{ data: organization, error: organizationError }, { data: profile, error: profileError }, members, invitations] = await Promise.all([
    organizationPromise, profilePromise, membersPromise, invitationsPromise,
  ]);
  if (organizationError || !organization) throw new Error("dashboard_unavailable");
  if (profileError && profileError.code !== "PGRST116") throw new Error("dashboard_unavailable");
  const activeMembers = members.filter((member) => member.status === "active");
  return {
    organization: {
      name: organization.name,
      slug: organization.slug,
      countryCode: organization.country_code,
      locale: organization.locale,
      timezone: organization.timezone,
      currency: organization.currency,
      primaryLanguage: organization.primary_language,
      businessCategory: organization.business_category,
      teamSizeRange: organization.team_size_range,
      createdAt: organization.created_at,
    },
    currentUser: {
      firstName: profile?.first_name ?? null,
      role: membership.role,
      profileComplete: Boolean(profile?.first_name && profile?.last_name),
    },
    team: {
      activeMembersCount: activeMembers.length,
      hasActiveOwner: activeMembers.some((member) => member.role === "owner"),
      pendingInvitationsCount: invitations?.filter((invitation) => invitation.status === "pending").length ?? null,
      previews: activeMembers.slice(0, 4).map((member) => {
        const displayName = memberDisplayName(member);
        return { userId: member.user_id, displayName, initials: initials(displayName) };
      }),
    },
  };
}
