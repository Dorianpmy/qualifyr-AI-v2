import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";
import { getAuthContext } from "@/server/auth/get-auth-context";

export default async function ResetPasswordPage() {
  const context = await getAuthContext();
  return <ResetPasswordForm validSession={Boolean(context)} />;
}
