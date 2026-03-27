import { closeSupabaseReplayDatabase, replaySupabaseMigrations } from "./lib/supabase-replay.mjs";

const replayFixtureSql = `
insert into auth.users (id)
values ('00000000-0000-0000-0000-000000000001');

insert into app_public.workspaces (id, slug, name)
values ('10000000-0000-0000-0000-000000000001', 'studio-foundation', 'Studio Foundation');

insert into app_public.workspace_members (id, workspace_id, auth_user_id, role)
values (
  '20000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'owner'
);

insert into app_public.projects (id, workspace_id, slug, name, description)
values (
  '30000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  'token-launch-studio',
  'Token Launch Studio',
  'Replay validation fixture'
);
`;

const { database, manifest } = await replaySupabaseMigrations();

try {
  await database.exec(replayFixtureSql);

  const countsResult = await database.query(`
    select
      (select count(*)::int from app_public.workspaces) as workspace_count,
      (select count(*)::int from app_public.workspace_members) as workspace_member_count,
      (select count(*)::int from app_public.projects) as project_count
  `);

  const triggerResult = await database.query(`
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
    counts: countsResult.rows[0],
    latestMigration: manifest.at(-1)?.filename ?? null,
    triggers: triggerResult.rows.map((row) => row.event_object_table),
  });
} finally {
  await closeSupabaseReplayDatabase(database);
}
