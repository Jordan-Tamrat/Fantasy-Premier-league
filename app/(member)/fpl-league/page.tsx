import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FPLService } from "@/lib/fpl";
import { Card, CardContent } from "@/components/ui/card";
import { StandingsTable, type StandingRow } from "./standings-table";

// Standings change as matches are played, but FPL rate-limits this endpoint,
// so the render is revalidated on an interval rather than on every request
// (FPLService also caches the response and falls back to the last good one).
export const revalidate = 60;

export default async function FplLeaguePage() {
  await requireUser();

  const settings = await prisma.leagueSettings.findUnique({ where: { id: "default" } });
  const leagueId = settings?.fplLeagueId;

  if (!leagueId) {
    return (
      <Shell>
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No FPL league linked yet. An admin can add the league ID in Settings.
          </CardContent>
        </Card>
      </Shell>
    );
  }

  const [standings, currentEvent, accounts] = await Promise.all([
    FPLService.getClassicLeagueStandings(leagueId).catch(() => null),
    FPLService.getCurrentEvent().catch(() => null),
    prisma.fPLAccount.findMany({ include: { user: { select: { name: true } } } }),
  ]);

  if (!standings) {
    return (
      <Shell>
        <Card className="border-destructive/30">
          <CardContent className="space-y-1.5 py-12 text-center text-sm">
            <p className="font-semibold text-destructive">Standings unavailable right now</p>
            <p className="text-muted-foreground">
              The official FPL game is usually updating between Game Weeks — it goes offline briefly when a new Game
              Week starts. Standings will reappear on their own once FPL is back.
            </p>
          </CardContent>
        </Card>
      </Shell>
    );
  }

  // Flag entries that belong to someone with an account here, so the table can
  // distinguish league members from the wider FPL league.
  const memberByEntryId = new Map(accounts.map((a) => [a.fplEntryId, a.user.name]));

  const rows: StandingRow[] = standings.standings.results.map((r) => ({
    entry: r.entry,
    entryName: r.entry_name,
    playerName: r.player_name,
    rank: r.rank,
    lastRank: r.last_rank,
    eventTotal: r.event_total,
    total: r.total,
    memberName: memberByEntryId.get(r.entry) ?? null,
  }));

  const linkedCount = rows.filter((r) => r.memberName).length;

  return (
    <Shell name={standings.league.name} subtitle={`${rows.length} teams · ${linkedCount} in this app`}>
      <StandingsTable rows={rows} currentEvent={currentEvent?.id ?? null} />
    </Shell>
  );
}

function Shell({
  name = "FPL League",
  subtitle,
  children,
}: {
  name?: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{name}</h1>
        <p className="text-sm text-muted-foreground">
          {subtitle ?? "Live standings from the official Fantasy Premier League"}
        </p>
      </div>
      {children}
    </div>
  );
}
