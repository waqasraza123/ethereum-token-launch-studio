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

test("supabase migration manifest is sequential and includes the token launch workflow migration", async () => {
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
      "0009_phase_3_project_token_launch_workflow.sql"
    ]
  );
});

test("token launch workflow migration defines request activity and worker functions", async () => {
  const manifest = await readSupabaseMigrationManifest();
  const workflowMigration = manifest[8];

  assert.match(
    workflowMigration.statementText,
    /create table if not exists app_public\.project_token_launch_requests/i
  );
  assert.match(
    workflowMigration.statementText,
    /create table if not exists app_public\.project_activities/i
  );
  assert.match(
    workflowMigration.statementText,
    /create or replace function app_public\.create_project_token_launch_request/i
  );
  assert.match(
    workflowMigration.statementText,
    /create or replace function app_public\.claim_next_project_token_launch_request/i
  );
  assert.match(
    workflowMigration.statementText,
    /create or replace function app_public\.mark_project_token_launch_request_succeeded/i
  );
});

test("authenticated actor can create a launch request and service role can claim and complete it", async () => {
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

    const createRequestResult = await database.query(`
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

    const claimResult = await database.query(`
      select *
      from app_public.claim_next_project_token_launch_request('worker-1')
    `);

    await database.query(`
      select app_public.mark_project_token_launch_request_started(
        '50000000-0000-0000-0000-000000000001',
        'worker-1'
      )
    `);

    await database.query(`
      select *
      from app_public.record_project_token_deployment(
        '40000000-0000-0000-0000-000000000001',
        'studio-core',
        'alpha-launch',
        11155111,
        '0x1111111111111111111111111111111111111111',
        'Alpha Token',
        'testnet',
        'https://sepolia.etherscan.io/address/0x1111111111111111111111111111111111111111',
        'Initial verified token deployment',
        'ProjectToken',
        'Alpha Token',
        'ALPHA',
        18,
        1000000000000000000000000,
        250000000000000000000000,
        '0x1111111111111111111111111111111111111111',
        '0x1111111111111111111111111111111111111111',
        null,
        '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        1234567,
        '0x1111111111111111111111111111111111111111',
        'etherscan',
        'https://sepolia.etherscan.io/address/0x1111111111111111111111111111111111111111#code',
        now()
      )
    `);

    await database.query(`
      select app_public.mark_project_token_launch_request_succeeded(
        '50000000-0000-0000-0000-000000000001',
        'worker-1',
        '40000000-0000-0000-0000-000000000001',
        '0x1111111111111111111111111111111111111111',
        '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        'https://sepolia.etherscan.io/address/0x1111111111111111111111111111111111111111#code'
      )
    `);

    assert.deepEqual(createRequestResult.rows[0], {
      project_id: "30000000-0000-0000-0000-000000000001",
      request_id: "50000000-0000-0000-0000-000000000001",
      status: "pending"
    });

    assert.deepEqual(claimResult.rows[0], {
      admin_address: "0x1111111111111111111111111111111111111111",
      cap: "1000000000000000000000000",
      initial_recipient: "0x1111111111111111111111111111111111111111",
      initial_supply: "250000000000000000000000",
      mint_authority: null,
      notes: "Initial launch request",
      project_id: "30000000-0000-0000-0000-000000000001",
      project_slug: "alpha-launch",
      registry_label: "Alpha Token",
      request_id: "50000000-0000-0000-0000-000000000001",
      token_name: "Alpha Token",
      token_symbol: "ALPHA",
      workspace_slug: "studio-core"
    });
  } finally {
    await resetReplaySession(database);
    await closeSupabaseReplayDatabase(database);
  }
});

test("authorized project members can see launch requests and activity while outsiders cannot", async () => {
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
