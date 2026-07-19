-- Qualifyr Hub is a closed, internal extension registry. It deliberately stores
-- metadata and tenant choices only: no executable code, provider credentials, or
-- cross-tenant data is accepted here.
create type public.hub_catalog_status as enum ('available','planned','deprecated');
create type public.hub_installation_status as enum ('installed','active','disabled','removed');
create type public.hub_integration_status as enum ('not_connected','configured','disabled','error');
create type public.hub_event_kind as enum ('module.installed','module.activated','module.disabled','module.removed','pack.applied','agent.enabled','agent.disabled','integration.configured','integration.disabled');

create table public.hub_module_definitions (
  id uuid primary key default gen_random_uuid(),
  identifier text not null unique check (identifier ~ '^[a-z][a-z0-9-]{1,62}$'),
  version text not null check (version ~ '^[0-9]+\.[0-9]+\.[0-9]+$'),
  name text not null check (char_length(name) between 1 and 120),
  description text not null check (char_length(description) between 1 and 500),
  category text not null check (category in ('crm','website_builder','sales_assistant','automations','content','seo','appointments','quotes','billing','documents','notifications','analytics','team','settings')),
  icon text not null check (icon ~ '^[a-z0-9-]{1,64}$'),
  dependencies jsonb not null default '[]'::jsonb check (jsonb_typeof(dependencies) = 'array' and pg_column_size(dependencies) <= 8192),
  permissions jsonb not null default '[]'::jsonb check (jsonb_typeof(permissions) = 'array' and pg_column_size(permissions) <= 8192),
  configuration_schema jsonb not null default '{}'::jsonb check (jsonb_typeof(configuration_schema) = 'object' and pg_column_size(configuration_schema) <= 16384),
  compatibility jsonb not null default '{}'::jsonb check (jsonb_typeof(compatibility) = 'object' and pg_column_size(compatibility) <= 8192),
  author text not null default 'Qualifyr',
  visibility text not null default 'internal' check (visibility = 'internal'),
  catalog_status public.hub_catalog_status not null default 'planned',
  manifest jsonb not null default '{}'::jsonb check (jsonb_typeof(manifest) = 'object' and pg_column_size(manifest) <= 16384),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.hub_pack_definitions (
  id uuid primary key default gen_random_uuid(), code text not null unique check (code ~ '^[a-z][a-z0-9-]{1,62}$'), version text not null check (version ~ '^[0-9]+\.[0-9]+\.[0-9]+$'),
  name text not null, description text not null, module_identifiers jsonb not null default '[]'::jsonb check (jsonb_typeof(module_identifiers) = 'array'),
  dashboard_definition jsonb not null default '{}'::jsonb check (jsonb_typeof(dashboard_definition) = 'object'), pipelines jsonb not null default '[]'::jsonb check (jsonb_typeof(pipelines) = 'array'),
  automation_templates jsonb not null default '[]'::jsonb check (jsonb_typeof(automation_templates) = 'array'), content_templates jsonb not null default '[]'::jsonb check (jsonb_typeof(content_templates) = 'array'),
  recommended_agents jsonb not null default '[]'::jsonb check (jsonb_typeof(recommended_agents) = 'array'), default_settings jsonb not null default '{}'::jsonb check (jsonb_typeof(default_settings) = 'object'),
  catalog_status public.hub_catalog_status not null default 'available', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.hub_agent_definitions (
  id uuid primary key default gen_random_uuid(), identifier text not null unique check (identifier ~ '^[a-z][a-z0-9-]{1,62}$'), version text not null check (version ~ '^[0-9]+\.[0-9]+\.[0-9]+$'),
  name text not null, description text not null, permissions jsonb not null default '[]'::jsonb check (jsonb_typeof(permissions) = 'array'), authorized_tools jsonb not null default '[]'::jsonb check (jsonb_typeof(authorized_tools) = 'array'),
  model_policy jsonb not null default '{}'::jsonb check (jsonb_typeof(model_policy) = 'object'), estimated_cost jsonb not null default '{}'::jsonb check (jsonb_typeof(estimated_cost) = 'object'), configuration_schema jsonb not null default '{}'::jsonb check (jsonb_typeof(configuration_schema) = 'object'),
  catalog_status public.hub_catalog_status not null default 'planned', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.hub_integration_definitions (
  id uuid primary key default gen_random_uuid(), identifier text not null unique check (identifier ~ '^[a-z][a-z0-9-]{1,62}$'), version text not null check (version ~ '^[0-9]+\.[0-9]+\.[0-9]+$'),
  name text not null, description text not null, permissions jsonb not null default '[]'::jsonb check (jsonb_typeof(permissions) = 'array'), configuration_schema jsonb not null default '{}'::jsonb check (jsonb_typeof(configuration_schema) = 'object'),
  catalog_status public.hub_catalog_status not null default 'planned', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.hub_event_definitions (
  id uuid primary key default gen_random_uuid(), event_name text not null unique check (event_name ~ '^[a-z][a-z0-9_.]{2,120}$'), source_identifier text not null, description text not null, payload_schema jsonb not null default '{}'::jsonb check (jsonb_typeof(payload_schema) = 'object'), created_at timestamptz not null default now()
);

create table public.organization_hub_modules (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, module_definition_id uuid not null references public.hub_module_definitions(id) on delete restrict,
  status public.hub_installation_status not null default 'installed', configuration jsonb not null default '{}'::jsonb check (jsonb_typeof(configuration) = 'object' and pg_column_size(configuration) <= 32768),
  installed_by uuid not null references auth.users(id), installed_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (organization_id,module_definition_id)
);
create table public.organization_hub_packs (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, pack_definition_id uuid not null references public.hub_pack_definitions(id) on delete restrict,
  status text not null check (status in ('active','superseded')), applied_by uuid not null references auth.users(id), applied_at timestamptz not null default now(), migration_note text not null default 'Les données existantes sont conservées.' check (char_length(migration_note) <= 500), unique (organization_id,pack_definition_id)
);
create unique index organization_hub_one_active_pack_idx on public.organization_hub_packs(organization_id) where status='active';
create table public.organization_hub_agents (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, agent_definition_id uuid not null references public.hub_agent_definitions(id) on delete restrict,
  status public.hub_installation_status not null default 'installed', configuration jsonb not null default '{}'::jsonb check (jsonb_typeof(configuration) = 'object' and pg_column_size(configuration) <= 32768),
  installed_by uuid not null references auth.users(id), installed_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (organization_id,agent_definition_id)
);
create table public.organization_hub_integrations (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, integration_definition_id uuid not null references public.hub_integration_definitions(id) on delete restrict,
  status public.hub_integration_status not null default 'not_connected', configuration jsonb not null default '{}'::jsonb check (jsonb_typeof(configuration) = 'object' and pg_column_size(configuration) <= 32768),
  last_synchronized_at timestamptz, last_error_code text check (last_error_code is null or char_length(last_error_code)<=120), updated_by uuid not null references auth.users(id), updated_at timestamptz not null default now(), unique (organization_id,integration_definition_id)
);
create table public.hub_event_log (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, event_kind public.hub_event_kind not null,
  subject_identifier text not null, correlation_id uuid not null, metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata)='object' and pg_column_size(metadata)<=8192), created_by uuid not null references auth.users(id), created_at timestamptz not null default now()
);
create index hub_event_log_organization_created_idx on public.hub_event_log(organization_id,created_at desc);

alter table public.hub_module_definitions enable row level security; alter table public.hub_module_definitions force row level security;
alter table public.hub_pack_definitions enable row level security; alter table public.hub_pack_definitions force row level security;
alter table public.hub_agent_definitions enable row level security; alter table public.hub_agent_definitions force row level security;
alter table public.hub_integration_definitions enable row level security; alter table public.hub_integration_definitions force row level security;
alter table public.hub_event_definitions enable row level security; alter table public.hub_event_definitions force row level security;
alter table public.organization_hub_modules enable row level security; alter table public.organization_hub_modules force row level security;
alter table public.organization_hub_packs enable row level security; alter table public.organization_hub_packs force row level security;
alter table public.organization_hub_agents enable row level security; alter table public.organization_hub_agents force row level security;
alter table public.organization_hub_integrations enable row level security; alter table public.organization_hub_integrations force row level security;
alter table public.hub_event_log enable row level security; alter table public.hub_event_log force row level security;
revoke all on public.hub_module_definitions,public.hub_pack_definitions,public.hub_agent_definitions,public.hub_integration_definitions,public.hub_event_definitions,public.organization_hub_modules,public.organization_hub_packs,public.organization_hub_agents,public.organization_hub_integrations,public.hub_event_log from anon,authenticated;
create policy "members read hub module catalog" on public.hub_module_definitions for select to authenticated using ((select auth.uid()) is not null);
create policy "members read hub pack catalog" on public.hub_pack_definitions for select to authenticated using ((select auth.uid()) is not null);
create policy "members read hub agent catalog" on public.hub_agent_definitions for select to authenticated using ((select auth.uid()) is not null);
create policy "members read hub integration catalog" on public.hub_integration_definitions for select to authenticated using ((select auth.uid()) is not null);
create policy "members read hub event catalog" on public.hub_event_definitions for select to authenticated using ((select auth.uid()) is not null);
create policy "members read installed hub modules" on public.organization_hub_modules for select to authenticated using ((select qualifyr_private.is_organization_member(organization_id)));
create policy "members read applied hub packs" on public.organization_hub_packs for select to authenticated using ((select qualifyr_private.is_organization_member(organization_id)));
create policy "members read installed hub agents" on public.organization_hub_agents for select to authenticated using ((select qualifyr_private.is_organization_member(organization_id)));
create policy "members read configured hub integrations" on public.organization_hub_integrations for select to authenticated using ((select qualifyr_private.is_organization_member(organization_id)));
create policy "members read hub event log" on public.hub_event_log for select to authenticated using ((select qualifyr_private.is_organization_member(organization_id)));

create or replace function qualifyr_private.hub_require_manager(target_organization_id uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare caller_id uuid := auth.uid(); begin
 if caller_id is null or qualifyr_private.organization_role_for_user(target_organization_id) not in ('owner','admin') then raise exception 'not_found'; end if;
 return caller_id;
end; $$;
create or replace function qualifyr_private.hub_config_is_safe(value jsonb) returns boolean language plpgsql immutable set search_path='' as $$
declare pair record; item jsonb; begin
 if jsonb_typeof(value)='object' then
   for pair in select * from jsonb_each(value) loop
     if lower(pair.key) ~ '(secret|token|password|api[_-]?key|credential|private[_-]?key)' or not qualifyr_private.hub_config_is_safe(pair.value) then return false; end if;
   end loop;
 elsif jsonb_typeof(value)='array' then for item in select element from jsonb_array_elements(value) as items(element) loop if not qualifyr_private.hub_config_is_safe(item) then return false; end if; end loop;
 end if; return true;
end; $$;
create or replace function qualifyr_private.hub_log_event(target_organization_id uuid, requested_event public.hub_event_kind, requested_subject text, requested_metadata jsonb, caller_id uuid) returns void language plpgsql security definer set search_path='' as $$ begin
 insert into public.hub_event_log(organization_id,event_kind,subject_identifier,correlation_id,metadata,created_by) values(target_organization_id,requested_event,requested_subject,gen_random_uuid(),requested_metadata,caller_id);
end; $$;

create or replace function public.manage_hub_module(target_organization_id uuid, requested_identifier text, requested_action text, requested_configuration jsonb default '{}'::jsonb) returns void language plpgsql security definer set search_path='' as $$
declare caller_id uuid; definition public.hub_module_definitions%rowtype; active_dependents integer; dependency text; begin
 caller_id:=qualifyr_private.hub_require_manager(target_organization_id);
 if requested_action not in ('install','activate','deactivate','remove','configure') or jsonb_typeof(requested_configuration)<>'object' or pg_column_size(requested_configuration)>32768 or not qualifyr_private.hub_config_is_safe(requested_configuration) then raise exception 'invalid_hub_request'; end if;
 select * into definition from public.hub_module_definitions where identifier=requested_identifier; if not found or definition.catalog_status='deprecated' then raise exception 'not_found'; end if;
 if requested_action='install' then insert into public.organization_hub_modules(organization_id,module_definition_id,status,configuration,installed_by) values(target_organization_id,definition.id,'installed',requested_configuration,caller_id) on conflict(organization_id,module_definition_id) do update set status='installed',configuration=excluded.configuration,updated_at=now(); perform qualifyr_private.hub_log_event(target_organization_id,'module.installed',requested_identifier,'{}',caller_id); return; end if;
 if requested_action='activate' then
   if definition.catalog_status <> 'available' then raise exception 'module_not_available'; end if;
   for dependency in select jsonb_array_elements_text(definition.dependencies) loop if not exists(select 1 from public.organization_hub_modules item join public.hub_module_definitions dep on dep.id=item.module_definition_id where item.organization_id=target_organization_id and dep.identifier=dependency and item.status='active') then raise exception 'dependency_not_active'; end if; end loop;
   update public.organization_hub_modules set status='active',configuration=requested_configuration,updated_at=now() where organization_id=target_organization_id and module_definition_id=definition.id; if not found then raise exception 'module_not_installed'; end if; perform qualifyr_private.hub_log_event(target_organization_id,'module.activated',requested_identifier,'{}',caller_id); return;
 end if;
 if requested_action='deactivate' then update public.organization_hub_modules set status='disabled',updated_at=now() where organization_id=target_organization_id and module_definition_id=definition.id; if not found then raise exception 'module_not_installed'; end if; perform qualifyr_private.hub_log_event(target_organization_id,'module.disabled',requested_identifier,'{}',caller_id); return; end if;
 if requested_action='configure' then update public.organization_hub_modules set configuration=requested_configuration,updated_at=now() where organization_id=target_organization_id and module_definition_id=definition.id and status<>'removed'; if not found then raise exception 'module_not_installed'; end if; return; end if;
 select count(*) into active_dependents from public.organization_hub_modules item join public.hub_module_definitions candidate on candidate.id=item.module_definition_id where item.organization_id=target_organization_id and item.status='active' and candidate.dependencies ? requested_identifier;
 if active_dependents>0 then raise exception 'module_has_active_dependents'; end if;
 update public.organization_hub_modules set status='removed',updated_at=now() where organization_id=target_organization_id and module_definition_id=definition.id; if not found then raise exception 'module_not_installed'; end if; perform qualifyr_private.hub_log_event(target_organization_id,'module.removed',requested_identifier,'{}',caller_id);
end; $$;

create or replace function public.apply_hub_pack(target_organization_id uuid, requested_pack_code text) returns void language plpgsql security definer set search_path='' as $$
declare caller_id uuid; pack public.hub_pack_definitions%rowtype; module_identifier text; definition_id uuid; begin
 caller_id:=qualifyr_private.hub_require_manager(target_organization_id); select * into pack from public.hub_pack_definitions where code=requested_pack_code and catalog_status='available'; if not found then raise exception 'not_found'; end if;
 update public.organization_hub_packs set status='superseded' where organization_id=target_organization_id and status='active';
 insert into public.organization_hub_packs(organization_id,pack_definition_id,status,applied_by) values(target_organization_id,pack.id,'active',caller_id) on conflict(organization_id,pack_definition_id) do update set status='active',applied_by=excluded.applied_by,applied_at=now();
 for module_identifier in select jsonb_array_elements_text(pack.module_identifiers) loop select id into definition_id from public.hub_module_definitions where identifier=module_identifier; if definition_id is null then raise exception 'invalid_pack'; end if; insert into public.organization_hub_modules(organization_id,module_definition_id,status,installed_by) values(target_organization_id,definition_id,'installed',caller_id) on conflict(organization_id,module_definition_id) do update set status=case when public.organization_hub_modules.status='removed' then 'installed' else public.organization_hub_modules.status end,updated_at=now(); end loop;
 perform qualifyr_private.hub_log_event(target_organization_id,'pack.applied',requested_pack_code,jsonb_build_object('data_preserved',true),caller_id);
end; $$;

create or replace function public.manage_hub_agent(target_organization_id uuid, requested_identifier text, requested_action text, requested_configuration jsonb default '{}'::jsonb) returns void language plpgsql security definer set search_path='' as $$
declare caller_id uuid; definition public.hub_agent_definitions%rowtype; next_status public.hub_installation_status; begin
 caller_id:=qualifyr_private.hub_require_manager(target_organization_id); if requested_action not in ('install','enable','disable','configure') or jsonb_typeof(requested_configuration)<>'object' or pg_column_size(requested_configuration)>32768 or not qualifyr_private.hub_config_is_safe(requested_configuration) then raise exception 'invalid_hub_request'; end if; select * into definition from public.hub_agent_definitions where identifier=requested_identifier; if not found then raise exception 'not_found'; end if;
 if requested_action='install' then insert into public.organization_hub_agents(organization_id,agent_definition_id,status,configuration,installed_by) values(target_organization_id,definition.id,'installed',requested_configuration,caller_id) on conflict(organization_id,agent_definition_id) do update set status='installed',configuration=excluded.configuration,updated_at=now(); return; end if;
 if requested_action='enable' then if definition.catalog_status<>'available' then raise exception 'agent_not_available'; end if; next_status:='active'; elsif requested_action='disable' then next_status:='disabled'; else update public.organization_hub_agents set configuration=requested_configuration,updated_at=now() where organization_id=target_organization_id and agent_definition_id=definition.id and status<>'removed'; if not found then raise exception 'agent_not_installed'; end if; return; end if;
 update public.organization_hub_agents set status=next_status,configuration=requested_configuration,updated_at=now() where organization_id=target_organization_id and agent_definition_id=definition.id and status<>'removed'; if not found then raise exception 'agent_not_installed'; end if; perform qualifyr_private.hub_log_event(target_organization_id,case when next_status='active' then 'agent.enabled'::public.hub_event_kind else 'agent.disabled'::public.hub_event_kind end,requested_identifier,'{}',caller_id);
end; $$;

create or replace function public.manage_hub_integration(target_organization_id uuid, requested_identifier text, requested_action text, requested_configuration jsonb default '{}'::jsonb) returns void language plpgsql security definer set search_path='' as $$
declare caller_id uuid; definition public.hub_integration_definitions%rowtype; next_status public.hub_integration_status; begin
 caller_id:=qualifyr_private.hub_require_manager(target_organization_id); if requested_action not in ('configure','disable') or jsonb_typeof(requested_configuration)<>'object' or pg_column_size(requested_configuration)>32768 or not qualifyr_private.hub_config_is_safe(requested_configuration) then raise exception 'invalid_hub_request'; end if; select * into definition from public.hub_integration_definitions where identifier=requested_identifier; if not found then raise exception 'not_found'; end if;
 next_status:=case when requested_action='configure' then 'configured'::public.hub_integration_status else 'disabled'::public.hub_integration_status end;
 insert into public.organization_hub_integrations(organization_id,integration_definition_id,status,configuration,updated_by) values(target_organization_id,definition.id,next_status,requested_configuration,caller_id) on conflict(organization_id,integration_definition_id) do update set status=excluded.status,configuration=excluded.configuration,updated_by=excluded.updated_by,updated_at=now(),last_error_code=null;
 perform qualifyr_private.hub_log_event(target_organization_id,case when next_status='configured' then 'integration.configured'::public.hub_event_kind else 'integration.disabled'::public.hub_event_kind end,requested_identifier,'{}',caller_id);
end; $$;

revoke all on function qualifyr_private.hub_require_manager(uuid),qualifyr_private.hub_config_is_safe(jsonb),qualifyr_private.hub_log_event(uuid,public.hub_event_kind,text,jsonb,uuid) from public,anon,authenticated;
revoke all on function public.manage_hub_module(uuid,text,text,jsonb),public.apply_hub_pack(uuid,text),public.manage_hub_agent(uuid,text,text,jsonb),public.manage_hub_integration(uuid,text,text,jsonb) from public,anon;
grant execute on function public.manage_hub_module(uuid,text,text,jsonb),public.apply_hub_pack(uuid,text),public.manage_hub_agent(uuid,text,text,jsonb),public.manage_hub_integration(uuid,text,text,jsonb) to authenticated;

insert into public.hub_module_definitions(identifier,version,name,description,category,icon,dependencies,permissions,catalog_status,manifest) values
('core-dossiers','1.0.0','Dossiers','Le cœur de demandes de service de Qualifyr.','documents','folder-kanban','[]','["dossiers.read"]','available','{"type":"built-in","runtime":"existing"}'),
('playbooks','1.0.0','Playbooks','Les services et règles de qualification configurables.','settings','book-open-check','["core-dossiers"]','["playbooks.manage"]','available','{"type":"built-in","runtime":"existing"}'),
('ai-intake','1.0.0','AI Intake','L’extraction contrôlée et les questions adaptatives des Dossiers.','sales_assistant','sparkles','["core-dossiers","playbooks"]','["intake.use"]','available','{"type":"built-in","runtime":"existing"}'),
('crm','1.0.0','CRM','Registre préparatoire pour la relation client.','crm','contact','[]','["crm.read"]','planned','{"type":"built-in","runtime":"not-implemented"}'),
('website-builder','1.0.0','Website Builder','Registre préparatoire pour le site internet.','website_builder','panels-top-left','[]','["website.read"]','planned','{"type":"built-in","runtime":"not-implemented"}'),
('automations','1.0.0','Automatisations','Registre préparatoire pour les automatisations.','automations','workflow','[]','["automations.read"]','planned','{"type":"built-in","runtime":"not-implemented"}'),
('content','1.0.0','Contenu','Registre préparatoire pour les contenus.','content','file-text','[]','["content.read"]','planned','{"type":"built-in","runtime":"not-implemented"}'),
('seo','1.0.0','SEO','Registre préparatoire pour le référencement.','seo','search','[]','["seo.read"]','planned','{"type":"built-in","runtime":"not-implemented"}'),
('appointments','1.0.0','Rendez-vous','Registre préparatoire pour les rendez-vous.','appointments','calendar','[]','["appointments.read"]','planned','{"type":"built-in","runtime":"not-implemented"}'),
('quotes','1.0.0','Devis','Registre préparatoire pour les devis.','quotes','receipt-text','[]','["quotes.read"]','planned','{"type":"built-in","runtime":"not-implemented"}'),
('billing','1.0.0','Facturation','Registre préparatoire pour la facturation.','billing','credit-card','[]','["billing.read"]','planned','{"type":"built-in","runtime":"not-implemented"}'),
('notifications','1.0.0','Notifications','Registre préparatoire pour les notifications.','notifications','bell','[]','["notifications.read"]','planned','{"type":"built-in","runtime":"not-implemented"}'),
('analytics','1.0.0','Analytics','Registre préparatoire pour les analyses.','analytics','chart-no-axes-combined','[]','["analytics.read"]','planned','{"type":"built-in","runtime":"not-implemented"}'),
('team','1.0.0','Équipe','Registre préparatoire pour l’espace équipe.','team','users','[]','["team.read"]','available','{"type":"built-in","runtime":"existing"}');
insert into public.hub_pack_definitions(code,version,name,description,module_identifiers,dashboard_definition,pipelines,automation_templates,content_templates,recommended_agents,default_settings) values
('artisan','1.0.0','Artisan','Socle Qualifyr pour les entreprises artisanales.','["core-dossiers","playbooks","ai-intake","team"]','{"widgets":["dossiers"]}','[]','[]','[]','["assistant-commercial"]','{}'),
('fibre-telecom','1.0.0','Fibre & Télécom','Socle Qualifyr pour les équipes terrain télécom.','["core-dossiers","playbooks","ai-intake","team"]','{"widgets":["dossiers"]}','[]','[]','[]','["assistant-commercial"]','{}'),
('immobilier','1.0.0','Immobilier','Socle Qualifyr pour les équipes immobilières.','["core-dossiers","playbooks","ai-intake","team"]','{"widgets":["dossiers"]}','[]','[]','[]','["assistant-commercial"]','{}'),
('services','1.0.0','Services','Socle Qualifyr pour les entreprises de services.','["core-dossiers","playbooks","ai-intake","team"]','{"widgets":["dossiers"]}','[]','[]','[]','["assistant-commercial"]','{}'),
('generic','1.0.0','Générique','Socle Qualifyr minimal et neutre.','["core-dossiers","playbooks","ai-intake","team"]','{"widgets":["dossiers"]}','[]','[]','[]','["assistant-commercial"]','{}');
insert into public.hub_agent_definitions(identifier,version,name,description,permissions,authorized_tools,model_policy,estimated_cost,configuration_schema) values
('assistant-commercial','1.0.0','Assistant Commercial','Registre préparatoire de l’assistant commercial.','[]','[]','{"execution":"not-implemented"}','{}','{}'),
('assistant-marketing','1.0.0','Assistant Marketing','Registre préparatoire de l’assistant marketing.','[]','[]','{"execution":"not-implemented"}','{}','{}'),
('assistant-crm','1.0.0','Assistant CRM','Registre préparatoire de l’assistant CRM.','[]','[]','{"execution":"not-implemented"}','{}','{}'),
('assistant-seo','1.0.0','Assistant SEO','Registre préparatoire de l’assistant SEO.','[]','[]','{"execution":"not-implemented"}','{}','{}'),
('assistant-site-internet','1.0.0','Assistant Site Internet','Registre préparatoire de l’assistant site internet.','[]','[]','{"execution":"not-implemented"}','{}','{}'),
('assistant-contenu','1.0.0','Assistant Contenu','Registre préparatoire de l’assistant contenu.','[]','[]','{"execution":"not-implemented"}','{}','{}'),
('assistant-automatisation','1.0.0','Assistant Automatisation','Registre préparatoire de l’assistant automatisation.','[]','[]','{"execution":"not-implemented"}','{}','{}'),
('assistant-analyse','1.0.0','Assistant Analyse','Registre préparatoire de l’assistant analyse.','[]','[]','{"execution":"not-implemented"}','{}','{}');
insert into public.hub_integration_definitions(identifier,version,name,description,permissions,configuration_schema) values
('google','1.0.0','Google','Architecture de connexion Google, sans connecteur actif.','[]','{}'),('microsoft','1.0.0','Microsoft','Architecture de connexion Microsoft, sans connecteur actif.','[]','{}'),('stripe','1.0.0','Stripe','Architecture de connexion Stripe, sans connecteur actif.','[]','{}'),('calendar','1.0.0','Calendrier','Architecture de calendrier, sans connecteur actif.','[]','{}'),('gmail','1.0.0','Gmail','Architecture Gmail, sans connecteur actif.','[]','{}'),('outlook','1.0.0','Outlook','Architecture Outlook, sans connecteur actif.','[]','{}'),('meta','1.0.0','Meta','Architecture Meta, sans connecteur actif.','[]','{}'),('linkedin','1.0.0','LinkedIn','Architecture LinkedIn, sans connecteur actif.','[]','{}'),('google-business','1.0.0','Google Business','Architecture Google Business, sans connecteur actif.','[]','{}'),('zapier','1.0.0','Zapier','Architecture Zapier, sans connecteur actif.','[]','{}'),('make','1.0.0','Make','Architecture Make, sans connecteur actif.','[]','{}'),('webhooks','1.0.0','Webhooks','Architecture Webhooks, sans endpoint actif.','[]','{}'),('qualifyr-api','1.0.0','API Qualifyr','Architecture API interne, sans exposition publique.','[]','{}');
insert into public.hub_event_definitions(event_name,source_identifier,description,payload_schema) values
('crm.contact.created','crm','Prévu pour la création future d’un contact CRM.','{}'),('crm.opportunity.updated','crm','Prévu pour la mise à jour future d’une opportunité CRM.','{}'),('website.published','website-builder','Prévu pour la publication future d’un site.','{}'),('automation.executed','automations','Prévu pour une exécution future d’automatisation.','{}'),('assistant.reply.sent','assistant','Prévu pour une réponse future d’assistant.','{}'),('content.published','content','Prévu pour la publication future de contenu.','{}'),('module.installed','hub','Module installé.','{}'),('agent.enabled','hub','Agent activé.','{}');
