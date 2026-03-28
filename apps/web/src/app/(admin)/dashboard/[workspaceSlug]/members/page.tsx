import { notFound } from "next/navigation";
import { WorkspaceMembersShell } from "@/components/workspaces/workspace-members-shell";
import { requireCurrentUser } from "@/lib/auth/session";
import { getWorkspaceAccessBySlug } from "@/lib/workspaces/access";
import { listWorkspaceMembers } from "@/lib/workspaces/members";

export const dynamic = "force-dynamic";

type WorkspaceMembersPageProps = Readonly<{
  params: Promise<{
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

export default async function WorkspaceMembersPage({
  params,
  searchParams
}: WorkspaceMembersPageProps) {
  const currentUser = await requireCurrentUser();
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const workspaceAccess = await getWorkspaceAccessBySlug(resolvedParams.workspaceSlug);

  if (!workspaceAccess) {
    notFound();
  }

  const members = await listWorkspaceMembers(workspaceAccess.workspace.id, currentUser.id);
  const errorMessage = readSingleSearchParam(resolvedSearchParams, "error");
  const statusMessage =
    readSingleSearchParam(resolvedSearchParams, "invited") === "1"
      ? "Workspace member added successfully."
      : readSingleSearchParam(resolvedSearchParams, "updated") === "1"
        ? "Workspace member role updated successfully."
        : readSingleSearchParam(resolvedSearchParams, "removed") === "1"
          ? "Workspace member removed successfully."
          : null;

  return (
    <WorkspaceMembersShell
      errorMessage={errorMessage}
      members={members}
      statusMessage={statusMessage}
      workspaceAccess={workspaceAccess}
    />
  );
}
