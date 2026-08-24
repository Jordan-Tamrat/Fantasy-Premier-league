import Link from "next/link";
import { Trophy, Medal, Target, Coins } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney, sumDecimal } from "@/lib/money";
import { Card, CardContent } from "@/components/ui/card";
import { StatChip } from "@/components/stat-chip";

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
  const isPositive = net.greaterThanOrEqualTo(0);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="bg-fpl-hero relative z-0 px-4 pt-6 pb-10 text-center text-white md:rounded-b-3xl md:px-8">
        <p className="text-xs font-semibold tracking-widest text-white/60 uppercase">Net winnings</p>
        <p className={`text-4xl font-black tracking-tight ${isPositive ? "text-[var(--fpl-green)]" : "text-[var(--fpl-pink)]"}`}>
          {isPositive ? "+" : ""}
          {formatMoney(net)}
        </p>
      </div>

      <div className="relative z-10 -mt-6 space-y-4 px-4 pb-8 md:px-8">
        <div className="grid grid-cols-2 gap-3">
          <StatChip icon={Target} label="Participated" value={participations.length} />
          <StatChip icon={Trophy} label="Wins" value={wins} tone="green" />
          <StatChip icon={Medal} label="Top 3 finishes" value={top3} tone="cyan" />
          <StatChip icon={Coins} label="Total winnings" value={formatMoney(winnings)} tone="pink" />
        </div>

        <div className="space-y-2.5">
          {completedGameWeeks.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center text-muted-foreground">No completed Game Weeks yet.</CardContent>
            </Card>
          ) : (
            completedGameWeeks.map((gw) => (
              <Link key={gw.id} href={`/gameweeks/${gw.id}`}>
                <Card className="transition-all hover:border-primary/40 hover:shadow-md">
                  <CardContent className="flex items-center gap-3 py-3.5">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--fpl-purple)] text-sm font-black text-white">
                      {gw.fplEventId}
                    </span>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      {gw.results.map((r) => (
                        <span key={r.id} className="font-medium">
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
    </div>
  );
}

function medal(rank: number) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
}
