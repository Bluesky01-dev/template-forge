"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@tf/ui";
import { analyzeAction, type FormState } from "@/app/actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending} className="shrink-0">
      {pending ? "Analyzing…" : "Analyze site"}
    </Button>
  );
}

export function NewPitchForm() {
  const [state, action] = useActionState<FormState, FormData>(analyzeAction, {});
  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="sr-only" htmlFor="url">Client website</label>
        <input
          id="url"
          name="url"
          required
          inputMode="url"
          placeholder="clientwebsite.com"
          className="h-12 flex-1 rounded-tf border border-border bg-background px-4 text-base outline-none focus:ring-2 focus:ring-ring"
        />
        <Submit />
      </div>
      <label className="sr-only" htmlFor="notes">Notes</label>
      <textarea
        id="notes"
        name="notes"
        rows={2}
        placeholder="Optional notes for the AI: what they sell, who they serve, what you want to pitch…"
        className="rounded-tf border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
      {state.error && <p role="alert" className="text-sm text-[oklch(0.55_0.2_25)]">{state.error}</p>}
    </form>
  );
}
