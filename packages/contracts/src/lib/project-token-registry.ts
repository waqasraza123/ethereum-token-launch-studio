import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const RegistryEnvironmentSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().trim().min(1),
  SUPABASE_URL: z.string().url()
});

export type RecordProjectTokenDeploymentInput = Readonly<{
  address: string;
  adminAddress: string;
  cap: string;
  chainId: number;
  decimals: number;
  deployedBlockNumber: number;
  deployerAddress: string;
  deploymentEnvironment: "testnet";
  deploymentTxHash: string;
  explorerUrl: string;
  initialRecipient: string;
  initialSupply: string;
  label: string;
  mintAuthority: string | null;
  notes: string | null;
  projectContractId: string;
  projectSlug: string;
  sourceContractName: string;
  tokenName: string;
  tokenSymbol: string;
  verificationProvider: "etherscan";
  verificationUrl: string;
  verifiedAt: string;
  workspaceSlug: string;
}>;

type RecordProjectTokenDeploymentRow = Readonly<{
  address: string;
  project_contract_id: string;
  project_id: string;
}>;

const readRegistryEnvironment = () => RegistryEnvironmentSchema.parse(process.env);

export const recordProjectTokenDeployment = async (
  input: RecordProjectTokenDeploymentInput
) => {
  const environment = readRegistryEnvironment();

  const supabase = createClient(
    environment.SUPABASE_URL,
    environment.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false
      },
      db: {
        schema: "app_public"
      }
    }
  );

  const { data, error } = await supabase.rpc("record_project_token_deployment", {
    p_address: input.address,
    p_admin_address: input.adminAddress,
    p_cap: input.cap,
    p_chain_id: input.chainId,
    p_decimals: input.decimals,
    p_deployed_block_number: input.deployedBlockNumber,
    p_deployer_address: input.deployerAddress,
    p_deployment_environment: input.deploymentEnvironment,
    p_deployment_tx_hash: input.deploymentTxHash,
    p_explorer_url: input.explorerUrl,
    p_initial_recipient: input.initialRecipient,
    p_initial_supply: input.initialSupply,
    p_label: input.label,
    p_mint_authority: input.mintAuthority,
    p_notes: input.notes,
    p_project_contract_id: input.projectContractId,
    p_project_slug: input.projectSlug,
    p_source_contract_name: input.sourceContractName,
    p_token_name: input.tokenName,
    p_token_symbol: input.tokenSymbol,
    p_verification_provider: input.verificationProvider,
    p_verification_url: input.verificationUrl,
    p_verified_at: input.verifiedAt,
    p_workspace_slug: input.workspaceSlug
  });

  if (error) {
    throw new Error(`Could not persist the verified token deployment: ${error.message}`);
  }

  const row = (data as readonly RecordProjectTokenDeploymentRow[] | null)?.[0];

  if (!row) {
    throw new Error("The verified token deployment was not persisted correctly.");
  }

  return row;
};
