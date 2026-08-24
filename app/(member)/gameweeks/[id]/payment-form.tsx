"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { submitPaymentAction } from "./actions";

export function PaymentForm({ gameWeekId }: { gameWeekId: string }) {
  const action = submitPaymentAction.bind(null, gameWeekId);
  const [error, formAction, isPending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label>Payment method</Label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="method" value="TELEBIRR" defaultChecked required />
            Telebirr
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="method" value="CBE" required />
            CBE
          </label>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="screenshot">Payment screenshot</Label>
        <input
          id="screenshot"
          name="screenshot"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          required
          className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium"
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Submitting…" : "Submit payment"}
      </Button>
    </form>
  );
}
