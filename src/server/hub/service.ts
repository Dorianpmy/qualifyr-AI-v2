import "server-only";
import {createClient} from "@/lib/supabase/server";
import {requireOrganizationMembership} from "@/server/organizations/service";

export async function getHub(organizationSlug:string){const context=await requireOrganizationMembership(organizationSlug);const supabase=await createClient();const [modules,packs,agents,integrations,events]=await Promise.all([
 supabase.from("hub_module_definitions").select("id,identifier,version,name,description,category,icon,dependencies,catalog_status").order("name"),
 supabase.from("hub_pack_definitions").select("id,code,version,name,description,module_identifiers,recommended_agents").order("name"),
 supabase.from("hub_agent_definitions").select("id,identifier,version,name,description,catalog_status,authorized_tools,model_policy").order("name"),
 supabase.from("hub_integration_definitions").select("id,identifier,version,name,description,catalog_status").order("name"),
 supabase.from("hub_event_log").select("id,event_kind,subject_identifier,created_at").eq("organization_id",context.id).order("created_at",{ascending:false}).limit(8),
 ]);if(modules.error||packs.error||agents.error||integrations.error||events.error)throw new Error("hub_unavailable");const [installedModules,installedPacks,installedAgents,installedIntegrations]=await Promise.all([
 supabase.from("organization_hub_modules").select("module_definition_id,status,installed_at,updated_at,configuration").eq("organization_id",context.id),
 supabase.from("organization_hub_packs").select("pack_definition_id,status,applied_at").eq("organization_id",context.id),
 supabase.from("organization_hub_agents").select("agent_definition_id,status,installed_at,updated_at,configuration").eq("organization_id",context.id),
 supabase.from("organization_hub_integrations").select("integration_definition_id,status,last_synchronized_at,last_error_code,updated_at").eq("organization_id",context.id),
 ]);if(installedModules.error||installedPacks.error||installedAgents.error||installedIntegrations.error)throw new Error("hub_unavailable");return {context,modules:modules.data??[],packs:packs.data??[],agents:agents.data??[],integrations:integrations.data??[],events:events.data??[],installedModules:installedModules.data??[],installedPacks:installedPacks.data??[],installedAgents:installedAgents.data??[],installedIntegrations:installedIntegrations.data??[]};}
