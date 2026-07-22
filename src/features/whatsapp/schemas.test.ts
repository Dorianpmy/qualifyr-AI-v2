import { describe, expect, it } from "vitest";

import { extractWhatsappTextMessages, whatsappWebhookSchema } from "./schemas";

describe("WhatsApp webhook schema", () => {
  it("extracts text messages and contact names", () => {
    const payload = whatsappWebhookSchema.parse({
      object: "whatsapp_business_account",
      entry: [{ id: "waba", changes: [{ field: "messages", value: {
        messaging_product: "whatsapp",
        metadata: { phone_number_id: "123" },
        contacts: [{ profile: { name: "Alice" }, wa_id: "33612345678" }],
        messages: [{ from: "33612345678", id: "wamid.1", timestamp: "1784721000", type: "text", text: { body: "Ma climatisation fuit." } }],
      } }] }],
    });
    expect(extractWhatsappTextMessages(payload)).toEqual([
      expect.objectContaining({ id: "wamid.1", profileName: "Alice", from: "33612345678" }),
    ]);
  });

  it("ignores unsupported message types and delivery statuses", () => {
    const payload = whatsappWebhookSchema.parse({
      object: "whatsapp_business_account",
      entry: [{ id: "waba", changes: [{ field: "messages", value: {
        messaging_product: "whatsapp",
        metadata: { phone_number_id: "123" },
        messages: [{ from: "33612345678", id: "wamid.2", timestamp: "1784721000", type: "image" }],
        statuses: [{ id: "wamid.out", status: "delivered" }],
      } }] }],
    });
    expect(extractWhatsappTextMessages(payload)).toEqual([]);
  });
});
