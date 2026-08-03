"use client";

import { useActionState } from "react";
import { Button, Input, Label, Card, CardHeader, CardTitle, CardDescription, CardContent } from "@kostas/ui";
import { signInAction, type SignInFormState } from "./actions";

const initialState: SignInFormState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signInAction, initialState);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign in to Kostas</CardTitle>
          <CardDescription>Upholstery &amp; furniture manufacturing ERP</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" autoComplete="email" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" autoComplete="current-password" required />
            </div>
            {state.error ? (
              <p role="alert" className="text-sm text-destructive">
                {state.error}
              </p>
            ) : null}
            <Button type="submit" disabled={pending} className="mt-2">
              {pending ? "Signing in…" : "Sign in"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Local dev seed: admin@kostas.local / password123
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
