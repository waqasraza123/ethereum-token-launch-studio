import { PGlite } from "@electric-sql/pglite";
import { validateSupabaseMigrationManifest } from "./supabase-migrations.mjs";

const replayPreludeSql = `
do $block$
declare
  v_session_user text := session_user;
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon;
  end if;

  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated;
  end if;

  execute format('grant anon to %I', v_session_user);
  execute format('grant authenticated to %I', v_session_user);
end;
$block$;

create schema if not exists auth;

create table if not exists auth.users (
  id uuid primary key
);

create or replace function auth.uid()
returns uuid
language sql
stable
as $function$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$function$;
`;

export const createSupabaseReplayDatabase = async () => {
  const database = await PGlite.create({ dataDir: "memory://" });
  await database.exec(replayPreludeSql);
  return database;
};

export const setReplayAuthenticatedUser = async (database, authUserId) => {
  await database.exec(`
    reset role;
    select set_config('request.jwt.claim.sub', '', false);
    set role authenticated;
    select set_config('request.jwt.claim.sub', '${authUserId}', false);
  `);
};

export const resetReplaySession = async (database) => {
  await database.exec(`
    reset role;
    select set_config('request.jwt.claim.sub', '', false);
  `);
};

export const replaySupabaseMigrations = async () => {
  const manifest = await validateSupabaseMigrationManifest();
  const database = await createSupabaseReplayDatabase();

  for (const migration of manifest) {
    await database.exec(migration.statementText);
  }

  return { database, manifest };
};

export const closeSupabaseReplayDatabase = async (database) => {
  if (database && typeof database.close === "function") {
    await database.close();
  }
};
