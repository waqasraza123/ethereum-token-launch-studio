# Supabase infra boundary

This directory exists to lock the database infrastructure boundary before Phase 2 introduces the real business schema.

## Current contents

- `config.toml` for Supabase config scaffolding
- `migrations/0001_phase_1_baseline.sql` for the minimal baseline migration

## Current migration scope

The baseline migration is intentionally non-product.

It creates only schema boundaries:

- `app_public`
- `app_private`
- `app_audit`

It does not yet create:

- workspaces
- members
- projects
- roles
- contract registry tables
- activity tables
- storage buckets
- policies
- triggers
- functions

## Current proof commands

    pnpm db:list
    pnpm db:validate

## What is intentionally deferred

- local Supabase runtime workflows
- auth
- product tables
- RLS policies
- triggers and functions
- seed data
