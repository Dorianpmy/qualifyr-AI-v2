create type public.whatsapp_message_status as enum ('processing','analyzed','replied','failed');

create table public.whatsapp_conversations (
  id uuid primary key default extensions.gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  sender_phone text not null check (sender_phone ~ '^\+[1-9][0-9]{7,14}$'),
  profile_name text check (profile_name is null or char_length(trim(profile_name)) between 1 and 160),
  service_request_id uuid not null,
  intake_session_id uuid not null,
  status text not null default 'active' check (status in ('active','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id,id),
  unique (organization_id,sender_phone),
  foreign key (organization_id,service_request_id) references public.service_requests(organization_id,id) on delete cascade,
  foreign key (organization_id,intake_session_id) references public.intake_sessions(organization_id,id) on delete cascade
);

create table public.whatsapp_message_events (
  id uuid primary key default extensions.gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  conversation_id uuid not null,
  service_request_id uuid not null,
  intake_session_id uuid not null,
  source_message_id uuid not null,
  provider_message_id text not null check (char_length(provider_message_id) between 1 and 200),
  sender_phone text not null check (sender_phone ~ '^\+[1-9][0-9]{7,14}$'),
  status public.whatsapp_message_status not null default 'processing',
  response_message text check (response_message is null or char_length(response_message) between 1 and 1000),
  outbound_provider_message_id text check (outbound_provider_message_id is null or char_length(outbound_provider_message_id) between 1 and 200),
  failure_code text check (failure_code is null or failure_code ~ '^[a-z0-9_]{1,80}$'),
  received_at timestamptz not null,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (provider_message_id),
  unique (organization_id,id),
  foreign key (organization_id,conversation_id) references public.whatsapp_conversations(organization_id,id) on delete cascade,
  foreign key (organization_id,service_request_id) references public.service_requests(organization_id,id) on delete cascade,
  foreign key (organization_id,intake_session_id) references public.intake_sessions(organization_id,id) on delete cascade,
  foreign key (organization_id,source_message_id) references public.intake_messages(organization_id,id) on delete cascade
);

create index whatsapp_conversations_org_updated_idx on public.whatsapp_conversations(organization_id,updated_at desc);
create index whatsapp_message_events_org_created_idx on public.whatsapp_message_events(organization_id,created_at desc);

alter table public.whatsapp_conversations enable row level security;
alter table public.whatsapp_conversations force row level security;
alter table public.whatsapp_message_events enable row level security;
alter table public.whatsapp_message_events force row level security;
revoke all on public.whatsapp_conversations,public.whatsapp_message_events from anon,authenticated;
grant select on public.whatsapp_conversations,public.whatsapp_message_events to authenticated;
grant select,insert,update,delete on public.whatsapp_conversations,public.whatsapp_message_events to service_role;
-- Supabase projects created with the 2026 secure Data API defaults no longer
-- grant tables to service_role implicitly. These are the minimum privileges
-- used by the existing email intake and this WhatsApp server-side pipeline.
grant select on public.organizations,public.service_definitions,public.playbooks,public.playbook_versions,public.service_requests,public.service_request_events to service_role;
grant select,insert,update on public.intake_sessions,public.intake_messages,public.extracted_facts,public.ai_executions to service_role;
grant select on public.organization_email_channels,public.inbound_email_events to service_role;
create policy "managers read whatsapp conversations" on public.whatsapp_conversations for select to authenticated using ((select qualifyr_private.organization_role_for_user(organization_id)) in ('owner','admin'));
create policy "managers read whatsapp audit" on public.whatsapp_message_events for select to authenticated using ((select qualifyr_private.organization_role_for_user(organization_id)) in ('owner','admin'));

create function public.ingest_whatsapp_text_message(
  target_organization_id uuid,
  target_playbook_version_id uuid,
  requested_provider_message_id text,
  requested_sender_phone text,
  requested_profile_name text,
  requested_body text,
  requested_received_at timestamptz
) returns table(
  event_id uuid, organization_id uuid, service_request_id uuid, intake_session_id uuid,
  source_message_id uuid, playbook_version_id uuid, locale text, event_status public.whatsapp_message_status,
  response_message text, created boolean
) language plpgsql security definer set search_path='' as $$
declare
  org public.organizations%rowtype; version_row public.playbook_versions%rowtype;
  conversation public.whatsapp_conversations%rowtype; existing public.whatsapp_message_events%rowtype;
  actor uuid; service_id uuid; service_name text; new_request uuid; new_session uuid; new_message uuid; new_event uuid;
  new_reference text; next_sequence integer; attempt integer:=0; normalized_body text:=trim(requested_body);
begin
  if char_length(requested_provider_message_id) not between 1 and 200
    or requested_sender_phone !~ '^\+[1-9][0-9]{7,14}$'
    or char_length(normalized_body) not between 1 and 5000
    or requested_received_at is null then raise exception 'invalid_whatsapp_message'; end if;
  select * into org from public.organizations o where o.id=target_organization_id and o.archived_at is null;
  if not found then raise exception 'unknown_organization'; end if;
  select * into version_row from public.playbook_versions v where v.organization_id=target_organization_id and v.id=target_playbook_version_id and v.status='published';
  if not found then raise exception 'unknown_playbook_version'; end if;
  select p.service_definition_id,sd.name into service_id,service_name from public.playbooks p join public.service_definitions sd on sd.organization_id=p.organization_id and sd.id=p.service_definition_id where p.organization_id=target_organization_id and p.id=version_row.playbook_id and sd.status='active';
  if not found then raise exception 'inactive_playbook_service'; end if;
  select * into existing from public.whatsapp_message_events e where e.provider_message_id=requested_provider_message_id;
  if found then
    return query select existing.id,existing.organization_id,existing.service_request_id,existing.intake_session_id,existing.source_message_id,target_playbook_version_id,coalesce(org.locale,'fr-FR'),existing.status,existing.response_message,false;
    return;
  end if;
  actor:=org.created_by;
  select * into conversation from public.whatsapp_conversations c where c.organization_id=target_organization_id and c.sender_phone=requested_sender_phone and c.status='active' for update;
  if not found then
    loop
      attempt:=attempt+1; new_reference:='D-'||upper(substr(pg_catalog.encode(extensions.gen_random_bytes(8),'hex'),1,10));
      exit when not exists(select 1 from public.service_requests sr where sr.organization_id=target_organization_id and sr.reference_code=new_reference);
      if attempt>=5 then raise exception 'reference_generation_failed'; end if;
    end loop;
    insert into public.service_requests(
      organization_id,reference_code,title,original_request,source,status,service_label,requester_first_name,
      requester_phone,preferred_contact_channel,requester_locale,country_code,postal_code,city,created_by,updated_by,
      creation_request_id,service_definition_id,playbook_version_id
    ) values(
      target_organization_id,new_reference,left('Demande WhatsApp'||case when nullif(trim(requested_profile_name),'') is null then '' else ' - '||trim(requested_profile_name) end,160),
      case when char_length(normalized_body)>=10 then normalized_body else 'Message : '||normalized_body end,'chat','collecting',service_name,
      nullif(left(trim(requested_profile_name),80),''),requested_sender_phone,'phone',coalesce(org.locale,'fr-FR'),coalesce(org.country_code,'FR'),
      'À confirmer','À confirmer',actor,actor,extensions.gen_random_uuid(),service_id,target_playbook_version_id
    ) returning id into new_request;
    insert into public.service_request_events(organization_id,service_request_id,event_type,actor_user_id,metadata)
    values(target_organization_id,new_request,'created',actor,jsonb_build_object('source','whatsapp','automatic',true));
    insert into public.intake_sessions(organization_id,service_request_id,playbook_version_id,locale,created_by)
    values(target_organization_id,new_request,target_playbook_version_id,coalesce(org.locale,'fr-FR'),actor) returning id into new_session;
    insert into public.whatsapp_conversations(organization_id,sender_phone,profile_name,service_request_id,intake_session_id)
    values(target_organization_id,requested_sender_phone,nullif(trim(requested_profile_name),''),new_request,new_session) returning * into conversation;
  else
    new_request:=conversation.service_request_id; new_session:=conversation.intake_session_id;
    update public.whatsapp_conversations set profile_name=coalesce(nullif(trim(requested_profile_name),''),profile_name),updated_at=now() where id=conversation.id;
  end if;
  select coalesce(max(m.sequence_number),0)+1 into next_sequence from public.intake_messages m where m.intake_session_id=new_session;
  insert into public.intake_messages(organization_id,intake_session_id,role,content,sequence_number,request_id)
  values(target_organization_id,new_session,'user',normalized_body,next_sequence,extensions.gen_random_uuid()) returning id into new_message;
  insert into public.whatsapp_message_events(organization_id,conversation_id,service_request_id,intake_session_id,source_message_id,provider_message_id,sender_phone,received_at)
  values(target_organization_id,conversation.id,new_request,new_session,new_message,requested_provider_message_id,requested_sender_phone,requested_received_at) returning id into new_event;
  update public.service_requests set status='collecting',updated_at=now(),lock_version=lock_version+1 where id=new_request and status not in ('qualified','closed');
  return query select new_event,target_organization_id,new_request,new_session,new_message,target_playbook_version_id,coalesce(org.locale,'fr-FR'),'processing'::public.whatsapp_message_status,null::text,true;
end; $$;

create function public.complete_whatsapp_intake(
  target_event_id uuid, requested_output jsonb, requested_provider text, requested_model text,
  requested_instructions_version text, requested_latency_ms integer, requested_input_tokens integer,
  requested_output_tokens integer, requested_correlation_id uuid
) returns void language plpgsql security definer set search_path='' as $$
declare event_row public.whatsapp_message_events%rowtype; session_row public.intake_sessions%rowtype; fact jsonb; prior public.extracted_facts%rowtype; next_sequence integer; fact_status public.extracted_fact_status;
begin
  select * into event_row from public.whatsapp_message_events e where e.id=target_event_id for update;
  if not found then raise exception 'not_found'; end if;
  if event_row.status in ('analyzed','replied') then return; end if;
  select * into session_row from public.intake_sessions s where s.organization_id=event_row.organization_id and s.id=event_row.intake_session_id and s.status='active' for update;
  if not found or jsonb_typeof(requested_output)<>'object' or jsonb_typeof(requested_output->'extractedFacts')<>'array' or char_length(coalesce(requested_output->>'responseMessage','')) not between 1 and 1000 then raise exception 'invalid_output'; end if;
  if requested_output->>'detectedServiceKey' is not null and not exists(select 1 from public.service_definitions sd where sd.organization_id=event_row.organization_id and sd.code=requested_output->>'detectedServiceKey' and sd.status='active') then raise exception 'unknown_service'; end if;
  if not exists(select 1 from public.ai_executions a where a.intake_session_id=event_row.intake_session_id and a.source_message_id=event_row.source_message_id) then
    for fact in select value from jsonb_array_elements(requested_output->'extractedFacts') loop
      if not exists(select 1 from public.playbook_versions v,jsonb_array_elements(v.schema_definition->'fields') field where v.organization_id=event_row.organization_id and v.id=session_row.playbook_version_id and field->>'key'=fact->>'fieldKey') then raise exception 'unknown_field'; end if;
      if jsonb_typeof(fact->'value') not in ('string','number','boolean') or coalesce((fact->>'confidence')::numeric,-1) not between 0 and 1 then raise exception 'invalid_fact'; end if;
      select * into prior from public.extracted_facts f where f.organization_id=event_row.organization_id and f.intake_session_id=event_row.intake_session_id and f.field_key=fact->>'fieldKey' and f.status in ('suggested','confirmed','conflicted') order by f.created_at desc limit 1;
      if found and prior.value=fact->'value' then continue; end if;
      fact_status:=case when found then 'conflicted'::public.extracted_fact_status else 'suggested'::public.extracted_fact_status end;
      if found and prior.status='suggested' then update public.extracted_facts set status='conflicted',updated_at=now() where id=prior.id; end if;
      insert into public.extracted_facts(organization_id,service_request_id,intake_session_id,field_key,value,value_type,source_type,source_message_id,source_excerpt,confidence,status,created_by_type)
      values(event_row.organization_id,event_row.service_request_id,event_row.intake_session_id,fact->>'fieldKey',fact->'value',(fact->>'valueType')::public.extracted_fact_value_type,'ai_extraction',event_row.source_message_id,nullif(left(fact->>'sourceExcerpt',160),''),(fact->>'confidence')::numeric,fact_status,'ai');
    end loop;
    select coalesce(max(m.sequence_number),0)+1 into next_sequence from public.intake_messages m where m.intake_session_id=event_row.intake_session_id;
    insert into public.intake_messages(organization_id,intake_session_id,role,content,sequence_number)
    values(event_row.organization_id,event_row.intake_session_id,'assistant',requested_output->>'responseMessage',next_sequence);
    insert into public.ai_executions(organization_id,service_request_id,intake_session_id,source_message_id,operation_type,instructions_version,provider,model,status,latency_ms,input_tokens,output_tokens,structured_output,correlation_id)
    values(event_row.organization_id,event_row.service_request_id,event_row.intake_session_id,event_row.source_message_id,'intake_extraction',left(requested_instructions_version,40),left(requested_provider,80),left(requested_model,160),'succeeded',requested_latency_ms,requested_input_tokens,requested_output_tokens,requested_output,requested_correlation_id);
  end if;
  update public.intake_sessions set next_question=nullif(requested_output->>'proposedNextQuestion',''),detected_service_definition_id=(select sd.id from public.service_definitions sd where sd.organization_id=event_row.organization_id and sd.code=requested_output->>'detectedServiceKey' and sd.status='active'),service_confidence=case when requested_output->>'detectedServiceKey' is null then null else (requested_output->>'serviceConfidence')::numeric end,updated_at=now() where id=event_row.intake_session_id;
  update public.whatsapp_message_events set status='analyzed',response_message=requested_output->>'responseMessage',failure_code=null,processed_at=now() where id=target_event_id;
end; $$;

create function public.complete_whatsapp_without_ai(target_event_id uuid,requested_response text)
returns void language plpgsql security definer set search_path='' as $$
declare event_row public.whatsapp_message_events%rowtype; next_sequence integer;
begin
  if char_length(trim(requested_response)) not between 1 and 1000 then raise exception 'invalid_response'; end if;
  select * into event_row from public.whatsapp_message_events e where e.id=target_event_id for update;
  if not found then raise exception 'not_found'; end if;
  if event_row.status in ('analyzed','replied') then return; end if;
  select coalesce(max(m.sequence_number),0)+1 into next_sequence from public.intake_messages m where m.intake_session_id=event_row.intake_session_id;
  insert into public.intake_messages(organization_id,intake_session_id,role,content,sequence_number) values(event_row.organization_id,event_row.intake_session_id,'assistant',trim(requested_response),next_sequence);
  update public.service_requests set status='needs_review',updated_at=now(),lock_version=lock_version+1 where id=event_row.service_request_id and status not in ('qualified','closed');
  update public.whatsapp_message_events set status='analyzed',response_message=trim(requested_response),failure_code=null,processed_at=now() where id=target_event_id;
end; $$;

create function public.mark_whatsapp_reply_sent(target_event_id uuid,requested_provider_message_id text)
returns void language plpgsql security definer set search_path='' as $$
begin
  if char_length(requested_provider_message_id) not between 1 and 200 then raise exception 'invalid_provider_message_id'; end if;
  update public.whatsapp_message_events set status='replied',outbound_provider_message_id=requested_provider_message_id,failure_code=null,processed_at=now() where id=target_event_id and response_message is not null;
  if not found then raise exception 'not_found'; end if;
end; $$;

create function public.fail_whatsapp_message(target_event_id uuid,requested_failure_code text)
returns void language plpgsql security definer set search_path='' as $$
begin
  update public.whatsapp_message_events set status='failed',failure_code=case when requested_failure_code ~ '^[a-z0-9_]{1,80}$' then requested_failure_code else 'whatsapp_processing_failed' end,processed_at=now() where id=target_event_id and status<>'replied';
  if not found then raise exception 'not_found'; end if;
end; $$;

revoke all on function public.ingest_whatsapp_text_message(uuid,uuid,text,text,text,text,timestamptz),public.complete_whatsapp_intake(uuid,jsonb,text,text,text,integer,integer,integer,uuid),public.complete_whatsapp_without_ai(uuid,text),public.mark_whatsapp_reply_sent(uuid,text),public.fail_whatsapp_message(uuid,text) from public,anon,authenticated;
grant execute on function public.ingest_whatsapp_text_message(uuid,uuid,text,text,text,text,timestamptz),public.complete_whatsapp_intake(uuid,jsonb,text,text,text,integer,integer,integer,uuid),public.complete_whatsapp_without_ai(uuid,text),public.mark_whatsapp_reply_sent(uuid,text),public.fail_whatsapp_message(uuid,text) to service_role;

comment on table public.whatsapp_conversations is 'Single-number pilot mapping a WhatsApp sender to one active Qualifyr Dossier and intake session.';
comment on table public.whatsapp_message_events is 'Idempotent minimized WhatsApp processing audit. Access is manager-scoped; message content remains in intake_messages.';
