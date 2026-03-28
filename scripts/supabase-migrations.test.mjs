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

test("supabase migration manifest is sequential and includes the token deployment bridge migration", async () => {
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
      "0008_phase_3_project_token_deployment_bridge.sql"
    ]
  );
});

test("token deployment bridge migration defines the metadata table and service write function", async () => {
  const manifest = await readSupabaseMigrationManifest();
  const tokenDeploymentBridgeMigration = manifest[7];

  assert.match(
    tokenDeploymentBridgeMigration.statementText,
    /create table if not exists app_public\.project_token_deployments/i
  );
  assert.match(
    tokenDeploymentBridgeMigration.statementText,
    /create or replace function app_public\.record_project_token_deployment/i
  );
  assert.match(
    tokenDeploymentBridgeMigration.statementText,
    /grant execute on function app_public\.record_project_token_deployment/i
  );
});

test("service role can record a verified project token deployment into the registry", async () => {
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

    await setReplayServiceRole(database);

    const registryResult = await database.query(`
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

    assert.deepEqual(registryResult.rows[0], {
      address: "0x1111111111111111111111111111111111111111",
      project_contract_id: "40000000-0000-0000-0000-000000000001",
      project_id: "30000000-0000-0000-0000-000000000001"
    });
  } finally {
    await resetReplaySession(database);
    await closeSupabaseReplayDatabase(database);
  }
});

test("authorized workspace members can see recorded token deployment metadata while outsiders cannot", async () => {
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

    await setReplayServiceRole(database);

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

    await setReplayAuthenticatedUser(database, secondUserId);

    const viewerVisibleCounts = await database.query(`
      select
        (select count(*)::int from app_public.project_contracts) as project_contract_count,
        (select count(*)::int from app_public.project_token_deployments) as project_token_deployment_count
    `);

    await setReplayAuthenticatedUser(database, thirdUserId);

    const outsiderVisibleCounts = await database.query(`
      select
        (select count(*)::int from app_public.project_contracts) as project_contract_count,
        (select count(*)::int from app_public.project_token_deployments) as project_token_deployment_count
    `);

    assert.deepEqual(viewerVisibleCounts.rows[0], {
      project_contract_count: 1,
      project_token_deployment_count: 1
    });

    assert.deepEqual(outsiderVisibleCounts.rows[0], {
      project_contract_count: 0,
      project_token_deployment_count: 0
    });
  } finally {
    await resetReplaySession(database);
    await closeSupabaseReplayDatabase(database);
  }
});
