import Link from "next/link";
import { SignOutForm } from "@/components/dashboard/sign-out-form";
import { PageShell } from "@/components/foundation/page-shell";
import type { ProjectOverview } from "@/lib/projects/data";
import {
  getWorkspaceDashboardPath,
  getWorkspaceProjectContractsPath,
  getWorkspaceProjectPath
} from "@/lib/routing/route-paths";
import type { WorkspaceAccessContext } from "@/lib/workspaces/access";
import { ProjectDeleteForm } from "./project-delete-form";
import { ProjectEditForm } from "./project-edit-form";

type ProjectSettingsShellProps = Readonly<{
  errorMessage: string | null;
  project: ProjectOverview;
  workspaceAccess: WorkspaceAccessContext;
}>;

const settingsNotes = [
  "Only owner and ops_manager can reach this route.",
  "Project updates run through a workspace-role-aware function.",
  "Project deletion is blocked until all attached contracts are detached."
];

export function ProjectSettingsShell({
  errorMessage,
  project,
  workspaceAccess
}: ProjectSettingsShellProps) {
  return (
    <PageShell
      eyebrow="Project settings"
      title={`Manage ${project.name}.`}
      description="This route finishes the protected project operator flow with editing and deletion safeguards."
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
      {errorMessage ? <div className="status-banner error">{errorMessage}</div> : null}
      <ProjectEditForm project={project} workspaceSlug={workspaceAccess.workspace.slug} />
      <ProjectDeleteForm
        currentProjectSlug={project.slug}
        workspaceSlug={workspaceAccess.workspace.slug}
      />
      <section className="placeholder-panel">
        <h2 className="placeholder-panel-title">What this route proves now</h2>
        <ul className="placeholder-list">
          {settingsNotes.map((item) => (
            <li className="placeholder-list-item" key={item}>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>
    </PageShell>
  );
}
