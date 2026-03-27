import assert from "node:assert/strict";
import test from "node:test";
import { readServerWebEnvironment } from "./server.js";

test("readServerWebEnvironment merges public and server-only values", () => {
  const environment = readServerWebEnvironment({
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example",
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
  });

  assert.deepEqual(environment, {
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example",
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
  });
});

test("readServerWebEnvironment rejects missing service role keys", () => {
  assert.throws(
    () =>
      readServerWebEnvironment({
        NEXT_PUBLIC_APP_URL: "http://localhost:3000",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example",
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        SUPABASE_SERVICE_ROLE_KEY: "",
      }),
    /SUPABASE_SERVICE_ROLE_KEY/,
  );
});
