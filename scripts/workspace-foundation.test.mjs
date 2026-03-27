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

test("core docs exist for repo structure, phase tracking, and local setup", async () => {
  await assert.doesNotReject(async () => readTextFile("docs/architecture/repo-structure.md"));
  await assert.doesNotReject(async () => readTextFile("docs/phases/phase-1-foundation.md"));
  await assert.doesNotReject(async () => readTextFile("docs/runbooks/local-setup.md"));
});

test("ci workflow runs the root foundation checks", async () => {
  const workflowContent = await readTextFile(".github/workflows/ci.yml");

  assert.match(workflowContent, /pnpm format:check/);
  assert.match(workflowContent, /pnpm lint/);
  assert.match(workflowContent, /pnpm typecheck/);
  assert.match(workflowContent, /pnpm test/);
  assert.match(workflowContent, /pnpm validate:foundation/);
});
