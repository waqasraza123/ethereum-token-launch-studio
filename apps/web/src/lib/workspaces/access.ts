import { z } from "zod";
import { createServerAppSupabaseClient } from "@/lib/supabase/server-app";

export const WorkspaceRoleSchema = z.enum(["owner", "ops_manager", "finance_manager", "viewer"]);

export type WorkspaceRole = z.infer<typeof WorkspaceRoleSchema>;

export type WorkspaceAccessContext = Readonly<{
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
  created_at: string;
  id: string;
  name: string;
  slug: string;
}>;

export const canCreateProjectsForRole = (role: WorkspaceRole): boolean =>
  role === "owner" || role === "ops_manager";

export const getWorkspaceAccessOverview = async (): Promise<readonly WorkspaceAccessContext[]> => {
  const supabase = await createServerAppSupabaseClient();

  const { data: membershipRows, error: membershipError } = await supabase
    .from("workspace_members")
    .select("workspace_id, role, created_at")
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
    .select("id, name, slug, created_at")
    .in("id", workspaceIds)
    .order("created_at", { ascending: true });

  if (workspaceError) {
    throw new Error(`Could not load authorized workspaces: ${workspaceError.message}`);
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

export const getWorkspaceAccessBySlug = async (
  workspaceSlug: string,
): Promise<WorkspaceAccessContext | null> => {
  const supabase = await createServerAppSupabaseClient();

  const { data: workspaceRow, error: workspaceError } = await supabase
    .from("workspaces")
    .select("id, name, slug")
    .eq("slug", workspaceSlug)
    .maybeSingle();

  if (workspaceError) {
    throw new Error(`Could not load authorized workspace by slug: ${workspaceError.message}`);
  }

  if (!workspaceRow) {
    return null;
  }

  const { data: membershipRow, error: membershipError } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceRow.id)
    .maybeSingle();

  if (membershipError) {
    throw new Error(
      `Could not load current user membership for workspace: ${membershipError.message}`,
    );
  }

  if (!membershipRow) {
    return null;
  }

  return {
    role: WorkspaceRoleSchema.parse(membershipRow.role),
    workspace: {
      id: workspaceRow.id,
      name: workspaceRow.name,
      slug: workspaceRow.slug,
    },
  };
};
