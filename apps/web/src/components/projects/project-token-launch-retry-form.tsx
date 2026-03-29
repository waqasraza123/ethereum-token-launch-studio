import { retryProjectTokenLaunchRequestAction } from "@/app/(admin)/dashboard/[workspaceSlug]/projects/[projectSlug]/token-launch/actions";

type ProjectTokenLaunchRetryFormProps = Readonly<{
  currentProjectSlug: string;
  requestId: string;
  workspaceSlug: string;
}>;

export function ProjectTokenLaunchRetryForm({
  currentProjectSlug,
  requestId,
  workspaceSlug
}: ProjectTokenLaunchRetryFormProps) {
  return (
    <form action={retryProjectTokenLaunchRequestAction} className="inline-form">
      <input name="workspaceSlug" type="hidden" value={workspaceSlug} />
      <input name="currentProjectSlug" type="hidden" value={currentProjectSlug} />
      <input name="requestId" type="hidden" value={requestId} />
      <button className="button-link secondary" type="submit">
        Retry launch
      </button>
    </form>
  );
}
