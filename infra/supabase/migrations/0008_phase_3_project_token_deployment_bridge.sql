grant usage on schema app_public to service_role;

create or replace function app_private.is_project_contract_visible(p_project_contract_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from app_public.project_contracts as project_contract
    where project_contract.id = p_project_contract_id
      and app_private.is_project_visible(project_contract.project_id)
  );
$function$;

revoke all on function app_private.is_project_contract_visible(uuid) from public;
grant execute on function app_private.is_project_contract_visible(uuid) to authenticated;

create table if not exists app_public.project_token_deployments (
  project_contract_id uuid primary key references app_public.project_contracts(id) on delete cascade,
  source_contract_name text not null,
  token_name text not null,
  token_symbol text not null,
  decimals integer not null,
  cap numeric(78,0) not null,
  initial_supply numeric(78,0) not null,
  admin_address text not null,
  initial_recipient text not null,
  mint_authority text,
  deployment_tx_hash text not null,
  deployed_block_number bigint not null,
  deployer_address text not null,
  verification_provider text not null,
  verification_url text not null,
  verified_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint project_token_deployments_source_contract_name_length_check check (
    char_length(source_contract_name) between 1 and 120
  ),
  constraint project_token_deployments_token_name_length_check check (
    char_length(token_name) between 1 and 120
  ),
  constraint project_token_deployments_token_symbol_length_check check (
    char_length(token_symbol) between 1 and 12
  ),
  constraint project_token_deployments_decimals_check check (decimals = 18),
  constraint project_token_deployments_cap_nonnegative_check check (cap >= 0),
  constraint project_token_deployments_initial_supply_nonnegative_check check (initial_supply >= 0),
  constraint project_token_deployments_initial_supply_within_cap_check check (initial_supply <= cap),
  constraint project_token_deployments_admin_address_format_check check (
    admin_address ~ '^0x[a-f0-9]{40}$'
  ),
  constraint project_token_deployments_initial_recipient_format_check check (
    initial_recipient ~ '^0x[a-f0-9]{40}$'
  ),
  constraint project_token_deployments_mint_authority_format_check check (
    mint_authority is null or mint_authority ~ '^0x[a-f0-9]{40}$'
  ),
  constraint project_token_deployments_deployment_tx_hash_format_check check (
    deployment_tx_hash ~ '^0x[a-f0-9]{64}$'
  ),
  constraint project_token_deployments_deployer_address_format_check check (
    deployer_address ~ '^0x[a-f0-9]{40}$'
  ),
  constraint project_token_deployments_deployed_block_number_positive_check check (
    deployed_block_number > 0
  ),
  constraint project_token_deployments_verification_provider_check check (
    verification_provider in ('etherscan', 'blockscout', 'sourcify')
  ),
  constraint project_token_deployments_verification_url_format_check check (
    verification_url ~ '^https?://'
  )
);

create index if not exists project_token_deployments_verified_at_idx
  on app_public.project_token_deployments (verified_at);

drop trigger if exists project_token_deployments_set_updated_at on app_public.project_token_deployments;
create trigger project_token_deployments_set_updated_at
before update on app_public.project_token_deployments
for each row
execute function app_private.set_updated_at();

revoke all on table app_public.project_token_deployments from anon, authenticated;
grant select on table app_public.project_token_deployments to authenticated;

alter table app_public.project_token_deployments enable row level security;

drop policy if exists project_token_deployments_select_project_contract_visibility on app_public.project_token_deployments;
create policy project_token_deployments_select_project_contract_visibility
on app_public.project_token_deployments
for select
to authenticated
using (app_private.is_project_contract_visible(project_contract_id));

create or replace function app_public.record_project_token_deployment(
  p_project_contract_id uuid,
  p_workspace_slug text,
  p_project_slug text,
  p_chain_id bigint,
  p_address text,
  p_label text,
  p_deployment_environment text,
  p_explorer_url text,
  p_notes text,
  p_source_contract_name text,
  p_token_name text,
  p_token_symbol text,
  p_decimals integer,
  p_cap numeric,
  p_initial_supply numeric,
  p_admin_address text,
  p_initial_recipient text,
  p_mint_authority text,
  p_deployment_tx_hash text,
  p_deployed_block_number bigint,
  p_deployer_address text,
  p_verification_provider text,
  p_verification_url text,
  p_verified_at timestamptz
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
  v_project_id uuid;
  v_normalized_address text;
begin
  select project.id
  into v_project_id
  from app_public.projects as project
  join app_public.workspaces as workspace
    on workspace.id = project.workspace_id
  where workspace.slug = p_workspace_slug
    and project.slug = p_project_slug
  limit 1;

  if v_project_id is null then
    raise exception 'Project not found'
      using errcode = '22023';
  end if;

  v_normalized_address := lower(trim(p_address));

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
    v_project_id,
    p_chain_id,
    v_normalized_address,
    'project_token',
    trim(p_label),
    p_deployment_environment,
    nullif(trim(p_explorer_url), ''),
    nullif(trim(p_notes), '')
  );

  insert into app_public.project_token_deployments (
    project_contract_id,
    source_contract_name,
    token_name,
    token_symbol,
    decimals,
    cap,
    initial_supply,
    admin_address,
    initial_recipient,
    mint_authority,
    deployment_tx_hash,
    deployed_block_number,
    deployer_address,
    verification_provider,
    verification_url,
    verified_at
  )
  values (
    p_project_contract_id,
    trim(p_source_contract_name),
    trim(p_token_name),
    trim(p_token_symbol),
    p_decimals,
    p_cap,
    p_initial_supply,
    lower(trim(p_admin_address)),
    lower(trim(p_initial_recipient)),
    nullif(lower(trim(p_mint_authority)), ''),
    lower(trim(p_deployment_tx_hash)),
    p_deployed_block_number,
    lower(trim(p_deployer_address)),
    p_verification_provider,
    trim(p_verification_url),
    p_verified_at
  );

  return query
  select p_project_contract_id, v_project_id, v_normalized_address;
end;
$function$;

revoke all on function app_public.record_project_token_deployment(
  uuid,
  text,
  text,
  bigint,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  integer,
  numeric,
  numeric,
  text,
  text,
  text,
  text,
  bigint,
  text,
  text,
  text,
  timestamptz
) from public;

grant execute on function app_public.record_project_token_deployment(
  uuid,
  text,
  text,
  bigint,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  integer,
  numeric,
  numeric,
  text,
  text,
  text,
  text,
  bigint,
  text,
  text,
  text,
  timestamptz
) to service_role;
