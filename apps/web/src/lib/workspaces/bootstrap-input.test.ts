import assert from "node:assert/strict";
import test from "node:test";
import { normalizeWorkspaceSlug, parseWorkspaceBootstrapFormData } from "./bootstrap-input.js";

test("normalizeWorkspaceSlug lowercases and collapses invalid separators", () => {
  assert.equal(normalizeWorkspaceSlug("  Studio Alpha Launch  "), "studio-alpha-launch");
  assert.equal(normalizeWorkspaceSlug("alpha___beta"), "alpha-beta");
});

test("parseWorkspaceBootstrapFormData parses a valid form payload", () => {
  const formData = new FormData();
  formData.set("workspaceName", "Studio Alpha");
  formData.set("workspaceSlug", "Studio Alpha");

  assert.deepEqual(parseWorkspaceBootstrapFormData(formData), {
    workspaceName: "Studio Alpha",
    workspaceSlug: "studio-alpha",
  });
});

test("parseWorkspaceBootstrapFormData rejects invalid slugs", () => {
  const formData = new FormData();
  formData.set("workspaceName", "Studio Alpha");
  formData.set("workspaceSlug", "!!!");

  assert.throws(() => parseWorkspaceBootstrapFormData(formData));
});
