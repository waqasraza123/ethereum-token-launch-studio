import assert from "node:assert/strict";
import test from "node:test";
import { readWorkerEnvironment } from "./env.js";

test("readWorkerEnvironment returns defaults when optional values are absent", () => {
  assert.deepEqual(
    readWorkerEnvironment({
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
      SUPABASE_URL: "https://example.supabase.co"
    }),
    {
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
      SUPABASE_URL: "https://example.supabase.co",
      TOKEN_LAUNCH_POLL_INTERVAL_MS: 10000,
      WORKER_HEARTBEAT_INTERVAL_MS: 60000,
      WORKER_LOG_LEVEL: "info",
      WORKER_SHUTDOWN_TIMEOUT_MS: 5000
    }
  );
});

test("readWorkerEnvironment returns explicit values when present", () => {
  assert.deepEqual(
    readWorkerEnvironment({
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
      SUPABASE_URL: "https://example.supabase.co",
      TOKEN_LAUNCH_POLL_INTERVAL_MS: "15000",
      WORKER_HEARTBEAT_INTERVAL_MS: "120000",
      WORKER_LOG_LEVEL: "debug",
      WORKER_SHUTDOWN_TIMEOUT_MS: "7000"
    }),
    {
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
      SUPABASE_URL: "https://example.supabase.co",
      TOKEN_LAUNCH_POLL_INTERVAL_MS: 15000,
      WORKER_HEARTBEAT_INTERVAL_MS: 120000,
      WORKER_LOG_LEVEL: "debug",
      WORKER_SHUTDOWN_TIMEOUT_MS: 7000
    }
  );
});

test("readWorkerEnvironment rejects invalid positive integers", () => {
  assert.throws(() =>
    readWorkerEnvironment({
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
      SUPABASE_URL: "https://example.supabase.co",
      TOKEN_LAUNCH_POLL_INTERVAL_MS: "0"
    })
  );
});

test("readWorkerEnvironment rejects invalid log levels", () => {
  assert.throws(() =>
    readWorkerEnvironment({
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
      SUPABASE_URL: "https://example.supabase.co",
      WORKER_LOG_LEVEL: "verbose"
    })
  );
});
