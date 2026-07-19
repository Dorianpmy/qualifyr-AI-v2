import { z } from "zod";

import { serviceRequestStatuses } from "./types";

const emptyToUndefined = (value: unknown) => value === "" || value === null ? undefined : value;
const optionalText = (max: number) => z.preprocess(emptyToUndefined, z.string().trim().min(1).max(max).optional());
const optionalEmail = z.preprocess(emptyToUndefined, z.string().trim().email().max(254).transform((value) => value.toLowerCase()).optional());
const optionalPhone = z.preprocess(emptyToUndefined, z.string().trim().regex(/^\+[1-9]\d{7,14}$/, "Utilisez le format international E.164, par exemple +33123456789.").optional());
const validateContact = (value: { requesterEmail?: string | undefined; requesterPhone?: string | undefined; preferredContactChannel: "email" | "phone" | "none" }, context: z.RefinementCtx) => {
  if (!value.requesterEmail && !value.requesterPhone) context.addIssue({ code: "custom", path: ["requesterEmail"], message: "Renseignez un email ou un téléphone." });
  if (value.preferredContactChannel === "email" && !value.requesterEmail) context.addIssue({ code: "custom", path: ["preferredContactChannel"], message: "Ajoutez un email pour utiliser ce canal." });
  if (value.preferredContactChannel === "phone" && !value.requesterPhone) context.addIssue({ code: "custom", path: ["preferredContactChannel"], message: "Ajoutez un téléphone pour utiliser ce canal." });
};

export const serviceRequestFormSchema = z.object({
  title: z.string().trim().min(3).max(160),
  serviceLabel: z.string().trim().min(2).max(120),
  originalRequest: z.string().trim().min(10).max(10_000),
  requesterFirstName: optionalText(80),
  requesterLastName: optionalText(80),
  requesterEmail: optionalEmail,
  requesterPhone: optionalPhone,
  preferredContactChannel: z.enum(["email", "phone", "none"]),
  requesterLocale: z.preprocess(emptyToUndefined, z.string().regex(/^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$/).optional()),
  countryCode: z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/),
  postalCode: z.string().trim().min(1).max(20),
  city: z.string().trim().min(1).max(120),
  addressLine1: optionalText(200),
}).strict().superRefine(validateContact);

export const createServiceRequestSchema = z.object({
  ...serviceRequestFormSchema._zod.def.shape,
  assignedUserId: z.preprocess(emptyToUndefined, z.string().uuid().optional()),
  requestId: z.string().uuid(),
}).strict().superRefine(validateContact);

export const updateServiceRequestSchema = z.object({
  ...serviceRequestFormSchema._zod.def.shape,
  lockVersion: z.coerce.number().int().positive(),
}).strict().superRefine(validateContact);

export const transitionServiceRequestSchema = z.object({
  status: z.enum(serviceRequestStatuses),
  reason: optionalText(240),
  lockVersion: z.coerce.number().int().positive(),
}).strict();

export const assignServiceRequestSchema = z.object({
  assignedUserId: z.preprocess(emptyToUndefined, z.string().uuid().optional()),
  lockVersion: z.coerce.number().int().positive(),
}).strict();

export const versionedActionSchema = z.object({ lockVersion: z.coerce.number().int().positive() }).strict();
export const deleteServiceRequestSchema = z.object({ confirmationReference: z.string().regex(/^D-[A-F0-9]{10}$/) }).strict();
export const serviceRequestReferenceSchema = z.string().regex(/^D-[A-F0-9]{10}$/);

export const serviceRequestListSchema = z.object({
  q: z.string().trim().max(80).optional().catch(undefined),
  status: z.enum(serviceRequestStatuses).optional().catch(undefined),
  assignee: z.string().uuid().optional().catch(undefined),
  country: z.string().regex(/^[A-Z]{2}$/).optional().catch(undefined),
  archive: z.enum(["active", "archived", "all"]).default("active").catch("active"),
  sort: z.enum(["updated_desc", "updated_asc", "created_desc", "created_asc"]).default("updated_desc").catch("updated_desc"),
  page: z.coerce.number().int().min(1).max(10_000).default(1).catch(1),
}).strict();
