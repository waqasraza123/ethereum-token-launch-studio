"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { requireCurrentUser } from "@/lib/auth/session";
import {
  getWorkspaceDashboardPath,
  getWorkspaceMembersPath,
  routePaths
} from "@/lib/routing/route-paths";
import { createServerAppSupabaseClient } from "@/lib/supabase/server-app";
import {
  canManageWorkspaceMembersForRole,
  getWorkspaceAccessBySlug
} from "@/lib/workspaces/access";
import {
  parseWorkspaceMemberInviteFormData,
  parseWorkspaceMemberRemovalFormData,
  parseWorkspaceMemberRoleUpdateFormData
} from "@/lib/workspaces/membership-input";

const buildMembersErrorRedirect = (workspaceSlug: string, message: string) =>
  `${getWorkspaceMembersPath(workspaceSlug)}?error=${encodeURIComponent(message)}`;

const revalidateWorkspaceMembershipPaths = (workspaceSlug: string) => {
  revalidatePath(routePaths.dashboard);
  revalidatePath(getWorkspaceDashboardPath(workspaceSlug));
  revalidatePath(getWorkspaceMembersPath(workspaceSlug));
};

export const inviteWorkspaceMemberAction = async (formData: FormData): Promise<void> => {
  await requireCurrentUser();

  let parsedInput;

  try {
    parsedInput = parseWorkspaceMemberInviteFormData(formData);
  } catch (error) {
    if (error instanceof ZodError) {
      const workspaceSlug =
        typeof formData.get("workspaceSlug") === "string"
          ? String(formData.get("workspaceSlug"))
          : "";

      if (workspaceSlug !== "") {
        redirect(
          buildMembersErrorRedirect(
            workspaceSlug,
            "Enter a valid existing user email and role."
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

  if (!canManageWorkspaceMembersForRole(workspaceAccess.role)) {
    redirect(
      `${getWorkspaceDashboardPath(parsedInput.workspaceSlug)}?error=${encodeURIComponent(
        "Only owners can change workspace memberships."
      )}`
    );
  }

  const supabase = await createServerAppSupabaseClient();

  const { error } = await supabase.rpc("invite_workspace_member", {
    p_member_email: parsedInput.memberEmail,
    p_role: parsedInput.role,
    p_workspace_id: workspaceAccess.workspace.id,
    p_workspace_member_id: crypto.randomUUID()
  });

  if (error) {
    if (error.code === "23505") {
      redirect(
        buildMembersErrorRedirect(
          parsedInput.workspaceSlug,
          "That user is already a member of this workspace."
        )
      );
    }

    if (error.code === "22023") {
      redirect(
        buildMembersErrorRedirect(
          parsedInput.workspaceSlug,
          "No existing auth user was found for that email address."
        )
      );
    }

    if (error.code === "42501") {
      redirect(
        buildMembersErrorRedirect(
          parsedInput.workspaceSlug,
          "Only owners can change workspace memberships."
        )
      );
    }

    redirect(
      buildMembersErrorRedirect(
        parsedInput.workspaceSlug,
        "Could not add the workspace member right now."
      )
    );
  }

  revalidateWorkspaceMembershipPaths(parsedInput.workspaceSlug);
  redirect(`${getWorkspaceMembersPath(parsedInput.workspaceSlug)}?invited=1`);
};

export const updateWorkspaceMemberRoleAction = async (formData: FormData): Promise<void> => {
  await requireCurrentUser();

  let parsedInput;

  try {
    parsedInput = parseWorkspaceMemberRoleUpdateFormData(formData);
  } catch (error) {
    if (error instanceof ZodError) {
      const workspaceSlug =
        typeof formData.get("workspaceSlug") === "string"
          ? String(formData.get("workspaceSlug"))
          : "";

      if (workspaceSlug !== "") {
        redirect(
          buildMembersErrorRedirect(
            workspaceSlug,
            "Enter a valid workspace member role update."
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

  if (!canManageWorkspaceMembersForRole(workspaceAccess.role)) {
    redirect(
      `${getWorkspaceDashboardPath(parsedInput.workspaceSlug)}?error=${encodeURIComponent(
        "Only owners can change workspace memberships."
      )}`
    );
  }

  const supabase = await createServerAppSupabaseClient();

  const { error } = await supabase.rpc("update_workspace_member_role", {
    p_role: parsedInput.role,
    p_workspace_member_id: parsedInput.workspaceMemberId
  });

  if (error) {
    if (error.code === "22023") {
      redirect(
        buildMembersErrorRedirect(
          parsedInput.workspaceSlug,
          error.message === "Cannot change the last owner role"
            ? "You cannot demote the last owner."
            : "That workspace member could not be updated."
        )
      );
    }

    if (error.code === "42501") {
      redirect(
        buildMembersErrorRedirect(
          parsedInput.workspaceSlug,
          "Only owners can change workspace memberships."
        )
      );
    }

    redirect(
      buildMembersErrorRedirect(
        parsedInput.workspaceSlug,
        "Could not update the workspace member role right now."
      )
    );
  }

  revalidateWorkspaceMembershipPaths(parsedInput.workspaceSlug);
  redirect(`${getWorkspaceMembersPath(parsedInput.workspaceSlug)}?updated=1`);
};

export const removeWorkspaceMemberAction = async (formData: FormData): Promise<void> => {
  await requireCurrentUser();

  let parsedInput;

  try {
    parsedInput = parseWorkspaceMemberRemovalFormData(formData);
  } catch (error) {
    if (error instanceof ZodError) {
      const workspaceSlug =
        typeof formData.get("workspaceSlug") === "string"
          ? String(formData.get("workspaceSlug"))
          : "";

      if (workspaceSlug !== "") {
        redirect(
          buildMembersErrorRedirect(
            workspaceSlug,
            "Enter a valid workspace member removal request."
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

  if (!canManageWorkspaceMembersForRole(workspaceAccess.role)) {
    redirect(
      `${getWorkspaceDashboardPath(parsedInput.workspaceSlug)}?error=${encodeURIComponent(
        "Only owners can change workspace memberships."
      )}`
    );
  }

  const supabase = await createServerAppSupabaseClient();

  const { error } = await supabase.rpc("remove_workspace_member", {
    p_workspace_member_id: parsedInput.workspaceMemberId
  });

  if (error) {
    if (error.code === "22023") {
      redirect(
        buildMembersErrorRedirect(
          parsedInput.workspaceSlug,
          error.message === "Cannot remove the last owner"
            ? "You cannot remove the last owner."
            : "That workspace member could not be removed."
        )
      );
    }

    if (error.code === "42501") {
      redirect(
        buildMembersErrorRedirect(
          parsedInput.workspaceSlug,
          "Only owners can change workspace memberships."
        )
      );
    }

    redirect(
      buildMembersErrorRedirect(
        parsedInput.workspaceSlug,
        "Could not remove the workspace member right now."
      )
    );
  }

  revalidateWorkspaceMembershipPaths(parsedInput.workspaceSlug);
  redirect(`${getWorkspaceMembersPath(parsedInput.workspaceSlug)}?removed=1`);
};
