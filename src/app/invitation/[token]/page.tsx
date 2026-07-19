import { redirect } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AcceptInvitationForm } from "@/features/organizations/components/accept-invitation-form";
import { organizationMessages as messages } from "@/features/organizations/messages";
import { invitationTokenSchema } from "@/features/organizations/schemas";
import { getAuthContext } from "@/server/auth/get-auth-context";

export default async function InvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!invitationTokenSchema.safeParse(token).success) return <InvitationCard><p className="text-sm text-destructive">{messages.invitation.invalid}</p></InvitationCard>;
  if (!(await getAuthContext())) redirect(`/connexion?next=${encodeURIComponent(`/invitation/${token}`)}`);
  return <InvitationCard><AcceptInvitationForm token={token} /></InvitationCard>;
}

function InvitationCard({ children }: { children: React.ReactNode }) {
  return <main className="grid min-h-screen place-items-center px-4"><Card className="w-full max-w-lg hover:translate-y-0"><CardHeader><CardTitle>{messages.invitation.acceptTitle}</CardTitle><CardDescription>Vérifiez que vous utilisez l’adresse invitée avant de continuer.</CardDescription></CardHeader><CardContent>{children}</CardContent></Card></main>;
}
