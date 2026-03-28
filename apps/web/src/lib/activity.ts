import { createServerAppSupabaseClient } from "@/lib/supabase/server-app";

export type ProjectActivityOverview = Readonly<{
  activityKind: string;
  actorAuthUserId: string | null;
  actorType: string;
  createdAt: string;
  id: string;
  metadata: Record<string, unknown>;
  relatedProjectContractId: string | null;
  workerId: string | null;
}>;

type ProjectActivityRow = Readonly<{
  activity_kind: string;
  actor_auth_user_id: string | null;
  actor_type: string;
  created_at: string;
  id: string;
  metadata: Record<string, unknown> | null;
  related_project_contract_id: string | null;
  worker_id: string | null;
}>;

const mapRow = (row: ProjectActivityRow): ProjectActivityOverview => ({
  activityKind: row.activity_kind,
  actorAuthUserId: row.actor_auth_user_id,
  actorType: row.actor_type,
  createdAt: row.created_at,
  id: row.id,
  metadata: row.metadata ?? {},
  relatedProjectContractId: row.related_project_contract_id,
  workerId: row.worker_id
});

export const listProjectActivities = async (
  projectId: string,
  limit = 20
): Promise<readonly ProjectActivityOverview[]> => {
  const supabase = await createServerAppSupabaseClient();

  const { data, error } = await supabase
    .from("project_activities")
    .select(
      "id, activity_kind, actor_type, actor_auth_user_id, worker_id, related_project_contract_id, metadata, created_at"
    )
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Could not load project activity feed: ${error.message}`);
  }

  return ((data ?? []) as readonly ProjectActivityRow[]).map(mapRow);
};
