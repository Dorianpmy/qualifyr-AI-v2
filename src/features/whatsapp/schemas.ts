import { z } from "zod";

const textMessageSchema = z.object({
  from: z.string().regex(/^\d{8,15}$/),
  id: z.string().min(1).max(200),
  timestamp: z.string().regex(/^\d+$/),
  type: z.literal("text"),
  text: z.object({ body: z.string().trim().min(1).max(5_000) }),
});

const imageMessageSchema = z.object({
  from: z.string().regex(/^\d{8,15}$/),
  id: z.string().min(1).max(200),
  timestamp: z.string().regex(/^\d+$/),
  type: z.literal("image"),
  image: z.object({
    id: z.string().min(1).max(200),
    mime_type: z.string().min(1).max(120),
    sha256: z.string().max(200).optional(),
    caption: z.string().trim().max(2_000).optional(),
  }),
});

const documentMessageSchema = z.object({
  from: z.string().regex(/^\d{8,15}$/),
  id: z.string().min(1).max(200),
  timestamp: z.string().regex(/^\d+$/),
  type: z.literal("document"),
  document: z.object({
    id: z.string().min(1).max(200),
    mime_type: z.string().min(1).max(120),
    sha256: z.string().max(200).optional(),
    filename: z.string().trim().min(1).max(240).optional(),
    caption: z.string().trim().max(2_000).optional(),
  }),
});

const supportedMessageSchema = z.discriminatedUnion("type", [
  textMessageSchema,
  imageMessageSchema,
  documentMessageSchema,
]);

export const whatsappWebhookSchema = z.object({
  object: z.literal("whatsapp_business_account"),
  entry: z.array(z.object({
    id: z.string(),
    changes: z.array(z.object({
      field: z.literal("messages"),
      value: z.object({
        messaging_product: z.literal("whatsapp"),
        metadata: z.object({
          display_phone_number: z.string().optional(),
          phone_number_id: z.string(),
        }),
        contacts: z.array(z.object({
          profile: z.object({ name: z.string().trim().min(1).max(160) }),
          wa_id: z.string().regex(/^\d{8,15}$/),
        })).optional(),
        messages: z.array(z.unknown()).optional(),
        statuses: z.array(z.unknown()).optional(),
      }),
    })),
  })),
});

export type WhatsappTextMessage = z.infer<typeof textMessageSchema> & {
  profileName: string | null;
};
export type WhatsappInboundMessage = z.infer<typeof supportedMessageSchema> & {
  profileName: string | null;
};

export function extractWhatsappTextMessages(
  payload: z.infer<typeof whatsappWebhookSchema>,
  expectedPhoneNumberId?: string,
) {
  const messages: WhatsappTextMessage[] = [];
  for (const entry of payload.entry) {
    for (const change of entry.changes) {
      if (expectedPhoneNumberId && change.value.metadata.phone_number_id !== expectedPhoneNumberId) continue;
      const contacts = new Map(
        (change.value.contacts ?? []).map((contact) => [contact.wa_id, contact.profile.name]),
      );
      for (const candidate of change.value.messages ?? []) {
        const parsed = textMessageSchema.safeParse(candidate);
        if (parsed.success) {
          messages.push({ ...parsed.data, profileName: contacts.get(parsed.data.from) ?? null });
        }
      }
    }
  }
  return messages;
}

export function extractWhatsappInboundMessages(
  payload: z.infer<typeof whatsappWebhookSchema>,
  expectedPhoneNumberId?: string,
) {
  const messages: WhatsappInboundMessage[] = [];
  for (const entry of payload.entry) {
    for (const change of entry.changes) {
      if (expectedPhoneNumberId && change.value.metadata.phone_number_id !== expectedPhoneNumberId) continue;
      const contacts = new Map(
        (change.value.contacts ?? []).map((contact) => [contact.wa_id, contact.profile.name]),
      );
      for (const candidate of change.value.messages ?? []) {
        const parsed = supportedMessageSchema.safeParse(candidate);
        if (parsed.success) {
          messages.push({ ...parsed.data, profileName: contacts.get(parsed.data.from) ?? null });
        }
      }
    }
  }
  return messages;
}
