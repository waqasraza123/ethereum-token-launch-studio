"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { requireCurrentUser } from "@/lib/auth/session";
import { getProjectBySlug } from "@/lib/projects/data";
import {
  parseProjectDeleteFormData,
  parseProjectUpdateFormData
} from "@/lib/projects/input";
import {
  getWorkspaceDashboardPath,
  getWorkspaceProjectContractsPath,
  getWorkspaceProjectPath,
  getWorkspaceProjectSettingsPath,
  routePaths
} from "@/lib/routing/route-paths";
import { createServerAppSupabaseClient } from "@/lib/supabase/server-app";
import {
  canCreateProjectsForRole,
  getWorkspaceAccessBySlug
} from "@/lib/workspaces/access";

const buildProjectSettingsErrorRedirect = (
  workspaceSlug: string,
  currentProjectSlug: string,
  message: string
) =>
  `${getWorkspaceProjectSettingsPath(
    workspaceSlug,
    currentProjectSlug
  )}?error=${encodeURIComponent(message)}`;

const revalidateProjectPaths = (
  workspaceSlug: string,
  currentProjectSlug: string,
  nextProjectSlug?: string
) => {
  revalidatePath(getWorkspaceDashboardPath(workspaceSlug));
  revalidatePath(getWorkspaceProjectPath(workspaceSlug, currentProjectSlug));
  revalidatePath(getWorkspaceProjectSettingsPath(workspaceSlug, currentProjectSlug));
  revalidatePath(getWorkspaceProjectContractsPath(workspaceSlug, currentProjectSlug));

  if (nextProjectSlug && nextProjectSlug !== currentProjectSlug) {
    revalidatePath(getWorkspaceProjectPath(workspaceSlug, nextProjectSlug));
    revalidatePath(getWorkspaceProjectSettingsPath(workspaceSlug, nextProjectSlug));
    revalidatePath(getWorkspaceProjectContractsPath(workspaceSlug, nextProjectSlug));
  }
};

export const updateProjectAction = async (formData: FormData): Promise<void> => {
  await requireCurrentUser();

  let parsedInput;

  try {
    parsedInput = parseProjectUpdateFormData(formData);
  } catch (error) {
    if (error instanceof ZodError) {
      const workspaceSlug =
        typeof formData.get("workspaceSlug") === "string"
          ? String(formData.get("workspaceSlug"))
          : "";
      const currentProjectSlug =
        typeof formData.get("currentProjectSlug") === "string"
          ? String(formData.get("currentProjectSlug"))
          : "";

      if (workspaceSlug !== "" && currentProjectSlug !== "") {
        redirect(
          buildProjectSettingsErrorRedirect(
            workspaceSlug,
            currentProjectSlug,
            "Enter a valid project name, slug, and description."
          )
        );
      }

      redirect(routePaths.dashboard);
    }

    throw error;
  }

  const workspaceAccess = await getWorkspaceAccessBySlug(parsedInput.workspaceSlug);

  if (!workspaceAccess) {
    redirect(routePaths.dashboard);
  }

  if (!canCreateProjectsForRole(workspaceAccess.role)) {
    redirect(
      `${getWorkspaceDashboardPath(parsedInput.workspaceSlug)}?error=${encodeURIComponent(
        "Your current role cannot manage projects in this workspace."
      )}`
    );
  }

  const currentProject = await getProjectBySlug(
    workspaceAccess.workspace.id,
    parsedInput.currentProjectSlug
  );

  if (!currentProject) {
    redirect(getWorkspaceDashboardPath(parsedInput.workspaceSlug));
  }

  const supabase = await createServerAppSupabaseClient();

  const { error } = await supabase.rpc("update_project", {
    p_project_description: parsedInput.projectDescription,
    p_project_id: currentProject.id,
    p_project_name: parsedInput.projectName,
    p_project_slug: parsedInput.projectSlug
  });

  if (error) {
    if (error.code === "23505") {
      redirect(
        buildProjectSettingsErrorRedirect(
          parsedInput.workspaceSlug,
          parsedInput.currentProjectSlug,
          "That project slug is already in use for this workspace."
        )
      );
    }

    if (error.code === "42501") {
      redirect(
        `${getWorkspaceDashboardPath(parsedInput.workspaceSlug)}?error=${encodeURIComponent(
          "Your current role cannot manage projects in this workspace."
        )}`
      );
    }

    redirect(
      buildProjectSettingsErrorRedirect(
        parsedInput.workspaceSlug,
        parsedInput.currentProjectSlug,
        "Could not update the project right now."
      )
    );
  }

  revalidateProjectPaths(
    parsedInput.workspaceSlug,
    parsedInput.currentProjectSlug,
    parsedInput.projectSlug
  );

  redirect(
    `${getWorkspaceProjectPath(
      parsedInput.workspaceSlug,
      parsedInput.projectSlug
    )}?updated=1`
  );
};

export const deleteProjectAction = async (formData: FormData): Promise<void> => {
  await requireCurrentUser();

  let parsedInput;

  try {
    parsedInput = parseProjectDeleteFormData(formData);
  } catch (error) {
    if (error instanceof ZodError) {
      const workspaceSlug =
        typeof formData.get("workspaceSlug") === "string"
          ? String(formData.get("workspaceSlug"))
          : "";
      const currentProjectSlug =
        typeof formData.get("currentProjectSlug") === "string"
          ? String(formData.get("currentProjectSlug"))
          : "";

      if (workspaceSlug !== "" && currentProjectSlug !== "") {
        redirect(
          buildProjectSettingsErrorRedirect(
            workspaceSlug,
            currentProjectSlug,
            "Enter a valid project deletion request."
          )
        );
      }

      redirect(routePaths.dashboard);
    }

    throw error;
  }

  const workspaceAccess = await getWorkspaceAccessBySlug(parsedInput.workspaceSlug);

  if (!workspaceAccess) {
    redirect(routePaths.dashboard);
  }

  if (!canCreateProjectsForRole(workspaceAccess.role)) {
    redirect(
      `${getWorkspaceDashboardPath(parsedInput.workspaceSlug)}?error=${encodeURIComponent(
        "Your current role cannot manage projects in this workspace."
      )}`
    );
  }

  const currentProject = await getProjectBySlug(
    workspaceAccess.workspace.id,
    parsedInput.currentProjectSlug
  );

  if (!currentProject) {
    redirect(getWorkspaceDashboardPath(parsedInput.workspaceSlug));
  }

  const supabase = await createServerAppSupabaseClient();

  const { error } = await supabase.rpc("delete_project", {
    p_project_id: currentProject.id
  });

  if (error) {
    if (error.code === "22023") {
      redirect(
        buildProjectSettingsErrorRedirect(
          parsedInput.workspaceSlug,
          parsedInput.currentProjectSlug,
          "Detach all attached contracts before deleting this project."
        )
      );
    }

    if (error.code === "42501") {
      redirect(
        `${getWorkspaceDashboardPath(parsedInput.workspaceSlug)}?error=${encodeURIComponent(
          "Your current role cannot manage projects in this workspace."
        )}`
      );
    }

    redirect(
      buildProjectSettingsErrorRedirect(
        parsedInput.workspaceSlug,
        parsedInput.currentProjectSlug,
        "Could not delete the project right now."
      )
    );
  }

  revalidateProjectPaths(parsedInput.workspaceSlug, parsedInput.currentProjectSlug);
  redirect(`${getWorkspaceDashboardPath(parsedInput.workspaceSlug)}?deleted=1`);
};
