import { WorkspaceRoleSchema } from "./access";
import { createServerAppSupabaseClient } from "@/lib/supabase/server-app";

export type WorkspaceMemberOverview = Readonly<{
  authUserId: string;
  createdAt: string;
  email: string | null;
  id: string;
  isCurrentUser: boolean;
  role: ReturnType<typeof WorkspaceRoleSchema.parse>;
}>;

type WorkspaceMemberRpcRow = Readonly<{
  auth_user_id: string;
  created_at: string;
  email: string | null;
  role: string;
  workspace_member_id: string;
}>;

export const listWorkspaceMembers = async (
  workspaceId: string,
  currentUserId: string
): Promise<readonly WorkspaceMemberOverview[]> => {
  const supabase = await createServerAppSupabaseClient();

  const { data, error } = await supabase.rpc("list_workspace_members", {
    p_workspace_id: workspaceId
  });

  if (error) {
    throw new Error(`Could not load workspace members: ${error.message}`);
  }

  return ((data ?? []) as readonly WorkspaceMemberRpcRow[]).map((row) => ({
    authUserId: row.auth_user_id,
    createdAt: row.created_at,
    email: row.email,
    id: row.workspace_member_id,
    isCurrentUser: row.auth_user_id === currentUserId,
    role: WorkspaceRoleSchema.parse(row.role)
  }));
};
