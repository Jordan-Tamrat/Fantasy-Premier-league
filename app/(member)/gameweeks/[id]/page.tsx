import { notFound } from "next/navigation";
import { CheckCircle2, Clock, XCircle, Megaphone } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GameWeekHero } from "@/components/gw-hero";
import { Countdown } from "@/components/countdown";
import { PrizePills } from "@/components/prize-pills";
import { RankBadge, Avatar } from "@/components/rank-badge";
import { PaymentForm } from "./payment-form";

export default async function GameWeekDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();

  const gameWeek = await prisma.gameWeek.findUnique({
    where: { id },
    include: { prizePositions: { orderBy: { position: "asc" } } },
  });
  if (!gameWeek || gameWeek.status === "DRAFT") notFound();

  const [myPayment, leagueSettings, participantCount, results] = await Promise.all([
    prisma.payment.findUnique({ where: { gameWeekId_userId: { gameWeekId: id, userId: user.id } } }),
    prisma.leagueSettings.findUnique({ where: { id: "default" } }),
    prisma.payment.count({ where: { gameWeekId: id, status: "VERIFIED" } }),
    prisma.gameWeekResult.findMany({
      where: { gameWeekId: id },
      include: { user: true, prizePayment: true },
      orderBy: { rank: "asc" },
    }),
  ]);

  const isFinalized = results.length > 0;
  const collected = gameWeek.collectedAmountSnapshot ?? gameWeek.entryFee.times(participantCount);

  return (
    <div className="mx-auto max-w-2xl">
      <GameWeekHero fplEventId={gameWeek.fplEventId} status={gameWeek.status}>
        {gameWeek.status === "OPEN" && <Countdown variant="hero" label="Payment deadline" target={gameWeek.paymentDeadline} />}
        <div className="mt-4 flex items-center gap-5 text-sm">
          <div>
            <p className="text-white/50">Pool</p>
            <p className="text-lg font-bold text-[var(--fpl-green)]">{formatMoney(collected)}</p>
          </div>
          <div>
            <p className="text-white/50">Entry fee</p>
            <p className="font-semibold">{formatMoney(gameWeek.entryFee)}</p>
          </div>
          <div>
            <p className="text-white/50">Players</p>
            <p className="font-semibold">{participantCount}</p>
          </div>
        </div>
      </GameWeekHero>

      <div className="relative z-10 -mt-6 space-y-4 px-4 pb-8 md:px-8">
        {gameWeek.prizePositions.length > 0 && (
          <Card>
            <CardContent className="py-4">
              <PrizePills positions={gameWeek.prizePositions} />
            </CardContent>
          </Card>
        )}

        {gameWeek.announcement && (
          <Card className="border-[var(--fpl-cyan)]/30 bg-[var(--fpl-cyan)]/5">
            <CardContent className="flex gap-2.5 py-4 text-sm">
              <Megaphone className="mt-0.5 size-4 shrink-0 text-[color-mix(in_oklab,var(--fpl-cyan)_70%,black)]" />
              <span>{gameWeek.announcement}</span>
            </CardContent>
          </Card>
        )}

        {gameWeek.status === "OPEN" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {myPayment && myPayment.status !== "REJECTED" ? (
                <PaymentStatus status={myPayment.status} reason={myPayment.rejectionReason} />
              ) : (
                <>
                  {myPayment?.status === "REJECTED" && (
                    <PaymentStatus status={myPayment.status} reason={myPayment.rejectionReason} />
                  )}
                  {(leagueSettings?.leagueTelebirrNumber || leagueSettings?.leagueCbeAccountNumber) && (
                    <div className="rounded-xl border bg-muted/50 p-3.5 text-sm">
                      <p className="font-semibold">Send {formatMoney(gameWeek.entryFee)} to:</p>
                      {leagueSettings?.leagueTelebirrNumber && <p>Telebirr: {leagueSettings.leagueTelebirrNumber}</p>}
                      {leagueSettings?.leagueCbeAccountNumber && <p>CBE: {leagueSettings.leagueCbeAccountNumber}</p>}
                      {leagueSettings?.leagueAccountName && (
                        <p className="text-muted-foreground">Account name: {leagueSettings.leagueAccountName}</p>
                      )}
                    </div>
                  )}
                  <PaymentForm gameWeekId={gameWeek.id} />
                </>
              )}
            </CardContent>
          </Card>
        )}

        {(isFinalized || gameWeek.status === "PRIZES_PENDING" || gameWeek.status === "COMPLETED") && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Results</CardTitle>
            </CardHeader>
            <CardContent>
              {results.length === 0 ? (
                <p className="text-sm text-muted-foreground">No results yet.</p>
              ) : (
                <div className="space-y-2">
                  {results.map((r) => (
                    <div key={r.id} className="flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm">
                      <RankBadge rank={r.rank} />
                      <Avatar name={r.user.name} />
                      <span className="flex-1 truncate font-semibold">{r.user.name}</span>
                      <span className="text-muted-foreground">{r.points} pts</span>
                      {r.prizeAwarded.greaterThan(0) && (
                        <span className="font-bold text-[var(--fpl-green)]">{formatMoney(r.prizeAwarded)}</span>
                      )}
                      {r.prizePayment && (
                        <Badge variant={r.prizePayment.status === "PAID" ? "default" : "secondary"}>
                          {r.prizePayment.status === "PAID" ? "Paid" : "Pending"}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {gameWeek.status === "LIVE" && (
          <p className="text-center text-sm font-medium text-[var(--fpl-pink)]">⚡ Live — points are not final yet.</p>
        )}
      </div>
    </div>
  );
}

function PaymentStatus({ status, reason }: { status: string; reason: string | null }) {
  if (status === "VERIFIED")
    return (
      <div className="flex items-center gap-2 text-sm font-semibold text-[var(--fpl-green)]">
        <CheckCircle2 className="size-4" /> Verified
      </div>
    );
  if (status === "REJECTED")
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
          <XCircle className="size-4" /> Rejected
        </div>
        {reason && <p className="text-sm text-muted-foreground">{reason}</p>}
      </div>
    );
  return (
    <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
      <Clock className="size-4" /> Under review
    </div>
  );
}
