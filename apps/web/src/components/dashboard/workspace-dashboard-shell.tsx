import Link from "next/link";
import { PageShell } from "@/components/foundation/page-shell";
import type { ProjectOverview } from "@/lib/projects/data";
import {
  getWorkspaceMembersPath,
  getWorkspaceProjectNewPath,
  getWorkspaceProjectPath,
  routePaths
} from "@/lib/routing/route-paths";
import {
  canCreateProjectsForRole,
  type WorkspaceAccessContext
} from "@/lib/workspaces/access";
import { SignOutForm } from "./sign-out-form";

type WorkspaceDashboardShellProps = Readonly<{
  errorMessage: string | null;
  projects: readonly ProjectOverview[];
  workspaceAccess: WorkspaceAccessContext;
}>;

const workspaceNotes = [
  "This route is keyed by workspace slug and only renders after a server-side membership check.",
  "Project reads are now scoped to the authorized workspace instead of coming from a global dashboard placeholder.",
  "Workspace membership management now lives in a dedicated protected members route."
];

export function WorkspaceDashboardShell({
  errorMessage,
  projects,
  workspaceAccess
}: WorkspaceDashboardShellProps) {
  const canCreateProjects = canCreateProjectsForRole(workspaceAccess.role);

  return (
    <PageShell
      eyebrow="Workspace dashboard"
      title={workspaceAccess.workspace.name}
      description={`You are inside the ${workspaceAccess.workspace.slug} workspace as ${workspaceAccess.role}.`}
      actions={
        <div className="page-shell-actions">
          <Link className="button-link secondary" href={routePaths.dashboard}>
            All workspaces
          </Link>
          <Link
            className="button-link secondary"
            href={getWorkspaceMembersPath(workspaceAccess.workspace.slug)}
          >
            Members
          </Link>
          {canCreateProjects ? (
            <Link
              className="button-link"
              href={getWorkspaceProjectNewPath(workspaceAccess.workspace.slug)}
            >
              New project
            </Link>
          ) : null}
          <SignOutForm />
        </div>
      }
    >
      {errorMessage ? <div className="status-banner error">{errorMessage}</div> : null}
      <section className="placeholder-panel">
        <h2 className="placeholder-panel-title">Current workspace context</h2>
        <p className="placeholder-panel-description">
          This page is the first protected workspace-scoped admin surface in the app.
        </p>
        <ul className="placeholder-list">
          {workspaceNotes.map((item) => (
            <li className="placeholder-list-item" key={item}>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>
      <section className="placeholder-panel">
        <h2 className="placeholder-panel-title">Projects</h2>
        <p className="placeholder-panel-description">
          Projects are now read by workspace and linked through protected workspace-aware routes.
        </p>
        {projects.length === 0 ? (
          <p className="placeholder-panel-description">
            No projects exist yet for this workspace.
          </p>
        ) : (
          <ul className="dashboard-list">
            {projects.map((project) => (
              <li className="dashboard-list-item" key={project.id}>
                <h3 className="dashboard-list-title">{project.name}</h3>
                <p className="dashboard-list-meta">Slug: {project.slug}</p>
                <p className="dashboard-list-meta">
                  {project.description ?? "No description provided yet."}
                </p>
                <div className="page-shell-actions">
                  <Link
                    className="button-link secondary"
                    href={getWorkspaceProjectPath(
                      workspaceAccess.workspace.slug,
                      project.slug
                    )}
                  >
                    Open project
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </PageShell>
  );
}
