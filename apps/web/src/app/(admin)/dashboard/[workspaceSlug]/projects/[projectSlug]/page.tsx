import { notFound } from "next/navigation";
import { ProjectDetailShell } from "@/components/projects/project-detail-shell";
import { requireCurrentUser } from "@/lib/auth/session";
import { getProjectBySlug } from "@/lib/projects/data";
import { getWorkspaceAccessBySlug } from "@/lib/workspaces/access";

export const dynamic = "force-dynamic";

type ProjectDetailPageProps = Readonly<{
  params: Promise<{
    projectSlug: string;
    workspaceSlug: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

const readSingleSearchParam = (
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
): string | null => {
  const value = searchParams[key];

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
};

export default async function ProjectDetailPage({ params, searchParams }: ProjectDetailPageProps) {
  await requireCurrentUser();

  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const workspaceAccess = await getWorkspaceAccessBySlug(resolvedParams.workspaceSlug);

  if (!workspaceAccess) {
    notFound();
  }

  const project = await getProjectBySlug(workspaceAccess.workspace.id, resolvedParams.projectSlug);

  if (!project) {
    notFound();
  }

  const createdMessage =
    readSingleSearchParam(resolvedSearchParams, "created") === "1"
      ? "Project created successfully."
      : null;

  return (
    <ProjectDetailShell
      createdMessage={createdMessage}
      project={project}
      workspaceAccess={workspaceAccess}
    />
  );
}
