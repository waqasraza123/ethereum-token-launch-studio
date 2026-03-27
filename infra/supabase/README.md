# Supabase infra boundary

This directory exists to lock the database infrastructure boundary before app-side auth and business workflows are wired.

## Current contents

- `config.toml` for Supabase config scaffolding
- `migrations/0001_phase_1_baseline.sql` for the minimal boundary setup
- `migrations/0002_phase_2_core_business_schema.sql` for the first real business schema

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

## Current proof commands

    pnpm db:list
    pnpm db:validate
    pnpm db:replay:check

## What is intentionally deferred

- local Supabase runtime workflows
- auth wiring
- RLS policies
- invitation flows
- contract registry tables
- activity tables
- triggers or functions beyond shared timestamp handling
- seed data
