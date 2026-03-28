import Link from "next/link";
import { SignOutForm } from "@/components/dashboard/sign-out-form";
import { PageShell } from "@/components/foundation/page-shell";
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
import type { ProjectContractOverview } from "@/lib/contracts/registry";
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
  "Project deletion is blocked until the contract registry for that project is empty."
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
      description="This is the first project-to-contract attachment flow and contract registry surface inside the admin app."
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
          Contract records are now linked directly to the current project and can later power
          deployment history, explorer links, and contract-aware admin modules.
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
                <p className="dashboard-list-meta">Environment: {contract.deploymentEnvironment}</p>
                <p className="dashboard-list-meta">Chain ID: {contract.chainId}</p>
                <p className="dashboard-list-meta">Address: {contract.address}</p>
                <p className="dashboard-list-meta">
                  {contract.notes ?? "No notes recorded yet."}
                </p>
                {contract.explorerUrl ? (
                  <div className="page-shell-actions">
                    <a className="button-link secondary" href={contract.explorerUrl} rel="noreferrer" target="_blank">
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
