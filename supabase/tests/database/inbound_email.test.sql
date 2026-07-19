begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

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

select * from finish();
rollback;
