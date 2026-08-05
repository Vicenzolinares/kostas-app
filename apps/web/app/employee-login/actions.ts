"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { AuthError } from "@kostas/auth";
import { authProvider } from "@/lib/auth";

const pinSignInSchema = z.object({
  userId: z.string().uuid(),
  pin: z.string().regex(/^\d{4}$/),
});

export interface PinSignInResult {
  error?: string;
}

/**
 * Kiosk sign-in. Validates shape here and lets the provider decide whether
 * the PIN is right — the generic "Incorrect PIN." it throws is deliberate
 * (see LocalAuthProvider.signInWithPin), so this passes the message through
 * rather than adding detail of its own.
 */
export async function signInWithPinAction(
  input: unknown,
): Promise<PinSignInResult> {
  const parsed = pinSignInSchema.safeParse(input);
  if (!parsed.success) return { error: "Incorrect PIN." };

  try {
    await authProvider.signInWithPin(parsed.data);
  } catch (err) {
    if (err instanceof AuthError) return { error: err.message };
    return { error: "Something went wrong." };
  }

  redirect("/employee-portal");
}
