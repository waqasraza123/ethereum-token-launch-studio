import { constants } from "node:fs";
import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { validateSupabaseMigrationManifest } from "./lib/supabase-migrations.mjs";

const requiredPaths = [
  ".env.example",
  "README.md",
  "docs/phases/phase-3-token-launch-reliability.md",
  "docs/runbooks/local-setup.md",
  "apps/web/src/lib/token-launch/retry-input.ts",
  "apps/web/src/lib/token-launch/requests.ts",
  "apps/web/src/lib/activity.ts",
  "apps/web/src/components/projects/project-activity-feed.tsx",
  "apps/web/src/components/projects/project-token-launch-retry-form.tsx",
  "apps/web/src/components/projects/project-token-launch-shell.tsx",
  "apps/web/src/app/(admin)/dashboard/[workspaceSlug]/projects/[projectSlug]/token-launch/actions.ts",
  "apps/worker/src/config/env.ts",
  "apps/worker/src/features/project-token-launch/process-launch-requests.ts",
  "infra/supabase/migrations/0010_phase_3_project_token_launch_reliability.sql"
];

const ensurePathExists = async (relativePath) => {
  await access(resolve(relativePath), constants.F_OK);
};

const readJsonFile = async (relativePath) => {
  const content = await readFile(resolve(relativePath), "utf8");
  return JSON.parse(content);
};

const main = async () => {
  await Promise.all(requiredPaths.map(ensurePathExists));
  await validateSupabaseMigrationManifest();

  const packageJson = await readJsonFile("package.json");

  if (packageJson.private !== true) {
    throw new Error("package.json must set private to true.");
  }

  console.log("Workspace foundation validation passed.");
};

await main();
