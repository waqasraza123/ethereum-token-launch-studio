# Phase 2 RLS and session reads

## Goal

Harden the protected admin data path so the main workspace and project reads no longer depend on the service-role client.

## What this step establishes

- row-level security on `app_public.workspaces`
- row-level security on `app_public.workspace_members`
- row-level security on `app_public.projects`
- session-backed server reads for workspace and project routes
- auth-aware database write functions that derive the actor from `auth.uid()`
- direct table write restrictions for authenticated users
- replay validation that proves authorized users only see their own workspace and project rows

## What is intentionally deferred

- RLS policies for future contract registry tables
- invitation flows
- project editing and deletion
- authenticated browser-side data fetching for admin modules
- public launch data policies

## Acceptance criteria for this step

- `pnpm db:list` shows migration `0005_phase_2_rls_and_session_reads.sql`
- `pnpm db:validate` passes
- `pnpm db:replay:check` passes
- replay tests prove policy creation, auth-aware function execution, and filtered reads
- the web app lint, typecheck, tests, and build remain green
- the protected dashboard routes read through the session client instead of the service-role client

## Risks that remain

- true runtime authorization still depends on a real Supabase project and valid session cookies
- write-path hardening still relies on database functions rather than full insert/update RLS policies
- future modules still need their own table grants and policies
