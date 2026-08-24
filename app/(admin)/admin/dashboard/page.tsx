import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GameWeekStatusBadge } from "@/components/gameweek-status-badge";

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
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-8">
      <h1 className="text-2xl font-semibold">Admin Overview</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Active members" value={memberCount} />
        <StatCard label="Pending payments" value={pendingPayments} href="/admin/gameweeks" />
        <StatCard label="Pending prize payouts" value={pendingPrizePayments} href="/admin/gameweeks" />
        <StatCard
          label="Current Game Week"
          value={currentGameWeek ? `GW${currentGameWeek.fplEventId}` : "—"}
          href={currentGameWeek ? `/admin/gameweeks/${currentGameWeek.id}` : undefined}
        />
      </div>

      {currentGameWeek && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Game Week {currentGameWeek.fplEventId}</CardTitle>
            <GameWeekStatusBadge status={currentGameWeek.status} />
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>Participants: {verifiedCount}</p>
            <p>
              Collected: {formatMoney(currentGameWeek.collectedAmountSnapshot ?? currentGameWeek.entryFee.times(verifiedCount))}
            </p>
            <Link href={`/admin/gameweeks/${currentGameWeek.id}`} className="text-primary underline underline-offset-4">
              Manage this Game Week →
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({ label, value, href }: { label: string; value: string | number; href?: string }) {
  const content = (
    <Card>
      <CardContent className="py-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}
