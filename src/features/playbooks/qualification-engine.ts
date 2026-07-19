import type { PlaybookSchema, QualificationOutput } from "./types";

function present(value:unknown){return typeof value==="string"?value.trim().length>0:typeof value==="number"?Number.isFinite(value):typeof value==="boolean"?true:Array.isArray(value)?value.length>0:Boolean(value&&typeof value==="object");}
export function calculateQualification(input:{schema:PlaybookSchema;values:Record<string,unknown>;evidence:Record<string,unknown[]>;serviceAllowed:boolean;coverageMatched:boolean;contactAvailable:boolean}):QualificationOutput{
  const required=input.schema.fields.filter(field=>field.required);const completed=required.filter(field=>present(input.values[field.key]));
  const missingFields=required.filter(field=>!present(input.values[field.key])).map(field=>({key:field.key,label:field.label,type:"field" as const}));
  const proofsExpected=input.schema.proofs.reduce((sum,proof)=>sum+proof.minimum,0);const proofsReceived=input.schema.proofs.reduce((sum,proof)=>sum+Math.min(proof.minimum,input.evidence[proof.key]?.length??0),0);
  const missingProofs=input.schema.proofs.filter(proof=>(input.evidence[proof.key]?.length??0)<proof.minimum).map(proof=>({key:proof.key,label:proof.label,type:"proof" as const}));
  const checks=[{rule:"service_allowed",label:input.serviceAllowed?"Service autorisé":"Service indisponible",ok:input.serviceAllowed},{rule:"coverage_area",label:input.coverageMatched?"Zone couverte":"Zone non couverte",ok:input.coverageMatched},{rule:"contact_available",label:input.contactAvailable?"Contact disponible":"Email ou téléphone requis",ok:input.contactAvailable}];
  const passedRules=checks.filter(check=>check.ok).map(({rule,label})=>({rule,label}));passedRules.push({rule:"human_validation",label:"Validation humaine requise"});
  const failedRules=checks.filter(check=>!check.ok).map(({rule,label})=>({rule,label}));const missingInformation=[...missingFields,...missingProofs];
  return {requiredFieldsCompleted:completed.length,requiredFieldsTotal:required.length,proofsReceived,proofsExpected,missingInformation,passedRules,failedRules,humanValidationRequired:true,recommendedStatus:missingInformation.length||failedRules.length?"incomplete":"needs_review",nextAction:input.schema.nextAction};
}
