import { describe, expect, it } from "vitest";

import { AiNotConfiguredError } from "./ai-provider";
import { DisabledAiProvider } from "./disabled-ai-provider";

describe("DisabledAiProvider", () => {
  it("prevents accidental AI calls", async () => {
    const provider = new DisabledAiProvider();

    await expect(
      provider.generate({
        operation: "foundation-test",
        input: {},
        organizationId: "0f1e2d3c-4b5a-4678-9012-3456789abcde",
        correlationId: "test-1",
      }),
    ).rejects.toBeInstanceOf(AiNotConfiguredError);
  });
});
