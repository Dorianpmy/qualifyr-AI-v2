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
