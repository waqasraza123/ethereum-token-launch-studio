import assert from "node:assert/strict";
import test from "node:test";
import { readWorkerEnvironment } from "./env.js";

test("readWorkerEnvironment returns defaults when optional values are absent", () => {
  const environment = readWorkerEnvironment({
    SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
    SUPABASE_URL: "https://example.supabase.co"
  });

  assert.deepEqual(environment, {
    SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
    SUPABASE_URL: "https://example.supabase.co",
    TOKEN_LAUNCH_HEARTBEAT_INTERVAL_MS: 15000,
    TOKEN_LAUNCH_POLL_INTERVAL_MS: 10000,
    TOKEN_LAUNCH_STALE_AFTER_MS: 1800000,
    WORKER_HEARTBEAT_INTERVAL_MS: 60000,
    WORKER_LOG_LEVEL: "info",
    WORKER_SHUTDOWN_TIMEOUT_MS: 5000
  });
});

test("readWorkerEnvironment returns explicit values when present", () => {
  const environment = readWorkerEnvironment({
    SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
    SUPABASE_URL: "https://example.supabase.co",
    TOKEN_LAUNCH_HEARTBEAT_INTERVAL_MS: "20000",
    TOKEN_LAUNCH_POLL_INTERVAL_MS: "12000",
    TOKEN_LAUNCH_STALE_AFTER_MS: "2400000",
    WORKER_HEARTBEAT_INTERVAL_MS: "90000",
    WORKER_LOG_LEVEL: "debug",
    WORKER_SHUTDOWN_TIMEOUT_MS: "8000"
  });

  assert.deepEqual(environment, {
    SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
    SUPABASE_URL: "https://example.supabase.co",
    TOKEN_LAUNCH_HEARTBEAT_INTERVAL_MS: 20000,
    TOKEN_LAUNCH_POLL_INTERVAL_MS: 12000,
    TOKEN_LAUNCH_STALE_AFTER_MS: 2400000,
    WORKER_HEARTBEAT_INTERVAL_MS: 90000,
    WORKER_LOG_LEVEL: "debug",
    WORKER_SHUTDOWN_TIMEOUT_MS: 8000
  });
});

test("readWorkerEnvironment rejects invalid positive integers", () => {
  assert.throws(() =>
    readWorkerEnvironment({
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
      SUPABASE_URL: "https://example.supabase.co",
      TOKEN_LAUNCH_HEARTBEAT_INTERVAL_MS: "0"
    })
  );

  assert.throws(() =>
    readWorkerEnvironment({
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
      SUPABASE_URL: "https://example.supabase.co",
      TOKEN_LAUNCH_STALE_AFTER_MS: "-1"
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
