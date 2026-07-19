begin;

create extension if not exists pgtap with schema extensions;
select plan(30);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, raw_app_meta_data, raw_user_meta_data, created_at, updated_at) values
('41000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','owner-a@example.test','','{}','{}',now(),now()),
('42000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','owner-b@example.test','','{}','{}',now(),now()),
('43000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','member-a@example.test','','{}','{}',now(),now()),
('44000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000000','authenticated','authenticated','member-b@example.test','','{}','{}',now(),now()),
('45000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000000','authenticated','authenticated','invitee@example.test','','{}','{}',now(),now()),
('46000000-0000-0000-0000-000000000006','00000000-0000-0000-0000-000000000000','authenticated','authenticated','wrong@example.test','','{}','{}',now(),now());

create temporary table test_org_ids (key text primary key, id uuid not null);
grant select on test_org_ids to authenticated;

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"41000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
select lives_ok($$select public.create_organization_with_owner('Alpha Services','alpha-services','FR','fr-FR','Europe/Paris','EUR','fr','technical_services','2_5','41000000-0000-4000-8000-000000000001')$$, 'owner A creates a French organization');
reset role;
insert into test_org_ids select 'a', id from public.organizations where slug = 'alpha-services';

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"41000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
select lives_ok($$select public.create_organization_with_owner('Alpha Services','alpha-services','FR','fr-FR','Europe/Paris','EUR','fr','technical_services','2_5','41000000-0000-4000-8000-000000000001')$$, 'organization creation is idempotent');
select is((select count(*)::integer from public.organizations where slug = 'alpha-services'), 1, 'double submission creates no duplicate');
select is((select role::text from public.organization_memberships where organization_id=(select id from test_org_ids where key='a') and user_id='41000000-0000-0000-0000-000000000001'), 'owner', 'creator receives owner membership');
select lives_ok($$select public.create_organization_with_owner('Polska Serwis','polska-serwis','PL','pl-PL','Europe/Warsaw','PLN','pl','maintenance','6_20','41000000-0000-4000-8000-000000000002')$$, 'same user creates a Polish organization');
reset role;
insert into test_org_ids select 'pl', id from public.organizations where slug = 'polska-serwis';

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"42000000-0000-0000-0000-000000000002","role":"authenticated"}',true);
select lives_ok($$select public.create_organization_with_owner('Beta Romania','beta-romania','RO','ro-RO','Europe/Bucharest','RON','ro','installation','2_5','42000000-0000-4000-8000-000000000001')$$, 'owner B creates a Romanian organization');
reset role;
insert into test_org_ids select 'b', id from public.organizations where slug = 'beta-romania';
insert into public.organization_memberships (organization_id,user_id,role,status) values
((select id from test_org_ids where key='a'),'43000000-0000-0000-0000-000000000003','member','active'),
((select id from test_org_ids where key='b'),'44000000-0000-0000-0000-000000000004','member','active');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"41000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
select is((select count(*)::integer from public.organizations), 2, 'owner A sees only both own organizations');
select is((select count(*)::integer from public.organizations where id=(select id from test_org_ids where key='b')), 0, 'owner A cannot read organization B');
select is((select count(*)::integer from public.organization_memberships where organization_id=(select id from test_org_ids where key='b')), 0, 'owner A cannot list members B');
select throws_ok($$select token_hash from public.organization_invitations$$, '42501', null, 'token hashes are never selectable by authenticated users');
select lives_ok(format($$select public.create_organization_invitation('%s','invitee@example.test','admin',encode(extensions.digest('phase-four-invitation-token-alpha-0001','sha256'),'hex'),now()+interval '7 days')$$,(select id from test_org_ids where key='a')), 'owner invites an admin');
select is((select count(*)::integer from public.organization_invitations where organization_id=(select id from test_org_ids where key='a')), 1, 'manager sees only own invitation');

select set_config('request.jwt.claims','{"sub":"43000000-0000-0000-0000-000000000003","role":"authenticated"}',true);
select throws_ok(format($$select public.create_organization_invitation('%s','new@example.test','member',repeat('a',64),now()+interval '7 days')$$,(select id from test_org_ids where key='a')), 'P0001', 'forbidden', 'member cannot invite');

