import { startWorker } from "./bootstrap/start-worker.js";

startWorker().catch((error: unknown) => {
  console.error("worker.shell.crashed", error);
  process.exitCode = 1;
});
