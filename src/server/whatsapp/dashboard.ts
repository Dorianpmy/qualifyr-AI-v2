import "server-only";

import { getServerEnv } from "@/config/env";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { requireOrganizationRole } from "@/server/organizations/service";

export async function getWhatsappDashboard(slug: string) {
  const organization = await requireOrganizationRole(slug, ["owner", "admin"]);
  const env = getServerEnv();
  const admin = getSupabaseAdmin();
  const [events, media, alerts] = await Promise.all([
    admin.from("whatsapp_message_events").select("status,created_at,failure_code", { count: "exact" }).eq("organization_id", organization.id).order("created_at", { ascending: false }).limit(20),
    admin.from("whatsapp_media").select("status", { count: "exact" }).eq("organization_id", organization.id),
    admin.from("whatsapp_operational_alerts").select("id,code,severity,created_at").eq("organization_id", organization.id).eq("status", "open").order("created_at", { ascending: false }).limit(5),
  ]);
  const configured = Boolean(
    env.WHATSAPP_PHONE_NUMBER_ID
    && env.WHATSAPP_ACCESS_TOKEN
    && env.WHATSAPP_APP_SECRET
    && env.WHATSAPP_VERIFY_TOKEN
    && env.WHATSAPP_PILOT_ORGANIZATION_ID === organization.id,
  );
  return {
    organization,
    configured,
    phoneNumberSuffix: env.WHATSAPP_PHONE_NUMBER_ID?.slice(-4) ?? null,
    aiEnabled: env.AI_PROVIDER !== "disabled",
    aiModel: env.AI_MODEL,
    messageCount: events.count ?? 0,
    failedCount: (events.data ?? []).filter((event) => event.status === "failed").length,
    latestMessageAt: events.data?.[0]?.created_at ?? null,
    mediaCount: media.count ?? 0,
    mediaReadyCount: (media.data ?? []).filter((item) => item.status === "ready").length,
    alerts: alerts.data ?? [],
    migrationReady: !media.error && !alerts.error,
  };
}
