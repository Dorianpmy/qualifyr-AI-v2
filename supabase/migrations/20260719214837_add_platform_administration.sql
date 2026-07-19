create table public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  created_by uuid null references auth.users(id) on delete set null
);

alter table public.platform_admins enable row level security;
alter table public.platform_admins force row level security;
revoke all on table public.platform_admins from anon, authenticated;

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.platform_admins
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_platform_admin() from public, anon;
grant execute on function public.is_platform_admin() to authenticated;

create or replace function public.get_platform_admin_overview()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  if not public.is_platform_admin() then
    raise exception 'platform_admin_required' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'organizations_count', (select count(*) from public.organizations where archived_at is null),
    'users_count', (select count(*) from auth.users),
    'dossiers_count', (select count(*) from public.service_requests),
    'organizations', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', o.id,
        'name', o.name,
        'slug', o.slug,
        'created_at', o.created_at,
        'members_count', (select count(*) from public.organization_memberships m where m.organization_id = o.id and m.status = 'active'),
        'dossiers_count', (select count(*) from public.service_requests d where d.organization_id = o.id)
      ) order by o.created_at desc)
      from public.organizations o
      where o.archived_at is null
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

revoke all on function public.get_platform_admin_overview() from public, anon;
grant execute on function public.get_platform_admin_overview() to authenticated;

insert into public.platform_admins (user_id)
select id from auth.users where lower(email) = 'qualifyragence@gmail.com'
on conflict (user_id) do nothing;
