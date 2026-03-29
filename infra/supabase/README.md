# Supabase infra boundary

## Current contents

- migrations/0008_phase_3_project_token_deployment_bridge.sql
- migrations/0009_phase_3_project_token_launch_workflow.sql
- migrations/0010_phase_3_project_token_launch_reliability.sql

## Current migration scope

### 0010_phase_3_project_token_launch_reliability.sql

This migration hardens the first operator workflow:

- retry counters and max attempt policy
- next retry scheduling
- worker heartbeat tracking
- stale launch recovery
- manual retry for failed launches
- additional normalized activity kinds for retry and recovery
