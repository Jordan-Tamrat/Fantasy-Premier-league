import { prisma } from "@/lib/prisma";
import { FPLService } from "@/lib/fpl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NewGameWeekForm } from "./new-gameweek-form";

export default async function NewGameWeekPage() {
  const [nextEvent, settings] = await Promise.all([
    FPLService.getNextEvent().catch(() => null),
    prisma.leagueSettings.findUnique({ where: { id: "default" } }),
  ]);

  return (
    <div className="mx-auto max-w-lg space-y-6 p-4 md:p-8">
      <h1 className="text-2xl font-semibold">Create Game Week</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <NewGameWeekForm
            suggestedFplEventId={nextEvent?.id ?? null}
            defaultEntryFee={settings ? Number(settings.defaultEntryFee) : 100}
            defaultMinParticipants={settings?.defaultMinParticipants ?? 3}
            defaultOffsetHours={settings?.defaultPaymentDeadlineOffsetHours ?? 2}
          />
        </CardContent>
      </Card>
    </div>
  );
}
