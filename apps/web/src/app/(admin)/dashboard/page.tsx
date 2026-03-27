import { BootstrapWorkspaceForm } from "@/components/workspaces/bootstrap-workspace-form";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { SignOutForm } from "@/components/dashboard/sign-out-form";
import { PageShell } from "@/components/foundation/page-shell";
import { requireCurrentUser } from "@/lib/auth/session";
import { getWorkspaceAccessOverview } from "@/lib/workspaces/dashboard";

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

  const workspaceAccess = await getWorkspaceAccessOverview(currentUser.id);

  if (workspaceAccess.length === 0) {
    return (
      <PageShell
        eyebrow="Workspace bootstrap"
        title="Create the first workspace before deeper admin tooling lands."
        description="The dashboard already validates the current auth session and knows there is no workspace membership yet. This form bootstraps the first owner workspace through a database-side function."
        actions={<SignOutForm />}
      >
        <BootstrapWorkspaceForm errorMessage={errorMessage} />
      </PageShell>
    );
  }

  return (
    <DashboardShell
      createdMessage={createdMessage}
      errorMessage={errorMessage}
      user={currentUser}
      workspaceAccess={workspaceAccess}
    />
  );
}
