import { notFound } from "next/navigation";
import { WorkspaceDashboardShell } from "@/components/dashboard/workspace-dashboard-shell";
import { requireCurrentUser } from "@/lib/auth/session";
import { listProjectsForWorkspace } from "@/lib/projects/data";
import { getWorkspaceAccessBySlug } from "@/lib/workspaces/access";

export const dynamic = "force-dynamic";

type WorkspaceDashboardPageProps = Readonly<{
  params: Promise<{
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

export default async function WorkspaceDashboardPage({
  params,
  searchParams,
}: WorkspaceDashboardPageProps) {
  await requireCurrentUser();

  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const workspaceAccess = await getWorkspaceAccessBySlug(resolvedParams.workspaceSlug);

  if (!workspaceAccess) {
    notFound();
  }

  const projects = await listProjectsForWorkspace(workspaceAccess.workspace.id);
  const errorMessage = readSingleSearchParam(resolvedSearchParams, "error");

  return (
    <WorkspaceDashboardShell
      errorMessage={errorMessage}
      projects={projects}
      workspaceAccess={workspaceAccess}
    />
  );
}
