import { closeSupabaseReplayDatabase, replaySupabaseMigrations } from "./lib/supabase-replay.mjs";

const authFixtureSql = `
insert into auth.users (id)
values ('00000000-0000-0000-0000-000000000001');
`;

const bootstrapWorkspaceSql = `
select *
from app_public.bootstrap_workspace(
  '10000000-0000-0000-0000-000000000001',
  'studio-foundation',
  'Studio Foundation',
  '20000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001'
);
`;

const { database, manifest } = await replaySupabaseMigrations();

try {
  await database.exec(authFixtureSql);

  const bootstrapResult = await database.query(bootstrapWorkspaceSql);
  const countsResult = await database.query(`
    select
      (select count(*)::int from app_public.workspaces) as workspace_count,
      (select count(*)::int from app_public.workspace_members) as workspace_member_count,
      (select count(*)::int from app_public.projects) as project_count
  `);

  const triggersResult = await database.query(`
    select event_object_table
    from information_schema.triggers
    where event_object_schema = 'app_public'
      and trigger_name in (
        'workspaces_set_updated_at',
        'workspace_members_set_updated_at',
        'projects_set_updated_at'
      )
    order by event_object_table
  `);

  console.info("supabase.migrations.replay_valid", {
    bootstrap: bootstrapResult.rows[0],
    counts: countsResult.rows[0],
    latestMigration: manifest.at(-1)?.filename ?? null,
    triggers: triggersResult.rows.map((row) => row.event_object_table),
  });
} finally {
  await closeSupabaseReplayDatabase(database);
}
