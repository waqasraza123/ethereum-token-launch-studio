create or replace function app_private.generate_uuid()
returns uuid
language sql
volatile
set search_path = ''
as $function$
  select (
    substr(md5(random()::text || clock_timestamp()::text), 1, 8) || '-' ||
    substr(md5(random()::text || clock_timestamp()::text), 9, 4) || '-' ||
    '4' || substr(md5(random()::text || clock_timestamp()::text), 14, 3) || '-' ||
    substr('89ab', (floor(random() * 4)::int + 1), 1) ||
    substr(md5(random()::text || clock_timestamp()::text), 18, 3) || '-' ||
    substr(md5(random()::text || clock_timestamp()::text), 21, 12)
  )::uuid
$function$;

revoke all on function app_private.generate_uuid() from public;

create table if not exists app_public.project_token_launch_requests (
  id uuid primary key,
  project_id uuid not null references app_public.projects(id) on delete cascade,
  requested_by_auth_user_id uuid not null references auth.users(id) on delete restrict,
  status text not null,
  chain_id bigint not null,
  deployment_environment text not null,
  registry_label text not null,
  token_name text not null,
  token_symbol text not null,
  cap numeric(78,0) not null,
  initial_supply numeric(78,0) not null,
  admin_address text not null,
  initial_recipient text not null,
  mint_authority text,
  notes text,
  worker_id text,
  project_contract_id uuid references app_public.project_contracts(id) on delete set null,
  deployed_address text,
  deployment_tx_hash text,
  verification_url text,
  failure_message text,
  claimed_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  failed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint project_token_launch_requests_status_check check (
    status in ('pending', 'claimed', 'deploying', 'succeeded', 'failed')
  ),
  constraint project_token_launch_requests_chain_id_check check (chain_id = 11155111),
  constraint project_token_launch_requests_deployment_environment_check check (
    deployment_environment = 'testnet'
  ),
  constraint project_token_launch_requests_registry_label_length_check check (
    char_length(registry_label) between 1 and 120
  ),
  constraint project_token_launch_requests_token_name_length_check check (
    char_length(token_name) between 1 and 120
  ),
  constraint project_token_launch_requests_token_symbol_length_check check (
    char_length(token_symbol) between 1 and 12
  ),
  constraint project_token_launch_requests_token_symbol_format_check check (
    token_symbol ~ '^[A-Z0-9]+$'
  ),
  constraint project_token_launch_requests_cap_nonnegative_check check (cap >= 0),
  constraint project_token_launch_requests_initial_supply_nonnegative_check check (
    initial_supply >= 0
  ),
  constraint project_token_launch_requests_initial_supply_within_cap_check check (
    initial_supply <= cap
  ),
  constraint project_token_launch_requests_admin_address_format_check check (
    admin_address ~ '^0x[a-f0-9]{40}$'
  ),
  constraint project_token_launch_requests_initial_recipient_format_check check (
    initial_recipient ~ '^0x[a-f0-9]{40}$'
  ),
  constraint project_token_launch_requests_mint_authority_format_check check (
    mint_authority is null or mint_authority ~ '^0x[a-f0-9]{40}$'
  ),
  constraint project_token_launch_requests_deployed_address_format_check check (
    deployed_address is null or deployed_address ~ '^0x[a-f0-9]{40}$'
  ),
  constraint project_token_launch_requests_deployment_tx_hash_format_check check (
    deployment_tx_hash is null or deployment_tx_hash ~ '^0x[a-f0-9]{64}$'
  ),
  constraint project_token_launch_requests_verification_url_format_check check (
    verification_url is null or verification_url ~ '^https?://'
  ),
  constraint project_token_launch_requests_notes_length_check check (
    notes is null or char_length(notes) <= 5000
  ),
  constraint project_token_launch_requests_failure_message_length_check check (
    failure_message is null or char_length(failure_message) <= 5000
  )
);

