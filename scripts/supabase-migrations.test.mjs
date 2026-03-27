import assert from "node:assert/strict";
import test from "node:test";
import {
  readSupabaseMigrationManifest,
  validateSupabaseMigrationManifest,
} from "./lib/supabase-migrations.mjs";

test("supabase migration manifest is sequential and non-empty", async () => {
  const manifest = await validateSupabaseMigrationManifest();

  assert.equal(manifest.length >= 1, true);
  assert.equal(manifest[0].filename, "0001_phase_1_baseline.sql");
});

test("baseline migration creates only schema boundaries", async () => {
  const manifest = await readSupabaseMigrationManifest();
  const baselineMigration = manifest[0];

  assert.ok(baselineMigration);
  assert.match(baselineMigration.statementText, /create schema if not exists app_public;/i);
  assert.match(baselineMigration.statementText, /create schema if not exists app_private;/i);
  assert.match(baselineMigration.statementText, /create schema if not exists app_audit;/i);
});
