export type OrganizationRole = "owner" | "admin" | "member";

export function canInvite(role: OrganizationRole, invitedRole: OrganizationRole) {
  return role === "owner" ? invitedRole !== "owner" : role === "admin" && invitedRole === "member";
}

export function canManageMembers(role: OrganizationRole) {
  return role === "owner" || role === "admin";
}

export function canUpdateOrganization(role: OrganizationRole) {
  return role === "owner" || role === "admin";
}

export function canChangeRole(role: OrganizationRole, targetRole: OrganizationRole) {
  return role === "owner" && targetRole !== "owner";
}

export function canRemoveMember(role: OrganizationRole, targetRole: OrganizationRole) {
  return role === "owner" || (role === "admin" && targetRole === "member");
}
