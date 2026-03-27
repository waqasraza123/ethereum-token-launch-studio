# Ethereum Token Launch Studio

Ethereum Token Launch Studio is a reusable token operations platform for Ethereum projects. The long-term product scope includes token deployment, sale rounds, allowlists, claims, vesting, treasury workflows, analytics, and operational tooling.

## Current scope

This repo currently includes:

- root monorepo tooling and CI
- a bootable Next.js web shell
- a bootable Node worker shell
- a bootable Hardhat 3 contracts workspace
- a replayable Supabase infra boundary
- a core Phase 2 business schema for workspaces, workspace members, and projects
- a server-side auth/data spine for sign-in, protected admin access, and first-workspace bootstrap
- shared TypeScript and ESLint tooling
- phase and architecture docs

This repo does not yet include RLS policies, invitations, contract registry tables, token product logic, sale logic, or app-side blockchain integration.

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
- Supabase SSR clients
- ESLint
- Prettier
- TypeScript

## Install

    pnpm install

## Run the web shell

    pnpm dev:web

## Run the worker shell

    pnpm dev:worker

## Database verification

    pnpm db:list
    pnpm db:validate
    pnpm db:replay:check

## Contracts verification

    pnpm --filter @token-launch-studio/contracts lint
    pnpm --filter @token-launch-studio/contracts typecheck
    pnpm contracts:compile
    pnpm contracts:test
    pnpm --filter @token-launch-studio/contracts accounts

## Web verification

    pnpm --filter @token-launch-studio/web lint
    pnpm --filter @token-launch-studio/web typecheck
    pnpm --filter @token-launch-studio/web test
    pnpm --filter @token-launch-studio/web build

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

- RLS and policies
- invitation flows
- contract registry tables
- wallet integration
- public launch flows
- token, sale, claim, and vesting product logic
