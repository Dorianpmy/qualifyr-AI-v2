export type OrganizationActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  invitationUrl?: string;
};

export const initialOrganizationActionState: OrganizationActionState = { status: "idle" };
