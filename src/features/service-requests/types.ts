import type { OrganizationRole } from "@/features/organizations/permissions";

export const serviceRequestStatuses = ["new", "collecting", "incomplete", "needs_review", "qualified", "routed", "closed"] as const;
export type ServiceRequestStatus = (typeof serviceRequestStatuses)[number];
export type ContactChannel = "email" | "phone" | "none";
export type ServiceRequestRole = OrganizationRole;

export type ServiceRequestActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

export const initialServiceRequestActionState: ServiceRequestActionState = { status: "idle" };
