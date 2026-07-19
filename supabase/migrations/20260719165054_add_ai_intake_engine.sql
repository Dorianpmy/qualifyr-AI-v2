create type public.intake_session_status as enum ('active','paused','completed','cancelled');
create type public.intake_message_role as enum ('user','assistant','system_event');
create type public.extracted_fact_value_type as enum ('text','number','boolean','date','email','phone','country','city','postal_code');
create type public.extracted_fact_source_type as enum ('ai_extraction','manual','public_intake','document_extraction');
create type public.extracted_fact_status as enum ('suggested','confirmed','conflicted','rejected','superseded');
create type public.extracted_fact_creator_type as enum ('ai','human');
create type public.ai_execution_status as enum ('started','succeeded','failed','invalid_output','timed_out');

create table public.intake_sessions (
  id uuid primary key default extensions.gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  service_request_id uuid not null,
  playbook_version_id uuid not null,
  detected_service_definition_id uuid,
  service_confidence numeric(4,3) check (service_confidence is null or service_confidence between 0 and 1),
  status public.intake_session_status not null default 'active',
  locale text not null check (locale ~ '^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$'),
  next_question text check (next_question is null or char_length(next_question) between 1 and 500),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (organization_id,id),
  foreign key (organization_id,service_request_id) references public.service_requests(organization_id,id) on delete cascade,
  foreign key (organization_id,playbook_version_id) references public.playbook_versions(organization_id,id) on delete restrict,
  foreign key (organization_id,detected_service_definition_id) references public.service_definitions(organization_id,id) on delete restrict,
  check ((status='completed')=(completed_at is not null))
);
create unique index intake_sessions_one_active_idx on public.intake_sessions(service_request_id) where status='active';

create table public.intake_messages (
  id uuid primary key default extensions.gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  intake_session_id uuid not null,
  role public.intake_message_role not null,
  content text not null check (char_length(content) between 1 and 5000),
  sequence_number integer not null check (sequence_number>0),
  request_id uuid,
  created_at timestamptz not null default now(),
  unique (organization_id,id),
  unique (intake_session_id,sequence_number),
  unique (intake_session_id,request_id),
  foreign key (organization_id,intake_session_id) references public.intake_sessions(organization_id,id) on delete cascade
);

create table public.extracted_facts (
  id uuid primary key default extensions.gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  service_request_id uuid not null,
  intake_session_id uuid not null,
  field_key text not null check (field_key ~ '^[a-z][a-z0-9_]{1,49}$'),
  value jsonb not null check (jsonb_typeof(value) in ('string','number','boolean') and pg_column_size(value)<=1024),
  value_type public.extracted_fact_value_type not null,
  source_type public.extracted_fact_source_type not null,
  source_message_id uuid,
  source_excerpt text check (source_excerpt is null or char_length(source_excerpt)<=160),
  confidence numeric(4,3) not null check (confidence between 0 and 1),
  status public.extracted_fact_status not null,
  created_by_type public.extracted_fact_creator_type not null,
  confirmed_by uuid references auth.users(id) on delete restrict,
  corrected_by uuid references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  confirmed_at timestamptz,
  unique (organization_id,id),
  foreign key (organization_id,service_request_id) references public.service_requests(organization_id,id) on delete cascade,
  foreign key (organization_id,intake_session_id) references public.intake_sessions(organization_id,id) on delete cascade,
  foreign key (organization_id,source_message_id) references public.intake_messages(organization_id,id) on delete restrict,
  check ((status='confirmed')=(confirmed_at is not null and confirmed_by is not null))
);

