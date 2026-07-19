import type { OrganizationRole } from "@/features/organizations/permissions";

export type ServiceRequestOwnership = { createdBy: string; assignedUserId: string | null };

export function canCreateServiceRequest(role: OrganizationRole) { return ["owner", "admin", "member"].includes(role); }
export function canUpdateServiceRequest(role: OrganizationRole, userId: string, request: ServiceRequestOwnership) { return role !== "member" || request.createdBy === userId || request.assignedUserId === userId; }
export function canAssignServiceRequest(role: OrganizationRole) { return role === "owner" || role === "admin"; }
export function canArchiveServiceRequest(role: OrganizationRole, userId: string, request: ServiceRequestOwnership) { return role !== "member" || request.createdBy === userId || request.assignedUserId === userId; }
export function canRestoreServiceRequest(role: OrganizationRole) { return role === "owner" || role === "admin"; }
export function canExportServiceRequest(role: OrganizationRole) { return role === "owner" || role === "admin"; }
export function canDeleteServiceRequest(role: OrganizationRole) { return role === "owner"; }
