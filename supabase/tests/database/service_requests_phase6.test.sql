begin;

create extension if not exists pgtap with schema extensions;
select plan(30);

select has_table('public', 'service_requests', 'service requests table exists');
select has_table('public', 'service_request_events', 'service request events table exists');
select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid='public.service_requests'::regclass), 'service requests enable and force RLS');
select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid='public.service_request_events'::regclass), 'service request events enable and force RLS');
select policies_are('public','service_requests',array['active members can read service requests'],'service requests expose one tenant read policy');
select policies_are('public','service_request_events',array['active members can read service request events'],'events expose one tenant read policy');

insert into auth.users (id,instance_id,aud,role,email,encrypted_password,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values
('61000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','owner-a-dossier@example.test','','{}','{}',now(),now()),
('62000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','admin-a-dossier@example.test','','{}','{}',now(),now()),
('63000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','member-a-dossier@example.test','','{}','{}',now(),now()),
('64000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000000','authenticated','authenticated','owner-b-dossier@example.test','','{}','{}',now(),now());

insert into public.organizations(id,name,slug,created_by) values
('71000000-0000-0000-0000-000000000001','Dossiers Alpha','dossiers-alpha','61000000-0000-0000-0000-000000000001'),
('72000000-0000-0000-0000-000000000002','Dossiers Beta','dossiers-beta','64000000-0000-0000-0000-000000000004');
insert into public.organization_memberships(organization_id,user_id,role,status) values
('71000000-0000-0000-0000-000000000001','61000000-0000-0000-0000-000000000001','owner','active'),
('71000000-0000-0000-0000-000000000001','62000000-0000-0000-0000-000000000002','admin','active'),
('71000000-0000-0000-0000-000000000001','63000000-0000-0000-0000-000000000003','member','active'),
('72000000-0000-0000-0000-000000000002','64000000-0000-0000-0000-000000000004','owner','active');

create temporary table test_dossiers(key text primary key, reference_code text not null, lock_version integer not null);
grant select,insert,update on test_dossiers to authenticated;

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"61000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
select lives_ok($$select public.create_service_request('71000000-0000-0000-0000-000000000001','Chaudière en panne','La chaudière ne démarre plus depuis ce matin.','Dépannage','Ada','Martin','ADA@EXAMPLE.TEST',null,'email','fr-FR','FR','75011','Paris','1 rue Test','63000000-0000-0000-0000-000000000003','81000000-0000-4000-8000-000000000001')$$,'owner creates an assigned dossier');
insert into test_dossiers select 'owner',reference_code,lock_version from public.create_service_request('71000000-0000-0000-0000-000000000001','Chaudière en panne','La chaudière ne démarre plus depuis ce matin.','Dépannage','Ada','Martin','ADA@EXAMPLE.TEST',null,'email','fr-FR','FR','75011','Paris','1 rue Test','63000000-0000-0000-0000-000000000003','81000000-0000-4000-8000-000000000001');
select ok((select reference_code ~ '^D-[A-F0-9]{10}$' from test_dossiers where key='owner'),'reference is opaque and prefixed');
select is((select count(*)::integer from public.service_requests where creation_request_id='81000000-0000-4000-8000-000000000001'),1,'creation is idempotent');
select is((select requester_email from public.service_requests where reference_code=(select reference_code from test_dossiers where key='owner')),'ada@example.test','email is normalized');
select is((select count(*)::integer from public.service_request_events where service_request_id=(select id from public.service_requests where reference_code=(select reference_code from test_dossiers where key='owner'))),1,'creation records one minimized event');
select is((select count(*)::integer from public.service_requests where organization_id='72000000-0000-0000-0000-000000000002'),0,'tenant A cannot read tenant B dossiers');
select throws_ok($$update public.service_requests set title='Direct write' where true$$,'42501',null,'authenticated callers cannot write tables directly');

select set_config('request.jwt.claims','{"sub":"63000000-0000-0000-0000-000000000003","role":"authenticated"}',true);
select throws_ok($$select public.create_service_request('71000000-0000-0000-0000-000000000001','Demande membre assignée','Le membre tente une assignation à la création.','Entretien','Jean','Test','member@example.test',null,'email','fr-FR','BE','1000','Bruxelles','', '63000000-0000-0000-0000-000000000003','81000000-0000-4000-8000-000000000002')$$,'P0001','invalid_assignee','member cannot assign during creation');
select lives_ok($$select public.create_service_request('71000000-0000-0000-0000-000000000001','Demande du membre','Une demande valide créée par un membre actif.','Entretien','Jean','Test',null,'+3225550101','phone','fr-BE','BE','1000','Bruxelles','',null,'81000000-0000-4000-8000-000000000003')$$,'member creates an unassigned dossier');
insert into test_dossiers select 'member',reference_code,lock_version from public.create_service_request('71000000-0000-0000-0000-000000000001','Demande du membre','Une demande valide créée par un membre actif.','Entretien','Jean','Test',null,'+3225550101','phone','fr-BE','BE','1000','Bruxelles','',null,'81000000-0000-4000-8000-000000000003');
select lives_ok(format($$select public.update_service_request('71000000-0000-0000-0000-000000000001','%s',1,'Demande du membre mise à jour','Une demande valide et mise à jour par son créateur.','Entretien','Jean','Test',null,'+3225550101','phone','fr-BE','BE','1000','Bruxelles','')$$,(select reference_code from test_dossiers where key='member')),'member updates own dossier');
select throws_ok(format($$select public.transition_service_request_status('71000000-0000-0000-0000-000000000001','%s',1,'qualified',null)$$,(select reference_code from test_dossiers where key='owner')),'P0001','invalid_transition','future qualified status is blocked');

select set_config('request.jwt.claims','{"sub":"62000000-0000-0000-0000-000000000002","role":"authenticated"}',true);
select lives_ok(format($$select public.transition_service_request_status('71000000-0000-0000-0000-000000000001','%s',1,'collecting','Prise en charge')$$,(select reference_code from test_dossiers where key='owner')),'allowed status transition succeeds');
select throws_ok(format($$select public.transition_service_request_status('71000000-0000-0000-0000-000000000001','%s',1,'closed',null)$$,(select reference_code from test_dossiers where key='owner')),'P0001','version_conflict','stale writes are rejected');
select lives_ok(format($$select public.assign_service_request('71000000-0000-0000-0000-000000000001','%s',2,null)$$,(select reference_code from test_dossiers where key='owner')),'admin can unassign an active tenant member');
select throws_ok(format($$select public.assign_service_request('71000000-0000-0000-0000-000000000001','%s',3,'64000000-0000-0000-0000-000000000004')$$,(select reference_code from test_dossiers where key='owner')),'P0001','invalid_assignee','cross-tenant assignee is rejected');
select lives_ok(format($$select public.set_service_request_archived('71000000-0000-0000-0000-000000000001','%s',3,true)$$,(select reference_code from test_dossiers where key='owner')),'admin archives dossier');
select is((select count(*)::integer from public.list_service_requests('71000000-0000-0000-0000-000000000001',null,null,null,null,'archived','updated_desc',1,20)),1,'list RPC applies archive and tenant filters');
select throws_ok(format($$select public.delete_service_request('71000000-0000-0000-0000-000000000001','%s','%s')$$,(select reference_code from test_dossiers where key='owner'),(select reference_code from test_dossiers where key='owner')),'P0001','not_found','admin cannot hard delete');

select set_config('request.jwt.claims','{"sub":"61000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
select lives_ok(format($$select public.set_service_request_archived('71000000-0000-0000-0000-000000000001','%s',4,false)$$,(select reference_code from test_dossiers where key='owner')),'owner restores dossier');
select lives_ok(format($$select public.record_service_request_export('71000000-0000-0000-0000-000000000001','%s')$$,(select reference_code from test_dossiers where key='owner')),'owner export is audited');
select is((select count(*)::integer from public.service_request_events e join public.service_requests r on r.id=e.service_request_id where r.reference_code=(select reference_code from test_dossiers where key='owner') and e.event_type='exported'),1,'export event is persisted');
select lives_ok(format($$select public.delete_service_request('71000000-0000-0000-0000-000000000001','%s','%s')$$,(select reference_code from test_dossiers where key='owner'),(select reference_code from test_dossiers where key='owner')),'owner hard deletes with exact confirmation');
select is((select count(*)::integer from public.service_requests where reference_code=(select reference_code from test_dossiers where key='owner')),0,'hard deletion removes dossier and cascading history');

reset role;
set local role anon;
select throws_ok($$select public.list_service_requests('71000000-0000-0000-0000-000000000001')$$,'42501',null,'anonymous callers cannot execute dossier RPCs');

select * from finish();
rollback;
