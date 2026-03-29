import assert from "node:assert/strict";
import test from "node:test";
import { parseProjectTokenLaunchCancelFormData } from "./cancel-input.js";

test("parseProjectTokenLaunchCancelFormData parses a valid cancel payload", () => {
  const formData = new FormData();
  formData.set("workspaceSlug", "studio-alpha");
  formData.set("currentProjectSlug", "alpha-launch");
  formData.set("requestId", "50000000-0000-4000-8000-000000000001");

  assert.deepEqual(parseProjectTokenLaunchCancelFormData(formData), {
    currentProjectSlug: "alpha-launch",
    requestId: "50000000-0000-4000-8000-000000000001",
    workspaceSlug: "studio-alpha"
  });
});
