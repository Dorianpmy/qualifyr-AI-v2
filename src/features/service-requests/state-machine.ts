import type { ServiceRequestStatus } from "./types";

export const manualTransitions: Record<ServiceRequestStatus, readonly ServiceRequestStatus[]> = {
  new: ["collecting", "incomplete", "needs_review", "closed"],
  collecting: ["incomplete", "needs_review", "closed"],
  incomplete: ["collecting", "needs_review", "closed"],
  needs_review: ["collecting", "incomplete", "closed"],
  qualified: [],
  routed: [],
  closed: ["new"],
};

export function canTransitionServiceRequest(from: ServiceRequestStatus, to: ServiceRequestStatus) {
  return manualTransitions[from].includes(to);
}
