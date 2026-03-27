import process from "node:process";
import { readWorkerEnvironment } from "../config/env.js";
import { createWorkerRuntime } from "../core/worker-runtime.js";

const shutdownSignals = ["SIGINT", "SIGTERM"] as const;

const waitForShutdownSignal = (): Promise<NodeJS.Signals> =>
  new Promise((resolve) => {
    const cleanup = () => {
      for (const signal of shutdownSignals) {
        const handler = signalHandlers[signal];
        process.off(signal, handler);
      }
    };

    const signalHandlers: Record<(typeof shutdownSignals)[number], () => void> = {
      SIGINT: () => {
        cleanup();
        resolve("SIGINT");
      },
      SIGTERM: () => {
        cleanup();
        resolve("SIGTERM");
      },
    };

    for (const signal of shutdownSignals) {
      process.on(signal, signalHandlers[signal]);
    }
  });

export const startWorker = async (): Promise<void> => {
  const environment = readWorkerEnvironment();
  const runtime = createWorkerRuntime(environment);

  await runtime.start();

  const receivedSignal = await waitForShutdownSignal();

  console.info("worker.shell.shutdown_requested", {
    signal: receivedSignal,
  });

  const forcedExitTimer = setTimeout(() => {
    console.error("worker.shell.shutdown_timeout", {
      timeoutMs: environment.shutdownTimeoutMs,
    });
    process.exit(1);
  }, environment.shutdownTimeoutMs);

  try {
    await runtime.stop();
  } finally {
    clearTimeout(forcedExitTimer);
  }
};
