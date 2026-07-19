import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ServiceRequestForm } from "@/features/service-requests/components/service-request-form";
import { canAssignServiceRequest } from "@/features/service-requests/permissions";
import { createServiceRequestAction } from "@/server/actions/service-requests";
import { listOrganizationMembers } from "@/server/organizations/service";
import { requireServiceRequestContext } from "@/server/service-requests/service";

export default async function NewServiceRequestPage({params}:{params:Promise<{organizationSlug:string}>}){
  const {organizationSlug}=await params;const context=await requireServiceRequestContext(organizationSlug);const members=await listOrganizationMembers(context.organization.id);
  const options=members.filter(member=>member.status==="active").map(member=>({userId:member.user_id,name:[member.first_name,member.last_name].filter(Boolean).join(" ")||"Membre Qualifyr",role:member.role}));
  return <main className="mx-auto grid w-full max-w-4xl gap-6 p-4 sm:p-8"><PageHeader eyebrow={<Button asChild variant="link"><Link href={`/app/${organizationSlug}/dossiers`}><ArrowLeft/>Retour aux Dossiers</Link></Button>} title="Créer un Dossier" description="Enregistrez manuellement une demande de service réelle. Aucun traitement IA n’est lancé."/><Card className="hover:translate-y-0"><CardHeader><CardTitle>Nouvelle demande</CardTitle><CardDescription>Un email ou un téléphone international est obligatoire.</CardDescription></CardHeader><CardContent><ServiceRequestForm action={createServiceRequestAction.bind(null,organizationSlug)} canAssign={canAssignServiceRequest(context.role)} members={options} requestId={crypto.randomUUID()} defaults={{countryCode:context.organization.countryCode??"FR",requesterLocale:context.organization.locale??"fr-FR"}} submitLabel="Créer le Dossier"/></CardContent></Card></main>;
}
