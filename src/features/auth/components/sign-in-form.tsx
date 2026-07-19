"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { authMessages } from "@/features/auth/messages";
import { initialAuthActionState } from "@/features/auth/state";
import { signInAction } from "@/server/actions/auth";
import { AuthFormStatus } from "./auth-form-status";

export function SignInForm({ next, initialMessage }: { next?: string; initialMessage?: string }) {
  const [state, action, pending] = useActionState(signInAction, initialMessage ? { status: "error" as const, message: initialMessage } : initialAuthActionState);
  return <Card className="hover:translate-y-0"><CardHeader><CardTitle>{authMessages.signIn.title}</CardTitle><CardDescription>{authMessages.signIn.description}</CardDescription></CardHeader><CardContent><form action={action} className="grid gap-4">{next ? <input type="hidden" name="next" value={next} /> : null}<AuthFormStatus state={state} /><Field label={authMessages.common.email}><Input name="email" type="email" autoComplete="email" inputMode="email" maxLength={254} required /></Field><Field label={authMessages.common.password}><Input name="password" type="password" autoComplete="current-password" maxLength={128} required /></Field><div className="flex justify-end"><Link className="focus-ring rounded text-xs font-semibold text-primary-strong hover:underline" href="/mot-de-passe-oublie">{authMessages.signIn.forgot}</Link></div><Button type="submit" size="lg" loading={pending}>{authMessages.signIn.submit}</Button><p className="text-center text-sm text-muted-foreground">{authMessages.signIn.noAccount} <Link className="focus-ring rounded font-semibold text-foreground hover:underline" href={next ? `/inscription?next=${encodeURIComponent(next)}` : "/inscription"}>{authMessages.signIn.createAccount}</Link></p></form></CardContent></Card>;
}
