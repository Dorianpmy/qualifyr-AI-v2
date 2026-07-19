import { requirePlatformAdmin } from "@/server/platform-admin/service";

export default async function PlatformAdminLayout({ children }: { children: React.ReactNode }) {
  await requirePlatformAdmin();
  return children;
}
