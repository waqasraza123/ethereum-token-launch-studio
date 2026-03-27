import { bootstrapWorkspaceAction } from "@/app/(admin)/dashboard/actions";

type BootstrapWorkspaceFormProps = Readonly<{
  errorMessage: string | null;
}>;

export function BootstrapWorkspaceForm({ errorMessage }: BootstrapWorkspaceFormProps) {
  return (
    <section className="placeholder-panel">
      <h2 className="placeholder-panel-title">First workspace bootstrap</h2>
      <p className="placeholder-panel-description">
        This is the first authenticated data write in the admin app. It creates the workspace and
        the owner membership together through a database function.
      </p>
      {errorMessage ? <div className="status-banner error">{errorMessage}</div> : null}
      <form action={bootstrapWorkspaceAction} className="form-card">
        <div className="field-grid">
          <label className="field-label" htmlFor="workspaceName">
            <span>Workspace name</span>
            <input
              className="text-input"
              id="workspaceName"
              maxLength={120}
              name="workspaceName"
              required
              type="text"
            />
          </label>
          <label className="field-label" htmlFor="workspaceSlug">
            <span>Workspace slug</span>
            <input
              className="text-input"
              id="workspaceSlug"
              maxLength={63}
              name="workspaceSlug"
              required
              type="text"
            />
            <span className="field-hint">
              Lowercase letters, numbers, and hyphens only. Spaces are normalized into hyphens.
            </span>
          </label>
        </div>
        <div className="page-shell-actions">
          <button className="button-link" type="submit">
            Create workspace
          </button>
        </div>
      </form>
    </section>
  );
}
