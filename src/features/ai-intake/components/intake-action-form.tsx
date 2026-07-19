"use client";
import {useActionState} from "react";
import {Alert} from "@/components/ui/alert";
import {Button} from "@/components/ui/button";
import {initialIntakeActionState,type IntakeActionState} from "@/features/ai-intake/state";
type Action=(state:IntakeActionState,formData:FormData)=>Promise<IntakeActionState>;
export function IntakeActionForm({action,label,children,variant="glass",className}:{action:Action;label:string;children?:React.ReactNode;variant?:"glass"|"outline"|"destructive";className?:string}){const [state,formAction,pending]=useActionState(action,initialIntakeActionState);return <form action={formAction} className={className??"grid gap-4"}>{state.message?<Alert title={state.status==="error"?"Action impossible":"Terminé"} variant={state.status==="error"?"danger":"success"}>{state.message}</Alert>:null}{children}<div><Button type="submit" variant={variant} loading={pending}>{label}</Button></div></form>;}
