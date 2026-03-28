import { createServerAppSupabaseClient } from "@/lib/supabase/server-app";

export type ProjectTokenDeploymentOverview = Readonly<{
  adminAddress: string;
  cap: string;
  decimals: number;
  deployedBlockNumber: number;
  deployerAddress: string;
  deploymentTxHash: string;
  initialRecipient: string;
  initialSupply: string;
  mintAuthority: string | null;
  projectContractId: string;
  sourceContractName: string;
  tokenName: string;
  tokenSymbol: string;
  verificationProvider: string;
  verificationUrl: string;
  verifiedAt: string;
}>;

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
  projectTokenDeployment: ProjectTokenDeploymentOverview | null;
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

type ProjectTokenDeploymentRow = Readonly<{
  admin_address: string;
  cap: string;
  decimals: number | string;
  deployed_block_number: number | string;
  deployer_address: string;
  deployment_tx_hash: string;
  initial_recipient: string;
  initial_supply: string;
  mint_authority: string | null;
  project_contract_id: string;
  source_contract_name: string;
  token_name: string;
  token_symbol: string;
  verification_provider: string;
  verification_url: string;
  verified_at: string;
}>;

const mapProjectTokenDeploymentRow = (
  row: ProjectTokenDeploymentRow
): ProjectTokenDeploymentOverview => ({
  adminAddress: row.admin_address,
  cap: row.cap,
  decimals: Number(row.decimals),
  deployedBlockNumber: Number(row.deployed_block_number),
  deployerAddress: row.deployer_address,
  deploymentTxHash: row.deployment_tx_hash,
  initialRecipient: row.initial_recipient,
  initialSupply: row.initial_supply,
  mintAuthority: row.mint_authority,
  projectContractId: row.project_contract_id,
  sourceContractName: row.source_contract_name,
  tokenName: row.token_name,
  tokenSymbol: row.token_symbol,
  verificationProvider: row.verification_provider,
  verificationUrl: row.verification_url,
  verifiedAt: row.verified_at
});

const mapProjectContractRow = (
  row: ProjectContractRow,
  projectTokenDeployment: ProjectTokenDeploymentOverview | null
): ProjectContractOverview => ({
  address: row.address,
  chainId: Number(row.chain_id),
  contractKind: row.contract_kind,
  createdAt: row.created_at,
  deploymentEnvironment: row.deployment_environment,
  explorerUrl: row.explorer_url,
  id: row.id,
  label: row.label,
  notes: row.notes,
  projectId: row.project_id,
  projectTokenDeployment
});

export const listProjectContracts = async (
  projectId: string
): Promise<readonly ProjectContractOverview[]> => {
  const supabase = await createServerAppSupabaseClient();

  const { data: contractData, error: contractError } = await supabase
    .from("project_contracts")
    .select(
      "id, project_id, chain_id, address, contract_kind, label, deployment_environment, explorer_url, notes, created_at"
    )
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (contractError) {
    throw new Error(`Could not load project contracts: ${contractError.message}`);
  }

  const contractRows = (contractData ?? []) as readonly ProjectContractRow[];

  if (contractRows.length === 0) {
    return [];
  }

  const projectContractIds = contractRows.map((row) => row.id);

  const { data: tokenDeploymentData, error: tokenDeploymentError } = await supabase
    .from("project_token_deployments")
    .select(
      "project_contract_id, source_contract_name, token_name, token_symbol, decimals, cap, initial_supply, admin_address, initial_recipient, mint_authority, deployment_tx_hash, deployed_block_number, deployer_address, verification_provider, verification_url, verified_at"
    )
    .in("project_contract_id", projectContractIds);

  if (tokenDeploymentError) {
    throw new Error(
      `Could not load project token deployment metadata: ${tokenDeploymentError.message}`
    );
  }

  const tokenDeploymentByProjectContractId = new Map(
    ((tokenDeploymentData ?? []) as readonly ProjectTokenDeploymentRow[]).map((row) => [
      row.project_contract_id,
      mapProjectTokenDeploymentRow(row)
    ])
  );

  return contractRows.map((row) =>
    mapProjectContractRow(row, tokenDeploymentByProjectContractId.get(row.id) ?? null)
  );
};
