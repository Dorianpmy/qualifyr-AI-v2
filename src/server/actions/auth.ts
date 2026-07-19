"use server";

import { redirect } from "next/navigation";

import { getPublicEnv } from "@/config/env";
import { i18nConfig } from "@/config/i18n";
import { authMessages } from "@/features/auth/messages";
import { forgotPasswordSchema, formDataObject, resendConfirmationSchema, resetPasswordSchema, signInSchema, signUpSchema } from "@/features/auth/schemas";
import type { AuthActionState } from "@/features/auth/state";
import { maskEmail, safeInternalPath } from "@/features/auth/utils";
import { createClient } from "@/lib/supabase/server";

export async function signInAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = signInSchema.safeParse(formDataObject(formData, ["email", "password", "next"]));
  if (!parsed.success) return { status: "error", message: authMessages.signIn.invalid };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
  if (error) return { status: "error", message: authMessages.signIn.invalid };

  redirect(safeInternalPath(parsed.data.next, "/app"));
}

export async function signUpAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = signUpSchema.safeParse(formDataObject(formData, ["firstName", "lastName", "email", "password", "passwordConfirmation", "next"]));
  if (!parsed.success) return { status: "error", message: authMessages.common.genericError };

  const env = getPublicEnv();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${env.NEXT_PUBLIC_APP_URL}/auth/callback?next=${encodeURIComponent(safeInternalPath(parsed.data.next, "/app"))}`,
      data: {
        first_name: parsed.data.firstName,
        last_name: parsed.data.lastName,
        locale: i18nConfig.defaultLocale,
        timezone: i18nConfig.defaultTimezone,
        primary_language: i18nConfig.defaultPrimaryLanguage,
      },
    },
  });
  if (error) return { status: "error", message: authMessages.common.genericError };
  if (data.session) redirect(safeInternalPath(parsed.data.next, "/app"));

  return { status: "email_confirmation", email: parsed.data.email, maskedEmail: maskEmail(parsed.data.email) };
}

export async function resendConfirmationAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = resendConfirmationSchema.safeParse(formDataObject(formData, ["email"]));
  if (!parsed.success) return { status: "success", message: authMessages.signUp.resendSuccess };

  const env = getPublicEnv();
  const supabase = await createClient();
  await supabase.auth.resend({
    type: "signup",
    email: parsed.data.email,
    options: { emailRedirectTo: `${env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/app` },
  });
  return { status: "success", message: authMessages.signUp.resendSuccess };
}

export async function forgotPasswordAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = forgotPasswordSchema.safeParse(formDataObject(formData, ["email"]));
  if (!parsed.success) return { status: "error", message: authMessages.common.genericError };

  const env = getPublicEnv();
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/reinitialiser-mot-de-passe`,
  });
  return { status: "success", message: authMessages.forgotPassword.success };
}

export async function resetPasswordAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = resetPasswordSchema.safeParse(formDataObject(formData, ["password", "passwordConfirmation"]));
  if (!parsed.success) return { status: "error", message: authMessages.common.genericError };

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError || !claimsData?.claims.sub) return { status: "error", message: authMessages.resetPassword.invalid };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { status: "error", message: authMessages.resetPassword.invalid };
  return { status: "success", message: authMessages.resetPassword.success };
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/connexion");
}
