import "server-only";

import { createHash, randomBytes } from "node:crypto";

export function createInvitationToken() {
  const token = randomBytes(32).toString("base64url");
  const hash = createHash("sha256").update(token, "utf8").digest("hex");
  return { token, hash };
}
