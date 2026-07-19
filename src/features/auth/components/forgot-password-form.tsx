"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { authMessages } from "@/features/auth/messages";
import { initialAuthActionState } from "@/features/auth/state";
import { forgotPasswordAction } from "@/server/actions/auth";
import { AuthFormStatus } from "./auth-form-status";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(forgotPasswordAction, initialAuthActionState);
  return <Card className="hover:translate-y-0"><CardHeader><CardTitle>{authMessages.forgotPassword.title}</CardTitle><CardDescription>{authMessages.forgotPassword.description}</CardDescription></CardHeader><CardContent><form action={action} className="grid gap-4"><AuthFormStatus state={state} /><Field label={authMessages.common.email}><Input name="email" type="email" autoComplete="email" inputMode="email" maxLength={254} required /></Field><Button type="submit" size="lg" loading={pending}>{authMessages.forgotPassword.submit}</Button><Button asChild variant="ghost"><Link href="/connexion">{authMessages.forgotPassword.back}</Link></Button></form></CardContent></Card>;
}
