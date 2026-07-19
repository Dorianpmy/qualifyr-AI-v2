"use client";

import { useActionState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { assignServiceRequestAction, archiveServiceRequestAction, deleteServiceRequestAction, transitionServiceRequestAction } from "@/server/actions/service-requests";
import { serviceRequestMessages } from "../messages";
import { manualTransitions } from "../state-machine";
import { initialServiceRequestActionState, type ServiceRequestStatus } from "../types";

export function ServiceRequestActions({slug,reference,status,lockVersion,members,canAssign,canArchive,canRestore,canDelete,archived}: {slug:string;reference:string;status:ServiceRequestStatus;lockVersion:number;members:Array<{userId:string;name:string;role:string}>;canAssign:boolean;canArchive:boolean;canRestore:boolean;canDelete:boolean;archived:boolean}){
  const [transitionState,transitionAction,transitionPending]=useActionState(transitionServiceRequestAction.bind(null,slug,reference),initialServiceRequestActionState);
  const [assignState,assignAction,assignPending]=useActionState(assignServiceRequestAction.bind(null,slug,reference),initialServiceRequestActionState);
  const [archiveState,archiveAction,archivePending]=useActionState(archiveServiceRequestAction.bind(null,slug,reference,!archived),initialServiceRequestActionState);
  const [deleteState,deleteAction,deletePending]=useActionState(deleteServiceRequestAction.bind(null,slug,reference),initialServiceRequestActionState);
  const state=[transitionState,assignState,archiveState,deleteState].find(item=>item.message);
  return <section aria-labelledby="actions-title" className="grid gap-5"><h2 id="actions-title" className="text-lg font-bold">Actions</h2>{state?.message?<Alert variant={state.status==="error"?"danger":"success"} title={state.status==="error"?"Action impossible":"Action terminée"}>{state.message}</Alert>:null}
    {manualTransitions[status].length?<form action={transitionAction} className="grid gap-3 rounded-[var(--radius-lg)] border p-4"><input type="hidden" name="lockVersion" value={lockVersion}/><Field label="Nouveau statut"><Select name="status">{manualTransitions[status].map(next=><option key={next} value={next}>{serviceRequestMessages.statuses[next]}</option>)}</Select></Field><Field label="Raison (facultative)"><Input name="reason" maxLength={240}/></Field><Button type="submit" variant="outline" loading={transitionPending}>Changer le statut</Button></form>:null}
    {canAssign?<form action={assignAction} className="grid gap-3 rounded-[var(--radius-lg)] border p-4"><input type="hidden" name="lockVersion" value={lockVersion}/><Field label="Responsable"><Select name="assignedUserId"><option value="">Non attribué</option>{members.map(member=><option key={member.userId} value={member.userId}>{member.name} · {member.role}</option>)}</Select></Field><Button type="submit" variant="outline" loading={assignPending}>Mettre à jour l’attribution</Button></form>:null}
    {(archived?canRestore:canArchive)?<form action={archiveAction}><input type="hidden" name="lockVersion" value={lockVersion}/><Button type="submit" variant="outline" loading={archivePending}>{archived?"Restaurer":"Archiver"}</Button></form>:null}
    {canDelete?<form action={deleteAction} className="grid gap-3 rounded-[var(--radius-lg)] border border-danger/25 p-4"><Field label={`Saisissez ${reference} pour supprimer définitivement`}><Input name="confirmationReference" required autoComplete="off"/></Field><Button type="submit" variant="destructive" loading={deletePending}>Supprimer définitivement</Button></form>:null}
  </section>;
}
