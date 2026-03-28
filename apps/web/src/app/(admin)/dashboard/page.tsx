import { redirect } from "next/navigation";
import { BootstrapWorkspaceForm } from "@/components/workspaces/bootstrap-workspace-form";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { SignOutForm } from "@/components/dashboard/sign-out-form";
import { PageShell } from "@/components/foundation/page-shell";
import { requireCurrentUser } from "@/lib/auth/session";
import { getWorkspaceDashboardPath } from "@/lib/routing/route-paths";
import { getWorkspaceAccessOverview } from "@/lib/workspaces/access";

export const dynamic = "force-dynamic";

type DashboardPageProps = Readonly<{
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

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const currentUser = await requireCurrentUser();
  const resolvedSearchParams = await searchParams;
  const errorMessage = readSingleSearchParam(resolvedSearchParams, "error");
  const createdMessage =
    readSingleSearchParam(resolvedSearchParams, "created") === "1"
      ? "Workspace created successfully."
      : null;
  const workspaceAccess = await getWorkspaceAccessOverview();

  if (workspaceAccess.length === 0) {
    return (
      <PageShell
        eyebrow="Workspace bootstrap"
        title="Create the first workspace before deeper admin tooling lands."
        description="This route is now authenticated through the user session and can bootstrap the first workspace without a service-role read path."
        actions={<SignOutForm />}
      >
        {createdMessage ? <div className="status-banner success">{createdMessage}</div> : null}
        <BootstrapWorkspaceForm errorMessage={errorMessage} />
      </PageShell>
    );
  }

  const onlyWorkspaceAccess = workspaceAccess[0];

  if (workspaceAccess.length === 1 && onlyWorkspaceAccess) {
    redirect(getWorkspaceDashboardPath(onlyWorkspaceAccess.workspace.slug));
  }

  return (
    <DashboardShell
      errorMessage={errorMessage}
      user={currentUser}
      workspaceAccess={workspaceAccess}
    />
  );
}
