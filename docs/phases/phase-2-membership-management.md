# Phase 2 membership management

## Goal

Add the first multi-user workspace management flow on top of the authenticated and RLS-backed admin surface.

## What this step establishes

- a protected workspace members route
- current workspace member listing
- owner-only member invite flow for existing auth users by email
- owner-only role updates
- owner-only member removal
- last-owner safeguards for role changes and removals
- replay validation that proves workspace visibility changes when memberships change

## Assumptions

- invited users already exist in Supabase Auth
- email delivery for not-yet-registered users is intentionally deferred
- only owners can change memberships
- all current members can view the workspace member list

## What is intentionally deferred

- email invitation delivery
- tokenized invite acceptance
- pending invitation records
- self-removal UI
- workspace transfer flows
- audit logging for membership changes

## Acceptance criteria for this step

- the protected members route loads for authorized workspace members
- only owners see invite, role update, and removal controls
- inviting an existing auth user adds them to the workspace
- updating a member role persists through the database function
- removing a member updates workspace visibility for that user
- replay tests prove last-owner safeguards and membership visibility changes

## Risks that remain

- real invite delivery is not implemented yet
- membership changes are not yet written into an audit trail
- future modules still need to react to role changes explicitly
