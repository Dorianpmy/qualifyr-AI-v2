export type AuthActionState = {
  status: "idle" | "error" | "success" | "email_confirmation";
  message?: string;
  maskedEmail?: string;
  email?: string;
};

export const initialAuthActionState: AuthActionState = { status: "idle" };
