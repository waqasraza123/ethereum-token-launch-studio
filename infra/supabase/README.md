# Supabase infra boundary

This directory exists to lock the database infrastructure boundary before app-side auth and business workflows are wired.

## Current contents

- `config.toml` for Supabase config scaffolding
- `migrations/0001_phase_1_baseline.sql` for the minimal boundary setup
- `migrations/0002_phase_2_core_business_schema.sql` for the first real business schema
- `migrations/0003_phase_2_auth_workspace_bootstrap.sql` for the first authenticated bootstrap write
- `migrations/0004_phase_2_workspace_project_flows.sql` for workspace-aware project creation

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
- indexes and constraints for slugs, roles, and relationships

### `0003_phase_2_auth_workspace_bootstrap.sql`

Creates the first real auth-aware write function:

- `app_public.bootstrap_workspace(...)`
- atomic workspace plus owner-membership creation

### `0004_phase_2_workspace_project_flows.sql`

Creates the first role-aware project write function:

- `app_public.create_project(...)`
- membership validation by actor auth user id
- role enforcement for project creation
- atomic project insertion inside the authorized workspace

## Current proof commands

    pnpm db:list
    pnpm db:validate
    pnpm db:replay:check

## What is intentionally deferred

- local Supabase runtime workflows
- RLS policies
- invitations
- contract registry tables
- activity tables
- seed data
