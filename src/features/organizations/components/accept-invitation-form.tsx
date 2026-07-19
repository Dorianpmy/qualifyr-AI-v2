"use client";

import { useActionState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { organizationMessages as messages } from "@/features/organizations/messages";
import { initialOrganizationActionState } from "@/features/organizations/state";
import { acceptInvitationAction } from "@/server/actions/organizations";

export function AcceptInvitationForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(acceptInvitationAction.bind(null, token), initialOrganizationActionState);
  return <form action={action} className="grid gap-4">{state.message ? <Alert variant="danger" title="Invitation inaccessible">{state.message}</Alert> : null}<Button type="submit" loading={pending}>{messages.invitation.accept}</Button></form>;
}
