import { detachProjectContractAction } from "@/app/(admin)/dashboard/[workspaceSlug]/projects/[projectSlug]/contracts/actions";

type ProjectContractDetachFormProps = Readonly<{
  currentProjectSlug: string;
  projectContractId: string;
  workspaceSlug: string;
}>;

export function ProjectContractDetachForm({
  currentProjectSlug,
  projectContractId,
  workspaceSlug
}: ProjectContractDetachFormProps) {
  return (
    <form action={detachProjectContractAction} className="inline-form">
      <input name="workspaceSlug" type="hidden" value={workspaceSlug} />
      <input name="currentProjectSlug" type="hidden" value={currentProjectSlug} />
      <input name="projectContractId" type="hidden" value={projectContractId} />
      <button className="button-link secondary" type="submit">
        Detach
      </button>
    </form>
  );
}
