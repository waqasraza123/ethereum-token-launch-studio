create or replace function app_private.set_updated_at()
returns trigger
language plpgsql
as $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

create table if not exists app_public.workspaces (
  id uuid primary key,
  slug text not null unique,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workspaces_name_length_check check (char_length(name) between 1 and 120),
  constraint workspaces_slug_format_check check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table if not exists app_public.workspace_members (
  id uuid primary key,
  workspace_id uuid not null references app_public.workspaces(id) on delete cascade,
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workspace_members_role_check check (
    role in ('owner', 'ops_manager', 'finance_manager', 'viewer')
  ),
  constraint workspace_members_workspace_user_unique unique (workspace_id, auth_user_id)
);

create table if not exists app_public.projects (
  id uuid primary key,
  workspace_id uuid not null references app_public.workspaces(id) on delete cascade,
  slug text not null,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_name_length_check check (char_length(name) between 1 and 160),
  constraint projects_description_length_check check (
    description is null or char_length(description) <= 5000
  ),
  constraint projects_slug_format_check check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint projects_workspace_slug_unique unique (workspace_id, slug)
);

create index if not exists workspace_members_workspace_id_idx
  on app_public.workspace_members (workspace_id);

create index if not exists workspace_members_auth_user_id_idx
  on app_public.workspace_members (auth_user_id);

create index if not exists projects_workspace_id_idx
  on app_public.projects (workspace_id);

drop trigger if exists workspaces_set_updated_at on app_public.workspaces;
create trigger workspaces_set_updated_at
before update on app_public.workspaces
for each row
execute function app_private.set_updated_at();

drop trigger if exists workspace_members_set_updated_at on app_public.workspace_members;
create trigger workspace_members_set_updated_at
before update on app_public.workspace_members
for each row
execute function app_private.set_updated_at();

drop trigger if exists projects_set_updated_at on app_public.projects;
create trigger projects_set_updated_at
before update on app_public.projects
for each row
execute function app_private.set_updated_at();
