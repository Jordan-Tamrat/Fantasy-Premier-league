import Link from "next/link";
import { Users, Clock, Coins, Trophy } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";
import { Card, CardContent } from "@/components/ui/card";
import { StatChip } from "@/components/stat-chip";

export default async function AdminDashboardPage() {
  const [currentGameWeek, memberCount, pendingPayments, pendingPrizePayments] = await Promise.all([
    prisma.gameWeek.findFirst({
      where: { status: { notIn: ["DRAFT", "CANCELLED", "COMPLETED"] } },
      orderBy: { fplEventId: "desc" },
      include: { prizePositions: true },
    }),
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.payment.count({ where: { status: "PENDING" } }),
    prisma.prizePayment.count({ where: { status: "PENDING" } }),
  ]);

  const verifiedCount = currentGameWeek
    ? await prisma.payment.count({ where: { gameWeekId: currentGameWeek.id, status: "VERIFIED" } })
    : 0;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="bg-fpl-hero relative z-0 px-4 pt-6 pb-10 text-white md:rounded-b-3xl md:px-8">
        <h1 className="text-2xl font-bold tracking-tight">Admin Overview</h1>
      </div>

      <div className="relative z-10 -mt-6 space-y-6 px-4 pb-8 md:px-8">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatChip icon={Users} label="Active members" value={memberCount} tone="cyan" />
          <StatChip icon={Clock} label="Pending payments" value={pendingPayments} tone={pendingPayments > 0 ? "pink" : "default"} />
          <StatChip icon={Coins} label="Pending payouts" value={pendingPrizePayments} tone={pendingPrizePayments > 0 ? "pink" : "default"} />
          <StatChip icon={Trophy} label="Current GW" value={currentGameWeek ? currentGameWeek.fplEventId : "—"} tone="green" />
        </div>

        {currentGameWeek && (
          <Link href={`/admin/gameweeks/${currentGameWeek.id}`}>
            <Card className="transition-all hover:border-primary/40 hover:shadow-md">
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="font-bold">Game Week {currentGameWeek.fplEventId}</p>
                  <p className="text-sm text-muted-foreground">
                    {verifiedCount} participants ·{" "}
                    {formatMoney(currentGameWeek.collectedAmountSnapshot ?? currentGameWeek.entryFee.times(verifiedCount))} collected
                  </p>
                </div>
                <span className="text-sm font-semibold text-primary">Manage →</span>
              </CardContent>
            </Card>
          </Link>
        )}
      </div>
    </div>
  );
}
