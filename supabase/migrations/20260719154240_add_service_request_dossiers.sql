create type public.service_request_source as enum ('manual', 'public_intake', 'email', 'chat', 'import');
create type public.service_request_status as enum ('new', 'collecting', 'incomplete', 'needs_review', 'qualified', 'routed', 'closed');
create type public.preferred_contact_channel as enum ('email', 'phone', 'none');
create type public.service_request_event_type as enum ('created', 'updated', 'status_changed', 'assigned', 'unassigned', 'archived', 'restored', 'exported', 'deleted');

create table public.service_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  reference_code text not null check (reference_code ~ '^D-[A-F0-9]{10}$'),
  title text not null check (char_length(trim(title)) between 3 and 160),
  original_request text not null check (char_length(trim(original_request)) between 10 and 10000),
  source public.service_request_source not null default 'manual',
  status public.service_request_status not null default 'new',
  service_label text not null check (char_length(trim(service_label)) between 2 and 120),
  requester_first_name text check (requester_first_name is null or char_length(trim(requester_first_name)) between 1 and 80),
  requester_last_name text check (requester_last_name is null or char_length(trim(requester_last_name)) between 1 and 80),
  requester_email text check (requester_email is null or char_length(requester_email) <= 254),
  requester_phone text check (requester_phone is null or requester_phone ~ '^\+[1-9][0-9]{7,14}$'),
  preferred_contact_channel public.preferred_contact_channel not null default 'none',
  requester_locale text check (requester_locale is null or requester_locale ~ '^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$'),
  country_code text not null check (country_code ~ '^[A-Z]{2}$'),
  postal_code text not null check (char_length(trim(postal_code)) between 1 and 20),
  city text not null check (char_length(trim(city)) between 1 and 120),
  address_line_1 text check (address_line_1 is null or char_length(trim(address_line_1)) between 1 and 200),
  assigned_user_id uuid references auth.users(id) on delete set null,
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz,
  archived_at timestamptz,
  lock_version integer not null default 1 check (lock_version > 0),
  creation_request_id uuid not null,
  unique (organization_id, reference_code),
  unique (organization_id, created_by, creation_request_id),
  check (requester_email is not null or requester_phone is not null),
  check ((status = 'closed') = (closed_at is not null))
);

create table public.service_request_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  service_request_id uuid not null references public.service_requests(id) on delete cascade,
  event_type public.service_request_event_type not null,
  actor_user_id uuid not null references auth.users(id) on delete restrict,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object' and pg_column_size(metadata) <= 2048),
  created_at timestamptz not null default now()
);

create index service_requests_organization_updated_idx on public.service_requests (organization_id, archived_at, updated_at desc);
create index service_requests_organization_status_idx on public.service_requests (organization_id, status, updated_at desc);
create index service_requests_organization_assignee_idx on public.service_requests (organization_id, assigned_user_id, updated_at desc);
create index service_requests_organization_country_idx on public.service_requests (organization_id, country_code, updated_at desc);
create index service_request_events_request_idx on public.service_request_events (organization_id, service_request_id, created_at desc);

alter table public.service_requests enable row level security;
alter table public.service_requests force row level security;
alter table public.service_request_events enable row level security;
alter table public.service_request_events force row level security;

revoke all on public.service_requests from anon, authenticated;
revoke all on public.service_request_events from anon, authenticated;
grant select on public.service_requests to authenticated;
grant select on public.service_request_events to authenticated;

create policy "active members can read service requests"
on public.service_requests for select to authenticated
using ((select qualifyr_private.is_organization_member(organization_id)));

create policy "active members can read service request events"
on public.service_request_events for select to authenticated
using ((select qualifyr_private.is_organization_member(organization_id)));

