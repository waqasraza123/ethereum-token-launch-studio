import { z } from "zod";
import { readPublicWebEnvironment } from "./public";

const ServerWebEnvironmentSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().trim().min(1),
});

export type ServerWebEnvironment = Readonly<
  ReturnType<typeof readPublicWebEnvironment> & z.infer<typeof ServerWebEnvironmentSchema>
>;

let cachedServerWebEnvironment: ServerWebEnvironment | null = null;

export const readServerWebEnvironment = (
  source: Record<string, string | undefined> = process.env,
): ServerWebEnvironment => ({
  ...readPublicWebEnvironment(source),
  ...ServerWebEnvironmentSchema.parse({
    SUPABASE_SERVICE_ROLE_KEY: source.SUPABASE_SERVICE_ROLE_KEY,
  }),
});

export const getServerWebEnvironment = (): ServerWebEnvironment => {
  cachedServerWebEnvironment ??= readServerWebEnvironment();
  return cachedServerWebEnvironment;
};
