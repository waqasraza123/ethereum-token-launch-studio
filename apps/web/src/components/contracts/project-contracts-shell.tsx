import Link from "next/link";
import { SignOutForm } from "@/components/dashboard/sign-out-form";
import { PageShell } from "@/components/foundation/page-shell";
import type { ProjectContractOverview } from "@/lib/contracts/registry";
import type { ProjectOverview } from "@/lib/projects/data";
import {
  getWorkspaceDashboardPath,
  getWorkspaceProjectPath,
  getWorkspaceProjectSettingsPath
} from "@/lib/routing/route-paths";
import {
  canCreateProjectsForRole,
  type WorkspaceAccessContext
} from "@/lib/workspaces/access";
import { ProjectContractAttachForm } from "./project-contract-attach-form";
import { ProjectContractDetachForm } from "./project-contract-detach-form";

type ProjectContractsShellProps = Readonly<{
  contracts: readonly ProjectContractOverview[];
  errorMessage: string | null;
  project: ProjectOverview;
  statusMessage: string | null;
  workspaceAccess: WorkspaceAccessContext;
}>;

const contractRegistryNotes = [
  "All authorized workspace members can view attached contracts.",
  "Only owner and ops_manager can attach or detach contracts.",
  "Verified Sepolia token deployments now appear here as soon as the deployment script records them."
];

export function ProjectContractsShell({
  contracts,
  errorMessage,
  project,
  statusMessage,
  workspaceAccess
}: ProjectContractsShellProps) {
  const canManageContracts = canCreateProjectsForRole(workspaceAccess.role);

  return (
    <PageShell
      eyebrow="Project contracts"
      title={`Contracts for ${project.name}.`}
      description="This route now shows both generic contract registry rows and token-specific verified deployment metadata."
      actions={
        <div className="page-shell-actions">
          <Link
            className="button-link secondary"
            href={getWorkspaceProjectPath(workspaceAccess.workspace.slug, project.slug)}
          >
            Back to project
          </Link>
          {canManageContracts ? (
            <Link
              className="button-link secondary"
              href={getWorkspaceProjectSettingsPath(
                workspaceAccess.workspace.slug,
                project.slug
              )}
            >
              Settings
            </Link>
          ) : null}
          <Link
            className="button-link secondary"
            href={getWorkspaceDashboardPath(workspaceAccess.workspace.slug)}
          >
            Workspace
          </Link>
          <SignOutForm />
        </div>
      }
    >
      {statusMessage ? <div className="status-banner success">{statusMessage}</div> : null}
      {errorMessage ? <div className="status-banner error">{errorMessage}</div> : null}
      {canManageContracts ? (
        <ProjectContractAttachForm
          currentProjectSlug={project.slug}
          workspaceSlug={workspaceAccess.workspace.slug}
        />
      ) : (
        <section className="placeholder-panel">
          <h2 className="placeholder-panel-title">Read-only contract access</h2>
          <p className="placeholder-panel-description">
            Your current role can view attached contracts but cannot change the registry.
          </p>
        </section>
      )}
      <section className="placeholder-panel">
        <h2 className="placeholder-panel-title">Attached contracts</h2>
        <p className="placeholder-panel-description">
          Verified token deployments written by the contracts workspace now land here immediately.
        </p>
        {contracts.length === 0 ? (
          <p className="placeholder-panel-description">
            No contracts are attached to this project yet.
          </p>
        ) : (
          <ul className="dashboard-list">
            {contracts.map((contract) => (
              <li className="dashboard-list-item" key={contract.id}>
                <h3 className="dashboard-list-title">{contract.label}</h3>
                <p className="dashboard-list-meta">Kind: {contract.contractKind}</p>
                <p className="dashboard-list-meta">
                  Environment: {contract.deploymentEnvironment}
                </p>
                <p className="dashboard-list-meta">Chain ID: {contract.chainId}</p>
                <p className="dashboard-list-meta">Address: {contract.address}</p>
                <p className="dashboard-list-meta">
                  {contract.notes ?? "No notes recorded yet."}
                </p>
                {contract.projectTokenDeployment ? (
                  <div className="field-grid">
                    <p className="dashboard-list-meta">
                      Token: {contract.projectTokenDeployment.tokenName} (
                      {contract.projectTokenDeployment.tokenSymbol})
                    </p>
                    <p className="dashboard-list-meta">
                      Decimals: {contract.projectTokenDeployment.decimals}
                    </p>
                    <p className="dashboard-list-meta">
                      Cap: {contract.projectTokenDeployment.cap}
                    </p>
                    <p className="dashboard-list-meta">
                      Initial supply: {contract.projectTokenDeployment.initialSupply}
                    </p>
                    <p className="dashboard-list-meta">
                      Admin: {contract.projectTokenDeployment.adminAddress}
                    </p>
                    <p className="dashboard-list-meta">
                      Initial recipient: {contract.projectTokenDeployment.initialRecipient}
                    </p>
                    <p className="dashboard-list-meta">
                      Mint authority:{" "}
                      {contract.projectTokenDeployment.mintAuthority ?? "disabled"}
                    </p>
                    <p className="dashboard-list-meta">
                      Deployment tx: {contract.projectTokenDeployment.deploymentTxHash}
                    </p>
                    <p className="dashboard-list-meta">
                      Block: {contract.projectTokenDeployment.deployedBlockNumber}
                    </p>
                    <p className="dashboard-list-meta">
                      Deployer: {contract.projectTokenDeployment.deployerAddress}
                    </p>
                    <p className="dashboard-list-meta">
                      Verification: {contract.projectTokenDeployment.verificationProvider}
                    </p>
                    <p className="dashboard-list-meta">
                      Verified at: {contract.projectTokenDeployment.verifiedAt}
                    </p>
                    <div className="page-shell-actions">
                      <a
                        className="button-link secondary"
                        href={contract.projectTokenDeployment.verificationUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        Open verified source
                      </a>
                    </div>
                  </div>
                ) : null}
                {contract.explorerUrl ? (
                  <div className="page-shell-actions">
                    <a
                      className="button-link secondary"
                      href={contract.explorerUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Open explorer
                    </a>
                  </div>
                ) : null}
                {canManageContracts ? (
                  <div className="page-shell-actions">
                    <ProjectContractDetachForm
                      currentProjectSlug={project.slug}
                      projectContractId={contract.id}
                      workspaceSlug={workspaceAccess.workspace.slug}
                    />
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="placeholder-panel">
        <h2 className="placeholder-panel-title">What this route proves now</h2>
        <ul className="placeholder-list">
          {contractRegistryNotes.map((item) => (
            <li className="placeholder-list-item" key={item}>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>
    </PageShell>
  );
}
