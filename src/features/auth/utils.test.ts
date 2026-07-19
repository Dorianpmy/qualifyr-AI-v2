import { describe, expect, it } from "vitest";

import { getAuthRedirect, isSafeInternalPath, maskEmail, safeInternalPath } from "./utils";

describe("authentication redirects", () => {
  it.each(["https://evil.test", "//evil.test", "/\\evil.test"])("rejects unsafe destination %s", (path) => {
    expect(isSafeInternalPath(path)).toBe(false);
    expect(safeInternalPath(path)).toBe("/app");
  });

  it("redirects an anonymous private request to sign-in", () => {
    expect(getAuthRedirect("/app/profil", false, "/app/profil?tab=identite")).toBe(
      "/connexion?next=%2Fapp%2Fprofil%3Ftab%3Didentite",
    );
  });

  it("allows an authenticated private request", () => {
    expect(getAuthRedirect("/app", true)).toBeNull();
  });

  it("redirects authenticated users away from guest-only pages without a loop", () => {
    expect(getAuthRedirect("/connexion", true)).toBe("/app");
    expect(getAuthRedirect("/app", true)).toBeNull();
  });

  it("treats an expired session as anonymous", () => {
    expect(getAuthRedirect("/app", false)).toBe("/connexion?next=%2Fapp");
  });
});

describe("email masking", () => {
  it("does not expose the full local part", () => {
    expect(maskEmail("ana.maria@example.test")).toBe("an•••••••@example.test");
  });
});
