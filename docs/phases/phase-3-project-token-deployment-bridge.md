# Phase 3 project token deployment bridge

## Goal

Bridge the contracts workspace into the project contract registry so verified Sepolia token deployments become visible in the admin app immediately after deployment.

## What this step establishes

- first real `ProjectToken.sol` contract in `packages/contracts`
- Sepolia deployment script with config-file input
- programmatic contract verification before persistence
- service-role-backed deployment recording into `project_contracts`
- first token-specific deployment metadata model in `project_token_deployments`
- project contract registry UI enriched with token deployment metadata

## Assumptions

- this step is Sepolia-first
- verified deployments are the only records written by the deployment bridge
- generic non-token contract attachment still exists for other contract kinds

## What is intentionally deferred

- ABI storage
- artifact hash storage
- deployment rollback tooling
- automatic explorer polling
- automatic deployment writes for sales claims vesting and Safe contracts

## Acceptance criteria for this step

- `pnpm contracts:compile` passes
- `pnpm contracts:test` passes
- `pnpm db:list` shows migration `0008_phase_3_project_token_deployment_bridge.sql`
- `pnpm db:validate` passes
- `pnpm db:replay:check` passes
- the deployment script can deploy verify and persist a token record for an existing project
- the project contracts page can show token-specific deployment metadata

## Risks that remain

- runtime deployment still depends on real Sepolia RPC private key and Etherscan API access
- deployment persistence currently targets token deployments only
- contract registry rows still do not carry ABI or version metadata
