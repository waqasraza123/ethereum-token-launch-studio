import { constants } from "node:fs";
import { access, readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const supabaseConfigRelativePath = "infra/supabase/config.toml";
const supabaseMigrationsRelativePath = "infra/supabase/migrations";
const migrationFilePattern = /^(\d{4})_([a-z0-9]+(?:_[a-z0-9]+)*)\.sql$/;

const ensurePathExists = async (relativePath) => {
  await access(resolve(relativePath), constants.F_OK);
};

export const ensureSupabaseInfrastructureExists = async () => {
  await ensurePathExists(supabaseConfigRelativePath);
  await ensurePathExists(supabaseMigrationsRelativePath);
};

export const readSupabaseMigrationManifest = async () => {
  await ensureSupabaseInfrastructureExists();

  const directoryEntries = await readdir(resolve(supabaseMigrationsRelativePath), {
    withFileTypes: true,
  });

  const migrationFilenames = directoryEntries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".sql"))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));

  const manifest = await Promise.all(
    migrationFilenames.map(async (filename) => {
      const match = migrationFilePattern.exec(filename);

      if (!match) {
        throw new Error(`Invalid migration filename: ${filename}`);
      }

      const statementText = await readFile(
        resolve(join(supabaseMigrationsRelativePath, filename)),
        "utf8",
      );

      return {
        filename,
        relativePath: join(supabaseMigrationsRelativePath, filename),
        sequenceNumber: Number(match[1]),
        statementText,
        title: match[2],
      };
    }),
  );

  return manifest;
};

export const validateSupabaseMigrationManifest = async () => {
  const manifest = await readSupabaseMigrationManifest();

  if (manifest.length === 0) {
    throw new Error("No Supabase migrations were found.");
  }

  const seenSequenceNumbers = new Set();

  for (const [index, migration] of manifest.entries()) {
    if (seenSequenceNumbers.has(migration.sequenceNumber)) {
      throw new Error(`Duplicate migration sequence number: ${migration.sequenceNumber}`);
    }

    seenSequenceNumbers.add(migration.sequenceNumber);

    const expectedSequenceNumber = index + 1;

    if (migration.sequenceNumber !== expectedSequenceNumber) {
      throw new Error(
        `Expected migration sequence ${String(expectedSequenceNumber).padStart(4, "0")} but found ${migration.filename}`,
      );
    }

    if (migration.statementText.trim().length === 0) {
      throw new Error(`Migration file is empty: ${migration.filename}`);
    }
  }

  return manifest;
};
