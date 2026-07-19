import { OrganizationShell } from "@/features/dashboard/components/organization-shell";
import { listOrganizationsForUser, requireOrganizationMembership } from "@/server/organizations/service";

export default async function OrganizationLayout({ children, params }: { children: React.ReactNode; params: Promise<{ organizationSlug: string }> }) {
  const { organizationSlug } = await params;
  const [current, organizations] = await Promise.all([
    requireOrganizationMembership(organizationSlug),
    listOrganizationsForUser(),
  ]);
  return <OrganizationShell organizations={organizations} current={current}>{children}</OrganizationShell>;
}
