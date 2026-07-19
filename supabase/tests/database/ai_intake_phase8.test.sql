begin;
create extension if not exists pgtap with schema extensions;
select plan(37);
select has_table('public','intake_sessions','intake sessions table exists');
select has_table('public','intake_messages','intake messages table exists');
select has_table('public','extracted_facts','extracted facts table exists');
select has_table('public','ai_executions','AI executions table exists');
select ok((select bool_and(relrowsecurity and relforcerowsecurity) from pg_class where oid in ('public.intake_sessions'::regclass,'public.intake_messages'::regclass,'public.extracted_facts'::regclass,'public.ai_executions'::regclass)),'all AI Intake tables enable and force RLS');
select policies_are('public','intake_sessions',array['active members can read intake sessions'],'session read policy is tenant scoped');
select policies_are('public','intake_messages',array['active members can read intake messages'],'message read policy is tenant scoped');
select policies_are('public','extracted_facts',array['active members can read extracted facts'],'fact read policy is tenant scoped');
select policies_are('public','ai_executions',array['managers can read ai executions'],'run read policy is manager scoped');

insert into auth.users(id,instance_id,aud,role,email,encrypted_password,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values
('e1000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','owner-intake@example.test','','{}','{}',now(),now()),
('e2000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','member-intake@example.test','','{}','{}',now(),now()),
('e3000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','other-intake@example.test','','{}','{}',now(),now());
insert into public.organizations(id,name,slug,created_by,locale) values
('f1000000-0000-0000-0000-000000000001','Intake Alpha','intake-alpha','e1000000-0000-0000-0000-000000000001','fr-BE'),
('f2000000-0000-0000-0000-000000000002','Intake Beta','intake-beta','e3000000-0000-0000-0000-000000000003','pl-PL');
insert into public.organization_memberships(organization_id,user_id,role,status) values
('f1000000-0000-0000-0000-000000000001','e1000000-0000-0000-0000-000000000001','owner','active'),
('f1000000-0000-0000-0000-000000000001','e2000000-0000-0000-0000-000000000002','member','active'),
('f2000000-0000-0000-0000-000000000002','e3000000-0000-0000-0000-000000000003','owner','active');
insert into public.service_definitions(id,organization_id,code,name,status,created_by,creation_request_id) values
('11000000-0000-0000-0000-000000000001','f1000000-0000-0000-0000-000000000001','renovation-salle-de-bain','Rénovation salle de bain','active','e1000000-0000-0000-0000-000000000001','12000000-0000-4000-8000-000000000001'),
('21000000-0000-0000-0000-000000000002','f2000000-0000-0000-0000-000000000002','remont-lazienki','Remont łazienki','active','e3000000-0000-0000-0000-000000000003','22000000-0000-4000-8000-000000000002');
insert into public.playbooks(id,organization_id,service_definition_id,code,name,status,created_by,creation_request_id) values
('31000000-0000-0000-0000-000000000001','f1000000-0000-0000-0000-000000000001','11000000-0000-0000-0000-000000000001','devis-renovation','Devis rénovation','draft','e1000000-0000-0000-0000-000000000001','32000000-0000-4000-8000-000000000001'),
('41000000-0000-0000-0000-000000000002','f2000000-0000-0000-0000-000000000002','21000000-0000-0000-0000-000000000002','remont-intake','Remont intake','draft','e3000000-0000-0000-0000-000000000003','42000000-0000-4000-8000-000000000002');
insert into public.playbook_versions(id,organization_id,playbook_id,version_number,status,schema_definition,created_by,published_by,published_at) values
('51000000-0000-0000-0000-000000000001','f1000000-0000-0000-0000-000000000001','31000000-0000-0000-0000-000000000001',1,'published','{"fields":[{"key":"city","label":"Ville","type":"city","required":true,"question":"Dans quelle ville ?"},{"key":"surface","label":"Surface","type":"number","required":true,"question":"Quelle surface ?"}],"proofs":[{"key":"photos","label":"Photos","minimum":1}],"rules":[{"type":"required_field"},{"type":"required_photo"},{"type":"human_validation"}],"nextAction":"Visite"}','e1000000-0000-0000-0000-000000000001','e1000000-0000-0000-0000-000000000001',now()),
('61000000-0000-0000-0000-000000000002','f2000000-0000-0000-0000-000000000002','41000000-0000-0000-0000-000000000002',1,'published','{"fields":[{"key":"city","label":"Miasto","type":"city","required":true,"question":"Gdzie?"}],"proofs":[],"rules":[{"type":"required_field"},{"type":"human_validation"}],"nextAction":"Kontakt"}','e3000000-0000-0000-0000-000000000003','e3000000-0000-0000-0000-000000000003',now());
update public.playbooks set status='active',active_version_id=case organization_id when 'f1000000-0000-0000-0000-000000000001' then '51000000-0000-0000-0000-000000000001'::uuid else '61000000-0000-0000-0000-000000000002'::uuid end;
insert into public.service_requests(id,organization_id,reference_code,title,original_request,service_label,requester_email,country_code,postal_code,city,assigned_user_id,service_definition_id,playbook_version_id,created_by,updated_by,creation_request_id) values
('71000000-0000-0000-0000-000000000001','f1000000-0000-0000-0000-000000000001','D-ABCDEF1234','Salle de bain Namur','Demande libre','Rénovation','client@example.test','BE','5000','Namur','e2000000-0000-0000-0000-000000000002','11000000-0000-0000-0000-000000000001','51000000-0000-0000-0000-000000000001','e1000000-0000-0000-0000-000000000001','e1000000-0000-0000-0000-000000000001','72000000-0000-4000-8000-000000000001'),
('81000000-0000-0000-0000-000000000002','f2000000-0000-0000-0000-000000000002','D-1234ABCDEF','Łazienka','Prośba o remont łazienki','Remont','client-b@example.test','PL','00-001','Warszawa',null,'21000000-0000-0000-0000-000000000002','61000000-0000-0000-0000-000000000002','e3000000-0000-0000-0000-000000000003','e3000000-0000-0000-0000-000000000003','82000000-0000-4000-8000-000000000002');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"e1000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
select lives_ok($$select public.start_intake_session('f1000000-0000-0000-0000-000000000001','D-ABCDEF1234','fr-BE')$$,'owner starts session');
select is((select count(*)::integer from public.intake_sessions),1,'one session is created');
select lives_ok($$select public.start_intake_session('f1000000-0000-0000-0000-000000000001','D-ABCDEF1234','fr-BE')$$,'starting session is idempotent');
select is((select count(*)::integer from public.intake_sessions),1,'active session is not duplicated');
select lives_ok($$select public.append_intake_user_message('f1000000-0000-0000-0000-000000000001',(select id from public.intake_sessions),'Bonjour Namur, 8 m²','91000000-0000-4000-8000-000000000001')$$,'user message is recorded');
select lives_ok($$select public.append_intake_user_message('f1000000-0000-0000-0000-000000000001',(select id from public.intake_sessions),'duplicate ignored','91000000-0000-4000-8000-000000000001')$$,'message retry is idempotent');
select is((select count(*)::integer from public.intake_messages where role='user'),1,'retry creates no duplicate message');
select lives_ok($$select public.record_intake_success('f1000000-0000-0000-0000-000000000001',(select id from public.intake_sessions),(select id from public.intake_messages where role='user'),'{"detectedServiceKey":"renovation-salle-de-bain","serviceConfidence":0.9,"extractedFacts":[{"fieldKey":"city","value":"Namur","valueType":"city","confidence":0.97,"sourceExcerpt":"Namur","needsConfirmation":false},{"fieldKey":"surface","value":8,"valueType":"number","confidence":0.94,"sourceExcerpt":"8 m²","needsConfirmation":false}],"contradictions":[],"missingInformationSummary":[],"proposedNextQuestion":"Quelle rénovation ?","responseMessage":"J’ai noté Namur et 8 m². Quelle rénovation souhaitez-vous ?","requiresHumanReview":false}', 'deterministic-test','deterministic-v1','intake-v1',12,0,0,'92000000-0000-4000-8000-000000000001')$$,'validated extraction is persisted');
select is((select count(*)::integer from public.extracted_facts),2,'facts keep source provenance');
select is((select count(*)::integer from public.intake_messages),2,'assistant response is appended once');
select is((select status::text from public.ai_executions),'succeeded','minimized run succeeds');
select is((select structured_output ? 'responseMessage' from public.ai_executions),true,'only structured validated output is retained');
select throws_ok($$update public.extracted_facts set value='"Liège"' where true$$,'42501',null,'direct fact mutation is denied');
select lives_ok($$select public.resolve_extracted_fact('f1000000-0000-0000-0000-000000000001',(select id from public.extracted_facts where field_key='surface'),'confirm','8')$$,'human confirms surface');
select is((select count(*)::integer from public.extracted_facts where field_key='surface' and status='confirmed'),1,'confirmed fact is explicit');
select lives_ok($$select public.append_intake_user_message('f1000000-0000-0000-0000-000000000001',(select id from public.intake_sessions),'Message invalide','91000000-0000-4000-8000-000000000004')$$,'second source message is recorded');
select throws_ok($$select public.record_intake_success('f1000000-0000-0000-0000-000000000001',(select id from public.intake_sessions),(select id from public.intake_messages where role='user' order by sequence_number desc limit 1),'{"extractedFacts":[{"fieldKey":"unknown","value":"x","valueType":"text","confidence":0.9}],"responseMessage":"x"}', 'test','test','v1',1,0,0,'93000000-0000-4000-8000-000000000001')$$,'P0001','unknown_field','unknown Playbook field is rejected');

select set_config('request.jwt.claims','{"sub":"e2000000-0000-0000-0000-000000000002","role":"authenticated"}',true);
select lives_ok($$select public.append_intake_user_message('f1000000-0000-0000-0000-000000000001',(select id from public.intake_sessions),'En fait 12 m²','91000000-0000-4000-8000-000000000002')$$,'assigned member can use intake');
select is((select count(*)::integer from public.ai_executions),0,'member cannot inspect AI runs');
select lives_ok($$select public.resolve_extracted_fact('f1000000-0000-0000-0000-000000000001',(select id from public.extracted_facts where field_key='city' and status='suggested'),'correct','"Liège"')$$,'assigned member can correct a fact');
select is((select value #>> '{}' from public.extracted_facts where field_key='city' and status='confirmed'),'Liège','human correction becomes canonical');

select set_config('request.jwt.claims','{"sub":"e3000000-0000-0000-0000-000000000003","role":"authenticated"}',true);
select is((select count(*)::integer from public.intake_sessions),0,'tenant B cannot read session A');
select is((select count(*)::integer from public.intake_messages),0,'tenant B cannot read messages A');
select is((select count(*)::integer from public.extracted_facts),0,'tenant B cannot read facts A');
select is((select count(*)::integer from public.ai_executions),0,'tenant B cannot read runs A');
select throws_ok($$select public.append_intake_user_message('f1000000-0000-0000-0000-000000000001',(select id from public.intake_sessions),'attaque','91000000-0000-4000-8000-000000000003')$$,'P0001','not_found','cross-tenant write is hidden');
select throws_ok($$select public.start_intake_session('f1000000-0000-0000-0000-000000000001','D-ABCDEF1234','pl-PL')$$,'P0001','not_found','cross-tenant session discovery is hidden');

reset role;set local role anon;
select throws_ok($$select public.start_intake_session('f1000000-0000-0000-0000-000000000001','D-ABCDEF1234','fr-BE')$$,'42501',null,'anonymous cannot execute intake RPC');
select * from finish();rollback;
