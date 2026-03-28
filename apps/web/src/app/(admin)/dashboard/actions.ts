"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { requireCurrentUser } from "@/lib/auth/session";
import { routePaths } from "@/lib/routing/route-paths";
import { createServerAppSupabaseClient } from "@/lib/supabase/server-app";
import { parseWorkspaceBootstrapFormData } from "@/lib/workspaces/bootstrap-input";

const buildDashboardErrorRedirect = (message: string) =>
  `${routePaths.dashboard}?error=${encodeURIComponent(message)}`;

export const bootstrapWorkspaceAction = async (formData: FormData): Promise<void> => {
  await requireCurrentUser();

  let parsedInput;

  try {
    parsedInput = parseWorkspaceBootstrapFormData(formData);
  } catch (error) {
    if (error instanceof ZodError) {
      redirect(buildDashboardErrorRedirect("Enter a valid workspace name and slug."));
    }

    throw error;
  }

  const supabase = await createServerAppSupabaseClient();

  const { error } = await supabase.rpc("bootstrap_workspace", {
    p_owner_membership_id: crypto.randomUUID(),
    p_workspace_id: crypto.randomUUID(),
    p_workspace_name: parsedInput.workspaceName,
    p_workspace_slug: parsedInput.workspaceSlug,
  });

  if (error) {
    if (error.code === "23505") {
      redirect(buildDashboardErrorRedirect("That workspace slug is already in use."));
    }

    redirect(buildDashboardErrorRedirect("Could not create the workspace right now."));
  }

  revalidatePath(routePaths.dashboard);
  redirect(`${routePaths.dashboard}?created=1`);
};

export const signOutAction = async (): Promise<void> => {
  const { createServerSupabaseClient } = await import("@/lib/supabase/server");
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(`Could not sign out the current user: ${error.message}`);
  }

  redirect(routePaths.signIn);
};
