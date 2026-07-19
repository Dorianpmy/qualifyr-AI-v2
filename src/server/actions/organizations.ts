"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getPublicEnv } from "@/config/env";
import { organizationMessages } from "@/features/organizations/messages";
import { invitationSchema, invitationTokenSchema, memberRoleSchema, organizationSchema } from "@/features/organizations/schemas";
import type { OrganizationActionState } from "@/features/organizations/state";
import { createInvitationToken } from "@/features/organizations/token";
import { createClient } from "@/lib/supabase/server";
import { requireAuthContext } from "@/server/auth/get-auth-context";

function values(formData: FormData, keys: readonly string[]) {
  return Object.fromEntries(keys.map((key) => [key, formData.get(key)]));
}

export async function createOrganizationAction(_state: OrganizationActionState, formData: FormData): Promise<OrganizationActionState> {
  await requireAuthContext();
  const parsed = organizationSchema.safeParse(values(formData, ["name", "slug", "countryCode", "locale", "timezone", "currency", "primaryLanguage", "businessCategory", "teamSizeRange", "requestId"]));
  if (!parsed.success) return { status: "error", message: organizationMessages.common.genericError };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_organization_with_owner", {
    requested_name: parsed.data.name, requested_slug: parsed.data.slug,
    requested_country_code: parsed.data.countryCode, requested_locale: parsed.data.locale,
    requested_timezone: parsed.data.timezone, requested_currency: parsed.data.currency,
    requested_primary_language: parsed.data.primaryLanguage,
    requested_business_category: parsed.data.businessCategory,
    requested_team_size_range: parsed.data.teamSizeRange, request_id: parsed.data.requestId,
  });
  if (error || !data?.[0]) return { status: "error", message: organizationMessages.common.genericError };
  redirect(`/app/${data[0].organization_slug}`);
}

export async function createInvitationAction(organizationId: string, organizationSlug: string, _state: OrganizationActionState, formData: FormData): Promise<OrganizationActionState> {
  await requireAuthContext();
  const parsed = invitationSchema.safeParse(values(formData, ["email", "role"]));
  if (!parsed.success) return { status: "error", message: organizationMessages.common.genericError };
  const { token, hash } = createInvitationToken();
  const supabase = await createClient();
  const { error } = await supabase.rpc("create_organization_invitation", {
    target_organization_id: organizationId, invited_email: parsed.data.email, invited_role: parsed.data.role,
    token_hash_hex: hash, invitation_expires_at: new Date(Date.now() + 7 * 86_400_000).toISOString(),
  });
  if (error) return { status: "error", message: organizationMessages.common.genericError };
  revalidatePath(`/app/${organizationSlug}/membres`);
  const origin = getPublicEnv().NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  return { status: "success", message: organizationMessages.invitation.noEmail, invitationUrl: `${origin}/invitation/${token}` };
}

export async function acceptInvitationAction(token: string, previousState: OrganizationActionState): Promise<OrganizationActionState> {
  void previousState;
  await requireAuthContext();
  const parsed = invitationTokenSchema.safeParse(token);
  if (!parsed.success) return { status: "error", message: organizationMessages.invitation.invalid };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("accept_organization_invitation", { raw_token: parsed.data });
  if (error || !data?.[0]) return { status: "error", message: error?.message.includes("email_mismatch") ? organizationMessages.invitation.wrongEmail : organizationMessages.invitation.invalid };
  redirect(`/app/${data[0].organization_slug}`);
}

export async function updateMemberRoleAction(organizationId: string, organizationSlug: string, userId: string, previousState: OrganizationActionState, formData: FormData): Promise<OrganizationActionState> {
  void previousState;
  await requireAuthContext();
  const role = memberRoleSchema.safeParse(formData.get("role"));
  if (!role.success) return { status: "error", message: organizationMessages.common.genericError };
  const supabase = await createClient();
  const { error } = await supabase.rpc("update_organization_member_role", { target_organization_id: organizationId, target_user_id: userId, requested_role: role.data });
  if (error) return { status: "error", message: organizationMessages.common.genericError };
  revalidatePath(`/app/${organizationSlug}/membres`);
  return { status: "success", message: "Le rôle a été mis à jour." };
}

export async function removeMemberAction(organizationId: string, organizationSlug: string, userId: string, previousState: OrganizationActionState, formData: FormData): Promise<OrganizationActionState> {
  void previousState;
  void formData;
  await requireAuthContext();
  const supabase = await createClient();
  const { error } = await supabase.rpc("remove_organization_member", { target_organization_id: organizationId, target_user_id: userId });
  if (error) return { status: "error", message: organizationMessages.common.genericError };
  revalidatePath(`/app/${organizationSlug}/membres`);
  return { status: "success", message: "Le membre a été retiré." };
}

export async function revokeInvitationAction(organizationSlug: string, invitationId: string) {
  await requireAuthContext();
  const supabase = await createClient();
  await supabase.rpc("revoke_organization_invitation", { target_invitation_id: invitationId });
  revalidatePath(`/app/${organizationSlug}/membres`);
}
