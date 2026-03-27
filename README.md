# Ethereum Token Launch Studio

Ethereum Token Launch Studio is a reusable token operations platform for Ethereum projects. The long term product scope includes token deployment, sale rounds, allowlists, claims, vesting, treasury workflows, analytics, and operational tooling. This commit creates the root repo foundation only.

## Current scope

This commit locks the monorepo foundation, shared tooling, CI, and documentation boundaries. It does not yet add the web app, worker, contracts workspace, or database infrastructure.

## Planned top level structure

- apps for runtime applications such as the web app and worker
- packages for isolated workspaces such as Solidity contracts
- infra for database and deployment infrastructure
- tooling for shared linting and TypeScript configuration
- docs for architecture notes, phase specs, and runbooks
- .github for CI workflows

## Toolchain

- Node.js 22
- pnpm workspaces
- turborepo
- ESLint
- Prettier
- TypeScript

## Install

    pnpm install

## Foundation verification

    pnpm format:check
    pnpm lint
    pnpm typecheck
    pnpm test
    pnpm validate:foundation

## What is intentionally deferred

- web app shell
- worker shell
- contracts workspace
- Supabase infrastructure
- auth
- product data model
- blockchain logic
