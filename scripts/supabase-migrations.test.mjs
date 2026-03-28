import assert from "node:assert/strict";
import test from "node:test";
import {
  readSupabaseMigrationManifest,
  validateSupabaseMigrationManifest,
} from "./lib/supabase-migrations.mjs";
import {
  closeSupabaseReplayDatabase,
  replaySupabaseMigrations,
  resetReplaySession,
  setReplayAuthenticatedUser,
} from "./lib/supabase-replay.mjs";

const firstUserId = "00000000-0000-0000-0000-000000000001";
const secondUserId = "00000000-0000-0000-0000-000000000002";

test("supabase migration manifest is sequential and includes the rls hardening migration", async () => {
  const manifest = await validateSupabaseMigrationManifest();

  assert.deepEqual(
    manifest.map((migration) => migration.filename),
    [
      "0001_phase_1_baseline.sql",
      "0002_phase_2_core_business_schema.sql",
      "0003_phase_2_auth_workspace_bootstrap.sql",
      "0004_phase_2_workspace_project_flows.sql",
      "0005_phase_2_rls_and_session_reads.sql",
    ],
  );
});

test("the rls hardening migration defines policies and auth-aware function bodies", async () => {
  const manifest = await readSupabaseMigrationManifest();
  const rlsMigration = manifest[4];

  assert.match(
    rlsMigration.statementText,
    /create or replace function app_private\.is_workspace_member/i,
  );
  assert.match(rlsMigration.statementText, /auth\.uid\(\)/i);
  assert.match(rlsMigration.statementText, /enable row level security/i);
  assert.match(rlsMigration.statementText, /create policy workspaces_select_member_access/i);
  assert.match(rlsMigration.statementText, /create policy workspace_members_select_self_access/i);
  assert.match(rlsMigration.statementText, /create policy projects_select_member_access/i);
});

test("migration replay creates the expected policies", async () => {
  const { database } = await replaySupabaseMigrations();

  try {
    const policiesResult = await database.query(`
      select tablename, policyname
      from pg_policies
      where schemaname = 'app_public'
      order by tablename, policyname
    `);

    assert.deepEqual(policiesResult.rows, [
      {
        policyname: "projects_select_member_access",
        tablename: "projects",
      },
      {
        policyname: "workspace_members_select_self_access",
        tablename: "workspace_members",
      },
      {
        policyname: "workspaces_select_member_access",
        tablename: "workspaces",
      },
    ]);
  } finally {
    await closeSupabaseReplayDatabase(database);
  }
});

test("authenticated replay can bootstrap and create projects without service-role reads", async () => {
  const { database } = await replaySupabaseMigrations();

  try {
    await database.exec(`
      insert into auth.users (id)
      values ('${firstUserId}');
    `);

    await setReplayAuthenticatedUser(database, firstUserId);

    const bootstrapResult = await database.query(`
      select *
      from app_public.bootstrap_workspace(
        '10000000-0000-0000-0000-000000000001',
        'studio-core',
        'Studio Core',
        '20000000-0000-0000-0000-000000000001'
      )
    `);

    const createProjectResult = await database.query(`
      select *
      from app_public.create_project(
        '30000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000001',
        'alpha-launch',
        'Alpha Launch',
        'Initial project'
      )
    `);

    assert.deepEqual(bootstrapResult.rows[0], {
      workspace_id: "10000000-0000-0000-0000-000000000001",
      workspace_member_id: "20000000-0000-0000-0000-000000000001",
    });

    assert.deepEqual(createProjectResult.rows[0], {
      project_id: "30000000-0000-0000-0000-000000000001",
      workspace_id: "10000000-0000-0000-0000-000000000001",
    });
  } finally {
    await resetReplaySession(database);
    await closeSupabaseReplayDatabase(database);
  }
});

test("rls filters workspace and project reads to the authenticated actor", async () => {
  const { database } = await replaySupabaseMigrations();

  try {
    await database.exec(`
      insert into auth.users (id)
      values
        ('${firstUserId}'),
        ('${secondUserId}');
    `);

    await setReplayAuthenticatedUser(database, firstUserId);

    await database.query(`
      select *
      from app_public.bootstrap_workspace(
        '10000000-0000-0000-0000-000000000001',
        'studio-alpha',
        'Studio Alpha',
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
        'Alpha description'
      )
    `);

    await setReplayAuthenticatedUser(database, secondUserId);

    await database.query(`
      select *
      from app_public.bootstrap_workspace(
        '10000000-0000-0000-0000-000000000002',
        'studio-beta',
        'Studio Beta',
        '20000000-0000-0000-0000-000000000002'
      )
    `);

    await database.query(`
      select *
      from app_public.create_project(
        '30000000-0000-0000-0000-000000000002',
        '10000000-0000-0000-0000-000000000002',
        'beta-launch',
        'Beta Launch',
        'Beta description'
      )
    `);

    await setReplayAuthenticatedUser(database, firstUserId);

    const visibleWorkspacesResult = await database.query(`
      select slug
      from app_public.workspaces
      order by slug
    `);

    const visibleMembershipsResult = await database.query(`
      select auth_user_id
      from app_public.workspace_members
      order by auth_user_id
    `);

    const visibleProjectsResult = await database.query(`
      select slug
      from app_public.projects
      order by slug
    `);

    assert.deepEqual(
      visibleWorkspacesResult.rows.map((row) => row.slug),
      ["studio-alpha"],
    );

    assert.deepEqual(
      visibleMembershipsResult.rows.map((row) => row.auth_user_id),
      [firstUserId],
    );

    assert.deepEqual(
      visibleProjectsResult.rows.map((row) => row.slug),
      ["alpha-launch"],
    );
  } finally {
    await resetReplaySession(database);
    await closeSupabaseReplayDatabase(database);
  }
});
