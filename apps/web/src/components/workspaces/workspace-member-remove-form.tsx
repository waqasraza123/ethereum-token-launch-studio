import { removeWorkspaceMemberAction } from "@/app/(admin)/dashboard/[workspaceSlug]/members/actions";

type WorkspaceMemberRemoveFormProps = Readonly<{
  targetAuthUserId: string;
  workspaceMemberId: string;
  workspaceSlug: string;
}>;

export function WorkspaceMemberRemoveForm({
  targetAuthUserId,
  workspaceMemberId,
  workspaceSlug
}: WorkspaceMemberRemoveFormProps) {
  return (
    <form action={removeWorkspaceMemberAction} className="inline-form">
      <input name="targetAuthUserId" type="hidden" value={targetAuthUserId} />
      <input name="workspaceMemberId" type="hidden" value={workspaceMemberId} />
      <input name="workspaceSlug" type="hidden" value={workspaceSlug} />
      <button className="button-link secondary" type="submit">
        Remove member
      </button>
    </form>
  );
}
