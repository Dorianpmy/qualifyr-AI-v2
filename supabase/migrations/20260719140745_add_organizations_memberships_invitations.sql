-- Phase 4: complete the canonical organization tenant without introducing a
-- competing workspace concept. Sensitive mutations are atomic RPCs.
create extension if not exists unaccent with schema extensions;

create type public.organization_membership_status as enum ('active', 'suspended', 'removed');
create type public.organization_invitation_status as enum ('pending', 'accepted', 'expired', 'revoked');

alter table public.organizations
  add column country_code text check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  add column locale text check (locale is null or locale ~ '^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$'),
  add column timezone text,
  add column currency text check (currency is null or currency ~ '^[A-Z]{3}$'),
  add column primary_language text check (primary_language is null or primary_language ~ '^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$'),
  add column business_category text check (business_category is null or business_category in (
    'construction_renovation', 'installation', 'maintenance', 'technical_services',
    'professional_cleaning', 'moving_services', 'professional_services', 'other'
  )),
  add column team_size_range text check (team_size_range is null or team_size_range in (
    'solo', '2_5', '6_20', '21_50', '51_plus'
  )),
  add column created_by uuid references auth.users(id) on delete restrict,
  add column onboarding_completed_at timestamptz,
  add column archived_at timestamptz,
  add column version integer not null default 1 check (version > 0),
  add column creation_request_id uuid;

create unique index organizations_creator_request_uidx
  on public.organizations (created_by, creation_request_id)
  where creation_request_id is not null;

alter table public.organization_memberships
  add column status public.organization_membership_status not null default 'active',
  add column joined_at timestamptz not null default now(),
  add column updated_at timestamptz not null default now(),
  add column removed_at timestamptz,
  add column invited_by uuid references auth.users(id) on delete set null;

create index organization_memberships_active_user_idx
  on public.organization_memberships (user_id, organization_id)
  where status = 'active';

create table public.organization_invitations (
  id uuid primary key default extensions.gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email_normalized text not null check (
    char_length(email_normalized) <= 254
    and email_normalized = lower(trim(email_normalized))
    and email_normalized ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ),
  role public.organization_role not null check (role in ('admin', 'member')),
  token_hash bytea not null unique check (octet_length(token_hash) = 32),
  status public.organization_invitation_status not null default 'pending',
  expires_at timestamptz not null,
  invited_by uuid not null references auth.users(id) on delete restrict,
  accepted_by uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  check (expires_at > created_at),
  check ((status = 'accepted') = (accepted_at is not null and accepted_by is not null)),
  check ((status = 'revoked') = (revoked_at is not null))
);

create unique index organization_invitations_pending_email_uidx
  on public.organization_invitations (organization_id, email_normalized)
  where status = 'pending';
create index organization_invitations_organization_idx
  on public.organization_invitations (organization_id, created_at desc);

alter table public.organization_invitations enable row level security;
alter table public.organization_invitations force row level security;

revoke all on public.organization_invitations from anon, authenticated;
grant select (
  id, organization_id, email_normalized, role, status, expires_at,
  invited_by, accepted_by, accepted_at, created_at, revoked_at
) on public.organization_invitations to authenticated;

create or replace function qualifyr_private.is_organization_member(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.organization_memberships membership
    where membership.organization_id = target_organization_id
      and membership.user_id = (select auth.uid())
      and membership.status = 'active'
  );
$$;

create function qualifyr_private.organization_role_for_user(target_organization_id uuid)
returns public.organization_role
language sql
stable
security definer
set search_path = ''
as $$
  select membership.role
  from public.organization_memberships membership
  where membership.organization_id = target_organization_id
    and membership.user_id = (select auth.uid())
    and membership.status = 'active';
$$;

create function qualifyr_private.normalized_organization_slug(input text)
returns text
language sql
immutable
set search_path = ''
as $$
  select trim(both '-' from regexp_replace(
    lower(extensions.unaccent(trim(input))), '[^a-z0-9]+', '-', 'g'
  ));
$$;

revoke all on function qualifyr_private.organization_role_for_user(uuid) from public, anon, authenticated;
revoke all on function qualifyr_private.normalized_organization_slug(text) from public, anon, authenticated;
grant execute on function qualifyr_private.organization_role_for_user(uuid) to authenticated;

drop policy "members can read their organization" on public.organizations;
drop policy "members can read memberships in their organization" on public.organization_memberships;

create policy "active members can read their organization"
on public.organizations for select to authenticated
using (archived_at is null and qualifyr_private.is_organization_member(id));

create policy "active members can read organization memberships"
on public.organization_memberships for select to authenticated
using (qualifyr_private.is_organization_member(organization_id));

create policy "managers can read organization invitations"
on public.organization_invitations for select to authenticated
using (
  qualifyr_private.organization_role_for_user(organization_id) in ('owner', 'admin')
);

