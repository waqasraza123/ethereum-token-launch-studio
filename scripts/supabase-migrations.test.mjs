import assert from "node:assert/strict";
import test from "node:test";
import {
  readSupabaseMigrationManifest,
  validateSupabaseMigrationManifest
} from "./lib/supabase-migrations.mjs";
import {
  closeSupabaseReplayDatabase,
  replaySupabaseMigrations,
  resetReplaySession,
  setReplayAuthenticatedUser,
  setReplayServiceRole
} from "./lib/supabase-replay.mjs";

const firstUserId = "00000000-0000-0000-0000-000000000001";
const secondUserId = "00000000-0000-0000-0000-000000000002";
const thirdUserId = "00000000-0000-0000-0000-000000000003";

test("supabase migration manifest is sequential and includes the launch reliability migration", async () => {
  const manifest = await validateSupabaseMigrationManifest();

  assert.deepEqual(
    manifest.map((migration) => migration.filename),
    [
      "0001_phase_1_baseline.sql",
      "0002_phase_2_core_business_schema.sql",
      "0003_phase_2_auth_workspace_bootstrap.sql",
      "0004_phase_2_workspace_project_flows.sql",
      "0005_phase_2_rls_and_session_reads.sql",
      "0006_phase_2_membership_management.sql",
      "0007_phase_2_project_context_and_contract_registry.sql",
      "0008_phase_3_project_token_deployment_bridge.sql",
      "0009_phase_3_project_token_launch_workflow.sql",
      "0010_phase_3_project_token_launch_reliability.sql"
    ]
  );
});

test("launch reliability migration defines retry stale recovery heartbeat and manual retry functions", async () => {
  const manifest = await readSupabaseMigrationManifest();
  const reliabilityMigration = manifest[9];

  assert.match(
    reliabilityMigration.statementText,
    /create or replace function app_public\.touch_project_token_launch_request_heartbeat/i
  );
  assert.match(
    reliabilityMigration.statementText,
    /create or replace function app_public\.recover_stale_project_token_launch_requests/i
  );
  assert.match(
    reliabilityMigration.statementText,
    /create or replace function app_public\.retry_failed_project_token_launch_request/i
  );
  assert.match(
    reliabilityMigration.statementText,
    /project_token_launch_retry_scheduled/i
  );
});

test("failure schedules retry and terminal failure can be retried manually by an authorized operator", async () => {
  const { database } = await replaySupabaseMigrations();

  try {
    await database.exec(`
      insert into auth.users (id, email)
      values ('${firstUserId}', 'owner@example.com');
    `);

    await setReplayAuthenticatedUser(database, firstUserId);

    await database.query(`
      select *
      from app_public.bootstrap_workspace(
        '10000000-0000-0000-0000-000000000001',
        'studio-core',
        'Studio Core',
        '20000000-0000-0000-0000-000000000001'
      )
    `);

    await database.query(`
      select *
      from app_public.create_project(
        '30000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000001',
        'alpha-launch',
        'Alpha Launch',
        'Initial project'
      )
    `);

    await database.query(`
      select *
      from app_public.create_project_token_launch_request(
        '50000000-0000-0000-0000-000000000001',
        '30000000-0000-0000-0000-000000000001',
        'Alpha Token',
        'Alpha Token',
        'ALPHA',
        1000000000000000000000000,
        250000000000000000000000,
        '0x1111111111111111111111111111111111111111',
        '0x1111111111111111111111111111111111111111',
        null,
        'Initial launch request'
      )
    `);

    await setReplayServiceRole(database);

    await database.query(`
      select *
      from app_public.claim_next_project_token_launch_request('worker-1')
    `);

    await database.query(`
      select app_public.mark_project_token_launch_request_started(
        '50000000-0000-0000-0000-000000000001',
        'worker-1'
      )
    `);

    const firstFailure = await database.query(`
      select *
      from app_public.mark_project_token_launch_request_failed(
        '50000000-0000-0000-0000-000000000001',
        'worker-1',
        'First failure'
      )
    `);

    await database.query(`
      select app_public.override_project_token_launch_request_next_retry_at(
        '50000000-0000-0000-0000-000000000001',
        now() - interval '1 minute'
      )
    `);

    await database.query(`
      select *
      from app_public.claim_next_project_token_launch_request('worker-2')
    `);

    await database.query(`
      select app_public.mark_project_token_launch_request_started(
        '50000000-0000-0000-0000-000000000001',
        'worker-2'
      )
    `);

    await database.query(`
      select *
      from app_public.mark_project_token_launch_request_failed(
        '50000000-0000-0000-0000-000000000001',
        'worker-2',
        'Second failure'
      )
    `);

    await database.query(`
      select app_public.override_project_token_launch_request_next_retry_at(
        '50000000-0000-0000-0000-000000000001',
        now() - interval '1 minute'
      )
    `);

    await database.query(`
      select *
      from app_public.claim_next_project_token_launch_request('worker-3')
    `);

    await database.query(`
      select app_public.mark_project_token_launch_request_started(
        '50000000-0000-0000-0000-000000000001',
        'worker-3'
      )
    `);

    const terminalFailure = await database.query(`
      select *
      from app_public.mark_project_token_launch_request_failed(
        '50000000-0000-0000-0000-000000000001',
        'worker-3',
        'Third failure'
      )
    `);

    await setReplayAuthenticatedUser(database, firstUserId);

    const retryResult = await database.query(`
      select *
      from app_public.retry_failed_project_token_launch_request(
        '50000000-0000-0000-0000-000000000001'
      )
    `);

    assert.deepEqual(firstFailure.rows[0], {
      next_retry_at: firstFailure.rows[0].next_retry_at,
      retry_count: 1,
      status: "retry_scheduled"
    });

    assert.deepEqual(terminalFailure.rows[0], {
      next_retry_at: null,
      retry_count: 3,
      status: "failed"
    });

    assert.deepEqual(retryResult.rows[0], {
      project_id: "30000000-0000-0000-0000-000000000001",
      request_id: "50000000-0000-0000-0000-000000000001",
      status: "pending"
    });
  } finally {
    await resetReplaySession(database);
    await closeSupabaseReplayDatabase(database);
  }
});

