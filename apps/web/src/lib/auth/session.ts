import { redirect } from "next/navigation";
import { routePaths } from "@/lib/routing/route-paths";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type AuthenticatedUser = Readonly<{
  email: string | null;
  id: string;
}>;

export const getCurrentUser = async (): Promise<AuthenticatedUser | null> => {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return {
    email: user.email ?? null,
    id: user.id,
  };
};

export const requireCurrentUser = async (): Promise<AuthenticatedUser> => {
  const user = await getCurrentUser();

  if (!user) {
    redirect(routePaths.signIn);
  }

  return user;
};
