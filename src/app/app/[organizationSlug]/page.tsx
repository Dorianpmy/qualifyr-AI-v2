import Link from "next/link";
import { ArrowRight, CheckCircle2, Circle, FilePlus2, FolderKanban, Globe2, ListChecks, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { formatOrganizationDate, getOrganizationGreeting, resolveIntlContext } from "@/config/i18n";
import { dashboardMessages as messages } from "@/features/dashboard/messages";
import { calculateOrganizationReadiness, getNextRecommendedAction } from "@/features/dashboard/readiness";
import { organizationMessages } from "@/features/organizations/messages";
import { serviceRequestMessages } from "@/features/service-requests/messages";
import { getOrganizationDashboard } from "@/server/dashboard/service";

function labelFromMap<T extends Record<string, string>>(map: T, value: string | null) {
  return value && value in map ? map[value as keyof T] : value ?? "—";
}

function countryLabel(countryCode: string | null, locale: string) {
  if (!countryCode) return "—";
  try { return new Intl.DisplayNames([locale], { type: "region" }).of(countryCode) ?? countryCode; }
  catch { return countryCode; }
}

export default async function OrganizationDashboardPage({ params }: { params: Promise<{ organizationSlug: string }> }) {
  const { organizationSlug } = await params;
  const data = await getOrganizationDashboard(organizationSlug);
  const intl = resolveIntlContext(data.organization.locale, data.organization.timezone);
  const readinessInput = {
    organizationCreated: true,
    regionalSettingsComplete: Boolean(data.organization.countryCode && data.organization.locale && data.organization.timezone && data.organization.currency && data.organization.primaryLanguage),
    role: data.currentUser.role,
    profileComplete: data.currentUser.profileComplete,
    hasPendingInvitation: (data.team.pendingInvitationsCount ?? 0) > 0,
    hasActiveOwner: data.team.hasActiveOwner,
    expectsMultipleUsers: data.organization.teamSizeRange !== "solo",
    activeMembersCount: data.team.activeMembersCount,
  };
  const setup = calculateOrganizationReadiness(readinessInput);
  const recommendedAction = getNextRecommendedAction(readinessInput, data.organization.slug);
  const greeting = getOrganizationGreeting(new Date(), intl.locale, intl.timezone);
  return <main className="mx-auto grid w-full max-w-[var(--content-max)] gap-6 p-4 sm:p-8">
    <PageHeader eyebrow={<Badge variant="success">{organizationMessages.roles[data.currentUser.role]}</Badge>} title={`${greeting}${data.currentUser.firstName ? ` ${data.currentUser.firstName}` : ""}, ${messages.title}`} description={`${data.organization.name} · ${formatOrganizationDate(new Date(), intl.locale, intl.timezone)}`} actions={<Button asChild variant="glass"><Link href={`/app/${data.organization.slug}/dossiers/nouveau`}><FilePlus2 />Créer un Dossier</Link></Button>} />

    <div className="grid gap-4 sm:grid-cols-3"><Card className="hover:translate-y-0"><CardHeader><CardDescription>Dossiers actifs</CardDescription><CardTitle className="text-3xl">{data.serviceRequests.activeCount}</CardTitle></CardHeader></Card><Card className="hover:translate-y-0"><CardHeader><CardDescription>Dossiers incomplets</CardDescription><CardTitle className="text-3xl">{data.serviceRequests.incompleteCount}</CardTitle></CardHeader></Card><Card className="hover:translate-y-0"><CardHeader><CardDescription>À valider</CardDescription><CardTitle className="text-3xl">{data.serviceRequests.reviewCount}</CardTitle></CardHeader></Card></div>

    <Card className="hover:translate-y-0"><CardHeader><FolderKanban className="mb-2 size-5 text-primary"/><CardTitle>Dossiers récents</CardTitle><CardDescription>Les cinq dernières demandes réellement enregistrées dans cette organisation.</CardDescription></CardHeader><CardContent>{data.serviceRequests.recent.length?<ul className="divide-y">{data.serviceRequests.recent.map(item=><li key={item.referenceCode} className="flex flex-wrap items-center gap-3 py-3"><Link className="font-mono text-sm font-bold text-primary hover:underline" href={`/app/${data.organization.slug}/dossiers/${item.referenceCode}`}>{item.referenceCode}</Link><span className="min-w-0 flex-1 truncate font-semibold">{item.title}</span><Badge>{serviceRequestMessages.statuses[item.status]}</Badge><span className="text-xs text-muted-foreground">{item.assigneeName??"Non attribué"} · {formatOrganizationDate(item.updatedAt,intl.locale,intl.timezone)}</span></li>)}</ul>:<p className="text-sm text-muted-foreground">Aucun Dossier pour le moment. La création manuelle est maintenant disponible.</p>}</CardContent><CardFooter><Button asChild variant="outline"><Link href={`/app/${data.organization.slug}/dossiers`}>Voir tous les Dossiers<ArrowRight/></Link></Button></CardFooter></Card>

    <div className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
      <Card id="organisation" className="hover:translate-y-0">
        <CardHeader><Globe2 className="mb-2 size-5 text-primary" aria-hidden="true" /><CardTitle>{messages.organization}</CardTitle><CardDescription>{messages.organizationDescription}</CardDescription></CardHeader>
        <CardContent><dl className="grid gap-x-5 gap-y-4 text-sm sm:grid-cols-2">
          <div><dt className="text-muted-foreground">Nom</dt><dd className="mt-1 font-semibold">{data.organization.name}</dd></div>
          <div><dt className="text-muted-foreground">Activité</dt><dd className="mt-1 font-semibold">{labelFromMap(organizationMessages.categories, data.organization.businessCategory)}</dd></div>
          <div><dt className="text-muted-foreground">Pays</dt><dd className="mt-1 font-semibold">{countryLabel(data.organization.countryCode, intl.locale)}</dd></div>
          <div><dt className="text-muted-foreground">Langue</dt><dd className="mt-1 font-semibold">{data.organization.primaryLanguage ?? "—"}</dd></div>
          <div><dt className="text-muted-foreground">Devise</dt><dd className="mt-1 font-semibold">{data.organization.currency ?? "—"}</dd></div>
          <div><dt className="text-muted-foreground">Fuseau horaire</dt><dd className="mt-1 break-words font-semibold">{data.organization.timezone ?? "—"}</dd></div>
          <div><dt className="text-muted-foreground">Créée le</dt><dd className="mt-1 font-semibold">{formatOrganizationDate(data.organization.createdAt, intl.locale, intl.timezone)}</dd></div>
          <div><dt className="text-muted-foreground">Taille d’équipe</dt><dd className="mt-1 font-semibold">{labelFromMap(organizationMessages.teamSizes, data.organization.teamSizeRange)}</dd></div>
        </dl></CardContent>
      </Card>

      <Card className="hover:translate-y-0">
        <CardHeader><CheckCircle2 className="mb-2 size-5 text-primary" aria-hidden="true" /><CardTitle>{messages.setup}</CardTitle><CardDescription>{setup.completedRequired} étapes obligatoires terminées sur {setup.requiredCount}. {messages.setupDescription}</CardDescription></CardHeader>
        <CardContent><ul className="grid gap-3">{setup.steps.map((step) => <li key={step.key} className="flex items-center gap-3 text-sm">{step.completed ? <CheckCircle2 className="size-4 shrink-0 text-[var(--success)]" aria-hidden="true" /> : <Circle className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />}<span className={step.completed ? "font-medium" : "text-muted-foreground"}>{step.label}</span>{step.optional ? <Badge className="ml-auto">Facultatif</Badge> : null}<span className="sr-only">{step.completed ? "terminée" : "à compléter"}</span></li>)}</ul></CardContent>
      </Card>
    </div>

    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="hover:translate-y-0">
        <CardHeader><Users className="mb-2 size-5 text-primary" aria-hidden="true" /><CardTitle>{messages.team}</CardTitle><CardDescription>{data.team.activeMembersCount} membre{data.team.activeMembersCount > 1 ? "s" : ""} actif{data.team.activeMembersCount > 1 ? "s" : ""}{data.team.pendingInvitationsCount === null ? "" : ` · ${data.team.pendingInvitationsCount} invitation(s) en attente`}</CardDescription></CardHeader>
        <CardContent><div className="flex flex-wrap gap-2" aria-label="Aperçu des membres actifs">{data.team.previews.map((member) => <span key={member.userId} title={member.displayName} aria-label={member.displayName} className="grid size-10 place-items-center rounded-full border bg-[var(--primary-soft)] text-xs font-bold text-primary">{member.initials}</span>)}</div></CardContent>
        <CardFooter><Button asChild variant="outline"><Link href={`/app/${data.organization.slug}/membres`}>Consulter les membres<ArrowRight /></Link></Button></CardFooter>
      </Card>

      <Card className="qualifyr-glass hover:translate-y-0">
        <CardHeader><ListChecks className="mb-2 size-5 text-primary" aria-hidden="true" /><CardTitle>{messages.nextAction}</CardTitle><CardDescription>{recommendedAction.title}</CardDescription></CardHeader>
        <CardContent><p className="text-sm leading-6 text-muted-foreground">{recommendedAction.description}</p></CardContent>
        {recommendedAction.href && recommendedAction.label ? <CardFooter><Button asChild variant="glass"><Link href={recommendedAction.href}>{recommendedAction.label}<ArrowRight /></Link></Button></CardFooter> : null}
      </Card>
    </div>

  </main>;
}
