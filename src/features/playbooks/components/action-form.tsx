"use client";

import {useActionState} from "react";
import {Alert} from "@/components/ui/alert";
import {Button} from "@/components/ui/button";
import {initialPlaybookActionState,type PlaybookActionState} from "@/features/playbooks/state";

type Action=(state:PlaybookActionState,formData:FormData)=>Promise<PlaybookActionState>;
export function PlaybookActionForm({action,children,label,variant="glass",className}:{action:Action;children?:React.ReactNode;label:string;variant?:"glass"|"outline"|"destructive";className?:string}){const [state,formAction,pending]=useActionState(action,initialPlaybookActionState);return <form action={formAction} className={className??"grid gap-4"}>{state.message?<Alert variant={state.status==="error"?"danger":"success"} title={state.status==="error"?"Action impossible":"Terminé"}>{state.message}</Alert>:null}{children}<div><Button type="submit" variant={variant} loading={pending}>{label}</Button></div></form>;}
