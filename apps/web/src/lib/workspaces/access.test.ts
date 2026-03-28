import assert from "node:assert/strict";
import test from "node:test";
import {
  canCreateProjectsForRole,
  canManageWorkspaceMembersForRole
} from "./access.js";

test("canCreateProjectsForRole only allows owner and ops_manager", () => {
  assert.equal(canCreateProjectsForRole("owner"), true);
  assert.equal(canCreateProjectsForRole("ops_manager"), true);
  assert.equal(canCreateProjectsForRole("finance_manager"), false);
  assert.equal(canCreateProjectsForRole("viewer"), false);
});

test("canManageWorkspaceMembersForRole only allows owner", () => {
  assert.equal(canManageWorkspaceMembersForRole("owner"), true);
  assert.equal(canManageWorkspaceMembersForRole("ops_manager"), false);
  assert.equal(canManageWorkspaceMembersForRole("finance_manager"), false);
  assert.equal(canManageWorkspaceMembersForRole("viewer"), false);
});
