import { createServerAppSupabaseClient } from "@/lib/supabase/server-app";

export type ProjectTokenLaunchRequestOverview = Readonly<{
  adminAddress: string;
  cap: string;
  claimedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  deployedAddress: string | null;
  deploymentTxHash: string | null;
  failedAt: string | null;
  failureMessage: string | null;
  heartbeatAt: string | null;
  id: string;
  initialRecipient: string;
  initialSupply: string;
  lastErrorAt: string | null;
  maxAttempts: number;
  mintAuthority: string | null;
  nextRetryAt: string | null;
  notes: string | null;
  projectContractId: string | null;
  registryLabel: string;
  requestedByAuthUserId: string;
  retryCount: number;
  startedAt: string | null;
  status: string;
  tokenName: string;
  tokenSymbol: string;
  verificationUrl: string | null;
  workerId: string | null;
}>;

type ProjectTokenLaunchRequestRow = Readonly<{
  admin_address: string;
  cap: string;
  claimed_at: string | null;
  completed_at: string | null;
  created_at: string;
  deployed_address: string | null;
  deployment_tx_hash: string | null;
  failed_at: string | null;
  failure_message: string | null;
  heartbeat_at: string | null;
  id: string;
  initial_recipient: string;
  initial_supply: string;
  last_error_at: string | null;
  max_attempts: number | string;
  mint_authority: string | null;
  next_retry_at: string | null;
  notes: string | null;
  project_contract_id: string | null;
  registry_label: string;
  requested_by_auth_user_id: string;
  retry_count: number | string;
  started_at: string | null;
  status: string;
  token_name: string;
  token_symbol: string;
  verification_url: string | null;
  worker_id: string | null;
}>;

const mapRow = (row: ProjectTokenLaunchRequestRow): ProjectTokenLaunchRequestOverview => ({
  adminAddress: row.admin_address,
  cap: row.cap,
  claimedAt: row.claimed_at,
  completedAt: row.completed_at,
  createdAt: row.created_at,
  deployedAddress: row.deployed_address,
  deploymentTxHash: row.deployment_tx_hash,
  failedAt: row.failed_at,
  failureMessage: row.failure_message,
  heartbeatAt: row.heartbeat_at,
  id: row.id,
  initialRecipient: row.initial_recipient,
  initialSupply: row.initial_supply,
  lastErrorAt: row.last_error_at,
  maxAttempts: Number(row.max_attempts),
  mintAuthority: row.mint_authority,
  nextRetryAt: row.next_retry_at,
  notes: row.notes,
  projectContractId: row.project_contract_id,
  registryLabel: row.registry_label,
  requestedByAuthUserId: row.requested_by_auth_user_id,
  retryCount: Number(row.retry_count),
  startedAt: row.started_at,
  status: row.status,
  tokenName: row.token_name,
  tokenSymbol: row.token_symbol,
  verificationUrl: row.verification_url,
  workerId: row.worker_id
});

export const listProjectTokenLaunchRequests = async (
  projectId: string,
  limit = 20
): Promise<readonly ProjectTokenLaunchRequestOverview[]> => {
  const supabase = await createServerAppSupabaseClient();

  const { data, error } = await supabase
    .from("project_token_launch_requests")
    .select(
      "id, registry_label, token_name, token_symbol, cap, initial_supply, admin_address, initial_recipient, mint_authority, notes, requested_by_auth_user_id, status, worker_id, retry_count, max_attempts, next_retry_at, claimed_at, started_at, heartbeat_at, deployed_address, deployment_tx_hash, verification_url, failure_message, last_error_at, project_contract_id, failed_at, completed_at, created_at"
    )
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Could not load project token launch requests: ${error.message}`);
  }

  return ((data ?? []) as readonly ProjectTokenLaunchRequestRow[]).map(mapRow);
};
