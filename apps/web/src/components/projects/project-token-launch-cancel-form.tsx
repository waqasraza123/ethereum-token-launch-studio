import { cancelProjectTokenLaunchRequestAction } from "@/app/(admin)/dashboard/[workspaceSlug]/projects/[projectSlug]/token-launch/actions";

type ProjectTokenLaunchCancelFormProps = Readonly<{
  currentProjectSlug: string;
  requestId: string;
  workspaceSlug: string;
}>;

export function ProjectTokenLaunchCancelForm({
  currentProjectSlug,
  requestId,
  workspaceSlug
}: ProjectTokenLaunchCancelFormProps) {
  return (
    <form action={cancelProjectTokenLaunchRequestAction} className="inline-form">
      <input name="workspaceSlug" type="hidden" value={workspaceSlug} />
      <input name="currentProjectSlug" type="hidden" value={currentProjectSlug} />
      <input name="requestId" type="hidden" value={requestId} />
      <button className="button-link secondary" type="submit">
        Cancel launch
      </button>
    </form>
  );
}
