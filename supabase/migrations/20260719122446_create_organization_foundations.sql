-- Qualifyr AI V2: tenant boundary only. No business entities belong here yet.
create extension if not exists pgcrypto with schema extensions;

create type public.organization_role as enum ('owner', 'admin', 'member');

create table public.organizations (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_memberships (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.organization_role not null default 'member',
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create index organization_memberships_user_id_idx
  on public.organization_memberships (user_id, organization_id);

alter table public.organizations enable row level security;
alter table public.organizations force row level security;
alter table public.organization_memberships enable row level security;
alter table public.organization_memberships force row level security;

-- New Supabase projects no longer expose SQL-created tables automatically.
-- Grant only the read surface required by the policies below.
revoke all on public.organizations from anon, authenticated;
revoke all on public.organization_memberships from anon, authenticated;
grant select on public.organizations to authenticated;
grant select on public.organization_memberships to authenticated;

create schema if not exists qualifyr_private;
revoke all on schema qualifyr_private from public, anon, authenticated;

-- SECURITY DEFINER is deliberately isolated in a non-exposed schema to avoid
-- recursive membership policies. The caller can only reach it through RLS.
create function qualifyr_private.is_organization_member(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_memberships membership
    where membership.organization_id = target_organization_id
      and membership.user_id = (select auth.uid())
  );
$$;

revoke all on function qualifyr_private.is_organization_member(uuid) from public, anon, authenticated;
grant usage on schema qualifyr_private to authenticated;
grant execute on function qualifyr_private.is_organization_member(uuid) to authenticated;

create policy "members can read their organization"
on public.organizations
for select
to authenticated
using (qualifyr_private.is_organization_member(id));

create policy "members can read memberships in their organization"
on public.organization_memberships
for select
to authenticated
using (qualifyr_private.is_organization_member(organization_id));

comment on table public.organizations is
  'Tenant root. Every future private business resource must reference an organization.';
comment on table public.organization_memberships is
  'Authorization link between Supabase Auth users and Qualifyr organizations.';
