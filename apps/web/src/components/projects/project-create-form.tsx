import { createProjectAction } from "@/app/(admin)/dashboard/[workspaceSlug]/projects/new/actions";

type ProjectCreateFormProps = Readonly<{
  errorMessage: string | null;
  workspaceName: string;
  workspaceSlug: string;
}>;

export function ProjectCreateForm({
  errorMessage,
  workspaceName,
  workspaceSlug,
}: ProjectCreateFormProps) {
  return (
    <section className="placeholder-panel">
      <h2 className="placeholder-panel-title">Create a project</h2>
      <p className="placeholder-panel-description">
        This creates the first protected workspace-scoped project record through a database function
        that validates the actor’s membership role.
      </p>
      {errorMessage ? <div className="status-banner error">{errorMessage}</div> : null}
      <form action={createProjectAction} className="form-card">
        <input name="workspaceSlug" type="hidden" value={workspaceSlug} />
        <div className="field-grid">
          <label className="field-label" htmlFor="projectName">
            <span>Project name</span>
            <input
              className="text-input"
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
              id="projectSlug"
              maxLength={63}
              name="projectSlug"
              required
              type="text"
            />
            <span className="field-hint">
              This project will be created inside {workspaceName}. Lowercase letters, numbers, and
              hyphens only.
            </span>
          </label>
          <label className="field-label" htmlFor="projectDescription">
            <span>Project description</span>
            <textarea
              className="text-input"
              id="projectDescription"
              maxLength={5000}
              name="projectDescription"
              rows={5}
            />
          </label>
        </div>
        <div className="page-shell-actions">
          <button className="button-link" type="submit">
            Create project
          </button>
        </div>
      </form>
    </section>
  );
}
