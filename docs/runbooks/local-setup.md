# Local setup

## Required tools

- Node.js 22
- pnpm 10

## Install dependencies

    pnpm install

## Configure auth environment

Copy `.env.example` into your local env file and provide real Supabase values for:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

The protected admin surface now reads through the authenticated session client, so real runtime proof still depends on valid session cookies and a real Supabase project.

## Run the web shell

    pnpm dev:web

With real auth data configured, the protected route flow should behave like this:

- `/dashboard` redirects unauthenticated users to `/sign-in`
- authenticated users with no memberships see workspace bootstrap
- authenticated users with one workspace redirect into `/dashboard/[workspaceSlug]`
- authenticated users with multiple workspaces see a workspace selector
- workspace and project reads only return rows authorized by the user’s memberships

## Run the database proof commands

    pnpm db:list
    pnpm db:validate
    pnpm db:replay:check

The database boundary should:

- list the migration files in sequence order
- validate migration naming, ordering, and non-empty content
- replay all migrations from zero into an embedded database
- prove the protected reads are filtered by membership-aware RLS

## Run the web proof commands

    pnpm --filter @token-launch-studio/web lint
    pnpm --filter @token-launch-studio/web typecheck
    pnpm --filter @token-launch-studio/web test
    pnpm --filter @token-launch-studio/web build

## Current status

This repo now proves root tooling, web, worker, contracts, replayable schema evolution, protected session-backed admin reads, and database-side authorization hardening for the first workspace/project surfaces.
