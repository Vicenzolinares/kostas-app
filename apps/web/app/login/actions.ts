"use server";

import { redirect } from "next/navigation";
import { signInSchema } from "@kostas/shared/schemas";
import { AuthError } from "@kostas/auth";
import { authProvider } from "@/lib/auth";

export interface SignInFormState {
  error?: string;
}

export async function signInAction(
  _prevState: SignInFormState,
  formData: FormData,
): Promise<SignInFormState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Enter a valid email and password." };
  }

  let destination = "/dashboard";

  try {
    const session = await authProvider.signIn(parsed.data);
    // External design firms have no office access at all (see proxy.ts), so
    // send them straight to their portal rather than bouncing them off
    // /dashboard through a redirect they'd briefly see.
    if (session.user.role === "designer") {
      destination = "/portal";
    }
  } catch (err) {
    // AuthError is the expected, user-facing case (bad credentials): its
    // message is written for the person signing in, so show it as-is.
    if (err instanceof AuthError) {
      return { error: err.message };
    }
    // Anything else is a real fault — a misconfigured AUTH_SECRET, the
    // database being unreachable, etc. Never show that to the user, but do
    // not discard it either: without this log the only trace of a broken
    // deployment was a generic "try again" that looks like a wrong password.
    console.error("[signInAction] sign-in failed unexpectedly:", err);
    return {
      error:
        process.env.NODE_ENV === "production"
          ? "Something went wrong. Please try again."
          : `Sign-in failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  redirect(destination);
}
