import Link from "next/link";
import { SignOutForm } from "@/components/dashboard/sign-out-form";
import { PageShell } from "@/components/foundation/page-shell";
import type { ProjectActivityOverview } from "@/lib/activity";
import type { ProjectOverview } from "@/lib/projects/data";
import {
  getWorkspaceDashboardPath,
  getWorkspaceProjectContractsPath,
  getWorkspaceProjectNewPath,
  getWorkspaceProjectSettingsPath,
  getWorkspaceProjectTokenLaunchPath
} from "@/lib/routing/route-paths";
import {
  canCreateProjectsForRole,
  type WorkspaceAccessContext
} from "@/lib/workspaces/access";
import { ProjectActivityFeed } from "./project-activity-feed";

type ProjectDetailShellProps = Readonly<{
  activities: readonly ProjectActivityOverview[];
  project: ProjectOverview;
  statusMessage: string | null;
  workspaceAccess: WorkspaceAccessContext;
}>;

const detailNotes = [
  "This route proves the protected workspace-plus-project read path.",
  "Token launches now flow through a dedicated operator workflow route backed by worker execution.",
  "The project feed is now normalized and records launch request and deployment lifecycle events."
];

export function ProjectDetailShell({
  activities,
  project,
  statusMessage,
  workspaceAccess
}: ProjectDetailShellProps) {
  const canManageProject = canCreateProjectsForRole(workspaceAccess.role);

  return (
    <PageShell
      eyebrow="Project detail"
      title={project.name}
      description={`Project ${project.slug} inside ${workspaceAccess.workspace.name}.`}
      actions={
        <div className="page-shell-actions">
          <Link
            className="button-link secondary"
            href={getWorkspaceDashboardPath(workspaceAccess.workspace.slug)}
          >
            Back to workspace
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
            href={getWorkspaceProjectTokenLaunchPath(
              workspaceAccess.workspace.slug,
              project.slug
            )}
          >
            Token launch
          </Link>
          {canManageProject ? (
            <>
              <Link
                className="button-link secondary"
                href={getWorkspaceProjectSettingsPath(
                  workspaceAccess.workspace.slug,
                  project.slug
                )}
              >
                Settings
              </Link>
              <Link
                className="button-link"
                href={getWorkspaceProjectNewPath(workspaceAccess.workspace.slug)}
              >
                New project
              </Link>
            </>
          ) : null}
          <SignOutForm />
        </div>
      }
    >
      {statusMessage ? <div className="status-banner success">{statusMessage}</div> : null}
      <section className="placeholder-panel">
        <h2 className="placeholder-panel-title">Project summary</h2>
        <p className="placeholder-panel-description">
          {project.description ?? "No description has been added yet for this project."}
        </p>
        <ul className="placeholder-list">
          <li className="placeholder-list-item">
            <span>Workspace role: {workspaceAccess.role}</span>
          </li>
          <li className="placeholder-list-item">
            <span>Project slug: {project.slug}</span>
          </li>
          <li className="placeholder-list-item">
            <span>Created at: {project.createdAt}</span>
          </li>
        </ul>
      </section>
      <ProjectActivityFeed activities={activities} />
      <section className="placeholder-panel">
        <h2 className="placeholder-panel-title">What this route proves now</h2>
        <ul className="placeholder-list">
          {detailNotes.map((item) => (
            <li className="placeholder-list-item" key={item}>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>
    </PageShell>
  );
}
