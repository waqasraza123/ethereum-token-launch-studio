import { createServerAppSupabaseClient } from "@/lib/supabase/server-app";

export type ProjectOverview = Readonly<{
  createdAt: string;
  description: string | null;
  id: string;
  name: string;
  slug: string;
  workspaceId: string;
}>;

type ProjectRow = Readonly<{
  created_at: string;
  description: string | null;
  id: string;
  name: string;
  slug: string;
  workspace_id: string;
}>;

const mapProjectRow = (row: ProjectRow): ProjectOverview => ({
  createdAt: row.created_at,
  description: row.description,
  id: row.id,
  name: row.name,
  slug: row.slug,
  workspaceId: row.workspace_id
});

export const listProjectsForWorkspace = async (
  workspaceId: string
): Promise<readonly ProjectOverview[]> => {
  const supabase = await createServerAppSupabaseClient();

  const { data, error } = await supabase
    .from("projects")
    .select("id, workspace_id, slug, name, description, created_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Could not load authorized projects for workspace: ${error.message}`);
  }

  return ((data ?? []) as readonly ProjectRow[]).map(mapProjectRow);
};

export const getProjectBySlug = async (
  workspaceId: string,
  projectSlug: string
): Promise<ProjectOverview | null> => {
  const supabase = await createServerAppSupabaseClient();

  const { data, error } = await supabase
    .from("projects")
    .select("id, workspace_id, slug, name, description, created_at")
    .eq("workspace_id", workspaceId)
    .eq("slug", projectSlug)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not load authorized project by slug: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return mapProjectRow(data as ProjectRow);
};
