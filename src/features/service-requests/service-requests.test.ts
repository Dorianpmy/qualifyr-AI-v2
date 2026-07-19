import { describe, expect, it } from "vitest";

import { canAssignServiceRequest, canDeleteServiceRequest, canUpdateServiceRequest } from "./permissions";
import { createServiceRequestSchema, serviceRequestListSchema } from "./schemas";
import { canTransitionServiceRequest } from "./state-machine";

const valid = { title:"Dépannage chauffage",serviceLabel:"Chauffage",originalRequest:"La chaudière ne démarre plus depuis ce matin.",requesterFirstName:"Test",requesterLastName:"Synthétique",requesterEmail:" TEST@EXAMPLE.TEST ",requesterPhone:"",preferredContactChannel:"email",requesterLocale:"fr-FR",countryCode:"fr",postalCode:"69001",city:"Lyon",addressLine1:"",assignedUserId:"",requestId:"11111111-1111-4111-8111-111111111111" };

describe("service request domain", () => {
  it("normalizes email and country while keeping postal codes as strings", () => {
    const result=createServiceRequestSchema.parse(valid);
    expect(result.requesterEmail).toBe("test@example.test"); expect(result.countryCode).toBe("FR"); expect(result.postalCode).toBe("69001");
  });
  it("requires one contact channel and validates E.164", () => {
    expect(createServiceRequestSchema.safeParse({...valid,requesterEmail:"",requesterPhone:""}).success).toBe(false);
    expect(createServiceRequestSchema.safeParse({...valid,requesterEmail:"",requesterPhone:"0612345678",preferredContactChannel:"phone"}).success).toBe(false);
    expect(createServiceRequestSchema.safeParse({...valid,requesterEmail:"",requesterPhone:"+33123456789",preferredContactChannel:"phone"}).success).toBe(true);
  });
  it.each([
    ["FR", "75011"], ["BE", "1000"], ["LU", "L-1616"], ["CH", "8001"], ["PL", "00-001"], ["RO", "010011"],
  ])("accepts international country %s and postal code %s", (countryCode, postalCode) => {
    expect(createServiceRequestSchema.safeParse({...valid,countryCode,postalCode}).success).toBe(true);
  });
  it("requires the selected preferred channel to be present", () => {
    expect(createServiceRequestSchema.safeParse({...valid,requesterEmail:"",requesterPhone:"+33123456789",preferredContactChannel:"email"}).success).toBe(false);
  });
  it("enforces manual state transitions and reserves qualified/routed", () => {
    expect(canTransitionServiceRequest("new","collecting")).toBe(true); expect(canTransitionServiceRequest("closed","new")).toBe(true);
    expect(canTransitionServiceRequest("new","qualified")).toBe(false); expect(canTransitionServiceRequest("new","routed")).toBe(false);
  });
  it("centralizes owner, admin and member permissions", () => {
    const request={createdBy:"creator",assignedUserId:"assigned"};
    expect(canAssignServiceRequest("owner")).toBe(true); expect(canAssignServiceRequest("admin")).toBe(true); expect(canAssignServiceRequest("member")).toBe(false);
    expect(canUpdateServiceRequest("member","assigned",request)).toBe(true); expect(canUpdateServiceRequest("member","other",request)).toBe(false);
    expect(canDeleteServiceRequest("owner")).toBe(true); expect(canDeleteServiceRequest("admin")).toBe(false);
  });
  it("bounds and validates URL filters", () => { expect(serviceRequestListSchema.parse({page:"2",country:"PL"}).page).toBe(2); expect(serviceRequestListSchema.parse({page:"bad",status:"qualified"}).page).toBe(1); });
});
