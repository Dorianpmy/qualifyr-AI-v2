import "server-only";

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
