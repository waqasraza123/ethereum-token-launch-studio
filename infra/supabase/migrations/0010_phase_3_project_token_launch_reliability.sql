alter table app_public.project_token_launch_requests
  add column if not exists retry_count integer not null default 0;

alter table app_public.project_token_launch_requests
  add column if not exists max_attempts integer not null default 3;

alter table app_public.project_token_launch_requests
  add column if not exists next_retry_at timestamptz;

alter table app_public.project_token_launch_requests
  add column if not exists heartbeat_at timestamptz;

alter table app_public.project_token_launch_requests
  add column if not exists last_error_at timestamptz;

alter table app_public.project_token_launch_requests
  drop constraint if exists project_token_launch_requests_status_check;

alter table app_public.project_token_launch_requests
  add constraint project_token_launch_requests_status_check
  check (status in ('pending', 'claimed', 'deploying', 'retry_scheduled', 'succeeded', 'failed'));

alter table app_public.project_token_launch_requests
  add constraint project_token_launch_requests_retry_count_nonnegative_check
  check (retry_count >= 0);

alter table app_public.project_token_launch_requests
  add constraint project_token_launch_requests_max_attempts_positive_check
  check (max_attempts between 1 and 10);

alter table app_public.project_token_launch_requests
  add constraint project_token_launch_requests_retry_count_within_max_attempts_check
  check (retry_count <= max_attempts);

create unique index if not exists project_token_launch_requests_active_project_unique_idx
  on app_public.project_token_launch_requests (project_id)
  where status in ('pending', 'claimed', 'deploying', 'retry_scheduled');

create index if not exists project_token_launch_requests_status_next_retry_at_idx
  on app_public.project_token_launch_requests (status, next_retry_at);

create index if not exists project_token_launch_requests_status_heartbeat_at_idx
  on app_public.project_token_launch_requests (status, heartbeat_at);

alter table app_public.project_activities
  drop constraint if exists project_activities_activity_kind_check;

alter table app_public.project_activities
  add constraint project_activities_activity_kind_check
  check (
    activity_kind in (
      'project_token_launch_requested',
      'project_token_launch_claimed',
      'project_token_launch_started',
      'project_token_deployed',
      'project_token_launch_failed',
      'project_token_launch_retry_scheduled',
      'project_token_launch_recovered',
      'project_token_launch_retry_requested'
    )
  );

create or replace function app_private.project_token_launch_retry_delay(
  p_retry_count integer
)
returns interval
language sql
immutable
security definer
set search_path = ''
as $$
  select case
    when p_retry_count <= 1 then interval '1 minute'
    when p_retry_count = 2 then interval '5 minutes'
    else interval '15 minutes'
  end;
$$;

revoke all on function app_private.project_token_launch_retry_delay(integer) from public;

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
as $$
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
    notes,
    retry_count,
    max_attempts
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
    nullif(trim(p_notes), ''),
    0,
    3
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
$$;

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
as $$
declare
  v_request_id uuid;
  v_project_id uuid;
begin
  with next_request as (
    select request.id
    from app_public.project_token_launch_requests as request
    where request.status in ('pending', 'retry_scheduled')
      and coalesce(request.next_retry_at, request.created_at) <= now()
    order by coalesce(request.next_retry_at, request.created_at) asc, request.created_at asc
    limit 1
    for update skip locked
  )
  update app_public.project_token_launch_requests as request
  set
    status = 'claimed',
    worker_id = p_worker_id,
    claimed_at = now(),
    started_at = null,
    heartbeat_at = now(),
    failed_at = null,
    failure_message = null,
    last_error_at = null,
    next_retry_at = null
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
$$;

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
as $$
declare
  v_project_id uuid;
begin
  update app_public.project_token_launch_requests as request
  set
    status = 'deploying',
    started_at = coalesce(request.started_at, now()),
    heartbeat_at = now()
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
$$;

revoke all on function app_public.mark_project_token_launch_request_started(uuid, text) from public;
grant execute on function app_public.mark_project_token_launch_request_started(uuid, text) to service_role;

