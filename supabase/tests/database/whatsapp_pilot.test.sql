begin;
create extension if not exists pgtap with schema extensions;
select plan(29);

select has_table('public','whatsapp_conversations','WhatsApp conversation table exists');
select has_table('public','whatsapp_message_events','WhatsApp event table exists');
select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid='public.whatsapp_conversations'::regclass),'conversations force RLS');
select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid='public.whatsapp_message_events'::regclass),'events force RLS');
select policies_are('public','whatsapp_conversations',array['managers read whatsapp conversations'],'conversation visibility is manager scoped');
select policies_are('public','whatsapp_message_events',array['managers read whatsapp audit'],'audit visibility is manager scoped');
select function_privs_are('public','ingest_whatsapp_text_message',array['uuid','uuid','text','text','text','text','timestamp with time zone'],'anon',array[]::text[],'anonymous cannot ingest messages');
select function_privs_are('public','ingest_whatsapp_text_message',array['uuid','uuid','text','text','text','text','timestamp with time zone'],'authenticated',array[]::text[],'authenticated clients cannot ingest messages');
select function_privs_are('public','ingest_whatsapp_text_message',array['uuid','uuid','text','text','text','text','timestamp with time zone'],'service_role',array['EXECUTE'],'only the server role can ingest messages');
select col_is_unique('public','whatsapp_message_events',array['provider_message_id'],'provider message IDs are idempotent');

insert into auth.users(id,instance_id,aud,role,email,encrypted_password,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values('ba000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','owner-whatsapp@example.test','','{}','{}',now(),now());
insert into public.organizations(id,name,slug,created_by,country_code,locale)
values('bb000000-0000-0000-0000-000000000001','WhatsApp Alpha','whatsapp-alpha','ba000000-0000-0000-0000-000000000001','FR','fr-FR');
insert into public.service_definitions(id,organization_id,code,name,status,created_by,creation_request_id)
values('bc000000-0000-0000-0000-000000000001','bb000000-0000-0000-0000-000000000001','climatisation','Climatisation','active','ba000000-0000-0000-0000-000000000001','bc000000-0000-4000-8000-000000000001');
insert into public.playbooks(id,organization_id,service_definition_id,code,name,status,created_by,creation_request_id)
values('bd000000-0000-0000-0000-000000000001','bb000000-0000-0000-0000-000000000001','bc000000-0000-0000-0000-000000000001','climatisation','Qualification climatisation','active','ba000000-0000-0000-0000-000000000001','bd000000-0000-4000-8000-000000000001');
insert into public.playbook_versions(id,organization_id,playbook_id,version_number,status,schema_definition,created_by,published_by,published_at)
values('be000000-0000-0000-0000-000000000001','bb000000-0000-0000-0000-000000000001','bd000000-0000-0000-0000-000000000001',1,'published','{"fields":[{"key":"city","label":"Ville","type":"city","required":true}],"proofs":[],"rules":[],"questions":[],"nextAction":"Vérifier"}','ba000000-0000-0000-0000-000000000001','ba000000-0000-0000-0000-000000000001',now());
update public.playbooks set active_version_id='be000000-0000-0000-0000-000000000001' where id='bd000000-0000-0000-0000-000000000001';

set local role service_role;
select lives_ok($$select public.ingest_whatsapp_text_message('bb000000-0000-0000-0000-000000000001','be000000-0000-0000-0000-000000000001','wamid.test.1','+33612345678','Alice','Ma climatisation fuit depuis ce matin.',now())$$,'service role ingests a WhatsApp message');
select is((select count(*)::integer from public.service_requests where organization_id='bb000000-0000-0000-0000-000000000001'),1,'first message creates one Dossier');
select is((select count(*)::integer from public.whatsapp_conversations where organization_id='bb000000-0000-0000-0000-000000000001'),1,'first message creates one conversation');
select is((select count(*)::integer from public.whatsapp_message_events where provider_message_id='wamid.test.1'),1,'first message creates one audit event');
select lives_ok($$select public.ingest_whatsapp_text_message('bb000000-0000-0000-0000-000000000001','be000000-0000-0000-0000-000000000001','wamid.test.1','+33612345678','Alice','Ma climatisation fuit depuis ce matin.',now())$$,'provider replay succeeds');
select is((select count(*)::integer from public.intake_messages where role='user' and organization_id='bb000000-0000-0000-0000-000000000001'),1,'provider replay does not duplicate the intake message');
select lives_ok($$select public.ingest_whatsapp_text_message('bb000000-0000-0000-0000-000000000001','be000000-0000-0000-0000-000000000001','wamid.test.2','+33612345678','Alice','Je suis à Lyon.',now())$$,'a second text message is ingested');
select is((select count(*)::integer from public.service_requests where organization_id='bb000000-0000-0000-0000-000000000001'),1,'same sender reuses the active Dossier');
select has_table('public','whatsapp_media','WhatsApp media table exists');
select has_table('public','whatsapp_operational_alerts','WhatsApp operational alerts table exists');
select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid='public.whatsapp_media'::regclass),'media force RLS');
select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid='public.whatsapp_operational_alerts'::regclass),'alerts force RLS');
select is((select public from storage.buckets where id='whatsapp-media'),false,'WhatsApp media bucket is private');
select function_privs_are('public','register_whatsapp_media',array['uuid','text','text','text','text','text'],'anon',array[]::text[],'anonymous cannot register media');
select function_privs_are('public','register_whatsapp_media',array['uuid','text','text','text','text','text'],'authenticated',array[]::text[],'authenticated clients cannot register media');
select function_privs_are('public','register_whatsapp_media',array['uuid','text','text','text','text','text'],'service_role',array['EXECUTE'],'only the server role can register media');
select lives_ok(format($$select public.register_whatsapp_media('%s','media.test.1','image','image/jpeg','bathroom.jpg','sha256-test')$$,(select id from public.whatsapp_message_events where provider_message_id='wamid.test.2')),'service role registers WhatsApp media');
select is((select count(*)::integer from public.whatsapp_media where provider_media_id='media.test.1'),1,'media registration creates one private attachment');
select is((select message_kind from public.whatsapp_message_events where provider_message_id='wamid.test.2'),'image','media registration marks the audit event kind');
reset role;

select * from finish();
rollback;
