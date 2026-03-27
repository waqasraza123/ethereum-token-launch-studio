import { redirect } from "next/navigation";
import { SignInForm } from "@/components/auth/sign-in-form";
import { PageShell } from "@/components/foundation/page-shell";
import { PlaceholderPanel } from "@/components/foundation/placeholder-panel";
import { getCurrentUser } from "@/lib/auth/session";
import { routePaths } from "@/lib/routing/route-paths";

export const dynamic = "force-dynamic";

type SignInPageProps = Readonly<{
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

const signInNotes = [
  "This route now creates a real server-side Supabase auth session instead of being a placeholder only.",
  "The admin dashboard now validates the current session on the server before rendering protected content.",
  "If the user has no workspace yet, the dashboard immediately switches into first-workspace bootstrap mode.",
];

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const currentUser = await getCurrentUser();

  if (currentUser) {
    redirect(routePaths.dashboard);
  }

  const resolvedSearchParams = await searchParams;
  const errorMessage = readSingleSearchParam(resolvedSearchParams, "error");

  return (
    <PageShell
      eyebrow="Auth spine"
      title="Sign in to start the first protected admin flow."
      description="This page now posts to a real server action that creates a Supabase auth session and redirects into the authenticated dashboard boundary."
    >
      <SignInForm errorMessage={errorMessage} />
      <PlaceholderPanel
        title="What this step proves"
        description="The route now participates in a real auth-aware server flow instead of only rendering static placeholder copy."
        items={signInNotes}
      />
    </PageShell>
  );
}
