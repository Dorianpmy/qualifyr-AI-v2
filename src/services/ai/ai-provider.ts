import { z } from "zod";

export const aiRequestSchema = z.object({
  operation: z.string().min(1),
  input: z.unknown(),
  organizationId: z.uuid(),
  correlationId: z.string().min(1),
});

export type AiRequest = z.infer<typeof aiRequestSchema>;

export type AiResult<TOutput> = {
  output: TOutput;
  model: string;
  usage?: { inputTokens: number; outputTokens: number };
};

export interface AiProvider {
  readonly name: string;
  generate<TOutput>(request: AiRequest): Promise<AiResult<TOutput>>;
}

export class AiNotConfiguredError extends Error {
  constructor() {
    super("Aucun fournisseur IA n’est configuré pour cette fondation.");
    this.name = "AiNotConfiguredError";
  }
}
