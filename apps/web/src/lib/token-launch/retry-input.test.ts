import assert from "node:assert/strict";
import test from "node:test";
import { parseProjectTokenLaunchRetryFormData } from "./retry-input.js";

test("parseProjectTokenLaunchRetryFormData parses a valid retry payload", () => {
  const formData = new FormData();
  formData.set("workspaceSlug", "studio-alpha");
  formData.set("currentProjectSlug", "alpha-launch");
  formData.set("requestId", "50000000-0000-0000-0000-000000000001");

  assert.deepEqual(parseProjectTokenLaunchRetryFormData(formData), {
    currentProjectSlug: "alpha-launch",
    requestId: "50000000-0000-0000-0000-000000000001",
    workspaceSlug: "studio-alpha"
  });
});
