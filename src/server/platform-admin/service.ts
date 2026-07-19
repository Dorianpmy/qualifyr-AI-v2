import "server-only";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireAuthContext } from "@/server/auth/get-auth-context";

export type PlatformOrganization = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  members_count: number;
  dossiers_count: number;
};

export type PlatformOverview = {
  organizations_count: number;
  users_count: number;
  dossiers_count: number;
  organizations: PlatformOrganization[];
};

export async function isPlatformAdmin() {
  await requireAuthContext();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("is_platform_admin");
  return !error && data === true;
}

export async function requirePlatformAdmin() {
  if (!(await isPlatformAdmin())) redirect("/app");
}

export async function getPlatformOverview(): Promise<PlatformOverview> {
  await requirePlatformAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_platform_admin_overview");
  if (error || !data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("platform_overview_unavailable");
  }
  return data as unknown as PlatformOverview;
}
