import "server-only";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type AuthContext = {
  userId: string;
};

export async function getAuthContext(): Promise<AuthContext | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims.sub) {
    return null;
  }

  return { userId: data.claims.sub };
}

export async function requireAuthContext(): Promise<AuthContext> {
  const context = await getAuthContext();
  if (!context) redirect("/connexion?erreur=session");
  return context;
}

export async function redirectAuthenticatedUser() {
  const context = await getAuthContext();
  if (context) redirect("/app");
}
