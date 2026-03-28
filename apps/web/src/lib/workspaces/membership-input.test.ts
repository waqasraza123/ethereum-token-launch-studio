import assert from "node:assert/strict";
import test from "node:test";
import {
  parseWorkspaceMemberInviteFormData,
  parseWorkspaceMemberRemovalFormData,
  parseWorkspaceMemberRoleUpdateFormData
} from "./membership-input.js";

test("parseWorkspaceMemberInviteFormData parses email role and workspace slug", () => {
  const formData = new FormData();
  formData.set("memberEmail", " Teammate@example.com ");
  formData.set("role", "viewer");
  formData.set("workspaceSlug", "studio-alpha");

  assert.deepEqual(parseWorkspaceMemberInviteFormData(formData), {
    memberEmail: "teammate@example.com",
    role: "viewer",
    workspaceSlug: "studio-alpha"
  });
});

test("parseWorkspaceMemberRoleUpdateFormData parses a valid membership update payload", () => {
  const formData = new FormData();
  formData.set("role", "ops_manager");
  formData.set("workspaceMemberId", "20000000-0000-0000-0000-000000000001");
  formData.set("workspaceSlug", "studio-alpha");

  assert.deepEqual(parseWorkspaceMemberRoleUpdateFormData(formData), {
    role: "ops_manager",
    workspaceMemberId: "20000000-0000-0000-0000-000000000001",
    workspaceSlug: "studio-alpha"
  });
});

test("parseWorkspaceMemberRemovalFormData parses a valid removal payload", () => {
  const formData = new FormData();
  formData.set("targetAuthUserId", "00000000-0000-0000-0000-000000000002");
  formData.set("workspaceMemberId", "20000000-0000-0000-0000-000000000002");
  formData.set("workspaceSlug", "studio-alpha");

  assert.deepEqual(parseWorkspaceMemberRemovalFormData(formData), {
    targetAuthUserId: "00000000-0000-0000-0000-000000000002",
    workspaceMemberId: "20000000-0000-0000-0000-000000000002",
    workspaceSlug: "studio-alpha"
  });
});
