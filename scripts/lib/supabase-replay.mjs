import { PGlite } from "@electric-sql/pglite";
import { validateSupabaseMigrationManifest } from "./supabase-migrations.mjs";

const replayPreludeSql = `
do $block$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon;
  end if;

  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated;
  end if;

  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role;
  end if;
end;
$block$;

do $block$
begin
  execute format('grant anon to %I', current_user);
  execute format('grant authenticated to %I', current_user);
  execute format('grant service_role to %I', current_user);
end;
$block$;

create schema if not exists auth;

create table if not exists auth.users (
  id uuid primary key,
  email text
);

create unique index if not exists auth_users_email_lower_unique
  on auth.users (lower(email));

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

export const setReplayServiceRole = async (database) => {
  await database.exec(`
    reset role;
    select set_config('request.jwt.claim.sub', '', false);
    set role service_role;
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
