import { createHmac, timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import {
  extractWhatsappTextMessages,
  whatsappWebhookSchema,
} from "@/features/whatsapp/schemas";
import { processWhatsappTextMessage } from "@/server/whatsapp/service";
import { getWhatsappPilotConfig } from "@/services/whatsapp/cloud-api";

export const runtime = "nodejs";

function signatureIsValid(payload: string, signature: string | null, appSecret: string) {
  if (!signature?.startsWith("sha256=")) return false;
  const received = signature.slice(7);
  const expected = createHmac("sha256", appSecret).update(payload).digest("hex");
  if (!/^[a-f0-9]{64}$/i.test(received) || received.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(received, "hex"), Buffer.from(expected, "hex"));
}

export async function GET(request: Request) {
  const config = getWhatsappPilotConfig();
  if (!config) return new NextResponse("Webhook unavailable", { status: 503 });
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  if (mode !== "subscribe" || token !== config.verifyToken || !challenge) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  return new NextResponse(challenge, { status: 200 });
}

export async function POST(request: Request) {
  const config = getWhatsappPilotConfig();
  if (!config) return new NextResponse("Webhook unavailable", { status: 503 });
  const payload = await request.text();
  if (!signatureIsValid(payload, request.headers.get("x-hub-signature-256"), config.appSecret)) {
    return new NextResponse("Invalid signature", { status: 401 });
  }
  let json: unknown;
  try { json = JSON.parse(payload); } catch { return new NextResponse("Invalid payload", { status: 400 }); }
  const parsed = whatsappWebhookSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ received: true });
  const messages = extractWhatsappTextMessages(parsed.data, config.phoneNumberId);
  try {
    for (const message of messages) await processWhatsappTextMessage(message, config);
    return NextResponse.json({ received: true });
  } catch {
    return new NextResponse("Processing failed", { status: 500 });
  }
}
