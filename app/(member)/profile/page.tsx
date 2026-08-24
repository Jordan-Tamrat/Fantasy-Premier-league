import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/rank-badge";
import { PaymentMethodsForm, FplLinkForm, UnlinkFplButton } from "./profile-forms";

export default async function ProfilePage() {
  const sessionUser = await requireUser();
  const [user, fplAccount] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: sessionUser.id } }),
    prisma.fPLAccount.findUnique({ where: { userId: sessionUser.id } }),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="bg-fpl-hero relative z-0 flex flex-col items-center gap-3 px-4 pt-8 pb-12 text-center text-white md:rounded-b-3xl md:px-8">
        <span className="flex size-16 items-center justify-center rounded-full bg-[var(--fpl-green)] text-xl font-black text-[var(--fpl-purple)] shadow-[0_0_24px_-4px_var(--fpl-green)]">
          {initials(user.name)}
        </span>
        <div>
          <p className="text-lg font-bold">{user.name}</p>
          <p className="text-sm text-white/60">{user.email}</p>
        </div>
      </div>

      <div className="relative z-10 -mt-6 space-y-4 px-4 pb-8 md:px-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">FPL team</CardTitle>
          </CardHeader>
          <CardContent>
            {fplAccount ? (
              <div className="flex items-center gap-3">
                <Avatar name={fplAccount.fplTeamName ?? "FPL"} />
                <div className="min-w-0 flex-1 text-sm">
                  <p className="truncate font-semibold">{fplAccount.fplTeamName}</p>
                  <p className="truncate text-muted-foreground">
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
    </div>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const chars = parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[parts.length - 1][0];
  return chars.toUpperCase();
}
