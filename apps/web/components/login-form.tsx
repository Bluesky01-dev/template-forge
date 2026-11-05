"use client";

import { useActionState } from "react";
import { Button } from "@tf/ui";
import { loginAction, type FormState } from "@/app/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(loginAction, {});
  return (
    <form action={action} className="flex flex-col gap-3">
      <label htmlFor="password" className="text-sm font-medium">Password</label>
      <input
        id="password"
        name="password"
        type="password"
        required
        autoFocus
        className="h-11 rounded-tf border border-border bg-background px-3 outline-none focus:ring-2 focus:ring-ring"
      />
      {state.error && <p role="alert" className="text-sm text-[oklch(0.55_0.2_25)]">{state.error}</p>}
      <Button type="submit" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</Button>
    </form>
  );
}
