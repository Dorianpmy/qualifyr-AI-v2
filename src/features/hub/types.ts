export type HubCatalogStatus="available"|"planned"|"deprecated";
export type HubInstallationStatus="installed"|"active"|"disabled"|"removed";
export type HubIntegrationStatus="not_connected"|"configured"|"disabled"|"error";
export type HubActionState={status:"idle"|"success"|"error";message?:string};
