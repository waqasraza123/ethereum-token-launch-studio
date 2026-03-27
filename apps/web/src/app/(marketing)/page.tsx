import Link from "next/link";
import { PageShell } from "@/components/foundation/page-shell";
import { PlaceholderPanel } from "@/components/foundation/placeholder-panel";
import { routePaths } from "@/lib/routing/route-paths";

const foundationHighlights = [
  "The public route structure now exists and is bootable with the App Router.",
  "The sign in and dashboard paths are intentionally placeholders so later auth and admin logic can land without route churn.",
  "Styling is minimal but production shaped, with shared shell components instead of page local markup duplication.",
];

const deferredHighlights = [
  "Supabase auth and protected route enforcement remain deferred to Phase 2.",
  "Wallet connection, sale flows, contract reads, and project state remain deferred to later phases.",
  "Contracts and DB infrastructure are still not part of this commit.",
];

export default function MarketingPage() {
  return (
    <PageShell
      eyebrow="Phase 1 runtime shells"
      title="Bootable public and admin route shells are now in place."
      description="This commit locks the App Router surface before product behavior lands. The routes are real, the layout is reusable, and the next phase can add auth and data without restructuring the app."
      actions={
        <div className="page-shell-actions">
          <Link className="button-link" href={routePaths.signIn}>
            Open sign in shell
          </Link>
          <Link className="button-link secondary" href={routePaths.dashboard}>
            Open dashboard shell
          </Link>
        </div>
      }
    >
      <PlaceholderPanel
        title="What this shell proves"
        description="The web workspace is now a real Next.js application instead of a planned folder. Shared components, metadata, route constants, and App Router route groups are all wired and ready for future phases."
        items={foundationHighlights}
      />
      <PlaceholderPanel
        title="What is still intentionally missing"
        description="This page is not pretending to be a finished product surface yet. It exists to stabilize structure before business logic, auth, and blockchain integration arrive."
        items={deferredHighlights}
      />
    </PageShell>
  );
}
