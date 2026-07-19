import Link from "next/link";
import { Building2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OrganizationHeader } from "@/features/organizations/components/organization-header";
import { redirectToOrganizationEntry } from "@/server/organizations/service";

export default async function PrivateAppPage() {
  const organizations = await redirectToOrganizationEntry();
  return <><OrganizationHeader organizations={organizations} /><main className="mx-auto grid min-h-[calc(100vh-8rem)] w-full max-w-[var(--content-max)] place-items-center p-4 sm:p-8"><Card className="w-full max-w-2xl hover:translate-y-0"><CardHeader><CardTitle>Vos organisations</CardTitle><CardDescription>Choisissez l’espace dans lequel vous souhaitez travailler.</CardDescription></CardHeader><CardContent className="grid gap-3">{organizations.map((organization) => <Button key={organization.id} asChild variant="glass" size="lg" className="justify-start"><Link href={`/app/${organization.slug}`}><Building2 />{organization.name}<span className="ml-auto text-xs text-muted-foreground">{organization.countryCode}</span></Link></Button>)}<Button asChild variant="outline"><Link href="/app/onboarding"><Plus />Créer une organisation</Link></Button></CardContent></Card></main></>;
}
