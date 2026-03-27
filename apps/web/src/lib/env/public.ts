import { z } from "zod";

const PublicWebEnvironmentSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().trim().min(1),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
});

export type PublicWebEnvironment = Readonly<z.infer<typeof PublicWebEnvironmentSchema>>;

let cachedPublicWebEnvironment: PublicWebEnvironment | null = null;

export const readPublicWebEnvironment = (
  source: Record<string, string | undefined> = process.env,
): PublicWebEnvironment =>
  PublicWebEnvironmentSchema.parse({
    NEXT_PUBLIC_APP_URL: source.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: source.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SUPABASE_URL: source.NEXT_PUBLIC_SUPABASE_URL,
  });

export const getPublicWebEnvironment = (): PublicWebEnvironment => {
  cachedPublicWebEnvironment ??= readPublicWebEnvironment();
  return cachedPublicWebEnvironment;
};