create function public.create_organization_with_owner(
  requested_name text,
  requested_slug text,
  requested_country_code text,
  requested_locale text,
  requested_timezone text,
  requested_currency text,
  requested_primary_language text,
  requested_business_category text,
  requested_team_size_range text,
  request_id uuid
)
returns table (organization_id uuid, organization_slug text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  base_slug text;
  final_slug text;
  new_id uuid;
begin
  if caller_id is null then raise exception 'authentication_required'; end if;

  select organization.id, organization.slug into new_id, final_slug
  from public.organizations organization
  where organization.created_by = caller_id and organization.creation_request_id = request_id;
  if found then return query select new_id, final_slug; return; end if;

  if char_length(trim(requested_name)) not between 1 and 120 then raise exception 'invalid_name'; end if;
  base_slug := qualifyr_private.normalized_organization_slug(requested_slug);
  if char_length(base_slug) not between 2 and 60
    or base_slug = any(array['app','auth','api','connexion','inscription','invitation','onboarding','design-system','admin','support'])
  then raise exception 'invalid_slug'; end if;
  if upper(requested_country_code) !~ '^[A-Z]{2}$' then raise exception 'invalid_country'; end if;
  if requested_locale !~ '^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$' then raise exception 'invalid_locale'; end if;
  if upper(requested_currency) !~ '^[A-Z]{3}$' then raise exception 'invalid_currency'; end if;
  if requested_primary_language !~ '^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$' then raise exception 'invalid_language'; end if;
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = requested_timezone) then raise exception 'invalid_timezone'; end if;
  if requested_business_category not in (
    'construction_renovation','installation','maintenance','technical_services',
    'professional_cleaning','moving_services','professional_services','other'
  ) then raise exception 'invalid_category'; end if;
  if requested_team_size_range not in ('solo','2_5','6_20','21_50','51_plus') then raise exception 'invalid_team_size'; end if;

  final_slug := base_slug;
  if exists (select 1 from public.organizations where slug = final_slug) then
    final_slug := left(base_slug, 53) || '-' || left(replace(request_id::text, '-', ''), 6);
  end if;

  insert into public.organizations (
    name, slug, country_code, locale, timezone, currency, primary_language,
    business_category, team_size_range, created_by, onboarding_completed_at,
    creation_request_id
  ) values (
    trim(requested_name), final_slug, upper(requested_country_code), requested_locale,
    requested_timezone, upper(requested_currency), requested_primary_language,
    requested_business_category, requested_team_size_range, caller_id, now(), request_id
  ) returning id into new_id;

  insert into public.organization_memberships (organization_id, user_id, role, status, joined_at)
  values (new_id, caller_id, 'owner', 'active', now());

  return query select new_id, final_slug;
end;
$$;

