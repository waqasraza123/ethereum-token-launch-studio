import { updateWorkspaceMemberRoleAction } from "@/app/(admin)/dashboard/[workspaceSlug]/members/actions";
import type { WorkspaceRole } from "@/lib/workspaces/access";

type WorkspaceMemberRoleFormProps = Readonly<{
  currentRole: WorkspaceRole;
  workspaceMemberId: string;
  workspaceSlug: string;
}>;

const roleOptions = ["owner", "ops_manager", "finance_manager", "viewer"] as const;

export function WorkspaceMemberRoleForm({
  currentRole,
  workspaceMemberId,
  workspaceSlug
}: WorkspaceMemberRoleFormProps) {
  return (
    <form action={updateWorkspaceMemberRoleAction} className="form-card">
      <input name="workspaceSlug" type="hidden" value={workspaceSlug} />
      <input name="workspaceMemberId" type="hidden" value={workspaceMemberId} />
      <label className="field-label" htmlFor={`role-${workspaceMemberId}`}>
        <span>Role</span>
        <select
          className="text-input"
          defaultValue={currentRole}
          id={`role-${workspaceMemberId}`}
          name="role"
        >
          {roleOptions.map((roleOption) => (
            <option key={roleOption} value={roleOption}>
              {roleOption}
            </option>
          ))}
        </select>
      </label>
      <div className="page-shell-actions">
        <button className="button-link secondary" type="submit">
          Update role
        </button>
      </div>
    </form>
  );
}