create function qualifyr_private.can_update_service_request(target_organization_id uuid, creator_id uuid, assignee_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select case qualifyr_private.organization_role_for_user(target_organization_id)
    when 'owner' then true when 'admin' then true when 'member' then (select auth.uid()) in (creator_id, assignee_id)
    else false end;
$$;
revoke all on function qualifyr_private.can_update_service_request(uuid, uuid, uuid) from public, anon, authenticated;

create function public.create_service_request(
  target_organization_id uuid, requested_title text, requested_original_request text, requested_service_label text,
  requested_first_name text, requested_last_name text, requested_email text, requested_phone text,
  requested_contact_channel public.preferred_contact_channel, requested_locale text, requested_country_code text,
  requested_postal_code text, requested_city text, requested_address text, requested_assignee uuid, request_id uuid
) returns table (reference_code text, lock_version integer)
language plpgsql security definer set search_path = '' as $$
declare caller_id uuid := (select auth.uid()); new_id uuid; new_reference text; attempt integer := 0;
begin
  if caller_id is null or not qualifyr_private.is_organization_member(target_organization_id) then raise exception 'not_found'; end if;
  return query select existing.reference_code, existing.lock_version from public.service_requests existing
    where existing.organization_id = target_organization_id and existing.created_by = caller_id and existing.creation_request_id = request_id;
  if found then return; end if;
  if char_length(trim(requested_title)) not between 3 and 160 or char_length(trim(requested_original_request)) not between 10 and 10000
    or char_length(trim(requested_service_label)) not between 2 and 120 then raise exception 'invalid_request'; end if;
  if requested_email is null and requested_phone is null then raise exception 'contact_required'; end if;
  if requested_email is not null and lower(trim(requested_email)) !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then raise exception 'invalid_email'; end if;
  if requested_phone is not null and trim(requested_phone) !~ '^\+[1-9][0-9]{7,14}$' then raise exception 'invalid_phone'; end if;
  if requested_contact_channel='email' and requested_email is null then raise exception 'invalid_contact_channel'; end if;
  if requested_contact_channel='phone' and requested_phone is null then raise exception 'invalid_contact_channel'; end if;
  if upper(trim(requested_country_code)) !~ '^[A-Z]{2}$' or char_length(trim(requested_postal_code)) not between 1 and 20 or char_length(trim(requested_city)) not between 1 and 120 then raise exception 'invalid_location'; end if;
  if requested_locale is not null and requested_locale !~ '^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$' then raise exception 'invalid_locale'; end if;
  if requested_assignee is not null and qualifyr_private.organization_role_for_user(target_organization_id) not in ('owner','admin') then raise exception 'invalid_assignee'; end if;
  if requested_assignee is not null and not exists (select 1 from public.organization_memberships m where m.organization_id = target_organization_id and m.user_id = requested_assignee and m.status = 'active') then raise exception 'invalid_assignee'; end if;
  loop
    attempt := attempt + 1; new_reference := 'D-' || upper(substr(pg_catalog.encode(extensions.gen_random_bytes(8), 'hex'), 1, 10));
    exit when not exists (select 1 from public.service_requests r where r.organization_id = target_organization_id and r.reference_code = new_reference);
    if attempt >= 5 then raise exception 'reference_generation_failed'; end if;
  end loop;
  insert into public.service_requests (organization_id, reference_code, title, original_request, service_label, requester_first_name, requester_last_name, requester_email, requester_phone, preferred_contact_channel, requester_locale, country_code, postal_code, city, address_line_1, assigned_user_id, created_by, updated_by, creation_request_id)
  values (target_organization_id, new_reference, trim(requested_title), trim(requested_original_request), trim(requested_service_label), nullif(trim(requested_first_name),''), nullif(trim(requested_last_name),''), nullif(lower(trim(requested_email)),''), nullif(trim(requested_phone),''), requested_contact_channel, nullif(trim(requested_locale),''), upper(trim(requested_country_code)), trim(requested_postal_code), trim(requested_city), nullif(trim(requested_address),''), requested_assignee, caller_id, caller_id, request_id)
  returning id into new_id;
  insert into public.service_request_events (organization_id, service_request_id, event_type, actor_user_id) values (target_organization_id, new_id, 'created', caller_id);
  return query select new_reference, 1;
end; $$;

create function public.update_service_request(
  target_organization_id uuid, target_reference text, expected_version integer, requested_title text,
  requested_original_request text, requested_service_label text, requested_first_name text, requested_last_name text,
  requested_email text, requested_phone text, requested_contact_channel public.preferred_contact_channel,
  requested_locale text, requested_country_code text, requested_postal_code text, requested_city text, requested_address text
) returns integer language plpgsql security definer set search_path = '' as $$
declare caller_id uuid := (select auth.uid()); request_row public.service_requests%rowtype; new_version integer;
begin
  if caller_id is null or not qualifyr_private.is_organization_member(target_organization_id) then raise exception 'not_found'; end if;
  select * into request_row from public.service_requests r where r.organization_id = target_organization_id and r.reference_code = target_reference for update;
  if not found or not qualifyr_private.can_update_service_request(target_organization_id, request_row.created_by, request_row.assigned_user_id) then raise exception 'not_found'; end if;
  if request_row.lock_version <> expected_version then raise exception 'version_conflict'; end if;
  if char_length(trim(requested_title)) not between 3 and 160 or char_length(trim(requested_original_request)) not between 10 and 10000 or char_length(trim(requested_service_label)) not between 2 and 120 then raise exception 'invalid_request'; end if;
  if requested_email is null and requested_phone is null then raise exception 'contact_required'; end if;
  if requested_email is not null and lower(trim(requested_email)) !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then raise exception 'invalid_email'; end if;
  if requested_phone is not null and trim(requested_phone) !~ '^\+[1-9][0-9]{7,14}$' then raise exception 'invalid_phone'; end if;
  if requested_contact_channel='email' and requested_email is null then raise exception 'invalid_contact_channel'; end if;
  if requested_contact_channel='phone' and requested_phone is null then raise exception 'invalid_contact_channel'; end if;
  if upper(trim(requested_country_code)) !~ '^[A-Z]{2}$' or char_length(trim(requested_postal_code)) not between 1 and 20 or char_length(trim(requested_city)) not between 1 and 120 then raise exception 'invalid_location'; end if;
  if requested_locale is not null and requested_locale !~ '^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$' then raise exception 'invalid_locale'; end if;
  new_version := request_row.lock_version + 1;
  update public.service_requests set title=trim(requested_title), original_request=trim(requested_original_request), service_label=trim(requested_service_label), requester_first_name=nullif(trim(requested_first_name),''), requester_last_name=nullif(trim(requested_last_name),''), requester_email=nullif(lower(trim(requested_email)),''), requester_phone=nullif(trim(requested_phone),''), preferred_contact_channel=requested_contact_channel, requester_locale=nullif(trim(requested_locale),''), country_code=upper(trim(requested_country_code)), postal_code=trim(requested_postal_code), city=trim(requested_city), address_line_1=nullif(trim(requested_address),''), updated_by=caller_id, updated_at=now(), lock_version=new_version where id=request_row.id;
  insert into public.service_request_events (organization_id,service_request_id,event_type,actor_user_id) values(target_organization_id,request_row.id,'updated',caller_id);
  return new_version;
end; $$;

create function public.transition_service_request_status(target_organization_id uuid, target_reference text, expected_version integer, requested_status public.service_request_status, reason text)
returns integer language plpgsql security definer set search_path = '' as $$
declare caller_id uuid := (select auth.uid()); r public.service_requests%rowtype; allowed boolean := false; new_version integer;
begin
  if caller_id is null or not qualifyr_private.is_organization_member(target_organization_id) then raise exception 'not_found'; end if;
  select * into r from public.service_requests s where s.organization_id=target_organization_id and s.reference_code=target_reference for update;
  if not found or not qualifyr_private.can_update_service_request(target_organization_id,r.created_by,r.assigned_user_id) then raise exception 'not_found'; end if;
  if r.lock_version<>expected_version then raise exception 'version_conflict'; end if;
  allowed := (r.status='new' and requested_status in ('collecting','incomplete','needs_review','closed')) or (r.status='collecting' and requested_status in ('incomplete','needs_review','closed')) or (r.status='incomplete' and requested_status in ('collecting','needs_review','closed')) or (r.status='needs_review' and requested_status in ('collecting','incomplete','closed')) or (r.status='closed' and requested_status='new');
  if not allowed or requested_status in ('qualified','routed') then raise exception 'invalid_transition'; end if;
  if reason is not null and char_length(trim(reason))>240 then raise exception 'invalid_reason'; end if;
  new_version:=r.lock_version+1;
  update public.service_requests set status=requested_status, closed_at=case when requested_status='closed' then now() else null end, updated_by=caller_id, updated_at=now(), lock_version=new_version where id=r.id;
  insert into public.service_request_events(organization_id,service_request_id,event_type,actor_user_id,metadata) values(target_organization_id,r.id,'status_changed',caller_id,jsonb_strip_nulls(jsonb_build_object('from',r.status,'to',requested_status,'reason',nullif(trim(reason),''))));
  return new_version;
end; $$;

create function public.assign_service_request(target_organization_id uuid, target_reference text, expected_version integer, requested_assignee uuid)
returns integer language plpgsql security definer set search_path = '' as $$
declare caller_id uuid := (select auth.uid()); r public.service_requests%rowtype; caller_role public.organization_role; new_version integer;
begin
  caller_role:=qualifyr_private.organization_role_for_user(target_organization_id);
  if caller_id is null or caller_role not in ('owner','admin') then raise exception 'not_found'; end if;
  select * into r from public.service_requests s where s.organization_id=target_organization_id and s.reference_code=target_reference for update;
  if not found then raise exception 'not_found'; end if;
  if r.lock_version<>expected_version then raise exception 'version_conflict'; end if;
  if requested_assignee is not null and not exists(select 1 from public.organization_memberships m where m.organization_id=target_organization_id and m.user_id=requested_assignee and m.status='active') then raise exception 'invalid_assignee'; end if;
  new_version:=r.lock_version+1;
  update public.service_requests set assigned_user_id=requested_assignee,updated_by=caller_id,updated_at=now(),lock_version=new_version where id=r.id;
  insert into public.service_request_events(organization_id,service_request_id,event_type,actor_user_id,metadata) values(target_organization_id,r.id,case when requested_assignee is null then 'unassigned'::public.service_request_event_type else 'assigned'::public.service_request_event_type end,caller_id,jsonb_build_object('previous_assignee',r.assigned_user_id,'new_assignee',requested_assignee));
  return new_version;
end; $$;

create function public.set_service_request_archived(target_organization_id uuid,target_reference text,expected_version integer,should_archive boolean)
returns integer language plpgsql security definer set search_path = '' as $$
declare caller_id uuid := (select auth.uid()); r public.service_requests%rowtype; role public.organization_role; new_version integer;
begin
  role:=qualifyr_private.organization_role_for_user(target_organization_id);
  select * into r from public.service_requests s where s.organization_id=target_organization_id and s.reference_code=target_reference for update;
  if not found or caller_id is null or role is null then raise exception 'not_found'; end if;
  if should_archive and not (role in ('owner','admin') or (role='member' and caller_id in (r.created_by,r.assigned_user_id))) then raise exception 'not_found'; end if;
  if not should_archive and role not in ('owner','admin') then raise exception 'not_found'; end if;
  if r.lock_version<>expected_version then raise exception 'version_conflict'; end if;
  new_version:=r.lock_version+1;
  update public.service_requests set archived_at=case when should_archive then now() else null end,updated_by=caller_id,updated_at=now(),lock_version=new_version where id=r.id;
  insert into public.service_request_events(organization_id,service_request_id,event_type,actor_user_id) values(target_organization_id,r.id,case when should_archive then 'archived'::public.service_request_event_type else 'restored'::public.service_request_event_type end,caller_id);
  return new_version;
end; $$;

create function public.record_service_request_export(target_organization_id uuid,target_reference text)
returns void language plpgsql security definer set search_path = '' as $$
declare caller_id uuid := (select auth.uid()); request_id uuid;
begin
  if qualifyr_private.organization_role_for_user(target_organization_id) not in ('owner','admin') then raise exception 'not_found'; end if;
  select id into request_id from public.service_requests where organization_id=target_organization_id and reference_code=target_reference;
  if not found then raise exception 'not_found'; end if;
  insert into public.service_request_events(organization_id,service_request_id,event_type,actor_user_id) values(target_organization_id,request_id,'exported',caller_id);
end; $$;

create function public.delete_service_request(target_organization_id uuid,target_reference text,confirmation_reference text)
returns void language plpgsql security definer set search_path = '' as $$
declare request_id uuid;
begin
  if qualifyr_private.organization_role_for_user(target_organization_id)<>'owner' or target_reference<>confirmation_reference then raise exception 'not_found'; end if;
  select id into request_id from public.service_requests where organization_id=target_organization_id and reference_code=target_reference for update;
  if not found then raise exception 'not_found'; end if;
  delete from public.service_requests where id=request_id;
end; $$;

create function public.list_service_requests(
  target_organization_id uuid, search_query text default null, status_filter public.service_request_status default null,
  assignee_filter uuid default null, country_filter text default null, archive_filter text default 'active',
  sort_order text default 'updated_desc', page_number integer default 1, page_size integer default 20
) returns table(reference_code text,title text,service_label text,requester_name text,city text,country_code text,status public.service_request_status,assignee_name text,updated_at timestamptz,created_at timestamptz,is_archived boolean,total_count bigint)
language plpgsql stable security definer set search_path = '' as $$
declare normalized_query text := nullif(trim(search_query),''); safe_page integer := greatest(1,least(page_number,10000)); safe_size integer := greatest(1,least(page_size,50));
begin
  if not qualifyr_private.is_organization_member(target_organization_id) then raise exception 'not_found'; end if;
  if archive_filter not in ('active','archived','all') or sort_order not in ('updated_desc','updated_asc','created_desc','created_asc') then raise exception 'invalid_filter'; end if;
  return query
  select r.reference_code,r.title,r.service_label,nullif(trim(concat_ws(' ',r.requester_first_name,r.requester_last_name)),''),r.city,r.country_code,r.status,
    nullif(trim(concat_ws(' ',p.first_name,p.last_name)),''),r.updated_at,r.created_at,(r.archived_at is not null),count(*) over()
  from public.service_requests r
  left join public.profiles p on p.user_id=r.assigned_user_id
  where r.organization_id=target_organization_id
    and (status_filter is null or r.status=status_filter)
    and (assignee_filter is null or r.assigned_user_id=assignee_filter)
    and (country_filter is null or r.country_code=upper(country_filter))
    and (archive_filter='all' or (archive_filter='active' and r.archived_at is null) or (archive_filter='archived' and r.archived_at is not null))
    and (normalized_query is null or r.reference_code ilike '%'||normalized_query||'%' or r.title ilike '%'||normalized_query||'%' or r.service_label ilike '%'||normalized_query||'%' or r.requester_first_name ilike '%'||normalized_query||'%' or r.requester_last_name ilike '%'||normalized_query||'%' or r.requester_email ilike '%'||lower(normalized_query)||'%' or r.city ilike '%'||normalized_query||'%')
  order by
    case when sort_order='updated_asc' then r.updated_at end asc,
    case when sort_order='created_asc' then r.created_at end asc,
    case when sort_order='created_desc' then r.created_at end desc,
    case when sort_order='updated_desc' then r.updated_at end desc,
    r.id desc
  limit safe_size offset ((safe_page-1)*safe_size);
end; $$;

revoke all on function public.create_service_request(uuid,text,text,text,text,text,text,text,public.preferred_contact_channel,text,text,text,text,text,uuid,uuid) from public,anon;
revoke all on function public.update_service_request(uuid,text,integer,text,text,text,text,text,text,text,public.preferred_contact_channel,text,text,text,text,text) from public,anon;
revoke all on function public.transition_service_request_status(uuid,text,integer,public.service_request_status,text) from public,anon;
revoke all on function public.assign_service_request(uuid,text,integer,uuid) from public,anon;
revoke all on function public.set_service_request_archived(uuid,text,integer,boolean) from public,anon;
revoke all on function public.record_service_request_export(uuid,text) from public,anon;
revoke all on function public.delete_service_request(uuid,text,text) from public,anon;
revoke all on function public.list_service_requests(uuid,text,public.service_request_status,uuid,text,text,text,integer,integer) from public,anon;
grant execute on function public.create_service_request(uuid,text,text,text,text,text,text,text,public.preferred_contact_channel,text,text,text,text,text,uuid,uuid) to authenticated;
grant execute on function public.update_service_request(uuid,text,integer,text,text,text,text,text,text,text,public.preferred_contact_channel,text,text,text,text,text) to authenticated;
grant execute on function public.transition_service_request_status(uuid,text,integer,public.service_request_status,text) to authenticated;
grant execute on function public.assign_service_request(uuid,text,integer,uuid) to authenticated;
grant execute on function public.set_service_request_archived(uuid,text,integer,boolean) to authenticated;
grant execute on function public.record_service_request_export(uuid,text) to authenticated;
grant execute on function public.delete_service_request(uuid,text,text) to authenticated;
grant execute on function public.list_service_requests(uuid,text,public.service_request_status,uuid,text,text,text,integer,integer) to authenticated;

comment on table public.service_requests is 'Organization-scoped service request dossiers. No AI qualification payload.';
comment on table public.service_request_events is 'Minimized audit history for service requests; no duplicated requester PII.';
