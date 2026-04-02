# Ethereum Token Launch Studio

> [!WARNING]
> This repository is deprecated and has been archived. It is no longer maintained or accepting updates.

Ethereum Token Launch Studio is a reusable token operations platform for Ethereum projects. The long-term product scope includes token deployment, sale rounds, allowlists, claims, vesting, treasury workflows, analytics, and operational tooling.

## Current scope

This repo currently includes:

- root monorepo tooling and CI
- a bootable Next.js web shell
- a bootable Node worker shell
- a bootable Hardhat 3 contracts workspace
- a replayable Supabase infra boundary
- protected workspace and project routes
- owner-aware workspace membership management
- project contract registry
- verified Sepolia token deployment bridge
- worker-driven token launch workflow
- retry, recovery, live visibility, and cancellation for token launches

## Install

    pnpm install

## Verification

    pnpm contracts:compile
    pnpm contracts:test
    pnpm db:list
    pnpm db:validate
    pnpm db:replay:check
    pnpm lint
    pnpm typecheck
    pnpm test
    pnpm build
