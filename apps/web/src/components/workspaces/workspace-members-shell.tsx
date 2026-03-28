import Link from "next/link";
import { SignOutForm } from "@/components/dashboard/sign-out-form";
import { PageShell } from "@/components/foundation/page-shell";
import { getWorkspaceDashboardPath } from "@/lib/routing/route-paths";
import {
  canManageWorkspaceMembersForRole,
  type WorkspaceAccessContext
} from "@/lib/workspaces/access";
import type { WorkspaceMemberOverview } from "@/lib/workspaces/members";
import { WorkspaceMemberInviteForm } from "./workspace-member-invite-form";
import { WorkspaceMemberRemoveForm } from "./workspace-member-remove-form";
import { WorkspaceMemberRoleForm } from "./workspace-member-role-form";

type WorkspaceMembersShellProps = Readonly<{
  errorMessage: string | null;
  members: readonly WorkspaceMemberOverview[];
  statusMessage: string | null;
  workspaceAccess: WorkspaceAccessContext;
}>;

const membershipNotes = [
  "All workspace members can view the current member list.",
  "Only owners can add members, change roles, or remove members.",
  "The database functions protect the last-owner path so the workspace cannot be left ownerless."
];

export function WorkspaceMembersShell({
  errorMessage,
  members,
  statusMessage,
  workspaceAccess
}: WorkspaceMembersShellProps) {
  const canManageMembers = canManageWorkspaceMembersForRole(workspaceAccess.role);

  return (
    <PageShell
      eyebrow="Workspace members"
      title={`Manage members for ${workspaceAccess.workspace.name}.`}
      description={`You are viewing workspace memberships as ${workspaceAccess.role}.`}
      actions={
        <div className="page-shell-actions">
          <Link
            className="button-link secondary"
            href={getWorkspaceDashboardPath(workspaceAccess.workspace.slug)}
          >
            Back to workspace
          </Link>
          <SignOutForm />
        </div>
      }
    >
      {statusMessage ? <div className="status-banner success">{statusMessage}</div> : null}
      {errorMessage ? <div className="status-banner error">{errorMessage}</div> : null}
      {canManageMembers ? (
        <WorkspaceMemberInviteForm workspaceSlug={workspaceAccess.workspace.slug} />
      ) : (
        <section className="placeholder-panel">
          <h2 className="placeholder-panel-title">Read-only membership access</h2>
          <p className="placeholder-panel-description">
            Your current role can view members but cannot change the workspace membership roster.
          </p>
        </section>
      )}
      <section className="placeholder-panel">
        <h2 className="placeholder-panel-title">Current members</h2>
        <p className="placeholder-panel-description">
          These rows are loaded through an authenticated workspace-scoped function rather than a
          global service-role read.
        </p>
        <ul className="dashboard-list">
          {members.map((member) => (
            <li className="dashboard-list-item" key={member.id}>
              <h3 className="dashboard-list-title">
                {member.email ?? member.authUserId}
                {member.isCurrentUser ? " — you" : ""}
              </h3>
              <p className="dashboard-list-meta">Role: {member.role}</p>
              <p className="dashboard-list-meta">Added at: {member.createdAt}</p>
              {canManageMembers && !member.isCurrentUser ? (
                <div className="field-grid">
                  <WorkspaceMemberRoleForm
                    currentRole={member.role}
                    workspaceMemberId={member.id}
                    workspaceSlug={workspaceAccess.workspace.slug}
                  />
                  <WorkspaceMemberRemoveForm
                    targetAuthUserId={member.authUserId}
                    workspaceMemberId={member.id}
                    workspaceSlug={workspaceAccess.workspace.slug}
                  />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
      <section className="placeholder-panel">
        <h2 className="placeholder-panel-title">What this route proves now</h2>
        <ul className="placeholder-list">
          {membershipNotes.map((item) => (
            <li className="placeholder-list-item" key={item}>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>
    </PageShell>
  );
}
