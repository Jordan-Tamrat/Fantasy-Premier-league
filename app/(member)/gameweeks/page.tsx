import Link from "next/link";
import { ChevronRight } from "lucide-react";
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
      <h1 className="text-2xl font-bold tracking-tight">Game Weeks</h1>
      {gameWeeks.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">No Game Weeks yet.</CardContent>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {gameWeeks.map((gw) => (
            <Link key={gw.id} href={`/gameweeks/${gw.id}`}>
              <Card className="group transition-all hover:border-primary/40 hover:shadow-md">
                <CardContent className="flex items-center gap-3 py-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--fpl-purple)] text-sm font-black text-white">
                    {gw.fplEventId}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">Game Week {gw.fplEventId}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      Entry fee {formatMoney(gw.entryFee)}
                      {gw.collectedAmountSnapshot ? ` · Pool ${formatMoney(gw.collectedAmountSnapshot)}` : ""}
                    </p>
                  </div>
                  <GameWeekStatusBadge status={gw.status} />
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
