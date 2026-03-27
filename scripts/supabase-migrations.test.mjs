import assert from "node:assert/strict";
import test from "node:test";
import {
  readSupabaseMigrationManifest,
  validateSupabaseMigrationManifest,
} from "./lib/supabase-migrations.mjs";
import { closeSupabaseReplayDatabase, replaySupabaseMigrations } from "./lib/supabase-replay.mjs";

test("supabase migration manifest is sequential and includes the phase 2 schema migration", async () => {
  const manifest = await validateSupabaseMigrationManifest();

  assert.deepEqual(
    manifest.map((migration) => migration.filename),
    ["0001_phase_1_baseline.sql", "0002_phase_2_core_business_schema.sql"],
  );
});

test("baseline migration creates schema boundaries and the phase 2 migration defines the core tables", async () => {
  const manifest = await readSupabaseMigrationManifest();
  const baselineMigration = manifest[0];
  const coreSchemaMigration = manifest[1];

  assert.ok(baselineMigration);
  assert.ok(coreSchemaMigration);

  assert.match(baselineMigration.statementText, /create schema if not exists app_public;/i);
  assert.match(baselineMigration.statementText, /create schema if not exists app_private;/i);
  assert.match(baselineMigration.statementText, /create schema if not exists app_audit;/i);

  assert.match(
    coreSchemaMigration.statementText,
    /create table if not exists app_public\.workspaces/i,
  );
  assert.match(
    coreSchemaMigration.statementText,
    /create table if not exists app_public\.workspace_members/i,
  );
  assert.match(
    coreSchemaMigration.statementText,
    /create table if not exists app_public\.projects/i,
  );
  assert.match(coreSchemaMigration.statementText, /references auth\.users\(id\)/i);
});

test("migration replay creates the expected schemas, tables, and triggers", async () => {
  const { database } = await replaySupabaseMigrations();

  try {
    const schemasResult = await database.query(`
      select schema_name
      from information_schema.schemata
      where schema_name in ('app_public', 'app_private', 'app_audit')
      order by schema_name
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
      schemasResult.rows.map((row) => row.schema_name),
      ["app_audit", "app_private", "app_public"],
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

test("migration replay enforces foreign keys, roles, and slug validation", async () => {
  const { database } = await replaySupabaseMigrations();

  try {
    await database.exec(`
      insert into auth.users (id)
      values ('00000000-0000-0000-0000-000000000001');

      insert into app_public.workspaces (id, slug, name)
      values ('10000000-0000-0000-0000-000000000001', 'studio-core', 'Studio Core');

      insert into app_public.workspace_members (id, workspace_id, auth_user_id, role)
      values (
        '20000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000001',
        'owner'
      );

      insert into app_public.projects (id, workspace_id, slug, name)
      values (
        '30000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000001',
        'alpha-launch',
        'Alpha Launch'
      );
    `);

    const countsResult = await database.query(`
      select
        (select count(*)::int from app_public.workspaces) as workspace_count,
        (select count(*)::int from app_public.workspace_members) as workspace_member_count,
        (select count(*)::int from app_public.projects) as project_count
    `);

    assert.deepEqual(countsResult.rows[0], {
      project_count: 1,
      workspace_count: 1,
      workspace_member_count: 1,
    });

    await assert.rejects(
      database.exec(`
        insert into app_public.workspaces (id, slug, name)
        values ('10000000-0000-0000-0000-000000000002', 'Bad Slug', 'Invalid Workspace');
      `),
    );

    await assert.rejects(
      database.exec(`
        insert into app_public.workspace_members (id, workspace_id, auth_user_id, role)
        values (
          '20000000-0000-0000-0000-000000000002',
          '10000000-0000-0000-0000-000000000001',
          '00000000-0000-0000-0000-000000000099',
          'owner'
        );
      `),
    );

    await assert.rejects(
      database.exec(`
        insert into app_public.workspace_members (id, workspace_id, auth_user_id, role)
        values (
          '20000000-0000-0000-0000-000000000003',
          '10000000-0000-0000-0000-000000000001',
          '00000000-0000-0000-0000-000000000001',
          'admin'
        );
      `),
    );
  } finally {
    await closeSupabaseReplayDatabase(database);
  }
});
