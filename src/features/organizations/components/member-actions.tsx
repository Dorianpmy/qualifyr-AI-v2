"use client";

import { useActionState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { organizationMessages as messages } from "@/features/organizations/messages";
import { initialOrganizationActionState } from "@/features/organizations/state";
import { removeMemberAction, updateMemberRoleAction } from "@/server/actions/organizations";

export function MemberActions({ organizationId, organizationSlug, userId, email, role, canChange, canRemove }: { organizationId: string; organizationSlug: string; userId: string; email: string; role: "admin" | "member"; canChange: boolean; canRemove: boolean }) {
  const [roleState, roleAction, rolePending] = useActionState(updateMemberRoleAction.bind(null, organizationId, organizationSlug, userId), initialOrganizationActionState);
  const [removeState, removeAction, removePending] = useActionState(removeMemberAction.bind(null, organizationId, organizationSlug, userId), initialOrganizationActionState);
  const state = roleState.message ? roleState : removeState;
  return <div className="grid gap-2">{state.message ? <Alert variant={state.status === "error" ? "danger" : "success"} title={state.status === "error" ? "Action impossible" : "Action terminée"}>{state.message}</Alert> : null}<div className="flex flex-wrap gap-2">{canChange ? <form action={roleAction} className="flex gap-2"><Select name="role" defaultValue={role} aria-label={`Rôle de ${email}`}><option value="member">{messages.roles.member}</option><option value="admin">{messages.roles.admin}</option></Select><Button type="submit" variant="outline" loading={rolePending}>Modifier</Button></form> : null}{canRemove ? <form action={removeAction}><Button type="submit" variant="destructive" loading={removePending}>Retirer</Button></form> : null}</div></div>;
}
