create or replace function app_public.create_project(
  p_project_id uuid,
  p_workspace_id uuid,
  p_project_slug text,
  p_project_name text,
  p_project_description text,
  p_actor_auth_user_id uuid
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
  v_actor_role text;
begin
  select wm.role
  into v_actor_role
  from app_public.workspace_members as wm
  where wm.workspace_id = p_workspace_id
    and wm.auth_user_id = p_actor_auth_user_id
  limit 1;

  if v_actor_role is null then
    raise exception 'Workspace membership not found'
      using errcode = '42501';
  end if;

  if v_actor_role not in ('owner', 'ops_manager') then
    raise exception 'Insufficient role to create project'
      using errcode = '42501';
  end if;

  insert into app_public.projects (id, workspace_id, slug, name, description)
  values (
    p_project_id,
    p_workspace_id,
    p_project_slug,
    p_project_name,
    nullif(trim(p_project_description), '')
  );

  return query
  select p_project_id, p_workspace_id;
end;
$function$;
