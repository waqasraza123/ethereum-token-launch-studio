import Link from "next/link";
import { PageShell } from "@/components/foundation/page-shell";
import { PlaceholderPanel } from "@/components/foundation/placeholder-panel";
import { routePaths } from "@/lib/routing/route-paths";

const signInNotes = [
  "This route exists now so the authentication surface can be integrated without changing URLs later.",
  "Protected admin behavior is not implemented in this commit.",
  "Supabase auth, session management, and role checks start in Phase 2.",
];

export default function SignInPage() {
  return (
    <PageShell
      eyebrow="Auth placeholder"
      title="Sign in route shell"
      description="The route is live and ready for authentication wiring. This commit stops at structure on purpose."
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
        description="Nothing here attempts fake authentication. The route exists so later auth integration can be layered onto a stable page boundary."
        items={signInNotes}
      />
    </PageShell>
  );
}
