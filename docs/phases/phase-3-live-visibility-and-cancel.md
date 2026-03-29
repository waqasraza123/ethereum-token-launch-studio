# Phase 3 live visibility and cancel

## Goal

Add live operator visibility and safe operator cancellation to the first worker-driven token launch workflow.

## What this step establishes

- Supabase Realtime refreshes for launch requests and project activity
- project-scoped worker heartbeat and status panel
- protected cancel action for pending, claimed, and retry-scheduled launches
- worker-side cancellation awareness before deployment starts
- normalized cancellation activity in the project feed

## What is intentionally deferred

- live streaming of deployment stdout and stderr
- cancellation of already-deploying Hardhat processes
- global worker fleet dashboard
- realtime push updates on non-launch pages

## Acceptance criteria

- the protected token launch page refreshes live when launch rows or activity rows change
- worker heartbeat details are visible for project-scoped launch activity
- authorized operators can cancel pending, claimed, or retry-scheduled launches
- cancelled claimed launches do not get marked failed when the worker attempts to start them
- cancellation appears in the normalized project activity feed
