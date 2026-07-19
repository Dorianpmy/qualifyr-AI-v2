import type { PlaybookSchema } from "@/features/playbooks/types";
import type { FactForQuestion } from "./types";

export function chooseNextQuestion(input:{playbook:PlaybookSchema;facts:FactForQuestion[];serviceUncertain:boolean}){
  const conflict=input.facts.find(f=>f.status==="conflicted");if(conflict){const field=input.playbook.fields.find(f=>f.key===conflict.fieldKey);return field?`Pouvez-vous confirmer : ${field.question.charAt(0).toLowerCase()}${field.question.slice(1)}`:"Pouvez-vous confirmer l’information contradictoire ?";}
  if(input.serviceUncertain)return "Quel service correspond le mieux à votre demande ?";
  const known=new Set(input.facts.filter(f=>f.status==="confirmed"||(f.status==="suggested"&&f.confidence>=0.75)).map(f=>f.fieldKey));
  const routing=["project_type","country","city","postal_code","email","phone"];
  const required=input.playbook.fields.filter(f=>f.required&&!known.has(f.key)).sort((a,b)=>{const ai=routing.indexOf(a.key),bi=routing.indexOf(b.key);return (ai<0?99:ai)-(bi<0?99:bi);});
  if(required[0])return required[0].question;
  if(input.playbook.proofs[0])return `Pouvez-vous fournir : ${input.playbook.proofs[0].label.toLowerCase()} ?`;
  return "Souhaitez-vous confirmer les informations récapitulées ?";
}
