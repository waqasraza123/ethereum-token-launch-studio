"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { requireCurrentUser } from "@/lib/auth/session";
import { getProjectBySlug } from "@/lib/projects/data";
import {
  getWorkspaceDashboardPath,
  getWorkspaceProjectPath,
  getWorkspaceProjectTokenLaunchPath,
  routePaths
} from "@/lib/routing/route-paths";
import { createServerAppSupabaseClient } from "@/lib/supabase/server-app";
import { parseProjectTokenLaunchRequestFormData } from "@/lib/token-launch/input";
import {
  canCreateProjectsForRole,
  getWorkspaceAccessBySlug
} from "@/lib/workspaces/access";

const buildLaunchErrorRedirect = (
  workspaceSlug: string,
  currentProjectSlug: string,
  message: string
) =>
  `${getWorkspaceProjectTokenLaunchPath(
    workspaceSlug,
    currentProjectSlug
  )}?error=${encodeURIComponent(message)}`;

export const createProjectTokenLaunchRequestAction = async (
  formData: FormData
): Promise<void> => {
  await requireCurrentUser();

  let parsedInput;

  try {
    parsedInput = parseProjectTokenLaunchRequestFormData(formData);
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
          buildLaunchErrorRedirect(
            workspaceSlug,
            currentProjectSlug,
            "Enter a valid project token launch request."
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
        "Your current role cannot launch tokens in this workspace."
      )}`
    );
  }

  const project = await getProjectBySlug(
    workspaceAccess.workspace.id,
    parsedInput.currentProjectSlug
  );

  if (!project) {
    redirect(getWorkspaceDashboardPath(parsedInput.workspaceSlug));
  }

  const supabase = await createServerAppSupabaseClient();

  const { error } = await supabase.rpc("create_project_token_launch_request", {
    p_request_id: crypto.randomUUID(),
    p_project_id: project.id,
    p_registry_label: parsedInput.registryLabel,
    p_token_name: parsedInput.tokenName,
    p_token_symbol: parsedInput.tokenSymbol,
    p_cap: parsedInput.cap,
    p_initial_supply: parsedInput.initialSupply,
    p_admin_address: parsedInput.adminAddress,
    p_initial_recipient: parsedInput.initialRecipient,
    p_mint_authority: parsedInput.mintAuthority,
    p_notes: parsedInput.notes
  });

  if (error) {
    if (error.code === "42501") {
      redirect(
        buildLaunchErrorRedirect(
          parsedInput.workspaceSlug,
          parsedInput.currentProjectSlug,
          "Your current role cannot launch tokens in this workspace."
        )
      );
    }

    redirect(
      buildLaunchErrorRedirect(
        parsedInput.workspaceSlug,
        parsedInput.currentProjectSlug,
        "Could not queue the project token launch right now."
      )
    );
  }

  revalidatePath(getWorkspaceProjectPath(parsedInput.workspaceSlug, parsedInput.currentProjectSlug));
  revalidatePath(
    getWorkspaceProjectTokenLaunchPath(
      parsedInput.workspaceSlug,
      parsedInput.currentProjectSlug
    )
  );

  redirect(
    `${getWorkspaceProjectTokenLaunchPath(
      parsedInput.workspaceSlug,
      parsedInput.currentProjectSlug
    )}?queued=1`
  );
};
