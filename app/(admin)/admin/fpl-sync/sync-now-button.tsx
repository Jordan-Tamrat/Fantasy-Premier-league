"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { syncNowAction } from "./actions";

export function SyncNowButton({ gameWeekId }: { gameWeekId: string }) {
  const action = syncNowAction.bind(null, gameWeekId);
  const [message, formAction, isPending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-2">
      <Button type="submit" disabled={isPending}>
        {isPending ? "Syncing…" : "Sync now"}
      </Button>
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </form>
  );
}
