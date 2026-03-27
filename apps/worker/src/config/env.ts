export type WorkerNodeEnvironment = "development" | "test" | "production";
export type WorkerLogLevel = "debug" | "info" | "warn" | "error";

export type WorkerEnvironment = Readonly<{
  heartbeatIntervalMs: number;
  logLevel: WorkerLogLevel;
  nodeEnv: WorkerNodeEnvironment;
  shutdownTimeoutMs: number;
}>;

const supportedNodeEnvironments = new Set<WorkerNodeEnvironment>([
  "development",
  "test",
  "production",
]);

const supportedLogLevels = new Set<WorkerLogLevel>(["debug", "info", "warn", "error"]);

const defaultEnvironment: WorkerEnvironment = {
  heartbeatIntervalMs: 60_000,
  logLevel: "info",
  nodeEnv: "development",
  shutdownTimeoutMs: 5_000,
};

const parsePositiveInteger = (
  envName: string,
  rawValue: string | undefined,
  fallbackValue: number,
): number => {
  if (rawValue === undefined || rawValue === "") {
    return fallbackValue;
  }

  const parsedValue = Number(rawValue);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    throw new Error(`${envName} must be a positive integer.`);
  }

  return parsedValue;
};

const parseNodeEnvironment = (rawValue: string | undefined): WorkerNodeEnvironment => {
  if (rawValue === undefined || rawValue === "") {
    return defaultEnvironment.nodeEnv;
  }

  if (!supportedNodeEnvironments.has(rawValue as WorkerNodeEnvironment)) {
    throw new Error("NODE_ENV must be one of development, test, or production.");
  }

  return rawValue as WorkerNodeEnvironment;
};

const parseLogLevel = (rawValue: string | undefined): WorkerLogLevel => {
  if (rawValue === undefined || rawValue === "") {
    return defaultEnvironment.logLevel;
  }

  if (!supportedLogLevels.has(rawValue as WorkerLogLevel)) {
    throw new Error("WORKER_LOG_LEVEL must be one of debug, info, warn, or error.");
  }

  return rawValue as WorkerLogLevel;
};

export const readWorkerEnvironment = (
  source: NodeJS.ProcessEnv = process.env,
): WorkerEnvironment => ({
  heartbeatIntervalMs: parsePositiveInteger(
    "WORKER_HEARTBEAT_INTERVAL_MS",
    source.WORKER_HEARTBEAT_INTERVAL_MS,
    defaultEnvironment.heartbeatIntervalMs,
  ),
  logLevel: parseLogLevel(source.WORKER_LOG_LEVEL),
  nodeEnv: parseNodeEnvironment(source.NODE_ENV),
  shutdownTimeoutMs: parsePositiveInteger(
    "WORKER_SHUTDOWN_TIMEOUT_MS",
    source.WORKER_SHUTDOWN_TIMEOUT_MS,
    defaultEnvironment.shutdownTimeoutMs,
  ),
});
