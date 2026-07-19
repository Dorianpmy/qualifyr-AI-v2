"use client";

import { useActionState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { marketConfig } from "@/config/i18n";
import type { ServiceRequestActionState } from "@/features/service-requests/types";
import { initialServiceRequestActionState } from "@/features/service-requests/types";

type Defaults={title?:string;serviceLabel?:string;originalRequest?:string;requesterFirstName?:string|null;requesterLastName?:string|null;requesterEmail?:string|null;requesterPhone?:string|null;preferredContactChannel?:"email"|"phone"|"none";requesterLocale?:string|null;countryCode?:string;postalCode?:string;city?:string;addressLine1?:string|null;assignedUserId?:string|null;lockVersion?:number};
type MemberOption={userId:string;name:string;role:string};
type FormAction=(state:ServiceRequestActionState,formData:FormData)=>Promise<ServiceRequestActionState>;

export function ServiceRequestForm({action,canAssign=false,defaults={},members=[],requestId,submitLabel}: {action:FormAction;canAssign?:boolean;defaults?:Defaults;members?:MemberOption[];requestId?:string;submitLabel:string}){
  const [state,formAction,pending]=useActionState(action,initialServiceRequestActionState);const error=(name:string)=>state.fieldErrors?.[name]?.[0];
  return <form action={formAction} className="grid gap-8">
    {state.message?<Alert variant={state.status==="error"?"danger":"success"} title={state.status==="error"?"Action impossible":"Enregistré"}>{state.message}</Alert>:null}
    {requestId?<input type="hidden" name="requestId" value={requestId}/>:null}{defaults.lockVersion?<input type="hidden" name="lockVersion" value={defaults.lockVersion}/>:null}
    <fieldset className="grid gap-4"><legend className="mb-4 text-lg font-bold">Demande</legend><Field label="Titre" error={error("title")}><Input name="title" required maxLength={160} defaultValue={defaults.title}/></Field><Field label="Service demandé" error={error("serviceLabel")}><Input name="serviceLabel" required maxLength={120} defaultValue={defaults.serviceLabel}/></Field><Field label="Demande originale" hint="10 à 10 000 caractères. Le texte est conservé tel que saisi, sans analyse IA." error={error("originalRequest")}><Textarea name="originalRequest" required minLength={10} maxLength={10000} defaultValue={defaults.originalRequest}/></Field></fieldset>
    <fieldset className="grid gap-4 sm:grid-cols-2"><legend className="mb-4 text-lg font-bold sm:col-span-2">Demandeur</legend><Field label="Prénom" error={error("requesterFirstName")}><Input name="requesterFirstName" maxLength={80} defaultValue={defaults.requesterFirstName??""}/></Field><Field label="Nom" error={error("requesterLastName")}><Input name="requesterLastName" maxLength={80} defaultValue={defaults.requesterLastName??""}/></Field><Field label="Email" error={error("requesterEmail")}><Input name="requesterEmail" type="email" maxLength={254} defaultValue={defaults.requesterEmail??""}/></Field><Field label="Téléphone international" hint="Format E.164, par exemple +33123456789" error={error("requesterPhone")}><Input name="requesterPhone" type="tel" pattern="\+[1-9][0-9]{7,14}" defaultValue={defaults.requesterPhone??""}/></Field><Field label="Canal préféré" error={error("preferredContactChannel")}><Select name="preferredContactChannel" defaultValue={defaults.preferredContactChannel??"none"}><option value="none">Aucune préférence</option><option value="email">Email</option><option value="phone">Téléphone</option></Select></Field><Field label="Locale du demandeur" error={error("requesterLocale")}><Input name="requesterLocale" placeholder="fr-FR" defaultValue={defaults.requesterLocale??""}/></Field></fieldset>
    <fieldset className="grid gap-4 sm:grid-cols-2"><legend className="mb-4 text-lg font-bold sm:col-span-2">Localisation</legend><Field label="Pays" error={error("countryCode")}><Select name="countryCode" required defaultValue={defaults.countryCode??"FR"}>{Object.entries(marketConfig).map(([code,market])=><option key={code} value={code}>{market.label}</option>)}</Select></Field><Field label="Code postal" error={error("postalCode")}><Input name="postalCode" required maxLength={20} inputMode="text" defaultValue={defaults.postalCode}/></Field><Field label="Ville" error={error("city")}><Input name="city" required maxLength={120} defaultValue={defaults.city}/></Field><Field label="Adresse (facultative)" error={error("addressLine1")}><Input name="addressLine1" maxLength={200} defaultValue={defaults.addressLine1??""}/></Field></fieldset>
    {requestId&&canAssign?<Field label="Responsable interne (facultatif)"><Select name="assignedUserId" defaultValue={defaults.assignedUserId??""}><option value="">Non attribué</option>{members.map(member=><option key={member.userId} value={member.userId}>{member.name} · {member.role}</option>)}</Select></Field>:null}
    <div><Button type="submit" variant="glass" loading={pending}>{submitLabel}</Button></div>
  </form>;
}