create table public.ai_executions (
  id uuid primary key default extensions.gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  service_request_id uuid not null,
  intake_session_id uuid not null,
  source_message_id uuid not null,
  operation_type text not null check (operation_type in ('intake_extraction')),
  instructions_version text not null check (char_length(instructions_version) between 1 and 40),
  provider text not null check (char_length(provider) between 1 and 80),
  model text not null check (char_length(model) between 1 and 160),
  status public.ai_execution_status not null,
  latency_ms integer check (latency_ms is null or latency_ms between 0 and 300000),
  input_tokens integer check (input_tokens is null or input_tokens>=0),
  output_tokens integer check (output_tokens is null or output_tokens>=0),
  estimated_cost numeric(12,6) check (estimated_cost is null or estimated_cost>=0),
  structured_output jsonb check (structured_output is null or (jsonb_typeof(structured_output)='object' and pg_column_size(structured_output)<=16384)),
  error_code text check (error_code is null or error_code ~ '^[a-z0-9_]{1,80}$'),
  correlation_id uuid not null,
  created_at timestamptz not null default now(),
  unique (organization_id,id),
  unique (intake_session_id,source_message_id),
  foreign key (organization_id,service_request_id) references public.service_requests(organization_id,id) on delete cascade,
  foreign key (organization_id,intake_session_id) references public.intake_sessions(organization_id,id) on delete cascade,
  foreign key (organization_id,source_message_id) references public.intake_messages(organization_id,id) on delete restrict,
  check ((status='succeeded')=(structured_output is not null))
);

create index intake_sessions_org_request_idx on public.intake_sessions(organization_id,service_request_id,updated_at desc);
create index intake_messages_session_idx on public.intake_messages(organization_id,intake_session_id,sequence_number);
create index extracted_facts_request_idx on public.extracted_facts(organization_id,service_request_id,field_key,created_at desc);
create index ai_executions_org_request_idx on public.ai_executions(organization_id,service_request_id,created_at desc);

alter table public.intake_sessions enable row level security; alter table public.intake_sessions force row level security;
alter table public.intake_messages enable row level security; alter table public.intake_messages force row level security;
alter table public.extracted_facts enable row level security; alter table public.extracted_facts force row level security;
alter table public.ai_executions enable row level security; alter table public.ai_executions force row level security;
revoke all on public.intake_sessions,public.intake_messages,public.extracted_facts,public.ai_executions from anon,authenticated;
grant select on public.intake_sessions,public.intake_messages,public.extracted_facts to authenticated;
grant select on public.ai_executions to authenticated;
create policy "active members can read intake sessions" on public.intake_sessions for select to authenticated using ((select qualifyr_private.is_organization_member(organization_id)));
create policy "active members can read intake messages" on public.intake_messages for select to authenticated using ((select qualifyr_private.is_organization_member(organization_id)));
create policy "active members can read extracted facts" on public.extracted_facts for select to authenticated using ((select qualifyr_private.is_organization_member(organization_id)));
create policy "managers can read ai executions" on public.ai_executions for select to authenticated using ((select qualifyr_private.organization_role_for_user(organization_id)) in ('owner','admin'));

create function qualifyr_private.can_edit_intake(target_organization_id uuid,target_request_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.service_requests r where r.organization_id=target_organization_id and r.id=target_request_id and qualifyr_private.can_update_service_request(target_organization_id,r.created_by,r.assigned_user_id));
$$;

create function public.start_intake_session(target_organization_id uuid,target_reference text,requested_locale text)
returns uuid language plpgsql security definer set search_path='' as $$
declare caller_id uuid:=(select auth.uid()); request_row public.service_requests%rowtype; existing_id uuid; created_id uuid;
begin
  if caller_id is null then raise exception 'not_found'; end if;
  select * into request_row from public.service_requests where organization_id=target_organization_id and reference_code=target_reference;
  if not found or request_row.playbook_version_id is null or not qualifyr_private.can_edit_intake(target_organization_id,request_row.id) then raise exception 'not_found'; end if;
  select id into existing_id from public.intake_sessions where service_request_id=request_row.id and status='active'; if found then return existing_id; end if;
  if coalesce(requested_locale,'') !~ '^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$' then raise exception 'invalid_locale'; end if;
  insert into public.intake_sessions(organization_id,service_request_id,playbook_version_id,locale,created_by) values(target_organization_id,request_row.id,request_row.playbook_version_id,requested_locale,caller_id) returning id into created_id;
  return created_id;
