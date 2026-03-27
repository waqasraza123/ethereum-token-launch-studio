import assert from "node:assert/strict";
import test from "node:test";
import { readPublicWebEnvironment } from "./public.js";

test("readPublicWebEnvironment parses the required public values", () => {
  const environment = readPublicWebEnvironment({
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example",
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  });

  assert.deepEqual(environment, {
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example",
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  });
});

test("readPublicWebEnvironment rejects missing publishable keys", () => {
  assert.throws(
    () =>
      readPublicWebEnvironment({
        NEXT_PUBLIC_APP_URL: "http://localhost:3000",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "",
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      }),
    /NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/,
  );
});
