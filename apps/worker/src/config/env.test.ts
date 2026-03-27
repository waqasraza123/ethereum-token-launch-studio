import assert from "node:assert/strict";
import test from "node:test";
import { readWorkerEnvironment } from "./env.js";

test("readWorkerEnvironment returns defaults when optional values are absent", () => {
  assert.deepEqual(readWorkerEnvironment({}), {
    heartbeatIntervalMs: 60_000,
    logLevel: "info",
    nodeEnv: "development",
    shutdownTimeoutMs: 5_000,
  });
});

test("readWorkerEnvironment returns explicit values when present", () => {
  assert.deepEqual(
    readWorkerEnvironment({
      NODE_ENV: "production",
      WORKER_HEARTBEAT_INTERVAL_MS: "30000",
      WORKER_LOG_LEVEL: "warn",
      WORKER_SHUTDOWN_TIMEOUT_MS: "12000",
    }),
    {
      heartbeatIntervalMs: 30_000,
      logLevel: "warn",
      nodeEnv: "production",
      shutdownTimeoutMs: 12_000,
    },
  );
});

test("readWorkerEnvironment rejects invalid positive integers", () => {
  assert.throws(
    () =>
      readWorkerEnvironment({
        WORKER_HEARTBEAT_INTERVAL_MS: "0",
      }),
    /WORKER_HEARTBEAT_INTERVAL_MS must be a positive integer/,
  );
});

test("readWorkerEnvironment rejects invalid log levels", () => {
  assert.throws(
    () =>
      readWorkerEnvironment({
        WORKER_LOG_LEVEL: "verbose",
      }),
    /WORKER_LOG_LEVEL must be one of debug, info, warn, or error/,
  );
});
