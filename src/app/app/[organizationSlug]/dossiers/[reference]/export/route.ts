import { canExportServiceRequest } from "@/features/service-requests/permissions";
import { serviceRequestReferenceSchema } from "@/features/service-requests/schemas";
import { createClient } from "@/lib/supabase/server";
import { getServiceRequestForOrganization, getServiceRequestHistory } from "@/server/service-requests/service";

export const dynamic="force-dynamic";

export async function GET(_request:Request,{params}:{params:Promise<{organizationSlug:string;reference:string}>}){
  const {organizationSlug,reference:rawReference}=await params;const parsedReference=serviceRequestReferenceSchema.safeParse(rawReference);if(!parsedReference.success)return new Response("Introuvable",{status:404});const reference=parsedReference.data;const {context,detail}=await getServiceRequestForOrganization(organizationSlug,reference);if(!canExportServiceRequest(context.role))return new Response("Introuvable",{status:404});const history=await getServiceRequestHistory(context.organization.id,detail.id);const supabase=await createClient();const {error}=await supabase.rpc("record_service_request_export",{target_organization_id:context.organization.id,target_reference:reference});if(error)return new Response("Export indisponible",{status:500});
  const payload={schemaVersion:1,exportedAt:new Date().toISOString(),dossier:{reference:detail.referenceCode,title:detail.title,source:detail.source,status:detail.status,service:detail.serviceLabel,originalRequest:detail.originalRequest,requester:{firstName:detail.requesterFirstName,lastName:detail.requesterLastName,email:detail.requesterEmail,phone:detail.requesterPhone,preferredContactChannel:detail.preferredContactChannel,locale:detail.requesterLocale},location:{countryCode:detail.countryCode,postalCode:detail.postalCode,city:detail.city,addressLine1:detail.addressLine1},assignedUserId:detail.assignedUserId,createdAt:detail.createdAt,updatedAt:detail.updatedAt,closedAt:detail.closedAt,archivedAt:detail.archivedAt},history:history.map(event=>({type:event.event_type,metadata:event.metadata,createdAt:event.created_at}))};
  return Response.json(payload,{headers:{"Cache-Control":"private, no-store, max-age=0","Content-Disposition":`attachment; filename="dossier-${reference}.json"`,"X-Content-Type-Options":"nosniff"}});
}
