begin;

alter table public.whatsapp_message_events
  add column if not exists message_kind text not null default 'text'
  check (message_kind in ('text', 'image', 'document'));

create table if not exists public.whatsapp_media (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  event_id uuid not null unique references public.whatsapp_message_events(id) on delete cascade,
  service_request_id uuid not null references public.service_requests(id) on delete cascade,
  intake_session_id uuid not null references public.intake_sessions(id) on delete cascade,
  provider_media_id text not null,
  media_kind text not null check (media_kind in ('image', 'document')),
  mime_type text not null,
  file_name text,
  file_size bigint check (file_size is null or file_size between 0 and 15728640),
  sha256 text,
  storage_bucket text not null default 'whatsapp-media',
  storage_path text,
  status text not null default 'processing' check (status in ('processing', 'ready', 'failed')),
  failure_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, provider_media_id)
);

create index if not exists whatsapp_media_request_idx
  on public.whatsapp_media (organization_id, service_request_id, created_at desc);

alter table public.whatsapp_media enable row level security;
alter table public.whatsapp_media force row level security;
revoke all on public.whatsapp_media from anon, authenticated;
grant select on public.whatsapp_media to authenticated;
grant all on public.whatsapp_media to service_role;

drop policy if exists whatsapp_media_member_select on public.whatsapp_media;
create policy whatsapp_media_member_select on public.whatsapp_media
for select to authenticated
using (qualifyr_private.organization_role_for_user(organization_id) is not null);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'whatsapp-media',
  'whatsapp-media',
  false,
  15728640,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists whatsapp_media_object_member_select on storage.objects;
create policy whatsapp_media_object_member_select on storage.objects
for select to authenticated
using (
  bucket_id = 'whatsapp-media'
  and exists (
    select 1 from public.whatsapp_media wm
    where wm.storage_bucket = storage.objects.bucket_id
      and wm.storage_path = storage.objects.name
      and qualifyr_private.organization_role_for_user(wm.organization_id) is not null
  )
);

create table if not exists public.whatsapp_operational_alerts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  event_id uuid references public.whatsapp_message_events(id) on delete cascade,
  severity text not null check (severity in ('warning', 'error')),
  code text not null,
  status text not null default 'open' check (status in ('open', 'resolved')),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists whatsapp_alerts_open_idx
  on public.whatsapp_operational_alerts (organization_id, created_at desc)
  where status = 'open';

alter table public.whatsapp_operational_alerts enable row level security;
alter table public.whatsapp_operational_alerts force row level security;
revoke all on public.whatsapp_operational_alerts from anon, authenticated;
grant select, update on public.whatsapp_operational_alerts to authenticated;
grant all on public.whatsapp_operational_alerts to service_role;

drop policy if exists whatsapp_alerts_manager_select on public.whatsapp_operational_alerts;
create policy whatsapp_alerts_manager_select on public.whatsapp_operational_alerts
for select to authenticated
using (qualifyr_private.organization_role_for_user(organization_id) in ('owner', 'admin'));

drop policy if exists whatsapp_alerts_manager_update on public.whatsapp_operational_alerts;
create policy whatsapp_alerts_manager_update on public.whatsapp_operational_alerts
for update to authenticated
using (qualifyr_private.organization_role_for_user(organization_id) in ('owner', 'admin'))
with check (qualifyr_private.organization_role_for_user(organization_id) in ('owner', 'admin'));

create or replace function public.register_whatsapp_media(
  target_event_id uuid,
  requested_provider_media_id text,
  requested_media_kind text,
  requested_mime_type text,
  requested_file_name text default null,
  requested_sha256 text default null
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  target_event public.whatsapp_message_events%rowtype;
  media_id uuid;
begin
  if auth.role() <> 'service_role' then raise exception 'forbidden' using errcode = '42501'; end if;
  if requested_media_kind not in ('image', 'document') then raise exception 'invalid_media_kind'; end if;
  select * into target_event from public.whatsapp_message_events where id = target_event_id for update;
  if not found then raise exception 'event_not_found'; end if;
  update public.whatsapp_message_events set message_kind = requested_media_kind where id = target_event_id;
  insert into public.whatsapp_media (
    organization_id, event_id, service_request_id, intake_session_id,
    provider_media_id, media_kind, mime_type, file_name, sha256
  ) values (
    target_event.organization_id, target_event.id, target_event.service_request_id,
    target_event.intake_session_id, requested_provider_media_id, requested_media_kind,
    requested_mime_type, nullif(trim(requested_file_name), ''), requested_sha256
  )
  on conflict (event_id) do update set updated_at = now()
  returning id into media_id;
  return media_id;
end;
$$;

revoke all on function public.register_whatsapp_media(uuid, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.register_whatsapp_media(uuid, text, text, text, text, text) to service_role;

commit;
