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

## Run the infra boundary proof commands

    pnpm db:list
    pnpm db:validate

The infra boundary should:

- list the migration files in sequence order
- validate migration naming, ordering, and non-empty content
- keep the baseline migration non-product

## Targeted verification

    pnpm db:list
    pnpm db:validate
    pnpm validate:foundation

## Full repo verification

    pnpm format:check
    pnpm lint
    pnpm typecheck
    pnpm test
    pnpm contracts:compile
    pnpm contracts:test
    pnpm db:validate
    pnpm build
    pnpm validate:foundation

## Current status

This phase now proves repo tooling plus web, worker, contracts, and infra boundary scaffolding only.

Business schema, auth, and blockchain product logic are intentionally deferred to later commits.
