import "server-only";

import { playbookSchema } from "@/features/playbooks/schemas";
import type { WhatsappTextMessage } from "@/features/whatsapp/schemas";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { extractIntake } from "@/server/ai-intake/orchestrator";
import { AiNotConfiguredError } from "@/services/ai";
import {
  sendWhatsappText,
  type WhatsappPilotConfig,
} from "@/services/whatsapp/cloud-api";

type IngestedWhatsappMessage = {
  event_id: string;
  organization_id: string;
  service_request_id: string;
  intake_session_id: string;
  source_message_id: string;
  playbook_version_id: string;
  locale: string;
  event_status: "processing" | "analyzed" | "replied" | "failed";
  response_message: string | null;
  created: boolean;
};

async function markFailed(eventId: string, cause: unknown) {
  const code = cause instanceof Error
    ? cause.message.toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 80)
    : "whatsapp_processing_failed";
  await getSupabaseAdmin().rpc("fail_whatsapp_message", {
    target_event_id: eventId,
    requested_failure_code: code || "whatsapp_processing_failed",
  });
}

export async function processWhatsappTextMessage(
  message: WhatsappTextMessage,
  config: WhatsappPilotConfig,
) {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.rpc("ingest_whatsapp_text_message", {
    target_organization_id: config.organizationId,
    target_playbook_version_id: config.playbookVersionId,
    requested_provider_message_id: message.id,
    requested_sender_phone: `+${message.from}`,
    requested_profile_name: message.profileName,
    requested_body: message.text.body,
    requested_received_at: new Date(Number(message.timestamp) * 1_000).toISOString(),
  });
  if (error || !data?.[0]) throw new Error("whatsapp_ingestion_failed");
  const ingested = data[0] as IngestedWhatsappMessage;
  if (!ingested.created) {
    if (ingested.response_message && ingested.event_status !== "replied") {
      const outboundId = await sendWhatsappText(config, message.from, ingested.response_message);
      const { error: sentError } = await admin.rpc("mark_whatsapp_reply_sent", {
        target_event_id: ingested.event_id,
        requested_provider_message_id: outboundId,
      });
      if (sentError) throw new Error("whatsapp_sent_status_failed");
    }
    return;
  }

  try {
    const [{ data: version, error: versionError }, { data: services, error: servicesError }, { data: facts, error: factsError }, { data: recentMessages, error: messagesError }] = await Promise.all([
      admin.from("playbook_versions").select("schema_definition").eq("organization_id", ingested.organization_id).eq("id", ingested.playbook_version_id).eq("status", "published").single(),
      admin.from("service_definitions").select("code,name").eq("organization_id", ingested.organization_id).eq("status", "active"),
      admin.from("extracted_facts").select("field_key,value,status,confidence").eq("organization_id", ingested.organization_id).eq("intake_session_id", ingested.intake_session_id).order("created_at", { ascending: false }),
      admin.from("intake_messages").select("role,content").eq("organization_id", ingested.organization_id).eq("intake_session_id", ingested.intake_session_id).order("sequence_number", { ascending: false }).limit(7),
    ]);
    if (versionError || servicesError || factsError || messagesError) throw new Error("whatsapp_context_unavailable");
    const schema = playbookSchema.parse(version.schema_definition);
    const normalizedFacts = (facts ?? []).map((fact) => ({
      field_key: fact.field_key,
      value: fact.value as string | number | boolean,
      status: fact.status,
      confidence: Number(fact.confidence),
    }));
    const knownValues = Object.fromEntries(
      normalizedFacts.filter((fact) => fact.status === "confirmed").map((fact) => [fact.field_key, fact.value]),
    );
    let responseMessage: string;
    try {
      const extraction = await extractIntake({
        organizationId: ingested.organization_id,
        correlationId: crypto.randomUUID(),
        locale: ingested.locale,
        message: message.text.body,
        services: services ?? [],
        schema,
        knownValues,
        facts: normalizedFacts,
        recentMessages: (recentMessages ?? []).reverse(),
      });
      const { error: completionError } = await admin.rpc("complete_whatsapp_intake", {
        target_event_id: ingested.event_id,
        requested_output: extraction.output,
        requested_provider: extraction.provider,
        requested_model: extraction.model,
        requested_instructions_version: extraction.instructionsVersion,
        requested_latency_ms: extraction.latencyMs,
        requested_input_tokens: extraction.usage?.inputTokens ?? 0,
        requested_output_tokens: extraction.usage?.outputTokens ?? 0,
        requested_correlation_id: crypto.randomUUID(),
      });
      if (completionError) throw new Error("whatsapp_completion_failed");
      responseMessage = extraction.output.responseMessage;
    } catch (cause) {
      if (!(cause instanceof AiNotConfiguredError)) throw cause;
      responseMessage = "Merci, votre demande a bien été enregistrée. Notre équipe va la vérifier et vous recontacter.";
      const { error: fallbackError } = await admin.rpc("complete_whatsapp_without_ai", {
        target_event_id: ingested.event_id,
        requested_response: responseMessage,
      });
      if (fallbackError) throw new Error("whatsapp_fallback_failed");
    }
    const outboundId = await sendWhatsappText(config, message.from, responseMessage);
    const { error: sentError } = await admin.rpc("mark_whatsapp_reply_sent", {
      target_event_id: ingested.event_id,
      requested_provider_message_id: outboundId,
    });
    if (sentError) throw new Error("whatsapp_sent_status_failed");
  } catch (cause) {
    await markFailed(ingested.event_id, cause);
    throw cause;
  }
}
