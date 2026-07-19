"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { authMessages } from "@/features/auth/messages";
import { initialAuthActionState } from "@/features/auth/state";
import { resetPasswordAction } from "@/server/actions/auth";
import { AuthFormStatus } from "./auth-form-status";

export function ResetPasswordForm({ validSession }: { validSession: boolean }) {
  const [state, action, pending] = useActionState(resetPasswordAction, initialAuthActionState);
  if (!validSession) return <Card className="hover:translate-y-0"><CardHeader><CardTitle>{authMessages.resetPassword.title}</CardTitle></CardHeader><CardContent className="grid gap-4"><Alert variant="danger" title={authMessages.resetPassword.invalidTitle}>{authMessages.resetPassword.invalid}</Alert><Button asChild><Link href="/mot-de-passe-oublie">{authMessages.resetPassword.restart}</Link></Button></CardContent></Card>;
  return <Card className="hover:translate-y-0"><CardHeader><CardTitle>{authMessages.resetPassword.title}</CardTitle><CardDescription>{authMessages.resetPassword.description}</CardDescription></CardHeader><CardContent><form action={action} className="grid gap-4"><AuthFormStatus state={state} />{state.status === "success" ? <Button asChild><Link href="/app">{authMessages.resetPassword.continue}</Link></Button> : <><Field label={authMessages.common.password} hint={authMessages.signUp.passwordHint}><Input name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required /></Field><Field label={authMessages.common.passwordConfirmation}><Input name="passwordConfirmation" type="password" autoComplete="new-password" minLength={12} maxLength={128} required /></Field><Button type="submit" size="lg" loading={pending}>{authMessages.resetPassword.submit}</Button></>}</form></CardContent></Card>;
}
