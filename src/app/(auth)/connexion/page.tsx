import { authMessages } from "@/features/auth/messages";
import { safeInternalPath } from "@/features/auth/utils";
import { SignInForm } from "@/features/auth/components/sign-in-form";
import { redirectAuthenticatedUser } from "@/server/auth/get-auth-context";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string; erreur?: string }> }) {
  await redirectAuthenticatedUser();
  const params = await searchParams;
  const message = params.erreur === "callback" ? authMessages.callback.failed : params.erreur === "session" ? authMessages.common.sessionExpired : undefined;
  return <SignInForm next={safeInternalPath(params.next, "/app")} {...(message ? { initialMessage: message } : {})} />;
}
