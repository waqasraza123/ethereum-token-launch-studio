import Link from "next/link";
import { SignOutForm } from "@/components/dashboard/sign-out-form";
import { PageShell } from "@/components/foundation/page-shell";
import type { ProjectActivityOverview } from "@/lib/activity";
import type { ProjectOverview } from "@/lib/projects/data";
import {
  getWorkspaceDashboardPath,
  getWorkspaceProjectContractsPath,
  getWorkspaceProjectPath
} from "@/lib/routing/route-paths";
import type { ProjectTokenLaunchRequestOverview } from "@/lib/token-launch/requests";
import {
  canCreateProjectsForRole,
  type WorkspaceAccessContext
} from "@/lib/workspaces/access";
import { ProjectActivityFeed } from "./project-activity-feed";
import { ProjectTokenLaunchForm } from "./project-token-launch-form";

type ProjectTokenLaunchShellProps = Readonly<{
  activities: readonly ProjectActivityOverview[];
  errorMessage: string | null;
  project: ProjectOverview;
  requests: readonly ProjectTokenLaunchRequestOverview[];
  statusMessage: string | null;
  workspaceAccess: WorkspaceAccessContext;
}>;

export function ProjectTokenLaunchShell({
  activities,
  errorMessage,
  project,
  requests,
  statusMessage,
  workspaceAccess
}: ProjectTokenLaunchShellProps) {
  const canLaunch = canCreateProjectsForRole(workspaceAccess.role);

  return (
    <PageShell
      eyebrow="Project token launch"
      title={`Launch token for ${project.name}.`}
      description="This is the first protected operator workflow that crosses from the admin app into the worker and contracts workspace."
      actions={
        <div className="page-shell-actions">
          <Link
            className="button-link secondary"
            href={getWorkspaceProjectPath(workspaceAccess.workspace.slug, project.slug)}
          >
            Back to project
          </Link>
          <Link
            className="button-link secondary"
            href={getWorkspaceProjectContractsPath(
              workspaceAccess.workspace.slug,
              project.slug
            )}
          >
            Contracts
          </Link>
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
      {canLaunch ? (
        <ProjectTokenLaunchForm
          currentProjectSlug={project.slug}
          workspaceSlug={workspaceAccess.workspace.slug}
        />
      ) : (
        <section className="placeholder-panel">
          <h2 className="placeholder-panel-title">Read-only launch access</h2>
          <p className="placeholder-panel-description">
            Your current role can view launch history and deployment activity but cannot create
            launch requests.
          </p>
        </section>
      )}
      <section className="placeholder-panel">
        <h2 className="placeholder-panel-title">Launch requests</h2>
        <p className="placeholder-panel-description">
          Requests move from pending to claimed to deploying, then succeed or fail.
        </p>
        {requests.length === 0 ? (
          <p className="placeholder-panel-description">No token launch requests exist yet.</p>
        ) : (
          <ul className="dashboard-list">
            {requests.map((request) => (
              <li className="dashboard-list-item" key={request.id}>
                <h3 className="dashboard-list-title">
                  {request.registryLabel} ({request.tokenSymbol})
                </h3>
                <p className="dashboard-list-meta">Status: {request.status}</p>
                <p className="dashboard-list-meta">Token name: {request.tokenName}</p>
                <p className="dashboard-list-meta">Cap: {request.cap}</p>
                <p className="dashboard-list-meta">Initial supply: {request.initialSupply}</p>
                {request.deployedAddress ? (
                  <p className="dashboard-list-meta">Address: {request.deployedAddress}</p>
                ) : null}
                {request.deploymentTxHash ? (
                  <p className="dashboard-list-meta">Deployment tx: {request.deploymentTxHash}</p>
                ) : null}
                {request.failureMessage ? (
                  <p className="dashboard-list-meta">Failure: {request.failureMessage}</p>
                ) : null}
                {request.verificationUrl ? (
                  <div className="page-shell-actions">
                    <a
                      className="button-link secondary"
                      href={request.verificationUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Open verified source
                    </a>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
      <ProjectActivityFeed activities={activities} />
    </PageShell>
  );
}
