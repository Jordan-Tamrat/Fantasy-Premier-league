"use client";

import { useActionState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/money";
import { RankBadge, Avatar } from "@/components/rank-badge";
import { retrySyncOneAction, submitManualScoreAction } from "./actions";
import { MarkPrizePaidForm } from "./mark-prize-paid-form";

export interface ParticipantScoreRow {
  userId: string;
  userName: string;
  points: number | null;
  source: "API" | "MANUAL" | null;
}

export function PendingResultsSection({
  gameWeekId,
  participants,
}: {
  gameWeekId: string;
  participants: ParticipantScoreRow[];
}) {
  return (
    <div className="space-y-2">
      {participants.map((p) => (
        <ParticipantScoreRowItem key={p.userId} gameWeekId={gameWeekId} participant={p} />
      ))}
    </div>
  );
}

function ParticipantScoreRowItem({
  gameWeekId,
  participant,
}: {
  gameWeekId: string;
  participant: ParticipantScoreRow;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, formAction, formPending] = useActionState(
    submitManualScoreAction.bind(null, gameWeekId, participant.userId),
    undefined,
  );

  return (
    <div className="rounded-xl border p-3 text-sm">
      <div className="flex items-center justify-between">
        <span className="font-medium">{participant.userName}</span>
        {participant.points == null ? (
          <Badge variant="destructive">⚠ Missing FPL data</Badge>
        ) : (
          <span>
            {participant.points} pts {participant.source === "MANUAL" && <Badge variant="outline">Manual</Badge>}
          </span>
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => startTransition(() => retrySyncOneAction(gameWeekId, participant.userId))}
        >
          Retry sync
        </Button>
        <form action={formAction} className="flex items-center gap-2">
          <Input name="points" type="number" placeholder="Points" className="w-20" required />
          <Input name="reason" placeholder="Reason" className="w-40" required />
          <Button size="sm" variant="outline" type="submit" disabled={formPending}>
            Set manually
          </Button>
        </form>
      </div>
      {error && <p className="mt-1 text-destructive">{error}</p>}
    </div>
  );
}

export interface FinalResultRow {
  id: string;
  userName: string;
  rank: number;
  points: number;
  prizeAwarded: string;
  prizePayment: { id: string; status: string; method: string | null } | null;
}

export function FinalResultsSection({ gameWeekId, results }: { gameWeekId: string; results: FinalResultRow[] }) {
  return (
    <div className="space-y-2">
      {results.map((r) => (
        <div key={r.id} className="rounded-xl border p-3 text-sm">
          <div className="flex items-center gap-3">
            <RankBadge rank={r.rank} />
            <Avatar name={r.userName} />
            <span className="flex-1 truncate font-semibold">{r.userName}</span>
            <span className="text-muted-foreground">{r.points} pts</span>
            {r.prizeAwarded !== "0" && (
              <span className="font-bold text-[var(--fpl-green)]">{formatMoney(r.prizeAwarded)}</span>
            )}
          </div>
          {r.prizePayment && r.prizePayment.status === "PENDING" && (
            <MarkPrizePaidForm gameWeekId={gameWeekId} prizePaymentId={r.prizePayment.id} />
          )}
          {r.prizePayment && r.prizePayment.status === "PAID" && (
            <Badge className="mt-2">Paid via {r.prizePayment.method}</Badge>
          )}
        </div>
      ))}
    </div>
  );
}
