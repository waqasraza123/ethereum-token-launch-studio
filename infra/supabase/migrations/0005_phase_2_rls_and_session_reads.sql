grant usage on schema app_public to authenticated;
grant usage on schema app_private to authenticated;

revoke all on table app_public.workspaces from anon, authenticated;
revoke all on table app_public.workspace_members from anon, authenticated;
revoke all on table app_public.projects from anon, authenticated;

grant select on table app_public.workspaces to authenticated;
grant select on table app_public.workspace_members to authenticated;
grant select on table app_public.projects to authenticated;

create or replace function app_private.is_workspace_member(p_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from app_public.workspace_members as workspace_member
    where workspace_member.workspace_id = p_workspace_id
      and workspace_member.auth_user_id = auth.uid()
  );
$function$;

revoke all on function app_private.is_workspace_member(uuid) from public;
grant execute on function app_private.is_workspace_member(uuid) to authenticated;

drop function if exists app_public.bootstrap_workspace(uuid, text, text, uuid, uuid);

create or replace function app_public.bootstrap_workspace(
  p_workspace_id uuid,
  p_workspace_slug text,
  p_workspace_name text,
  p_owner_membership_id uuid
)
returns table (
  workspace_id uuid,
  workspace_member_id uuid
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_auth_user_id uuid;
begin
  v_auth_user_id := auth.uid();

  if v_auth_user_id is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;

  insert into app_public.workspaces (id, slug, name)
  values (p_workspace_id, p_workspace_slug, p_workspace_name);

  insert into app_public.workspace_members (id, workspace_id, auth_user_id, role)
  values (p_owner_membership_id, p_workspace_id, v_auth_user_id, 'owner');

  return query
  select p_workspace_id, p_owner_membership_id;
end;
$function$;

revoke all on function app_public.bootstrap_workspace(uuid, text, text, uuid) from public;
grant execute on function app_public.bootstrap_workspace(uuid, text, text, uuid) to authenticated;

drop function if exists app_public.create_project(uuid, uuid, text, text, text, uuid);

create or replace function app_public.create_project(
  p_project_id uuid,
  p_workspace_id uuid,
  p_project_slug text,
  p_project_name text,
  p_project_description text
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
  v_auth_user_id uuid;
begin
  v_auth_user_id := auth.uid();

  if v_auth_user_id is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;

  select workspace_member.role
  into v_actor_role
  from app_public.workspace_members as workspace_member
  where workspace_member.workspace_id = p_workspace_id
    and workspace_member.auth_user_id = v_auth_user_id
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

revoke all on function app_public.create_project(uuid, uuid, text, text, text) from public;
grant execute on function app_public.create_project(uuid, uuid, text, text, text) to authenticated;

alter table app_public.workspaces enable row level security;
alter table app_public.workspace_members enable row level security;
alter table app_public.projects enable row level security;

drop policy if exists workspaces_select_member_access on app_public.workspaces;
create policy workspaces_select_member_access
on app_public.workspaces
for select
to authenticated
using (app_private.is_workspace_member(id));

drop policy if exists workspace_members_select_self_access on app_public.workspace_members;
create policy workspace_members_select_self_access
on app_public.workspace_members
for select
to authenticated
using (auth.uid() = auth_user_id);

drop policy if exists projects_select_member_access on app_public.projects;
create policy projects_select_member_access
on app_public.projects
for select
to authenticated
using (app_private.is_workspace_member(workspace_id));
