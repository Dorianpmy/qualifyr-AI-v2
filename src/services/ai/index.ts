import "server-only";

import type { AiProvider } from "./ai-provider";
import { DisabledAiProvider } from "./disabled-ai-provider";
import { AiSdkGatewayProvider } from "./ai-sdk-gateway-provider";
import {getServerEnv} from "@/config/env";

let provider: AiProvider | undefined;

export function getAiProvider(): AiProvider {
  if(!provider){const env=getServerEnv();provider=env.AI_PROVIDER==="vercel-ai-gateway"?new AiSdkGatewayProvider(env.AI_MODEL,env.AI_TIMEOUT_MS,env.AI_MAX_OUTPUT_TOKENS,env.AI_TEMPERATURE):new DisabledAiProvider();}
  return provider;
}

export function setAiProviderForTests(testProvider:AiProvider|undefined){if(process.env.NODE_ENV!=="test")throw new Error("test_only");provider=testProvider;}

export { AiNotConfiguredError, aiRequestSchema } from "./ai-provider";
export type { AiProvider, AiRequest, AiResult } from "./ai-provider";
