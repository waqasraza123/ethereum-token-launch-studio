import { constants } from "node:fs";
import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

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
  "docs/architecture/repo-structure.md",
  "docs/phases/phase-1-foundation.md",
  "docs/runbooks/local-setup.md",
  "scripts/workspace-foundation.test.mjs",
  "apps/web/package.json",
  "apps/web/tsconfig.json",
  "apps/web/next-env.d.ts",
  "apps/web/next.config.ts",
  "apps/web/eslint.config.mjs",
  "apps/web/src/app/globals.css",
  "apps/web/src/app/layout.tsx",
  "apps/web/src/app/(marketing)/page.tsx",
  "apps/web/src/app/(auth)/sign-in/page.tsx",
  "apps/web/src/app/(admin)/dashboard/page.tsx",
  "apps/web/src/components/foundation/app-header.tsx",
  "apps/web/src/components/foundation/page-shell.tsx",
  "apps/web/src/components/foundation/placeholder-panel.tsx",
  "apps/web/src/lib/branding/site-metadata.ts",
  "apps/web/src/lib/routing/route-paths.ts",
  "apps/web/src/lib/routing/route-paths.test.ts",
  "apps/worker/package.json",
  "apps/worker/tsconfig.json",
  "apps/worker/eslint.config.mjs",
  "apps/worker/src/index.ts",
  "apps/worker/src/bootstrap/start-worker.ts",
  "apps/worker/src/config/env.ts",
  "apps/worker/src/config/env.test.ts",
  "apps/worker/src/core/worker-runtime.ts",
  "packages/contracts/package.json",
  "packages/contracts/tsconfig.json",
  "packages/contracts/eslint.config.mjs",
  "packages/contracts/hardhat.config.ts",
  "packages/contracts/contracts/foundation/Phase1Sentinel.sol",
  "packages/contracts/test/Phase1Sentinel.test.ts",
  "packages/contracts/scripts/print-accounts.ts",
];

const requiredRootScripts = [
  "build",
  "contracts:compile",
  "contracts:test",
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

  console.log("Workspace foundation validation passed.");
};

await main();
