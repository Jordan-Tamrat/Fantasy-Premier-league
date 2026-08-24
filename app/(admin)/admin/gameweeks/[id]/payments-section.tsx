"use client";

import { useActionState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { formatMoney } from "@/lib/money";
import { verifyPaymentAction, rejectPaymentAction } from "./actions";

export interface PaymentRow {
  id: string;
  userName: string;
  amount: string;
  method: string;
  status: string;
  rejectionReason: string | null;
  screenshotUrl: string | null;
}

export function PaymentsSection({ gameWeekId, payments }: { gameWeekId: string; payments: PaymentRow[] }) {
  if (payments.length === 0) {
    return <p className="text-sm text-muted-foreground">No payments submitted yet.</p>;
  }

  return (
    <div className="space-y-2">
      {payments.map((payment) => (
        <PaymentRowItem key={payment.id} gameWeekId={gameWeekId} payment={payment} />
      ))}
    </div>
  );
}

function PaymentRowItem({ gameWeekId, payment }: { gameWeekId: string; payment: PaymentRow }) {
  const [isPending, startTransition] = useTransition();
  const [rejectError, rejectAction, rejectPending] = useActionState(
    rejectPaymentAction.bind(null, gameWeekId, payment.id),
    undefined,
  );

  return (
    <div className="rounded-md border p-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-medium">{payment.userName}</p>
          <p className="text-muted-foreground">
            {formatMoney(payment.amount)} via {payment.method}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {payment.screenshotUrl && (
            <a href={payment.screenshotUrl} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-4">
              View proof
            </a>
          )}
          <StatusBadge status={payment.status} />
        </div>
      </div>
      {payment.status === "PENDING" && (
        <div className="mt-2 flex flex-wrap items-start gap-2">
          <Button
            size="sm"
            disabled={isPending}
            onClick={() => startTransition(() => verifyPaymentAction(gameWeekId, payment.id))}
          >
            Verify
          </Button>
          <form action={rejectAction} className="flex items-start gap-2">
            <Textarea name="reason" placeholder="Rejection reason" rows={1} className="h-8 min-h-8 w-48" />
            <Button size="sm" variant="outline" type="submit" disabled={rejectPending}>
              Reject
            </Button>
          </form>
        </div>
      )}
      {payment.status === "REJECTED" && payment.rejectionReason && (
        <p className="mt-1 text-muted-foreground">Reason: {payment.rejectionReason}</p>
      )}
      {rejectError && <p className="mt-1 text-destructive">{rejectError}</p>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variant = status === "VERIFIED" ? "default" : status === "REJECTED" ? "destructive" : "secondary";
  return <Badge variant={variant}>{status}</Badge>;
}