select set_config('request.jwt.claims','{"sub":"42000000-0000-0000-0000-000000000002","role":"authenticated"}',true);
select throws_ok(format($$select public.create_organization_invitation('%s','cross@example.test','member',repeat('b',64),now()+interval '7 days')$$,(select id from test_org_ids where key='a')), 'P0001', 'forbidden', 'owner B cannot invite in A');

select set_config('request.jwt.claims','{"sub":"45000000-0000-0000-0000-000000000005","role":"authenticated"}',true);
select lives_ok($$select public.accept_organization_invitation('phase-four-invitation-token-alpha-0001')$$, 'matching invitee accepts invitation');
select is((select role::text from public.organization_memberships where organization_id=(select id from test_org_ids where key='a') and user_id='45000000-0000-0000-0000-000000000005'), 'admin', 'acceptance creates requested membership');
select is((select count(*)::integer from public.accept_organization_invitation('phase-four-invitation-token-alpha-0001')), 0, 'accepted token cannot be reused');

select set_config('request.jwt.claims','{"sub":"41000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
select lives_ok(format($$select public.create_organization_invitation('%s','target@example.test','member',encode(extensions.digest('phase-four-invitation-token-alpha-0002','sha256'),'hex'),now()+interval '7 days')$$,(select id from test_org_ids where key='a')), 'owner can invite member');
select set_config('request.jwt.claims','{"sub":"46000000-0000-0000-0000-000000000006","role":"authenticated"}',true);
select throws_ok($$select public.accept_organization_invitation('phase-four-invitation-token-alpha-0002')$$, 'P0001', 'email_mismatch', 'different email cannot accept');

select set_config('request.jwt.claims','{"sub":"45000000-0000-0000-0000-000000000005","role":"authenticated"}',true);
select lives_ok(format($$select public.create_organization_invitation('%s','new-member@example.test','member',repeat('c',64),now()+interval '7 days')$$,(select id from test_org_ids where key='a')), 'admin can invite a member');
select throws_ok(format($$select public.create_organization_invitation('%s','new-admin@example.test','admin',repeat('d',64),now()+interval '7 days')$$,(select id from test_org_ids where key='a')), 'P0001', 'forbidden_role', 'admin cannot invite admin');
select throws_ok(format($$select public.create_organization_invitation('%s','new-owner@example.test','owner',repeat('e',64),now()+interval '7 days')$$,(select id from test_org_ids where key='a')), 'P0001', 'forbidden_role', 'admin cannot invite owner');

select set_config('request.jwt.claims','{"sub":"41000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
select throws_ok(format($$select public.remove_organization_member('%s','41000000-0000-0000-0000-000000000001')$$,(select id from test_org_ids where key='a')), 'P0001', 'last_owner', 'last owner cannot be removed');
select lives_ok(format($$select public.update_organization_member_role('%s','43000000-0000-0000-0000-000000000003','admin')$$,(select id from test_org_ids where key='a')), 'owner updates member role');
select lives_ok(format($$select public.remove_organization_member('%s','43000000-0000-0000-0000-000000000003')$$,(select id from test_org_ids where key='a')), 'owner removes member');
select set_config('request.jwt.claims','{"sub":"43000000-0000-0000-0000-000000000003","role":"authenticated"}',true);
select is((select count(*)::integer from public.organizations where id=(select id from test_org_ids where key='a')), 0, 'removed member loses access immediately');

reset role;
insert into public.organization_invitations (organization_id,email_normalized,role,token_hash,status,created_at,expires_at,invited_by)
values ((select id from test_org_ids where key='b'),'wrong@example.test','member',extensions.digest('expired-phase-four-token-000000000001','sha256'),'pending',now()-interval '2 hours',now()-interval '1 hour','42000000-0000-0000-0000-000000000002');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"46000000-0000-0000-0000-000000000006","role":"authenticated"}',true);
select is((select count(*)::integer from public.accept_organization_invitation('expired-phase-four-token-000000000001')), 0, 'expired invitation is refused');
reset role;
select is((select status::text from public.organization_invitations where email_normalized='wrong@example.test'), 'expired', 'expired invitation status is persisted');

set local role anon;
select throws_ok($$select * from public.organizations$$, '42501', 'permission denied for table organizations', 'anonymous users cannot read organizations');
select throws_ok($$select public.create_organization_with_owner('Anon','anon-org','CH','fr-CH','Europe/Zurich','CHF','fr','other','solo','47000000-0000-4000-8000-000000000001')$$, '42501', null, 'anonymous users cannot create organizations');

select * from finish();
rollback;
