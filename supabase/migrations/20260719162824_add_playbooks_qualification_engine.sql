create type public.service_definition_status as enum ('active', 'inactive', 'archived');
create type public.coverage_area_type as enum ('country', 'city', 'postal_code');
create type public.playbook_status as enum ('draft', 'active', 'archived');
create type public.playbook_version_status as enum ('draft', 'published');
create type public.qualification_recommendation as enum ('incomplete', 'needs_review', 'qualified');
create type public.playbook_audit_event_type as enum ('service_created', 'coverage_added', 'playbook_created', 'version_created', 'version_published', 'dossier_associated', 'qualification_calculated', 'qualification_validated');

create table public.service_definitions (
  id uuid primary key default extensions.gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  code text not null check (code ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null check (char_length(trim(name)) between 2 and 120),
  description text check (description is null or char_length(trim(description)) between 1 and 1000),
  status public.service_definition_status not null default 'active',
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  creation_request_id uuid not null,
  unique (organization_id, id),
  unique (organization_id, code),
  unique (organization_id, created_by, creation_request_id)
);

create table public.coverage_areas (
  id uuid primary key default extensions.gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  service_definition_id uuid not null,
  area_type public.coverage_area_type not null,
  country_code text not null check (country_code ~ '^[A-Z]{2}$'),
  value text not null check (char_length(trim(value)) between 1 and 120),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  foreign key (organization_id, service_definition_id) references public.service_definitions(organization_id, id) on delete cascade,
  unique (organization_id, service_definition_id, area_type, country_code, value)
);

create table public.playbooks (
  id uuid primary key default extensions.gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  service_definition_id uuid not null,
  code text not null check (code ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null check (char_length(trim(name)) between 2 and 160),
  description text check (description is null or char_length(trim(description)) between 1 and 1000),
  status public.playbook_status not null default 'draft',
  active_version_id uuid,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  creation_request_id uuid not null,
  unique (organization_id, id),
  unique (organization_id, code),
  unique (organization_id, created_by, creation_request_id),
  foreign key (organization_id, service_definition_id) references public.service_definitions(organization_id, id) on delete restrict
);

create table public.playbook_versions (
  id uuid primary key default extensions.gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  playbook_id uuid not null,
  version_number integer not null check (version_number > 0),
  status public.playbook_version_status not null default 'draft',
  schema_definition jsonb not null check (
    jsonb_typeof(schema_definition) = 'object'
    and jsonb_typeof(schema_definition -> 'fields') = 'array'
    and jsonb_typeof(schema_definition -> 'proofs') = 'array'
    and jsonb_typeof(schema_definition -> 'rules') = 'array'
    and pg_column_size(schema_definition) <= 65536
  ),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  published_by uuid references auth.users(id) on delete restrict,
  published_at timestamptz,
  lock_version integer not null default 1 check (lock_version > 0),
  unique (organization_id, id),
  unique (playbook_id, version_number),
  foreign key (organization_id, playbook_id) references public.playbooks(organization_id, id) on delete cascade,
  check ((status = 'published') = (published_at is not null and published_by is not null))
);

alter table public.playbooks
  add foreign key (organization_id, active_version_id) references public.playbook_versions(organization_id, id) on delete restrict;

alter table public.service_requests
  add unique (organization_id, id),
  add column service_definition_id uuid,
  add column playbook_version_id uuid,
  add foreign key (organization_id, service_definition_id) references public.service_definitions(organization_id, id) on delete restrict,
  add foreign key (organization_id, playbook_version_id) references public.playbook_versions(organization_id, id) on delete restrict;

create table public.qualification_results (
  id uuid primary key default extensions.gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  service_request_id uuid not null,
  playbook_version_id uuid not null,
  field_values jsonb not null default '{}'::jsonb check (jsonb_typeof(field_values) = 'object' and pg_column_size(field_values) <= 32768),
  evidence_values jsonb not null default '{}'::jsonb check (jsonb_typeof(evidence_values) = 'object' and pg_column_size(evidence_values) <= 16384),
  required_fields_completed integer not null default 0 check (required_fields_completed >= 0),
  required_fields_total integer not null default 0 check (required_fields_total >= 0),
  proofs_received integer not null default 0 check (proofs_received >= 0),
  proofs_expected integer not null default 0 check (proofs_expected >= 0),
  missing_information jsonb not null default '[]'::jsonb check (jsonb_typeof(missing_information) = 'array'),
  passed_rules jsonb not null default '[]'::jsonb check (jsonb_typeof(passed_rules) = 'array'),
  failed_rules jsonb not null default '[]'::jsonb check (jsonb_typeof(failed_rules) = 'array'),
  human_validation_required boolean not null default true,
  recommended_status public.qualification_recommendation not null default 'incomplete',
  next_action text not null check (char_length(trim(next_action)) between 1 and 240),
  evaluation_version integer not null default 1 check (evaluation_version > 0),
  evaluated_by uuid not null references auth.users(id) on delete restrict,
  evaluated_at timestamptz not null default now(),
  validated_by uuid references auth.users(id) on delete restrict,
  validated_at timestamptz,
  unique (organization_id, id),
  unique (service_request_id),
  foreign key (organization_id, service_request_id) references public.service_requests(organization_id, id) on delete cascade,
  foreign key (organization_id, playbook_version_id) references public.playbook_versions(organization_id, id) on delete restrict,
  check ((recommended_status = 'qualified') = (validated_at is not null and validated_by is not null))
);

create table public.playbook_audit_events (
  id uuid primary key default extensions.gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  event_type public.playbook_audit_event_type not null,
  actor_user_id uuid not null references auth.users(id) on delete restrict,
  service_definition_id uuid,
  playbook_id uuid,
  playbook_version_id uuid,
  service_request_id uuid,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object' and pg_column_size(metadata) <= 2048),
  created_at timestamptz not null default now(),
  foreign key (organization_id, service_definition_id) references public.service_definitions(organization_id, id) on delete restrict,
  foreign key (organization_id, playbook_id) references public.playbooks(organization_id, id) on delete restrict,
  foreign key (organization_id, playbook_version_id) references public.playbook_versions(organization_id, id) on delete restrict,
  foreign key (organization_id, service_request_id) references public.service_requests(organization_id, id) on delete restrict
);

create index service_definitions_org_status_idx on public.service_definitions (organization_id, status, name);
create index coverage_areas_service_idx on public.coverage_areas (organization_id, service_definition_id, area_type);
create index playbooks_org_status_idx on public.playbooks (organization_id, status, updated_at desc);
create index playbook_versions_playbook_idx on public.playbook_versions (organization_id, playbook_id, version_number desc);
create index service_requests_playbook_idx on public.service_requests (organization_id, playbook_version_id) where playbook_version_id is not null;
create index qualification_results_org_status_idx on public.qualification_results (organization_id, recommended_status, evaluated_at desc);
create index playbook_audit_events_org_idx on public.playbook_audit_events (organization_id, created_at desc);

alter table public.service_definitions enable row level security;
alter table public.service_definitions force row level security;
alter table public.coverage_areas enable row level security;
alter table public.coverage_areas force row level security;
alter table public.playbooks enable row level security;
alter table public.playbooks force row level security;
alter table public.playbook_versions enable row level security;
alter table public.playbook_versions force row level security;
alter table public.qualification_results enable row level security;
alter table public.qualification_results force row level security;
alter table public.playbook_audit_events enable row level security;
alter table public.playbook_audit_events force row level security;

revoke all on public.service_definitions, public.coverage_areas, public.playbooks, public.playbook_versions, public.qualification_results, public.playbook_audit_events from anon, authenticated;
grant select on public.service_definitions, public.coverage_areas, public.playbooks, public.playbook_versions, public.qualification_results, public.playbook_audit_events to authenticated;

create policy "active members can read services" on public.service_definitions for select to authenticated using ((select qualifyr_private.is_organization_member(organization_id)));
create policy "active members can read coverage" on public.coverage_areas for select to authenticated using ((select qualifyr_private.is_organization_member(organization_id)));
create policy "active members can read playbooks" on public.playbooks for select to authenticated using ((select qualifyr_private.is_organization_member(organization_id)));
create policy "active members can read playbook versions" on public.playbook_versions for select to authenticated using ((select qualifyr_private.is_organization_member(organization_id)));
create policy "active members can read qualification results" on public.qualification_results for select to authenticated using ((select qualifyr_private.is_organization_member(organization_id)));
create policy "active members can read playbook audit" on public.playbook_audit_events for select to authenticated using ((select qualifyr_private.is_organization_member(organization_id)));

create function qualifyr_private.playbook_schema_is_valid(candidate jsonb)
returns boolean language sql immutable set search_path = '' as $$
  select jsonb_typeof(candidate) = 'object'
    and jsonb_typeof(candidate -> 'fields') = 'array'
    and jsonb_typeof(candidate -> 'proofs') = 'array'
    and jsonb_typeof(candidate -> 'rules') = 'array'
    and jsonb_array_length(candidate -> 'fields') between 1 and 50
    and jsonb_array_length(candidate -> 'proofs') between 0 and 20
    and jsonb_array_length(candidate -> 'rules') between 1 and 20
    and not exists (
      select 1 from jsonb_array_elements(candidate -> 'fields') field
      where jsonb_typeof(field) <> 'object'
        or coalesce(field ->> 'key', '') !~ '^[a-z][a-z0-9_]{1,49}$'
        or char_length(coalesce(field ->> 'label', '')) not between 1 and 120
        or coalesce(field ->> 'type', '') not in ('text','textarea','number','date','select','email','phone','country','city','postal_code')
        or jsonb_typeof(field -> 'required') <> 'boolean'
        or char_length(coalesce(field ->> 'question', '')) not between 1 and 240
    )
    and (select count(*) = count(distinct field ->> 'key') from jsonb_array_elements(candidate -> 'fields') field)
    and not exists (
      select 1 from jsonb_array_elements(candidate -> 'proofs') proof
      where jsonb_typeof(proof) <> 'object'
        or coalesce(proof ->> 'key', '') !~ '^[a-z][a-z0-9_]{1,49}$'
        or char_length(coalesce(proof ->> 'label', '')) not between 1 and 120
        or case when coalesce(proof ->> 'minimum','') ~ '^[0-9]+$' then (proof ->> 'minimum')::integer not between 1 and 20 else true end
    )
    and not exists (
      select 1 from jsonb_array_elements(candidate -> 'rules') rule
      where jsonb_typeof(rule) <> 'object'
        or coalesce(rule ->> 'type','') not in ('service_allowed','coverage_area','required_field','required_photo','contact_available','human_validation')
    )
    and char_length(coalesce(candidate ->> 'nextAction', '')) between 1 and 240;
$$;

create function qualifyr_private.json_value_present(values_object jsonb, field_key text)
returns boolean language sql immutable set search_path = '' as $$
  select case jsonb_typeof(values_object -> field_key)
    when 'string' then char_length(trim(values_object ->> field_key)) > 0
    when 'number' then true
    when 'boolean' then true
    when 'array' then jsonb_array_length(values_object -> field_key) > 0
    when 'object' then values_object -> field_key <> '{}'::jsonb
    else false end;
$$;

create function qualifyr_private.prevent_published_playbook_version_change()
returns trigger language plpgsql set search_path = '' as $$
begin
  if old.status = 'published' then raise exception 'published_version_immutable'; end if;
  return case when tg_op = 'DELETE' then old else new end;
end; $$;

create trigger prevent_published_playbook_version_change
before update or delete on public.playbook_versions
for each row execute function qualifyr_private.prevent_published_playbook_version_change();

create function public.create_service_definition(target_organization_id uuid, requested_name text, requested_description text, request_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare caller_id uuid := (select auth.uid()); existing_id uuid; created_id uuid; generated_code text; suffix integer := 1;
begin
  if caller_id is null or qualifyr_private.organization_role_for_user(target_organization_id) not in ('owner','admin') then raise exception 'not_found'; end if;
  select id into existing_id from public.service_definitions where organization_id=target_organization_id and created_by=caller_id and creation_request_id=request_id;
  if found then return existing_id; end if;
  if char_length(trim(requested_name)) not between 2 and 120 then raise exception 'invalid_service'; end if;
  generated_code := trim(both '-' from regexp_replace(lower(extensions.unaccent(trim(requested_name))), '[^a-z0-9]+', '-', 'g'));
  if generated_code='' then generated_code:='service'; end if;
  while exists(select 1 from public.service_definitions where organization_id=target_organization_id and code=generated_code) loop suffix:=suffix+1; generated_code:=split_part(generated_code,'-',1)||'-'||suffix; end loop;
  insert into public.service_definitions(organization_id,code,name,description,created_by,creation_request_id)
  values(target_organization_id,generated_code,trim(requested_name),nullif(trim(requested_description),''),caller_id,request_id) returning id into created_id;
  insert into public.playbook_audit_events(organization_id,event_type,actor_user_id,service_definition_id) values(target_organization_id,'service_created',caller_id,created_id);
  return created_id;
end; $$;

create function public.add_coverage_area(target_organization_id uuid, target_service_id uuid, requested_type public.coverage_area_type, requested_country_code text, requested_value text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare caller_id uuid := (select auth.uid()); created_id uuid; normalized_value text;
begin
  if caller_id is null or qualifyr_private.organization_role_for_user(target_organization_id) not in ('owner','admin') then raise exception 'not_found'; end if;
  if not exists(select 1 from public.service_definitions where organization_id=target_organization_id and id=target_service_id) then raise exception 'not_found'; end if;
  if upper(trim(requested_country_code)) !~ '^[A-Z]{2}$' or char_length(trim(requested_value)) not between 1 and 120 then raise exception 'invalid_coverage'; end if;
  normalized_value:=case when requested_type='country' then upper(trim(requested_country_code)) else trim(requested_value) end;
  insert into public.coverage_areas(organization_id,service_definition_id,area_type,country_code,value,created_by)
  values(target_organization_id,target_service_id,requested_type,upper(trim(requested_country_code)),normalized_value,caller_id)
  on conflict(organization_id,service_definition_id,area_type,country_code,value) do update set value=excluded.value returning id into created_id;
  insert into public.playbook_audit_events(organization_id,event_type,actor_user_id,service_definition_id,metadata) values(target_organization_id,'coverage_added',caller_id,target_service_id,jsonb_build_object('type',requested_type));
  return created_id;
end; $$;

create function public.create_playbook(target_organization_id uuid, target_service_id uuid, requested_name text, requested_description text, requested_schema jsonb, request_id uuid)
returns table(playbook_id uuid, version_id uuid) language plpgsql security definer set search_path = '' as $$
declare caller_id uuid := (select auth.uid()); existing_playbook uuid; existing_version uuid; created_playbook uuid; created_version uuid; generated_code text; suffix integer:=1;
begin
  if caller_id is null or qualifyr_private.organization_role_for_user(target_organization_id) not in ('owner','admin') then raise exception 'not_found'; end if;
  select id into existing_playbook from public.playbooks where organization_id=target_organization_id and created_by=caller_id and creation_request_id=request_id;
  if found then select version.id into existing_version from public.playbook_versions version where version.playbook_id=existing_playbook and version.version_number=1; return query select existing_playbook,existing_version; return; end if;
  if not exists(select 1 from public.service_definitions where organization_id=target_organization_id and id=target_service_id and status='active') then raise exception 'not_found'; end if;
  if char_length(trim(requested_name)) not between 2 and 160 or not qualifyr_private.playbook_schema_is_valid(requested_schema) then raise exception 'invalid_playbook'; end if;
  generated_code:=trim(both '-' from regexp_replace(lower(extensions.unaccent(trim(requested_name))), '[^a-z0-9]+', '-', 'g')); if generated_code='' then generated_code:='playbook'; end if;
  while exists(select 1 from public.playbooks where organization_id=target_organization_id and code=generated_code) loop suffix:=suffix+1; generated_code:=split_part(generated_code,'-',1)||'-'||suffix; end loop;
  insert into public.playbooks(organization_id,service_definition_id,code,name,description,created_by,creation_request_id)
  values(target_organization_id,target_service_id,generated_code,trim(requested_name),nullif(trim(requested_description),''),caller_id,request_id) returning id into created_playbook;
  insert into public.playbook_versions(organization_id,playbook_id,version_number,schema_definition,created_by)
  values(target_organization_id,created_playbook,1,requested_schema,caller_id) returning id into created_version;
  insert into public.playbook_audit_events(organization_id,event_type,actor_user_id,playbook_id,playbook_version_id) values(target_organization_id,'playbook_created',caller_id,created_playbook,created_version);
  return query select created_playbook,created_version;
end; $$;

create function public.create_playbook_version(target_organization_id uuid, target_playbook_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare caller_id uuid := (select auth.uid()); source_schema jsonb; next_number integer; created_version uuid;
begin
  if caller_id is null or qualifyr_private.organization_role_for_user(target_organization_id) not in ('owner','admin') then raise exception 'not_found'; end if;
  if exists(select 1 from public.playbook_versions where organization_id=target_organization_id and playbook_id=target_playbook_id and status='draft') then raise exception 'draft_exists'; end if;
  select v.schema_definition into source_schema from public.playbooks p join public.playbook_versions v on v.id=p.active_version_id where p.organization_id=target_organization_id and p.id=target_playbook_id;
  if not found then raise exception 'not_found'; end if;
  select coalesce(max(version_number),0)+1 into next_number from public.playbook_versions where playbook_id=target_playbook_id;
  insert into public.playbook_versions(organization_id,playbook_id,version_number,schema_definition,created_by) values(target_organization_id,target_playbook_id,next_number,source_schema,caller_id) returning id into created_version;
  insert into public.playbook_audit_events(organization_id,event_type,actor_user_id,playbook_id,playbook_version_id) values(target_organization_id,'version_created',caller_id,target_playbook_id,created_version);
  return created_version;
end; $$;

create function public.update_playbook_draft(target_organization_id uuid, target_version_id uuid, expected_version integer, requested_schema jsonb)
returns integer language plpgsql security definer set search_path = '' as $$
declare caller_id uuid := (select auth.uid()); current_row public.playbook_versions%rowtype; next_lock integer;
begin
  if caller_id is null or qualifyr_private.organization_role_for_user(target_organization_id) not in ('owner','admin') then raise exception 'not_found'; end if;
  select * into current_row from public.playbook_versions where organization_id=target_organization_id and id=target_version_id and status='draft' for update;
  if not found then raise exception 'not_found'; end if; if current_row.lock_version<>expected_version then raise exception 'version_conflict'; end if;
  if not qualifyr_private.playbook_schema_is_valid(requested_schema) then raise exception 'invalid_playbook'; end if;
  next_lock:=current_row.lock_version+1; update public.playbook_versions set schema_definition=requested_schema,lock_version=next_lock where id=current_row.id; return next_lock;
end; $$;

create function public.publish_playbook_version(target_organization_id uuid, target_version_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare caller_id uuid := (select auth.uid()); version_row public.playbook_versions%rowtype;
begin
  if caller_id is null or qualifyr_private.organization_role_for_user(target_organization_id) not in ('owner','admin') then raise exception 'not_found'; end if;
  select * into version_row from public.playbook_versions where organization_id=target_organization_id and id=target_version_id and status='draft' for update;
  if not found or not qualifyr_private.playbook_schema_is_valid(version_row.schema_definition) then raise exception 'not_found'; end if;
  update public.playbook_versions set status='published',published_by=caller_id,published_at=now(),lock_version=lock_version+1 where id=version_row.id;
  update public.playbooks set active_version_id=version_row.id,status='active',updated_at=now() where organization_id=target_organization_id and id=version_row.playbook_id;
  insert into public.playbook_audit_events(organization_id,event_type,actor_user_id,playbook_id,playbook_version_id,metadata) values(target_organization_id,'version_published',caller_id,version_row.playbook_id,version_row.id,jsonb_build_object('version',version_row.version_number));
end; $$;

create function public.associate_dossier_playbook(target_organization_id uuid, target_reference text, target_version_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare caller_id uuid := (select auth.uid()); request_row public.service_requests%rowtype; version_row record;
begin
  if caller_id is null or not qualifyr_private.is_organization_member(target_organization_id) then raise exception 'not_found'; end if;
  select * into request_row from public.service_requests where organization_id=target_organization_id and reference_code=target_reference for update;
  if not found or not qualifyr_private.can_update_service_request(target_organization_id,request_row.created_by,request_row.assigned_user_id) then raise exception 'not_found'; end if;
  select v.id,p.service_definition_id into version_row from public.playbook_versions v join public.playbooks p on p.id=v.playbook_id and p.organization_id=v.organization_id where v.organization_id=target_organization_id and v.id=target_version_id and v.status='published';
  if not found then raise exception 'not_found'; end if;
  update public.service_requests set service_definition_id=version_row.service_definition_id,playbook_version_id=version_row.id,updated_by=caller_id,updated_at=now(),lock_version=lock_version+1 where id=request_row.id;
  delete from public.qualification_results where service_request_id=request_row.id;
  insert into public.playbook_audit_events(organization_id,event_type,actor_user_id,playbook_version_id,service_request_id) values(target_organization_id,'dossier_associated',caller_id,version_row.id,request_row.id);
end; $$;

create function public.calculate_dossier_qualification(target_organization_id uuid, target_reference text, requested_values jsonb, requested_evidence jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare caller_id uuid := (select auth.uid()); request_row public.service_requests%rowtype; schema_row jsonb; service_id uuid; result_id uuid;
  fields_total integer; fields_done integer; proofs_total integer; proofs_done integer; missing jsonb; passed jsonb:='[]'::jsonb; failed jsonb:='[]'::jsonb;
  service_ok boolean; coverage_ok boolean; contact_ok boolean; final_status public.qualification_recommendation; next_action text;
begin
  if caller_id is null or not qualifyr_private.is_organization_member(target_organization_id) or jsonb_typeof(requested_values)<>'object' or jsonb_typeof(requested_evidence)<>'object' or pg_column_size(requested_values)>32768 or pg_column_size(requested_evidence)>16384 then raise exception 'invalid_qualification'; end if;
  select * into request_row from public.service_requests where organization_id=target_organization_id and reference_code=target_reference for update;
  if not found or request_row.playbook_version_id is null or not qualifyr_private.can_update_service_request(target_organization_id,request_row.created_by,request_row.assigned_user_id) then raise exception 'not_found'; end if;
  select v.schema_definition,p.service_definition_id into schema_row,service_id from public.playbook_versions v join public.playbooks p on p.id=v.playbook_id and p.organization_id=v.organization_id where v.organization_id=target_organization_id and v.id=request_row.playbook_version_id and v.status='published';
  if not found then raise exception 'not_found'; end if;
  select count(*)::integer,count(*) filter(where qualifyr_private.json_value_present(requested_values,field->>'key'))::integer into fields_total,fields_done from jsonb_array_elements(schema_row->'fields') field where (field->>'required')::boolean;
  select coalesce(sum((proof->>'minimum')::integer),0)::integer,coalesce(sum(least((proof->>'minimum')::integer,case when jsonb_typeof(requested_evidence->(proof->>'key'))='array' then jsonb_array_length(requested_evidence->(proof->>'key')) else 0 end)),0)::integer into proofs_total,proofs_done from jsonb_array_elements(schema_row->'proofs') proof;
  select coalesce(jsonb_agg(jsonb_build_object('key',field->>'key','label',field->>'label','type','field')),'[]'::jsonb) into missing from jsonb_array_elements(schema_row->'fields') field where (field->>'required')::boolean and not qualifyr_private.json_value_present(requested_values,field->>'key');
  select missing || coalesce(jsonb_agg(jsonb_build_object('key',proof->>'key','label',proof->>'label','type','proof')),'[]'::jsonb) into missing from jsonb_array_elements(schema_row->'proofs') proof where case when jsonb_typeof(requested_evidence->(proof->>'key'))='array' then jsonb_array_length(requested_evidence->(proof->>'key')) else 0 end < (proof->>'minimum')::integer;
  select exists(select 1 from public.service_definitions where organization_id=target_organization_id and id=service_id and status='active') into service_ok;
  select exists(select 1 from public.coverage_areas c where c.organization_id=target_organization_id and c.service_definition_id=service_id and ((c.area_type='country' and c.country_code=upper(coalesce(requested_values->>'country',request_row.country_code))) or (c.area_type='city' and c.country_code=upper(coalesce(requested_values->>'country',request_row.country_code)) and lower(c.value)=lower(coalesce(requested_values->>'city',request_row.city))) or (c.area_type='postal_code' and c.country_code=upper(coalesce(requested_values->>'country',request_row.country_code)) and c.value=coalesce(requested_values->>'postal_code',request_row.postal_code)))) into coverage_ok;
  contact_ok:=qualifyr_private.json_value_present(requested_values,'email') or qualifyr_private.json_value_present(requested_values,'phone') or request_row.requester_email is not null or request_row.requester_phone is not null;
  if service_ok then passed:=passed||jsonb_build_array(jsonb_build_object('rule','service_allowed','label','Service autorisé')); else failed:=failed||jsonb_build_array(jsonb_build_object('rule','service_allowed','label','Service indisponible')); end if;
  if coverage_ok then passed:=passed||jsonb_build_array(jsonb_build_object('rule','coverage_area','label','Zone couverte')); else failed:=failed||jsonb_build_array(jsonb_build_object('rule','coverage_area','label','Zone non couverte')); end if;
  if contact_ok then passed:=passed||jsonb_build_array(jsonb_build_object('rule','contact_available','label','Contact disponible')); else failed:=failed||jsonb_build_array(jsonb_build_object('rule','contact_available','label','Email ou téléphone requis')); end if;
  passed:=passed||jsonb_build_array(jsonb_build_object('rule','human_validation','label','Validation humaine requise'));
  final_status:=case when jsonb_array_length(missing)>0 or jsonb_array_length(failed)>0 then 'incomplete'::public.qualification_recommendation else 'needs_review'::public.qualification_recommendation end;
  next_action:=left(coalesce(nullif(schema_row->>'nextAction',''),'Validation humaine recommandée.'),240);
  insert into public.qualification_results(organization_id,service_request_id,playbook_version_id,field_values,evidence_values,required_fields_completed,required_fields_total,proofs_received,proofs_expected,missing_information,passed_rules,failed_rules,human_validation_required,recommended_status,next_action,evaluated_by)
  values(target_organization_id,request_row.id,request_row.playbook_version_id,requested_values,requested_evidence,fields_done,fields_total,proofs_done,proofs_total,missing,passed,failed,true,final_status,next_action,caller_id)
  on conflict(service_request_id) do update set playbook_version_id=excluded.playbook_version_id,field_values=excluded.field_values,evidence_values=excluded.evidence_values,required_fields_completed=excluded.required_fields_completed,required_fields_total=excluded.required_fields_total,proofs_received=excluded.proofs_received,proofs_expected=excluded.proofs_expected,missing_information=excluded.missing_information,passed_rules=excluded.passed_rules,failed_rules=excluded.failed_rules,human_validation_required=true,recommended_status=excluded.recommended_status,next_action=excluded.next_action,evaluation_version=public.qualification_results.evaluation_version+1,evaluated_by=caller_id,evaluated_at=now(),validated_by=null,validated_at=null returning id into result_id;
  update public.service_requests set status=final_status::text::public.service_request_status,updated_by=caller_id,updated_at=now(),lock_version=lock_version+1 where id=request_row.id;
  insert into public.playbook_audit_events(organization_id,event_type,actor_user_id,playbook_version_id,service_request_id,metadata) values(target_organization_id,'qualification_calculated',caller_id,request_row.playbook_version_id,request_row.id,jsonb_build_object('status',final_status,'fields',fields_done||'/'||fields_total,'proofs',proofs_done||'/'||proofs_total));
  return result_id;
end; $$;

create function public.validate_dossier_qualification(target_organization_id uuid, target_reference text)
returns void language plpgsql security definer set search_path = '' as $$
declare caller_id uuid := (select auth.uid()); request_row public.service_requests%rowtype; result_row public.qualification_results%rowtype;
begin
  if caller_id is null or qualifyr_private.organization_role_for_user(target_organization_id) not in ('owner','admin') then raise exception 'not_found'; end if;
  select * into request_row from public.service_requests where organization_id=target_organization_id and reference_code=target_reference for update;
  if not found then raise exception 'not_found'; end if;
  select * into result_row from public.qualification_results where organization_id=target_organization_id and service_request_id=request_row.id for update;
  if not found or result_row.recommended_status<>'needs_review' or jsonb_array_length(result_row.missing_information)>0 or jsonb_array_length(result_row.failed_rules)>0 then raise exception 'qualification_incomplete'; end if;
  update public.qualification_results set recommended_status='qualified',validated_by=caller_id,validated_at=now() where id=result_row.id;
  update public.service_requests set status='qualified',updated_by=caller_id,updated_at=now(),lock_version=lock_version+1 where id=request_row.id;
  insert into public.service_request_events(organization_id,service_request_id,event_type,actor_user_id,metadata) values(target_organization_id,request_row.id,'status_changed',caller_id,jsonb_build_object('from',request_row.status,'to','qualified','reason','human_validation'));
  insert into public.playbook_audit_events(organization_id,event_type,actor_user_id,playbook_version_id,service_request_id) values(target_organization_id,'qualification_validated',caller_id,result_row.playbook_version_id,request_row.id);
end; $$;

revoke all on function qualifyr_private.playbook_schema_is_valid(jsonb), qualifyr_private.json_value_present(jsonb,text), qualifyr_private.prevent_published_playbook_version_change() from public,anon,authenticated;
revoke all on function public.create_service_definition(uuid,text,text,uuid), public.add_coverage_area(uuid,uuid,public.coverage_area_type,text,text), public.create_playbook(uuid,uuid,text,text,jsonb,uuid), public.create_playbook_version(uuid,uuid), public.update_playbook_draft(uuid,uuid,integer,jsonb), public.publish_playbook_version(uuid,uuid), public.associate_dossier_playbook(uuid,text,uuid), public.calculate_dossier_qualification(uuid,text,jsonb,jsonb), public.validate_dossier_qualification(uuid,text) from public,anon;
grant execute on function public.create_service_definition(uuid,text,text,uuid), public.add_coverage_area(uuid,uuid,public.coverage_area_type,text,text), public.create_playbook(uuid,uuid,text,text,jsonb,uuid), public.create_playbook_version(uuid,uuid), public.update_playbook_draft(uuid,uuid,integer,jsonb), public.publish_playbook_version(uuid,uuid), public.associate_dossier_playbook(uuid,text,uuid), public.calculate_dossier_qualification(uuid,text,jsonb,jsonb), public.validate_dossier_qualification(uuid,text) to authenticated;
