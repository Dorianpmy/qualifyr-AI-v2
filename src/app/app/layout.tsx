import { requireAuthContext } from "@/server/auth/get-auth-context";

export default async function PrivateAppLayout({ children }: { children: React.ReactNode }) {
  await requireAuthContext();
  return children;
}
