# Phase 1 foundation

## Goal

Create the clean monorepo root plus the first four isolated repo boundaries for a production grade Ethereum Token Launch Studio build.

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
- a bootable Hardhat 3 contracts workspace
- root contract compile and contract test entry points
- a bootable Supabase infra boundary
- a minimal non-product baseline migration
- root migration list and migration validation entry points

## What is intentionally deferred

- Supabase auth wiring
- business schema
- project tables
- member tables
- role enforcement
- real token contract logic
- blockchain integration in the app
- protected admin behavior
- wallet integration
- runtime product modules
- local Supabase runtime workflows

## Acceptance criteria for this phase state

- dependencies install cleanly
- formatting checks pass
- root lint passes
- web lint passes
- worker lint passes
- contracts lint passes
- web typecheck passes
- worker typecheck passes
- contracts typecheck passes
- foundation tests pass
- migration manifest tests pass
- workspace validation script passes
- web build passes
- worker build passes
- `pnpm contracts:compile` passes
- `pnpm contracts:test` passes
- `pnpm db:list` prints the baseline migration
- `pnpm db:validate` passes
- `pnpm dev:web` boots the web shell
- `pnpm dev:worker` boots the worker shell
- `pnpm --filter @token-launch-studio/contracts accounts` prints local signer addresses
- CI mirrors the local checks

## Risks that remain

- no business tables exist yet
- no auth or product data model exists yet
- no chain integration exists yet
- no protected routes exist yet
- no deployable token product logic exists yet
- no local Supabase runtime proof exists yet
