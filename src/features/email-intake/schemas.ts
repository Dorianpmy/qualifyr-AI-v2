import { z } from "zod";

export const resendReceivedEventSchema = z.object({
  type: z.literal("email.received"),
  created_at: z.iso.datetime(),
  data: z.object({
    email_id: z.uuid(),
    created_at: z.iso.datetime(),
    from: z.string().min(3).max(500),
    to: z.array(z.email()).min(1).max(20),
    received_for: z.array(z.email()).max(20).default([]),
    message_id: z.string().max(500).nullable().optional(),
    subject: z.string().max(300).nullable().optional(),
    attachments: z.array(z.object({ id: z.string(), filename: z.string().max(255), content_type: z.string().max(200) })).max(100).default([]),
  }),
});

export type ResendReceivedEvent = z.infer<typeof resendReceivedEventSchema>;
