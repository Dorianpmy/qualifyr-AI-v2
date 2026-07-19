import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  resetPasswordForEmail: vi.fn(),
  getClaims: vi.fn(),
  updateUser: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("@/config/env", () => ({ getPublicEnv: () => ({ NEXT_PUBLIC_APP_URL: "http://localhost:3000" }) }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: mocks }),
}));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

import { initialAuthActionState } from "@/features/auth/state";
import { forgotPasswordAction, resetPasswordAction, signOutAction } from "./auth";

function form(values: Record<string, string>) {
  const data = new FormData();
  Object.entries(values).forEach(([key, value]) => data.set(key, value));
  return data;
}

describe("authentication actions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the same reset-request response regardless of provider result", async () => {
    mocks.resetPasswordForEmail.mockResolvedValueOnce({ error: null }).mockResolvedValueOnce({ error: new Error("unknown user") });
    const data = form({ email: "person@example.test" });
    const accepted = await forgotPasswordAction(initialAuthActionState, data);
    const hiddenFailure = await forgotPasswordAction(initialAuthActionState, data);
    expect(hiddenFailure).toEqual(accepted);
    expect(accepted.status).toBe("success");
  });

  it("rejects password reset without valid claims", async () => {
    mocks.getClaims.mockResolvedValue({ data: null, error: new Error("expired") });
    const result = await resetPasswordAction(initialAuthActionState, form({ password: "SecurePassword2026", passwordConfirmation: "SecurePassword2026" }));
    expect(result.status).toBe("error");
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it("updates a password for a valid recovery session", async () => {
    mocks.getClaims.mockResolvedValue({ data: { claims: { sub: "user-id" } }, error: null });
    mocks.updateUser.mockResolvedValue({ error: null });
    const result = await resetPasswordAction(initialAuthActionState, form({ password: "SecurePassword2026", passwordConfirmation: "SecurePassword2026" }));
    expect(result.status).toBe("success");
    expect(mocks.updateUser).toHaveBeenCalledWith({ password: "SecurePassword2026" });
  });

  it("signs out through Supabase", async () => {
    mocks.signOut.mockResolvedValue({ error: null });
    await signOutAction();
    expect(mocks.signOut).toHaveBeenCalledOnce();
  });
});
