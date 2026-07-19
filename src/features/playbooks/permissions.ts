import type { OrganizationRole } from "@/features/organizations/permissions";
export const canManagePlaybooks=(role:OrganizationRole)=>role==="owner"||role==="admin";
export const canPublishPlaybooks=canManagePlaybooks;
export const canValidateQualification=canManagePlaybooks;
