alter table app_public.project_token_launch_requests
  drop constraint if exists project_token_launch_requests_status_check;

alter table app_public.project_token_launch_requests
  add constraint project_token_launch_requests_status_check
  check (
    status in ('pending', 'claimed', 'deploying', 'retry_scheduled', 'succeeded', 'failed', 'cancelled')
  );

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
      'project_token_launch_retry_requested',
      'project_token_launch_cancelled'
    )
  );

drop function if exists app_public.mark_project_token_launch_request_started(uuid, text);

create or replace function app_public.mark_project_token_launch_request_started(
  p_request_id uuid,
  p_worker_id text
)
returns table (
  project_id uuid,
  start_status text
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_project_id uuid;
  v_status text;
  v_worker_id text;
begin
  select request.project_id, request.status, request.worker_id
  into v_project_id, v_status, v_worker_id
  from app_public.project_token_launch_requests as request
  where request.id = p_request_id
  limit 1;

  if v_project_id is null then
    raise exception 'Launch request not found'
      using errcode = '22023';
  end if;

  if v_status = 'cancelled' and v_worker_id = p_worker_id then
    return query
    select v_project_id, 'cancelled'::text;
    return;
  end if;

  if v_worker_id <> p_worker_id or v_status not in ('claimed', 'deploying') then
    raise exception 'Launch request not found or not claimable'
      using errcode = '22023';
  end if;

  update app_public.project_token_launch_requests as request
  set
    status = 'deploying',
    started_at = coalesce(request.started_at, now()),
    heartbeat_at = now()
  where request.id = p_request_id
  returning request.project_id
  into v_project_id;

  perform app_private.insert_project_activity(
    app_private.generate_uuid(),
    v_project_id,
    'project_token_launch_started',
    'worker',
    null,
    p_worker_id,
    null,
    jsonb_build_object(
      'requestId', p_request_id,
      'workerId', p_worker_id
    )
  );

  return query
  select v_project_id, 'started'::text;
end;
$function$;

revoke all on function app_public.mark_project_token_launch_request_started(uuid, text) from public;
grant execute on function app_public.mark_project_token_launch_request_started(uuid, text) to service_role;

create or replace function app_public.cancel_project_token_launch_request(
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
as $function$
declare
  v_project_id uuid;
  v_actor_role text;
  v_auth_user_id uuid;
  v_current_status text;
  v_worker_id text;
begin
  v_auth_user_id := auth.uid();

  if v_auth_user_id is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;

  select request.project_id, request.status, request.worker_id, workspace_member.role
  into v_project_id, v_current_status, v_worker_id, v_actor_role
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
    raise exception 'Insufficient role to cancel token launch request'
      using errcode = '42501';
  end if;

  if v_current_status not in ('pending', 'claimed', 'retry_scheduled') then
    raise exception 'Launch request is not cancellable'
      using errcode = '22023';
  end if;

  update app_public.project_token_launch_requests as request
  set
    status = 'cancelled',
    completed_at = now(),
    claimed_at = case when v_current_status = 'claimed' then request.claimed_at else null end,
    started_at = null,
    failed_at = null,
    failure_message = null,
    heartbeat_at = null,
    next_retry_at = null,
    last_error_at = null,
    worker_id = case when v_current_status = 'claimed' then v_worker_id else null end
  where request.id = p_request_id;

  perform app_private.insert_project_activity(
    app_private.generate_uuid(),
    v_project_id,
    'project_token_launch_cancelled',
    'user',
    v_auth_user_id,
    null,
    null,
    jsonb_build_object(
      'requestId', p_request_id
    )
  );

  return query
  select p_request_id, v_project_id, 'cancelled'::text;
end;
$function$;

revoke all on function app_public.cancel_project_token_launch_request(uuid) from public;
grant execute on function app_public.cancel_project_token_launch_request(uuid) to authenticated;
