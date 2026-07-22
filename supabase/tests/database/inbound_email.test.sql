begin;
create extension if not exists pgtap with schema extensions;
select plan(17);

select has_table('public','organization_email_channels','email channel table exists');
select has_table('public','inbound_email_events','inbound audit table exists');
select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid='public.organization_email_channels'::regclass),'email channels force RLS');
select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid='public.inbound_email_events'::regclass),'inbound audit forces RLS');
select policies_are('public','organization_email_channels',array['managers read email channels'],'channel visibility is manager scoped');
select policies_are('public','inbound_email_events',array['managers read inbound email audit'],'audit visibility is manager scoped');
select function_privs_are('public','configure_organization_email_channel',array['uuid','boolean','integer','boolean'],'anon',array[]::text[],'anonymous cannot configure a channel');
select function_privs_are('public','ingest_inbound_email',array['text','text','text','text','text','text','text','timestamp with time zone','integer'],'anon',array[]::text[],'anonymous cannot ingest emails');
select function_privs_are('public','ingest_inbound_email',array['text','text','text','text','text','text','text','timestamp with time zone','integer'],'authenticated',array[]::text[],'authenticated clients cannot invoke ingestion');
select function_privs_are('public','ingest_inbound_email',array['text','text','text','text','text','text','text','timestamp with time zone','integer'],'service_role',array['EXECUTE'],'only the server role can ingest');
select function_privs_are('public','complete_inbound_email_processing',array['uuid','inbound_email_status','text'],'authenticated',array[]::text[],'authenticated clients cannot complete ingestion');
select col_is_unique('public','inbound_email_events',array['provider','provider_email_id'],'provider events are idempotent');

insert into auth.users(id,instance_id,aud,role,email,encrypted_password,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values('ab000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','owner-email@example.test','','{}','{}',now(),now());
insert into public.organizations(id,name,slug,created_by)
values('ac000000-0000-0000-0000-000000000001','Email Alpha','email-alpha','ab000000-0000-0000-0000-000000000001');
insert into public.organization_email_channels(organization_id,route_key,status,retention_days,ai_processing_enabled,data_processing_acknowledged_at,configured_by)
values('ac000000-0000-0000-0000-000000000001','abcdef0123456789abcdef01','active',90,true,now(),'ab000000-0000-0000-0000-000000000001');

set local role service_role;
select lives_ok($$select public.ingest_inbound_email('abcdef0123456789abcdef01','email-runtime-1','message-runtime-1','client@example.test','abcdef0123456789abcdef01@inbound.example.test','Climatisation en panne','La climatisation ne fonctionne plus depuis ce matin.',now(),0)$$,'service role ingests an email without ambiguous columns');
reset role;
select is((select count(*)::integer from public.service_requests where organization_id='ac000000-0000-0000-0000-000000000001'),1,'ingestion creates one organization-scoped dossier');
select is((select count(*)::integer from public.inbound_email_events where organization_id='ac000000-0000-0000-0000-000000000001'),1,'ingestion records one minimized email event');
set local role service_role;
select lives_ok($$select public.ingest_inbound_email('abcdef0123456789abcdef01','email-runtime-1','message-runtime-1','client@example.test','abcdef0123456789abcdef01@inbound.example.test','Climatisation en panne','La climatisation ne fonctionne plus depuis ce matin.',now(),0)$$,'replaying the provider event succeeds');
reset role;
select is((select count(*)::integer from public.service_requests where organization_id='ac000000-0000-0000-0000-000000000001'),1,'provider replay remains idempotent');

select * from finish();
rollback;
