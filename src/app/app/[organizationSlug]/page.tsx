import Link from "next/link";
import { Globe2, ShieldCheck, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OrganizationHeader } from "@/features/organizations/components/organization-header";
import { organizationMessages as messages } from "@/features/organizations/messages";
import { listOrganizationMembers, listOrganizationsForUser, requireOrganizationMembership } from "@/server/organizations/service";

export default async function OrganizationPage({ params }: { params: Promise<{ organizationSlug: string }> }) {
  const { organizationSlug } = await params;
  const [organization, organizations] = await Promise.all([requireOrganizationMembership(organizationSlug), listOrganizationsForUser()]);
  const members = await listOrganizationMembers(organization.id);
  return <><OrganizationHeader organizations={organizations} current={organization} /><main className="mx-auto grid w-full max-w-[var(--content-max)] gap-6 p-4 sm:p-8"><Card className="hover:translate-y-0"><CardHeader><Badge variant="success"><ShieldCheck className="size-3" />{messages.roles[organization.role]}</Badge><CardTitle className="mt-3 text-2xl sm:text-3xl">{organization.name}</CardTitle><CardDescription>{messages.home.ready}</CardDescription></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2"><div className="rounded-[var(--radius-lg)] border bg-muted/35 p-5"><Globe2 className="mb-3 size-5 text-primary" /><h2 className="font-bold">{messages.home.regionalSettings}</h2><dl className="mt-3 grid grid-cols-2 gap-2 text-sm"><dt className="text-muted-foreground">Pays</dt><dd>{organization.countryCode ?? "—"}</dd><dt className="text-muted-foreground">Locale</dt><dd>{organization.locale ?? "—"}</dd><dt className="text-muted-foreground">Fuseau</dt><dd>{organization.timezone ?? "—"}</dd><dt className="text-muted-foreground">Devise</dt><dd>{organization.currency ?? "—"}</dd></dl></div><div className="rounded-[var(--radius-lg)] border bg-muted/35 p-5"><Users className="mb-3 size-5 text-primary" /><h2 className="font-bold">{messages.home.team}</h2><p className="mt-2 text-sm text-muted-foreground">{members.filter((member) => member.status === "active").length} membre(s) actif(s)</p><Button asChild variant="glass" className="mt-4"><Link href={`/app/${organization.slug}/membres`}>{messages.home.manageMembers}</Link></Button></div></CardContent></Card></main></>;
}
