# Phase 3 token launch reliability

## Goal

Harden the first operator workflow so token launches can recover from transient failures and stale worker states.

## What this step establishes

- bounded retry rules with backoff
- launch request heartbeat updates during deployment execution
- stale job detection and recovery
- operator visible failure details and retry state
- protected manual retry action for terminal failed launches
- normalized activity for retry scheduling, stale recovery, and manual retry

## What is intentionally deferred

- live browser updates
- cancellation of active launches
- multi worker lease extension metrics
- operator override of retry policy
- generalized retry framework for all future workflows

## Acceptance criteria

- launch request failure schedules retries until the final terminal failure
- stale claimed or deploying jobs are recovered automatically
- failed launches can be retried without re entering token parameters
- retry state and failure details are visible on the project token launch page
- retry and recovery activity appears in the normalized project feed
