"use client";

import { useActionState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  openGameWeekAction,
  closePaymentsAction,
  lockGameWeekAction,
  finalizeResultsAction,
  cancelGameWeekAction,
} from "./actions";

export function LifecycleActions({ gameWeekId, status }: { gameWeekId: string; status: string }) {
  const [isPending, startTransition] = useTransition();
  const [lockError, lockAction, lockPending] = useActionState(lockGameWeekAction.bind(null, gameWeekId), undefined);
  const [finalizeError, finalizeAction, finalizePending] = useActionState(
    finalizeResultsAction.bind(null, gameWeekId),
    undefined,
  );
  const [cancelError, cancelAction, cancelPending] = useActionState(
    cancelGameWeekAction.bind(null, gameWeekId),
    undefined,
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {status === "DRAFT" && (
          <Button disabled={isPending} onClick={() => startTransition(() => openGameWeekAction(gameWeekId))}>
            Open for payment
          </Button>
        )}
        {status === "OPEN" && (
          <Button disabled={isPending} onClick={() => startTransition(() => closePaymentsAction(gameWeekId))}>
            Close payments
          </Button>
        )}
        {status === "PAYMENT_CLOSED" && (
          <form action={lockAction}>
            <Button type="submit" disabled={lockPending}>
              {lockPending ? "Locking…" : "Lock Game Week"}
            </Button>
          </form>
        )}
        {(status === "LOCKED" || status === "LIVE" || status === "RESULTS_PENDING") && (
          <form action={finalizeAction}>
            <Button type="submit" disabled={finalizePending}>
              {finalizePending ? "Finalizing…" : "Finalize results"}
            </Button>
          </form>
        )}
      </div>
      {lockError && <p className="text-sm text-destructive">{lockError}</p>}
      {finalizeError && <p className="text-sm text-destructive">{finalizeError}</p>}

      {status !== "COMPLETED" && status !== "CANCELLED" && (
        <form action={cancelAction} className="flex items-end gap-2 pt-2">
          <Textarea name="reason" placeholder="Reason for cancelling" rows={1} className="max-w-xs" />
          <Button type="submit" variant="destructive" disabled={cancelPending}>
            Cancel Game Week
          </Button>
        </form>
      )}
      {cancelError && <p className="text-sm text-destructive">{cancelError}</p>}
    </div>
  );
}
