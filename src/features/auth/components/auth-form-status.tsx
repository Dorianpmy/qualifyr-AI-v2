import { Alert } from "@/components/ui/alert";
import { authMessages } from "@/features/auth/messages";
import type { AuthActionState } from "@/features/auth/state";

export function AuthFormStatus({ state }: { state: AuthActionState }) {
  if (!state.message) return null;
  return <Alert variant={state.status === "error" ? "danger" : "success"} title={state.status === "error" ? authMessages.common.errorTitle : authMessages.common.successTitle}>{state.message}</Alert>;
}
