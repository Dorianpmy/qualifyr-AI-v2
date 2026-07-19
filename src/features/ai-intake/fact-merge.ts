import type { FactForQuestion, IntakeFactValue } from "./types";
export type MergeDecision="create_suggested"|"same_value"|"replace_suggestion"|"create_conflict_preserve_confirmed";
export function decideFactMerge(existing:FactForQuestion|undefined,proposed:IntakeFactValue):MergeDecision{if(!existing)return "create_suggested";if(existing.value===proposed)return "same_value";if(existing.status==="confirmed")return "create_conflict_preserve_confirmed";return "replace_suggestion";}
export function parseHumanCorrection(raw:string,valueType:string):IntakeFactValue{if(valueType==="number"){const value=Number(raw);if(!Number.isFinite(value))throw new Error("invalid_number");return value;}if(valueType==="boolean")return raw==="true";return raw.trim();}
