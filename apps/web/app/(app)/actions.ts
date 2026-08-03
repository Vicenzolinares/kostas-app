"use server";

import { redirect } from "next/navigation";
import { authProvider } from "@/lib/auth";

export async function signOutAction() {
  await authProvider.signOut();
  redirect("/login");
}
