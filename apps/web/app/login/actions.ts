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

  try {
    await authProvider.signIn(parsed.data);
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: err.message };
    }
    return { error: "Something went wrong. Please try again." };
  }

  redirect("/dashboard");
}
