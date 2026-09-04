import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsForm } from "./settings-form";

export default async function AdminSettingsPage() {
  const settings = await prisma.leagueSettings.findUnique({ where: { id: "default" } });

  // Decimal (and other Prisma runtime types) can't cross into a Client
  // Component, so hand the form a plain, already-serialized shape.
  const settingsView = settings
    ? {
        leagueName: settings.leagueName,
        currency: settings.currency,
        defaultEntryFee: settings.defaultEntryFee.toString(),
        defaultPaymentDeadlineOffsetHours: settings.defaultPaymentDeadlineOffsetHours,
        defaultMinParticipants: settings.defaultMinParticipants,
        leagueAccountName: settings.leagueAccountName,
        leagueTelebirrNumber: settings.leagueTelebirrNumber,
        leagueCbeAccountNumber: settings.leagueCbeAccountNumber,
        fplLeagueId: settings.fplLeagueId,
      }
    : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-8">
      <h1 className="text-2xl font-semibold">League Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Defaults for new Game Weeks</CardTitle>
          <p className="text-sm text-muted-foreground">
            The Telebirr / CBE numbers here are the league&apos;s collection account — this is what every member sees
            when they pay their entry fee. (Each person&apos;s own payout details live on their Profile.)
          </p>
        </CardHeader>
        <CardContent>
          <SettingsForm settings={settingsView} />
        </CardContent>
      </Card>
    </div>
  );
}
