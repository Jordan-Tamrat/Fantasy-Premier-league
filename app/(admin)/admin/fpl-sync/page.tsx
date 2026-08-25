import { prisma } from "@/lib/prisma";
import { FPLService } from "@/lib/fpl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/datetime";
import { SyncNowButton } from "./sync-now-button";

export default async function AdminFplSyncPage() {
  const [currentEvent, linkedAccounts, activeGameWeek] = await Promise.all([
    FPLService.getCurrentEvent().catch(() => null),
    prisma.fPLAccount.findMany({ include: { user: true }, orderBy: { linkedAt: "asc" } }),
    prisma.gameWeek.findFirst({
      where: { status: { in: ["LOCKED", "LIVE", "RESULTS_PENDING"] } },
      orderBy: { fplEventId: "desc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
      <h1 className="text-2xl font-semibold">FPL Sync</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">FPL API status</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          {currentEvent ? (
            <p>
              Current FPL Game Week: <strong>{currentEvent.name}</strong> · deadline{" "}
              {formatDateTime(currentEvent.deadline_time)}
            </p>
          ) : (
            <p className="text-destructive">FPL synchronization unavailable right now.</p>
          )}
        </CardContent>
      </Card>

      {activeGameWeek && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sync Game Week {activeGameWeek.fplEventId} scores</CardTitle>
          </CardHeader>
          <CardContent>
            <SyncNowButton gameWeekId={activeGameWeek.id} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Linked FPL accounts ({linkedAccounts.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {linkedAccounts.map((account) => (
            <div key={account.id} className="flex items-center justify-between text-sm">
              <span>
                {account.user.name} — {account.fplTeamName}
              </span>
              <Badge variant="outline">
                {account.lastSyncedAt ? `Synced ${formatDateTime(account.lastSyncedAt)}` : "Never synced"}
              </Badge>
            </div>
          ))}
          {linkedAccounts.length === 0 && <p className="text-sm text-muted-foreground">No members have linked an FPL account yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
