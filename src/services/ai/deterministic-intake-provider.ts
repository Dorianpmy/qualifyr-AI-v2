import type { AiProvider, AiRequest, AiResult } from "./ai-provider";
import type { IntakeContext, IntakeExtraction } from "@/features/ai-intake/types";

export class DeterministicIntakeProvider implements AiProvider{
  readonly name="deterministic-test";
  async generate<TOutput>(request:AiRequest<TOutput>):Promise<AiResult<TOutput>>{
    const input=request.input as IntakeContext&{message:string};const message=input.message;const lower=message.toLocaleLowerCase(input.locale);const facts:IntakeExtraction["extractedFacts"]=[];
    const add=(fieldKey:string,value:string|number,valueType:IntakeExtraction["extractedFacts"][number]["valueType"],excerpt:string,confidence:number)=>{if(input.playbook.fields.some(field=>field.key===fieldKey))facts.push({fieldKey,value,valueType,confidence,sourceExcerpt:excerpt.slice(0,160),needsConfirmation:confidence<0.85});};
    if(lower.includes("namur"))add("city","Namur","city","Namur",0.97);
    if(/octobre/.test(lower))add("period","octobre","text","vers octobre",0.9);
    const surface=lower.match(/(\d+(?:[,.]\d+)?)\s*m[²2]/);if(surface?.[1])add("surface",Number(surface[1].replace(",",".")),"number",surface[0],0.94);
    if(lower.includes("salle de bain"))add("project_type","Rénovation salle de bain","text","refaire ma salle de bain",0.88);
    const detected=input.services.find(service=>lower.includes("salle de bain")&&service.name.toLocaleLowerCase(input.locale).includes("salle de bain"))??null;
    const output={detectedServiceKey:detected?.key??null,serviceConfidence:detected?0.9:0.2,extractedFacts:facts,contradictions:[],missingInformationSummary:input.playbook.fields.filter(field=>field.required&&!facts.some(f=>f.fieldKey===field.key)&&input.knownValues[field.key]===undefined).map(field=>field.label),proposedNextQuestion:"Pouvez-vous préciser votre demande ?",responseMessage:"J’ai relevé les informations présentes dans la demande. Pouvez-vous préciser votre projet ?",requiresHumanReview:!detected} satisfies IntakeExtraction;
    const parsed=request.outputSchema?.safeParse(output);if(parsed&&!parsed.success)throw new Error("invalid_output");return {output:(parsed?.success?parsed.data:output) as TOutput,model:"deterministic-intake-v1",usage:{inputTokens:0,outputTokens:0}};
  }
}
