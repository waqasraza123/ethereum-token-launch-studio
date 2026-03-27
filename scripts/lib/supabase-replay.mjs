import { PGlite } from "@electric-sql/pglite";
import { validateSupabaseMigrationManifest } from "./supabase-migrations.mjs";

const authPreludeSql = `
create schema if not exists auth;
create table if not exists auth.users (
  id uuid primary key
);
`;

export const createSupabaseReplayDatabase = async () => {
  const database = new PGlite();
  await database.exec(authPreludeSql);
  return database;
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
