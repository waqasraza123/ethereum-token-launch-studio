import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getPublicWebEnvironment } from "@/lib/env/public";

export const createServerSupabaseClient = async () => {
  const environment = getPublicWebEnvironment();
  const cookieStore = await cookies();

  return createServerClient(
    environment.NEXT_PUBLIC_SUPABASE_URL,
    environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const cookie of cookiesToSet) {
              cookieStore.set(cookie.name, cookie.value, cookie.options);
            }
          } catch {
            return;
          }
        },
      },
    },
  );
};
