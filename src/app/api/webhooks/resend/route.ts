import { NextResponse } from "next/server";

import { getServerEnv } from "@/config/env";
import { resendReceivedEventSchema } from "@/features/email-intake/schemas";
import { processResendEmail } from "@/server/email-intake/service";
import { getResend } from "@/services/email/resend";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const payload = await request.text();
  const headers = { id: request.headers.get("svix-id") ?? "", timestamp: request.headers.get("svix-timestamp") ?? "", signature: request.headers.get("svix-signature") ?? "" };
  try {
    const secret = getServerEnv().RESEND_WEBHOOK_SECRET;
    if (!secret) return new NextResponse("Webhook unavailable", { status: 503 });
    const verified = getResend().webhooks.verify({ payload, headers, webhookSecret: secret });
    const parsed = resendReceivedEventSchema.safeParse(verified);
    if (!parsed.success) return NextResponse.json({ received: true });
    await processResendEmail(parsed.data);
    return NextResponse.json({ received: true });
  } catch {
    return new NextResponse("Invalid webhook", { status: 400 });
  }
}
