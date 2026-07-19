import type { OrganizationRole } from "@/features/organizations/permissions";
import {canUpdateServiceRequest,type ServiceRequestOwnership} from "@/features/service-requests/permissions";
export const canUseAiIntake=(role:OrganizationRole,userId:string,request:ServiceRequestOwnership)=>canUpdateServiceRequest(role,userId,request);
export const canViewAiExecutions=(role:OrganizationRole)=>role==="owner"||role==="admin";
