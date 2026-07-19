import { describe, expect, it } from "vitest";

import { forgotPasswordSchema, resetPasswordSchema, signUpSchema } from "./schemas";

const validSignUp = {
  firstName: "  Ana   Maria ",
  lastName: "Popescu",
  email: "ANA@EXAMPLE.TEST",
  password: "Motdepasse2026",
  passwordConfirmation: "Motdepasse2026",
};

describe("authentication schemas", () => {
  it("normalizes names and email without assuming a French identity", () => {
    const result = signUpSchema.parse(validSignUp);
    expect(result).toMatchObject({ firstName: "Ana Maria", email: "ana@example.test" });
  });

  it("rejects an invalid email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "not-an-email" }).success).toBe(false);
  });

  it("rejects mismatched passwords", () => {
    expect(signUpSchema.safeParse({ ...validSignUp, passwordConfirmation: "Different2026" }).success).toBe(false);
  });

  it("rejects weak passwords", () => {
    expect(resetPasswordSchema.safeParse({ password: "onlylowercase", passwordConfirmation: "onlylowercase" }).success).toBe(false);
  });

  it("rejects overlong fields", () => {
    expect(signUpSchema.safeParse({ ...validSignUp, firstName: "a".repeat(81) }).success).toBe(false);
  });

  it("rejects unexpected properties", () => {
    expect(signUpSchema.safeParse({ ...validSignUp, role: "admin" }).success).toBe(false);
  });
});
