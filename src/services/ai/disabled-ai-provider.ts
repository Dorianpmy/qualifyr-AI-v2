import {
  AiNotConfiguredError,
  type AiProvider,
  type AiRequest,
  type AiResult,
} from "./ai-provider";

export class DisabledAiProvider implements AiProvider {
  readonly name = "disabled";

  generate<TOutput>(request: AiRequest<TOutput>): Promise<AiResult<TOutput>> {
    void request;
    return Promise.reject(new AiNotConfiguredError());
  }
}
