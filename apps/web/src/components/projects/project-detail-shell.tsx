import Link from "next/link";
import { SignOutForm } from "@/components/dashboard/sign-out-form";
import { PageShell } from "@/components/foundation/page-shell";
import type { ProjectOverview } from "@/lib/projects/data";
import { getWorkspaceDashboardPath, getWorkspaceProjectNewPath } from "@/lib/routing/route-paths";
import { canCreateProjectsForRole, type WorkspaceAccessContext } from "@/lib/workspaces/access";

type ProjectDetailShellProps = Readonly<{
  createdMessage: string | null;
  project: ProjectOverview;
  workspaceAccess: WorkspaceAccessContext;
}>;

const detailNotes = [
  "This route proves the first protected workspace-plus-project read path.",
  "The workspace membership guard runs before the project lookup is resolved.",
  "Project creation now redirects into a real protected read page instead of a generic dashboard.",
];

export function ProjectDetailShell({
  createdMessage,
  project,
  workspaceAccess,
}: ProjectDetailShellProps) {
  const canCreateProjects = canCreateProjectsForRole(workspaceAccess.role);

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
      {createdMessage ? <div className="status-banner success">{createdMessage}</div> : null}
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
