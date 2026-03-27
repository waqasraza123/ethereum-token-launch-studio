import { validateSupabaseMigrationManifest } from "./lib/supabase-migrations.mjs";

const manifest = await validateSupabaseMigrationManifest();

console.info("supabase.migrations.list", {
  count: manifest.length,
  files: manifest.map((migration) => migration.filename),
});
