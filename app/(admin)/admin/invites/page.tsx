import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InviteForm } from "./invite-form";
import { revokeInviteAction } from "../members/actions";

export default async function AdminInvitesPage() {
  const invites = await prisma.invite.findMany({ orderBy: { createdAt: "desc" } });
  const appUrl = process.env.AUTH_URL ?? "http://localhost:3000";

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
      <h1 className="text-2xl font-semibold">Invites</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invite a friend</CardTitle>
        </CardHeader>
        <CardContent>
          <InviteForm />
        </CardContent>
      </Card>

      <div className="space-y-2">
        {invites.map((invite) => (
          <Card key={invite.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div>
                <p className="font-medium">
                  {invite.email} <StatusBadge status={invite.status} />
                </p>
                {invite.status === "PENDING" && (
                  <p className="break-all text-sm text-muted-foreground">
                    {appUrl}/invite/{invite.token}
                  </p>
                )}
              </div>
              {invite.status === "PENDING" && (
                <form action={revokeInviteAction.bind(null, invite.id)}>
                  <Button type="submit" variant="outline" size="sm">
                    Revoke
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variant = status === "ACCEPTED" ? "default" : status === "PENDING" ? "secondary" : "outline";
  return (
    <Badge variant={variant} className="ml-1">
      {status}
    </Badge>
  );
}
