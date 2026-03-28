import { notFound, redirect } from "next/navigation";
import { PageShell } from "@/components/foundation/page-shell";
import { ProjectCreateForm } from "@/components/projects/project-create-form";
import { SignOutForm } from "@/components/dashboard/sign-out-form";
import { requireCurrentUser } from "@/lib/auth/session";
import { getWorkspaceDashboardPath } from "@/lib/routing/route-paths";
import { canCreateProjectsForRole, getWorkspaceAccessBySlug } from "@/lib/workspaces/access";

export const dynamic = "force-dynamic";

type ProjectCreatePageProps = Readonly<{
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

export default async function ProjectCreatePage({ params, searchParams }: ProjectCreatePageProps) {
  const currentUser = await requireCurrentUser();
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const workspaceAccess = await getWorkspaceAccessBySlug(
    currentUser.id,
    resolvedParams.workspaceSlug,
  );

  if (!workspaceAccess) {
    notFound();
  }

  if (!canCreateProjectsForRole(workspaceAccess.role)) {
    redirect(
      `${getWorkspaceDashboardPath(workspaceAccess.workspace.slug)}?error=${encodeURIComponent(
        "Your current role cannot create projects in this workspace.",
      )}`,
    );
  }

  const errorMessage = readSingleSearchParam(resolvedSearchParams, "error");

  return (
    <PageShell
      eyebrow="Project creation"
      title={`Create a project inside ${workspaceAccess.workspace.name}.`}
      description="This route is protected by workspace membership and role-aware server-side authorization before any project write is attempted."
      actions={<SignOutForm />}
    >
      <ProjectCreateForm
        errorMessage={errorMessage}
        workspaceName={workspaceAccess.workspace.name}
        workspaceSlug={workspaceAccess.workspace.slug}
      />
    </PageShell>
  );
}
