import type {OrganizationRole} from "@/features/organizations/permissions";
export const canManageHub=(role:OrganizationRole)=>role==="owner"||role==="admin";
