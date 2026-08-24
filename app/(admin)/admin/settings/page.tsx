import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsForm } from "./settings-form";

export default async function AdminSettingsPage() {
  const settings = await prisma.leagueSettings.findUnique({ where: { id: "default" } });

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-8">
      <h1 className="text-2xl font-semibold">League Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Defaults for new Game Weeks</CardTitle>
        </CardHeader>
        <CardContent>
          <SettingsForm settings={settings} />
        </CardContent>
      </Card>
    </div>
  );
}
