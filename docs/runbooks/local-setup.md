# Local setup

## Required tools

- Node.js 22
- pnpm 10

## Install dependencies

    pnpm install

## Run the current verification checks

    pnpm format:check
    pnpm lint
    pnpm typecheck
    pnpm test
    pnpm validate:foundation

## Current status

This commit verifies the repo foundation only.

The web app, worker, contracts workspace, and database infrastructure are intentionally deferred to later commits.
