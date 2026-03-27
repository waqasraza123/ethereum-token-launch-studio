# Phase 1 foundation

## Goal

Create the clean monorepo root for a production grade Ethereum Token Launch Studio build.

## What this commit establishes

- root package metadata
- pnpm workspace registration
- turborepo task graph
- shared ESLint config
- shared TypeScript config
- root formatting config
- CI workflow
- environment template
- root documentation
- foundation verification scripts
- foundation smoke tests

## What is intentionally deferred

- apps/web
- apps/worker
- packages/contracts
- infra/supabase
- auth
- product schema
- blockchain integration
- runtime build scripts for app packages

## Acceptance criteria for this commit

- dependencies install cleanly
- formatting checks pass
- root lint passes
- shared TypeScript config resolves cleanly
- foundation tests pass
- foundation validation script passes
- CI workflow mirrors the local foundation checks

## Risks that remain

- runtime apps do not exist yet
- no contracts package exists yet
- no database infrastructure exists yet
- no auth or product data model exists yet
- no chain integration exists yet
