import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const readTextFile = async (relativePath) => readFile(resolve(relativePath), "utf8");

const readJsonFile = async (relativePath) => {
  const content = await readTextFile(relativePath);
  return JSON.parse(content);
};

test("root package metadata is locked", async () => {
  const packageJson = await readJsonFile("package.json");

  assert.equal(packageJson.name, "ethereum-token-launch-studio");
  assert.equal(packageJson.private, true);
  assert.equal(packageJson.packageManager, "pnpm@10.11.1");
  assert.deepEqual(Object.keys(packageJson.scripts).sort(), [
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
    "test",
    "typecheck",
    "validate:foundation",
  ]);
});

test("workspace manifest includes future app and package boundaries", async () => {
  const workspaceManifest = await readTextFile("pnpm-workspace.yaml");

  assert.match(workspaceManifest, /apps\/\*/);
  assert.match(workspaceManifest, /packages\/\*/);
});

test("web worker and contracts workspace manifests are present", async () => {
  const webPackageJson = await readJsonFile("apps/web/package.json");
  const workerPackageJson = await readJsonFile("apps/worker/package.json");
  const contractsPackageJson = await readJsonFile("packages/contracts/package.json");

  assert.equal(webPackageJson.name, "@token-launch-studio/web");
  assert.equal(workerPackageJson.name, "@token-launch-studio/worker");
  assert.equal(contractsPackageJson.name, "@token-launch-studio/contracts");
});

test("workspace and project route files exist", async () => {
  await assert.doesNotReject(async () =>
    readTextFile("apps/web/src/app/(admin)/dashboard/[workspaceSlug]/page.tsx"),
  );
  await assert.doesNotReject(async () =>
    readTextFile("apps/web/src/app/(admin)/dashboard/[workspaceSlug]/projects/new/page.tsx"),
  );
  await assert.doesNotReject(async () =>
    readTextFile(
      "apps/web/src/app/(admin)/dashboard/[workspaceSlug]/projects/[projectSlug]/page.tsx",
    ),
  );
});

test("infra boundary includes the workspace project flow migration", async () => {
  await assert.doesNotReject(async () =>
    readTextFile("infra/supabase/migrations/0004_phase_2_workspace_project_flows.sql"),
  );
});

test("phase docs exist for foundation core schema auth spine and workspace project flows", async () => {
  await assert.doesNotReject(async () => readTextFile("docs/phases/phase-1-foundation.md"));
  await assert.doesNotReject(async () => readTextFile("docs/phases/phase-2-core-schema.md"));
  await assert.doesNotReject(async () => readTextFile("docs/phases/phase-2-auth-spine.md"));
  await assert.doesNotReject(async () =>
    readTextFile("docs/phases/phase-2-workspace-project-flows.md"),
  );
});

test("ci workflow runs formatting lint typecheck tests contract checks db validation db replay build and validation", async () => {
  const workflowContent = await readTextFile(".github/workflows/ci.yml");

  assert.match(workflowContent, /pnpm format:check/);
  assert.match(workflowContent, /pnpm lint/);
  assert.match(workflowContent, /pnpm typecheck/);
  assert.match(workflowContent, /pnpm test/);
  assert.match(workflowContent, /pnpm contracts:compile/);
  assert.match(workflowContent, /pnpm contracts:test/);
  assert.match(workflowContent, /pnpm db:validate/);
  assert.match(workflowContent, /pnpm db:replay:check/);
  assert.match(workflowContent, /pnpm build/);
  assert.match(workflowContent, /pnpm validate:foundation/);
});
