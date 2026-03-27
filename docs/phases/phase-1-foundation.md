# Phase 1 foundation

## Goal

Create the clean monorepo root and runtime shells for a production grade Ethereum Token Launch Studio build.

## What this phase now establishes

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
- a bootable Next.js web shell
- a bootable Node worker shell

## What is intentionally deferred

- `packages/contracts`
- `infra/supabase`
- auth
- product schema
- blockchain integration
- protected admin behavior
- wallet integration
- runtime product modules

## Acceptance criteria for this phase state

- dependencies install cleanly
- formatting checks pass
- root lint passes
- web lint passes
- worker lint passes
- web typecheck passes
- worker typecheck passes
- foundation tests pass
- workspace validation script passes
- web build passes
- worker build passes
- `pnpm dev:web` boots the web shell
- `pnpm dev:worker` boots the worker shell
- CI mirrors the local checks

## Risks that remain

- no contracts package exists yet
- no database infrastructure exists yet
- no auth or product data model exists yet
- no chain integration exists yet
- no protected routes exist yet
