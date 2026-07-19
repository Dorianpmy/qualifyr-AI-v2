import type { PlaybookSchema } from "@/features/playbooks/types";

export type IntakeFactValue = string | number | boolean;
export type IntakeFactStatus = "suggested" | "confirmed" | "conflicted" | "rejected" | "superseded";
export type IntakeExtraction = {
  detectedServiceKey: string | null;
  serviceConfidence: number;
  extractedFacts: Array<{ fieldKey:string; value:IntakeFactValue; valueType:"text"|"number"|"boolean"|"date"|"email"|"phone"|"country"|"city"|"postal_code"; confidence:number; sourceExcerpt:string; needsConfirmation:boolean }>;
  contradictions: Array<{ fieldKey:string; existingValue:IntakeFactValue; proposedValue:IntakeFactValue; explanation:string }>;
  missingInformationSummary: string[];
  proposedNextQuestion: string;
  responseMessage: string;
  requiresHumanReview: boolean;
};
export type IntakeContext = {
  locale:string;
  services:Array<{key:string;name:string}>;
  playbook:PlaybookSchema;
  knownValues:Record<string,unknown>;
  confirmedFacts:Record<string,IntakeFactValue>;
  recentMessages:Array<{role:"user"|"assistant"|"system_event";content:string}>;
};
export type FactForQuestion = {fieldKey:string;value:IntakeFactValue;status:IntakeFactStatus;confidence:number};
