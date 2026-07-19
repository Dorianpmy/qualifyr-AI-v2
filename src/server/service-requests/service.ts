import "server-only";

import { notFound } from "next/navigation";

import type { OrganizationRole } from "@/features/organizations/permissions";
import type { ServiceRequestStatus } from "@/features/service-requests/types";
import { createClient } from "@/lib/supabase/server";
import { requireAuthContext } from "@/server/auth/get-auth-context";
import { listOrganizationMembers, requireOrganizationMembership } from "@/server/organizations/service";

export type ServiceRequestListFilters = { q?: string|undefined; status?: ServiceRequestStatus|undefined; assignee?: string|undefined; country?: string|undefined; archive: "active"|"archived"|"all"; sort: "updated_desc"|"updated_asc"|"created_desc"|"created_asc"; page: number };
export type ServiceRequestListItem = { referenceCode:string; title:string; serviceLabel:string; requesterName:string|null; city:string; countryCode:string; status:ServiceRequestStatus; assigneeName:string|null; updatedAt:string; createdAt:string; archived:boolean };
export type ServiceRequestDetail = {
  id:string; organizationId:string; referenceCode:string; title:string; originalRequest:string; source:"manual"|"public_intake"|"email"|"chat"|"import"; status:ServiceRequestStatus; serviceLabel:string;
  requesterFirstName:string|null; requesterLastName:string|null; requesterEmail:string|null; requesterPhone:string|null; preferredContactChannel:"email"|"phone"|"none"; requesterLocale:string|null;
  countryCode:string; postalCode:string; city:string; addressLine1:string|null; assignedUserId:string|null; assigneeName:string|null; serviceDefinitionId:string|null; playbookVersionId:string|null; createdBy:string; updatedBy:string; createdAt:string; updatedAt:string; closedAt:string|null; archivedAt:string|null; lockVersion:number;
};
export type ServiceRequestContext = { organization:{id:string;slug:string;name:string;locale:string|null;timezone:string|null;countryCode:string|null}; userId:string; role:OrganizationRole };

export async function requireServiceRequestContext(organizationSlug:string):Promise<ServiceRequestContext>{
  const [{userId},organization]=await Promise.all([requireAuthContext(),requireOrganizationMembership(organizationSlug)]);
  return {organization:{id:organization.id,slug:organization.slug,name:organization.name,locale:organization.locale,timezone:organization.timezone,countryCode:organization.countryCode},userId,role:organization.role};
}

export async function listServiceRequestsForOrganization(organizationSlug:string,filters:ServiceRequestListFilters){
  const context=await requireServiceRequestContext(organizationSlug); const supabase=await createClient();
  const {data,error}=await supabase.rpc("list_service_requests",{target_organization_id:context.organization.id,...(filters.q?{search_query:filters.q}:{}),...(filters.status?{status_filter:filters.status}:{}),...(filters.assignee?{assignee_filter:filters.assignee}:{}),...(filters.country?{country_filter:filters.country}:{}),archive_filter:filters.archive,sort_order:filters.sort,page_number:filters.page,page_size:20});
  if(error) throw new Error("service_requests_unavailable");
  const items:ServiceRequestListItem[]=(data??[]).map(row=>({referenceCode:row.reference_code,title:row.title,serviceLabel:row.service_label,requesterName:row.requester_name,city:row.city,countryCode:row.country_code,status:row.status,assigneeName:row.assignee_name,updatedAt:row.updated_at,createdAt:row.created_at,archived:row.is_archived}));
  return {context,items,total:Number(data?.[0]?.total_count??0),pageSize:20};
}

export async function getServiceRequestForOrganization(organizationSlug:string,reference:string){
  const context=await requireServiceRequestContext(organizationSlug); const supabase=await createClient();
  const {data,error}=await supabase.from("service_requests").select("id,organization_id,reference_code,title,original_request,source,status,service_label,requester_first_name,requester_last_name,requester_email,requester_phone,preferred_contact_channel,requester_locale,country_code,postal_code,city,address_line_1,assigned_user_id,service_definition_id,playbook_version_id,created_by,updated_by,created_at,updated_at,closed_at,archived_at,lock_version").eq("organization_id",context.organization.id).eq("reference_code",reference).maybeSingle();
  if(error) throw new Error("service_request_unavailable"); if(!data) notFound();
  const members=await listOrganizationMembers(context.organization.id); const assignee=members.find(member=>member.user_id===data.assigned_user_id);
  const detail:ServiceRequestDetail={id:data.id,organizationId:data.organization_id,referenceCode:data.reference_code,title:data.title,originalRequest:data.original_request,source:data.source,status:data.status,serviceLabel:data.service_label,requesterFirstName:data.requester_first_name,requesterLastName:data.requester_last_name,requesterEmail:data.requester_email,requesterPhone:data.requester_phone,preferredContactChannel:data.preferred_contact_channel,requesterLocale:data.requester_locale,countryCode:data.country_code,postalCode:data.postal_code,city:data.city,addressLine1:data.address_line_1,assignedUserId:data.assigned_user_id,assigneeName:assignee?[assignee.first_name,assignee.last_name].filter(Boolean).join(" ")||"Membre Qualifyr":null,serviceDefinitionId:data.service_definition_id,playbookVersionId:data.playbook_version_id,createdBy:data.created_by,updatedBy:data.updated_by,createdAt:data.created_at,updatedAt:data.updated_at,closedAt:data.closed_at,archivedAt:data.archived_at,lockVersion:data.lock_version};
  return {context,detail,members:members.filter(member=>member.status==="active").map(member=>({userId:member.user_id,name:[member.first_name,member.last_name].filter(Boolean).join(" ")||"Membre Qualifyr",role:member.role}))};
}

export async function getServiceRequestHistory(organizationId:string,serviceRequestId:string){
  const supabase=await createClient(); const {data,error}=await supabase.from("service_request_events").select("id,event_type,actor_user_id,metadata,created_at").eq("organization_id",organizationId).eq("service_request_id",serviceRequestId).order("created_at",{ascending:false});
  if(error) throw new Error("service_request_history_unavailable"); return data;
}

export async function getServiceRequestDashboardData(organizationId:string){
  const supabase=await createClient();
  const [activeResult,incompleteResult,reviewResult,recentResult]=await Promise.all([
    supabase.from("service_requests").select("id",{count:"exact",head:true}).eq("organization_id",organizationId).is("archived_at",null).neq("status","closed"),
    supabase.from("service_requests").select("id",{count:"exact",head:true}).eq("organization_id",organizationId).is("archived_at",null).eq("status","incomplete"),
    supabase.from("service_requests").select("id",{count:"exact",head:true}).eq("organization_id",organizationId).is("archived_at",null).eq("status","needs_review"),
    supabase.from("service_requests").select("reference_code,title,status,updated_at,assigned_user_id").eq("organization_id",organizationId).order("updated_at",{ascending:false}).limit(5),
  ]);
  if(activeResult.error||incompleteResult.error||reviewResult.error||recentResult.error) throw new Error("dashboard_unavailable");
  const members=await listOrganizationMembers(organizationId);
  return {activeCount:activeResult.count??0,incompleteCount:incompleteResult.count??0,reviewCount:reviewResult.count??0,recent:(recentResult.data??[]).map(item=>({referenceCode:item.reference_code,title:item.title,status:item.status,updatedAt:item.updated_at,assigneeName:(()=>{const m=members.find(member=>member.user_id===item.assigned_user_id);return m?[m.first_name,m.last_name].filter(Boolean).join(" ")||"Membre Qualifyr":null;})()}))};
}
