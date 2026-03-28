# Local setup

## Required tools

- Node.js 22
- pnpm 10

## Install dependencies

    pnpm install

## Configure environment

Copy `.env.example` into your local env file and provide real values for:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SEPOLIA_RPC_URL`
- `SEPOLIA_PRIVATE_KEY`
- `ETHERSCAN_API_KEY`

## Run the database proof commands

    pnpm db:list
    pnpm db:validate
    pnpm db:replay:check

## Run the contracts proof commands

    pnpm contracts:compile
    pnpm contracts:test

## Deploy a real Sepolia token for an existing project

Prepare a deployment config file by copying:

- `packages/contracts/deployments/project-token.sepolia.example.json`

Then run:

    pnpm contracts:deploy:project-token -- --config packages/contracts/deployments/project-token.sepolia.example.json

The script should:

- deploy `ProjectToken` to Sepolia
- verify the contract on Etherscan
- write the verified deployment into `project_contracts`
- write token-specific metadata into `project_token_deployments`

## Validate the admin app surface

After a successful deployment, open:

- `/dashboard/[workspaceSlug]/projects/[projectSlug]/contracts`

The new token should appear there immediately with:

- generic contract registry data
- token name and symbol
- cap and initial supply
- deployment transaction hash
- deployer address
- verification link
