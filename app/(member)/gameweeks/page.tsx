import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";
import { Card, CardContent } from "@/components/ui/card";
import { GameWeekStatusBadge } from "@/components/gameweek-status-badge";

export default async function GameWeeksPage() {
  const gameWeeks = await prisma.gameWeek.findMany({
    where: { status: { not: "DRAFT" } },
    orderBy: { fplEventId: "desc" },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 md:p-8">
      <h1 className="text-2xl font-semibold">Game Weeks</h1>
      {gameWeeks.length === 0 ? (
        <p className="text-muted-foreground">No Game Weeks yet.</p>
      ) : (
        <div className="space-y-2">
          {gameWeeks.map((gw) => (
            <Link key={gw.id} href={`/gameweeks/${gw.id}`}>
              <Card className="transition-colors hover:bg-muted/50">
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-medium">Game Week {gw.fplEventId}</p>
                    <p className="text-sm text-muted-foreground">
                      Entry fee {formatMoney(gw.entryFee)}
                      {gw.collectedAmountSnapshot ? ` · Pool ${formatMoney(gw.collectedAmountSnapshot)}` : ""}
                    </p>
                  </div>
                  <GameWeekStatusBadge status={gw.status} />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
