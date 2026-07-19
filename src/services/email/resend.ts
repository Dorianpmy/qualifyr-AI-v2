import "server-only";

import { Resend } from "resend";

import { getServerEnv } from "@/config/env";

let resendClient: Resend | null = null;

export function getResend(): Resend {
  const { RESEND_API_KEY } = getServerEnv();
  if (!RESEND_API_KEY) throw new Error("resend_not_configured");
  resendClient ??= new Resend(RESEND_API_KEY);
  return resendClient;
}
