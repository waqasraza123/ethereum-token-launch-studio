import { createServerAppSupabaseClient } from "@/lib/supabase/server-app";

export type ProjectContractOverview = Readonly<{
  address: string;
  chainId: number;
  contractKind: string;
  createdAt: string;
  deploymentEnvironment: string;
  explorerUrl: string | null;
  id: string;
  label: string;
  notes: string | null;
  projectId: string;
}>;

type ProjectContractRow = Readonly<{
  address: string;
  chain_id: number | string;
  contract_kind: string;
  created_at: string;
  deployment_environment: string;
  explorer_url: string | null;
  id: string;
  label: string;
  notes: string | null;
  project_id: string;
}>;

const mapProjectContractRow = (row: ProjectContractRow): ProjectContractOverview => ({
  address: row.address,
  chainId: Number(row.chain_id),
  contractKind: row.contract_kind,
  createdAt: row.created_at,
  deploymentEnvironment: row.deployment_environment,
  explorerUrl: row.explorer_url,
  id: row.id,
  label: row.label,
  notes: row.notes,
  projectId: row.project_id
});

export const listProjectContracts = async (
  projectId: string
): Promise<readonly ProjectContractOverview[]> => {
  const supabase = await createServerAppSupabaseClient();

  const { data, error } = await supabase
    .from("project_contracts")
    .select(
      "id, project_id, chain_id, address, contract_kind, label, deployment_environment, explorer_url, notes, created_at"
    )
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Could not load project contracts: ${error.message}`);
  }

  return ((data ?? []) as readonly ProjectContractRow[]).map(mapProjectContractRow);
};
