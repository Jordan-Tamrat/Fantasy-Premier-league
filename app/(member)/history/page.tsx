import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney, sumDecimal } from "@/lib/money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function HistoryPage() {
  const user = await requireUser();

  const completedGameWeeks = await prisma.gameWeek.findMany({
    where: { status: "COMPLETED" },
    orderBy: { fplEventId: "desc" },
    include: { results: { include: { user: true }, orderBy: { rank: "asc" }, take: 3 } },
  });

  const [participations, myResults] = await Promise.all([
    prisma.gameWeekParticipant.findMany({ where: { userId: user.id } }),
    prisma.gameWeekResult.findMany({ where: { userId: user.id } }),
  ]);

  const wins = myResults.filter((r) => r.rank === 1).length;
  const top3 = myResults.filter((r) => r.rank <= 3).length;
  const entryFeesPaid = sumDecimal(participations.map((p) => p.entryFeePaidSnapshot));
  const winnings = sumDecimal(myResults.map((r) => r.prizeAwarded));
  const net = winnings.minus(entryFeesPaid);

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-8">
      <h1 className="text-2xl font-semibold">History</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your stats</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <Stat label="Participated" value={participations.length} />
          <Stat label="Wins" value={wins} />
          <Stat label="Top 3" value={top3} />
          <Stat label="Entry fees paid" value={formatMoney(entryFeesPaid)} />
          <Stat label="Winnings" value={formatMoney(winnings)} />
          <Stat label="Net" value={`${net.greaterThanOrEqualTo(0) ? "+" : ""}${formatMoney(net)}`} />
        </CardContent>
      </Card>

      <div className="space-y-2">
        {completedGameWeeks.length === 0 ? (
          <p className="text-muted-foreground">No completed Game Weeks yet.</p>
        ) : (
          completedGameWeeks.map((gw) => (
            <Link key={gw.id} href={`/gameweeks/${gw.id}`}>
              <Card className="transition-colors hover:bg-muted/50">
                <CardContent className="py-4">
                  <p className="mb-2 font-medium">Game Week {gw.fplEventId}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    {gw.results.map((r) => (
                      <span key={r.id}>
                        {medal(r.rank)} {r.user.name}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

function medal(rank: number) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
