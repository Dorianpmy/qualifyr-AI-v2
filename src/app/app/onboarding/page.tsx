import { randomUUID } from "node:crypto";

import { OnboardingForm } from "@/features/organizations/components/onboarding-form";
import { OrganizationHeader } from "@/features/organizations/components/organization-header";
import { listOrganizationsForUser } from "@/server/organizations/service";

export default async function OrganizationOnboardingPage() {
  const organizations = await listOrganizationsForUser();
  return <><OrganizationHeader organizations={organizations} /><main className="min-h-[calc(100vh-5rem)] bg-[radial-gradient(circle_at_top,var(--primary-soft),transparent_42%)] px-4 py-10 sm:px-6"><OnboardingForm requestId={randomUUID()} /></main></>;
}
