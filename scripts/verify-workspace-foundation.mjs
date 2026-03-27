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
  "scripts/verify-workspace-foundation.mjs",
  "scripts/workspace-foundation.test.mjs",
];

const requiredScripts = [
  "format",
  "format:check",
  "lint",
  "typecheck",
  "test",
  "validate:foundation",
];

const requiredWorkspaceGlobs = ["apps/*", "packages/*"];

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

  const packageScripts = packageJson.scripts ?? {};
  const missingScripts = requiredScripts.filter((scriptName) => !(scriptName in packageScripts));

  if (missingScripts.length > 0) {
    throw new Error(`package.json is missing required scripts: ${missingScripts.join(", ")}`);
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
  const missingTurboTasks = ["build", "lint", "typecheck", "test"].filter(
    (taskName) => !(taskName in turboTasks),
  );

  if (missingTurboTasks.length > 0) {
    throw new Error(`turbo.json is missing required tasks: ${missingTurboTasks.join(", ")}`);
  }

  console.log("Workspace foundation validation passed.");
};

await main();
