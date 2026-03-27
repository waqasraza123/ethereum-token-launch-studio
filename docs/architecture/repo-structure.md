# Repo structure

This repo is being built as a monorepo with clear boundaries from day one.

## Top-level directories

### `apps`

This directory holds runtime applications.

Current contents:

- `apps/web`
- `apps/worker`

The web app owns public and admin route surfaces.
The worker owns background runtime behavior and future jobs.

### `packages`

This directory holds isolated workspaces.

Current contents:

- `packages/contracts`

Contracts stay isolated from the web app and worker.

### `infra`

This directory holds infrastructure that is not an application package.

Current contents:

- `infra/supabase`

Migration files, Supabase config scaffolding, schema evolution, and migration replay validation belong here.

### `tooling`

This directory holds shared repo configuration.

Current contents:

- shared ESLint config
- shared TypeScript config

Application code does not belong here.

### `docs`

This directory holds architecture notes, phase tracking, and runbooks.

Current contents:

- architecture notes
- phase documentation
- local setup runbook

### `.github`

This directory holds CI workflow definitions.

## Workspace boundaries

### `apps/web`

This workspace owns:

- App Router routes
- layouts
- shared web components
- web-only route constants and metadata
- future auth, admin, and public launch UX

It does not own:

- Solidity contracts
- SQL migrations
- worker jobs

### `apps/worker`

This workspace owns:

- worker bootstrapping
- runtime lifecycle
- worker-side environment parsing
- future background jobs and operational processors

It does not own:

- web routing
- React UI
- contract source code

### `packages/contracts`

This workspace owns:

- Solidity source files
- Hardhat configuration
- contract tests
- contract-side scripts
- future deployment and verification flows

It does not own:

- web routing
- React UI
- application business tables
- Supabase migrations

### `infra/supabase`

This boundary owns:

- migration files
- migration manifest validation
- migration replay validation
- Supabase configuration scaffolding
- schema evolution for business entities
- future RLS, policies, functions, triggers, and database-side automation

It does not own:

- runtime web code
- worker runtime code
- contract source code

## Boundary rules

- do not place contracts inside the web app
- do not place SQL migrations inside the web app
- do not create shared runtime packages before there is a real reuse need
- do not introduce microservices
- do not introduce Docker in the foundation phase
- do not introduce product logic in root tooling files
- do not introduce token, sale, claim, or vesting logic in the contracts workspace before the dedicated contract phases
- do not introduce auth UI or route guards before the core business schema is proven
