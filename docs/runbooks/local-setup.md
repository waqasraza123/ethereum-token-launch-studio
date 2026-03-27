# Local setup

## Required tools

- Node.js 22
- pnpm 10

## Install dependencies

    pnpm install

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

The contracts workspace should:

- compile cleanly
- run the sentinel contract test suite
- print local simulated signer addresses

## Run the database proof commands

    pnpm db:list
    pnpm db:validate
    pnpm db:replay:check

The database boundary should:

- list the migration files in sequence order
- validate migration naming, ordering, and non-empty content
- replay all migrations from zero into an embedded database
- prove the core workspaces, members, and projects schema exists

## Targeted verification

    pnpm db:list
    pnpm db:validate
    pnpm db:replay:check
    pnpm validate:foundation

## Full repo verification

    pnpm format:check
    pnpm lint
    pnpm typecheck
    pnpm test
    pnpm contracts:compile
    pnpm contracts:test
    pnpm db:validate
    pnpm db:replay:check
    pnpm build
    pnpm validate:foundation

## Current status

This repo now proves root tooling, web, worker, contracts, and replayable database schema scaffolding.

Auth wiring, protected admin behavior, and product-specific blockchain workflows are intentionally deferred to later commits.