create function public.create_organization_invitation(
  target_organization_id uuid,
  invited_email text,
  invited_role public.organization_role,
  token_hash_hex text,
  invitation_expires_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  caller_role public.organization_role;
  normalized_email text := lower(trim(invited_email));
  invitation_id uuid;
begin
  if caller_id is null then raise exception 'authentication_required'; end if;
  caller_role := qualifyr_private.organization_role_for_user(target_organization_id);
  if caller_role is null or caller_role = 'member' then raise exception 'forbidden'; end if;
  if invited_role = 'owner' or (caller_role = 'admin' and invited_role <> 'member') then raise exception 'forbidden_role'; end if;
  if normalized_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or char_length(normalized_email) > 254 then raise exception 'invalid_email'; end if;
  if token_hash_hex !~ '^[0-9a-f]{64}$' then raise exception 'invalid_token_hash'; end if;
  if invitation_expires_at <= now() or invitation_expires_at > now() + interval '30 days' then raise exception 'invalid_expiration'; end if;
  if exists (
    select 1 from public.organization_memberships membership
    join auth.users user_account on user_account.id = membership.user_id
    where membership.organization_id = target_organization_id
      and membership.status = 'active'
      and lower(user_account.email) = normalized_email
  ) then raise exception 'already_member'; end if;

  update public.organization_invitations set status = 'revoked', revoked_at = now()
  where organization_id = target_organization_id and email_normalized = normalized_email and status = 'pending';

  insert into public.organization_invitations (
    organization_id, email_normalized, role, token_hash, expires_at, invited_by
  ) values (
    target_organization_id, normalized_email, invited_role,
    decode(token_hash_hex, 'hex'), invitation_expires_at, caller_id
  ) returning id into invitation_id;
  return invitation_id;
end;
$$;

create function public.accept_organization_invitation(raw_token text)
returns table (organization_id uuid, organization_slug text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  caller_email text;
  invitation public.organization_invitations%rowtype;
begin
  if caller_id is null then raise exception 'authentication_required'; end if;
  if char_length(raw_token) not between 32 and 256 then raise exception 'invalid_invitation'; end if;
  select lower(email) into caller_email from auth.users where id = caller_id;
  select * into invitation from public.organization_invitations
  where token_hash = extensions.digest(convert_to(raw_token, 'UTF8'), 'sha256')
  for update;
  if not found or invitation.status <> 'pending' then return; end if;
  if invitation.expires_at <= now() then
    update public.organization_invitations set status = 'expired' where id = invitation.id;
    return;
  end if;
  if invitation.email_normalized <> caller_email then raise exception 'email_mismatch'; end if;

  insert into public.organization_memberships (
    organization_id, user_id, role, status, joined_at, updated_at, removed_at, invited_by
  ) values (
    invitation.organization_id, caller_id, invitation.role, 'active', now(), now(), null, invitation.invited_by
  ) on conflict on constraint organization_memberships_pkey do update set
    role = excluded.role, status = 'active', joined_at = now(), updated_at = now(),
    removed_at = null, invited_by = excluded.invited_by;

  update public.organization_invitations set
    status = 'accepted', accepted_by = caller_id, accepted_at = now()
  where id = invitation.id and status = 'pending';
  if not found then raise exception 'invalid_invitation'; end if;

  return query select organization.id, organization.slug
  from public.organizations organization where organization.id = invitation.organization_id;
end;
$$;

create function public.list_organization_members(target_organization_id uuid)
returns table (
  user_id uuid, first_name text, last_name text, email text,
  role public.organization_role, status public.organization_membership_status,
  joined_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not qualifyr_private.is_organization_member(target_organization_id) then raise exception 'not_found'; end if;
  return query
  select membership.user_id, profile.first_name, profile.last_name, user_account.email::text,
    membership.role, membership.status, membership.joined_at
  from public.organization_memberships membership
  join auth.users user_account on user_account.id = membership.user_id
  left join public.profiles profile on profile.user_id = membership.user_id
  where membership.organization_id = target_organization_id
  order by membership.joined_at;
end;
$$;

create function public.update_organization_member_role(
  target_organization_id uuid,
  target_user_id uuid,
  requested_role public.organization_role
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_role public.organization_role;
begin
  if qualifyr_private.organization_role_for_user(target_organization_id) <> 'owner' then raise exception 'forbidden'; end if;
  if requested_role = 'owner' then raise exception 'forbidden_role'; end if;
  select role into target_role from public.organization_memberships
  where organization_id = target_organization_id and user_id = target_user_id and status = 'active' for update;
  if not found then raise exception 'not_found'; end if;
  if target_role = 'owner' then raise exception 'forbidden'; end if;
  update public.organization_memberships set role = requested_role, updated_at = now()
  where organization_id = target_organization_id and user_id = target_user_id;
end;
$$;

create function public.remove_organization_member(target_organization_id uuid, target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_role public.organization_role;
  target_role public.organization_role;
  owner_count integer;
begin
  caller_role := qualifyr_private.organization_role_for_user(target_organization_id);
  if caller_role is null or caller_role not in ('owner','admin') then raise exception 'forbidden'; end if;
  select role into target_role from public.organization_memberships
  where organization_id = target_organization_id and user_id = target_user_id and status = 'active' for update;
  if not found then raise exception 'not_found'; end if;
  if caller_role = 'admin' and target_role <> 'member' then raise exception 'forbidden'; end if;
  if target_role = 'owner' then
    select count(*) into owner_count from public.organization_memberships
    where organization_id = target_organization_id and role = 'owner' and status = 'active';
    if owner_count <= 1 then raise exception 'last_owner'; end if;
  end if;
  update public.organization_memberships set status = 'removed', removed_at = now(), updated_at = now()
  where organization_id = target_organization_id and user_id = target_user_id;
end;
$$;

create function public.revoke_organization_invitation(target_invitation_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  invitation public.organization_invitations%rowtype;
  caller_role public.organization_role;
begin
  select * into invitation from public.organization_invitations where id = target_invitation_id and status = 'pending' for update;
  if not found then raise exception 'not_found'; end if;
  caller_role := qualifyr_private.organization_role_for_user(invitation.organization_id);
  if caller_role = 'member' or caller_role is null or (caller_role = 'admin' and invitation.role <> 'member') then raise exception 'forbidden'; end if;
  update public.organization_invitations set status = 'revoked', revoked_at = now() where id = target_invitation_id;
end;
$$;

revoke all on function public.create_organization_with_owner(text,text,text,text,text,text,text,text,text,uuid) from public, anon;
revoke all on function public.create_organization_invitation(uuid,text,public.organization_role,text,timestamptz) from public, anon;
revoke all on function public.accept_organization_invitation(text) from public, anon;
revoke all on function public.list_organization_members(uuid) from public, anon;
revoke all on function public.update_organization_member_role(uuid,uuid,public.organization_role) from public, anon;
revoke all on function public.remove_organization_member(uuid,uuid) from public, anon;
revoke all on function public.revoke_organization_invitation(uuid) from public, anon;

grant execute on function public.create_organization_with_owner(text,text,text,text,text,text,text,text,text,uuid) to authenticated;
grant execute on function public.create_organization_invitation(uuid,text,public.organization_role,text,timestamptz) to authenticated;
grant execute on function public.accept_organization_invitation(text) to authenticated;
grant execute on function public.list_organization_members(uuid) to authenticated;
grant execute on function public.update_organization_member_role(uuid,uuid,public.organization_role) to authenticated;
grant execute on function public.remove_organization_member(uuid,uuid) to authenticated;
grant execute on function public.revoke_organization_invitation(uuid) to authenticated;

comment on table public.organization_invitations is
  'Single-use organization invitations. Only SHA-256 token hashes are persisted.';
