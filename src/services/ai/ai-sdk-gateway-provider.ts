import "server-only";
import {generateText,Output} from "ai";
import type {AiProvider,AiRequest,AiResult} from "./ai-provider";

export class AiSdkGatewayProvider implements AiProvider{
  readonly name="vercel-ai-gateway";
  constructor(private readonly model:string,private readonly timeoutMs:number,private readonly maxTokens:number,private readonly temperature:number){}
  async generate<TOutput>(request:AiRequest<TOutput>):Promise<AiResult<TOutput>>{
    if(!request.outputSchema)throw new Error("output_schema_required");
    const result=await generateText({model:this.model,...(request.instructions?{system:request.instructions}:{}),prompt:JSON.stringify(request.input),output:Output.object({schema:request.outputSchema}),temperature:this.temperature,maxOutputTokens:this.maxTokens,maxRetries:1,timeout:{totalMs:this.timeoutMs},experimental_telemetry:{isEnabled:false}});
    return {output:result.output,model:this.model,usage:{inputTokens:result.usage.inputTokens??0,outputTokens:result.usage.outputTokens??0}};
  }
}
