begin;

create extension if not exists pgtap with schema extensions;
select plan(7);

insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) values
(
  '51000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'regression-owner@example.test',
  '',
  '{}',
  '{}',
  now(),
  now()
),
(
  '52000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'regression-member@example.test',
  '',
  '{"organization_role":"owner","platform_admin":true}',
  '{"role":"owner","organization_role":"owner","platform_admin":true}',
  now(),
  now()
);

create temporary table regression_org (
  id uuid primary key
);

grant select, insert on regression_org to authenticated;

set local role authenticated;

select set_config(
  'request.jwt.claims',
  '{"sub":"51000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);

insert into regression_org
select organization_id
from public.create_organization_with_owner(
  'Regression Services',
  'regression-services',
  'FR',
  'fr-FR',
  'Europe/Paris',
  'EUR',
  'fr',
  'technical_services',
  '2_5',
  '51000000-0000-4000-8000-000000000001'
);

reset role;

insert into public.organization_memberships (
  organization_id,
  user_id,
  role,
  status,
  joined_at,
  updated_at
)
select
  id,
  '52000000-0000-0000-0000-000000000002',
  'member',
  'active',
  now(),
  now()
from regression_org;

set local role authenticated;

select set_config(
  'request.jwt.claims',
  '{
    "sub":"52000000-0000-0000-0000-000000000002",
    "role":"authenticated",
    "organization_role":"owner",
    "platform_admin":true,
    "app_metadata":{
      "organization_role":"owner",
      "platform_admin":true
    },
    "user_metadata":{
      "role":"owner",
      "organization_role":"owner",
      "platform_admin":true
    }
  }',
  true
);

select is(
  (
    select role::text
    from public.organization_memberships
    where organization_id = (select id from regression_org)
      and user_id = '52000000-0000-0000-0000-000000000002'
  ),
  'member',
  'forged JWT claims do not change the persisted organization role'
);

select is(
  qualifyr_private.organization_role_for_user(
    (select id from regression_org)
  )::text,
  'member',
  'organization role is derived from membership, not JWT payload claims'
);

select is(
  public.is_platform_admin(),
  false,
  'forged platform_admin claim does not grant platform administration'
);

select throws_ok(
  $$select public.get_platform_admin_overview()$$,
  '42501',
  'platform_admin_required',
  'forged platform_admin claim cannot access the platform admin overview'
);

select throws_ok(
  format(
    $$select public.create_organization_invitation(
      '%s',
      'forged-invite@example.test',
      'member',
      repeat('a', 64),
      now() + interval '7 days'
    )$$,
    (select id from regression_org)
  ),
  'P0001',
  'forbidden',
  'forged owner claim cannot create organization invitations'
);

select throws_ok(
  format(
    $$select public.update_organization_member_role(
      '%s',
      '52000000-0000-0000-0000-000000000002',
      'admin'
    )$$,
    (select id from regression_org)
  ),
  'P0001',
  'forbidden',
  'forged owner claim cannot promote the current member'
);

reset role;

select is(
  (
    select count(*)::integer
    from public.platform_admins
    where user_id = '52000000-0000-0000-0000-000000000002'
  ),
  0,
  'forged claims never persist a platform admin record'
);

select * from finish();
rollback;
