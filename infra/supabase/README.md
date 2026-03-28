# Supabase infra boundary

This directory exists to lock the database infrastructure boundary before app-side auth and business workflows are wired.

## Current contents

- `config.toml` for Supabase config scaffolding
- `migrations/0001_phase_1_baseline.sql` for the minimal boundary setup
- `migrations/0002_phase_2_core_business_schema.sql` for the first real business schema
- `migrations/0003_phase_2_auth_workspace_bootstrap.sql` for authenticated workspace bootstrap
- `migrations/0004_phase_2_workspace_project_flows.sql` for role-aware project creation
- `migrations/0005_phase_2_rls_and_session_reads.sql` for RLS hardening and session-backed reads
- `migrations/0006_phase_2_membership_management.sql` for member listing and owner-only membership changes

## Current migration scope

### `0001_phase_1_baseline.sql`
Creates only schema boundaries:

- `app_public`
- `app_private`
- `app_audit`

### `0002_phase_2_core_business_schema.sql`
Creates the first business tables and database-side support behavior:

- `app_public.workspaces`
- `app_public.workspace_members`
- `app_public.projects`
- `app_private.set_updated_at()` trigger function
- `updated_at` triggers on all three core tables

### `0003_phase_2_auth_workspace_bootstrap.sql`
Creates the authenticated workspace bootstrap function.

### `0004_phase_2_workspace_project_flows.sql`
Creates the role-aware project creation function.

### `0005_phase_2_rls_and_session_reads.sql`
Hardens the protected admin data surface with RLS and session-backed reads.

### `0006_phase_2_membership_management.sql`
Adds the first multi-user workspace management layer:

- `app_public.list_workspace_members(...)`
- `app_public.invite_workspace_member(...)`
- `app_public.update_workspace_member_role(...)`
- `app_public.remove_workspace_member(...)`
- helper functions for owner checks, owner counts, and email-to-auth-user resolution

## Current proof commands

```bash
pnpm db:list
pnpm db:validate
pnpm db:replay:check
```

## What is intentionally deferred

- local Supabase runtime workflows
- invite email delivery for users who do not yet exist in Auth
- contract registry tables
- activity tables
- seed data
