import "server-only";

import { getServerEnv } from "@/config/env";

export type WhatsappPilotConfig = {
  verifyToken: string;
  appSecret: string;
  accessToken: string;
  phoneNumberId: string;
  graphApiVersion: string;
  organizationId: string;
  playbookVersionId: string;
};

export function getWhatsappPilotConfig(): WhatsappPilotConfig | null {
  const env = getServerEnv();
  const values = [
    env.WHATSAPP_VERIFY_TOKEN,
    env.WHATSAPP_APP_SECRET,
    env.WHATSAPP_ACCESS_TOKEN,
    env.WHATSAPP_PHONE_NUMBER_ID,
    env.WHATSAPP_GRAPH_API_VERSION,
    env.WHATSAPP_PILOT_ORGANIZATION_ID,
    env.WHATSAPP_PILOT_PLAYBOOK_VERSION_ID,
  ];
  if (values.every((value) => value === undefined)) return null;
  if (values.some((value) => value === undefined)) throw new Error("whatsapp_incomplete_configuration");
  return {
    verifyToken: env.WHATSAPP_VERIFY_TOKEN!,
    appSecret: env.WHATSAPP_APP_SECRET!,
    accessToken: env.WHATSAPP_ACCESS_TOKEN!,
    phoneNumberId: env.WHATSAPP_PHONE_NUMBER_ID!,
    graphApiVersion: env.WHATSAPP_GRAPH_API_VERSION!,
    organizationId: env.WHATSAPP_PILOT_ORGANIZATION_ID!,
    playbookVersionId: env.WHATSAPP_PILOT_PLAYBOOK_VERSION_ID!,
  };
}

export async function sendWhatsappText(config: WhatsappPilotConfig, to: string, body: string) {
  const response = await fetch(
    `https://graph.facebook.com/${config.graphApiVersion}/${config.phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: { preview_url: false, body: body.slice(0, 1_000) },
      }),
      signal: AbortSignal.timeout(15_000),
    },
  );
  if (!response.ok) throw new Error(`whatsapp_send_failed_${response.status}`);
  const result = (await response.json()) as { messages?: Array<{ id?: string }> };
  const providerMessageId = result.messages?.[0]?.id;
  if (!providerMessageId) throw new Error("whatsapp_send_invalid_response");
  return providerMessageId;
}

export type WhatsappDownloadedMedia = {
  bytes: Uint8Array;
  mimeType: string;
  size: number;
};

const MAX_MEDIA_BYTES = 15 * 1024 * 1024;
const ALLOWED_MEDIA_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

function isTrustedMetaMediaUrl(value: string) {
  const url = new URL(value);
  return url.protocol === "https:" && (
    url.hostname === "lookaside.fbsbx.com"
    || url.hostname.endsWith(".fbcdn.net")
    || url.hostname.endsWith(".facebook.com")
  );
}

export async function downloadWhatsappMedia(
  config: WhatsappPilotConfig,
  mediaId: string,
): Promise<WhatsappDownloadedMedia> {
  const metadataResponse = await fetch(
    `https://graph.facebook.com/${config.graphApiVersion}/${encodeURIComponent(mediaId)}`,
    {
      headers: { Authorization: `Bearer ${config.accessToken}` },
      signal: AbortSignal.timeout(15_000),
    },
  );
  if (!metadataResponse.ok) throw new Error(`whatsapp_media_metadata_failed_${metadataResponse.status}`);
  const metadata = (await metadataResponse.json()) as {
    url?: string;
    mime_type?: string;
    file_size?: number;
  };
  if (!metadata.url || !metadata.mime_type || !ALLOWED_MEDIA_TYPES.has(metadata.mime_type)) {
    throw new Error("whatsapp_media_type_unsupported");
  }
  if (!isTrustedMetaMediaUrl(metadata.url)) throw new Error("whatsapp_media_url_untrusted");
  if (metadata.file_size && metadata.file_size > MAX_MEDIA_BYTES) throw new Error("whatsapp_media_too_large");

  const mediaResponse = await fetch(metadata.url, {
    headers: { Authorization: `Bearer ${config.accessToken}` },
    redirect: "error",
    signal: AbortSignal.timeout(30_000),
  });
  if (!mediaResponse.ok) throw new Error(`whatsapp_media_download_failed_${mediaResponse.status}`);
  const bytes = new Uint8Array(await mediaResponse.arrayBuffer());
  if (bytes.byteLength > MAX_MEDIA_BYTES) throw new Error("whatsapp_media_too_large");
  return { bytes, mimeType: metadata.mime_type, size: bytes.byteLength };
}
