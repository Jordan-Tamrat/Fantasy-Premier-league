"use client";

import { useActionState, useState, useTransition } from "react";
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
  const anyMissing = participants.some((p) => p.points == null);
  return (
    <div className="space-y-2">
      {anyMissing && (
        <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
          FPL scores only exist once the Game Week&apos;s matches have finished and FPL marks it complete.
          &ldquo;Missing FPL data&rdquo; usually means the Game Week hasn&apos;t been played yet — you can&apos;t
          finalize until every score is in, but you can enter a score manually if FPL is delayed.
        </p>
      )}
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
  const [syncResult, setSyncResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [error, formAction, formPending] = useActionState(
    submitManualScoreAction.bind(null, gameWeekId, participant.userId),
    undefined,
  );

  const handleRetry = () => {
    setSyncResult(null);
    startTransition(async () => {
      const result = await retrySyncOneAction(gameWeekId, participant.userId);
      setSyncResult(result);
    });
  };

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
        <Button size="sm" variant="outline" disabled={isPending} onClick={handleRetry}>
          {isPending ? "Syncing…" : "Retry sync"}
        </Button>
        <form action={formAction} className="flex items-center gap-2">
          <Input name="points" type="number" placeholder="Points" className="w-20" required />
          <Input name="reason" placeholder="Reason" className="w-40" required />
          <Button size="sm" variant="outline" type="submit" disabled={formPending}>
            Set manually
          </Button>
        </form>
      </div>
      {syncResult && (
        <p className={syncResult.ok ? "mt-1 text-[var(--fpl-green)]" : "mt-1 text-destructive"}>{syncResult.message}</p>
      )}
      {error && <p className="mt-1 text-destructive">{error}</p>}
    </div>
  );
}

export interface FinalResultRow {
  id: string;
  userName: string;
  avatarUrl: string | null;
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
            <Avatar name={r.userName} imageUrl={r.avatarUrl} />
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
