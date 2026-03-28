import { createServerSupabaseClient } from "./server";

export const createServerAppSupabaseClient = async () =>
  (await createServerSupabaseClient()).schema("app_public");
