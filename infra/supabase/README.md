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
- `migrations/0007_phase_2_project_context_and_contract_registry.sql` for project editing deletion and generic contract attachment
- `migrations/0008_phase_3_project_token_deployment_bridge.sql` for verified project token deployment metadata and contracts-workspace registry writes

## Current migration scope

### `0008_phase_3_project_token_deployment_bridge.sql`

This migration adds the first contract-workspace-to-admin bridge:

- `app_public.project_token_deployments`
- token-specific verified deployment metadata
- select RLS policy for token deployment metadata
- `app_private.is_project_contract_visible(...)`
- `app_public.record_project_token_deployment(...)`
- service-role-only deployment recording into both `project_contracts` and `project_token_deployments`

## Current proof commands

    pnpm db:list
    pnpm db:validate
    pnpm db:replay:check

## What is intentionally deferred

- automatic ABI storage
- automated deployment verification status syncing
- indexer or event ingestion off registered contracts
- deployment rollback tooling
