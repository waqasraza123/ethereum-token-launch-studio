import { deleteProjectAction } from "@/app/(admin)/dashboard/[workspaceSlug]/projects/[projectSlug]/settings/actions";

type ProjectDeleteFormProps = Readonly<{
  currentProjectSlug: string;
  workspaceSlug: string;
}>;

export function ProjectDeleteForm({
  currentProjectSlug,
  workspaceSlug
}: ProjectDeleteFormProps) {
  return (
    <section className="placeholder-panel">
      <h2 className="placeholder-panel-title">Delete project</h2>
      <p className="placeholder-panel-description">
        Project deletion is blocked while contracts are still attached. Detach all contracts first,
        then delete the project.
      </p>
      <form action={deleteProjectAction} className="form-card">
        <input name="workspaceSlug" type="hidden" value={workspaceSlug} />
        <input name="currentProjectSlug" type="hidden" value={currentProjectSlug} />
        <div className="page-shell-actions">
          <button className="button-link secondary" type="submit">
            Delete project
          </button>
        </div>
      </form>
    </section>
  );
}
