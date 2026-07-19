import { z } from "zod";

const valueSchema=z.union([z.string().max(500),z.number().finite(),z.boolean()]);
export const intakeMessageSchema=z.object({message:z.string().trim().min(1).max(5000),requestId:z.uuid()}).strict();
export const factResolutionSchema=z.object({factId:z.uuid(),action:z.enum(["confirm","reject","correct"]),value:z.string().max(500).optional()}).strict();

export function createIntakeExtractionSchema(allowedServices:string[],allowedFields:string[]){
  const fact=z.object({fieldKey:z.string(),value:valueSchema,valueType:z.enum(["text","number","boolean","date","email","phone","country","city","postal_code"]),confidence:z.number().min(0).max(1),sourceExcerpt:z.string().max(160),needsConfirmation:z.boolean()}).strict().superRefine((value,ctx)=>{if(!allowedFields.includes(value.fieldKey))ctx.addIssue({code:"custom",path:["fieldKey"],message:"Champ inconnu"});});
  return z.object({detectedServiceKey:z.string().nullable(),serviceConfidence:z.number().min(0).max(1),extractedFacts:z.array(fact).max(50),contradictions:z.array(z.object({fieldKey:z.string(),existingValue:valueSchema,proposedValue:valueSchema,explanation:z.string().min(1).max(240)}).strict()).max(20),missingInformationSummary:z.array(z.string().max(120)).max(50),proposedNextQuestion:z.string().min(1).max(500),responseMessage:z.string().min(1).max(1000),requiresHumanReview:z.boolean()}).strict().superRefine((value,ctx)=>{if(value.detectedServiceKey!==null&&!allowedServices.includes(value.detectedServiceKey))ctx.addIssue({code:"custom",path:["detectedServiceKey"],message:"Service inconnu"});for(const contradiction of value.contradictions)if(!allowedFields.includes(contradiction.fieldKey))ctx.addIssue({code:"custom",path:["contradictions"],message:"Champ inconnu"});});
}
