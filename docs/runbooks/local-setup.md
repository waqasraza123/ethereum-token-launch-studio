# Local setup

## Required tools

- Node.js 22
- pnpm 10

## Install dependencies

    pnpm install

## Configure environment

Copy .env.example into your local env file and provide real values for:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SEPOLIA_RPC_URL`
- `SEPOLIA_PRIVATE_KEY`
- `ETHERSCAN_API_KEY`

## Run the proof commands

    pnpm contracts:compile
    pnpm contracts:test
    pnpm db:list
    pnpm db:validate
    pnpm db:replay:check
    pnpm --filter @token-launch-studio/web lint
    pnpm --filter @token-launch-studio/web typecheck
    pnpm --filter @token-launch-studio/web test
    pnpm --filter @token-launch-studio/web build
    pnpm --filter @token-launch-studio/worker lint
    pnpm --filter @token-launch-studio/worker typecheck
    pnpm --filter @token-launch-studio/worker test
    pnpm --filter @token-launch-studio/worker build

## Runtime proof

Run both surfaces:

    pnpm dev:worker
    pnpm dev:web

Then open:

- `/dashboard/[workspaceSlug]/projects/[projectSlug]/token-launch`

This route should now show:

- live launch request updates
- project-scoped worker heartbeat and status
- a cancel button for `pending`, `claimed`, and `retry_scheduled` launches
- a retry button for terminal failed launches
- project activity entries for request creation, retry, recovery, and cancellation
