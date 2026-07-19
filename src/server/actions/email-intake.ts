"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireOrganizationRole } from "@/server/organizations/service";

export async function configureEmailChannelAction(slug: string, formData: FormData) {
  const organization = await requireOrganizationRole(slug, ["owner", "admin"]);
  const enabled = formData.get("enabled") === "true";
  const retentionDays = Number(formData.get("retentionDays"));
  const acknowledged = formData.get("acknowledge") === "on";
  const supabase = await createClient();
  const { error } = await supabase.rpc("configure_organization_email_channel", { target_organization_id: organization.id, requested_enabled: enabled, requested_retention_days: retentionDays, acknowledge_processing: acknowledged });
  if (error) throw new Error("email_channel_update_failed");
  revalidatePath(`/app/${slug}/canaux/email`);
}
