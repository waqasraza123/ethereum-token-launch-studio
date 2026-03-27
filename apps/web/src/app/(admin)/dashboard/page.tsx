import Link from "next/link";
import { PageShell } from "@/components/foundation/page-shell";
import { PlaceholderPanel } from "@/components/foundation/placeholder-panel";
import { routePaths } from "@/lib/routing/route-paths";

const dashboardNotes = [
  "The admin route exists and renders through the shared application shell.",
  "Route protection is intentionally deferred until the auth and role model exists.",
  "No project, token, contract, or analytics data is wired in this commit.",
];

export default function DashboardPage() {
  return (
    <PageShell
      eyebrow="Admin placeholder"
      title="Dashboard route shell"
      description="This page gives the future admin application a stable landing point before authentication, workspace state, and product modules are added."
      actions={
        <div className="page-shell-actions">
          <Link className="button-link secondary" href={routePaths.home}>
            Back to home
          </Link>
        </div>
      }
    >
      <PlaceholderPanel
        title="Current state"
        description="The page is deliberately simple. Its purpose is to prove route structure, shared layout reuse, and future admin placement."
        items={dashboardNotes}
      />
    </PageShell>
  );
}
