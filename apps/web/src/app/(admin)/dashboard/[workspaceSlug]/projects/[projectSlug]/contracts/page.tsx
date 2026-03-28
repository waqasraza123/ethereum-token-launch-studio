import { notFound } from "next/navigation";
import { ProjectContractsShell } from "@/components/contracts/project-contracts-shell";
import { requireCurrentUser } from "@/lib/auth/session";
import { listProjectContracts } from "@/lib/contracts/registry";
import { getProjectBySlug } from "@/lib/projects/data";
import { getWorkspaceAccessBySlug } from "@/lib/workspaces/access";

export const dynamic = "force-dynamic";

type ProjectContractsPageProps = Readonly<{
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

export default async function ProjectContractsPage({
  params,
  searchParams
}: ProjectContractsPageProps) {
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

  const contracts = await listProjectContracts(project.id);
  const errorMessage = readSingleSearchParam(resolvedSearchParams, "error");
  const statusMessage =
    readSingleSearchParam(resolvedSearchParams, "attached") === "1"
      ? "Project contract attached successfully."
      : readSingleSearchParam(resolvedSearchParams, "detached") === "1"
        ? "Project contract detached successfully."
        : null;

  return (
    <ProjectContractsShell
      contracts={contracts}
      errorMessage={errorMessage}
      project={project}
      statusMessage={statusMessage}
      workspaceAccess={workspaceAccess}
    />
  );
}
