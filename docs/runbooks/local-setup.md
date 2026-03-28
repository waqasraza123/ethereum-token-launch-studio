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

The authenticated dashboard and workspace/project flows remain unproven until those values exist and your Supabase project contains at least one email/password auth user.

## Run the web shell

    pnpm dev:web

The web shell should render:

- `/`
- `/sign-in`
- `/dashboard`

With real auth data configured, the protected route flow should behave like this:

- `/dashboard` redirects unauthenticated users to `/sign-in`
- authenticated users with no memberships see workspace bootstrap
- authenticated users with one workspace redirect into `/dashboard/[workspaceSlug]`
- authenticated users with multiple workspaces see a workspace selector
- project creation happens at `/dashboard/[workspaceSlug]/projects/new`
- project detail reads happen at `/dashboard/[workspaceSlug]/projects/[projectSlug]`

## Run the worker shell

    pnpm dev:worker

The worker should log a `worker.shell.ready` message and stay alive until you stop it.

## Run the contracts workspace proof commands

    pnpm contracts:compile
    pnpm contracts:test
    pnpm --filter @token-launch-studio/contracts accounts

## Run the database proof commands

    pnpm db:list
    pnpm db:validate
    pnpm db:replay:check

The database boundary should:

- list the migration files in sequence order
- validate migration naming, ordering, and non-empty content
- replay all migrations from zero into an embedded database
- prove the workspace bootstrap and project creation functions exist and work

## Run the web proof commands

    pnpm --filter @token-launch-studio/web lint
    pnpm --filter @token-launch-studio/web typecheck
    pnpm --filter @token-launch-studio/web test
    pnpm --filter @token-launch-studio/web build

## Current status

This repo now proves root tooling, web, worker, contracts, replayable database schema, auth spine, and the first protected workspace/project route structure.

True end-to-end runtime behavior still depends on real Supabase credentials and seeded auth users.
