begin;

create extension if not exists pgtap with schema extensions;

select plan(8);

select has_table('public', 'organizations', 'organizations table exists');
select has_table(
  'public',
  'organization_memberships',
  'organization memberships table exists'
);
select col_is_pk('public', 'organizations', 'id', 'organizations uses id as primary key');
select col_is_pk(
  'public',
  'organization_memberships',
  array['organization_id', 'user_id'],
  'memberships use a tenant/user composite primary key'
);
select ok(
  (select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.organizations'::regclass),
  'organizations enables and forces RLS'
);
select ok(
  (select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.organization_memberships'::regclass),
  'memberships enable and force RLS'
);
select policies_are(
  'public',
  'organizations',
  array['members can read their organization'],
  'organizations exposes only its membership read policy'
);
select policies_are(
  'public',
  'organization_memberships',
  array['members can read memberships in their organization'],
  'memberships expose only their tenant read policy'
);

select * from finish();
rollback;
