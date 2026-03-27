"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { requireCurrentUser } from "@/lib/auth/session";
import { routePaths } from "@/lib/routing/route-paths";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { WorkspaceBootstrapInput } from "@/lib/workspaces/bootstrap-input";
import { parseWorkspaceBootstrapFormData } from "@/lib/workspaces/bootstrap-input";

const buildDashboardErrorRedirect = (message: string) =>
  `${routePaths.dashboard}?error=${encodeURIComponent(message)}`;

export const bootstrapWorkspaceAction = async (formData: FormData): Promise<void> => {
  const currentUser = await requireCurrentUser();

  let parsedInput: WorkspaceBootstrapInput;

  try {
    parsedInput = parseWorkspaceBootstrapFormData(formData);
  } catch (error) {
    if (error instanceof ZodError) {
      redirect(buildDashboardErrorRedirect("Enter a valid workspace name and slug."));
    }

    throw error;
  }

  const supabase = createAdminSupabaseClient();

  const { error } = await supabase.rpc("bootstrap_workspace", {
    p_owner_auth_user_id: currentUser.id,
    p_owner_membership_id: crypto.randomUUID(),
    p_workspace_id: crypto.randomUUID(),
    p_workspace_name: parsedInput.workspaceName,
    p_workspace_slug: parsedInput.workspaceSlug,
  });

  if (error) {
    if (error.code === "23505") {
      redirect(buildDashboardErrorRedirect("That workspace slug is already in use."));
    }

    redirect(buildDashboardErrorRedirect("Could not create the first workspace right now."));
  }

  revalidatePath(routePaths.dashboard);
  redirect(`${routePaths.dashboard}?created=1`);
};

export const signOutAction = async (): Promise<void> => {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(`Could not sign out the current user: ${error.message}`);
  }

  redirect(routePaths.signIn);
};
