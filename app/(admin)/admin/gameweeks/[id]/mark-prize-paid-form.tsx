"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { markPrizePaymentPaidAction } from "./actions";

export function MarkPrizePaidForm({ gameWeekId, prizePaymentId }: { gameWeekId: string; prizePaymentId: string }) {
  const action = markPrizePaymentPaidAction.bind(null, gameWeekId, prizePaymentId);
  const [error, formAction, isPending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="mt-2 flex flex-wrap items-center gap-2">
      <select name="method" defaultValue="TELEBIRR" className="h-8 rounded-md border bg-background px-2 text-sm">
        <option value="TELEBIRR">Telebirr</option>
        <option value="CBE">CBE</option>
      </select>
      <Input name="referenceNumber" placeholder="Reference #" className="h-8 w-32" />
      <input name="proof" type="file" accept="image/png,image/jpeg,image/webp" className="text-xs" />
      <Button size="sm" type="submit" disabled={isPending}>
        {isPending ? "Saving…" : "Mark paid"}
      </Button>
      {error && <p className="w-full text-destructive">{error}</p>}
    </form>
  );
}
