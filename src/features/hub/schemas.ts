import {z} from "zod";
export const hubActionSchema=z.object({identifier:z.string().regex(/^[a-z][a-z0-9-]{1,62}$/),action:z.enum(["install","activate","deactivate","remove","configure","enable","disable"]),configuration:z.string().max(32768).optional()}).strict();
export const hubPackSchema=z.object({code:z.string().regex(/^[a-z][a-z0-9-]{1,62}$/)}).strict();
export function parseHubConfiguration(value:string|undefined){if(!value?.trim())return {};const parsed:unknown=JSON.parse(value);if(!parsed||typeof parsed!=="object"||Array.isArray(parsed))throw new Error("invalid_configuration");return parsed as Record<string,unknown>;}
