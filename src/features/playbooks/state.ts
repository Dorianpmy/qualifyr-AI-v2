export type PlaybookActionState={status:"idle"|"success"|"error";message?:string;fieldErrors?:Record<string,string[]|undefined>};
export const initialPlaybookActionState:PlaybookActionState={status:"idle"};
