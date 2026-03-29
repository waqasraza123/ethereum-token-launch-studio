import { z } from "zod";

const WorkerEnvironmentSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().trim().min(1),
  SUPABASE_URL: z.string().url(),
  TOKEN_LAUNCH_HEARTBEAT_INTERVAL_MS: z.coerce.number().int().positive().default(15000),
  TOKEN_LAUNCH_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(10000),
  TOKEN_LAUNCH_STALE_AFTER_MS: z.coerce.number().int().positive().default(1800000),
  WORKER_HEARTBEAT_INTERVAL_MS: z.coerce.number().int().positive().default(60000),
  WORKER_LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  WORKER_SHUTDOWN_TIMEOUT_MS: z.coerce.number().int().positive().default(5000)
});

export type WorkerEnvironment = Readonly<z.infer<typeof WorkerEnvironmentSchema>>;

export const readWorkerEnvironment = (
  source: Record<string, string | undefined> = process.env
): WorkerEnvironment =>
  WorkerEnvironmentSchema.parse({
    SUPABASE_SERVICE_ROLE_KEY: source.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_URL: source.SUPABASE_URL,
    TOKEN_LAUNCH_HEARTBEAT_INTERVAL_MS: source.TOKEN_LAUNCH_HEARTBEAT_INTERVAL_MS,
    TOKEN_LAUNCH_POLL_INTERVAL_MS: source.TOKEN_LAUNCH_POLL_INTERVAL_MS,
    TOKEN_LAUNCH_STALE_AFTER_MS: source.TOKEN_LAUNCH_STALE_AFTER_MS,
    WORKER_HEARTBEAT_INTERVAL_MS: source.WORKER_HEARTBEAT_INTERVAL_MS,
    WORKER_LOG_LEVEL: source.WORKER_LOG_LEVEL,
    WORKER_SHUTDOWN_TIMEOUT_MS: source.WORKER_SHUTDOWN_TIMEOUT_MS
  });
