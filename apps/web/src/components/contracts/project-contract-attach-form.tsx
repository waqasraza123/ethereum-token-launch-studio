import { attachProjectContractAction } from "@/app/(admin)/dashboard/[workspaceSlug]/projects/[projectSlug]/contracts/actions";

type ProjectContractAttachFormProps = Readonly<{
  currentProjectSlug: string;
  workspaceSlug: string;
}>;

const contractKindOptions = [
  "project_token",
  "token_sale",
  "claim_campaign_manager",
  "vesting_factory",
  "safe_treasury",
  "other"
] as const;

const deploymentEnvironmentOptions = ["local", "testnet", "mainnet", "custom"] as const;

export function ProjectContractAttachForm({
  currentProjectSlug,
  workspaceSlug
}: ProjectContractAttachFormProps) {
  return (
    <section className="placeholder-panel">
      <h2 className="placeholder-panel-title">Attach contract</h2>
      <p className="placeholder-panel-description">
        This creates the first project-to-contract registry link inside the admin app.
      </p>
      <form action={attachProjectContractAction} className="form-card">
        <input name="workspaceSlug" type="hidden" value={workspaceSlug} />
        <input name="currentProjectSlug" type="hidden" value={currentProjectSlug} />
        <div className="field-grid">
          <label className="field-label" htmlFor="label">
            <span>Label</span>
            <input className="text-input" id="label" maxLength={120} name="label" required type="text" />
          </label>
          <label className="field-label" htmlFor="contractKind">
            <span>Contract kind</span>
            <select className="text-input" defaultValue="project_token" id="contractKind" name="contractKind">
              {contractKindOptions.map((contractKind) => (
                <option key={contractKind} value={contractKind}>
                  {contractKind}
                </option>
              ))}
            </select>
          </label>
          <label className="field-label" htmlFor="deploymentEnvironment">
            <span>Deployment environment</span>
            <select
              className="text-input"
              defaultValue="testnet"
              id="deploymentEnvironment"
              name="deploymentEnvironment"
            >
              {deploymentEnvironmentOptions.map((deploymentEnvironment) => (
                <option key={deploymentEnvironment} value={deploymentEnvironment}>
                  {deploymentEnvironment}
                </option>
              ))}
            </select>
          </label>
          <label className="field-label" htmlFor="chainId">
            <span>Chain ID</span>
            <input className="text-input" defaultValue="11155111" id="chainId" name="chainId" required type="number" />
          </label>
          <label className="field-label" htmlFor="address">
            <span>Contract address</span>
            <input
              className="text-input"
              id="address"
              name="address"
              placeholder="0x..."
              required
              type="text"
            />
          </label>
          <label className="field-label" htmlFor="explorerUrl">
            <span>Explorer URL</span>
            <input className="text-input" id="explorerUrl" name="explorerUrl" type="url" />
          </label>
          <label className="field-label" htmlFor="notes">
            <span>Notes</span>
            <textarea className="text-input" id="notes" maxLength={5000} name="notes" rows={4} />
          </label>
        </div>
        <div className="page-shell-actions">
          <button className="button-link" type="submit">
            Attach contract
          </button>
        </div>
      </form>
    </section>
  );
}
