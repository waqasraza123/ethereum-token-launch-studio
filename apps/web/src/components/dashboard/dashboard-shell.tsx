import { PageShell } from "@/components/foundation/page-shell";
import { PlaceholderPanel } from "@/components/foundation/placeholder-panel";
import type { AuthenticatedUser } from "@/lib/auth/session";
import type { WorkspaceAccessOverview } from "@/lib/workspaces/dashboard";
import { SignOutForm } from "./sign-out-form";

type DashboardShellProps = Readonly<{
  createdMessage: string | null;
  errorMessage: string | null;
  user: AuthenticatedUser;
  workspaceAccess: readonly WorkspaceAccessOverview[];
}>;

const actorScopedNotes = [
  "The dashboard now validates the session on the server before rendering any admin content.",
  "Workspace context is loaded from the database using the current authenticated user id.",
  "Users without memberships are redirected into a first-workspace bootstrap flow instead of seeing a fake dashboard.",
];

export function DashboardShell({
  createdMessage,
  errorMessage,
  user,
  workspaceAccess,
}: DashboardShellProps) {
  return (
    <PageShell
      eyebrow="Protected admin shell"
      title="Authenticated workspace context is now flowing into the dashboard."
      description="This page is no longer a static placeholder. It proves a real actor-scoped read path from Supabase Auth into workspace membership context."
      actions={<SignOutForm />}
    >
      {createdMessage ? <div className="status-banner success">{createdMessage}</div> : null}
      {errorMessage ? <div className="status-banner error">{errorMessage}</div> : null}
      <PlaceholderPanel
        title="Current authenticated actor"
        description={`Signed in as ${user.email ?? user.id}. The admin shell now has a validated server-side user before it reads workspace context.`}
        items={actorScopedNotes}
      />
      <section className="placeholder-panel">
        <h2 className="placeholder-panel-title">Workspace access overview</h2>
        <p className="placeholder-panel-description">
          The list below is loaded through the current authenticated user id and will become the
          basis for later project-scoped admin modules.
        </p>
        <ul className="dashboard-list">
          {workspaceAccess.map((record) => (
            <li className="dashboard-list-item" key={`${record.workspace.id}:${record.role}`}>
              <h3 className="dashboard-list-title">{record.workspace.name}</h3>
              <p className="dashboard-list-meta">Slug: {record.workspace.slug}</p>
              <p className="dashboard-list-meta">Role: {record.role}</p>
            </li>
          ))}
        </ul>
      </section>
    </PageShell>
  );
}
