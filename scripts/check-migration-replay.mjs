import {
  closeSupabaseReplayDatabase,
  replaySupabaseMigrations,
  resetReplaySession,
  setReplayAuthenticatedUser,
  setReplayServiceRole
} from "./lib/supabase-replay.mjs";

const firstUserId = "00000000-0000-0000-0000-000000000001";

const { database, manifest } = await replaySupabaseMigrations();

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
      'Replay validation fixture'
    )
  `);

  await setReplayServiceRole(database);

  const registryResult = await database.query(`
    select *
    from app_public.record_project_token_deployment(
      '40000000-0000-0000-0000-000000000001',
      'studio-alpha',
      'alpha-launch',
      11155111,
      '0x1111111111111111111111111111111111111111',
      'Alpha Token',
      'testnet',
      'https://sepolia.etherscan.io/address/0x1111111111111111111111111111111111111111',
      'Replay deployment bridge',
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

  await setReplayAuthenticatedUser(database, firstUserId);

  const visibleCountsResult = await database.query(`
    select
      (select count(*)::int from app_public.project_contracts) as project_contract_count,
      (select count(*)::int from app_public.project_token_deployments) as project_token_deployment_count
  `);

  console.info("supabase.migrations.replay_valid", {
    latestMigration: manifest.at(-1)?.filename ?? null,
    recordedDeployment: registryResult.rows[0],
    visibleCounts: visibleCountsResult.rows[0]
  });
} finally {
  await resetReplaySession(database);
  await closeSupabaseReplayDatabase(database);
}
