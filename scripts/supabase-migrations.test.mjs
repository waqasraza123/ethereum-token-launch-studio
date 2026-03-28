import assert from "node:assert/strict";
import test from "node:test";
import {
  readSupabaseMigrationManifest,
  validateSupabaseMigrationManifest,
} from "./lib/supabase-migrations.mjs";
import { closeSupabaseReplayDatabase, replaySupabaseMigrations } from "./lib/supabase-replay.mjs";

test("supabase migration manifest is sequential and includes the workspace project flow migration", async () => {
  const manifest = await validateSupabaseMigrationManifest();

  assert.deepEqual(
    manifest.map((migration) => migration.filename),
    [
      "0001_phase_1_baseline.sql",
      "0002_phase_2_core_business_schema.sql",
      "0003_phase_2_auth_workspace_bootstrap.sql",
      "0004_phase_2_workspace_project_flows.sql",
    ],
  );
});

test("workspace bootstrap and project flow migrations define both write functions", async () => {
  const manifest = await readSupabaseMigrationManifest();
  const bootstrapMigration = manifest[2];
  const projectFlowMigration = manifest[3];

  assert.ok(bootstrapMigration);
  assert.ok(projectFlowMigration);
  assert.match(
    bootstrapMigration.statementText,
    /create or replace function app_public\.bootstrap_workspace/i,
  );
  assert.match(
    projectFlowMigration.statementText,
    /create or replace function app_public\.create_project/i,
  );
  assert.match(projectFlowMigration.statementText, /security definer/i);
  assert.match(projectFlowMigration.statementText, /v_actor_role/i);
});

test("migration replay executes bootstrap_workspace and create_project as owner", async () => {
  const { database } = await replaySupabaseMigrations();

  try {
    await database.exec(`
      insert into auth.users (id)
      values ('00000000-0000-0000-0000-000000000001');
    `);

    await database.query(`
      select *
      from app_public.bootstrap_workspace(
        '10000000-0000-0000-0000-000000000001',
        'studio-core',
        'Studio Core',
        '20000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000001'
      );
    `);

    const createProjectResult = await database.query(`
      select *
      from app_public.create_project(
        '30000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000001',
        'alpha-launch',
        'Alpha Launch',
        'Initial workspace project',
        '00000000-0000-0000-0000-000000000001'
      );
    `);

    const countsResult = await database.query(`
      select
        (select count(*)::int from app_public.workspaces) as workspace_count,
        (select count(*)::int from app_public.workspace_members) as workspace_member_count,
        (select count(*)::int from app_public.projects) as project_count
    `);

    assert.deepEqual(createProjectResult.rows[0], {
      project_id: "30000000-0000-0000-0000-000000000001",
      workspace_id: "10000000-0000-0000-0000-000000000001",
    });

    assert.deepEqual(countsResult.rows[0], {
      project_count: 1,
      workspace_count: 1,
      workspace_member_count: 1,
    });
  } finally {
    await closeSupabaseReplayDatabase(database);
  }
});

test("migration replay rejects project creation for disallowed roles", async () => {
  const { database } = await replaySupabaseMigrations();

  try {
    await database.exec(`
      insert into auth.users (id)
      values
        ('00000000-0000-0000-0000-000000000001'),
        ('00000000-0000-0000-0000-000000000002');

      select *
      from app_public.bootstrap_workspace(
        '10000000-0000-0000-0000-000000000001',
        'studio-core',
        'Studio Core',
        '20000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000001'
      );

      insert into app_public.workspace_members (id, workspace_id, auth_user_id, role)
      values (
        '20000000-0000-0000-0000-000000000002',
        '10000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000002',
        'finance_manager'
      );
    `);

    await assert.rejects(
      database.query(`
        select *
        from app_public.create_project(
          '30000000-0000-0000-0000-000000000002',
          '10000000-0000-0000-0000-000000000001',
          'finance-project',
          'Finance Project',
          'Should fail',
          '00000000-0000-0000-0000-000000000002'
        );
      `),
    );
  } finally {
    await closeSupabaseReplayDatabase(database);
  }
});
