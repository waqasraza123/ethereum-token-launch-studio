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

  const workspaceResult = await database.query(`
    select *
    from app_public.bootstrap_workspace(
      '10000000-0000-0000-0000-000000000001',
      'studio-alpha',
      'Studio Alpha',
      '20000000-0000-0000-0000-000000000001'
    )
  `);

  const projectResult = await database.query(`
    select *
    from app_public.create_project(
      '30000000-0000-0000-0000-000000000001',
      '10000000-0000-0000-0000-000000000001',
      'alpha-launch',
      'Alpha Launch',
      'Replay validation fixture'
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
      'Replay validation fixture'
    )
  `);

  let deletionBlockedMessage = null;

  try {
    await database.query(`
      select *
      from app_public.delete_project(
        '30000000-0000-0000-0000-000000000001'
      )
    `);
  } catch (error) {
    deletionBlockedMessage =
      error instanceof Error ? error.message : "Project deletion was blocked";
  }

  const updateResult = await database.query(`
    select *
    from app_public.update_project(
      '30000000-0000-0000-0000-000000000001',
      'Alpha Launch V2',
      'alpha-launch-v2',
      'Updated replay validation fixture'
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

  const remainingCountsResult = await database.query(`
    select
      (select count(*)::int from app_public.projects) as project_count,
      (select count(*)::int from app_public.project_contracts) as project_contract_count
  `);

  console.info("supabase.migrations.replay_valid", {
    attachedContract: attachResult.rows[0],
    deletedProject: deleteResult.rows[0],
    deletionBlockedMessage,
    detachedContract: detachResult.rows[0],
    latestMigration: manifest.at(-1)?.filename ?? null,
    remainingCounts: remainingCountsResult.rows[0],
    updatedProject: updateResult.rows[0],
    workspace: workspaceResult.rows[0],
    workspaceProject: projectResult.rows[0]
  });
} finally {
  await resetReplaySession(database);
  await closeSupabaseReplayDatabase(database);
}
