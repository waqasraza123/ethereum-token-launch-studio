import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeProjectSlug,
  parseProjectCreateFormData,
  parseProjectDeleteFormData,
  parseProjectUpdateFormData
} from "./input.js";

test("normalizeProjectSlug lowercases and normalizes separators", () => {
  assert.equal(normalizeProjectSlug(" Alpha Launch "), "alpha-launch");
  assert.equal(normalizeProjectSlug("alpha___launch"), "alpha-launch");
});

test("parseProjectCreateFormData parses valid project input", () => {
  const formData = new FormData();
  formData.set("workspaceSlug", "studio-alpha");
  formData.set("projectName", "Alpha Launch");
  formData.set("projectSlug", "Alpha Launch");
  formData.set("projectDescription", "Initial launch project");

  assert.deepEqual(parseProjectCreateFormData(formData), {
    projectDescription: "Initial launch project",
    projectName: "Alpha Launch",
    projectSlug: "alpha-launch",
    workspaceSlug: "studio-alpha"
  });
});

test("parseProjectUpdateFormData parses valid update payload", () => {
  const formData = new FormData();
  formData.set("workspaceSlug", "studio-alpha");
  formData.set("currentProjectSlug", "alpha-launch");
  formData.set("projectName", "Alpha Launch V2");
  formData.set("projectSlug", "Alpha Launch V2");
  formData.set("projectDescription", "Updated description");

  assert.deepEqual(parseProjectUpdateFormData(formData), {
    currentProjectSlug: "alpha-launch",
    projectDescription: "Updated description",
    projectName: "Alpha Launch V2",
    projectSlug: "alpha-launch-v2",
    workspaceSlug: "studio-alpha"
  });
});

test("parseProjectDeleteFormData parses a valid delete payload", () => {
  const formData = new FormData();
  formData.set("workspaceSlug", "studio-alpha");
  formData.set("currentProjectSlug", "alpha-launch");

  assert.deepEqual(parseProjectDeleteFormData(formData), {
    currentProjectSlug: "alpha-launch",
    workspaceSlug: "studio-alpha"
  });
});

test("parseProjectCreateFormData converts blank descriptions to null", () => {
  const formData = new FormData();
  formData.set("workspaceSlug", "studio-alpha");
  formData.set("projectName", "Alpha Launch");
  formData.set("projectSlug", "alpha-launch");
  formData.set("projectDescription", "   ");

  assert.deepEqual(parseProjectCreateFormData(formData), {
    projectDescription: null,
    projectName: "Alpha Launch",
    projectSlug: "alpha-launch",
    workspaceSlug: "studio-alpha"
  });
});
