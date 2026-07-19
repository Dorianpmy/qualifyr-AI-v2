import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";
import { redirectAuthenticatedUser } from "@/server/auth/get-auth-context";

export default async function ForgotPasswordPage() {
  await redirectAuthenticatedUser();
  return <ForgotPasswordForm />;
}
