import { prisma } from "@/lib/prisma";
import { decimal, formatMoney, sumDecimal } from "@/lib/money";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, avatarUrl } from "@/components/rank-badge";

// The historical, all-time cross-member ranking — distinct from a single
// Game Week's leaderboard (shown on that Game Week's own page). This one
// answers "who's actually winning the league", not "who won this week".
export default async function LeaderboardPage() {
  // A cancelled Game Week is refunded, so it counts for nobody — filter it out
  // of both the entry-fee and prize aggregations everywhere below.
  const notCancelled = { status: { not: "CANCELLED" as const } };
  const [users, participantAgg, winCounts, top3Counts, prizeAgg] = await Promise.all([
    prisma.user.findMany({ where: { status: "ACTIVE" }, select: { id: true, name: true, profileImagePath: true } }),
    prisma.gameWeekParticipant.groupBy({
      by: ["userId"],
      where: { gameWeek: notCancelled },
      _count: { _all: true },
      _sum: { entryFeePaidSnapshot: true },
    }),
    prisma.gameWeekResult.groupBy({ by: ["userId"], where: { rank: 1, gameWeek: notCancelled }, _count: { _all: true } }),
    prisma.gameWeekResult.groupBy({
      by: ["userId"],
      where: { rank: { lte: 3 }, gameWeek: notCancelled },
      _count: { _all: true },
    }),
    prisma.gameWeekResult.groupBy({ by: ["userId"], where: { gameWeek: notCancelled }, _sum: { prizeAwarded: true } }),
  ]);

  const participantById = new Map(participantAgg.map((p) => [p.userId, p]));
  const winsById = new Map(winCounts.map((w) => [w.userId, w._count._all]));
  const top3ById = new Map(top3Counts.map((t) => [t.userId, t._count._all]));
  const prizeById = new Map(prizeAgg.map((p) => [p.userId, p._sum.prizeAwarded ?? decimal(0)]));

  const rows = users
    .map((user) => {
      const participation = participantById.get(user.id);
      const participated = participation?._count._all ?? 0;
      const entryFeesPaid = participation?._sum.entryFeePaidSnapshot ?? decimal(0);
      const winnings = prizeById.get(user.id) ?? decimal(0);
      return {
        user,
        participated,
        wins: winsById.get(user.id) ?? 0,
        top3: top3ById.get(user.id) ?? 0,
        entryFeesPaid,
        winnings,
        net: decimal(winnings).minus(entryFeesPaid),
      };
    })
    .filter((row) => row.participated > 0)
    .sort((a, b) => (b.net.greaterThan(a.net) ? 1 : b.net.lessThan(a.net) ? -1 : b.wins - a.wins));

  const leagueTotalWinnings = sumDecimal(rows.map((r) => r.winnings));

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">All-Time Leaderboard</h1>
        <p className="text-sm text-muted-foreground">
          Ranked by net winnings across every Game Week — {formatMoney(leagueTotalWinnings)} paid out so far.
        </p>
      </div>

      {rows.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            No Game Weeks have finished yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {rows.map((row, index) => {
            const rank = index + 1;
            const isPositive = row.net.greaterThanOrEqualTo(0);
            return (
              <Card key={row.user.id}>
                <CardContent className="flex items-center gap-3 py-3.5">
                  <span
                    className={
                      "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-black " +
                      (rank === 1
                        ? "bg-[var(--gold)] text-white"
                        : rank === 2
                          ? "bg-[var(--silver)] text-white"
                          : rank === 3
                            ? "bg-[var(--bronze)] text-white"
                            : "bg-muted text-muted-foreground")
                    }
                  >
                    {rank}
                  </span>
                  <Avatar name={row.user.name} imageUrl={avatarUrl(row.user)} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{row.user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.participated} played · {row.wins} won · {row.top3} top 3
                    </p>
                  </div>
                  <span className={"font-bold " + (isPositive ? "text-[var(--fpl-green)]" : "text-[var(--fpl-pink)]")}>
                    {isPositive ? "+" : ""}
                    {formatMoney(row.net)}
                  </span>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
