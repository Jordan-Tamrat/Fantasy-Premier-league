"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatMoney } from "@/lib/money";
import { setPrizePositionsAction } from "./actions";

interface Position {
  position: number;
  amount: string;
}

export function PrizePositionsForm({
  gameWeekId,
  positions,
  collectedAmount,
  frozen,
}: {
  gameWeekId: string;
  positions: Position[];
  collectedAmount: string;
  frozen: boolean;
}) {
  const action = setPrizePositionsAction.bind(null, gameWeekId);
  const [message, formAction, isPending] = useActionState(action, undefined);

  const byPosition = new Map(positions.map((p) => [p.position, p.amount]));

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Collected so far: {formatMoney(collectedAmount)}</p>
      <form action={formAction} className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((position) => (
            <div key={position} className="space-y-2">
              <Label htmlFor={`amount_${position}`}>{ordinal(position)}</Label>
              <Input
                id={`amount_${position}`}
                name={`amount_${position}`}
                type="number"
                step="0.01"
                min="0"
                disabled={frozen}
                defaultValue={byPosition.get(position) ?? ""}
              />
            </div>
          ))}
        </div>
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
        {!frozen && (
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving…" : "Save prizes"}
          </Button>
        )}
        {frozen && <p className="text-sm text-muted-foreground">Prize configuration is frozen (Game Week is locked).</p>}
      </form>
    </div>
  );
}

function ordinal(n: number) {
  const suffixes = ["th", "st", "nd", "rd"];
  return `${n}${suffixes[n] ?? suffixes[0]}`;
}
