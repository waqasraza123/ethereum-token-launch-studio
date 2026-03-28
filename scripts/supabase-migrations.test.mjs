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
  setReplayAuthenticatedUser
} from "./lib/supabase-replay.mjs";

const firstUserId = "00000000-0000-0000-0000-000000000001";
const secondUserId = "00000000-0000-0000-0000-000000000002";
const thirdUserId = "00000000-0000-0000-0000-000000000003";

test("supabase migration manifest is sequential and includes the project context and contract registry migration", async () => {
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
      "0007_phase_2_project_context_and_contract_registry.sql"
    ]
  );
});

test("project context and contract registry migration defines the registry table and protected functions", async () => {
  const manifest = await readSupabaseMigrationManifest();
  const registryMigration = manifest[6];

  assert.match(
    registryMigration.statementText,
    /create table if not exists app_public\.project_contracts/i
  );
  assert.match(
    registryMigration.statementText,
    /create or replace function app_public\.update_project/i
  );
  assert.match(
    registryMigration.statementText,
    /create or replace function app_public\.delete_project/i
  );
  assert.match(
    registryMigration.statementText,
    /create or replace function app_public\.attach_project_contract/i
  );
  assert.match(
    registryMigration.statementText,
    /create or replace function app_public\.detach_project_contract/i
  );
  assert.match(
    registryMigration.statementText,
    /create policy project_contracts_select_project_visibility/i
  );
});

test("authorized actor can update a project attach and detach a contract then delete the project", async () => {
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

    const updateResult = await database.query(`
      select *
      from app_public.update_project(
        '30000000-0000-0000-0000-000000000001',
        'Alpha Launch V2',
        'alpha-launch-v2',
        'Updated project'
      )
    `);

    const attachResult = await database.query(`
      select *
      from app_public.attach_project_contract(
        '40000000-0000-0000-0000-000000000001',
        '30000000-0000-0000-0000-000000000001',
        11155111,
        '0x1111111111111111111111111111111111111111',
        'project_token',
        'Alpha Token',
        'testnet',
        'https://sepolia.etherscan.io/address/0x1111111111111111111111111111111111111111',
        'Initial token'
      )
    `);

    const detachResult = await database.query(`
      select *
      from app_public.detach_project_contract(
        '40000000-0000-0000-0000-000000000001'
      )
    `);

    const deleteResult = await database.query(`
      select *
      from app_public.delete_project(
        '30000000-0000-0000-0000-000000000001'
      )
    `);

    const countsResult = await database.query(`
      select
        (select count(*)::int from app_public.projects) as project_count,
        (select count(*)::int from app_public.project_contracts) as project_contract_count
    `);

    assert.deepEqual(updateResult.rows[0], {
      project_id: "30000000-0000-0000-0000-000000000001",
      project_slug: "alpha-launch-v2",
      workspace_id: "10000000-0000-0000-0000-000000000001"
    });

    assert.deepEqual(attachResult.rows[0], {
      address: "0x1111111111111111111111111111111111111111",
      project_contract_id: "40000000-0000-0000-0000-000000000001",
      project_id: "30000000-0000-0000-0000-000000000001"
    });

    assert.deepEqual(detachResult.rows[0], {
      project_contract_id: "40000000-0000-0000-0000-000000000001",
      project_id: "30000000-0000-0000-0000-000000000001"
    });

    assert.deepEqual(deleteResult.rows[0], {
      project_id: "30000000-0000-0000-0000-000000000001",
      workspace_id: "10000000-0000-0000-0000-000000000001"
    });

    assert.deepEqual(countsResult.rows[0], {
      project_contract_count: 0,
      project_count: 0
    });
  } finally {
    await resetReplaySession(database);
    await closeSupabaseReplayDatabase(database);
  }
});

test("project deletion is blocked while contracts remain attached", async () => {
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
      from app_public.attach_project_contract(
        '40000000-0000-0000-0000-000000000001',
        '30000000-0000-0000-0000-000000000001',
        11155111,
        '0x1111111111111111111111111111111111111111',
        'project_token',
        'Alpha Token',
        'testnet',
        null,
        null
      )
    `);

    await assert.rejects(
      database.query(`
        select *
        from app_public.delete_project(
          '30000000-0000-0000-0000-000000000001'
        )
      `)
    );
  } finally {
    await resetReplaySession(database);
    await closeSupabaseReplayDatabase(database);
  }
});

test("project contracts are visible only to authorized workspace members", async () => {
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
      from app_public.attach_project_contract(
        '40000000-0000-0000-0000-000000000001',
        '30000000-0000-0000-0000-000000000001',
        11155111,
        '0x1111111111111111111111111111111111111111',
        'project_token',
        'Alpha Token',
        'testnet',
        null,
        null
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

    await setReplayAuthenticatedUser(database, secondUserId);

    const viewerVisibleContracts = await database.query(`
      select count(*)::int as contract_count
      from app_public.project_contracts
    `);

    await setReplayAuthenticatedUser(database, thirdUserId);

    const outsiderVisibleContracts = await database.query(`
      select count(*)::int as contract_count
      from app_public.project_contracts
    `);

    assert.deepEqual(viewerVisibleContracts.rows[0], {
      contract_count: 1
    });

    assert.deepEqual(outsiderVisibleContracts.rows[0], {
      contract_count: 0
    });
  } finally {
    await resetReplaySession(database);
    await closeSupabaseReplayDatabase(database);
  }
});
