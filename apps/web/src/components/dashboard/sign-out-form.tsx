import { signOutAction } from "@/app/(admin)/dashboard/actions";

export function SignOutForm() {
  return (
    <form action={signOutAction} className="inline-form">
      <button className="button-link secondary" type="submit">
        Sign out
      </button>
    </form>
  );
}
