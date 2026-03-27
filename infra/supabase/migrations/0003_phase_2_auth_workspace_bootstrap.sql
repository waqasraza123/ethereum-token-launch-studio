create or replace function app_public.bootstrap_workspace(
  p_workspace_id uuid,
  p_workspace_slug text,
  p_workspace_name text,
  p_owner_membership_id uuid,
  p_owner_auth_user_id uuid
)
returns table (
  workspace_id uuid,
  workspace_member_id uuid
)
language plpgsql
security definer
set search_path = ''
as $function$
begin
  insert into app_public.workspaces (id, slug, name)
  values (p_workspace_id, p_workspace_slug, p_workspace_name);

  insert into app_public.workspace_members (id, workspace_id, auth_user_id, role)
  values (p_owner_membership_id, p_workspace_id, p_owner_auth_user_id, 'owner');

  return query
  select p_workspace_id, p_owner_membership_id;
end;
$function$;
