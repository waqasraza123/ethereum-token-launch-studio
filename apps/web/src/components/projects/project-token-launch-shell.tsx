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
import type { ProjectTokenLaunchWorkerStatusOverview } from "@/lib/token-launch/workers";
import {
  canCreateProjectsForRole,
  type WorkspaceAccessContext
} from "@/lib/workspaces/access";
import { ProjectActivityFeed } from "./project-activity-feed";
import { ProjectTokenLaunchCancelForm } from "./project-token-launch-cancel-form";
import { ProjectTokenLaunchForm } from "./project-token-launch-form";
import { ProjectTokenLaunchLiveUpdates } from "./project-token-launch-live-updates";
import { ProjectTokenLaunchRetryForm } from "./project-token-launch-retry-form";
import { ProjectTokenLaunchWorkerPanel } from "./project-token-launch-worker-panel";

type ProjectTokenLaunchShellProps = Readonly<{
  activities: readonly ProjectActivityOverview[];
  errorMessage: string | null;
  project: ProjectOverview;
  requests: readonly ProjectTokenLaunchRequestOverview[];
  statusMessage: string | null;
  workerStatuses: readonly ProjectTokenLaunchWorkerStatusOverview[];
  workspaceAccess: WorkspaceAccessContext;
}>;

const canCancelRequestStatus = (status: string): boolean =>
  status === "pending" || status === "claimed" || status === "retry_scheduled";

export function ProjectTokenLaunchShell({
  activities,
  errorMessage,
  project,
  requests,
  statusMessage,
  workerStatuses,
  workspaceAccess
}: ProjectTokenLaunchShellProps) {
  const canLaunch = canCreateProjectsForRole(workspaceAccess.role);

  return (
    <PageShell
      eyebrow="Project token launch"
      title={`Launch token for ${project.name}.`}
      description="This route now adds live updates, worker heartbeat visibility, protected cancellation, and keeps retry controls for terminal failures."
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
      <ProjectTokenLaunchLiveUpdates projectId={project.id} />
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
            Your current role can view launch history and worker state but cannot create, retry, or cancel launch requests.
          </p>
        </section>
      )}
      <ProjectTokenLaunchWorkerPanel workerStatuses={workerStatuses} />
      <section className="placeholder-panel">
        <h2 className="placeholder-panel-title">Launch requests</h2>
        <p className="placeholder-panel-description">
          Pending, claimed, and retry-scheduled launches can be cancelled before deployment starts. Terminal failures can still be retried.
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
                <p className="dashboard-list-meta">
                  Retries: {request.retryCount} / {request.maxAttempts}
                </p>
                {request.workerId ? (
                  <p className="dashboard-list-meta">Worker: {request.workerId}</p>
                ) : null}
                {request.claimedAt ? (
                  <p className="dashboard-list-meta">Claimed at: {request.claimedAt}</p>
                ) : null}
                {request.startedAt ? (
                  <p className="dashboard-list-meta">Started at: {request.startedAt}</p>
                ) : null}
                {request.heartbeatAt ? (
                  <p className="dashboard-list-meta">Heartbeat at: {request.heartbeatAt}</p>
                ) : null}
                {request.nextRetryAt ? (
                  <p className="dashboard-list-meta">Next retry at: {request.nextRetryAt}</p>
                ) : null}
                {request.lastErrorAt ? (
                  <p className="dashboard-list-meta">Last error at: {request.lastErrorAt}</p>
                ) : null}
                {request.failedAt ? (
                  <p className="dashboard-list-meta">Failed at: {request.failedAt}</p>
                ) : null}
                {request.deployedAddress ? (
                  <p className="dashboard-list-meta">Address: {request.deployedAddress}</p>
                ) : null}
                {request.deploymentTxHash ? (
                  <p className="dashboard-list-meta">Deployment tx: {request.deploymentTxHash}</p>
                ) : null}
                {request.failureMessage ? (
                  <p className="dashboard-list-meta">Failure: {request.failureMessage}</p>
                ) : null}
                <div className="page-shell-actions">
                  {request.verificationUrl ? (
                    <a
                      className="button-link secondary"
                      href={request.verificationUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Open verified source
                    </a>
                  ) : null}
                  {canLaunch && canCancelRequestStatus(request.status) ? (
                    <ProjectTokenLaunchCancelForm
                      currentProjectSlug={project.slug}
                      requestId={request.id}
                      workspaceSlug={workspaceAccess.workspace.slug}
                    />
                  ) : null}
                  {canLaunch && request.status === "failed" ? (
                    <ProjectTokenLaunchRetryForm
                      currentProjectSlug={project.slug}
                      requestId={request.id}
                      workspaceSlug={workspaceAccess.workspace.slug}
                    />
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      <ProjectActivityFeed activities={activities} />
    </PageShell>
  );
}
