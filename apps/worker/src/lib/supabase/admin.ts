import { createClient } from "@supabase/supabase-js";
import type { WorkerEnvironment } from "../../config/env.js";

export const createWorkerAdminSupabaseClient = (environment: WorkerEnvironment) =>
  createClient(environment.SUPABASE_URL, environment.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false
    },
    db: {
      schema: "app_public"
    }
  });
