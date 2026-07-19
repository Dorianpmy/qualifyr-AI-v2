import { SignUpForm } from "@/features/auth/components/sign-up-form";
import { isPlanId } from "@/features/billing/plans";
import { redirectAuthenticatedUser } from "@/server/auth/get-auth-context";

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ next?: string; plan?: string }> }) {
  await redirectAuthenticatedUser();
  const { next, plan } = await searchParams;
  return <SignUpForm {...(next ? { next } : {})} {...(isPlanId(plan) ? { plan } : {})} />;
}
