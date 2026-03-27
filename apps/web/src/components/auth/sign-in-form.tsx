import { signInWithPasswordAction } from "@/app/(auth)/sign-in/actions";

type SignInFormProps = Readonly<{
  errorMessage: string | null;
}>;

export function SignInForm({ errorMessage }: SignInFormProps) {
  return (
    <section className="placeholder-panel">
      <h2 className="placeholder-panel-title">Email and password sign-in</h2>
      <p className="placeholder-panel-description">
        Use an existing Supabase Auth user. On success, the dashboard will load your membership
        context and prompt for first-workspace bootstrap if nothing exists yet.
      </p>
      {errorMessage ? <div className="status-banner error">{errorMessage}</div> : null}
      <form action={signInWithPasswordAction} className="form-card">
        <div className="field-grid">
          <label className="field-label" htmlFor="email">
            <span>Email</span>
            <input className="text-input" id="email" name="email" type="email" required />
          </label>
          <label className="field-label" htmlFor="password">
            <span>Password</span>
            <input className="text-input" id="password" name="password" type="password" required />
          </label>
        </div>
        <div className="page-shell-actions">
          <button className="button-link" type="submit">
            Sign in
          </button>
        </div>
      </form>
    </section>
  );
}
