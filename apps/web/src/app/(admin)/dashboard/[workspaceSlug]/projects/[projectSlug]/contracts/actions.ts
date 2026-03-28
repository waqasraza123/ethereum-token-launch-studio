"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { requireCurrentUser } from "@/lib/auth/session";
import {
  parseContractAttachFormData,
  parseContractDetachFormData
} from "@/lib/contracts/input";
import { getProjectBySlug } from "@/lib/projects/data";
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

const buildProjectContractsErrorRedirect = (
  workspaceSlug: string,
  currentProjectSlug: string,
  message: string
) =>
  `${getWorkspaceProjectContractsPath(
    workspaceSlug,
    currentProjectSlug
  )}?error=${encodeURIComponent(message)}`;

const revalidateProjectContractPaths = (workspaceSlug: string, currentProjectSlug: string) => {
  revalidatePath(getWorkspaceDashboardPath(workspaceSlug));
  revalidatePath(getWorkspaceProjectPath(workspaceSlug, currentProjectSlug));
  revalidatePath(getWorkspaceProjectSettingsPath(workspaceSlug, currentProjectSlug));
  revalidatePath(getWorkspaceProjectContractsPath(workspaceSlug, currentProjectSlug));
};

export const attachProjectContractAction = async (formData: FormData): Promise<void> => {
  await requireCurrentUser();

  let parsedInput;

  try {
    parsedInput = parseContractAttachFormData(formData);
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
          buildProjectContractsErrorRedirect(
            workspaceSlug,
            currentProjectSlug,
            "Enter a valid contract attachment payload."
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
        "Your current role cannot manage project contracts in this workspace."
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

  const { error } = await supabase.rpc("attach_project_contract", {
    p_address: parsedInput.address,
    p_chain_id: parsedInput.chainId,
    p_contract_kind: parsedInput.contractKind,
    p_deployment_environment: parsedInput.deploymentEnvironment,
    p_explorer_url: parsedInput.explorerUrl,
    p_label: parsedInput.label,
    p_notes: parsedInput.notes,
    p_project_contract_id: crypto.randomUUID(),
    p_project_id: currentProject.id
  });

  if (error) {
    if (error.code === "23505") {
      redirect(
        buildProjectContractsErrorRedirect(
          parsedInput.workspaceSlug,
          parsedInput.currentProjectSlug,
          "That contract address is already attached to this project on this chain."
        )
      );
    }

    if (error.code === "42501") {
      redirect(
        `${getWorkspaceDashboardPath(parsedInput.workspaceSlug)}?error=${encodeURIComponent(
          "Your current role cannot manage project contracts in this workspace."
        )}`
      );
    }

    redirect(
      buildProjectContractsErrorRedirect(
        parsedInput.workspaceSlug,
        parsedInput.currentProjectSlug,
        "Could not attach the contract right now."
      )
    );
  }

  revalidateProjectContractPaths(parsedInput.workspaceSlug, parsedInput.currentProjectSlug);
  redirect(
    `${getWorkspaceProjectContractsPath(
      parsedInput.workspaceSlug,
      parsedInput.currentProjectSlug
    )}?attached=1`
  );
};

export const detachProjectContractAction = async (formData: FormData): Promise<void> => {
  await requireCurrentUser();

  let parsedInput;

  try {
    parsedInput = parseContractDetachFormData(formData);
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
          buildProjectContractsErrorRedirect(
            workspaceSlug,
            currentProjectSlug,
            "Enter a valid contract detachment request."
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
        "Your current role cannot manage project contracts in this workspace."
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

  const { error } = await supabase.rpc("detach_project_contract", {
    p_project_contract_id: parsedInput.projectContractId
  });

  if (error) {
    if (error.code === "42501") {
      redirect(
        `${getWorkspaceDashboardPath(parsedInput.workspaceSlug)}?error=${encodeURIComponent(
          "Your current role cannot manage project contracts in this workspace."
        )}`
      );
    }

    redirect(
      buildProjectContractsErrorRedirect(
        parsedInput.workspaceSlug,
        parsedInput.currentProjectSlug,
        "Could not detach the contract right now."
      )
    );
  }

  revalidateProjectContractPaths(parsedInput.workspaceSlug, parsedInput.currentProjectSlug);
  redirect(
    `${getWorkspaceProjectContractsPath(
      parsedInput.workspaceSlug,
      parsedInput.currentProjectSlug
    )}?detached=1`
  );
};
