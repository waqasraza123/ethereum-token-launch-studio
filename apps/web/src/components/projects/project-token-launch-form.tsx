import { createProjectTokenLaunchRequestAction } from "@/app/(admin)/dashboard/[workspaceSlug]/projects/[projectSlug]/token-launch/actions";

type ProjectTokenLaunchFormProps = Readonly<{
  currentProjectSlug: string;
  workspaceSlug: string;
}>;

export function ProjectTokenLaunchForm({
  currentProjectSlug,
  workspaceSlug
}: ProjectTokenLaunchFormProps) {
  return (
    <section className="placeholder-panel">
      <h2 className="placeholder-panel-title">Launch project token on Sepolia</h2>
      <p className="placeholder-panel-description">
        This creates a validated launch request. The worker will claim it, run the contracts
        workspace deployment path, verify the contract, and persist the verified deployment back
        into the contract registry.
      </p>
      <form action={createProjectTokenLaunchRequestAction} className="form-card">
        <input name="workspaceSlug" type="hidden" value={workspaceSlug} />
        <input name="currentProjectSlug" type="hidden" value={currentProjectSlug} />
        <div className="field-grid">
          <label className="field-label" htmlFor="registryLabel">
            <span>Registry label</span>
            <input className="text-input" id="registryLabel" name="registryLabel" required type="text" />
          </label>
          <label className="field-label" htmlFor="tokenName">
            <span>Token name</span>
            <input className="text-input" id="tokenName" name="tokenName" required type="text" />
          </label>
          <label className="field-label" htmlFor="tokenSymbol">
            <span>Token symbol</span>
            <input className="text-input" id="tokenSymbol" name="tokenSymbol" required type="text" />
          </label>
          <label className="field-label" htmlFor="cap">
            <span>Cap</span>
            <input className="text-input" id="cap" name="cap" required type="text" />
          </label>
          <label className="field-label" htmlFor="initialSupply">
            <span>Initial supply</span>
            <input className="text-input" id="initialSupply" name="initialSupply" required type="text" />
          </label>
          <label className="field-label" htmlFor="adminAddress">
            <span>Admin address</span>
            <input className="text-input" id="adminAddress" name="adminAddress" required type="text" />
          </label>
          <label className="field-label" htmlFor="initialRecipient">
            <span>Initial recipient</span>
            <input className="text-input" id="initialRecipient" name="initialRecipient" required type="text" />
          </label>
          <label className="field-label" htmlFor="mintAuthority">
            <span>Mint authority</span>
            <input className="text-input" id="mintAuthority" name="mintAuthority" type="text" />
          </label>
          <label className="field-label" htmlFor="notes">
            <span>Notes</span>
            <textarea className="text-input" id="notes" name="notes" rows={4} />
          </label>
        </div>
        <div className="page-shell-actions">
          <button className="button-link" type="submit">
            Queue token launch
          </button>
        </div>
      </form>
    </section>
  );
}
