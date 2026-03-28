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
- a server-side auth/data spine for sign-in and workspace bootstrap
- protected workspace/project routes
- database-side authorization hardening and session-backed admin reads
- shared TypeScript and ESLint tooling
- phase and architecture docs

This repo does not yet include invitation flows, contract registry tables, token product logic, sale logic, or app-side blockchain integration.

## Install

    pnpm install

## Database verification

    pnpm db:list
    pnpm db:validate
    pnpm db:replay:check

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
