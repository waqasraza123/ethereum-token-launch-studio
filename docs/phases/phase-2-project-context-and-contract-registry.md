# Phase 2 project context and contract registry

## Goal

Finish the protected project operator backbone, then add the first contract registry spine so projects can start tracking deployed token infrastructure.

## What this step establishes

- protected project settings route
- project editing through a role-aware database function
- project deletion through a role-aware database function
- project deletion safeguard when contracts are still attached
- first `app_public.project_contracts` registry table
- protected contract attachment flow tied to a project
- protected contract detachment flow tied to a project
- session-backed contract registry reads through RLS

## Assumptions

- `owner` and `ops_manager` can edit projects, delete projects, and manage attached contracts
- `finance_manager` and `viewer` can read but not mutate
- contract addresses are stored in normalized lowercase hex form
- contract registry is metadata-first in this step, not deployment automation yet

## What is intentionally deferred

- contract ABI storage
- contract verification state
- deployment automation from the contracts workspace into the registry
- indexer or event ingestion based on registered contracts
- contract edit flows beyond attach and detach

## Acceptance criteria for this step

- protected project settings route loads for authorized roles
- project updates persist and redirect into the protected project detail route
- project deletion is blocked while contract attachments exist
- contract attachment persists against the current project
- contract detachment unblocks project deletion
- replay tests prove update, attach, detach, delete, and contract visibility behavior

## Risks that remain

- contract registry does not yet store ABI or version metadata
- deployment scripts do not yet write into the registry
- downstream token-sale and claim modules do not yet consume contract registry rows
