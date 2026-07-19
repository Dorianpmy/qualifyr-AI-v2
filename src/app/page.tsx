import { redirect } from "next/navigation";

import { getAuthContext } from "@/server/auth/get-auth-context";

export default async function RootPage() {
  const auth = await getAuthContext();
  redirect(auth ? "/app" : "/connexion");
}
