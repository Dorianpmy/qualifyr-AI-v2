begin;

create extension if not exists pgtap with schema extensions;

select plan(12);

select has_table('public', 'profiles', 'profiles table exists');
select col_is_pk('public', 'profiles', 'user_id', 'one profile exists per user');
select ok(
  (select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.profiles'::regclass),
  'profiles enables and forces RLS'
);
select policies_are(
  'public',
  'profiles',
  array['users can read their own profile', 'users can update their own profile'],
  'profiles exposes only owner read and update policies'
);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  (
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'one@example.test', '',
    '{}', '{"first_name":"Ana","last_name":"Test","locale":"ro-RO","timezone":"Europe/Bucharest","currency":"RON","country_code":"RO","primary_language":"ro"}',
    now(), now()
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'two@example.test', '',
    '{}', '{"first_name":"Luc","last_name":"Test","locale":"fr-BE","timezone":"Europe/Brussels","currency":"EUR","country_code":"BE","primary_language":"fr"}',
    now(), now()
  );

select is(
  (select count(*)::integer from public.profiles where user_id in (
    '10000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000002'
  )),
  2,
  'auth user creation creates one profile per user'
);
select is(
  (select locale from public.profiles where user_id = '10000000-0000-0000-0000-000000000001'),
  'ro-RO',
  'international locale is preserved'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);

select is(
  (select count(*)::integer from public.profiles),
  1,
  'authenticated user reads only their profile'
);
select is(
  (select first_name from public.profiles),
  'Ana',
  'authenticated user reads their own profile values'
);

update public.profiles set timezone = 'Europe/Paris'
where user_id = '20000000-0000-0000-0000-000000000002';
select is(
  (select timezone from public.profiles where user_id = '10000000-0000-0000-0000-000000000001'),
  'Europe/Bucharest',
  'authenticated user cannot update another profile'
);

update public.profiles set timezone = 'Europe/Warsaw'
where user_id = '10000000-0000-0000-0000-000000000001';
select is(
  (select timezone from public.profiles where user_id = '10000000-0000-0000-0000-000000000001'),
  'Europe/Warsaw',
  'authenticated user can update their profile'
);

reset role;
set local role anon;
select throws_ok(
  $$select * from public.profiles$$,
  '42501',
  'permission denied for table profiles',
  'anonymous users cannot read profiles'
);
select throws_ok(
  $$insert into public.profiles (user_id) values ('30000000-0000-0000-0000-000000000003')$$,
  '42501',
  'permission denied for table profiles',
  'anonymous users cannot write profiles'
);

select * from finish();
rollback;
