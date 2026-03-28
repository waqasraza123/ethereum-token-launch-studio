create or replace function app_private.is_workspace_owner(p_workspace_id uuid)
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
      and workspace_member.role = 'owner'
  );
$function$;

revoke all on function app_private.is_workspace_owner(uuid) from public;

create or replace function app_private.workspace_owner_count(p_workspace_id uuid)
returns bigint
language sql
stable
security definer
set search_path = ''
as $function$
  select count(*)
  from app_public.workspace_members as workspace_member
  where workspace_member.workspace_id = p_workspace_id
    and workspace_member.role = 'owner';
$function$;

revoke all on function app_private.workspace_owner_count(uuid) from public;

create or replace function app_private.resolve_auth_user_id_by_email(p_member_email text)
returns uuid
language sql
stable
security definer
set search_path = ''
as $function$
  select auth_user.id
  from auth.users as auth_user
  where lower(auth_user.email) = lower(trim(p_member_email))
  limit 1;
$function$;

revoke all on function app_private.resolve_auth_user_id_by_email(text) from public;

create or replace function app_public.list_workspace_members(p_workspace_id uuid)
returns table (
  workspace_member_id uuid,
  auth_user_id uuid,
  email text,
  role text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if not app_private.is_workspace_member(p_workspace_id) then
    raise exception 'Workspace membership not found'
      using errcode = '42501';
  end if;

  return query
  select
    workspace_member.id,
    workspace_member.auth_user_id,
    auth_user.email,
    workspace_member.role,
    workspace_member.created_at
  from app_public.workspace_members as workspace_member
  join auth.users as auth_user
    on auth_user.id = workspace_member.auth_user_id
  where workspace_member.workspace_id = p_workspace_id
  order by workspace_member.created_at asc;
end;
$function$;

revoke all on function app_public.list_workspace_members(uuid) from public;
grant execute on function app_public.list_workspace_members(uuid) to authenticated;

create or replace function app_public.invite_workspace_member(
  p_workspace_id uuid,
  p_workspace_member_id uuid,
  p_member_email text,
  p_role text
)
returns table (
  workspace_member_id uuid,
  workspace_id uuid,
  auth_user_id uuid
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_member_auth_user_id uuid;
begin
  if not app_private.is_workspace_owner(p_workspace_id) then
    raise exception 'Only owners can change workspace memberships'
      using errcode = '42501';
  end if;

  v_member_auth_user_id := app_private.resolve_auth_user_id_by_email(p_member_email);

  if v_member_auth_user_id is null then
    raise exception 'Auth user not found for email'
      using errcode = '22023';
  end if;

  insert into app_public.workspace_members (id, workspace_id, auth_user_id, role)
  values (
    p_workspace_member_id,
    p_workspace_id,
    v_member_auth_user_id,
    p_role
  );

  return query
  select p_workspace_member_id, p_workspace_id, v_member_auth_user_id;
end;
$function$;

revoke all on function app_public.invite_workspace_member(uuid, uuid, text, text) from public;
grant execute on function app_public.invite_workspace_member(uuid, uuid, text, text) to authenticated;

create or replace function app_public.update_workspace_member_role(
  p_workspace_member_id uuid,
  p_role text
)
returns table (
  workspace_member_id uuid,
  workspace_id uuid,
  role text,
  auth_user_id uuid
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_workspace_id uuid;
  v_current_role text;
  v_target_auth_user_id uuid;
begin
  select
    workspace_member.workspace_id,
    workspace_member.role,
    workspace_member.auth_user_id
  into
    v_workspace_id,
    v_current_role,
    v_target_auth_user_id
  from app_public.workspace_members as workspace_member
  where workspace_member.id = p_workspace_member_id
  limit 1;

  if v_workspace_id is null then
    raise exception 'Workspace member not found'
      using errcode = '22023';
  end if;

  if not app_private.is_workspace_owner(v_workspace_id) then
    raise exception 'Only owners can change workspace memberships'
      using errcode = '42501';
  end if;

  if v_current_role = 'owner'
     and p_role <> 'owner'
     and app_private.workspace_owner_count(v_workspace_id) <= 1 then
    raise exception 'Cannot change the last owner role'
      using errcode = '22023';
  end if;

  update app_public.workspace_members
  set role = p_role
  where id = p_workspace_member_id;

  return query
  select p_workspace_member_id, v_workspace_id, p_role, v_target_auth_user_id;
end;
$function$;

revoke all on function app_public.update_workspace_member_role(uuid, text) from public;
grant execute on function app_public.update_workspace_member_role(uuid, text) to authenticated;

create or replace function app_public.remove_workspace_member(
  p_workspace_member_id uuid
)
returns table (
  workspace_member_id uuid,
  workspace_id uuid,
  auth_user_id uuid
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_workspace_id uuid;
  v_current_role text;
  v_target_auth_user_id uuid;
begin
  select
    workspace_member.workspace_id,
    workspace_member.role,
    workspace_member.auth_user_id
  into
    v_workspace_id,
    v_current_role,
    v_target_auth_user_id
  from app_public.workspace_members as workspace_member
  where workspace_member.id = p_workspace_member_id
  limit 1;

  if v_workspace_id is null then
    raise exception 'Workspace member not found'
      using errcode = '22023';
  end if;

  if not app_private.is_workspace_owner(v_workspace_id) then
    raise exception 'Only owners can change workspace memberships'
      using errcode = '42501';
  end if;

  if v_current_role = 'owner'
     and app_private.workspace_owner_count(v_workspace_id) <= 1 then
    raise exception 'Cannot remove the last owner'
      using errcode = '22023';
  end if;

  delete from app_public.workspace_members
  where id = p_workspace_member_id;

  return query
  select p_workspace_member_id, v_workspace_id, v_target_auth_user_id;
end;
$function$;

revoke all on function app_public.remove_workspace_member(uuid) from public;
grant execute on function app_public.remove_workspace_member(uuid) to authenticated;
