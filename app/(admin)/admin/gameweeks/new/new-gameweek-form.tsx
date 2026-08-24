"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createGameWeekAction } from "./actions";

export function NewGameWeekForm({
  suggestedFplEventId,
  defaultEntryFee,
  defaultMinParticipants,
  defaultOffsetHours,
}: {
  suggestedFplEventId: number | null;
  defaultEntryFee: number;
  defaultMinParticipants: number;
  defaultOffsetHours: number;
}) {
  const [error, formAction, isPending] = useActionState(createGameWeekAction, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fplEventId">FPL Game Week number</Label>
        <Input
          id="fplEventId"
          name="fplEventId"
          type="number"
          required
          defaultValue={suggestedFplEventId ?? undefined}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="entryFee">Entry fee</Label>
          <Input id="entryFee" name="entryFee" type="number" step="0.01" required defaultValue={defaultEntryFee} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="minParticipants">Minimum participants</Label>
          <Input
            id="minParticipants"
            name="minParticipants"
            type="number"
            required
            defaultValue={defaultMinParticipants}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="paymentDeadlineOffsetHours">Payment deadline offset (hours before FPL deadline)</Label>
        <Input
          id="paymentDeadlineOffsetHours"
          name="paymentDeadlineOffsetHours"
          type="number"
          required
          defaultValue={defaultOffsetHours}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="announcement">Announcement (optional)</Label>
        <Textarea id="announcement" name="announcement" rows={3} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Creating…" : "Create Game Week"}
      </Button>
    </form>
  );
}