test("stale claimed or deploying requests are recovered and rescheduled or failed", async () => {
  const { database } = await replaySupabaseMigrations();

  try {
    await database.exec(`
      insert into auth.users (id, email)
      values ('${firstUserId}', 'owner@example.com');
    `);

    await setReplayAuthenticatedUser(database, firstUserId);

    await database.query(`
      select *
      from app_public.bootstrap_workspace(
        '10000000-0000-0000-0000-000000000001',
        'studio-core',
        'Studio Core',
        '20000000-0000-0000-0000-000000000001'
      )
    `);

    await database.query(`
      select *
      from app_public.create_project(
        '30000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000001',
        'alpha-launch',
        'Alpha Launch',
        'Initial project'
      )
    `);

    await database.query(`
      select *
      from app_public.create_project_token_launch_request(
        '50000000-0000-0000-0000-000000000001',
        '30000000-0000-0000-0000-000000000001',
        'Alpha Token',
        'Alpha Token',
        'ALPHA',
        1000000000000000000000000,
        250000000000000000000000,
        '0x1111111111111111111111111111111111111111',
        '0x1111111111111111111111111111111111111111',
        null,
        'Initial launch request'
      )
    `);

    await setReplayServiceRole(database);

    await database.query(`
      select *
      from app_public.claim_next_project_token_launch_request('worker-stale')
    `);

    await database.query(`
      select app_public.override_project_token_launch_request_heartbeat_at(
        '50000000-0000-0000-0000-000000000001',
        now() - interval '40 minutes'
      )
    `);

    const recoveryResult = await database.query(`
      select *
      from app_public.recover_stale_project_token_launch_requests(
        'worker-recovery',
        now() - interval '30 minutes'
      )
    `);

    assert.deepEqual(recoveryResult.rows[0], {
      next_retry_at: recoveryResult.rows[0].next_retry_at,
      request_id: "50000000-0000-0000-0000-000000000001",
      retry_count: 1,
      status: "retry_scheduled"
    });
  } finally {
    await resetReplaySession(database);
    await closeSupabaseReplayDatabase(database);
  }
});

test("authorized project members can see retry state and activity while outsiders cannot", async () => {
  const { database } = await replaySupabaseMigrations();

  try {
    await database.exec(`
      insert into auth.users (id, email)
      values
        ('${firstUserId}', 'owner@example.com'),
        ('${secondUserId}', 'viewer@example.com'),
        ('${thirdUserId}', 'outsider@example.com');
    `);

    await setReplayAuthenticatedUser(database, firstUserId);

    await database.query(`
      select *
      from app_public.bootstrap_workspace(
        '10000000-0000-0000-0000-000000000001',
        'studio-core',
        'Studio Core',
        '20000000-0000-0000-0000-000000000001'
      )
    `);

    await database.query(`
      select *
      from app_public.create_project(
        '30000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000001',
        'alpha-launch',
        'Alpha Launch',
        'Initial project'
      )
    `);

    await database.query(`
      select *
      from app_public.invite_workspace_member(
        '10000000-0000-0000-0000-000000000001',
        '20000000-0000-0000-0000-000000000002',
        'viewer@example.com',
        'viewer'
      )
    `);

    await database.query(`
      select *
      from app_public.create_project_token_launch_request(
        '50000000-0000-0000-0000-000000000001',
        '30000000-0000-0000-0000-000000000001',
        'Alpha Token',
        'Alpha Token',
        'ALPHA',
        1000000000000000000000000,
        250000000000000000000000,
        '0x1111111111111111111111111111111111111111',
        '0x1111111111111111111111111111111111111111',
        null,
        'Initial launch request'
      )
    `);

    await setReplayAuthenticatedUser(database, secondUserId);

    const viewerCounts = await database.query(`
      select
        (select count(*)::int from app_public.project_token_launch_requests) as launch_request_count,
        (select count(*)::int from app_public.project_activities) as activity_count
    `);

    await setReplayAuthenticatedUser(database, thirdUserId);

    const outsiderCounts = await database.query(`
      select
        (select count(*)::int from app_public.project_token_launch_requests) as launch_request_count,
        (select count(*)::int from app_public.project_activities) as activity_count
    `);

    assert.deepEqual(viewerCounts.rows[0], {
      activity_count: 1,
      launch_request_count: 1
    });

    assert.deepEqual(outsiderCounts.rows[0], {
      activity_count: 0,
      launch_request_count: 0
    });
  } finally {
    await resetReplaySession(database);
    await closeSupabaseReplayDatabase(database);
  }
});
