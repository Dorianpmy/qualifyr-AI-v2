import "server-only";

import { playbookSchema } from "@/features/playbooks/schemas";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { extractIntake } from "@/server/ai-intake/orchestrator";
import { getResend } from "@/services/email/resend";
import type { ResendReceivedEvent } from "@/features/email-intake/schemas";

type IngestedEmail = {
  event_id: string; organization_id: string; reference_code: string; service_request_id: string;
  intake_session_id: string | null; source_message_id: string | null; playbook_version_id: string | null;
  locale: string; ai_enabled: boolean; created: boolean;
};

function emailAddress(value: string) {
  return value.match(/<([^>]+)>/)?.[1]?.toLowerCase() ?? value.trim().toLowerCase();
}

function plainText(text: string | null | undefined, html: string | null | undefined) {
  const source = text?.trim() || html?.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/\s+/g, " ").trim();
  if (!source || source.length < 10) throw new Error("email_body_missing");
  return source.slice(0, 10_000);
}

async function mark(eventId: string, status: "needs_review" | "failed" | "ignored", failureCode?: string) {
  const { error } = await getSupabaseAdmin().rpc("complete_inbound_email_processing", { target_event_id: eventId, requested_status: status, requested_failure_code: failureCode ?? null });
  if (error) throw new Error("inbound_status_failed");
}

async function analyze(ingested: IngestedEmail, body: string) {
  if (!ingested.ai_enabled || !ingested.intake_session_id || !ingested.source_message_id || !ingested.playbook_version_id) {
    await mark(ingested.event_id, "needs_review");
    return;
  }
  const admin = getSupabaseAdmin();
  const [{ data: version, error: versionError }, { data: services, error: servicesError }] = await Promise.all([
    admin.from("playbook_versions").select("schema_definition").eq("organization_id", ingested.organization_id).eq("id", ingested.playbook_version_id).eq("status", "published").single(),
    admin.from("service_definitions").select("code,name").eq("organization_id", ingested.organization_id).eq("status", "active"),
  ]);
  if (versionError || servicesError) throw new Error("email_playbook_unavailable");
  const schema = playbookSchema.parse(version.schema_definition);
  const extraction = await extractIntake({ organizationId: ingested.organization_id, correlationId: crypto.randomUUID(), locale: ingested.locale, message: body.slice(0, 5_000), services: services ?? [], schema, knownValues: {}, facts: [], recentMessages: [] });
  const assistant = extraction.output.responseMessage.slice(0, 1_000);
  const facts = extraction.output.extractedFacts.map((fact) => ({ organization_id: ingested.organization_id, service_request_id: ingested.service_request_id, intake_session_id: ingested.intake_session_id, field_key: fact.fieldKey, value: fact.value, value_type: fact.valueType, source_type: "ai_extraction", source_message_id: ingested.source_message_id, source_excerpt: fact.sourceExcerpt.slice(0, 160), confidence: fact.confidence, status: "suggested", created_by_type: "ai" }));
  if (facts.length) { const { error } = await admin.from("extracted_facts").insert(facts); if (error) throw new Error("email_fact_persistence_failed"); }
  const [{ error: messageError }, { error: executionError }, { error: sessionError }] = await Promise.all([
    admin.from("intake_messages").insert({ organization_id: ingested.organization_id, intake_session_id: ingested.intake_session_id, role: "assistant", content: assistant, sequence_number: 2 }),
    admin.from("ai_executions").insert({ organization_id: ingested.organization_id, service_request_id: ingested.service_request_id, intake_session_id: ingested.intake_session_id, source_message_id: ingested.source_message_id, operation_type: "intake_extraction", instructions_version: extraction.instructionsVersion, provider: extraction.provider, model: extraction.model, status: "succeeded", latency_ms: extraction.latencyMs, input_tokens: extraction.usage?.inputTokens ?? 0, output_tokens: extraction.usage?.outputTokens ?? 0, structured_output: extraction.output, correlation_id: crypto.randomUUID() }),
    admin.from("intake_sessions").update({ next_question: extraction.output.proposedNextQuestion, service_confidence: extraction.output.detectedServiceKey ? extraction.output.serviceConfidence : null, updated_at: new Date().toISOString() }).eq("organization_id", ingested.organization_id).eq("id", ingested.intake_session_id),
  ]);
  if (messageError || executionError || sessionError) throw new Error("email_analysis_persistence_failed");
  await mark(ingested.event_id, "needs_review");
}

export async function processResendEmail(event: ResendReceivedEvent) {
  const recipient = event.data.to[0]!;
  const routeKey = recipient.split("@")[0]?.toLowerCase();
  if (!routeKey || !/^[a-f0-9]{24}$/.test(routeKey)) return;
  const { data: received, error } = await getResend().emails.receiving.get(event.data.email_id);
  if (error || !received) throw new Error("received_email_unavailable");
  const body = plainText(received.text, received.html);
  const { data, error: ingestError } = await getSupabaseAdmin().rpc("ingest_inbound_email", {
    requested_route_key: routeKey, requested_provider_email_id: event.data.email_id,
    requested_message_id: event.data.message_id ?? null, requested_sender_email: emailAddress(event.data.from),
    requested_recipient: recipient, requested_subject: event.data.subject || "Sans objet", requested_body: body,
    requested_received_at: event.data.created_at, requested_attachment_count: event.data.attachments.length,
  });
  if (ingestError || !data?.[0]) throw new Error("email_ingestion_failed");
  const ingested = data[0] as IngestedEmail;
  if (!ingested.created) return;
  try { await analyze(ingested, body); } catch (cause) { await mark(ingested.event_id, "failed", cause instanceof Error ? cause.message.replace(/[^a-z0-9_]/g, "_").slice(0, 80) : "analysis_failed"); }
}
