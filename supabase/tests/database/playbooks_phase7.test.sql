begin;

create extension if not exists pgtap with schema extensions;
select plan(25);

select has_table('public','service_definitions','services table exists');
select has_table('public','playbooks','playbooks table exists');
select has_table('public','playbook_versions','version table exists');
select has_table('public','qualification_results','qualification results table exists');
select ok((select bool_and(relrowsecurity and relforcerowsecurity) from pg_class where oid in ('public.service_definitions'::regclass,'public.coverage_areas'::regclass,'public.playbooks'::regclass,'public.playbook_versions'::regclass,'public.qualification_results'::regclass,'public.playbook_audit_events'::regclass)),'all phase 7 tables enable and force RLS');
select policies_are('public','playbooks',array['active members can read playbooks'],'playbooks expose one restrictive read policy');
select policies_are('public','qualification_results',array['active members can read qualification results'],'results expose one restrictive read policy');

insert into auth.users(id,instance_id,aud,role,email,encrypted_password,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values
('a1000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','owner-playbook@example.test','','{}','{}',now(),now()),
('a2000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','member-playbook@example.test','','{}','{}',now(),now()),
('a3000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','other-playbook@example.test','','{}','{}',now(),now());
insert into public.organizations(id,name,slug,created_by) values
('b1000000-0000-0000-0000-000000000001','Playbooks Alpha','playbooks-alpha','a1000000-0000-0000-0000-000000000001'),
('b2000000-0000-0000-0000-000000000002','Playbooks Beta','playbooks-beta','a3000000-0000-0000-0000-000000000003');
insert into public.organization_memberships(organization_id,user_id,role,status) values
('b1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001','owner','active'),
('b1000000-0000-0000-0000-000000000001','a2000000-0000-0000-0000-000000000002','member','active'),
('b2000000-0000-0000-0000-000000000002','a3000000-0000-0000-0000-000000000003','owner','active');
insert into public.service_requests(id,organization_id,reference_code,title,original_request,service_label,requester_email,country_code,postal_code,city,created_by,updated_by,creation_request_id)
values('c1000000-0000-0000-0000-000000000001','b1000000-0000-0000-0000-000000000001','D-A1B2C3D4E5','Rénovation salle de bain','Je souhaite refaire la salle de bain.','Rénovation salle de bain','client@example.test','BE','5000','Namur','a1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001','c2000000-0000-4000-8000-000000000002');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"a1000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
select lives_ok($$select public.create_service_definition('b1000000-0000-0000-0000-000000000001','Rénovation salle de bain','Travaux intérieurs','d1000000-0000-4000-8000-000000000001')$$,'owner creates service');
select is((select count(*)::integer from public.service_definitions where organization_id='b1000000-0000-0000-0000-000000000001'),1,'service creation is tenant scoped');
select lives_ok($$select public.add_coverage_area('b1000000-0000-0000-0000-000000000001',(select id from public.service_definitions limit 1),'city','BE','Namur')$$,'owner adds Namur coverage');
select lives_ok($$select public.create_playbook('b1000000-0000-0000-0000-000000000001',(select id from public.service_definitions limit 1),'Demande de devis rénovation','Démo','{"fields":[{"key":"project","label":"Projet","type":"text","required":true,"question":"Quel projet ?"},{"key":"city","label":"Ville","type":"city","required":true,"question":"Dans quelle ville ?"}],"proofs":[{"key":"photos","label":"Photo du chantier","minimum":1}],"rules":[{"type":"service_allowed"},{"type":"coverage_area"},{"type":"required_field"},{"type":"required_photo"},{"type":"contact_available"},{"type":"human_validation"}],"nextAction":"Planifier une visite technique"}'::jsonb,'d2000000-0000-4000-8000-000000000002')$$,'owner creates playbook draft');
select lives_ok($$select public.publish_playbook_version('b1000000-0000-0000-0000-000000000001',(select id from public.playbook_versions limit 1))$$,'owner publishes version');
select throws_ok($$update public.playbook_versions set schema_definition='{}' where true$$,'42501',null,'direct writes are denied');
select lives_ok($$select public.associate_dossier_playbook('b1000000-0000-0000-0000-000000000001','D-A1B2C3D4E5',(select id from public.playbook_versions limit 1))$$,'published version associates to dossier');
select lives_ok($$select public.calculate_dossier_qualification('b1000000-0000-0000-0000-000000000001','D-A1B2C3D4E5','{"project":"Réfection complète","city":"Namur"}'::jsonb,'{}'::jsonb)$$,'qualification calculates without photo');
select is((select recommended_status::text from public.qualification_results),'incomplete','missing photo makes dossier incomplete');
select lives_ok($$select public.calculate_dossier_qualification('b1000000-0000-0000-0000-000000000001','D-A1B2C3D4E5','{"project":"Réfection complète","city":"Namur"}'::jsonb,'{"photos":[{"reference":"photo-1"}]}'::jsonb)$$,'qualification recalculates with photo');
select is((select recommended_status::text from public.qualification_results),'needs_review','complete dossier requires human review');
select lives_ok($$select public.validate_dossier_qualification('b1000000-0000-0000-0000-000000000001','D-A1B2C3D4E5')$$,'owner validates qualification');
select is((select recommended_status::text from public.qualification_results),'qualified','human validation qualifies dossier');
select is((select next_action from public.qualification_results),'Planifier une visite technique','next action remains explainable');

select set_config('request.jwt.claims','{"sub":"a2000000-0000-0000-0000-000000000002","role":"authenticated"}',true);
select throws_ok($$select public.create_service_definition('b1000000-0000-0000-0000-000000000001','Interdit','','d3000000-0000-4000-8000-000000000003')$$,'P0001','not_found','member cannot configure services');
select throws_ok($$select public.validate_dossier_qualification('b1000000-0000-0000-0000-000000000001','D-A1B2C3D4E5')$$,'P0001','not_found','member cannot validate qualification');

select set_config('request.jwt.claims','{"sub":"a3000000-0000-0000-0000-000000000003","role":"authenticated"}',true);
select is((select count(*)::integer from public.playbooks),0,'other tenant cannot read playbooks');
select throws_ok($$select public.associate_dossier_playbook('b1000000-0000-0000-0000-000000000001','D-A1B2C3D4E5','00000000-0000-0000-0000-000000000000')$$,'P0001','not_found','cross-tenant association is hidden');

select * from finish();
rollback;
