import { LogOut, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { BrandMark } from "@/components/ui/brand-mark";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { authMessages } from "@/features/auth/messages";
import { createClient } from "@/lib/supabase/server";
import { signOutAction } from "@/server/actions/auth";
import { requireAuthContext } from "@/server/auth/get-auth-context";

export default async function PrivateAppPage() {
  const context = await requireAuthContext();
  const supabase = await createClient();
  const [{ data: userData }, { data: profile }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("profiles").select("first_name,last_name,locale,timezone,currency,country_code,primary_language").eq("user_id", context.userId).maybeSingle(),
  ]);

  return <main className="min-h-screen px-4 py-6 sm:px-6"><header className="mx-auto flex max-w-4xl items-center gap-3"><BrandMark /><div><p className="font-extrabold tracking-[-0.025em]">{authMessages.brand.name}</p><p className="text-xs text-muted-foreground">{authMessages.privateArea.eyebrow}</p></div><div className="ml-auto"><ThemeToggle /></div></header><section className="mx-auto grid min-h-[calc(100vh-7rem)] max-w-4xl place-items-center py-10"><Card className="w-full max-w-2xl hover:translate-y-0"><CardHeader><Badge variant="success"><ShieldCheck className="size-3" />{authMessages.privateArea.eyebrow}</Badge><CardTitle className="mt-3 text-2xl sm:text-3xl">{authMessages.privateArea.title}{profile?.first_name ? `, ${profile.first_name}` : ""}</CardTitle><CardDescription>{authMessages.privateArea.description}</CardDescription></CardHeader><CardContent className="grid gap-5"><div className="rounded-[var(--radius-lg)] border bg-muted/40 p-4"><p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">{authMessages.privateArea.emailLabel}</p><p className="mt-2 break-all font-medium">{userData.user?.email ?? "—"}</p></div><form action={signOutAction}><Button type="submit" variant="glass"><LogOut />{authMessages.privateArea.signOut}</Button></form></CardContent></Card></section></main>;
}
