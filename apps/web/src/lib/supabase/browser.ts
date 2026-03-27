import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getPublicWebEnvironment } from "@/lib/env/public";

let cachedBrowserSupabaseClient: SupabaseClient | null = null;

export const createBrowserSupabaseClient = (): SupabaseClient => {
  const environment = getPublicWebEnvironment();

  cachedBrowserSupabaseClient ??= createBrowserClient(
    environment.NEXT_PUBLIC_SUPABASE_URL,
    environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );

  return cachedBrowserSupabaseClient;
};
