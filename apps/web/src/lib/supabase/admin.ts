import { createClient } from "@supabase/supabase-js";
import { getServerWebEnvironment } from "@/lib/env/server";

export const createAdminSupabaseClient = () => {
  const environment = getServerWebEnvironment();

  return createClient(environment.NEXT_PUBLIC_SUPABASE_URL, environment.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
    db: {
      schema: "app_public",
    },
  });
};
