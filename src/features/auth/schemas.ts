import { z } from "zod";

const normalizedName = z.string().trim().min(1).max(80).transform((value) => value.replace(/\s+/g, " "));
const email = z.email().max(254).transform((value) => value.trim().toLowerCase());
const password = z.string().min(12).max(128)
  .regex(/[a-z]/, "lowercase")
  .regex(/[A-Z]/, "uppercase")
  .regex(/[0-9]/, "digit");

export const signInSchema = z.strictObject({ email, password: z.string().min(1).max(128), next: z.string().max(512).optional() });
export const signUpSchema = z.strictObject({
  firstName: normalizedName,
  lastName: normalizedName,
  email,
  password,
  passwordConfirmation: z.string().max(128),
}).refine((value) => value.password === value.passwordConfirmation, { path: ["passwordConfirmation"], message: "password_mismatch" });
export const forgotPasswordSchema = z.strictObject({ email });
export const resetPasswordSchema = z.strictObject({ password, passwordConfirmation: z.string().max(128) })
  .refine((value) => value.password === value.passwordConfirmation, { path: ["passwordConfirmation"], message: "password_mismatch" });
export const resendConfirmationSchema = z.strictObject({ email });

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;

export function formDataObject(formData: FormData, keys: readonly string[]) {
  return Object.fromEntries(keys.map((key) => [key, formData.get(key)]));
}
