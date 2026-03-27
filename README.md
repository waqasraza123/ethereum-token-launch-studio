# Ethereum Token Launch Studio

Ethereum Token Launch Studio is a reusable token operations platform for Ethereum projects. The long term product scope includes token deployment, sale rounds, allowlists, claims, vesting, treasury workflows, analytics, and operational tooling.

## Current scope

This repo currently includes:

- root monorepo tooling and CI
- a bootable Next.js web shell
- a bootable Node worker shell
- a bootable Hardhat 3 contracts workspace
- a bootable Supabase infra boundary with replayable migrations
- a core Phase 2 business schema for workspaces, workspace members, and projects
- shared TypeScript and ESLint tooling
- phase and architecture docs

This repo does not yet include auth wiring, RLS policies, contract registry tables, token product logic, sale logic, or app-side blockchain integration.

## Top-level structure

- `apps/web` for the public and admin web surface
- `apps/worker` for future background jobs and operational processing
- `packages/contracts` for Solidity contracts, tests, and contract-side scripts
- `infra/supabase` for migration files and Supabase infrastructure scaffolding
- `tooling` for shared linting and TypeScript config
- `docs` for architecture notes, phase specs, and runbooks

## Toolchain

- Node.js 22
- pnpm workspaces
- turborepo
- Next.js App Router
- Hardhat 3
- ESLint
- Prettier
- TypeScript

## Install

    pnpm install

## Run the web shell

    pnpm dev:web

## Run the worker shell

    pnpm dev:worker

## Contracts verification

    pnpm --filter @token-launch-studio/contracts lint
    pnpm --filter @token-launch-studio/contracts typecheck
    pnpm contracts:compile
    pnpm contracts:test
    pnpm --filter @token-launch-studio/contracts accounts

## Database verification

    pnpm db:list
    pnpm db:validate
    pnpm db:replay:check

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

## What is intentionally deferred

- Supabase auth wiring
- RLS and policies
- invitation flows
- contract registry tables
- wallet integration
- protected admin behavior
- token, sale, claim, and vesting product logic
