"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { formDataObject } from "@/features/auth/schemas";
import { createClient } from "@/lib/supabase/server";
import { requireOrganizationRole } from "@/server/organizations/service";

const configureEmailChannelSchema = z.strictObject({
  enabled: z.enum(["true", "false"]).transform((value) => value === "true"),
  retentionDays: z.coerce.number().int().min(30).max(730),
  acknowledge: z.literal("on").optional(),
});

export async function configureEmailChannelAction(slug: string, formData: FormData) {
  const organization = await requireOrganizationRole(slug, ["owner", "admin"]);
  const parsed = configureEmailChannelSchema.safeParse(
    formDataObject(formData, ["enabled", "retentionDays", "acknowledge"]),
  );
  if (!parsed.success) throw new Error("email_channel_invalid_input");
  const supabase = await createClient();
  const { error } = await supabase.rpc("configure_organization_email_channel", { target_organization_id: organization.id, requested_enabled: parsed.data.enabled, requested_retention_days: parsed.data.retentionDays, acknowledge_processing: parsed.data.acknowledge === "on" });
  if (error) throw new Error("email_channel_update_failed");
  revalidatePath(`/app/${slug}/canaux/email`);
}
