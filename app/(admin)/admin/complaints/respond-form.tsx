"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { respondToDisputeAction } from "./actions";

export function RespondForm({ disputeId, currentStatus }: { disputeId: string; currentStatus: string }) {
  const action = respondToDisputeAction.bind(null, disputeId);
  const [error, formAction, isPending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-2 pt-1">
      <Textarea name="adminResponse" rows={2} required placeholder="Your response to the member…" />
      <div className="flex flex-wrap items-center gap-2">
        <select
          name="status"
          defaultValue={currentStatus}
          className="h-8 rounded-md border bg-background px-2 text-sm"
        >
          <option value="OPEN">Open</option>
          <option value="UNDER_REVIEW">Under review</option>
          <option value="RESOLVED">Resolved</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Saving…" : "Respond"}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
}
