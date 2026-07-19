import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

const serverEnvSchema = publicEnvSchema.extend({
  SUPABASE_SECRET_KEY: z.string().min(1).optional(),
  AI_PROVIDER: z.enum(["disabled","vercel-ai-gateway"]).default("disabled"),
  AI_MODEL:z.string().regex(/^[a-z0-9-]+\/[A-Za-z0-9._-]+$/).default("openai/gpt-5.4"),
  AI_TIMEOUT_MS:z.coerce.number().int().min(1000).max(120000).default(20000),
  AI_MAX_OUTPUT_TOKENS:z.coerce.number().int().min(128).max(4096).default(1200),
  AI_TEMPERATURE:z.coerce.number().min(0).max(1).default(0),
  RESEND_API_KEY: z.string().startsWith("re_").optional(),
  RESEND_WEBHOOK_SECRET: z.string().min(20).optional(),
  INBOUND_EMAIL_DOMAIN: z.string().regex(/^[a-z0-9.-]+$/).optional(),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function getPublicEnv(): PublicEnv {
  return publicEnvSchema.parse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
}

export function getServerEnv(): ServerEnv {
  return serverEnvSchema.parse({
    ...getPublicEnv(),
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
    AI_PROVIDER: process.env.AI_PROVIDER,
    AI_MODEL:process.env.AI_MODEL,
    AI_TIMEOUT_MS:process.env.AI_TIMEOUT_MS,
    AI_MAX_OUTPUT_TOKENS:process.env.AI_MAX_OUTPUT_TOKENS,
    AI_TEMPERATURE:process.env.AI_TEMPERATURE,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_WEBHOOK_SECRET: process.env.RESEND_WEBHOOK_SECRET,
    INBOUND_EMAIL_DOMAIN: process.env.INBOUND_EMAIL_DOMAIN,
  });
}
