import assert from "node:assert/strict";
import test from "node:test";
import {
  getWorkspaceDashboardPath,
  getWorkspaceMembersPath,
  getWorkspaceProjectContractsPath,
  getWorkspaceProjectNewPath,
  getWorkspaceProjectPath,
  getWorkspaceProjectSettingsPath,
  routePaths
} from "./route-paths.js";

test("route paths are unique and stable", () => {
  const routeValues = Object.values(routePaths);

  assert.deepEqual(routePaths, {
    dashboard: "/dashboard",
    home: "/",
    signIn: "/sign-in"
  });
  assert.equal(new Set(routeValues).size, routeValues.length);
});

test("workspace route helpers build the expected paths", () => {
  assert.equal(getWorkspaceDashboardPath("studio-alpha"), "/dashboard/studio-alpha");
  assert.equal(getWorkspaceMembersPath("studio-alpha"), "/dashboard/studio-alpha/members");
  assert.equal(getWorkspaceProjectNewPath("studio-alpha"), "/dashboard/studio-alpha/projects/new");
  assert.equal(
    getWorkspaceProjectPath("studio-alpha", "alpha-launch"),
    "/dashboard/studio-alpha/projects/alpha-launch"
  );
  assert.equal(
    getWorkspaceProjectSettingsPath("studio-alpha", "alpha-launch"),
    "/dashboard/studio-alpha/projects/alpha-launch/settings"
  );
  assert.equal(
    getWorkspaceProjectContractsPath("studio-alpha", "alpha-launch"),
    "/dashboard/studio-alpha/projects/alpha-launch/contracts"
  );
});
