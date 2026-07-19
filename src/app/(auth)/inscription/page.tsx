import { SignUpForm } from "@/features/auth/components/sign-up-form";
import { redirectAuthenticatedUser } from "@/server/auth/get-auth-context";

export default async function SignUpPage() {
  await redirectAuthenticatedUser();
  return <SignUpForm />;
}
