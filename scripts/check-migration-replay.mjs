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

const createProjectSql = `
select *
from app_public.create_project(
  '30000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  'alpha-launch',
  'Alpha Launch',
  'Replay validation fixture',
  '00000000-0000-0000-0000-000000000001'
);
`;

const { database, manifest } = await replaySupabaseMigrations();

try {
  await database.exec(authFixtureSql);

  const bootstrapResult = await database.query(bootstrapWorkspaceSql);
  const createProjectResult = await database.query(createProjectSql);
  const countsResult = await database.query(`
    select
      (select count(*)::int from app_public.workspaces) as workspace_count,
      (select count(*)::int from app_public.workspace_members) as workspace_member_count,
      (select count(*)::int from app_public.projects) as project_count
  `);

  console.info("supabase.migrations.replay_valid", {
    bootstrap: bootstrapResult.rows[0],
    createdProject: createProjectResult.rows[0],
    counts: countsResult.rows[0],
    latestMigration: manifest.at(-1)?.filename ?? null,
  });
} finally {
  await closeSupabaseReplayDatabase(database);
}
