create type public.inbound_email_status as enum ('received','processing','needs_review','failed','ignored');

create table public.organization_email_channels (
  id uuid primary key default extensions.gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  route_key text not null default lower(encode(extensions.gen_random_bytes(12),'hex')) check (route_key ~ '^[a-f0-9]{24}$'),
  status text not null default 'disabled' check (status in ('disabled','active')),
  retention_days integer not null default 90 check (retention_days between 30 and 730),
  ai_processing_enabled boolean not null default true,
  data_processing_acknowledged_at timestamptz,
  configured_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id),
  unique (organization_id,id),
  unique (route_key),
  check (status='disabled' or data_processing_acknowledged_at is not null)
);

create table public.inbound_email_events (
  id uuid primary key default extensions.gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  channel_id uuid not null,
  provider text not null check (provider='resend'),
  provider_email_id text not null check (char_length(provider_email_id) between 1 and 160),
  message_id text check (message_id is null or char_length(message_id)<=500),
  sender_email text not null check (char_length(sender_email)<=254),
  recipient_address text not null check (char_length(recipient_address)<=320),
  subject text not null check (char_length(subject) between 1 and 300),
  attachment_count integer not null default 0 check (attachment_count between 0 and 100),
  status public.inbound_email_status not null default 'received',
  failure_code text check (failure_code is null or failure_code ~ '^[a-z0-9_]{1,80}$'),
  service_request_id uuid,
  received_at timestamptz not null,
  processed_at timestamptz,
  metadata_expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (provider,provider_email_id),
  unique (organization_id,id),
  foreign key (organization_id,channel_id) references public.organization_email_channels(organization_id,id) on delete cascade,
  foreign key (organization_id,service_request_id) references public.service_requests(organization_id,id) on delete set null
);

create index inbound_email_events_org_created_idx on public.inbound_email_events(organization_id,created_at desc);
create index inbound_email_events_expiry_idx on public.inbound_email_events(metadata_expires_at);

alter table public.organization_email_channels enable row level security;
alter table public.organization_email_channels force row level security;
alter table public.inbound_email_events enable row level security;
alter table public.inbound_email_events force row level security;
revoke all on public.organization_email_channels,public.inbound_email_events from anon,authenticated;
grant select on public.organization_email_channels,public.inbound_email_events to authenticated;
create policy "managers read email channels" on public.organization_email_channels for select to authenticated using ((select qualifyr_private.organization_role_for_user(organization_id)) in ('owner','admin'));
create policy "managers read inbound email audit" on public.inbound_email_events for select to authenticated using ((select qualifyr_private.organization_role_for_user(organization_id)) in ('owner','admin'));

create function public.configure_organization_email_channel(target_organization_id uuid,requested_enabled boolean,requested_retention_days integer,acknowledge_processing boolean)
returns table(route_key text,status text,retention_days integer,ai_processing_enabled boolean)
language plpgsql security definer set search_path='' as $$
declare caller_id uuid:=(select auth.uid()); caller_role public.organization_role;
begin
  caller_role:=qualifyr_private.organization_role_for_user(target_organization_id);
  if caller_id is null or caller_role not in ('owner','admin') then raise exception 'not_found'; end if;
  if requested_retention_days not between 30 and 730 then raise exception 'invalid_retention'; end if;
  if requested_enabled and not acknowledge_processing then raise exception 'processing_acknowledgement_required'; end if;
  insert into public.organization_email_channels(organization_id,status,retention_days,ai_processing_enabled,data_processing_acknowledged_at,configured_by)
  values(target_organization_id,case when requested_enabled then 'active' else 'disabled' end,requested_retention_days,true,case when acknowledge_processing then now() else null end,caller_id)
  on conflict(organization_id) do update set status=excluded.status,retention_days=excluded.retention_days,data_processing_acknowledged_at=case when acknowledge_processing then coalesce(public.organization_email_channels.data_processing_acknowledged_at,now()) else public.organization_email_channels.data_processing_acknowledged_at end,configured_by=caller_id,updated_at=now();
  return query select c.route_key,c.status,c.retention_days,c.ai_processing_enabled from public.organization_email_channels c where c.organization_id=target_organization_id;
end; $$;

