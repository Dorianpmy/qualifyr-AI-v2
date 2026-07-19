"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { authMessages } from "@/features/auth/messages";
import { initialAuthActionState } from "@/features/auth/state";
import { resendConfirmationAction, signUpAction } from "@/server/actions/auth";
import { AuthFormStatus } from "./auth-form-status";

function EmailConfirmation({ email, maskedEmail }: { email: string; maskedEmail: string }) {
  const [state, action, pending] = useActionState(resendConfirmationAction, initialAuthActionState);
  return <Card className="hover:translate-y-0"><CardHeader><CardTitle>{authMessages.signUp.confirmationTitle}</CardTitle><CardDescription>{authMessages.signUp.confirmationDescription} <strong className="text-foreground">{maskedEmail}</strong>.</CardDescription></CardHeader><CardContent className="grid gap-4"><AuthFormStatus state={state} /><form action={action}><input type="hidden" name="email" value={email} /><Button className="w-full" type="submit" variant="glass" loading={pending}>{authMessages.signUp.resend}</Button></form><Button asChild variant="ghost"><Link href="/connexion">{authMessages.signUp.signIn}</Link></Button></CardContent></Card>;
}

export function SignUpForm() {
  const [state, action, pending] = useActionState(signUpAction, initialAuthActionState);
  if (state.status === "email_confirmation" && state.email && state.maskedEmail) return <EmailConfirmation email={state.email} maskedEmail={state.maskedEmail} />;
  return <Card className="hover:translate-y-0"><CardHeader><CardTitle>{authMessages.signUp.title}</CardTitle><CardDescription>{authMessages.signUp.description}</CardDescription></CardHeader><CardContent><form action={action} className="grid gap-4"><AuthFormStatus state={state} /><div className="grid gap-4 sm:grid-cols-2"><Field label={authMessages.common.firstName}><Input name="firstName" autoComplete="given-name" maxLength={80} required /></Field><Field label={authMessages.common.lastName}><Input name="lastName" autoComplete="family-name" maxLength={80} required /></Field></div><Field label={authMessages.common.email}><Input name="email" type="email" autoComplete="email" inputMode="email" maxLength={254} required /></Field><Field label={authMessages.common.password} hint={authMessages.signUp.passwordHint}><Input name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required /></Field><Field label={authMessages.common.passwordConfirmation}><Input name="passwordConfirmation" type="password" autoComplete="new-password" minLength={12} maxLength={128} required /></Field><Button type="submit" size="lg" loading={pending}>{authMessages.signUp.submit}</Button><p className="text-center text-sm text-muted-foreground">{authMessages.signUp.existing} <Link className="focus-ring rounded font-semibold text-foreground hover:underline" href="/connexion">{authMessages.signUp.signIn}</Link></p></form></CardContent></Card>;
}