create or replace function app_public.touch_project_token_launch_request_heartbeat(
  p_request_id uuid,
  p_worker_id text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update app_public.project_token_launch_requests as request
  set heartbeat_at = now()
  where request.id = p_request_id
    and request.worker_id = p_worker_id
    and request.status in ('claimed', 'deploying');

  if not found then
    raise exception 'Launch request heartbeat target not found'
      using errcode = '22023';
  end if;
end;
$$;

revoke all on function app_public.touch_project_token_launch_request_heartbeat(uuid, text) from public;
grant execute on function app_public.touch_project_token_launch_request_heartbeat(uuid, text) to service_role;

create or replace function app_public.override_project_token_launch_request_heartbeat_at(
  p_request_id uuid,
  p_heartbeat_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update app_public.project_token_launch_requests as request
  set heartbeat_at = p_heartbeat_at
  where request.id = p_request_id;

  if not found then
    raise exception 'Launch request not found'
      using errcode = '22023';
  end if;
end;
$$;

revoke all on function app_public.override_project_token_launch_request_heartbeat_at(uuid, timestamptz) from public;
grant execute on function app_public.override_project_token_launch_request_heartbeat_at(uuid, timestamptz) to service_role;

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
as $$
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
    failure_message = null,
    last_error_at = null,
    heartbeat_at = null,
    next_retry_at = null
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
$$;

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

create or replace function app_public.override_project_token_launch_request_next_retry_at(
  p_request_id uuid,
  p_next_retry_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update app_public.project_token_launch_requests as request
  set next_retry_at = p_next_retry_at
  where request.id = p_request_id
    and request.status = 'retry_scheduled';

  if not found then
    raise exception 'Launch request is not waiting for retry'
      using errcode = '22023';
  end if;
end;
$$;

revoke all on function app_public.override_project_token_launch_request_next_retry_at(uuid, timestamptz) from public;
grant execute on function app_public.override_project_token_launch_request_next_retry_at(uuid, timestamptz) to service_role;

drop function if exists app_public.mark_project_token_launch_request_failed(uuid, text, text);

create or replace function app_public.mark_project_token_launch_request_failed(
  p_request_id uuid,
  p_worker_id text,
  p_failure_message text
)
returns table (
  status text,
  retry_count integer,
  next_retry_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_project_id uuid;
  v_next_retry_count integer;
  v_max_attempts integer;
  v_failure_message text;
  v_next_retry_at timestamptz;
  v_status text;
begin
  select request.project_id, request.retry_count + 1, request.max_attempts
  into v_project_id, v_next_retry_count, v_max_attempts
  from app_public.project_token_launch_requests as request
  where request.id = p_request_id
    and request.worker_id = p_worker_id
    and request.status in ('claimed', 'deploying')
  limit 1;

  if v_project_id is null then
    raise exception 'Launch request not found or not fail-able'
      using errcode = '22023';
  end if;

  v_failure_message := left(trim(p_failure_message), 5000);

  if v_next_retry_count >= v_max_attempts then
    v_status := 'failed';
    v_next_retry_at := null;
  else
    v_status := 'retry_scheduled';
    v_next_retry_at := now() + app_private.project_token_launch_retry_delay(v_next_retry_count);
  end if;

  update app_public.project_token_launch_requests as request
  set
    status = v_status,
    retry_count = v_next_retry_count,
    next_retry_at = v_next_retry_at,
    failure_message = v_failure_message,
    last_error_at = now(),
    failed_at = now(),
    completed_at = null,
    claimed_at = null,
    started_at = null,
    heartbeat_at = null,
    worker_id = null
  where request.id = p_request_id;

  if v_status = 'retry_scheduled' then
    perform app_private.insert_project_activity(
      app_private.generate_uuid(),
      v_project_id,
      'project_token_launch_retry_scheduled',
      'worker',
      null,
      p_worker_id,
      null,
      jsonb_build_object(
        'requestId', p_request_id,
        'failureMessage', v_failure_message,
        'retryCount', v_next_retry_count,
        'nextRetryAt', v_next_retry_at
      )
    );
  else
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
        'failureMessage', v_failure_message,
        'retryCount', v_next_retry_count
      )
    );
  end if;

  return query
  select v_status, v_next_retry_count, v_next_retry_at;
end;
$$;

revoke all on function app_public.mark_project_token_launch_request_failed(uuid, text, text) from public;
grant execute on function app_public.mark_project_token_launch_request_failed(uuid, text, text) to service_role;

create or replace function app_public.recover_stale_project_token_launch_requests(
  p_recovered_by_worker_id text,
  p_stale_before timestamptz
)
returns table (
  request_id uuid,
  status text,
  retry_count integer,
  next_retry_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request record;
  v_failure_outcome record;
begin
  for v_request in
    select request.id, request.worker_id, request.project_id
    from app_public.project_token_launch_requests as request
    where request.status in ('claimed', 'deploying')
      and coalesce(request.heartbeat_at, request.claimed_at, request.created_at) < p_stale_before
    order by coalesce(request.heartbeat_at, request.claimed_at, request.created_at) asc
    for update skip locked
  loop
    select *
    into v_failure_outcome
    from app_public.mark_project_token_launch_request_failed(
      v_request.id,
      v_request.worker_id,
      'Launch request recovered after worker heartbeat timeout.'
    );

    perform app_private.insert_project_activity(
      app_private.generate_uuid(),
      v_request.project_id,
      'project_token_launch_recovered',
      'worker',
      null,
      p_recovered_by_worker_id,
      null,
      jsonb_build_object(
        'requestId', v_request.id,
        'staleWorkerId', v_request.worker_id,
        'retryCount', v_failure_outcome.retry_count,
        'nextRetryAt', v_failure_outcome.next_retry_at,
        'outcomeStatus', v_failure_outcome.status
      )
    );

    request_id := v_request.id;
    status := v_failure_outcome.status;
    retry_count := v_failure_outcome.retry_count;
    next_retry_at := v_failure_outcome.next_retry_at;

    return next;
  end loop;
end;
$$;

revoke all on function app_public.recover_stale_project_token_launch_requests(text, timestamptz) from public;
grant execute on function app_public.recover_stale_project_token_launch_requests(text, timestamptz) to service_role;

create or replace function app_public.retry_failed_project_token_launch_request(
  p_request_id uuid
)
returns table (
  request_id uuid,
  project_id uuid,
  status text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_project_id uuid;
  v_actor_role text;
  v_auth_user_id uuid;
begin
  v_auth_user_id := auth.uid();

  if v_auth_user_id is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;

  select request.project_id, workspace_member.role
  into v_project_id, v_actor_role
  from app_public.project_token_launch_requests as request
  join app_public.projects as project
    on project.id = request.project_id
  join app_public.workspace_members as workspace_member
    on workspace_member.workspace_id = project.workspace_id
  where request.id = p_request_id
    and workspace_member.auth_user_id = v_auth_user_id
  limit 1;

  if v_project_id is null then
    raise exception 'Launch request not found or not authorized'
      using errcode = '42501';
  end if;

  if v_actor_role not in ('owner', 'ops_manager') then
    raise exception 'Insufficient role to retry project token launch'
      using errcode = '42501';
  end if;

  update app_public.project_token_launch_requests as request
  set
    status = 'pending',
    retry_count = 0,
    next_retry_at = null,
    failure_message = null,
    last_error_at = null,
    claimed_at = null,
    started_at = null,
    heartbeat_at = null,
    failed_at = null,
    completed_at = null,
    worker_id = null,
    project_contract_id = null,
    deployed_address = null,
    deployment_tx_hash = null,
    verification_url = null
  where request.id = p_request_id
    and request.status = 'failed';

  if not found then
    raise exception 'Launch request is not retryable'
      using errcode = '22023';
  end if;

  perform app_private.insert_project_activity(
    app_private.generate_uuid(),
    v_project_id,
    'project_token_launch_retry_requested',
    'user',
    v_auth_user_id,
    null,
    null,
    jsonb_build_object('requestId', p_request_id)
  );

  return query
  select p_request_id, v_project_id, 'pending';
end;
$$;

revoke all on function app_public.retry_failed_project_token_launch_request(uuid) from public;
grant execute on function app_public.retry_failed_project_token_launch_request(uuid) to authenticated;
