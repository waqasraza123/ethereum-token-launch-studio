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
    "validate:foundation"
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

test("workspace members route files exist", async () => {
  await assert.doesNotReject(async () =>
    readTextFile("apps/web/src/app/(admin)/dashboard/[workspaceSlug]/members/actions.ts")
  );
  await assert.doesNotReject(async () =>
    readTextFile("apps/web/src/app/(admin)/dashboard/[workspaceSlug]/members/page.tsx")
  );
  await assert.doesNotReject(async () =>
    readTextFile("apps/web/src/components/workspaces/workspace-members-shell.tsx")
  );
});

test("infra boundary includes the membership management migration", async () => {
  await assert.doesNotReject(async () =>
    readTextFile("infra/supabase/migrations/0006_phase_2_membership_management.sql")
  );
});

test("phase docs exist for membership management", async () => {
  await assert.doesNotReject(async () =>
    readTextFile("docs/phases/phase-2-membership-management.md")
  );
});
