# Repo structure

This repo is being built as a monorepo with clear boundaries from day one.

## Top level directories

### apps

This directory will hold runtime applications.

Planned contents:

- apps/web
- apps/worker

Nothing outside runtime applications belongs here.

### packages

This directory will hold reusable or isolated workspaces.

Planned contents:

- packages/contracts

Contracts stay isolated from the web app and worker.

### infra

This directory will hold infrastructure that is not an application package.

Planned contents:

- infra/supabase

SQL migrations, database configuration, and infrastructure specific assets belong here.

### tooling

This directory holds shared repo configuration.

Current contents:

- shared ESLint config
- shared TypeScript config

Application code does not belong here.

### docs

This directory holds architecture notes, phase tracking, and runbooks.

Current contents:

- architecture notes
- phase documentation
- local setup runbook

### .github

This directory holds CI workflow definitions.

## Boundary rules

- do not place contracts inside the web app
- do not place SQL migrations inside the web app
- do not create shared runtime packages before there is a real reuse need
- do not introduce microservices
- do not introduce Docker in the foundation phase
- do not introduce product logic in root tooling files
