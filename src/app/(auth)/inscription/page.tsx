import { SignUpForm } from "@/features/auth/components/sign-up-form";
import { redirectAuthenticatedUser } from "@/server/auth/get-auth-context";

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  await redirectAuthenticatedUser();
  const { next } = await searchParams;
  return <SignUpForm {...(next ? { next } : {})} />;
}
