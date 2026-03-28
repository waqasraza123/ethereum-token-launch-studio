import { notFound, redirect } from "next/navigation";
import { ProjectSettingsShell } from "@/components/projects/project-settings-shell";
import { requireCurrentUser } from "@/lib/auth/session";
import { getProjectBySlug } from "@/lib/projects/data";
import { getWorkspaceDashboardPath } from "@/lib/routing/route-paths";
import {
  canCreateProjectsForRole,
  getWorkspaceAccessBySlug
} from "@/lib/workspaces/access";

export const dynamic = "force-dynamic";

type ProjectSettingsPageProps = Readonly<{
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

export default async function ProjectSettingsPage({
  params,
  searchParams
}: ProjectSettingsPageProps) {
  await requireCurrentUser();

  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const workspaceAccess = await getWorkspaceAccessBySlug(resolvedParams.workspaceSlug);

  if (!workspaceAccess) {
    notFound();
  }

  if (!canCreateProjectsForRole(workspaceAccess.role)) {
    redirect(
      `${getWorkspaceDashboardPath(workspaceAccess.workspace.slug)}?error=${encodeURIComponent(
        "Your current role cannot manage projects in this workspace."
      )}`
    );
  }

  const project = await getProjectBySlug(
    workspaceAccess.workspace.id,
    resolvedParams.projectSlug
  );

  if (!project) {
    notFound();
  }

  const errorMessage = readSingleSearchParam(resolvedSearchParams, "error");

  return (
    <ProjectSettingsShell
      errorMessage={errorMessage}
      project={project}
      workspaceAccess={workspaceAccess}
    />
  );
}
