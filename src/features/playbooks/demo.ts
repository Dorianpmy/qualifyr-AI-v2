import type { PlaybookSchema } from "./types";

export const renovationDemoSchema:PlaybookSchema={
  fields:[
    {key:"project_type",label:"Type de projet",type:"text",required:true,question:"Quel type de rénovation souhaitez-vous ?"},
    {key:"description",label:"Description",type:"textarea",required:true,question:"Pouvez-vous décrire votre demande ?"},
    {key:"country",label:"Pays",type:"country",required:true,question:"Dans quel pays se situe le projet ?"},
    {key:"city",label:"Ville",type:"city",required:true,question:"Dans quelle ville ?"},
    {key:"postal_code",label:"Code postal",type:"postal_code",required:true,question:"Quel est le code postal ?"},
    {key:"surface",label:"Surface",type:"number",required:true,question:"Quelle surface est concernée en m² ?"},
    {key:"building_type",label:"Type de bâtiment",type:"text",required:true,question:"Quel est le type de bâtiment ?"},
    {key:"period",label:"Période",type:"text",required:true,question:"Quelle période envisagez-vous ?"},
    {key:"budget",label:"Budget",type:"number",required:false,question:"Avez-vous un budget indicatif ?"},
    {key:"availability",label:"Disponibilités",type:"text",required:true,question:"Quelles sont vos disponibilités ?"},
    {key:"first_name",label:"Prénom",type:"text",required:false,question:"Quel est votre prénom ?"},
    {key:"last_name",label:"Nom",type:"text",required:false,question:"Quel est votre nom ?"},
    {key:"email",label:"Email",type:"email",required:false,question:"Quelle est votre adresse email ?"},
    {key:"phone",label:"Téléphone",type:"phone",required:false,question:"Quel est votre téléphone ?"},
  ],proofs:[{key:"photos",label:"Photos de l’existant",minimum:1}],rules:[{type:"service_allowed"},{type:"coverage_area"},{type:"required_field"},{type:"required_photo"},{type:"contact_available"},{type:"human_validation"}],nextAction:"Visite technique recommandée.",
};
export const demoFieldsText=renovationDemoSchema.fields.map(field=>`${field.key}|${field.label}|${field.type}|${field.required?"oui":"non"}|${field.question}`).join("\n");
export const demoProofsText=renovationDemoSchema.proofs.map(proof=>`${proof.key}|${proof.label}|${proof.minimum}`).join("\n");
