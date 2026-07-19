import "server-only";

import { getServerEnv } from "@/config/env";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { requireOrganizationRole } from "@/server/organizations/service";

export async function getEmailChannelSettings(slug: string) {
  const organization = await requireOrganizationRole(slug, ["owner", "admin"]);
  const { data, error } = await getSupabaseAdmin().from("organization_email_channels").select("route_key,status,retention_days,ai_processing_enabled,data_processing_acknowledged_at").eq("organization_id", organization.id).maybeSingle();
  const domain = getServerEnv().INBOUND_EMAIL_DOMAIN;
  return { organization, channel: error ? null : data, migrationReady: !error, address: !error && data && domain ? `${data.route_key}@${domain}` : null, providerConfigured: Boolean(domain && getServerEnv().RESEND_API_KEY && getServerEnv().RESEND_WEBHOOK_SECRET) };
}
