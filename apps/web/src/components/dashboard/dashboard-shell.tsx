import Link from "next/link";
import { PageShell } from "@/components/foundation/page-shell";
import type { AuthenticatedUser } from "@/lib/auth/session";
import { getWorkspaceDashboardPath } from "@/lib/routing/route-paths";
import type { WorkspaceAccessContext } from "@/lib/workspaces/access";
import { SignOutForm } from "./sign-out-form";

type DashboardShellProps = Readonly<{
  errorMessage: string | null;
  statusMessage: string | null;
  user: AuthenticatedUser;
  workspaceAccess: readonly WorkspaceAccessContext[];
}>;

const selectorNotes = [
  "The root dashboard route now acts as a workspace selector when the authenticated user belongs to multiple workspaces.",
  "Users with a single workspace are redirected directly into that workspace route.",
  "Users without memberships still land in first-workspace bootstrap mode."
];

export function DashboardShell({
  errorMessage,
  statusMessage,
  user,
  workspaceAccess
}: DashboardShellProps) {
  return (
    <PageShell
      eyebrow="Workspace selector"
      title="Choose the workspace you want to operate inside."
      description={`Signed in as ${user.email ?? user.id}. Workspace routes now drive the protected admin surface.`}
      actions={<SignOutForm />}
    >
      {statusMessage ? <div className="status-banner success">{statusMessage}</div> : null}
      {errorMessage ? <div className="status-banner error">{errorMessage}</div> : null}
      <section className="placeholder-panel">
        <h2 className="placeholder-panel-title">Available workspaces</h2>
        <p className="placeholder-panel-description">
          Each route below is authorized server-side against the authenticated user’s membership
          before any workspace or project data is rendered.
        </p>
        <ul className="dashboard-list">
          {workspaceAccess.map((record) => (
            <li className="dashboard-list-item" key={`${record.workspace.id}:${record.role}`}>
              <h3 className="dashboard-list-title">{record.workspace.name}</h3>
              <p className="dashboard-list-meta">Slug: {record.workspace.slug}</p>
              <p className="dashboard-list-meta">Role: {record.role}</p>
              <div className="page-shell-actions">
                <Link
                  className="button-link"
                  href={getWorkspaceDashboardPath(record.workspace.slug)}
                >
                  Open workspace
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section className="placeholder-panel">
        <h2 className="placeholder-panel-title">What this route proves now</h2>
        <p className="placeholder-panel-description">
          The admin entry route is no longer pretending every user has one implicit workspace.
        </p>
        <ul className="placeholder-list">
          {selectorNotes.map((item) => (
            <li className="placeholder-list-item" key={item}>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>
    </PageShell>
  );
}
