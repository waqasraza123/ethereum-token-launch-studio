create or replace function app_private.is_project_visible(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from app_public.projects as project
    join app_public.workspace_members as workspace_member
      on workspace_member.workspace_id = project.workspace_id
    where project.id = p_project_id
      and workspace_member.auth_user_id = auth.uid()
  );
$function$;

revoke all on function app_private.is_project_visible(uuid) from public;
grant execute on function app_private.is_project_visible(uuid) to authenticated;

create table if not exists app_public.project_contracts (
  id uuid primary key,
  project_id uuid not null references app_public.projects(id),
  chain_id bigint not null,
  address text not null,
  contract_kind text not null,
  label text not null,
  deployment_environment text not null,
  explorer_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint project_contracts_chain_id_positive_check check (chain_id > 0),
  constraint project_contracts_address_format_check check (address ~ '^0x[a-f0-9]{40}$'),
  constraint project_contracts_contract_kind_check check (
    contract_kind in (
      'project_token',
      'token_sale',
      'claim_campaign_manager',
      'vesting_factory',
      'safe_treasury',
      'other'
    )
  ),
  constraint project_contracts_deployment_environment_check check (
    deployment_environment in ('local', 'testnet', 'mainnet', 'custom')
  ),
  constraint project_contracts_label_length_check check (
    char_length(label) between 1 and 120
  ),
  constraint project_contracts_explorer_url_format_check check (
    explorer_url is null or explorer_url ~ '^https?://'
  ),
  constraint project_contracts_notes_length_check check (
    notes is null or char_length(notes) <= 5000
  ),
  constraint project_contracts_project_chain_address_unique unique (project_id, chain_id, address)
);

create index if not exists project_contracts_project_id_idx
  on app_public.project_contracts (project_id);

drop trigger if exists project_contracts_set_updated_at on app_public.project_contracts;
create trigger project_contracts_set_updated_at
before update on app_public.project_contracts
for each row
execute function app_private.set_updated_at();

revoke all on table app_public.project_contracts from anon, authenticated;
grant select on table app_public.project_contracts to authenticated;

