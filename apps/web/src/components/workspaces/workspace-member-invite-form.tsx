import { inviteWorkspaceMemberAction } from "@/app/(admin)/dashboard/[workspaceSlug]/members/actions";

type WorkspaceMemberInviteFormProps = Readonly<{
  workspaceSlug: string;
}>;

const roleOptions = ["owner", "ops_manager", "finance_manager", "viewer"] as const;

export function WorkspaceMemberInviteForm({
  workspaceSlug
}: WorkspaceMemberInviteFormProps) {
  return (
    <section className="placeholder-panel">
      <h2 className="placeholder-panel-title">Invite existing user</h2>
      <p className="placeholder-panel-description">
        This adds an existing Supabase Auth user into the workspace by email. Email delivery for
        not-yet-registered users is intentionally deferred.
      </p>
      <form action={inviteWorkspaceMemberAction} className="form-card">
        <input name="workspaceSlug" type="hidden" value={workspaceSlug} />
        <div className="field-grid">
          <label className="field-label" htmlFor="memberEmail">
            <span>User email</span>
            <input className="text-input" id="memberEmail" name="memberEmail" required type="email" />
          </label>
          <label className="field-label" htmlFor="memberRole">
            <span>Role</span>
            <select className="text-input" defaultValue="viewer" id="memberRole" name="role">
              {roleOptions.map((roleOption) => (
                <option key={roleOption} value={roleOption}>
                  {roleOption}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="page-shell-actions">
          <button className="button-link" type="submit">
            Add member
          </button>
        </div>
      </form>
    </section>
  );
}
