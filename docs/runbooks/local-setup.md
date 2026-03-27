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

The authenticated dashboard flow remains unproven until those values exist and your Supabase project contains at least one email/password auth user.

## Run the web shell

    pnpm dev:web

The web shell should render:

- `/`
- `/sign-in`
- `/dashboard`

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
- prove the workspace bootstrap function exists and works

## Run the web auth/data proof commands

    pnpm --filter @token-launch-studio/web lint
    pnpm --filter @token-launch-studio/web typecheck
    pnpm --filter @token-launch-studio/web test
    pnpm --filter @token-launch-studio/web build

## Current status

This repo now proves root tooling, web, worker, contracts, replayable database schema, and the first server-side auth/data spine.

Real sign-in and dashboard membership reads still depend on valid runtime Supabase environment values.
