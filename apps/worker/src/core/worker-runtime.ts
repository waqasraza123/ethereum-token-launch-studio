import type { WorkerEnvironment } from "../config/env.js";

export type WorkerRuntimeStatus = "idle" | "running" | "stopping" | "stopped";

export type WorkerRuntime = Readonly<{
  getStatus: () => WorkerRuntimeStatus;
  start: () => Promise<void>;
  stop: () => Promise<void>;
}>;

type WorkerRuntimeOutput = Pick<Console, "info">;

export const createWorkerRuntime = (
  environment: WorkerEnvironment,
  output: WorkerRuntimeOutput = console,
): WorkerRuntime => {
  let heartbeatTimer: NodeJS.Timeout | null = null;
  let status: WorkerRuntimeStatus = "idle";

  const clearHeartbeatTimer = () => {
    if (heartbeatTimer !== null) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  };

  return {
    getStatus: () => status,
    start: async () => {
      if (status === "running") {
        return;
      }

      status = "running";

      output.info("worker.shell.ready", {
        heartbeatIntervalMs: environment.heartbeatIntervalMs,
        logLevel: environment.logLevel,
        nodeEnv: environment.nodeEnv,
      });

      heartbeatTimer = setInterval(() => {
        output.info("worker.shell.heartbeat", {
          status,
        });
      }, environment.heartbeatIntervalMs);
    },
    stop: async () => {
      if (status === "stopped") {
        return;
      }

      status = "stopping";
      clearHeartbeatTimer();

      output.info("worker.shell.stopped", {
        status: "stopped",
      });

      status = "stopped";
    },
  };
};
