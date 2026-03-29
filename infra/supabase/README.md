# Supabase infra boundary

## Current contents

- `migrations/0008_phase_3_project_token_deployment_bridge.sql`
- `migrations/0009_phase_3_project_token_launch_workflow.sql`
- `migrations/0010_phase_3_project_token_launch_reliability.sql`
- `migrations/0011_phase_3_token_launch_live_visibility_and_cancel.sql`

## Current migration scope

### `0011_phase_3_token_launch_live_visibility_and_cancel.sql`

This migration adds live operator visibility and safe cancellation:

- launch request status includes `cancelled`
- project activity includes `project_token_launch_cancelled`
- project token launch requests can be cancelled by authorized operators while still not running
- worker start logic returns a cancellable start outcome so cancelled claimed launches do not become failures
