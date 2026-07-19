import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InvitationForm } from "@/features/organizations/components/invitation-form";
import { MemberActions } from "@/features/organizations/components/member-actions";
import { organizationMessages as messages } from "@/features/organizations/messages";
import { canManageMembers, canRemoveMember } from "@/features/organizations/permissions";
import { revokeInvitationAction } from "@/server/actions/organizations";
import { listOrganizationInvitations, listOrganizationMembers, requireOrganizationMembership } from "@/server/organizations/service";

export default async function MembersPage({ params }: { params: Promise<{ organizationSlug: string }> }) {
  const { organizationSlug } = await params;
  const organization = await requireOrganizationMembership(organizationSlug);
  const [members, invitations] = await Promise.all([
    listOrganizationMembers(organization.id),
    canManageMembers(organization.role) ? listOrganizationInvitations(organization.id) : Promise.resolve([]),
  ]);

  return <main className="mx-auto grid w-full max-w-[var(--content-max)] gap-6 p-4 sm:p-8"><Card className="hover:translate-y-0"><CardHeader><CardTitle>Équipe de {organization.name}</CardTitle><CardDescription>Les autorisations sont revérifiées côté serveur à chaque action.</CardDescription></CardHeader><CardContent className="grid gap-3">{members.map((member) => <div key={member.user_id} className="grid gap-3 rounded-[var(--radius-lg)] border p-4 sm:grid-cols-[1fr_auto] sm:items-center"><div><p className="font-semibold">{[member.first_name, member.last_name].filter(Boolean).join(" ") || member.email}</p><p className="text-xs text-muted-foreground">{member.email}</p><div className="mt-2 flex gap-2"><Badge>{messages.roles[member.role]}</Badge><Badge variant={member.status === "active" ? "success" : "warning"}>{messages.statuses[member.status]}</Badge></div></div>{member.status === "active" && member.role !== "owner" ? <MemberActions organizationId={organization.id} organizationSlug={organization.slug} userId={member.user_id} email={member.email} role={member.role} canChange={organization.role === "owner"} canRemove={canRemoveMember(organization.role, member.role)} /> : null}</div>)}</CardContent></Card>{canManageMembers(organization.role) ? <Card className="hover:translate-y-0"><CardHeader><CardTitle>{messages.invitation.title}</CardTitle><CardDescription>Le lien expire après sept jours et ne peut être utilisé qu’une fois.</CardDescription></CardHeader><CardContent><InvitationForm organizationId={organization.id} organizationSlug={organization.slug} allowAdmin={organization.role === "owner"} /></CardContent></Card> : null}{invitations.some((invitation) => invitation.status === "pending") ? <Card className="hover:translate-y-0"><CardHeader><CardTitle>Invitations en attente</CardTitle></CardHeader><CardContent className="grid gap-3">{invitations.filter((invitation) => invitation.status === "pending").map((invitation) => <div key={invitation.id} className="flex flex-wrap items-center gap-3 rounded-[var(--radius-lg)] border p-4"><div className="min-w-0 flex-1"><p className="truncate font-semibold">{invitation.email_normalized}</p><p className="text-xs text-muted-foreground">{messages.roles[invitation.role]} · expire le {new Intl.DateTimeFormat(organization.locale ?? "fr-FR", { dateStyle: "medium", timeZone: organization.timezone ?? "UTC" }).format(new Date(invitation.expires_at))}</p></div><form action={revokeInvitationAction.bind(null, organization.slug, invitation.id)}><Button type="submit" variant="ghost">Révoquer</Button></form></div>)}</CardContent></Card> : null}</main>;
}
