import {
  closeSupabaseReplayDatabase,
  replaySupabaseMigrations,
  resetReplaySession,
  setReplayAuthenticatedUser
} from "./lib/supabase-replay.mjs";

const firstUserId = "00000000-0000-0000-0000-000000000001";
const secondUserId = "00000000-0000-0000-0000-000000000002";

const { database, manifest } = await replaySupabaseMigrations();

try {
  await database.exec(`
    insert into auth.users (id, email)
    values
      ('${firstUserId}', 'owner@example.com'),
      ('${secondUserId}', 'viewer@example.com');
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
  `);

  await setReplayAuthenticatedUser(database, secondUserId);

  const secondUserVisibleCountsBeforeRemoval = await database.query(`
    select
      (select count(*)::int from app_public.workspaces) as visible_workspaces,
      (select count(*)::int from app_public.projects) as visible_projects,
      (select count(*)::int from app_public.workspace_members) as visible_workspace_members
  `);

  await setReplayAuthenticatedUser(database, firstUserId);

  const removalResult = await database.query(`
    select *
    from app_public.remove_workspace_member('20000000-0000-0000-0000-000000000002')
  `);

  await setReplayAuthenticatedUser(database, secondUserId);

  const secondUserVisibleCountsAfterRemoval = await database.query(`
    select
      (select count(*)::int from app_public.workspaces) as visible_workspaces,
      (select count(*)::int from app_public.projects) as visible_projects,
      (select count(*)::int from app_public.workspace_members) as visible_workspace_members
  `);

  console.info("supabase.migrations.replay_valid", {
    firstWorkspace: firstWorkspaceResult.rows[0],
    invitedMember: inviteResult.rows[0],
    latestMigration: manifest.at(-1)?.filename ?? null,
    memberEmails: membersResult.rows.map((row) => row.email),
    removedMember: removalResult.rows[0],
    secondUserVisibleCountsAfterRemoval: secondUserVisibleCountsAfterRemoval.rows[0],
    secondUserVisibleCountsBeforeRemoval: secondUserVisibleCountsBeforeRemoval.rows[0]
  });
} finally {
  await resetReplaySession(database);
  await closeSupabaseReplayDatabase(database);
}
