import type { WorkerEnvironment } from "../config/env.js";

export type WorkerRuntime = Readonly<{
  heartbeatIntervalMs: number;
  logLevel: WorkerEnvironment["WORKER_LOG_LEVEL"];
  shutdownTimeoutMs: number;
  tokenLaunchPollIntervalMs: number;
}>;

export const createWorkerRuntime = (environment: WorkerEnvironment): WorkerRuntime => ({
  heartbeatIntervalMs: environment.WORKER_HEARTBEAT_INTERVAL_MS,
  logLevel: environment.WORKER_LOG_LEVEL,
  shutdownTimeoutMs: environment.WORKER_SHUTDOWN_TIMEOUT_MS,
  tokenLaunchPollIntervalMs: environment.TOKEN_LAUNCH_POLL_INTERVAL_MS
});
