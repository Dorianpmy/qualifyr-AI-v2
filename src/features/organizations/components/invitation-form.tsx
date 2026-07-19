"use client";

import { useActionState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { organizationMessages as messages } from "@/features/organizations/messages";
import { initialOrganizationActionState } from "@/features/organizations/state";
import { createInvitationAction } from "@/server/actions/organizations";

export function InvitationForm({ organizationId, organizationSlug, allowAdmin }: { organizationId: string; organizationSlug: string; allowAdmin: boolean }) {
  const boundAction = createInvitationAction.bind(null, organizationId, organizationSlug);
  const [state, action, pending] = useActionState(boundAction, initialOrganizationActionState);
  return <form action={action} className="grid gap-4">
    {state.message ? <Alert variant={state.status === "error" ? "danger" : "success"} title={state.status === "error" ? "Invitation impossible" : messages.invitation.linkReady}>{state.message}</Alert> : null}
    <Field label={messages.invitation.email}><Input name="email" type="email" autoComplete="email" maxLength={254} required /></Field>
    <Field label={messages.invitation.role}><Select name="role" defaultValue="member"><option value="member">{messages.roles.member}</option>{allowAdmin ? <option value="admin">{messages.roles.admin}</option> : null}</Select></Field>
    <Button type="submit" loading={pending}>{messages.invitation.submit}</Button>
    {state.invitationUrl ? <Field label={messages.invitation.linkReady}><Input readOnly value={state.invitationUrl} aria-label={messages.invitation.linkReady} /></Field> : null}
  </form>;
}
