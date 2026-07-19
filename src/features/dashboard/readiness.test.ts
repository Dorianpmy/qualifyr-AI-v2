import { describe, expect, it } from "vitest";

import { calculateOrganizationReadiness, getNextRecommendedAction } from "./readiness";

const complete = {
  organizationCreated: true,
  regionalSettingsComplete: true,
  role: "owner" as const,
  profileComplete: true,
  hasPendingInvitation: true,
  hasActiveOwner: true,
  expectsMultipleUsers: true,
  activeMembersCount: 2,
};

describe("organization dashboard readiness", () => {
  it("separates required and optional setup steps", () => {
    const status = calculateOrganizationReadiness({ ...complete, profileComplete: false, hasPendingInvitation: false, activeMembersCount: 1 });
    expect(status.state).toBe("ready_with_optional_steps");
    expect(status.completedRequired).toBe(status.requiredCount);
    expect(status.steps.filter((step) => step.optional)).toHaveLength(2);
  });

  it("marks missing regional settings as blocking", () => {
    expect(calculateOrganizationReadiness({ ...complete, regionalSettingsComplete: false }).state).toBe("needs_setup");
  });

  it.each(["owner", "admin", "member"] as const)("supports the %s role", (role) => {
    expect(calculateOrganizationReadiness({ ...complete, role }).steps).toHaveLength(6);
  });

  it("returns only deterministic actions to existing destinations", () => {
    expect(getNextRecommendedAction({ ...complete, regionalSettingsComplete: false }, "acme").href).toBe("#organisation");
    expect(getNextRecommendedAction({ ...complete, hasPendingInvitation: false, activeMembersCount: 1 }, "acme").title).toBe("Ajoutez un collaborateur");
    expect(getNextRecommendedAction({ ...complete, role: "member", hasPendingInvitation: false, activeMembersCount: 1 }, "acme").title).toBe("Votre espace est prêt pour la prochaine étape");
  });
});
