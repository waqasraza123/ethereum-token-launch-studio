import { updateProjectAction } from "@/app/(admin)/dashboard/[workspaceSlug]/projects/[projectSlug]/settings/actions";
import type { ProjectOverview } from "@/lib/projects/data";

type ProjectEditFormProps = Readonly<{
  project: ProjectOverview;
  workspaceSlug: string;
}>;

export function ProjectEditForm({ project, workspaceSlug }: ProjectEditFormProps) {
  return (
    <section className="placeholder-panel">
      <h2 className="placeholder-panel-title">Edit project</h2>
      <p className="placeholder-panel-description">
        This updates the project record through a role-aware database function under the current
        authorized workspace.
      </p>
      <form action={updateProjectAction} className="form-card">
        <input name="workspaceSlug" type="hidden" value={workspaceSlug} />
        <input name="currentProjectSlug" type="hidden" value={project.slug} />
        <div className="field-grid">
          <label className="field-label" htmlFor="projectName">
            <span>Project name</span>
            <input
              className="text-input"
              defaultValue={project.name}
              id="projectName"
              maxLength={160}
              name="projectName"
              required
              type="text"
            />
          </label>
          <label className="field-label" htmlFor="projectSlug">
            <span>Project slug</span>
            <input
              className="text-input"
              defaultValue={project.slug}
              id="projectSlug"
              maxLength={63}
              name="projectSlug"
              required
              type="text"
            />
          </label>
          <label className="field-label" htmlFor="projectDescription">
            <span>Project description</span>
            <textarea
              className="text-input"
              defaultValue={project.description ?? ""}
              id="projectDescription"
              maxLength={5000}
              name="projectDescription"
              rows={5}
            />
          </label>
        </div>
        <div className="page-shell-actions">
          <button className="button-link" type="submit">
            Save project
          </button>
        </div>
      </form>
    </section>
  );
}
