import { z } from "zod";

import { playbookFieldTypes } from "./types";

const emptyToUndefined = (value: unknown) => value === "" || value === null ? undefined : value;
export const playbookFieldSchema = z.object({
  key: z.string().regex(/^[a-z][a-z0-9_]{1,49}$/),
  label: z.string().trim().min(1).max(120),
  type: z.enum(playbookFieldTypes),
  required: z.boolean(),
  question: z.string().trim().min(1).max(240),
}).strict();
export const playbookProofSchema = z.object({ key:z.string().regex(/^[a-z][a-z0-9_]{1,49}$/),label:z.string().trim().min(1).max(120),minimum:z.number().int().min(1).max(20) }).strict();
export const playbookRuleSchema = z.object({ type:z.enum(["service_allowed","coverage_area","required_field","required_photo","contact_available","human_validation"]) }).strict();
export const playbookSchema = z.object({
  fields:z.array(playbookFieldSchema).min(1).max(50),
  proofs:z.array(playbookProofSchema).max(20),
  rules:z.array(playbookRuleSchema).min(1).max(20),
  nextAction:z.string().trim().min(1).max(240),
}).strict().superRefine((value,context)=>{
  const keys=value.fields.map(field=>field.key);if(new Set(keys).size!==keys.length)context.addIssue({code:"custom",path:["fields"],message:"Chaque champ doit avoir une clé unique."});
});
export const createServiceSchema=z.object({name:z.string().trim().min(2).max(120),description:z.preprocess(emptyToUndefined,z.string().trim().min(1).max(1000).optional()),requestId:z.string().uuid()}).strict();
export const coverageAreaSchema=z.object({serviceId:z.string().uuid(),areaType:z.enum(["country","city","postal_code"]),countryCode:z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/),value:z.string().trim().min(1).max(120)}).strict();
export const createPlaybookSchema=z.object({serviceId:z.string().uuid(),name:z.string().trim().min(2).max(160),description:z.preprocess(emptyToUndefined,z.string().trim().min(1).max(1000).optional()),requestId:z.string().uuid()}).strict();
export const editorSchema=z.object({versionId:z.string().uuid(),lockVersion:z.coerce.number().int().positive(),fields:z.string().min(1).max(20000),proofs:z.string().max(5000),nextAction:z.string().trim().min(1).max(240)}).strict();
export const versionIdSchema=z.object({versionId:z.string().uuid()}).strict();
export const associatePlaybookSchema=z.object({versionId:z.string().uuid()}).strict();

export function parseEditorSchema(fieldsText:string,proofsText:string,nextAction:string){
  const fields=fieldsText.split(/\r?\n/).filter(Boolean).map(line=>{const [key,label,type,required,question]=line.split("|").map(part=>part?.trim()??"");return {key,label,type,required:required==="oui"||required==="true",question};});
  const proofs=proofsText.split(/\r?\n/).filter(Boolean).map(line=>{const [key,label,minimum]=line.split("|").map(part=>part?.trim()??"");return {key,label,minimum:Number(minimum)};});
  return playbookSchema.safeParse({fields,proofs,rules:[{type:"service_allowed"},{type:"coverage_area"},{type:"required_field"},{type:"required_photo"},{type:"contact_available"},{type:"human_validation"}],nextAction});
}