create index if not exists project_token_launch_requests_project_id_idx
  on app_public.project_token_launch_requests (project_id);

create index if not exists project_token_launch_requests_status_requested_at_idx
  on app_public.project_token_launch_requests (status, created_at);

drop trigger if exists project_token_launch_requests_set_updated_at on app_public.project_token_launch_requests;
create trigger project_token_launch_requests_set_updated_at
before update on app_public.project_token_launch_requests
for each row
execute function app_private.set_updated_at();

revoke all on table app_public.project_token_launch_requests from anon, authenticated;
grant select on table app_public.project_token_launch_requests to authenticated;

alter table app_public.project_token_launch_requests enable row level security;

drop policy if exists project_token_launch_requests_select_project_visibility on app_public.project_token_launch_requests;
create policy project_token_launch_requests_select_project_visibility
on app_public.project_token_launch_requests
for select
to authenticated
using (app_private.is_project_visible(project_id));

create table if not exists app_public.project_activities (
  id uuid primary key,
  project_id uuid not null references app_public.projects(id) on delete cascade,
  activity_kind text not null,
  actor_type text not null,
  actor_auth_user_id uuid references auth.users(id) on delete set null,
  worker_id text,
  related_project_contract_id uuid references app_public.project_contracts(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint project_activities_activity_kind_check check (
    activity_kind in (
      'project_token_launch_requested',
      'project_token_launch_claimed',
      'project_token_launch_started',
      'project_token_deployed',
      'project_token_launch_failed'
    )
  ),
  constraint project_activities_actor_type_check check (
    actor_type in ('user', 'worker', 'system')
  )
);

create index if not exists project_activities_project_id_created_at_idx
  on app_public.project_activities (project_id, created_at desc);

revoke all on table app_public.project_activities from anon, authenticated;
grant select on table app_public.project_activities to authenticated;

alter table app_public.project_activities enable row level security;

drop policy if exists project_activities_select_project_visibility on app_public.project_activities;
create policy project_activities_select_project_visibility
on app_public.project_activities
for select
to authenticated
using (app_private.is_project_visible(project_id));

create or replace function app_private.insert_project_activity(
  p_activity_id uuid,
  p_project_id uuid,
  p_activity_kind text,
  p_actor_type text,
  p_actor_auth_user_id uuid,
  p_worker_id text,
  p_related_project_contract_id uuid,
  p_metadata jsonb
)
returns void
language sql
security definer
set search_path = ''
as $function$
  insert into app_public.project_activities (
    id,
    project_id,
    activity_kind,
    actor_type,
    actor_auth_user_id,
    worker_id,
    related_project_contract_id,
    metadata
  )
  values (
    p_activity_id,
    p_project_id,
    p_activity_kind,
    p_actor_type,
    p_actor_auth_user_id,
    p_worker_id,
    p_related_project_contract_id,
    coalesce(p_metadata, '{}'::jsonb)
  );
$function$;

revoke all on function app_private.insert_project_activity(
  uuid,
  uuid,
  text,
  text,
  uuid,
  text,
  uuid,
  jsonb
) from public;

create or replace function app_public.create_project_token_launch_request(
  p_request_id uuid,
  p_project_id uuid,
  p_registry_label text,
  p_token_name text,
  p_token_symbol text,
  p_cap numeric,
  p_initial_supply numeric,
  p_admin_address text,
  p_initial_recipient text,
  p_mint_authority text,
  p_notes text
)
returns table (
  request_id uuid,
  project_id uuid,
  status text
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor_role text;
  v_auth_user_id uuid;
begin
  v_auth_user_id := auth.uid();

  if v_auth_user_id is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;

  select workspace_member.role
  into v_actor_role
  from app_public.projects as project
  join app_public.workspace_members as workspace_member
    on workspace_member.workspace_id = project.workspace_id
  where project.id = p_project_id
    and workspace_member.auth_user_id = v_auth_user_id
  limit 1;

  if v_actor_role is null then
    raise exception 'Project not found or not authorized'
      using errcode = '42501';
  end if;

  if v_actor_role not in ('owner', 'ops_manager') then
    raise exception 'Insufficient role to launch project token'
      using errcode = '42501';
  end if;

  insert into app_public.project_token_launch_requests (
    id,
    project_id,
    requested_by_auth_user_id,
    status,
    chain_id,
    deployment_environment,
    registry_label,
    token_name,
    token_symbol,
    cap,
    initial_supply,
    admin_address,
    initial_recipient,
    mint_authority,
    notes
  )
  values (
    p_request_id,
    p_project_id,
    v_auth_user_id,
    'pending',
    11155111,
    'testnet',
    trim(p_registry_label),
    trim(p_token_name),
    trim(p_token_symbol),
    p_cap,
    p_initial_supply,
    lower(trim(p_admin_address)),
    lower(trim(p_initial_recipient)),
    nullif(lower(trim(p_mint_authority)), ''),
    nullif(trim(p_notes), '')
  );

  perform app_private.insert_project_activity(
    app_private.generate_uuid(),
    p_project_id,
    'project_token_launch_requested',
    'user',
    v_auth_user_id,
    null,
    null,
    jsonb_build_object(
      'requestId', p_request_id,
      'label', trim(p_registry_label),
      'tokenName', trim(p_token_name),
      'tokenSymbol', trim(p_token_symbol)
    )
  );

  return query
  select p_request_id, p_project_id, 'pending';
end;
$function$;

revoke all on function app_public.create_project_token_launch_request(
  uuid,
  uuid,
  text,
  text,
  text,
  numeric,
  numeric,
  text,
  text,
  text,
  text
) from public;
grant execute on function app_public.create_project_token_launch_request(
  uuid,
  uuid,
  text,
  text,
  text,
  numeric,
  numeric,
  text,
  text,
  text,
  text
) to authenticated;

create or replace function app_public.claim_next_project_token_launch_request(
  p_worker_id text
)
returns table (
  request_id uuid,
  workspace_slug text,
  project_slug text,
  project_id uuid,
  registry_label text,
  token_name text,
  token_symbol text,
  cap text,
  initial_supply text,
  admin_address text,
  initial_recipient text,
  mint_authority text,
  notes text
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_request_id uuid;
  v_project_id uuid;
begin
  with next_request as (
    select request.id
    from app_public.project_token_launch_requests as request
    where request.status = 'pending'
    order by request.created_at asc
    limit 1
    for update skip locked
  )
  update app_public.project_token_launch_requests as request
  set
    status = 'claimed',
    worker_id = p_worker_id,
    claimed_at = now()
  from next_request
  where request.id = next_request.id
  returning request.id, request.project_id
  into v_request_id, v_project_id;

  if v_request_id is null then
    return;
  end if;

  perform app_private.insert_project_activity(
    app_private.generate_uuid(),
    v_project_id,
    'project_token_launch_claimed',
    'worker',
    null,
    p_worker_id,
    null,
    jsonb_build_object('requestId', v_request_id)
  );

  return query
  select
    request.id,
    workspace.slug,
    project.slug,
    project.id,
    request.registry_label,
    request.token_name,
    request.token_symbol,
    request.cap::text,
    request.initial_supply::text,
    request.admin_address,
    request.initial_recipient,
    request.mint_authority,
    request.notes
  from app_public.project_token_launch_requests as request
  join app_public.projects as project
    on project.id = request.project_id
  join app_public.workspaces as workspace
    on workspace.id = project.workspace_id
  where request.id = v_request_id;
end;
$function$;

revoke all on function app_public.claim_next_project_token_launch_request(text) from public;
grant execute on function app_public.claim_next_project_token_launch_request(text) to service_role;

create or replace function app_public.mark_project_token_launch_request_started(
  p_request_id uuid,
  p_worker_id text
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_project_id uuid;
begin
  update app_public.project_token_launch_requests as request
  set
    status = 'deploying',
    started_at = coalesce(request.started_at, now())
  where request.id = p_request_id
    and request.worker_id = p_worker_id
    and request.status in ('claimed', 'deploying')
  returning request.project_id
  into v_project_id;

  if v_project_id is null then
    raise exception 'Launch request not found or not claimable'
      using errcode = '22023';
  end if;

  perform app_private.insert_project_activity(
    app_private.generate_uuid(),
    v_project_id,
    'project_token_launch_started',
    'worker',
    null,
    p_worker_id,
    null,
    jsonb_build_object('requestId', p_request_id)
  );
end;
$function$;

revoke all on function app_public.mark_project_token_launch_request_started(uuid, text) from public;
grant execute on function app_public.mark_project_token_launch_request_started(uuid, text) to service_role;

create or replace function app_public.mark_project_token_launch_request_succeeded(
  p_request_id uuid,
  p_worker_id text,
  p_project_contract_id uuid,
  p_deployed_address text,
  p_deployment_tx_hash text,
  p_verification_url text
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_project_id uuid;
begin
  update app_public.project_token_launch_requests as request
  set
    status = 'succeeded',
    project_contract_id = p_project_contract_id,
    deployed_address = lower(trim(p_deployed_address)),
    deployment_tx_hash = lower(trim(p_deployment_tx_hash)),
    verification_url = trim(p_verification_url),
    completed_at = now(),
    failed_at = null,
    failure_message = null
  where request.id = p_request_id
    and request.worker_id = p_worker_id
    and request.status in ('claimed', 'deploying')
  returning request.project_id
  into v_project_id;

  if v_project_id is null then
    raise exception 'Launch request not found or not completable'
      using errcode = '22023';
  end if;

  perform app_private.insert_project_activity(
    app_private.generate_uuid(),
    v_project_id,
    'project_token_deployed',
    'worker',
    null,
    p_worker_id,
    p_project_contract_id,
    jsonb_build_object(
      'requestId', p_request_id,
      'address', lower(trim(p_deployed_address)),
      'deploymentTxHash', lower(trim(p_deployment_tx_hash)),
      'verificationUrl', trim(p_verification_url)
    )
  );
end;
$function$;

revoke all on function app_public.mark_project_token_launch_request_succeeded(
  uuid,
  text,
  uuid,
  text,
  text,
  text
) from public;
grant execute on function app_public.mark_project_token_launch_request_succeeded(
  uuid,
  text,
  uuid,
  text,
  text,
  text
) to service_role;

create or replace function app_public.mark_project_token_launch_request_failed(
  p_request_id uuid,
  p_worker_id text,
  p_failure_message text
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_project_id uuid;
  v_failure_message text;
begin
  v_failure_message := left(trim(p_failure_message), 5000);

  update app_public.project_token_launch_requests as request
  set
    status = 'failed',
    failed_at = now(),
    failure_message = v_failure_message
  where request.id = p_request_id
    and request.worker_id = p_worker_id
    and request.status in ('claimed', 'deploying')
  returning request.project_id
  into v_project_id;

  if v_project_id is null then
    raise exception 'Launch request not found or not fail-able'
      using errcode = '22023';
  end if;

  perform app_private.insert_project_activity(
    app_private.generate_uuid(),
    v_project_id,
    'project_token_launch_failed',
    'worker',
    null,
    p_worker_id,
    null,
    jsonb_build_object(
      'requestId', p_request_id,
      'failureMessage', v_failure_message
    )
  );
end;
$function$;

revoke all on function app_public.mark_project_token_launch_request_failed(uuid, text, text) from public;
grant execute on function app_public.mark_project_token_launch_request_failed(uuid, text, text) to service_role;
