import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentMethodsForm, FplLinkForm, UnlinkFplButton } from "./profile-forms";

export default async function ProfilePage() {
  const sessionUser = await requireUser();
  const [user, fplAccount] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: sessionUser.id } }),
    prisma.fPLAccount.findUnique({ where: { userId: sessionUser.id } }),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-8">
      <h1 className="text-2xl font-semibold">Profile</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>{user.name}</p>
          <p className="text-muted-foreground">{user.email}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">FPL team</CardTitle>
        </CardHeader>
        <CardContent>
          {fplAccount ? (
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <p className="font-medium">{fplAccount.fplTeamName}</p>
                <p className="text-muted-foreground">
                  {fplAccount.fplManagerName} · Entry #{fplAccount.fplEntryId}
                </p>
              </div>
              <UnlinkFplButton />
            </div>
          ) : (
            <FplLinkForm />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment methods</CardTitle>
        </CardHeader>
        <CardContent>
          <PaymentMethodsForm telebirrNumber={user.telebirrNumber} cbeAccountNumber={user.cbeAccountNumber} />
        </CardContent>
      </Card>
    </div>
  );
}