end; $$;

create function public.append_intake_user_message(target_organization_id uuid,target_session_id uuid,requested_content text,requested_request_id uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare caller_id uuid:=(select auth.uid()); session_row public.intake_sessions%rowtype; existing_id uuid; created_id uuid; next_sequence integer;
begin
  if caller_id is null then raise exception 'not_found'; end if;
  select * into session_row from public.intake_sessions where organization_id=target_organization_id and id=target_session_id and status='active' for update;
  if not found or not qualifyr_private.can_edit_intake(target_organization_id,session_row.service_request_id) then raise exception 'not_found'; end if;
  select message.id into existing_id from public.intake_messages message where message.intake_session_id=target_session_id and message.request_id=requested_request_id; if found then return existing_id; end if;
  if char_length(trim(requested_content)) not between 1 and 5000 then raise exception 'invalid_message'; end if;
  select coalesce(max(sequence_number),0)+1 into next_sequence from public.intake_messages where intake_session_id=target_session_id;
  insert into public.intake_messages(organization_id,intake_session_id,role,content,sequence_number,request_id) values(target_organization_id,target_session_id,'user',trim(requested_content),next_sequence,requested_request_id) returning id into created_id;
  update public.intake_sessions set updated_at=now() where id=target_session_id;
  return created_id;
end; $$;

create function public.record_intake_success(target_organization_id uuid,target_session_id uuid,target_message_id uuid,requested_output jsonb,requested_provider text,requested_model text,requested_instructions_version text,requested_latency_ms integer,requested_input_tokens integer,requested_output_tokens integer,requested_correlation_id uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare caller_id uuid:=(select auth.uid()); session_row public.intake_sessions%rowtype; fact jsonb; prior public.extracted_facts%rowtype; execution_id uuid; next_sequence integer; fact_status public.extracted_fact_status;
begin
  if caller_id is null then raise exception 'not_found'; end if;
  select * into session_row from public.intake_sessions where organization_id=target_organization_id and id=target_session_id and status='active' for update;
  if not found or not qualifyr_private.can_edit_intake(target_organization_id,session_row.service_request_id) then raise exception 'not_found'; end if;
  if not exists(select 1 from public.intake_messages where organization_id=target_organization_id and id=target_message_id and intake_session_id=target_session_id and role='user') then raise exception 'not_found'; end if;
  if jsonb_typeof(requested_output)<>'object' or jsonb_typeof(requested_output->'extractedFacts')<>'array' or char_length(coalesce(requested_output->>'responseMessage','')) not between 1 and 1000 then raise exception 'invalid_output'; end if;
  if requested_output->>'detectedServiceKey' is not null and not exists(select 1 from public.service_definitions where organization_id=target_organization_id and code=requested_output->>'detectedServiceKey' and status='active') then raise exception 'unknown_service'; end if;
  if exists(select 1 from public.ai_executions where intake_session_id=target_session_id and source_message_id=target_message_id) then select id into execution_id from public.ai_executions where intake_session_id=target_session_id and source_message_id=target_message_id; return execution_id; end if;
  for fact in select value from jsonb_array_elements(requested_output->'extractedFacts') loop
    if not exists(select 1 from public.playbook_versions v,jsonb_array_elements(v.schema_definition->'fields') field where v.organization_id=target_organization_id and v.id=session_row.playbook_version_id and field->>'key'=fact->>'fieldKey') then raise exception 'unknown_field'; end if;
    if jsonb_typeof(fact->'value') not in ('string','number','boolean') or coalesce((fact->>'confidence')::numeric,-1) not between 0 and 1 then raise exception 'invalid_fact'; end if;
    select * into prior from public.extracted_facts where organization_id=target_organization_id and intake_session_id=target_session_id and field_key=fact->>'fieldKey' and status in ('suggested','confirmed','conflicted') order by created_at desc limit 1;
    if found and prior.value=fact->'value' then continue; end if;
    fact_status:=case when found then 'conflicted'::public.extracted_fact_status else 'suggested'::public.extracted_fact_status end;
    if found and prior.status='suggested' then update public.extracted_facts set status='conflicted',updated_at=now() where id=prior.id; end if;
    insert into public.extracted_facts(organization_id,service_request_id,intake_session_id,field_key,value,value_type,source_type,source_message_id,source_excerpt,confidence,status,created_by_type)
    values(target_organization_id,session_row.service_request_id,target_session_id,fact->>'fieldKey',fact->'value',(fact->>'valueType')::public.extracted_fact_value_type,'ai_extraction',target_message_id,nullif(left(fact->>'sourceExcerpt',160),''),(fact->>'confidence')::numeric,fact_status,'ai');
  end loop;
  select coalesce(max(sequence_number),0)+1 into next_sequence from public.intake_messages where intake_session_id=target_session_id;
  insert into public.intake_messages(organization_id,intake_session_id,role,content,sequence_number) values(target_organization_id,target_session_id,'assistant',requested_output->>'responseMessage',next_sequence);
  insert into public.ai_executions(organization_id,service_request_id,intake_session_id,source_message_id,operation_type,instructions_version,provider,model,status,latency_ms,input_tokens,output_tokens,structured_output,correlation_id)
  values(target_organization_id,session_row.service_request_id,target_session_id,target_message_id,'intake_extraction',left(requested_instructions_version,40),left(requested_provider,80),left(requested_model,160),'succeeded',requested_latency_ms,requested_input_tokens,requested_output_tokens,requested_output,requested_correlation_id) returning id into execution_id;
  update public.intake_sessions set next_question=nullif(requested_output->>'proposedNextQuestion',''),detected_service_definition_id=(select id from public.service_definitions where organization_id=target_organization_id and code=requested_output->>'detectedServiceKey' and status='active'),service_confidence=case when requested_output->>'detectedServiceKey' is null then null else (requested_output->>'serviceConfidence')::numeric end,updated_at=now() where id=target_session_id;
  return execution_id;
end; $$;

create function public.update_intake_next_question(target_organization_id uuid,target_session_id uuid,requested_question text)
returns void language plpgsql security definer set search_path='' as $$
declare caller_id uuid:=(select auth.uid()); session_row public.intake_sessions%rowtype;
begin
  if caller_id is null or char_length(trim(requested_question)) not between 1 and 500 then raise exception 'not_found'; end if;
  select * into session_row from public.intake_sessions where organization_id=target_organization_id and id=target_session_id and status='active';
  if not found or not qualifyr_private.can_edit_intake(target_organization_id,session_row.service_request_id) then raise exception 'not_found'; end if;
  update public.intake_sessions set next_question=trim(requested_question),updated_at=now() where id=target_session_id;
end; $$;

create function public.record_intake_failure(target_organization_id uuid,target_session_id uuid,target_message_id uuid,requested_provider text,requested_model text,requested_instructions_version text,requested_status public.ai_execution_status,requested_error_code text,requested_latency_ms integer,requested_correlation_id uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare caller_id uuid:=(select auth.uid()); session_row public.intake_sessions%rowtype; execution_id uuid; next_sequence integer;
begin
  if caller_id is null or requested_status not in ('failed','invalid_output','timed_out') then raise exception 'not_found'; end if;
  select * into session_row from public.intake_sessions where organization_id=target_organization_id and id=target_session_id and status='active' for update;
  if not found or not qualifyr_private.can_edit_intake(target_organization_id,session_row.service_request_id) or not exists(select 1 from public.intake_messages where organization_id=target_organization_id and id=target_message_id and intake_session_id=target_session_id and role='user') then raise exception 'not_found'; end if;
  select id into execution_id from public.ai_executions where intake_session_id=target_session_id and source_message_id=target_message_id; if found then return execution_id; end if;
  insert into public.ai_executions(organization_id,service_request_id,intake_session_id,source_message_id,operation_type,instructions_version,provider,model,status,latency_ms,error_code,correlation_id)
  values(target_organization_id,session_row.service_request_id,target_session_id,target_message_id,'intake_extraction',left(requested_instructions_version,40),left(requested_provider,80),left(requested_model,160),requested_status,requested_latency_ms,left(requested_error_code,80),requested_correlation_id) returning id into execution_id;
  select coalesce(max(sequence_number),0)+1 into next_sequence from public.intake_messages where intake_session_id=target_session_id;
  insert into public.intake_messages(organization_id,intake_session_id,role,content,sequence_number) values(target_organization_id,target_session_id,'system_event','L’extraction automatique est indisponible. Les informations du Dossier sont conservées ; vous pouvez saisir ou confirmer les faits manuellement.',next_sequence);
  update public.intake_sessions set updated_at=now() where id=target_session_id;
  return execution_id;
end; $$;

create function public.resolve_extracted_fact(target_organization_id uuid,target_fact_id uuid,requested_action text,requested_value jsonb)
returns void language plpgsql security definer set search_path='' as $$
declare caller_id uuid:=(select auth.uid()); fact_row public.extracted_facts%rowtype;
begin
  if caller_id is null or requested_action not in ('confirm','reject','correct') then raise exception 'not_found'; end if;
  select * into fact_row from public.extracted_facts where organization_id=target_organization_id and id=target_fact_id for update;
  if not found or not qualifyr_private.can_edit_intake(target_organization_id,fact_row.service_request_id) then raise exception 'not_found'; end if;
  if requested_action='reject' then update public.extracted_facts set status='rejected',corrected_by=caller_id,updated_at=now(),confirmed_by=null,confirmed_at=null where id=fact_row.id; return; end if;
  update public.extracted_facts set status='superseded',corrected_by=case when requested_action='correct' then caller_id else corrected_by end,updated_at=now(),confirmed_by=null,confirmed_at=null where intake_session_id=fact_row.intake_session_id and field_key=fact_row.field_key and status in ('suggested','confirmed','conflicted');
  insert into public.extracted_facts(organization_id,service_request_id,intake_session_id,field_key,value,value_type,source_type,source_message_id,confidence,status,created_by_type,confirmed_by,corrected_by,confirmed_at)
  values(target_organization_id,fact_row.service_request_id,fact_row.intake_session_id,fact_row.field_key,case when requested_action='correct' then requested_value else fact_row.value end,fact_row.value_type,'manual',fact_row.source_message_id,1,'confirmed','human',caller_id,case when requested_action='correct' then caller_id else null end,now());
end; $$;

revoke all on function qualifyr_private.can_edit_intake(uuid,uuid) from public,anon,authenticated;
revoke all on function public.start_intake_session(uuid,text,text),public.append_intake_user_message(uuid,uuid,text,uuid),public.record_intake_success(uuid,uuid,uuid,jsonb,text,text,text,integer,integer,integer,uuid),public.record_intake_failure(uuid,uuid,uuid,text,text,text,public.ai_execution_status,text,integer,uuid),public.resolve_extracted_fact(uuid,uuid,text,jsonb),public.update_intake_next_question(uuid,uuid,text) from public,anon;
grant execute on function public.start_intake_session(uuid,text,text),public.append_intake_user_message(uuid,uuid,text,uuid),public.record_intake_success(uuid,uuid,uuid,jsonb,text,text,text,integer,integer,integer,uuid),public.record_intake_failure(uuid,uuid,uuid,text,text,text,public.ai_execution_status,text,integer,uuid),public.resolve_extracted_fact(uuid,uuid,text,jsonb),public.update_intake_next_question(uuid,uuid,text) to authenticated;

comment on table public.ai_executions is 'Minimized AI execution metadata: no prompts, raw contexts, chain of thought, secrets, or duplicated full user content.';
