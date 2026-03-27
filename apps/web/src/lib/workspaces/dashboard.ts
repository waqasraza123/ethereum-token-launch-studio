import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const WorkspaceRoleSchema = z.enum(["owner", "ops_manager", "finance_manager", "viewer"]);

export type WorkspaceRole = z.infer<typeof WorkspaceRoleSchema>;

export type WorkspaceAccessOverview = Readonly<{
  role: WorkspaceRole;
  workspace: Readonly<{
    id: string;
    name: string;
    slug: string;
  }>;
}>;

type WorkspaceMembershipRow = Readonly<{
  created_at: string;
  role: string;
  workspace_id: string;
}>;

type WorkspaceRow = Readonly<{
  id: string;
  name: string;
  slug: string;
}>;

export const getWorkspaceAccessOverview = async (
  authUserId: string,
): Promise<readonly WorkspaceAccessOverview[]> => {
  const supabase = createAdminSupabaseClient();

  const { data: membershipRows, error: membershipError } = await supabase
    .from("workspace_members")
    .select("workspace_id, role, created_at")
    .eq("auth_user_id", authUserId)
    .order("created_at", { ascending: true });

  if (membershipError) {
    throw new Error(`Could not load workspace membership context: ${membershipError.message}`);
  }

  const memberships = (membershipRows ?? []) as readonly WorkspaceMembershipRow[];

  if (memberships.length === 0) {
    return [];
  }

  const workspaceIds = memberships.map((membership) => membership.workspace_id);

  const { data: workspaceRows, error: workspaceError } = await supabase
    .from("workspaces")
    .select("id, name, slug")
    .in("id", workspaceIds);

  if (workspaceError) {
    throw new Error(`Could not load workspaces for the current user: ${workspaceError.message}`);
  }

  const workspacesById = new Map(
    ((workspaceRows ?? []) as readonly WorkspaceRow[]).map((workspace) => [
      workspace.id,
      workspace,
    ]),
  );

  return memberships.flatMap((membership) => {
    const workspace = workspacesById.get(membership.workspace_id);

    if (!workspace) {
      return [];
    }

    return [
      {
        role: WorkspaceRoleSchema.parse(membership.role),
        workspace: {
          id: workspace.id,
          name: workspace.name,
          slug: workspace.slug,
        },
      },
    ];
  });
};
