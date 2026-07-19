"use client";
import {useActionState} from "react";
import {Alert} from "@/components/ui/alert";
import {Button} from "@/components/ui/button";
import {initialHubActionState} from "@/features/hub/state";
import type {HubActionState} from "@/features/hub/types";
type Action=(state:HubActionState,formData:FormData)=>Promise<HubActionState>;
export function HubActionForm({action,label,variant="outline",children}:{action:Action;label:string;variant?:"glass"|"outline"|"destructive";children?:React.ReactNode}){const [state,formAction,pending]=useActionState(action,initialHubActionState);return <form action={formAction} className="grid gap-2">{state.message?<Alert variant={state.status==="error"?"danger":"success"} title={state.status==="error"?"Action impossible":"Hub mis à jour"}>{state.message}</Alert>:null}{children}<Button type="submit" variant={variant} size="sm" loading={pending}>{label}</Button></form>;}