create or replace function app_public.update_project(
  p_project_id uuid,
  p_project_name text,
  p_project_slug text,
  p_project_description text
)
returns table (
  project_id uuid,
  workspace_id uuid,
  project_slug text
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_workspace_id uuid;
  v_actor_role text;
begin
  select
    project.workspace_id,
    workspace_member.role
  into
    v_workspace_id,
    v_actor_role
  from app_public.projects as project
  join app_public.workspace_members as workspace_member
    on workspace_member.workspace_id = project.workspace_id
  where project.id = p_project_id
    and workspace_member.auth_user_id = auth.uid()
  limit 1;

  if v_workspace_id is null then
    raise exception 'Project not found or not authorized'
      using errcode = '42501';
  end if;

  if v_actor_role not in ('owner', 'ops_manager') then
    raise exception 'Insufficient role to update project'
      using errcode = '42501';
  end if;

  update app_public.projects
  set
    name = p_project_name,
    slug = p_project_slug,
    description = nullif(trim(p_project_description), '')
  where id = p_project_id;

  return query
  select p_project_id, v_workspace_id, p_project_slug;
end;
$function$;

revoke all on function app_public.update_project(uuid, text, text, text) from public;
grant execute on function app_public.update_project(uuid, text, text, text) to authenticated;

create or replace function app_public.delete_project(
  p_project_id uuid
)
returns table (
  project_id uuid,
  workspace_id uuid
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_workspace_id uuid;
  v_actor_role text;
  v_attached_contract_count bigint;
begin
  select
    project.workspace_id,
    workspace_member.role
  into
    v_workspace_id,
    v_actor_role
  from app_public.projects as project
  join app_public.workspace_members as workspace_member
    on workspace_member.workspace_id = project.workspace_id
  where project.id = p_project_id
    and workspace_member.auth_user_id = auth.uid()
  limit 1;

  if v_workspace_id is null then
    raise exception 'Project not found or not authorized'
      using errcode = '42501';
  end if;

  if v_actor_role not in ('owner', 'ops_manager') then
    raise exception 'Insufficient role to delete project'
      using errcode = '42501';
  end if;

  select count(*)
  into v_attached_contract_count
  from app_public.project_contracts as project_contract
  where project_contract.project_id = p_project_id;

  if v_attached_contract_count > 0 then
    raise exception 'Cannot delete project with attached contracts'
      using errcode = '22023';
  end if;

  delete from app_public.projects
  where id = p_project_id;

  return query
  select p_project_id, v_workspace_id;
end;
$function$;

revoke all on function app_public.delete_project(uuid) from public;
grant execute on function app_public.delete_project(uuid) to authenticated;

create or replace function app_public.attach_project_contract(
  p_project_contract_id uuid,
  p_project_id uuid,
  p_chain_id bigint,
  p_address text,
  p_contract_kind text,
  p_label text,
  p_deployment_environment text,
  p_explorer_url text,
  p_notes text
)
returns table (
  project_contract_id uuid,
  project_id uuid,
  address text
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor_role text;
begin
  select workspace_member.role
  into v_actor_role
  from app_public.projects as project
  join app_public.workspace_members as workspace_member
    on workspace_member.workspace_id = project.workspace_id
  where project.id = p_project_id
    and workspace_member.auth_user_id = auth.uid()
  limit 1;

  if v_actor_role is null then
    raise exception 'Project not found or not authorized'
      using errcode = '42501';
  end if;

  if v_actor_role not in ('owner', 'ops_manager') then
    raise exception 'Insufficient role to attach project contract'
      using errcode = '42501';
  end if;

  insert into app_public.project_contracts (
    id,
    project_id,
    chain_id,
    address,
    contract_kind,
    label,
    deployment_environment,
    explorer_url,
    notes
  )
  values (
    p_project_contract_id,
    p_project_id,
    p_chain_id,
    lower(trim(p_address)),
    p_contract_kind,
    trim(p_label),
    p_deployment_environment,
    nullif(trim(p_explorer_url), ''),
    nullif(trim(p_notes), '')
  );

  return query
  select p_project_contract_id, p_project_id, lower(trim(p_address));
end;
$function$;

revoke all on function app_public.attach_project_contract(uuid, uuid, bigint, text, text, text, text, text, text) from public;
grant execute on function app_public.attach_project_contract(uuid, uuid, bigint, text, text, text, text, text, text) to authenticated;

create or replace function app_public.detach_project_contract(
  p_project_contract_id uuid
)
returns table (
  project_contract_id uuid,
  project_id uuid
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_project_id uuid;
  v_actor_role text;
begin
  select
    project_contract.project_id,
    workspace_member.role
  into
    v_project_id,
    v_actor_role
  from app_public.project_contracts as project_contract
  join app_public.projects as project
    on project.id = project_contract.project_id
  join app_public.workspace_members as workspace_member
    on workspace_member.workspace_id = project.workspace_id
  where project_contract.id = p_project_contract_id
    and workspace_member.auth_user_id = auth.uid()
  limit 1;

  if v_project_id is null then
    raise exception 'Project contract not found or not authorized'
      using errcode = '42501';
  end if;

  if v_actor_role not in ('owner', 'ops_manager') then
    raise exception 'Insufficient role to detach project contract'
      using errcode = '42501';
  end if;

  delete from app_public.project_contracts
  where id = p_project_contract_id;

  return query
  select p_project_contract_id, v_project_id;
end;
$function$;

revoke all on function app_public.detach_project_contract(uuid) from public;
grant execute on function app_public.detach_project_contract(uuid) to authenticated;

alter table app_public.project_contracts enable row level security;

drop policy if exists project_contracts_select_project_visibility on app_public.project_contracts;
create policy project_contracts_select_project_visibility
on app_public.project_contracts
for select
to authenticated
using (app_private.is_project_visible(project_id));
