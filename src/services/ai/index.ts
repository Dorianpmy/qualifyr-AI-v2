import "server-only";

import type { AiProvider } from "./ai-provider";
import { DisabledAiProvider } from "./disabled-ai-provider";

let provider: AiProvider | undefined;

export function getAiProvider(): AiProvider {
  provider ??= new DisabledAiProvider();
  return provider;
}

export { AiNotConfiguredError, aiRequestSchema } from "./ai-provider";
export type { AiProvider, AiRequest, AiResult } from "./ai-provider";
