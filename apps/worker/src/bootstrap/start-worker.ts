import { readWorkerEnvironment } from "../config/env.js";
import { startProjectTokenLaunchProcessor } from "../features/project-token-launch/process-launch-requests.js";

export const startWorker = async () => {
  const environment = readWorkerEnvironment();
  const processor = await startProjectTokenLaunchProcessor(environment);

  console.info("worker.shell.ready", {
    tokenLaunchPollIntervalMs: environment.TOKEN_LAUNCH_POLL_INTERVAL_MS,
    workerId: processor.workerId
  });

  const shutdown = async (signal: string) => {
    console.info("worker.shutdown.requested", { signal, workerId: processor.workerId });
    await processor.stop();
    process.exit(0);
  };

  process.on("SIGINT", () => {
    void shutdown("SIGINT");
  });

  process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
  });
};
