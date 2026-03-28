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

test("supabase migration manifest is sequential and includes the membership management migration", async () => {
  const manifest = await validateSupabaseMigrationManifest();

  assert.deepEqual(
    manifest.map((migration) => migration.filename),
    [
      "0001_phase_1_baseline.sql",
      "0002_phase_2_core_business_schema.sql",
      "0003_phase_2_auth_workspace_bootstrap.sql",
      "0004_phase_2_workspace_project_flows.sql",
      "0005_phase_2_rls_and_session_reads.sql",
      "0006_phase_2_membership_management.sql"
    ]
  );
});

test("membership management migration defines listing invite update and removal functions", async () => {
  const manifest = await readSupabaseMigrationManifest();
  const membershipMigration = manifest[5];

  assert.match(
    membershipMigration.statementText,
    /create or replace function app_public\.list_workspace_members/i
  );
  assert.match(
    membershipMigration.statementText,
    /create or replace function app_public\.invite_workspace_member/i
  );
  assert.match(
    membershipMigration.statementText,
    /create or replace function app_public\.update_workspace_member_role/i
  );
  assert.match(
    membershipMigration.statementText,
    /create or replace function app_public\.remove_workspace_member/i
  );
  assert.match(
    membershipMigration.statementText,
    /create or replace function app_private\.is_workspace_owner/i
  );
});

test("owner can invite an existing auth user and list workspace members", async () => {
  const { database } = await replaySupabaseMigrations();

  try {
    await database.exec(`
      insert into auth.users (id, email)
      values
        ('${firstUserId}', 'owner@example.com'),
        ('${secondUserId}', 'viewer@example.com');
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

    const inviteResult = await database.query(`
      select *
      from app_public.invite_workspace_member(
        '10000000-0000-0000-0000-000000000001',
        '20000000-0000-0000-0000-000000000002',
        'viewer@example.com',
        'viewer'
      )
    `);

    const membersResult = await database.query(`
      select *
      from app_public.list_workspace_members('10000000-0000-0000-0000-000000000001')
      order by email
    `);

    assert.deepEqual(inviteResult.rows[0], {
      auth_user_id: secondUserId,
      workspace_id: "10000000-0000-0000-0000-000000000001",
      workspace_member_id: "20000000-0000-0000-0000-000000000002"
    });

    assert.deepEqual(
      membersResult.rows.map((row) => row.email),
      ["owner@example.com", "viewer@example.com"]
    );
  } finally {
    await resetReplaySession(database);
    await closeSupabaseReplayDatabase(database);
  }
});

test("non-owners cannot invite update or remove workspace members", async () => {
  const { database } = await replaySupabaseMigrations();

  try {
    await database.exec(`
      insert into auth.users (id, email)
      values
        ('${firstUserId}', 'owner@example.com'),
        ('${secondUserId}', 'finance@example.com');
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
      from app_public.invite_workspace_member(
        '10000000-0000-0000-0000-000000000001',
        '20000000-0000-0000-0000-000000000002',
        'finance@example.com',
        'finance_manager'
      )
    `);

    await setReplayAuthenticatedUser(database, secondUserId);

    await assert.rejects(
      database.query(`
        select *
        from app_public.invite_workspace_member(
          '10000000-0000-0000-0000-000000000001',
          '20000000-0000-0000-0000-000000000003',
          'owner@example.com',
          'viewer'
        )
      `)
    );

    await assert.rejects(
      database.query(`
        select *
        from app_public.update_workspace_member_role(
          '20000000-0000-0000-0000-000000000002',
          'viewer'
        )
      `)
    );

    await assert.rejects(
      database.query(`
        select *
        from app_public.remove_workspace_member(
          '20000000-0000-0000-0000-000000000001'
        )
      `)
    );
  } finally {
    await resetReplaySession(database);
    await closeSupabaseReplayDatabase(database);
  }
});

test("the last owner cannot be demoted or removed", async () => {
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

    await assert.rejects(
      database.query(`
        select *
        from app_public.update_workspace_member_role(
          '20000000-0000-0000-0000-000000000001',
          'viewer'
        )
      `)
    );

    await assert.rejects(
      database.query(`
        select *
        from app_public.remove_workspace_member(
          '20000000-0000-0000-0000-000000000001'
        )
      `)
    );
  } finally {
    await resetReplaySession(database);
    await closeSupabaseReplayDatabase(database);
  }
});

test("workspace selector visibility changes after membership removal", async () => {
  const { database } = await replaySupabaseMigrations();

  try {
    await database.exec(`
      insert into auth.users (id, email)
      values
        ('${firstUserId}', 'owner@example.com'),
        ('${secondUserId}', 'viewer@example.com');
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
      from app_public.invite_workspace_member(
        '10000000-0000-0000-0000-000000000001',
        '20000000-0000-0000-0000-000000000002',
        'viewer@example.com',
        'viewer'
      )
    `);

    await setReplayAuthenticatedUser(database, secondUserId);

    const visibleBeforeRemoval = await database.query(`
      select count(*)::int as workspace_count
      from app_public.workspaces
    `);

    await setReplayAuthenticatedUser(database, firstUserId);

    await database.query(`
      select *
      from app_public.remove_workspace_member(
        '20000000-0000-0000-0000-000000000002'
      )
    `);

    await setReplayAuthenticatedUser(database, secondUserId);

    const visibleAfterRemoval = await database.query(`
      select count(*)::int as workspace_count
      from app_public.workspaces
    `);

    assert.deepEqual(visibleBeforeRemoval.rows[0], {
      workspace_count: 1
    });

    assert.deepEqual(visibleAfterRemoval.rows[0], {
      workspace_count: 0
    });
  } finally {
    await resetReplaySession(database);
    await closeSupabaseReplayDatabase(database);
  }
});
