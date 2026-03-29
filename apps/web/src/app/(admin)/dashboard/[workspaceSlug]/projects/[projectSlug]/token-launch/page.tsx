import { notFound } from "next/navigation";
import { listProjectActivities } from "@/lib/activity";
import { requireCurrentUser } from "@/lib/auth/session";
import { getProjectBySlug } from "@/lib/projects/data";
import { listProjectTokenLaunchRequests } from "@/lib/token-launch/requests";
import { deriveProjectTokenLaunchWorkerStatuses } from "@/lib/token-launch/workers";
import { getWorkspaceAccessBySlug } from "@/lib/workspaces/access";
import { ProjectTokenLaunchShell } from "@/components/projects/project-token-launch-shell";

export const dynamic = "force-dynamic";

type ProjectTokenLaunchPageProps = Readonly<{
  params: Promise<{
    projectSlug: string;
    workspaceSlug: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

const readSingleSearchParam = (
  searchParams: Record<string, string | string[] | undefined>,
  key: string
): string | null => {
  const value = searchParams[key];

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
};

export default async function ProjectTokenLaunchPage({
  params,
  searchParams
}: ProjectTokenLaunchPageProps) {
  await requireCurrentUser();

  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const workspaceAccess = await getWorkspaceAccessBySlug(resolvedParams.workspaceSlug);

  if (!workspaceAccess) {
    notFound();
  }

  const project = await getProjectBySlug(
    workspaceAccess.workspace.id,
    resolvedParams.projectSlug
  );

  if (!project) {
    notFound();
  }

  const requests = await listProjectTokenLaunchRequests(project.id);
  const activities = await listProjectActivities(project.id, 25);
  const workerStatuses = deriveProjectTokenLaunchWorkerStatuses(
    requests,
    Number(process.env.TOKEN_LAUNCH_STALE_AFTER_MS ?? "1800000")
  );

  const errorMessage = readSingleSearchParam(resolvedSearchParams, "error");
  const statusMessage =
    readSingleSearchParam(resolvedSearchParams, "queued") === "1"
      ? "Project token launch request queued successfully."
      : readSingleSearchParam(resolvedSearchParams, "retried") === "1"
        ? "Failed project token launch request retried successfully."
        : readSingleSearchParam(resolvedSearchParams, "cancelled") === "1"
          ? "Project token launch request cancelled successfully."
          : null;

  return (
    <ProjectTokenLaunchShell
      activities={activities}
      errorMessage={errorMessage}
      project={project}
      requests={requests}
      statusMessage={statusMessage}
      workerStatuses={workerStatuses}
      workspaceAccess={workspaceAccess}
    />
  );
}
