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

## Targeted verification

    pnpm --filter @token-launch-studio/web lint
    pnpm --filter @token-launch-studio/web typecheck
    pnpm --filter @token-launch-studio/web test
    pnpm --filter @token-launch-studio/web build
    pnpm --filter @token-launch-studio/worker lint
    pnpm --filter @token-launch-studio/worker typecheck
    pnpm --filter @token-launch-studio/worker test
    pnpm --filter @token-launch-studio/worker build
    pnpm validate:foundation

## Full repo verification

    pnpm format:check
    pnpm lint
    pnpm typecheck
    pnpm test
    pnpm build
    pnpm validate:foundation

## Current status

This phase now proves repo tooling plus runtime shell boundaries only.

Contracts, database infrastructure, auth, and blockchain product logic are intentionally deferred to later commits.
