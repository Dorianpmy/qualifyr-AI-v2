import "server-only";

import { playbookSchema } from "@/features/playbooks/schemas";
import type { WhatsappInboundMessage, WhatsappTextMessage } from "@/features/whatsapp/schemas";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { extractIntake } from "@/server/ai-intake/orchestrator";
import {
  downloadWhatsappMedia,
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

function failureCode(cause: unknown) {
  return cause instanceof Error
    ? cause.message.toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 80)
    : "whatsapp_processing_failed";
}

async function recordAlert(organizationId: string, eventId: string, cause: unknown) {
  const code = failureCode(cause) || "whatsapp_processing_failed";
  console.error(JSON.stringify({ event: "whatsapp_processing_degraded", eventId, code }));
  await getSupabaseAdmin().from("whatsapp_operational_alerts").insert({
    organization_id: organizationId,
    event_id: eventId,
    severity: code.includes("not_configured") || code.includes("credit") ? "warning" : "error",
    code,
    details: {},
  });
}

function fallbackResponse(cause: unknown) {
  const code = failureCode(cause);
  if (code.includes("rate") || code.includes("timeout")) {
    return "Votre demande est bien enregistrée. Le service d’analyse est momentanément chargé ; notre équipe vérifiera votre dossier. Vous pouvez déjà joindre des photos et préciser l’adresse du chantier.";
  }
  return "Votre demande est bien enregistrée. Pour préparer votre dossier, vous pouvez préciser l’adresse du chantier, le délai souhaité et joindre des photos. Notre équipe gardera la validation finale.";
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
    const [{ data: version, error: versionError }, { data: services, error: servicesError }, { data: facts, error: factsError }, { data: recentMessages, error: messagesError }, { data: readyMedia, error: mediaError }] = await Promise.all([
      admin.from("playbook_versions").select("schema_definition").eq("organization_id", ingested.organization_id).eq("id", ingested.playbook_version_id).eq("status", "published").single(),
      admin.from("service_definitions").select("code,name").eq("organization_id", ingested.organization_id).eq("status", "active"),
      admin.from("extracted_facts").select("field_key,value,status,confidence").eq("organization_id", ingested.organization_id).eq("intake_session_id", ingested.intake_session_id).order("created_at", { ascending: false }),
      admin.from("intake_messages").select("role,content").eq("organization_id", ingested.organization_id).eq("intake_session_id", ingested.intake_session_id).order("sequence_number", { ascending: false }).limit(7),
      admin.from("whatsapp_media").select("id").eq("organization_id", ingested.organization_id).eq("service_request_id", ingested.service_request_id).eq("status", "ready"),
    ]);
    if (versionError || servicesError || factsError || messagesError || mediaError) throw new Error("whatsapp_context_unavailable");
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
        receivedProofKeys: readyMedia?.length ? schema.proofs.map((proof) => proof.key) : [],
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
      responseMessage = fallbackResponse(cause);
      const { error: fallbackError } = await admin.rpc("complete_whatsapp_without_ai", {
        target_event_id: ingested.event_id,
        requested_response: responseMessage,
      });
      if (fallbackError) throw new Error("whatsapp_fallback_failed");
      await recordAlert(ingested.organization_id, ingested.event_id, cause);
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

function safeFileName(value: string | undefined, mediaId: string, mimeType: string) {
  const extension = mimeType === "application/pdf" ? "pdf" : mimeType.split("/")[1]?.replace("jpeg", "jpg") ?? "bin";
  const base = (value ?? `media-${mediaId}.${extension}`)
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 160);
  return base || `media-${mediaId}.${extension}`;
}

async function processWhatsappMediaMessage(
  message: Extract<WhatsappInboundMessage, { type: "image" | "document" }>,
  config: WhatsappPilotConfig,
) {
  const media = message.type === "image" ? message.image : message.document;
  const fileName = safeFileName(message.type === "document" ? message.document.filename : undefined, media.id, media.mime_type);
  const synthetic: WhatsappTextMessage = {
    from: message.from,
    id: message.id,
    timestamp: message.timestamp,
    type: "text",
    text: { body: message.type === "image" ? `[Photo reçue${media.caption ? ` : ${media.caption}` : ""}]` : `[Document reçu : ${fileName}${media.caption ? ` — ${media.caption}` : ""}]` },
    profileName: message.profileName,
  };
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.rpc("ingest_whatsapp_text_message", {
    target_organization_id: config.organizationId,
    target_playbook_version_id: config.playbookVersionId,
    requested_provider_message_id: synthetic.id,
    requested_sender_phone: `+${synthetic.from}`,
    requested_profile_name: synthetic.profileName,
    requested_body: synthetic.text.body,
    requested_received_at: new Date(Number(synthetic.timestamp) * 1_000).toISOString(),
  });
  if (error || !data?.[0]) throw new Error("whatsapp_media_ingestion_failed");
  const ingested = data[0] as IngestedWhatsappMessage;
  if (!ingested.created) return processWhatsappTextMessage(synthetic, config);

  try {
    const { data: mediaId, error: registrationError } = await admin.rpc("register_whatsapp_media", {
      target_event_id: ingested.event_id,
      requested_provider_media_id: media.id,
      requested_media_kind: message.type,
      requested_mime_type: media.mime_type,
      requested_file_name: fileName,
      requested_sha256: media.sha256 ?? null,
    });
    if (registrationError || !mediaId) throw new Error("whatsapp_media_registration_failed");
    const downloaded = await downloadWhatsappMedia(config, media.id);
    const storagePath = `${ingested.organization_id}/${ingested.service_request_id}/${mediaId}-${fileName}`;
    const { error: uploadError } = await admin.storage.from("whatsapp-media").upload(storagePath, downloaded.bytes, {
      contentType: downloaded.mimeType,
      upsert: false,
    });
    if (uploadError) throw new Error("whatsapp_media_upload_failed");
    const { error: mediaUpdateError } = await admin.from("whatsapp_media").update({
      storage_path: storagePath,
      file_size: downloaded.size,
      mime_type: downloaded.mimeType,
      status: "ready",
      updated_at: new Date().toISOString(),
    }).eq("id", mediaId);
    if (mediaUpdateError) throw new Error("whatsapp_media_status_failed");

    const response = message.type === "image"
      ? "Photo bien reçue et ajoutée à votre dossier. Vous pouvez en envoyer d’autres ou préciser l’adresse et le délai souhaité."
      : "Document bien reçu et ajouté à votre dossier. Vous pouvez maintenant préciser l’adresse et le délai souhaité.";
    const { error: completionError } = await admin.rpc("complete_whatsapp_without_ai", {
      target_event_id: ingested.event_id,
      requested_response: response,
    });
    if (completionError) throw new Error("whatsapp_media_completion_failed");
    const outboundId = await sendWhatsappText(config, message.from, response);
    const { error: sentError } = await admin.rpc("mark_whatsapp_reply_sent", {
      target_event_id: ingested.event_id,
      requested_provider_message_id: outboundId,
    });
    if (sentError) throw new Error("whatsapp_sent_status_failed");
  } catch (cause) {
    await markFailed(ingested.event_id, cause);
    await recordAlert(ingested.organization_id, ingested.event_id, cause);
    throw cause;
  }
}

export async function processWhatsappInboundMessage(
  message: WhatsappInboundMessage,
  config: WhatsappPilotConfig,
) {
  if (message.type === "text") return processWhatsappTextMessage(message, config);
  return processWhatsappMediaMessage(message, config);
}
