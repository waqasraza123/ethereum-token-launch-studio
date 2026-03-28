import {
  closeSupabaseReplayDatabase,
  replaySupabaseMigrations,
  resetReplaySession,
  setReplayAuthenticatedUser,
} from "./lib/supabase-replay.mjs";

const firstUserId = "00000000-0000-0000-0000-000000000001";
const secondUserId = "00000000-0000-0000-0000-000000000002";

const { database, manifest } = await replaySupabaseMigrations();

try {
  await database.exec(`
    insert into auth.users (id)
    values
      ('${firstUserId}'),
      ('${secondUserId}');
  `);

  await setReplayAuthenticatedUser(database, firstUserId);

  const firstWorkspaceResult = await database.query(`
    select *
    from app_public.bootstrap_workspace(
      '10000000-0000-0000-0000-000000000001',
      'studio-alpha',
      'Studio Alpha',
      '20000000-0000-0000-0000-000000000001'
    )
  `);

  const firstProjectResult = await database.query(`
    select *
    from app_public.create_project(
      '30000000-0000-0000-0000-000000000001',
      '10000000-0000-0000-0000-000000000001',
      'alpha-launch',
      'Alpha Launch',
      'Replay validation fixture'
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
      'Replay validation fixture'
    )
  `);

  await setReplayAuthenticatedUser(database, firstUserId);

  const visibleCountsResult = await database.query(`
    select
      (select count(*)::int from app_public.workspaces) as visible_workspaces,
      (select count(*)::int from app_public.workspace_members) as visible_workspace_members,
      (select count(*)::int from app_public.projects) as visible_projects
  `);

  console.info("supabase.migrations.replay_valid", {
    latestMigration: manifest.at(-1)?.filename ?? null,
    firstProject: firstProjectResult.rows[0],
    firstWorkspace: firstWorkspaceResult.rows[0],
    visibleCountsForFirstUser: visibleCountsResult.rows[0],
  });
} finally {
  await resetReplaySession(database);
  await closeSupabaseReplayDatabase(database);
}
