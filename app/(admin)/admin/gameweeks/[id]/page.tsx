import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { decimal, formatMoney } from "@/lib/money";
import { getSignedProofUrl, STORAGE_BUCKETS } from "@/lib/storage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GameWeekHero } from "@/components/gw-hero";
import { StatChip } from "@/components/stat-chip";
import { Users, Coins, CalendarClock, Hash } from "lucide-react";
import { LifecycleActions } from "./lifecycle-actions";
import { PrizePositionsForm } from "./prize-positions-form";
import { PaymentsSection, type PaymentRow } from "./payments-section";
import { PendingResultsSection, FinalResultsSection, type ParticipantScoreRow, type FinalResultRow } from "./results-section";

export default async function AdminGameWeekDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const gameWeek = await prisma.gameWeek.findUnique({
    where: { id },
    include: { prizePositions: { orderBy: { position: "asc" } } },
  });
  if (!gameWeek) notFound();

  const [payments, verifiedCount, participants, snapshots, results] = await Promise.all([
    prisma.payment.findMany({ where: { gameWeekId: id }, include: { user: true }, orderBy: { submittedAt: "asc" } }),
    prisma.payment.count({ where: { gameWeekId: id, status: "VERIFIED" } }),
    prisma.gameWeekParticipant.findMany({ where: { gameWeekId: id }, include: { user: true } }),
    prisma.fPLGameWeekSnapshot.findMany({ where: { gameWeekId: id } }),
    prisma.gameWeekResult.findMany({
      where: { gameWeekId: id },
      include: { user: true, prizePayment: true },
      orderBy: { rank: "asc" },
    }),
  ]);

  const paymentRows: PaymentRow[] = await Promise.all(
    payments.map(async (p) => ({
      id: p.id,
      userName: p.user.name,
      amount: p.amount.toString(),
      method: p.method,
      status: p.status,
      rejectionReason: p.rejectionReason,
      screenshotUrl: await getSignedProofUrl(STORAGE_BUCKETS.paymentProofs, p.screenshotPath).catch(() => null),
    })),
  );

  const snapshotByUserId = new Map(snapshots.map((s) => [s.userId, s]));
  const participantScoreRows: ParticipantScoreRow[] = participants.map((p) => ({
    userId: p.userId,
    userName: p.user.name,
    points: snapshotByUserId.get(p.userId)?.points ?? null,
    source: snapshotByUserId.get(p.userId)?.source ?? null,
  }));

  const finalResultRows: FinalResultRow[] = results.map((r) => ({
    id: r.id,
    userName: r.user.name,
    rank: r.rank,
    points: r.points,
    prizeAwarded: r.prizeAwarded.toString(),
    prizePayment: r.prizePayment ? { id: r.prizePayment.id, status: r.prizePayment.status, method: r.prizePayment.method } : null,
  }));

  const collectedAmount = gameWeek.collectedAmountSnapshot ?? decimal(gameWeek.entryFee).times(verifiedCount);
  const showPendingResults = ["LOCKED", "LIVE", "RESULTS_PENDING"].includes(gameWeek.status);
  const showFinalResults = results.length > 0;

  return (
    <div className="mx-auto max-w-3xl">
      <GameWeekHero fplEventId={gameWeek.fplEventId} status={gameWeek.status} />

      <div className="relative z-10 -mt-6 space-y-6 px-4 pb-8 md:px-8">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatChip icon={Coins} label="Entry fee" value={formatMoney(gameWeek.entryFee)} tone="green" />
          <StatChip icon={Users} label="Participants" value={verifiedCount} tone="cyan" />
          <StatChip icon={Hash} label="Min. required" value={gameWeek.minParticipants} />
          <StatChip icon={CalendarClock} label="Collected" value={formatMoney(collectedAmount)} tone="pink" />
        </div>

        <Card>
          <CardContent className="py-4">
            <LifecycleActions gameWeekId={gameWeek.id} status={gameWeek.status} />
          </CardContent>
        </Card>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="prizes">Prizes</TabsTrigger>
            <TabsTrigger value="payments">Payments ({payments.length})</TabsTrigger>
            {(showPendingResults || showFinalResults) && <TabsTrigger value="results">Results</TabsTrigger>}
          </TabsList>

          <TabsContent value="overview">
            <Card>
              <CardContent className="grid grid-cols-2 gap-4 py-4 text-sm">
                <Info label="FPL deadline" value={gameWeek.fplDeadline.toLocaleString()} />
                <Info label="Payment deadline" value={gameWeek.paymentDeadline.toLocaleString()} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="prizes">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Prize distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <PrizePositionsForm
                  gameWeekId={gameWeek.id}
                  positions={gameWeek.prizePositions.map((p) => ({ position: p.position, amount: p.amount.toString() }))}
                  collectedAmount={collectedAmount.toString()}
                  frozen={!!gameWeek.prizeConfigFrozenAt}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card>
              <CardContent className="py-4">
                <PaymentsSection gameWeekId={gameWeek.id} payments={paymentRows} />
              </CardContent>
            </Card>
          </TabsContent>

          {(showPendingResults || showFinalResults) && (
            <TabsContent value="results">
              <Card>
                <CardContent className="py-4">
                  {showFinalResults ? (
                    <FinalResultsSection gameWeekId={gameWeek.id} results={finalResultRows} />
                  ) : (
                    <PendingResultsSection gameWeekId={gameWeek.id} participants={participantScoreRows} />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
