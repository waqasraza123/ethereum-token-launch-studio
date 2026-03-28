"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { requireCurrentUser } from "@/lib/auth/session";
import type { ProjectCreateInput } from "@/lib/projects/input";
import { parseProjectCreateFormData } from "@/lib/projects/input";
import {
  getWorkspaceDashboardPath,
  getWorkspaceProjectNewPath,
  getWorkspaceProjectPath,
  routePaths,
} from "@/lib/routing/route-paths";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { canCreateProjectsForRole, getWorkspaceAccessBySlug } from "@/lib/workspaces/access";

const buildProjectCreationErrorRedirect = (workspaceSlug: string, message: string) =>
  `${getWorkspaceProjectNewPath(workspaceSlug)}?error=${encodeURIComponent(message)}`;

export const createProjectAction = async (formData: FormData): Promise<void> => {
  const currentUser = await requireCurrentUser();

  let parsedInput: ProjectCreateInput;

  try {
    parsedInput = parseProjectCreateFormData(formData);
  } catch (error) {
    if (error instanceof ZodError) {
      const workspaceSlug =
        typeof formData.get("workspaceSlug") === "string"
          ? String(formData.get("workspaceSlug"))
          : "";

      if (workspaceSlug !== "") {
        redirect(
          buildProjectCreationErrorRedirect(
            workspaceSlug,
            "Enter a valid project name, slug, and description.",
          ),
        );
      }

      redirect(routePaths.dashboard);
    }

    throw error;
  }

  const workspaceAccess = await getWorkspaceAccessBySlug(currentUser.id, parsedInput.workspaceSlug);

  if (!workspaceAccess) {
    redirect(routePaths.dashboard);
  }

  if (!canCreateProjectsForRole(workspaceAccess.role)) {
    redirect(
      `${getWorkspaceDashboardPath(parsedInput.workspaceSlug)}?error=${encodeURIComponent(
        "Your current role cannot create projects in this workspace.",
      )}`,
    );
  }

  const supabase = createAdminSupabaseClient();

  const { error } = await supabase.rpc("create_project", {
    p_actor_auth_user_id: currentUser.id,
    p_project_description: parsedInput.projectDescription,
    p_project_id: crypto.randomUUID(),
    p_project_name: parsedInput.projectName,
    p_project_slug: parsedInput.projectSlug,
    p_workspace_id: workspaceAccess.workspace.id,
  });

  if (error) {
    if (error.code === "23505") {
      redirect(
        buildProjectCreationErrorRedirect(
          parsedInput.workspaceSlug,
          "That project slug is already in use for this workspace.",
        ),
      );
    }

    if (error.code === "42501") {
      redirect(
        `${getWorkspaceDashboardPath(parsedInput.workspaceSlug)}?error=${encodeURIComponent(
          "Your current role cannot create projects in this workspace.",
        )}`,
      );
    }

    redirect(
      buildProjectCreationErrorRedirect(
        parsedInput.workspaceSlug,
        "Could not create the project right now.",
      ),
    );
  }

  revalidatePath(getWorkspaceDashboardPath(parsedInput.workspaceSlug));
  redirect(
    `${getWorkspaceProjectPath(parsedInput.workspaceSlug, parsedInput.projectSlug)}?created=1`,
  );
};
