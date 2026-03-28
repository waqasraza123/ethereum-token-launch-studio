import { createServerAppSupabaseClient } from "@/lib/supabase/server-app";

export type ProjectTokenLaunchRequestOverview = Readonly<{
  adminAddress: string;
  cap: string;
  completedAt: string | null;
  createdAt: string;
  deployedAddress: string | null;
  deploymentTxHash: string | null;
  failureMessage: string | null;
  id: string;
  initialRecipient: string;
  initialSupply: string;
  mintAuthority: string | null;
  notes: string | null;
  projectContractId: string | null;
  registryLabel: string;
  requestedByAuthUserId: string;
  status: string;
  tokenName: string;
  tokenSymbol: string;
  verificationUrl: string | null;
}>;

type ProjectTokenLaunchRequestRow = Readonly<{
  admin_address: string;
  cap: string;
  completed_at: string | null;
  created_at: string;
  deployed_address: string | null;
  deployment_tx_hash: string | null;
  failure_message: string | null;
  id: string;
  initial_recipient: string;
  initial_supply: string;
  mint_authority: string | null;
  notes: string | null;
  project_contract_id: string | null;
  registry_label: string;
  requested_by_auth_user_id: string;
  status: string;
  token_name: string;
  token_symbol: string;
  verification_url: string | null;
}>;

const mapRow = (row: ProjectTokenLaunchRequestRow): ProjectTokenLaunchRequestOverview => ({
  adminAddress: row.admin_address,
  cap: row.cap,
  completedAt: row.completed_at,
  createdAt: row.created_at,
  deployedAddress: row.deployed_address,
  deploymentTxHash: row.deployment_tx_hash,
  failureMessage: row.failure_message,
  id: row.id,
  initialRecipient: row.initial_recipient,
  initialSupply: row.initial_supply,
  mintAuthority: row.mint_authority,
  notes: row.notes,
  projectContractId: row.project_contract_id,
  registryLabel: row.registry_label,
  requestedByAuthUserId: row.requested_by_auth_user_id,
  status: row.status,
  tokenName: row.token_name,
  tokenSymbol: row.token_symbol,
  verificationUrl: row.verification_url
});

export const listProjectTokenLaunchRequests = async (
  projectId: string,
  limit = 20
): Promise<readonly ProjectTokenLaunchRequestOverview[]> => {
  const supabase = await createServerAppSupabaseClient();

  const { data, error } = await supabase
    .from("project_token_launch_requests")
    .select(
      "id, registry_label, token_name, token_symbol, cap, initial_supply, admin_address, initial_recipient, mint_authority, notes, requested_by_auth_user_id, status, deployed_address, deployment_tx_hash, verification_url, failure_message, project_contract_id, completed_at, created_at"
    )
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Could not load project token launch requests: ${error.message}`);
  }

  return ((data ?? []) as readonly ProjectTokenLaunchRequestRow[]).map(mapRow);
};
