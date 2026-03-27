import assert from "node:assert/strict";
import test from "node:test";
import {
  readSupabaseMigrationManifest,
  validateSupabaseMigrationManifest,
} from "./lib/supabase-migrations.mjs";
import { closeSupabaseReplayDatabase, replaySupabaseMigrations } from "./lib/supabase-replay.mjs";

test("supabase migration manifest is sequential and includes the auth workspace bootstrap migration", async () => {
  const manifest = await validateSupabaseMigrationManifest();

  assert.deepEqual(
    manifest.map((migration) => migration.filename),
    [
      "0001_phase_1_baseline.sql",
      "0002_phase_2_core_business_schema.sql",
      "0003_phase_2_auth_workspace_bootstrap.sql",
    ],
  );
});

test("the phase 2 auth workspace bootstrap migration defines the bootstrap function", async () => {
  const manifest = await readSupabaseMigrationManifest();
  const bootstrapMigration = manifest[2];

  assert.ok(bootstrapMigration);
  assert.match(
    bootstrapMigration.statementText,
    /create or replace function app_public\.bootstrap_workspace/i,
  );
  assert.match(bootstrapMigration.statementText, /security definer/i);
  assert.match(bootstrapMigration.statementText, /insert into app_public\.workspaces/i);
  assert.match(bootstrapMigration.statementText, /insert into app_public\.workspace_members/i);
});

test("migration replay creates the bootstrap function and the expected tables and triggers", async () => {
  const { database } = await replaySupabaseMigrations();

  try {
    const routinesResult = await database.query(`
      select routine_name
      from information_schema.routines
      where routine_schema = 'app_public'
        and routine_name = 'bootstrap_workspace'
    `);

    const tablesResult = await database.query(`
      select table_name
      from information_schema.tables
      where table_schema = 'app_public'
        and table_name in ('projects', 'workspace_members', 'workspaces')
      order by table_name
    `);

    const triggersResult = await database.query(`
      select trigger_name
      from information_schema.triggers
      where event_object_schema = 'app_public'
        and trigger_name in (
          'projects_set_updated_at',
          'workspace_members_set_updated_at',
          'workspaces_set_updated_at'
        )
      order by trigger_name
    `);

    assert.deepEqual(
      routinesResult.rows.map((row) => row.routine_name),
      ["bootstrap_workspace"],
    );
    assert.deepEqual(
      tablesResult.rows.map((row) => row.table_name),
      ["projects", "workspace_members", "workspaces"],
    );
    assert.deepEqual(
      triggersResult.rows.map((row) => row.trigger_name),
      ["projects_set_updated_at", "workspace_members_set_updated_at", "workspaces_set_updated_at"],
    );
  } finally {
    await closeSupabaseReplayDatabase(database);
  }
});

test("migration replay executes bootstrap_workspace and enforces uniqueness", async () => {
  const { database } = await replaySupabaseMigrations();

  try {
    await database.exec(`
      insert into auth.users (id)
      values ('00000000-0000-0000-0000-000000000001');
    `);

    const bootstrapResult = await database.query(`
      select *
      from app_public.bootstrap_workspace(
        '10000000-0000-0000-0000-000000000001',
        'studio-core',
        'Studio Core',
        '20000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000001'
      );
    `);

    const countsResult = await database.query(`
      select
        (select count(*)::int from app_public.workspaces) as workspace_count,
        (select count(*)::int from app_public.workspace_members) as workspace_member_count
    `);

    assert.deepEqual(bootstrapResult.rows[0], {
      workspace_id: "10000000-0000-0000-0000-000000000001",
      workspace_member_id: "20000000-0000-0000-0000-000000000001",
    });

    assert.deepEqual(countsResult.rows[0], {
      workspace_count: 1,
      workspace_member_count: 1,
    });

    await assert.rejects(
      database.query(`
        select *
        from app_public.bootstrap_workspace(
          '10000000-0000-0000-0000-000000000002',
          'studio-core',
          'Studio Core Duplicate',
          '20000000-0000-0000-0000-000000000002',
          '00000000-0000-0000-0000-000000000001'
        );
      `),
    );
  } finally {
    await closeSupabaseReplayDatabase(database);
  }
});
