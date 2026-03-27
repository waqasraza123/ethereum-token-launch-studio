import { validateSupabaseMigrationManifest } from "./lib/supabase-migrations.mjs";

const manifest = await validateSupabaseMigrationManifest();
const latestMigration = manifest.at(-1);

console.info("supabase.migrations.valid", {
  count: manifest.length,
  latestMigration: latestMigration?.filename ?? null,
});
