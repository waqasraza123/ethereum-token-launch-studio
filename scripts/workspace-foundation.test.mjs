import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const readTextFile = async (relativePath) => readFile(resolve(relativePath), "utf8");

test("token launch reliability files exist", async () => {
  await assert.doesNotReject(async () =>
    readTextFile("docs/phases/phase-3-token-launch-reliability.md")
  );
  await assert.doesNotReject(async () =>
    readTextFile("apps/web/src/components/projects/project-token-launch-retry-form.tsx")
  );
  await assert.doesNotReject(async () =>
    readTextFile("apps/worker/src/features/project-token-launch/process-launch-requests.ts")
  );
  await assert.doesNotReject(async () =>
    readTextFile("infra/supabase/migrations/0010_phase_3_project_token_launch_reliability.sql")
  );
});
