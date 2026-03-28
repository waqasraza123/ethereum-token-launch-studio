# Phase 2 auth spine

## Goal

Wire the first production-grade auth and workspace bootstrap flow on top of the replayable core schema.

## What this step establishes

- public and server Supabase SSR client utilities
- Next.js `src/proxy.ts` auth-session refresh path
- server-side session validation for admin pages
- email/password sign-in through a server action
- first-workspace bootstrap through a database function
- service-role-backed workspace membership reads for the authenticated dashboard shell
- environment validation for the web app auth/data layer

## What is intentionally deferred

- sign-up
- invitations
- password reset
- route-level workspace and project flows beyond the bootstrap/dashboard entry points
- RLS policies
- contract registry and deployment persistence
- wallet integration

## Acceptance criteria for this step

- web lint, typecheck, test, and build pass
- migration manifest and replay checks pass
- the dashboard redirects unauthenticated users to sign-in
- the sign-in route posts to a real server auth action
- the dashboard shows first-workspace bootstrap when the user has no memberships
- the workspace bootstrap function is replayed and verified through tests

## Risks that remain

- real end-to-end auth still requires a configured Supabase project and a valid user
- RLS is not in place yet
- membership reads still rely on service-role-backed server code
- project creation and workspace-scoped routing are introduced in the next step