create function public.ingest_inbound_email(requested_route_key text,requested_provider_email_id text,requested_message_id text,requested_sender_email text,requested_recipient text,requested_subject text,requested_body text,requested_received_at timestamptz,requested_attachment_count integer)
returns table(event_id uuid,organization_id uuid,reference_code text,service_request_id uuid,intake_session_id uuid,source_message_id uuid,playbook_version_id uuid,locale text,ai_enabled boolean,created boolean)
language plpgsql security definer set search_path='' as $$
declare channel public.organization_email_channels%rowtype; org public.organizations%rowtype; existing public.inbound_email_events%rowtype; actor uuid; new_event uuid; new_request uuid; new_reference text; selected_service uuid; selected_version uuid; selected_label text:='À déterminer'; new_session uuid; new_message uuid; attempt integer:=0;
begin
  select * into channel from public.organization_email_channels where route_key=requested_route_key and status='active';
  if not found or channel.data_processing_acknowledged_at is null then raise exception 'unknown_channel'; end if;
  if char_length(trim(requested_body)) not between 10 and 10000 or lower(trim(requested_sender_email)) !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then raise exception 'invalid_email'; end if;
  select * into existing from public.inbound_email_events where provider='resend' and provider_email_id=requested_provider_email_id;
  if found then return query select existing.id,existing.organization_id,r.reference_code,existing.service_request_id,s.id,m.id,s.playbook_version_id,coalesce(o.locale,'fr-FR'),channel.ai_processing_enabled,false from public.service_requests r left join public.intake_sessions s on s.service_request_id=r.id and s.status='active' left join public.intake_messages m on m.intake_session_id=s.id and m.role='user' join public.organizations o on o.id=r.organization_id where r.id=existing.service_request_id limit 1; return; end if;
  select * into org from public.organizations where id=channel.organization_id and archived_at is null;
  actor:=channel.configured_by;
  select p.service_definition_id,p.active_version_id,sd.name into selected_service,selected_version,selected_label from public.playbooks p join public.service_definitions sd on sd.organization_id=p.organization_id and sd.id=p.service_definition_id where p.organization_id=channel.organization_id and p.status='active' and p.active_version_id is not null order by p.updated_at desc limit 1;
  selected_label:=coalesce(selected_label,'À déterminer');
  loop attempt:=attempt+1; new_reference:='D-'||upper(substr(pg_catalog.encode(extensions.gen_random_bytes(8),'hex'),1,10)); exit when not exists(select 1 from public.service_requests sr where sr.organization_id=channel.organization_id and sr.reference_code=new_reference); if attempt>=5 then raise exception 'reference_generation_failed'; end if; end loop;
  insert into public.service_requests(organization_id,reference_code,title,original_request,source,status,service_label,requester_email,preferred_contact_channel,requester_locale,country_code,postal_code,city,created_by,updated_by,creation_request_id,service_definition_id,playbook_version_id)
  values(channel.organization_id,new_reference,left(coalesce(nullif(trim(requested_subject),''),'Demande reçue par email'),160),trim(requested_body),'email','incomplete',selected_label,lower(trim(requested_sender_email)),'email',coalesce(org.locale,'fr-FR'),coalesce(org.country_code,'FR'),'À confirmer','À confirmer',actor,actor,extensions.gen_random_uuid(),selected_service,selected_version) returning id into new_request;
  insert into public.service_request_events(organization_id,service_request_id,event_type,actor_user_id,metadata) values(channel.organization_id,new_request,'created',actor,jsonb_build_object('source','email','automatic',true));
  insert into public.inbound_email_events(organization_id,channel_id,provider,provider_email_id,message_id,sender_email,recipient_address,subject,attachment_count,status,service_request_id,received_at,metadata_expires_at)
  values(channel.organization_id,channel.id,'resend',requested_provider_email_id,left(requested_message_id,500),lower(trim(requested_sender_email)),lower(trim(requested_recipient)),left(coalesce(nullif(trim(requested_subject),''),'Sans objet'),300),greatest(0,least(requested_attachment_count,100)),'processing',new_request,requested_received_at,now()+make_interval(days=>channel.retention_days)) returning id into new_event;
  if selected_version is not null then
    insert into public.intake_sessions(organization_id,service_request_id,playbook_version_id,locale,created_by) values(channel.organization_id,new_request,selected_version,coalesce(org.locale,'fr-FR'),actor) returning id into new_session;
    insert into public.intake_messages(organization_id,intake_session_id,role,content,sequence_number,request_id) values(channel.organization_id,new_session,'user',left(trim(requested_body),5000),1,extensions.gen_random_uuid()) returning id into new_message;
  end if;
  return query select new_event,channel.organization_id,new_reference,new_request,new_session,new_message,selected_version,coalesce(org.locale,'fr-FR'),channel.ai_processing_enabled,true;
end; $$;

create function public.complete_inbound_email_processing(target_event_id uuid,requested_status public.inbound_email_status,requested_failure_code text default null)
returns void language plpgsql security definer set search_path='' as $$
begin
  if requested_status not in ('needs_review','failed','ignored') then raise exception 'invalid_status'; end if;
  update public.inbound_email_events set status=requested_status,failure_code=case when requested_failure_code is null then null else left(requested_failure_code,80) end,processed_at=now() where id=target_event_id;
  if not found then raise exception 'not_found'; end if;
  if requested_status='needs_review' then update public.service_requests set status='needs_review',updated_at=now(),lock_version=lock_version+1 where id=(select service_request_id from public.inbound_email_events where id=target_event_id); end if;
end; $$;

revoke all on function public.configure_organization_email_channel(uuid,boolean,integer,boolean) from public,anon;
grant execute on function public.configure_organization_email_channel(uuid,boolean,integer,boolean) to authenticated;
revoke all on function public.ingest_inbound_email(text,text,text,text,text,text,text,timestamptz,integer),public.complete_inbound_email_processing(uuid,public.inbound_email_status,text) from public,anon,authenticated;
grant execute on function public.ingest_inbound_email(text,text,text,text,text,text,text,timestamptz,integer),public.complete_inbound_email_processing(uuid,public.inbound_email_status,text) to service_role;

comment on table public.organization_email_channels is 'Explicitly activated organization-scoped inbound email channel with retention and processing acknowledgement.';
comment on table public.inbound_email_events is 'Minimized inbound email audit metadata. Full content exists only in the resulting Dossier.';
