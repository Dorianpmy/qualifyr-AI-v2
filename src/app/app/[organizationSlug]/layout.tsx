import { OrganizationShell } from "@/features/dashboard/components/organization-shell";
import { listOrganizationsForUser, requireOrganizationMembership } from "@/server/organizations/service";
import { isPlatformAdmin } from "@/server/platform-admin/service";

export default async function OrganizationLayout({ children, params }: { children: React.ReactNode; params: Promise<{ organizationSlug: string }> }) {
  const { organizationSlug } = await params;
  const [current, organizations, platformAdmin] = await Promise.all([
    requireOrganizationMembership(organizationSlug),
    listOrganizationsForUser(),
    isPlatformAdmin(),
  ]);
  return <OrganizationShell organizations={organizations} current={current} isPlatformAdmin={platformAdmin}>{children}</OrganizationShell>;
}
