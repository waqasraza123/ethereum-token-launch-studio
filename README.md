# Ethereum Token Launch Studio

Ethereum Token Launch Studio is a reusable token operations platform for Ethereum projects. The long term product scope includes token deployment, sale rounds, allowlists, claims, vesting, treasury workflows, analytics, and operational tooling.

## Current scope

This repo currently includes:

- root monorepo tooling and CI
- a bootable Next.js web shell
- a bootable Node worker shell
- shared TypeScript and ESLint tooling
- phase and architecture docs

This repo does not yet include contracts, database infrastructure, auth, project data, or blockchain business logic.

## Top level structure

- `apps/web` for the public and admin web surface
- `apps/worker` for future background jobs and operational processing
- `packages` for isolated workspaces such as Solidity contracts
- `infra` for database and infrastructure assets
- `tooling` for shared linting and TypeScript config
- `docs` for architecture notes, phase specs, and runbooks

## Toolchain

- Node.js 22
- pnpm workspaces
- turborepo
- Next.js App Router
- ESLint
- Prettier
- TypeScript

## Install

    pnpm install

## Run the web shell

    pnpm dev:web

## Run the worker shell

    pnpm dev:worker

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

## What is intentionally deferred

- contracts workspace
- Supabase infrastructure
- auth
- product data model
- blockchain logic
- wallet integration
- protected admin behavior
