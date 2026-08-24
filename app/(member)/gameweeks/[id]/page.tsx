import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GameWeekStatusBadge } from "@/components/gameweek-status-badge";
import { Countdown } from "@/components/countdown";
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

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Game Week {gameWeek.fplEventId}</h1>
        <GameWeekStatusBadge status={gameWeek.status} />
      </div>

      {gameWeek.status === "OPEN" && <Countdown label="Payment deadline" target={gameWeek.paymentDeadline} />}

      {gameWeek.announcement && (
        <Card>
          <CardContent className="py-4 text-sm">{gameWeek.announcement}</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pool &amp; prizes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Entry fee</p>
              <p className="font-medium">{formatMoney(gameWeek.entryFee)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Participants</p>
              <p className="font-medium">{participantCount}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{gameWeek.collectedAmountSnapshot ? "Collected" : "Collected so far"}</p>
              <p className="font-medium">
                {formatMoney(gameWeek.collectedAmountSnapshot ?? gameWeek.entryFee.times(participantCount))}
              </p>
            </div>
          </div>
          {gameWeek.prizePositions.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {gameWeek.prizePositions.map((p) => (
                <Badge key={p.position} variant="outline">
                  {ordinal(p.position)}: {formatMoney(p.amount)}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
                  <div className="rounded-md border bg-muted/40 p-3 text-sm">
                    <p className="font-medium">Send {formatMoney(gameWeek.entryFee)} to:</p>
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
                  <div key={r.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-8 font-medium">{medal(r.rank)}</span>
                      <span>{r.user.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground">{r.points} pts</span>
                      {r.prizeAwarded.greaterThan(0) && (
                        <span className="font-medium">{formatMoney(r.prizeAwarded)}</span>
                      )}
                      {r.prizePayment && (
                        <Badge variant={r.prizePayment.status === "PAID" ? "default" : "secondary"}>
                          {r.prizePayment.status === "PAID" ? "Paid" : "Pending"}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {gameWeek.status === "LIVE" && (
        <p className="text-center text-sm text-muted-foreground">⚡ Live — points are not final yet.</p>
      )}
    </div>
  );
}

function ordinal(n: number) {
  const suffixes = ["th", "st", "nd", "rd"];
  const mod100 = n % 100;
  return `${n}${suffixes[(mod100 - 20) % 10] ?? suffixes[mod100] ?? suffixes[0]}`;
}

function medal(rank: number) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
}

function PaymentStatus({ status, reason }: { status: string; reason: string | null }) {
  if (status === "VERIFIED") return <Badge>Verified ✅</Badge>;
  if (status === "REJECTED")
    return (
      <div className="space-y-1">
        <Badge variant="destructive">Rejected</Badge>
        {reason && <p className="text-sm text-muted-foreground">{reason}</p>}
      </div>
    );
  return <Badge variant="secondary">Under review</Badge>;
}
