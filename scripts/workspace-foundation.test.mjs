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
    "contracts:deploy:project-token",
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

test("project token deployment bridge files exist", async () => {
  await assert.doesNotReject(async () =>
    readTextFile("packages/contracts/contracts/tokens/ProjectToken.sol")
  );
  await assert.doesNotReject(async () =>
    readTextFile("packages/contracts/scripts/deploy-project-token.ts")
  );
  await assert.doesNotReject(async () =>
    readTextFile("packages/contracts/src/config/project-token-deployment.ts")
  );
  await assert.doesNotReject(async () =>
    readTextFile("packages/contracts/src/lib/project-token-registry.ts")
  );
  await assert.doesNotReject(async () =>
    readTextFile("packages/contracts/deployments/project-token.sepolia.example.json")
  );
});

test("infra boundary includes the project token deployment bridge migration", async () => {
  await assert.doesNotReject(async () =>
    readTextFile("infra/supabase/migrations/0008_phase_3_project_token_deployment_bridge.sql")
  );
});

test("phase docs exist for the deployment bridge", async () => {
  await assert.doesNotReject(async () =>
    readTextFile("docs/phases/phase-3-project-token-deployment-bridge.md")
  );
});
