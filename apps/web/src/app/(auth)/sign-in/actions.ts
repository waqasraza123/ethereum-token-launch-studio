"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { routePaths } from "@/lib/routing/route-paths";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const SignInInputSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(72),
});

const buildSignInErrorRedirect = (message: string) =>
  `${routePaths.signIn}?error=${encodeURIComponent(message)}`;

export const signInWithPasswordAction = async (formData: FormData): Promise<void> => {
  const parsedInput = SignInInputSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsedInput.success) {
    redirect(buildSignInErrorRedirect("Enter a valid email address and password."));
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword(parsedInput.data);

  if (error) {
    redirect(buildSignInErrorRedirect("Email or password is not valid."));
  }

  redirect(routePaths.dashboard);
};
