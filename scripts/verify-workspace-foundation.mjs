import { constants } from "node:fs";
import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { validateSupabaseMigrationManifest } from "./lib/supabase-migrations.mjs";

const requiredPaths = [
  ".editorconfig",
  ".env.example",
  ".github/workflows/ci.yml",
  ".gitignore",
  ".node-version",
  ".npmrc",
  "README.md",
  "eslint.config.mjs",
  "package.json",
  "pnpm-workspace.yaml",
  "prettier.config.mjs",
  "turbo.json",
  "tooling/eslint/base.mjs",
  "tooling/typescript/base.json",
  "tooling/typescript/nextjs.json",
  "tooling/typescript/node.json",
  "docs/phases/phase-1-foundation.md",
  "docs/phases/phase-2-core-schema.md",
  "docs/phases/phase-2-auth-spine.md",
  "docs/phases/phase-2-workspace-project-flows.md",
  "docs/phases/phase-2-rls-and-session-reads.md",
  "docs/runbooks/local-setup.md",
  "scripts/workspace-foundation.test.mjs",
  "scripts/supabase-migrations.test.mjs",
  "scripts/lib/supabase-migrations.mjs",
  "scripts/lib/supabase-replay.mjs",
  "scripts/list-migrations.mjs",
  "scripts/validate-migrations.mjs",
  "scripts/check-migration-replay.mjs",
  "apps/web/package.json",
  "apps/web/tsconfig.json",
  "apps/web/next-env.d.ts",
  "apps/web/next.config.ts",
  "apps/web/eslint.config.mjs",
  "apps/web/src/app/layout.tsx",
  "apps/web/src/app/(auth)/sign-in/actions.ts",
  "apps/web/src/app/(auth)/sign-in/page.tsx",
  "apps/web/src/app/(admin)/dashboard/actions.ts",
  "apps/web/src/app/(admin)/dashboard/page.tsx",
  "apps/web/src/app/(admin)/dashboard/[workspaceSlug]/page.tsx",
  "apps/web/src/app/(admin)/dashboard/[workspaceSlug]/projects/new/actions.ts",
  "apps/web/src/app/(admin)/dashboard/[workspaceSlug]/projects/new/page.tsx",
  "apps/web/src/app/(admin)/dashboard/[workspaceSlug]/projects/[projectSlug]/page.tsx",
  "apps/web/src/lib/projects/data.ts",
  "apps/web/src/lib/supabase/server-app.ts",
  "apps/web/src/lib/workspaces/access.ts",
  "apps/worker/package.json",
  "apps/worker/tsconfig.json",
  "apps/worker/eslint.config.mjs",
  "apps/worker/src/index.ts",
  "apps/worker/src/bootstrap/start-worker.ts",
  "apps/worker/src/config/env.ts",
  "apps/worker/src/core/worker-runtime.ts",
  "packages/contracts/package.json",
  "packages/contracts/tsconfig.json",
  "packages/contracts/eslint.config.mjs",
  "packages/contracts/hardhat.config.ts",
  "packages/contracts/contracts/foundation/Phase1Sentinel.sol",
  "packages/contracts/test/Phase1Sentinel.test.ts",
  "packages/contracts/scripts/print-accounts.ts",
  "infra/supabase/README.md",
  "infra/supabase/config.toml",
  "infra/supabase/migrations/0001_phase_1_baseline.sql",
  "infra/supabase/migrations/0002_phase_2_core_business_schema.sql",
  "infra/supabase/migrations/0003_phase_2_auth_workspace_bootstrap.sql",
  "infra/supabase/migrations/0004_phase_2_workspace_project_flows.sql",
  "infra/supabase/migrations/0005_phase_2_rls_and_session_reads.sql",
];

const requiredRootScripts = [
  "build",
  "contracts:compile",
  "contracts:test",
  "db:list",
  "db:replay:check",
  "db:validate",
  "dev:web",
  "dev:worker",
  "format",
  "format:check",
  "lint",
  "typecheck",
  "test",
  "validate:foundation",
];

const requiredWorkspaceGlobs = ["apps/*", "packages/*"];
const requiredTurboTasks = ["build", "dev", "lint", "typecheck", "test"];

const requiredPackageDefinitions = [
  {
    path: "apps/web/package.json",
    name: "@token-launch-studio/web",
    scripts: ["build", "dev", "lint", "test", "typecheck"],
  },
  {
    path: "apps/worker/package.json",
    name: "@token-launch-studio/worker",
    scripts: ["build", "dev", "lint", "test", "typecheck"],
  },
  {
    path: "packages/contracts/package.json",
    name: "@token-launch-studio/contracts",
    scripts: ["accounts", "build", "compile", "lint", "test", "typecheck"],
  },
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

  const packageJson = await readJsonFile("package.json");

  if (packageJson.private !== true) {
    throw new Error("package.json must set private to true.");
  }

  if (
    typeof packageJson.packageManager !== "string" ||
    !packageJson.packageManager.startsWith("pnpm@")
  ) {
    throw new Error("package.json must lock pnpm via packageManager.");
  }

  const rootScripts = packageJson.scripts ?? {};
  const missingRootScripts = requiredRootScripts.filter(
    (scriptName) => !(scriptName in rootScripts),
  );

  if (missingRootScripts.length > 0) {
    throw new Error(`package.json is missing required scripts: ${missingRootScripts.join(", ")}`);
  }

  const workspaceFileContent = await readFile(resolve("pnpm-workspace.yaml"), "utf8");
  const missingWorkspaceGlobs = requiredWorkspaceGlobs.filter(
    (workspaceGlob) => !workspaceFileContent.includes(`- ${workspaceGlob}`),
  );

  if (missingWorkspaceGlobs.length > 0) {
    throw new Error(
      `pnpm-workspace.yaml is missing required globs: ${missingWorkspaceGlobs.join(", ")}`,
    );
  }

  const turboConfig = await readJsonFile("turbo.json");
  const turboTasks = turboConfig.tasks ?? {};
  const missingTurboTasks = requiredTurboTasks.filter((taskName) => !(taskName in turboTasks));

  if (missingTurboTasks.length > 0) {
    throw new Error(`turbo.json is missing required tasks: ${missingTurboTasks.join(", ")}`);
  }

  for (const definition of requiredPackageDefinitions) {
    const workspacePackageJson = await readJsonFile(definition.path);

    if (workspacePackageJson.name !== definition.name) {
      throw new Error(`${definition.path} must have package name ${definition.name}.`);
    }

    const workspaceScripts = workspacePackageJson.scripts ?? {};
    const missingWorkspaceScripts = definition.scripts.filter(
      (scriptName) => !(scriptName in workspaceScripts),
    );

    if (missingWorkspaceScripts.length > 0) {
      throw new Error(
        `${definition.path} is missing required scripts: ${missingWorkspaceScripts.join(", ")}`,
      );
    }
  }

  await validateSupabaseMigrationManifest();

  console.log("Workspace foundation validation passed.");
};

await main();
