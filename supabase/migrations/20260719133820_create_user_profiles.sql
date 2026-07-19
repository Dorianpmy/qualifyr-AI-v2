-- Minimal user profile foundation. No organization or business data belongs here.
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  first_name text check (
    first_name is null or char_length(trim(first_name)) between 1 and 80
  ),
  last_name text check (
    last_name is null or char_length(trim(last_name)) between 1 and 80
  ),
  avatar_url text check (
    avatar_url is null or (
      char_length(avatar_url) <= 2048
      and avatar_url ~ '^https?://'
    )
  ),
  country_code text check (
    country_code is null or country_code ~ '^[A-Z]{2}$'
  ),
  locale text not null default 'fr' check (
    locale ~ '^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$'
  ),
  timezone text not null default 'UTC' check (
    timezone = 'UTC'
    or timezone ~ '^[A-Za-z_]+(/[A-Za-z0-9_+\-]+)+$'
  ),
  currency text check (
    currency is null or currency ~ '^[A-Z]{3}$'
  ),
  primary_language text not null default 'fr' check (
    primary_language ~ '^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$'
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.profiles force row level security;

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (
  first_name,
  last_name,
  avatar_url,
  country_code,
  locale,
  timezone,
  currency,
  primary_language
) on public.profiles to authenticated;

create policy "users can read their own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "users can update their own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- Trigger-only profile creation keeps anonymous users from writing directly.
-- User metadata initializes display fields only and is never used for authorization.
create function qualifyr_private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_locale text := nullif(trim(new.raw_user_meta_data ->> 'locale'), '');
  requested_timezone text := nullif(trim(new.raw_user_meta_data ->> 'timezone'), '');
  requested_language text := nullif(trim(new.raw_user_meta_data ->> 'primary_language'), '');
begin
  insert into public.profiles (
    user_id,
    first_name,
    last_name,
    country_code,
    locale,
    timezone,
    currency,
    primary_language
  ) values (
    new.id,
    nullif(left(trim(new.raw_user_meta_data ->> 'first_name'), 80), ''),
    nullif(left(trim(new.raw_user_meta_data ->> 'last_name'), 80), ''),
    case when upper(trim(new.raw_user_meta_data ->> 'country_code')) ~ '^[A-Z]{2}$'
      then upper(trim(new.raw_user_meta_data ->> 'country_code')) end,
    case when requested_locale ~ '^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$'
      then requested_locale else 'fr' end,
    case when requested_timezone = 'UTC' or exists (
      select 1 from pg_catalog.pg_timezone_names where name = requested_timezone
    ) then requested_timezone else 'UTC' end,
    case when upper(trim(new.raw_user_meta_data ->> 'currency')) ~ '^[A-Z]{3}$'
      then upper(trim(new.raw_user_meta_data ->> 'currency')) end,
    case when requested_language ~ '^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$'
      then requested_language else 'fr' end
  );
  return new;
end;
$$;

revoke all on function qualifyr_private.handle_new_auth_user()
from public, anon, authenticated;

create trigger on_auth_user_created_create_profile
after insert on auth.users
for each row execute function qualifyr_private.handle_new_auth_user();

create function qualifyr_private.set_profile_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function qualifyr_private.set_profile_updated_at()
from public, anon, authenticated;

create trigger before_profile_update_set_timestamp
before update on public.profiles
for each row execute function qualifyr_private.set_profile_updated_at();

comment on table public.profiles is
  'Private per-user identity and international preferences. No authorization data.';
comment on column public.profiles.country_code is 'ISO 3166-1 alpha-2 code.';
comment on column public.profiles.locale is 'BCP 47 locale.';
comment on column public.profiles.timezone is 'IANA timezone identifier.';
comment on column public.profiles.currency is 'ISO 4217 currency code.';
comment on column public.profiles.primary_language is 'BCP 47 language tag.';
